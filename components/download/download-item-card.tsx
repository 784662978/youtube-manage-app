"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Download,
  X,
  FileVideo,
} from "lucide-react"
import type { DownloadTask } from "@/lib/download-utils"
import { formatFileSize, formatSpeed, formatEta } from "@/lib/download-utils"

interface DownloadItemCardProps {
  task: DownloadTask
  onCancel: (id: string) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  onSave: (id: string) => void
}

export function DownloadItemCard({
  task,
  onCancel,
  onRemove,
  onRetry,
  onSave,
}: DownloadItemCardProps) {
  const progressPercent =
    task.total > 0 ? Math.min(Math.round((task.loaded / task.total) * 100), 100) : 0

  const speedText = task.speed > 0 ? formatSpeed(task.speed) : ""
  const etaText = formatEta(task.eta)
  const detailText = [speedText, etaText].filter(Boolean).join(" · ")

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* 文件名 + 操作 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileVideo className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate" title={task.fileName}>
            {task.fileName}
          </span>
        </div>
        {(task.status === "pending" || task.status === "cancelled") && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(task.id)}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>

      {/* 根据状态渲染不同内容 */}
      {task.status === "downloading" && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progressPercent}%</span>
            <span>
              {formatFileSize(task.loaded)}
              {task.total > 0 ? ` / ${formatFileSize(task.total)}` : ""}
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          {detailText && (
            <div className="text-xs text-muted-foreground">{detailText}</div>
          )}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onCancel(task.id)}
            >
              <XCircle className="size-3 mr-1" />
              取消
            </Button>
          </div>
        </div>
      )}

      {task.status === "pending" && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          <span>排队中...</span>
        </div>
      )}

      {task.status === "completed" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <CheckCircle2 className="size-3" />
            <span>下载完成 · {formatFileSize(task.loaded)}</span>
          </div>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              onClick={() => onSave(task.id)}
            >
              <Download className="size-3 mr-1" />
              保存
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(task.id)}
            >
              <X className="size-3 mr-1" />
              移除
            </Button>
          </div>
        </div>
      )}

      {task.status === "failed" && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3" />
            <span className="truncate">{task.error || "下载失败"}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {task.retryCount < task.maxRetries
              ? `将自动重试 (${task.retryCount}/${task.maxRetries})`
              : `已达最大重试次数 (${task.maxRetries})`}
          </div>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              onClick={() => onRetry(task.id)}
            >
              <RotateCcw className="size-3 mr-1" />
              重试
            </Button>
            <Button
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(task.id)}
            >
              <X className="size-3 mr-1" />
              移除
            </Button>
          </div>
        </div>
      )}

      {task.status === "cancelled" && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <XCircle className="size-3" />
          <span>已取消</span>
        </div>
      )}
    </div>
  )
}
