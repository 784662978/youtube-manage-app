import OSS from 'ali-oss'
import type { StsCredentials } from '@/lib/types/material'
import { apiClient } from './api-client'

// ==================== 类型定义 ====================

/** 上传进度信息 */
export interface UploadProgress {
  /** 已上传字节数 */
  loaded: number
  /** 总字节数（可能为 0，表示未知） */
  total: number
  /** 百分比 0-100 */
  percent: number
  /** 检查点数据（用于断点续传） */
  checkpoint?: unknown
}

/** 上传选项 */
export interface OssUploadOptions {
  /** 上传进度回调 */
  onProgress?: (progress: UploadProgress) => void
  /** 并发分片上传的分片大小（字节），默认 1MB */
  partSize?: number
  /** 并发分片数，默认 5 */
  parallel?: number
  /** 自定义 MIME 类型，不传则自动检测 */
  mime?: string
  /** 额外的 HTTP headers */
  headers?: Record<string, string>
}

/** OSS 上传错误 */
export class OssUploadError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'OssUploadError'
  }
}

/** OSS 上传结果 */
export interface OssUploadResult {
  /** 完整的 OSS 对象 URL */
  url: string
  /** OSS 对象名称（含路径） */
  name: string
  /** ETag */
  etag?: string
}

// ==================== STS 凭证管理 ====================

let stsCache: StsCredentials | null = null
let stsExpireTime = 0

const STS_CACHE_DURATION = 30 * 60 * 1000 // 缓存30分钟（接口无 Expiration 字段）

/**
 * 获取 STS 临时凭证（带缓存，提前 5 分钟过期刷新）
 */
export async function getStsCredentials(): Promise<StsCredentials> {
  const now = Date.now()
  if (stsCache && stsExpireTime - now > 5 * 60 * 1000) {
    return stsCache
  }

  try {
    const result = await apiClient.get<{ response: StsCredentials }>(
      '/config/oss-sts-token'
    )

    stsCache = result.response
    stsExpireTime = Date.now() + STS_CACHE_DURATION

    return stsCache
  } catch (error) {
    stsCache = null
    stsExpireTime = 0

    if (error instanceof Error) {
      throw new OssUploadError(
        `获取 STS 凭证失败: ${error.message}`,
        'STS_FETCH_FAILED',
        undefined,
        error
      )
    }
    throw new OssUploadError('获取 STS 凭证失败: 未知错误', 'STS_FETCH_FAILED')
  }
}

/**
 * 清除 STS 凭证缓存（通常在凭证过期或用户登出时调用）
 */
export function clearStsCache(): void {
  stsCache = null
  stsExpireTime = 0
}

// ==================== OSS 客户端 ====================

/**
 * 根据 STS 凭证创建 OSS 客户端实例
 * 每次调用都基于最新缓存凭证，确保安全
 */
export async function createOssClient(): Promise<OSS> {
  const credentials = await getStsCredentials()
  const {
    bucket_name,
    endpoint,
    access_key_id,
    access_key_secret,
    security_token,
  } = credentials

  return new OSS({
    accessKeyId: access_key_id,
    accessKeySecret: access_key_secret,
    stsToken: security_token,
    bucket: bucket_name,
    endpoint: `https://${endpoint}`,
    secure: true,
    timeout: 120_000,
  })
}

// ==================== 核心错误处理 ====================

/**
 * 统一的 OSS 错误处理，将 ali-oss SDK 错误转为 OssUploadError
 */
function handleOssError(error: unknown, context: string): never {
  const err = error as Record<string, unknown> & Error

  if (err.code) {
    throw new OssUploadError(
      `${context} [${err.code}]: ${err.message || '未知错误'}`,
      err.code as string,
      err.status as number | undefined,
      error instanceof Error ? error : undefined
    )
  }

  if (error instanceof Error) {
    throw new OssUploadError(`${context}: ${error.message}`, undefined, undefined, error)
  }

  throw new OssUploadError(`${context}: 未知错误`)
}

// ==================== 文件上传 ====================

/**
 * 上传文件到阿里云 OSS（兼容旧签名：返回 void）
 *
 * 使用 ali-oss SDK 的 multipartUpload 实现分片上传，
 * 支持进度回调和断点续传。
 *
 * @param file - 浏览器 File 对象
 * @param ossPath - OSS 相对路径（不含 bucket 和 upload_path 前缀），如 reelshort/en/test.mp4
 * @param options - 上传选项（进度回调、分片配置等）
 *
 * @example
 * // 基础用法（向后兼容）
 * await uploadFileToOss(file, 'reelshort/en/test.mp4')
 *
 * // 带进度回调
 * await uploadFileToOss(file, 'reelshort/en/test.mp4', {
 *   onProgress: ({ percent }) => console.log(`${percent}%`),
 * })
 */
export async function uploadFileToOss(
  file: File,
  ossPath: string,
  options?: OssUploadOptions
): Promise<void> {
  const credentials = await getStsCredentials()
  const fullObjectName = `${credentials.upload_path}/${ossPath}`
  const client = await createOssClient()

  const uploadOptions: OSS.MultipartUploadOptions = {
    headers: {
      'x-oss-object-acl': 'public-read',
      ...(options?.mime ? { 'Content-Type': options.mime } : {}),
      ...(options?.headers || {}),
    },
    progress: options?.onProgress
      ? (percent: number, checkpoint: unknown, res: Record<string, unknown>) => {
          options.onProgress!({
            loaded: (res?.loaded as number) || 0,
            total: (res?.total as number) || 0,
            percent: Math.round(percent * 100),
            checkpoint,
          })
        }
      : undefined,
    partSize: options?.partSize || 1024 * 1024, // 默认 1MB
    parallel: options?.parallel || 5,
    mime: options?.mime,
    timeout: 120_000,
  }

  try {
    await client.multipartUpload(fullObjectName, file, uploadOptions)
  } catch (error) {
    handleOssError(error, 'OSS 上传失败')
  }
}

