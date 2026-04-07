"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Download, Trash2, Inbox } from "lucide-react"
import { DownloadItemCard } from "./download-item-card"
import type { DownloadTask } from "@/lib/download-utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface DownloadManagerPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tasks: DownloadTask[]
  activeCount: number
  completedCount: number
  onCancel: (id: string) => void
  onRemove: (id: string) => void
  onRetry: (id: string) => void
  onSave: (id: string) => void
  onClearCompleted: () => void
}

export function DownloadManagerPanel({
  open,
  onOpenChange,
  tasks,
  activeCount,
  completedCount,
  onCancel,
  onRemove,
  onRetry,
  onSave,
  onClearCompleted,
}: DownloadManagerPanelProps) {
  const isMobile = useIsMobile()

  const hasCompleted =
    tasks.some((t) => t.status === "completed" || t.status === "cancelled")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "h-[85vh] rounded-t-xl sm:max-w-none" : "sm:max-w-md"}
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Download className="size-5" />
            下载管理
          </SheetTitle>
          <SheetDescription>
            {tasks.length === 0
              ? "暂无下载任务"
              : `共 ${tasks.length} 个任务，${activeCount} 个下载中`}
          </SheetDescription>
        </SheetHeader>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 -mt-2">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Inbox className="size-10 mb-3 opacity-30" />
              <p className="text-sm">暂无下载任务</p>
            </div>
          ) : (
            tasks.map((task) => (
              <DownloadItemCard
                key={task.id}
                task={task}
                onCancel={onCancel}
                onRemove={onRemove}
                onRetry={onRetry}
                onSave={onSave}
              />
            ))
          )}
        </div>

        {/* 底部操作栏 */}
        {hasCompleted && (
          <div className="border-t px-4 py-3 mt-auto">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={onClearCompleted}
            >
              <Trash2 className="size-4 mr-2" />
              清除已完成
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
