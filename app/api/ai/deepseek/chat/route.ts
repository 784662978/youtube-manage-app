import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

const deepseek = createOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
})

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[DeepSeek] Received request')
    
    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      console.error('[DeepSeek] Invalid messages format')
      return new Response('Invalid messages format', { status: 400 })
    }

    // 将 UIMessage 转换为 ModelMessage 格式
    const modelMessages = messages.map((msg: { role: string; parts?: { type: string; text: string }[]; content?: string }) => {
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

    console.log('[DeepSeek] Model messages count:', modelMessages.length)

    const result = streamText({
      model: deepseek.chat('deepseek-chat'),  // 使用 .chat() 方法
      messages: modelMessages,
      system: '你是一个友好的 AI 助手，用中文回答用户的问题。请提供有帮助、准确且简洁的回答。',
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('[DeepSeek] Error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
