import type { StsCredentials } from '@/lib/types/material'
import { apiClient } from './api-client'

let stsCache: StsCredentials | null = null
let stsExpireTime = 0

const STS_CACHE_DURATION = 30 * 60 * 1000 // 缓存30分钟（接口无 Expiration 字段）

export async function getStsCredentials(): Promise<StsCredentials> {
  const now = Date.now()
  if (stsCache && stsExpireTime - now > 5 * 60 * 1000) {
    return stsCache
  }

  const result = await apiClient.get<{ response: StsCredentials }>(
    '/config/oss-sts-token'
  )

  stsCache = result.response
  stsExpireTime = Date.now() + STS_CACHE_DURATION

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
  const { bucket_name, endpoint, access_key_id, access_key_secret, security_token } = credentials

  const url = `https://${bucket_name}.${endpoint}/${ossPath}`

  const canonicalizedHeaders = `x-oss-object-acl:public-read\nx-oss-security-token:${security_token}\n`
  const stringToSign = [
    'PUT',
    '', // Content-MD5
    file.type || 'application/octet-stream',
    '', // Date
    canonicalizedHeaders + ossPath,
  ].join('\n')

  const signature = await createHmacSha1(access_key_secret, stringToSign)

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-oss-object-acl': 'public-read',
      'x-oss-security-token': security_token,
      Authorization: `OSS ${access_key_id}:${signature}`,
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
