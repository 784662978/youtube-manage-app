"use client"

import * as React from "react"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAiImage } from "./ai-image-provider"

export function PromptInput() {
  const { state, sendMessage } = useAiImage()
  const [prompt, setPrompt] = React.useState("")
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = React.useCallback(() => {
    const trimmed = prompt.trim()
    if (!trimmed || state.isLoading) return
    sendMessage(trimmed)
    setPrompt("")
    // 重置 textarea 高度
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [prompt, state.isLoading, sendMessage])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleInput = React.useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
    // 自动调整高度
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px"
  }, [])

  return (
    <div className="border-t p-4">
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="描述你想要生成的图片..."
          className="min-h-[40px] max-h-[160px] resize-none flex-1"
          rows={1}
          disabled={state.isLoading}
        />
        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || state.isLoading}
          size="icon"
          className="shrink-0 h-[40px] w-[40px]"
        >
          {state.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        按 Enter 发送，Shift + Enter 换行
      </p>
    </div>
  )
}
