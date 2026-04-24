"use client"

import * as React from "react"
import {
  type AiImageState,
  type AiImageAction,
  type Conversation,
  type ChatMessage,
  type SeedreamModel,
  type ImageData,
  DEFAULT_MODEL,
  DEFAULT_API_CONFIG,
} from "@/lib/types/ai-image"
import {
  dbGetAllConversations,
  dbSaveConversation,
  dbDeleteConversation,
  dbGetMessages,
  dbSaveMessage,
} from "@/lib/ai-image-db"
import { generateImage, getStoredApiConfig, saveApiConfig } from "@/lib/seedream-api"

// ============ 工具函数 ============

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function generateTitle(prompt: string): string {
  const maxLength = 20
  return prompt.length > maxLength ? prompt.slice(0, maxLength) + "..." : prompt
}

// ============ Reducer ============

const initialState: AiImageState = {
  conversations: [],
  currentConversationId: null,
  messages: [],
  selectedModel: DEFAULT_MODEL,
  isLoading: false,
  apiConfig: DEFAULT_API_CONFIG,
  isDbReady: false,
}

function aiImageReducer(state: AiImageState, action: AiImageAction): AiImageState {
  switch (action.type) {
    case "SET_DB_READY":
      return { ...state, isDbReady: action.payload }
    case "SET_CONVERSATIONS":
      return { ...state, conversations: action.payload }
    case "SET_CURRENT_CONVERSATION":
      return {
        ...state,
        currentConversationId: action.payload.id,
        messages: action.payload.messages,
      }
    case "ADD_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        currentConversationId: action.payload.id,
        messages: [],
      }
    case "DELETE_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.filter((c) => c.id !== action.payload),
        currentConversationId:
          state.currentConversationId === action.payload
            ? null
            : state.currentConversationId,
        messages:
          state.currentConversationId === action.payload ? [] : state.messages,
      }
    case "SET_MESSAGES":
      return { ...state, messages: action.payload }
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] }
    case "SET_MODEL":
      return { ...state, selectedModel: action.payload }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_API_CONFIG":
      return { ...state, apiConfig: { ...state.apiConfig, ...action.payload } }
    default:
      return state
  }
}

// ============ Context ============

interface AiImageContextValue {
  state: AiImageState
  createConversation: () => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  selectConversation: (id: string) => Promise<void>
  sendMessage: (prompt: string) => Promise<void>
  setModel: (model: SeedreamModel) => void
  updateApiConfig: (config: Partial<typeof DEFAULT_API_CONFIG>) => void
}

const AiImageContext = React.createContext<AiImageContextValue | undefined>(undefined)

// ============ Provider ============

