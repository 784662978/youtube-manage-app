"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { APP_VERSION } from "@/lib/version";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface VersionInfo {
  version: string;
  buildTime: string;
}

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISMISS_KEY = "version-update-dismissed";

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export function VersionCheckProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentVersionRef = useRef(APP_VERSION);

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch("/version.json", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;

      const data: VersionInfo = await res.json();
      const comparison = compareVersions(data.version, currentVersionRef.current);

      if (comparison > 0) {
        // Check if user dismissed this version already
        const dismissed = localStorage.getItem(DISMISS_KEY);
        if (dismissed === data.version) return;

        setLatestVersion(data.version);
        setUpdateAvailable(true);
      }
    } catch {
      // Silently fail — version check should not break the app
    }
  }, []);

  useEffect(() => {
    // Delay first check to avoid blocking initial load
    const initialTimer = setTimeout(() => {
      checkForUpdate();
    }, 10 * 1000); // 10 seconds after load

    timerRef.current = setInterval(checkForUpdate, CHECK_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checkForUpdate]);

  const handleUpdate = () => {
    localStorage.removeItem(DISMISS_KEY);
    window.location.reload();
  };

  const handleDismiss = () => {
    if (latestVersion) {
      localStorage.setItem(DISMISS_KEY, latestVersion);
    }
    setUpdateAvailable(false);
  };

  return (
    <>
      {children}
      <Dialog open={updateAvailable} onOpenChange={(open) => !open && handleDismiss()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" />
              发现新版本
            </DialogTitle>
            <DialogDescription>
              检测到新版本 <span className="font-semibold text-foreground">v{latestVersion}</span>
              ，当前版本为 <span className="text-muted-foreground">v{APP_VERSION}</span>。
              建议刷新页面以获取最新功能和修复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleDismiss}>
              稍后提醒
            </Button>
            <Button onClick={handleUpdate}>
              立即更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
