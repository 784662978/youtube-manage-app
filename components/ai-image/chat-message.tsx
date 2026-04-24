"use client"

import * as React from "react"
import { Download, User, Bot, AlertCircle, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { ChatMessage } from "@/lib/types/ai-image"
import { SEEDREAM_MODELS } from "@/lib/types/ai-image"

interface ChatMessageProps {
  message: ChatMessage
  onImageClick?: (base64: string) => void
}

export function ChatMessageItem({ message, onImageClick }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isError = !!message.error
  const modelName = message.generateParams
    ? SEEDREAM_MODELS.find((m) => m.id === message.generateParams?.model)?.name
    : null

  const handleDownload = React.useCallback((base64: string, index: number) => {
    const link = document.createElement("a")
    link.href = `data:image/png;base64,${base64}`
    link.download = `seedream-${Date.now()}-${index}.png`
    link.click()
  }, [])

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* 头像 */}
      <div
        className={`
          flex h-8 w-8 shrink-0 items-center justify-center rounded-full
          ${isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
        `}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* 消息内容 */}
      <div className={`flex-1 space-y-2 max-w-[80%] ${isUser ? "text-right" : ""}`}>
        {/* 文字内容 */}
        <div
          className={`
            inline-block rounded-lg px-4 py-2 text-sm
            ${isUser ? "bg-primary text-primary-foreground" : isError ? "bg-destructive/10 text-destructive" : "bg-muted"}
          `}
        >
          {isError ? (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{message.error}</span>
            </div>
          ) : (
            <span>{message.content}</span>
          )}
        </div>

        {/* 图片区域 */}
        {message.images && message.images.length > 0 && (
          <div className="space-y-2">
            {message.images.map((img, index) => (
              <Card key={index} className="overflow-hidden inline-block">
                <div className="relative group">
                  <img
                    src={`data:${img.mimeType};base64,${img.base64}`}
                    alt={`生成图片 ${index + 1}`}
                    className="max-w-full cursor-pointer rounded-md"
                    style={{ maxHeight: "400px" }}
                    onClick={() => onImageClick?.(img.base64)}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(img.base64, index)}
                      title="下载图片"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 生成参数标签 */}
        {modelName && (
          <div className={`flex gap-1 ${isUser ? "justify-end" : ""}`}>
            <Badge variant="outline" className="text-xs">
              <ImageIcon className="h-3 w-3 mr-1" />
              {modelName}
            </Badge>
            {message.generateParams?.size && (
              <Badge variant="outline" className="text-xs">
                {message.generateParams.size}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
