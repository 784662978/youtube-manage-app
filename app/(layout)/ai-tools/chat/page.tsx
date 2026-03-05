'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport, UIMessage } from 'ai'
import { Send, Loader2, Bot, User, Trash2, Plus, MessageSquare, Menu, X, Sparkles } from 'lucide-react'
import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useChatSessions, formatTime, Message } from '@/hooks/useChatSessions'

// 可用的 AI 模型配置
const AI_MODELS = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: '深度求索 · 高性价比',
    apiEndpoint: '/api/ai/deepseek/chat',
    icon: '🔮',
  },
  {
    id: 'doubao',
    name: '豆包',
    description: '字节跳动 · 流畅对话',
    apiEndpoint: '/api/ai/doubao/chat',
    icon: '🫛',
  },
] as const

type ModelId = typeof AI_MODELS[number]['id']

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelId>('deepseek')
  
  const {
    sessions,
    currentSession,
    currentSessionId,
    isPending,
    isLoaded,
    createPendingSession,
    savePendingSession,
    deleteSession,
    switchSession,
    updateMessages,
    clearCurrentSession,
  } = useChatSessions()

  // 根据选择的模型动态获取 API 端点
  const currentModelConfig = useMemo(() => {
    return AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]
  }, [selectedModel])

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    transport: new TextStreamChatTransport({
      api: currentModelConfig.apiEndpoint,
    }),
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 页面加载后，同步第一条历史记录的消息到 useChat
  const loadInitialMessages = useCallback(() => {
    if (!isLoaded || initialLoadDone) return
    
    if (currentSession && currentSession.messages.length > 0) {
      const uiMessages: UIMessage[] = currentSession.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text', text: msg.content }],
        createdAt: new Date(msg.createdAt),
      }))
      setMessages(uiMessages)
    }
    setInitialLoadDone(true)
  }, [isLoaded, currentSession, initialLoadDone, setMessages])
  
  // 在渲染后加载初始消息
  if (isLoaded && !initialLoadDone) {
    // 使用 queueMicrotask 在当前渲染完成后执行
    queueMicrotask(loadInitialMessages)
  }

  // 同步当前会话消息到持久化存储
  // 使用 ref 防止无限循环
  const lastSyncedMessagesRef = useRef<string>('')
  
  useEffect(() => {
    if (messages.length === 0) {
      lastSyncedMessagesRef.current = ''
      return
    }
    
    const formattedMessages: Message[] = messages.map(msg => {
      const textPart = msg.parts?.find(part => part.type === 'text')
      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: textPart && 'text' in textPart ? textPart.text : '',
        createdAt: Date.now(),
      }
    })
    
    // 生成消息指纹，只有内容真正变化时才同步
    const messagesFingerprint = formattedMessages.map(m => `${m.id}:${m.content}`).join('|')
    if (messagesFingerprint === lastSyncedMessagesRef.current) {
      return
    }
    lastSyncedMessagesRef.current = messagesFingerprint
    
    // 如果是临时会话且有消息，保存到历史列表
    if (isPending && formattedMessages.length > 0) {
      savePendingSession(formattedMessages)
    } else if (currentSessionId) {
      updateMessages(formattedMessages)
    }
  }, [messages, currentSessionId, isPending, savePendingSession, updateMessages])

  // 切换会话时加载消息
  const handleSwitchSession = useCallback((sessionId: string) => {
    if (sessionId === currentSessionId && !isPending) return
    
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      // 转换为 useChat 的消息格式
      const uiMessages: UIMessage[] = session.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text', text: msg.content }],
        createdAt: new Date(msg.createdAt),
      }))
      setMessages(uiMessages)
      switchSession(sessionId)
    }
    
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [sessions, currentSessionId, isPending, switchSession, setMessages, isMobile])

  // 创建新会话（临时，不保存）
  const handleCreateSession = useCallback(() => {
    // 如果当前已经在临时新对话状态且没有消息，不创建新会话
    if (isPending && messages.length === 0) {
      if (isMobile) {
        setSidebarOpen(false)
      }
      return
    }
    
    // 如果当前会话有内容，创建新的临时会话
    if (messages.length > 0) {
      createPendingSession()
      setMessages([])
    } else {
      // 当前无消息，直接创建临时会话
      createPendingSession()
      setMessages([])
    }
    
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isPending, messages.length, createPendingSession, setMessages, isMobile])

  // 删除会话
  const handleDeleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (sessionId === currentSessionId) {
      setMessages([])
    }
    deleteSession(sessionId)
  }, [currentSessionId, deleteSession, setMessages])

  const isLoading = status === 'streaming' || status === 'submitted'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // 如果没有当前会话（临时或持久），先创建临时会话
    if (!currentSessionId && !isPending) {
      createPendingSession()
    }

    const messageContent = input.trim()
    setInput('')
    
    await sendMessage({
      text: messageContent,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  const clearChat = () => {
    setMessages([])
    clearCurrentSession()
  }

  // 获取消息文本内容
  const getMessageContent = (message: typeof messages[0]) => {
    const textPart = message.parts?.find(part => part.type === 'text')
    return textPart && 'text' in textPart ? textPart.text : ''
  }

  // 加载中状态
  if (!isLoaded || !initialLoadDone) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem-2rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] -mx-4 -mb-4">
      {/* 移动端遮罩 */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧边栏 - 会话列表 */}
      <aside className={cn(
        "flex flex-col bg-muted/30 border-r shrink-0 z-50",
        "transition-all duration-300 ease-in-out",
        isMobile 
          ? cn(
              "fixed left-0 top-0 bottom-0 w-72",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )
          : sidebarOpen 
            ? "w-72" 
            : "w-0 overflow-hidden"
      )}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">历史对话</h2>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* 新建对话按钮 */}
        <div className="p-3">
          <Button 
            onClick={handleCreateSession}
            className="w-full gap-2"
            variant="outline"
          >
            <Plus className="w-4 h-4" />
            新建对话
          </Button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>暂无历史对话</p>
            </div>
          ) : (
            sessions.map(session => (
              <div
                key={session.id}
                onClick={() => handleSwitchSession(session.id)}
                className={cn(
                  "group flex items-start gap-3 p-3 rounded-lg cursor-pointer",
                  "hover:bg-muted/80 transition-colors",
                  session.id === currentSessionId && !isPending && "bg-muted"
                )}
              >
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(session.updatedAt)}
                    <span className="ml-2">· {session.messages.length} 条消息</span>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteSession(session.id, e)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* 头部 */}
        <div className="flex items-center justify-between py-4 px-4 border-b">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-semibold">
                {currentSession?.title || 'AI 助手'}
              </h1>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">清空对话</span>
            </Button>
          )}
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">开始对话</p>
              <p className="text-sm">在下方输入消息与 AI 助手交流</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3 p-4 rounded-lg',
                  message.role === 'user'
                    ? 'bg-primary/5 ml-4 md:ml-8'
                    : 'bg-muted/50 mr-4 md:mr-8'
                )}
              >
                <div
                  className={cn(
                    'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1">
                    {message.role === 'user' ? '你' : 'AI 助手'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap wrap-break-word">
                    {getMessageContent(message)}
                  </div>
                </div>
              </div>
            ))
          )}
          {error && (
            <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-lg">
              发生错误: {error.message}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="border-t p-4">
          {/* 模型选择器 */}
          <div className="flex items-center gap-2 mb-3 max-w-4xl mx-auto">
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value as ModelId)}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="选择模型" />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <span className="flex items-center gap-2">
                      <span>{model.icon}</span>
                      <span>{model.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {model.description}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Shift+Enter 换行)"
              className="min-h-11 max-h-32 resize-none"
              disabled={isLoading}
              rows={1}
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 h-11"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            按 Enter 发送消息，Shift+Enter 换行
          </p>
        </div>
      </main>
    </div>
  )
}
