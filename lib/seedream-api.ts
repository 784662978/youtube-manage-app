// Seedream API 客户端
// 调用火山方舟 Seedream 图像生成接口

import type {
  SeedreamModel,
  SeedreamRequest,
  SeedreamResponse,
  ApiConfig,
} from '@/lib/types/ai-image'
import { DEFAULT_API_CONFIG } from '@/lib/types/ai-image'

// API Key 存储 key
const API_KEY_STORAGE_KEY = 'seedream_api_key'
const API_ENDPOINT_STORAGE_KEY = 'seedream_api_endpoint'

// 获取存储的 API 配置
export function getStoredApiConfig(): ApiConfig {
  if (typeof window === 'undefined') return DEFAULT_API_CONFIG

  return {
    apiKey: localStorage.getItem(API_KEY_STORAGE_KEY) || '',
    endpoint:
      localStorage.getItem(API_ENDPOINT_STORAGE_KEY) ||
      DEFAULT_API_CONFIG.endpoint,
  }
}

// 保存 API 配置
export function saveApiConfig(config: Partial<ApiConfig>): void {
  if (typeof window === 'undefined') return

  if (config.apiKey !== undefined) {
    localStorage.setItem(API_KEY_STORAGE_KEY, config.apiKey)
  }
  if (config.endpoint !== undefined) {
    localStorage.setItem(API_ENDPOINT_STORAGE_KEY, config.endpoint)
  }
}

// 调用 Seedream 文生图 API
export async function generateImage(
  prompt: string,
  model: SeedreamModel,
  config?: Partial<ApiConfig & { size?: string; seed?: number }>
): Promise<SeedreamResponse> {
  const storedConfig = getStoredApiConfig()
  const apiKey = config?.apiKey || storedConfig.apiKey
  const endpoint = config?.endpoint || storedConfig.endpoint

  if (!apiKey) {
    throw new Error('请先配置 API Key')
  }

  const requestBody: SeedreamRequest = {
    model,
    prompt,
    size: config?.size || '2K',
    seed: config?.seed ?? -1,
    n: 1,
    response_format: 'b64_json',
  }

  const url = `${endpoint}/images/generations`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    let errorMessage = `API 请求失败 (${response.status})`
    try {
      const errorData = await response.json()
      if (errorData.error?.message) {
        errorMessage = errorData.error.message
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
    } catch {
      errorMessage = response.statusText || errorMessage
    }
    throw new Error(errorMessage)
  }

  const data: SeedreamResponse = await response.json()

  if (!data.data || data.data.length === 0) {
    throw new Error('API 未返回图片数据')
  }

  return data
}

// 测试 API 连接
export async function testApiConnection(config?: Partial<ApiConfig>): Promise<boolean> {
  try {
    await generateImage('test', 'doubao-seedream-5-0-260128', {
      ...config,
      size: '2K',
    })
    return true
  } catch {
    return false
  }
}