export function AiImageProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(aiImageReducer, initialState)

  // 初始化：从 IndexedDB 加载数据
  React.useEffect(() => {
    async function init() {
      try {
        const conversations = await dbGetAllConversations()
        dispatch({ type: "SET_CONVERSATIONS", payload: conversations })

        const storedConfig = getStoredApiConfig()
        dispatch({ type: "SET_API_CONFIG", payload: storedConfig })

        dispatch({ type: "SET_DB_READY", payload: true })
      } catch (error) {
        console.error("Failed to initialize AI image DB:", error)
        dispatch({ type: "SET_DB_READY", payload: true })
      }
    }
    init()
  }, [])

  // 新建会话
  const createConversation = React.useCallback(async () => {
    const conversation: Conversation = {
      id: generateId(),
      title: "新会话",
      model: state.selectedModel,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
    }
    await dbSaveConversation(conversation)
    dispatch({ type: "ADD_CONVERSATION", payload: conversation })
  }, [state.selectedModel])

  // 删除会话
  const deleteConversation = React.useCallback(async (id: string) => {
    await dbDeleteConversation(id)
    dispatch({ type: "DELETE_CONVERSATION", payload: id })
  }, [])

  // 切换会话
  const selectConversation = React.useCallback(async (id: string) => {
    try {
      const messages = await dbGetMessages(id)
      const conversation = state.conversations.find((c) => c.id === id)
      if (conversation) {
        dispatch({ type: "SET_MODEL", payload: conversation.model })
      }
      dispatch({ type: "SET_CURRENT_CONVERSATION", payload: { id, messages } })
    } catch (error) {
      console.error("Failed to load conversation:", error)
    }
  }, [state.conversations])

  // 发送消息
  const sendMessage = React.useCallback(
    async (prompt: string) => {
      if (!state.currentConversationId) {
        // 没有会话时自动创建
        const conversation: Conversation = {
          id: generateId(),
          title: generateTitle(prompt),
          model: state.selectedModel,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messageCount: 0,
        }
        await dbSaveConversation(conversation)
        dispatch({ type: "ADD_CONVERSATION", payload: conversation })

        // 更新标题
        conversation.title = generateTitle(prompt)
        await dbSaveConversation(conversation)
        dispatch({
          type: "SET_CONVERSATIONS",
          payload: [conversation, ...state.conversations],
        })
      }

      const convId = state.currentConversationId || (
        // 刚创建的会话 ID 需要从 state 获取
        state.conversations[0]?.id
      )

      if (!convId) return

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: prompt,
        createdAt: Date.now(),
      }
      dispatch({ type: "ADD_MESSAGE", payload: userMessage })
      await dbSaveMessage(convId, userMessage)

      // 设置加载状态
      dispatch({ type: "SET_LOADING", payload: true })

      try {
        // 调用 Seedream API
        const response = await generateImage(prompt, state.selectedModel)

        // 解析图片数据
        const images: ImageData[] = response.data
          .filter((item) => item.b64_json)
          .map((item) => ({
            base64: item.b64_json!,
            mimeType: "image/png",
          }))

        // 添加 AI 回复消息
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: images.length > 0 ? "已生成图片" : "未能生成图片",
          images,
          generateParams: {
            model: state.selectedModel,
            size: "2K",
            seed: -1,
            n: 1,
          },
          createdAt: Date.now(),
        }
        dispatch({ type: "ADD_MESSAGE", payload: assistantMessage })
        await dbSaveMessage(convId, assistantMessage)

        // 更新会话信息
        const conv = state.conversations.find((c) => c.id === convId)
        if (conv) {
          const isFirstMessage = state.messages.length === 0
          const updatedConv: Conversation = {
            ...conv,
            title: isFirstMessage ? generateTitle(prompt) : conv.title,
            model: state.selectedModel,
            updatedAt: Date.now(),
            messageCount: conv.messageCount + 2,
          }
          await dbSaveConversation(updatedConv)
          dispatch({
            type: "SET_CONVERSATIONS",
            payload: state.conversations.map((c) =>
              c.id === convId ? updatedConv : c
            ),
          })
        }
      } catch (error) {
        // 添加错误消息
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: "生成失败",
          error: error instanceof Error ? error.message : "未知错误",
          createdAt: Date.now(),
        }
        dispatch({ type: "ADD_MESSAGE", payload: errorMessage })
        await dbSaveMessage(convId, errorMessage)
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    },
    [state.currentConversationId, state.selectedModel, state.conversations, state.messages]
  )

  // 切换模型
  const setModel = React.useCallback((model: SeedreamModel) => {
    dispatch({ type: "SET_MODEL", payload: model })
  }, [])

  // 更新 API 配置
  const updateApiConfig = React.useCallback(
    (config: Partial<typeof DEFAULT_API_CONFIG>) => {
      saveApiConfig(config)
      dispatch({ type: "SET_API_CONFIG", payload: config })
    },
    []
  )

  const value: AiImageContextValue = {
    state,
    createConversation,
    deleteConversation,
    selectConversation,
    sendMessage,
    setModel,
    updateApiConfig,
  }

  return (
    <AiImageContext.Provider value={value}>{children}</AiImageContext.Provider>
  )
}

// ============ Hook ============

export function useAiImage(): AiImageContextValue {
  const context = React.useContext(AiImageContext)
  if (context === undefined) {
    throw new Error("useAiImage must be used within an AiImageProvider")
  }
  return context
}