/**
 * 上传 Buffer / ArrayBuffer 数据到阿里云 OSS
 * 适用于 Node.js 环境或需要直接上传二进制数据的场景
 *
 * @param buffer - ArrayBuffer 或 Buffer 数据
 * @param ossPath - OSS 相对路径
 * @param options - 上传选项
 * @returns 上传结果（含 URL、对象名、ETag）
 *
 * @example
 * const result = await uploadBufferToOss(buffer, 'images/logo.png', {
 *   mime: 'image/png',
 * })
 * console.log(result.url)
 */
export async function uploadBufferToOss(
  buffer: ArrayBuffer | Buffer,
  ossPath: string,
  options?: OssUploadOptions
): Promise<OssUploadResult> {
  const credentials = await getStsCredentials()
  const fullObjectName = `${credentials.upload_path}/${ossPath}`
  const client = await createOssClient()

  try {
    const result = await client.put(fullObjectName, buffer as string | Buffer | Blob, {
      headers: {
        'x-oss-object-acl': 'public-read',
        ...(options?.mime ? { 'Content-Type': options.mime } : {}),
        ...(options?.headers || {}),
      },
      mime: options?.mime,
      timeout: 120_000,
    })

    return {
      url: (result as unknown as Record<string, string>).url || '',
      name: (result as unknown as Record<string, string>).name || fullObjectName,
      etag: (result as unknown as Record<string, string>).etag,
    }
  } catch (error) {
    handleOssError(error, 'OSS Buffer 上传失败')
  }
}

/**
 * 分片上传大文件（支持断点续传）
 * 适用于超大文件（> 100MB），使用更大的分片和更长的超时
 *
 * @param file - File / Blob 对象
 * @param ossPath - OSS 相对路径
 * @param options - 上传选项（支持 checkpoint 实现断点续传）
 * @returns 上传结果
 *
 * @example
 * // 上传并获取 checkpoint 用于断点续传
 * let checkpoint: unknown
 * try {
 *   await uploadLargeFile(largeFile, 'videos/4k.mp4', {
 *     onProgress: ({ percent }) => console.log(`${percent}%`),
 *     checkpoint,
 *     partSize: 10 * 1024 * 1024, // 10MB 分片
 *   })
 * } catch (error) {
 *   if (error instanceof OssUploadError && error.code === 'ConnectionTimeoutError') {
 *     // 保存 checkpoint，稍后重试
 *     saveCheckpoint(checkpoint)
 *   }
 * }
 */
export async function uploadLargeFile(
  file: File | Blob,
  ossPath: string,
  options?: OssUploadOptions & { checkpoint?: unknown }
): Promise<OssUploadResult> {
  const credentials = await getStsCredentials()
  const fullObjectName = `${credentials.upload_path}/${ossPath}`
  const client = await createOssClient()

  try {
    const result = await client.multipartUpload(fullObjectName, file, {
      headers: {
        'x-oss-object-acl': 'public-read',
        ...(options?.mime ? { 'Content-Type': options.mime } : {}),
        ...(options?.headers || {}),
      },
      progress: options?.onProgress
        ? (percent: number, checkpoint: unknown, res: Record<string, unknown>) => {
            options.onProgress!({
              loaded: (res?.loaded as number) || 0,
              total: (res?.total as number) || 0,
              percent: Math.round(percent * 100),
              checkpoint,
            })
          }
        : undefined,
      partSize: options?.partSize || 5 * 1024 * 1024, // 大文件默认 5MB 分片
      parallel: options?.parallel || 5,
      checkpoint: options?.checkpoint as OSS.MultipartUploadOptions['checkpoint'],
      mime: options?.mime,
      timeout: 300_000, // 大文件 5 分钟超时
    })

    return {
      url: (result as unknown as Record<string, string>).url || '',
      name: (result as unknown as Record<string, string>).name || fullObjectName,
      etag: (result as unknown as Record<string, string>).etag,
    }
  } catch (error) {
    handleOssError(error, 'OSS 大文件上传失败')
  }
}

// ==================== 工具函数 ====================

/**
 * 获取视频文件时长（秒）
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration)
      URL.revokeObjectURL(video.src)
      resolve(duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('无法读取视频时长'))
    }
    video.src = URL.createObjectURL(file)
  })
}

/**
 * 构建 OSS 上传路径
 * 格式: {channel}/{language}/{filename}
 */
export function buildOssPath(channel: string, language: string, fileName: string): string {
  return `${channel}/${language}/${fileName}`
}

/**
 * 获取文件的完整 OSS 公共读 URL
 *
 * @param ossPath - OSS 相对路径（不含 upload_path 前缀）
 * @returns 完整的公共读 URL
 */
export async function getOssPublicUrl(ossPath: string): Promise<string> {
  const credentials = await getStsCredentials()
  return `https://${credentials.bucket_name}.${credentials.endpoint}/${credentials.upload_path}/${ossPath}`
}
