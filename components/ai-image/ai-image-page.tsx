"use client"

import * as React from "react"
import { ImageIcon, Sparkles } from "lucide-react"
import { useAiImage } from "./ai-image-provider"
import { ConversationList } from "./conversation-list"
import { ChatMessageItem } from "./chat-message"
import { ModelSelector } from "./model-selector"
import { PromptInput } from "./prompt-input"
import { ImagePreview } from "./image-preview"
import { ApiConfigDialog } from "./api-config-dialog"

export function AiImagePage() {
  const { state, createConversation, sendMessage, setModel } = useAiImage()
  const [previewImage, setPreviewImage] = React.useState<string | null>(null)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  // 消息列表自动滚动到底部
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [state.messages])

  const handleImageClick = React.useCallback((base64: string) => {
    setPreviewImage(base64)
  }, [])

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 左侧：会话列表 */}
      <div className="w-[280px] shrink-0">
        <ConversationList />
      </div>

      {/* 右侧：聊天区域 */}
      <div className="flex flex-1 flex-col min-w-0">
        {state.currentConversationId ? (
          <>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between border-b px-4 py-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">AI 图片生成</span>
              </div>
              <div className="flex items-center gap-2">
                <ModelSelector value={state.selectedModel} onChange={setModel} />
                <ApiConfigDialog />
              </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {state.messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">开始创作</h3>
                  <p className="text-sm text-center max-w-md">
                    输入文字描述，AI 将为你生成对应的图片。
                    <br />
                    支持切换不同的 Seedream 模型来获得不同风格的效果。
                  </p>
                </div>
              ) : (
                state.messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    onImageClick={handleImageClick}
                  />
                ))
              )}
              {state.isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ImageIcon className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="rounded-lg bg-muted px-4 py-2 text-sm">
                    正在生成图片...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <PromptInput />
          </>
        ) : (
          /* 未选择会话 */
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
            <ImageIcon className="h-16 w-16 opacity-20" />
            <h2 className="text-xl font-medium">AI 图片生成</h2>
            <p className="text-sm">选择一个会话或创建新会话开始使用</p>
            <button
              onClick={createConversation}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              新建会话
            </button>
          </div>
        )}
      </div>

      {/* 图片预览弹窗 */}
      <ImagePreview
        base64={previewImage}
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  )
}
