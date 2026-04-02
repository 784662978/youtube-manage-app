import type { StsCredentials } from '@/lib/types/material'
import { apiClient } from './api-client'

let stsCache: StsCredentials | null = null
let stsExpireTime = 0

const STS_REFRESH_BUFFER = 5 * 60 * 1000 // 提前5分钟刷新

export async function getStsCredentials(): Promise<StsCredentials> {
  const now = Date.now()
  if (stsCache && stsExpireTime - now > STS_REFRESH_BUFFER) {
    return stsCache
  }

  const result = await apiClient.get<{ response: StsCredentials }>(
    '/config/oss-sts-token'
  )

  stsCache = result.response
  const expiration = new Date(result.response.Expiration).getTime()
  stsExpireTime = expiration

  return stsCache
}

/**
 * 生成 HMAC-SHA1 签名（Base64），使用 Web Crypto API
 */
async function createHmacSha1(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const dataBuffer = encoder.encode(data)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

/**
 * 上传文件到阿里云 OSS
 * @param file 文件对象
 * @param ossPath OSS 相对路径（不含 bucket 前缀），如 material/reelshort/en/test.mp4
 */
export async function uploadFileToOss(file: File, ossPath: string): Promise<void> {
  const credentials = await getStsCredentials()
  const { bucket, endpoint, AccessKeyId, AccessKeySecret, SecurityToken } = credentials

  const url = `https://${bucket}.${endpoint}/${ossPath}`

  const canonicalizedHeaders = `x-oss-object-acl:public-read\nx-oss-security-token:${SecurityToken}\n`
  const stringToSign = [
    'PUT',
    '', // Content-MD5
    file.type || 'application/octet-stream',
    '', // Date
    canonicalizedHeaders + ossPath,
  ].join('\n')

  const signature = await createHmacSha1(AccessKeySecret, stringToSign)

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-oss-object-acl': 'public-read',
      'x-oss-security-token': SecurityToken,
      Authorization: `OSS ${AccessKeyId}:${signature}`,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`OSS 上传失败: ${response.status} ${response.statusText}`)
  }
}

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
 * 格式: material/{channel}/{language}/{filename}
 */
export function buildOssPath(channel: string, language: string, fileName: string): string {
  return `material/${channel}/${language}/${fileName}`
}
