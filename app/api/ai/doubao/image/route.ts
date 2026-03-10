import { createOpenAI } from '@ai-sdk/openai'

// 豆包 API 配置
const doubao = createOpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: `${process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'}`,
})

export const maxDuration = 60

// 豆包图片生成模型配置
// 支持直接使用模型名称，也可以配置特定的endpoint ID
const IMAGE_MODELS: Record<string, string> = {
  'seedream-4.0': process.env.DOUBAO_SEEDREAM_40_MODEL || 'doubao-seedream-4.0',
  'seedream-4.5': process.env.DOUBAO_SEEDREAM_45_MODEL || 'doubao-seedream-4.5',
  'seedream-5.0-lite': process.env.DOUBAO_SEEDREAM_50_LITE_MODEL || 'doubao-seedream-5.0-lite',
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[Doubao Image] Received request')
    
    const {
      prompt,
      model = 'seedream-4.0',
      size = '1024x1024',
      n = 1,
      negative_prompt,
      seed,
    } = body

    if (!prompt || typeof prompt !== 'string') {
      console.error('[Doubao Image] Invalid prompt')
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('[Doubao Image] Prompt:', prompt)
    console.log('[Doubao Image] Model:', model)
    console.log('[Doubao Image] Size:', size)

    // 获取模型ID
    const modelId = IMAGE_MODELS[model] || IMAGE_MODELS['seedream-4.0']

    // 调用图片生成 API
    const response = await doubao.images.generate({
      model: modelId,
      prompt,
      n,
      size,
      ...(negative_prompt && { negative_prompt }),
      ...(seed && { seed }),
    })

    console.log('[Doubao Image] Generation successful')

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[Doubao Image] Error:', error)
    
    // 详细错误信息
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = error instanceof Error && 'response' in error 
      ? (error as any).response 
      : undefined
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

