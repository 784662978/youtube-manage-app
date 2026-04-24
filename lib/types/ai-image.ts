// AI 生图模块类型定义

// ============ 模型相关 ============

export type SeedreamModel = string

export interface ModelOption {
  id: SeedreamModel
  name: string
  description: string
  defaultSize: string
  maxResolution: string
}

export const SEEDREAM_MODELS: ModelOption[] = [
  {
    id: 'doubao-seedream-5-0-260128',
    name: 'Seedream 5.0 Lite',
    description: '最新轻量旗舰，支持联网搜索增强、深度推理',
    defaultSize: '2K',
    maxResolution: '4K',
  },
  {
    id: 'doubao-seedream-4-5-251128',
    name: 'Seedream 4.5',
    description: '高品质图像生成，融合常识与推理能力',
    defaultSize: '2K',
    maxResolution: '4K',
  },
  {
    id: 'doubao-seedream-4-0-250828',
    name: 'Seedream 4.0',
    description: '基础文生图模型，稳定可靠',
    defaultSize: '2K',
    maxResolution: '4K',
  },
]

export const DEFAULT_MODEL: SeedreamModel = 'doubao-seedream-5-0-260128'

// ============ 消息相关 ============

export type MessageRole = 'user' | 'assistant'

export interface GenerateParams {
  model: SeedreamModel
  size: string
  seed: number
  n: number
}

export interface ImageData {
  base64: string
  mimeType: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  images?: ImageData[]
  generateParams?: GenerateParams
  error?: string
  createdAt: number
}

// ============ 会话相关 ============

export interface Conversation {
  id: string
  title: string
  model: SeedreamModel
  createdAt: number
  updatedAt: number
  messageCount: number
}

// ============ API 相关 ============

export interface ApiConfig {
  apiKey: string
  endpoint: string
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  apiKey: '',
  endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
}

// Seedream API 请求参数
export interface SeedreamRequest {
  model: string
  prompt: string
  size?: string
  seed?: number
  n?: number
  response_format?: 'b64_json' | 'url'
}

// Seedream API 响应
export interface SeedreamResponse {
  data: Array<{
    b64_json?: string
    url?: string
  }>
}

// ============ Context State ============

export interface AiImageState {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: ChatMessage[]
  selectedModel: SeedreamModel
  isLoading: boolean
  apiConfig: ApiConfig
  isDbReady: boolean
}

export type AiImageAction =
  | { type: 'SET_DB_READY'; payload: boolean }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'SET_CURRENT_CONVERSATION'; payload: { id: string; messages: ChatMessage[] } }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_MODEL'; payload: SeedreamModel }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_API_CONFIG'; payload: Partial<ApiConfig> }
