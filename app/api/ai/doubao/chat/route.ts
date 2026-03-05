import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

// 豆包 API 配置
const doubao = createOpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: `${process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'}`,
})

export const maxDuration = 30

// 豆包模型映射（endpoint_id）
const MODEL_ENDPOINTS: Record<string, string> = {
  // 默认使用豆包 Pro 32K 模型
  'default': process.env.DOUBAO_ENDPOINT_ID || 'ep-20241018164932-wmmdl',
  // 可以添加更多模型
  'pro-32k': process.env.DOUBAO_ENDPOINT_ID || 'ep-20241018164932-wmmdl',
  'lite-4k': process.env.DOUBAO_LITE_ENDPOINT_ID || 'ep-20241018164932-wmmdl',
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[Doubao] Received request')
    
    const { messages, model = 'default' } = body

    if (!messages || !Array.isArray(messages)) {
      console.error('[Doubao] Invalid messages format')
      return new Response('Invalid messages format', { status: 400 })
    }

    // 将 UIMessage 转换为 ModelMessage 格式
    const modelMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = messages.map((msg: { role: string; parts?: { type: string; text: string }[]; content?: string }) => {
      let content = ''
      if (msg.parts && Array.isArray(msg.parts)) {
        const textPart = msg.parts.find((p) => p.type === 'text')
        if (textPart) {
          content = textPart.text
        }
      } else if (typeof msg.content === 'string') {
        content = msg.content
      }

      return {
        role: msg.role as 'user' | 'assistant' | 'system',
        content,
      }
    })

    console.log('[Doubao] Model messages count:', modelMessages.length)
    console.log('[Doubao] API Key exists:', !!process.env.DOUBAO_API_KEY)

    // 获取模型 endpoint
    const endpointId = MODEL_ENDPOINTS[model] || MODEL_ENDPOINTS['default']

    const result = streamText({
      model: doubao.chat(endpointId),  // 使用 .chat() 方法
      messages: modelMessages,
      system: '你是一个友好的 AI 助手，用中文回答用户的问题。请提供有帮助、准确且简洁的回答。',
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[Doubao] Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
