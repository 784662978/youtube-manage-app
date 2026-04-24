"use client"

import * as React from "react"
import { Trash2, MessageSquarePlus, MessageSquare, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
// 使用原生 div 替代 ScrollArea
import { useAiImage } from "./ai-image-provider"

export function ConversationList() {
  const { state, createConversation, deleteConversation, selectConversation } = useAiImage()
  const [hoveredId, setHoveredId] = React.useState<string | null>(null)

  const handleDelete = React.useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      deleteConversation(id)
    },
    [deleteConversation]
  )

  return (
    <div className="flex h-full flex-col border-r bg-muted/30">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b p-3">
        <h2 className="text-sm font-semibold">会话列表</h2>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={createConversation} title="新建会话">
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {state.conversations.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p>暂无会话</p>
              <p className="text-xs mt-1">点击上方按钮新建会话</p>
            </div>
          ) : (
            state.conversations.map((conv) => (
              <div
                key={conv.id}
                className={`
                  group flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer
                  transition-colors
                  ${state.currentConversationId === conv.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}
                `}
                onClick={() => selectConversation(conv.id)}
                onMouseEnter={() => setHoveredId(conv.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
                <div className="flex-1 truncate">
                  <div className="truncate">{conv.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {conv.messageCount} 条消息
                  </div>
                </div>
                {(hoveredId === conv.id || state.currentConversationId === conv.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100"
                    onClick={(e) => handleDelete(e, conv.id)}
                    title="删除会话"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 底部 API 配置提示 */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-3.5 w-3.5" />
          <span className="truncate">
            {state.apiConfig.apiKey ? "API 已配置" : "请配置 API Key"}
          </span>
        </div>
      </div>
    </div>
  )
}
