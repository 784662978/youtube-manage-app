import { createOpenAI } from '@ai-sdk/openai'
import { generateImage } from 'ai'

// 豆包 API 配置
const doubao = createOpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
})

export const maxDuration = 60

// 豆包图片生成模型配置
// 火山方舟平台使用 Endpoint ID（格式 ep-xxxxxxxxxx-xxxxx），不是模型名称
// 需要在火山方舟控制台创建推理接入点后填入
const IMAGE_MODELS: Record<string, { endpoint: string; name: string; description: string }> = {
  'seedream-5.0-lite': {
    endpoint: process.env.DOUBAO_SEEDREAM_50_LITE_ENDPOINT || '',
    name: 'Seedream 5.0 Lite',
    description: '最新轻量版 · 速度快',
  },
  'seedream-4.5': {
    endpoint: process.env.DOUBAO_SEEDREAM_45_ENDPOINT || '',
    name: 'Seedream 4.5',
    description: '进阶版 · 画质优',
  },
  'seedream-4.0': {
    endpoint: process.env.DOUBAO_SEEDREAM_40_ENDPOINT || '',
    name: 'Seedream 4.0',
    description: '稳定版 · 高质量',
  },
}

// 支持的图片尺寸
const SUPPORTED_SIZES = ['512x512', '768x768', '1024x1024', '1280x720', '720x1280']

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('[Doubao Image] Received request')
    
    const {
      prompt,
      model = 'seedream-5.0-lite',
      size = '1024x1024',
      n = 1,
      negative_prompt,
      seed,
    } = body

    if (!prompt || typeof prompt !== 'string') {
      console.error('[Doubao Image] Invalid prompt')
      return new Response(JSON.stringify({ error: '请输入有效的图片描述' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 校验模型
    const modelConfig = IMAGE_MODELS[model]
    if (!modelConfig) {
      const availableModels = Object.keys(IMAGE_MODELS).join(', ')
      return new Response(JSON.stringify({ 
        error: '不支持的模型: ' + model + '，可用模型: ' + availableModels
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 校验 Endpoint ID 是否已配置
    if (!modelConfig.endpoint) {
      const envVarName = model === 'seedream-5.0-lite' 
        ? 'DOUBAO_SEEDREAM_50_LITE_ENDPOINT'
        : model === 'seedream-4.5' 
          ? 'DOUBAO_SEEDREAM_45_ENDPOINT'
          : 'DOUBAO_SEEDREAM_40_ENDPOINT'
      return new Response(JSON.stringify({ 
        error: '模型 ' + modelConfig.name + ' 的 Endpoint ID 未配置，请在 .env.local 中设置 ' + envVarName + '（在火山方舟控制台创建推理接入点获取）' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 校验尺寸
    if (!SUPPORTED_SIZES.includes(size)) {
      const sizesList = SUPPORTED_SIZES.join(', ')
      return new Response(JSON.stringify({ 
        error: '不支持的尺寸: ' + size + '，可用尺寸: ' + sizesList
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('[Doubao Image] Prompt:', prompt)
    console.log('[Doubao Image] Model:', model, '→ Endpoint:', modelConfig.endpoint)
    console.log('[Doubao Image] Size:', size)

    // 调用图片生成 API，使用 Endpoint ID
    const { image } = await generateImage({
      model: doubao.image(modelConfig.endpoint),
      prompt,
      n,
      size,
      ...(negative_prompt && { negativePrompt: negative_prompt }),
      ...(seed !== undefined && { seed }),
    })

    console.log('[Doubao Image] Generation successful')

    return new Response(JSON.stringify({ 
      data: [{
        url: image.url,
      }],
      model: {
        id: model,
        name: modelConfig.name,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[Doubao Image] Error:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // 提供更友好的错误提示
    let userMessage = '图片生成失败，请稍后重试'
    if (errorMessage.includes('does not exist') || errorMessage.includes('do not have access')) {
      userMessage = '模型 Endpoint 不存在或无权访问，请在火山方舟控制台确认推理接入点已创建且状态正常'
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      userMessage = 'API 认证失败，请检查 API Key 配置'
    } else if (errorMessage.includes('429') || errorMessage.includes('rate')) {
      userMessage = '请求过于频繁，请稍后重试'
    } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      userMessage = 'API 配额不足，请联系管理员'
    } else if (errorMessage.includes('timeout')) {
      userMessage = '请求超时，请尝试使用更小的尺寸或更简单的描述'
    }

    return new Response(JSON.stringify({ 
      error: userMessage,
      details: errorMessage,
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
