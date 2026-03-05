import { useState, useEffect, useCallback } from 'react'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'chat-sessions'

// 生成唯一 ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 从消息内容生成标题
function generateTitle(content: string): string {
  const cleaned = content.trim().slice(0, 50)
  return cleaned.length < content.trim().length ? `${cleaned}...` : cleaned
}

// 格式化时间显示
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }
}

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false) // 是否是临时新对话
  const [pendingSession, setPendingSession] = useState<ChatSession | null>(null) // 临时会话
  const [isLoaded, setIsLoaded] = useState(false)

  // 从 localStorage 加载会话
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSession[]
        // 过滤掉空消息的会话
        const validSessions = parsed.filter(s => s.messages.length > 0)
        // 按更新时间降序排序
        validSessions.sort((a, b) => b.updatedAt - a.updatedAt)
        setSessions(validSessions)
        // 如果有会话，选中最近的一个
        if (validSessions.length > 0) {
          setCurrentSessionId(validSessions[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
    setIsLoaded(true)
  }, [])

  // 保存到 localStorage
  const saveSessions = useCallback((newSessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions))
    } catch (error) {
      console.error('Failed to save sessions:', error)
    }
  }, [])

  // 获取当前会话（包括临时会话）
  const currentSession = isPending 
    ? pendingSession 
    : sessions.find(s => s.id === currentSessionId) || null

  // 创建临时新会话（不保存到 localStorage）
  const createPendingSession = useCallback(() => {
    const newSession: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    
    setPendingSession(newSession)
    setIsPending(true)
    setCurrentSessionId(null)
    
    return newSession.id
  }, [])

  // 将临时会话保存到历史列表
  const savePendingSession = useCallback((messages: Message[]) => {
    if (!pendingSession) return null
    
    const title = messages.length > 0 
      ? generateTitle(messages[0].content) 
      : '新对话'
    
    const savedSession: ChatSession = {
      ...pendingSession,
      title,
      messages,
      updatedAt: Date.now(),
    }
    
    const newSessions = [savedSession, ...sessions]
    setSessions(newSessions)
    saveSessions(newSessions)
    setCurrentSessionId(savedSession.id)
    setIsPending(false)
    setPendingSession(null)
    
    return savedSession.id
  }, [pendingSession, sessions, saveSessions])

  // 更新临时会话的消息
  const updatePendingMessages = useCallback((messages: Message[]) => {
    if (!pendingSession) return
    
    setPendingSession(prev => prev ? {
      ...prev,
      messages,
      updatedAt: Date.now(),
    } : null)
  }, [pendingSession])

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    const newSessions = sessions.filter(s => s.id !== sessionId)
    setSessions(newSessions)
    saveSessions(newSessions)
    
    // 如果删除的是当前会话，切换到另一个
    if (sessionId === currentSessionId) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id)
      } else {
        setCurrentSessionId(null)
      }
    }
  }, [sessions, currentSessionId, saveSessions])

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
    setIsPending(false)
    setPendingSession(null)
  }, [])

  // 更新当前会话的消息
  const updateMessages = useCallback((messages: Message[]) => {
    // 如果是临时会话，更新临时会话
    if (isPending) {
      updatePendingMessages(messages)
      return
    }
    
    if (!currentSessionId) return
    
    setSessions(prev => {
      const newSessions = prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages,
            updatedAt: Date.now(),
          }
        }
        return session
      })
      
      // 重新排序（按更新时间）
      newSessions.sort((a, b) => b.updatedAt - a.updatedAt)
      saveSessions(newSessions)
      return newSessions
    })
  }, [currentSessionId, isPending, updatePendingMessages, saveSessions])

  // 清空当前会话消息
  const clearCurrentSession = useCallback(() => {
    if (isPending) {
      // 如果是临时会话，直接清空
      setPendingSession(prev => prev ? {
        ...prev,
        messages: [],
        title: '新对话',
        updatedAt: Date.now(),
      } : null)
      return
    }
    
    if (!currentSessionId) return
    
    setSessions(prev => {
      const newSessions = prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [],
            title: '新对话',
            updatedAt: Date.now(),
          }
        }
        return session
      })
      saveSessions(newSessions)
      return newSessions
    })
  }, [currentSessionId, isPending, saveSessions])

  return {
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
  }
}
