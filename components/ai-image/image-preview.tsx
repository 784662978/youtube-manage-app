"use client"

import * as React from "react"
import { X, Download, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImagePreviewProps {
  base64: string | null
  open: boolean
  onClose: () => void
}

export function ImagePreview({ base64, open, onClose }: ImagePreviewProps) {
  const [zoom, setZoom] = React.useState(1)

  React.useEffect(() => {
    if (open) {
      setZoom(1)
    }
  }, [open])

  const handleDownload = React.useCallback(() => {
    if (!base64) return
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${base64}`
    link.download = `seedream-${Date.now()}.png`
    link.click()
  }, [base64])

  const handleZoomIn = React.useCallback(() => {
    setZoom((z) => Math.min(z + 0.25, 3))
  }, [])

  const handleZoomOut = React.useCallback(() => {
    setZoom((z) => Math.max(z - 0.25, 0.5))
  }, [])

  if (!open || !base64) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      {/* 工具栏 */}
      <div
        className="absolute top-4 right-4 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="secondary" size="icon" onClick={handleZoomOut} title="缩小">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-white text-sm min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="secondary" size="icon" onClick={handleZoomIn} title="放大">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={handleDownload} title="下载">
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={onClose} title="关闭">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* 图片 */}
      <img
        src={`data:image/png;base64,${base64}`}
        alt="预览"
        className="max-h-[90vh] max-w-[90vw] object-contain transition-transform"
        style={{ transform: `scale(${zoom})` }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
