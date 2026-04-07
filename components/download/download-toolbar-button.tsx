"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { useDownloadManagerContext } from "./download-context"

export function DownloadToolbarButton() {
  const ctx = useDownloadManagerContext()

  // 不在混剪任务页面时，不显示按钮
  if (!ctx) return null

  const { tasks, activeCount, openPanel } = ctx
  const totalCount = tasks.length
  const hasActive = activeCount > 0

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={openPanel}
      title="下载管理"
    >
      <Download className="h-[1.2rem] w-[1.2rem]" />
      {totalCount > 0 && (
        <Badge
          variant={hasActive ? "default" : "secondary"}
          className="absolute -top-1 -right-1 size-4 justify-center p-0 text-[10px]"
        >
          {totalCount}
        </Badge>
      )}
      <span className="sr-only">下载管理</span>
    </Button>
  )
}
