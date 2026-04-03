import { describe, it, expect, vi, beforeEach } from 'vitest'

// ==================== Mocks ====================

// Mock ali-oss
const mockMultipartUpload = vi.fn()
const mockPut = vi.fn()

vi.mock('ali-oss', () => {
  return {
    default: vi.fn(() => ({
      multipartUpload: mockMultipartUpload,
      put: mockPut,
    })),
  }
})

// Mock api-client
const mockApiGet = vi.fn()
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}))

// Mock Web APIs
if (typeof globalThis.URL.createObjectURL === 'undefined') {
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock')
  globalThis.URL.revokeObjectURL = vi.fn()
}

import {
  getStsCredentials,
  clearStsCache,
  createOssClient,
  uploadFileToOss,
  uploadBufferToOss,
  uploadLargeFile,
  getVideoDuration,
  buildOssPath,
  getOssPublicUrl,
  OssUploadError,
  UploadProgress,
} from '../lib/oss-upload'
import type { StsCredentials } from '../lib/types/material'

// ==================== 测试数据 ====================

const MOCK_STS: StsCredentials = {
  access_key_id: 'test-access-key-id',
  access_key_secret: 'test-access-key-secret',
  security_token: 'test-security-token',
  bucket_name: 'test-bucket',
  endpoint: 'oss-cn-hangzhou.aliyuncs.com',
  upload_path: 'material',
}

// ==================== Tests ====================

describe('OSS Upload Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearStsCache()
    mockApiGet.mockResolvedValue({
      response: { ...MOCK_STS },
    })
  })

  // ==================== getStsCredentials ====================

  describe('getStsCredentials', () => {
    it('应该从 API 获取 STS 凭证', async () => {
      const creds = await getStsCredentials()
      expect(creds).toEqual(MOCK_STS)
      expect(mockApiGet).toHaveBeenCalledWith('/config/oss-sts-token')
    })

    it('应该缓存 STS 凭证，避免重复请求', async () => {
      await getStsCredentials()
      await getStsCredentials()
      expect(mockApiGet).toHaveBeenCalledTimes(1)
    })

    it('API 失败时应该抛出 OssUploadError', async () => {
      mockApiGet.mockRejectedValue(new Error('Network Error'))
      await expect(getStsCredentials()).rejects.toThrow(OssUploadError)
      await expect(getStsCredentials()).rejects.toThrow('获取 STS 凭证失败: Network Error')
    })

    it('API 失败时应该清除缓存', async () => {
      mockApiGet
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce({ response: MOCK_STS })

      // 第一次失败
      await expect(getStsCredentials()).rejects.toThrow()
      // 第二次应该重新请求
      const creds = await getStsCredentials()
      expect(creds).toEqual(MOCK_STS)
      expect(mockApiGet).toHaveBeenCalledTimes(2)
    })
  })

  // ==================== clearStsCache ====================

  describe('clearStsCache', () => {
    it('清除缓存后下次应重新请求', async () => {
      await getStsCredentials()
      expect(mockApiGet).toHaveBeenCalledTimes(1)

      clearStsCache()
      await getStsCredentials()
      expect(mockApiGet).toHaveBeenCalledTimes(2)
    })
  })

  // ==================== createOssClient ====================

  describe('createOssClient', () => {
    it('应该使用 STS 凭证创建 OSS 客户端', async () => {
      const OSS = (await import('ali-oss')).default
      const client = await createOssClient()

      expect(OSS).toHaveBeenCalledWith(
        expect.objectContaining({
          accessKeyId: 'test-access-key-id',
          accessKeySecret: 'test-access-key-secret',
          stsToken: 'test-security-token',
          bucket: 'test-bucket',
          endpoint: 'https://oss-cn-hangzhou.aliyuncs.com',
          secure: true,
        })
      )
      expect(client).toBeDefined()
    })
  })

  // ==================== uploadFileToOss ====================

  describe('uploadFileToOss', () => {
    const mockFile = new File(['test content'], 'test.mp4', {
      type: 'video/mp4',
    })

    it('应该使用 multipartUpload 上传文件', async () => {
      mockMultipartUpload.mockResolvedValue({ name: 'material/ch/en/test.mp4' })

      await uploadFileToOss(mockFile, 'ch/en/test.mp4')

      expect(mockMultipartUpload).toHaveBeenCalledWith(
        'material/ch/en/test.mp4',
        mockFile,
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-oss-object-acl': 'public-read',
          }),
        })
      )
    })

    it('上传成功时不抛出异常（向后兼容 void 返回）', async () => {
      mockMultipartUpload.mockResolvedValue({})

      const result = await uploadFileToOss(mockFile, 'ch/en/test.mp4')
      expect(result).toBeUndefined()
    })

    it('应该支持 onProgress 进度回调', async () => {
      const onProgress = vi.fn()
      let capturedProgressCb: Function | undefined

      mockMultipartUpload.mockImplementation(
        (_name: string, _file: File, options: Record<string, unknown>) => {
          capturedProgressCb = options.progress as Function
          // 模拟进度事件
          capturedProgressCb?.(0.5, {}, { loaded: 500, total: 1000 })
          return Promise.resolve({})
        }
      )

      await uploadFileToOss(mockFile, 'ch/en/test.mp4', { onProgress })

      expect(onProgress).toHaveBeenCalledWith({
        loaded: 500,
        total: 1000,
        percent: 50,
        checkpoint: {},
      })
    })

    it('应该支持自定义 MIME 类型', async () => {
      mockMultipartUpload.mockResolvedValue({})

      await uploadFileToOss(mockFile, 'ch/en/test.mp4', {
        mime: 'video/quicktime',
      })

      expect(mockMultipartUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'video/quicktime',
          }),
        })
      )
    })

    it('应该支持自定义分片大小和并发数', async () => {
      mockMultipartUpload.mockResolvedValue({})

      await uploadFileToOss(mockFile, 'ch/en/test.mp4', {
        partSize: 2 * 1024 * 1024,
        parallel: 10,
      })

      expect(mockMultipartUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          partSize: 2 * 1024 * 1024,
          parallel: 10,
        })
      )
    })

    it('上传失败时应该抛出 OssUploadError', async () => {
      mockMultipartUpload.mockRejectedValue({
        code: 'NoSuchBucket',
        message: 'The specified bucket does not exist',
        status: 404,
      })

      await expect(uploadFileToOss(mockFile, 'ch/en/test.mp4')).rejects.toThrow(
        OssUploadError
      )
      await expect(uploadFileToOss(mockFile, 'ch/en/test.mp4')).rejects.toThrow(
        'OSS 上传失败 [NoSuchBucket]'
      )
    })

    it('未知错误也应该转为 OssUploadError', async () => {
      mockMultipartUpload.mockRejectedValue('something unexpected')

      await expect(uploadFileToOss(mockFile, 'ch/en/test.mp4')).rejects.toThrow(
        OssUploadError
      )
    })

    it('不带 options 参数时应向后兼容', async () => {
      mockMultipartUpload.mockResolvedValue({})
      await expect(uploadFileToOss(mockFile, 'ch/en/test.mp4')).resolves.toBeUndefined()
    })
  })

  // ==================== uploadBufferToOss ====================

  describe('uploadBufferToOss', () => {
    it('应该使用 put 上传 Buffer 数据', async () => {
      mockPut.mockResolvedValue({
        url: 'https://test-bucket.oss-cn-hangzhou.aliyuncs.com/material/img/logo.png',
        name: 'material/img/logo.png',
        etag: '"abc123"',
      })

      const buffer = new ArrayBuffer(8)
      const result = await uploadBufferToOss(buffer, 'img/logo.png', {
        mime: 'image/png',
      })

      expect(mockPut).toHaveBeenCalledWith(
        'material/img/logo.png',
        buffer,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'image/png',
            'x-oss-object-acl': 'public-read',
          }),
        })
      )
      expect(result.name).toBe('material/img/logo.png')
      expect(result.etag).toBe('"abc123"')
    })

    it('上传失败时应该抛出 OssUploadError', async () => {
      mockPut.mockRejectedValue({
        code: 'AccessDenied',
        message: 'Access denied',
        status: 403,
      })

      await expect(uploadBufferToOss(new ArrayBuffer(1), 'img/fail.png')).rejects.toThrow(
        OssUploadError
      )
    })
  })

  // ==================== uploadLargeFile ====================

  describe('uploadLargeFile', () => {
    const mockBlob = new Blob(['large file content'], { type: 'video/mp4' })

    it('应该使用更大的分片上传大文件', async () => {
      mockMultipartUpload.mockResolvedValue({
        url: 'https://test-bucket.oss-cn-hangzhou.aliyuncs.com/material/videos/4k.mp4',
        name: 'material/videos/4k.mp4',
        etag: '"def456"',
      })

      const result = await uploadLargeFile(mockBlob, 'videos/4k.mp4')

      expect(mockMultipartUpload).toHaveBeenCalledWith(
        'material/videos/4k.mp4',
        mockBlob,
        expect.objectContaining({
          partSize: 5 * 1024 * 1024, // 5MB 默认
          timeout: 300_000, // 5 分钟
        })
      )
      expect(result.name).toBe('material/videos/4k.mp4')
    })

    it('应该支持自定义分片和 checkpoint', async () => {
      const mockCheckpoint = { FileId: 'abc', Parts: [] }
      mockMultipartUpload.mockResolvedValue({})

      await uploadLargeFile(mockBlob, 'videos/4k.mp4', {
        partSize: 10 * 1024 * 1024,
        checkpoint: mockCheckpoint,
      })

      expect(mockMultipartUpload).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          partSize: 10 * 1024 * 1024,
          checkpoint: mockCheckpoint,
        })
      )
    })

    it('应该支持进度回调', async () => {
      const onProgress = vi.fn()

      mockMultipartUpload.mockImplementation(
        (_name: string, _file: Blob, options: Record<string, unknown>) => {
          const cb = options.progress as Function
          cb(0.75, { id: 'ck1' }, { loaded: 750, total: 1000 })
          return Promise.resolve({})
        }
      )

      await uploadLargeFile(mockBlob, 'videos/4k.mp4', { onProgress })

      expect(onProgress).toHaveBeenCalledWith({
        loaded: 750,
        total: 1000,
        percent: 75,
        checkpoint: { id: 'ck1' },
      })
    })
  })

  // ==================== getVideoDuration ====================

  describe('getVideoDuration', () => {
    it('应该返回视频时长（秒）', async () => {
      const mockFile = new File([''], 'test.mp4', { type: 'video/mp4' })

      // Mock createElement + video API
      const mockVideo = {
        preload: '',
        src: '',
        duration: 125.7,
        onloadedmetadata: null as Function | null,
        onerror: null as Function | null,
      }

      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLElement)

      // Simulate loadedmetadata
      setTimeout(() => {
        mockVideo.onloadedmetadata?.()
      }, 0)

      const duration = await getVideoDuration(mockFile)
      expect(duration).toBe(126) // Math.round(125.7)
    })

    it('视频加载失败时应该 reject', async () => {
      const mockFile = new File([''], 'corrupt.mp4', { type: 'video/mp4' })

      const mockVideo = {
        preload: '',
        src: '',
        onloadedmetadata: null as Function | null,
        onerror: null as Function | null,
      }

      vi.spyOn(document, 'createElement').mockReturnValue(mockVideo as unknown as HTMLElement)

      setTimeout(() => {
        mockVideo.onerror?.()
      }, 0)

      await expect(getVideoDuration(mockFile)).rejects.toThrow('无法读取视频时长')
    })
  })

  // ==================== buildOssPath ====================

  describe('buildOssPath', () => {
    it('应该正确构建路径', () => {
      expect(buildOssPath('reelshort', 'en', 'test.mp4')).toBe(
        'reelshort/en/test.mp4'
      )
    })

    it('应该处理包含特殊字符的文件名', () => {
      expect(buildOssPath('dramabox', 'pt-br', 'ep01 (2).mp4')).toBe(
        'dramabox/pt-br/ep01 (2).mp4'
      )
    })
  })

  // ==================== getOssPublicUrl ====================

  describe('getOssPublicUrl', () => {
    it('应该返回完整的公共读 URL', async () => {
      const url = await getOssPublicUrl('reelshort/en/test.mp4')
      expect(url).toBe(
        'https://test-bucket.oss-cn-hangzhou.aliyuncs.com/material/reelshort/en/test.mp4'
      )
    })
  })

  // ==================== OssUploadError ====================

  describe('OssUploadError', () => {
    it('应该正确设置错误属性', () => {
      const cause = new Error('original error')
      const error = new OssUploadError(
        'upload failed',
        'NoSuchBucket',
        404,
        cause
      )

      expect(error.name).toBe('OssUploadError')
      expect(error.message).toBe('upload failed')
      expect(error.code).toBe('NoSuchBucket')
      expect(error.statusCode).toBe(404)
      expect(error.cause).toBe(cause)
      expect(error).toBeInstanceOf(Error)
    })

    it('不传可选参数时应有默认值', () => {
      const error = new OssUploadError('something went wrong')
      expect(error.code).toBeUndefined()
      expect(error.statusCode).toBeUndefined()
      expect(error.cause).toBeUndefined()
    })
  })

  // ==================== Integration: 端到端流程 ====================

  describe('端到端上传流程', () => {
    it('完整流程: 获取凭证 -> 构建路径 -> 上传', async () => {
      const mockFile = new File(['video content'], 'ep01.mp4', {
        type: 'video/mp4',
      })

      mockMultipartUpload.mockResolvedValue({})

      // Step 1: 构建路径
      const ossPath = buildOssPath('reelshort', 'en', 'ep01.mp4')
      expect(ossPath).toBe('reelshort/en/ep01.mp4')

      // Step 2: 上传
      await uploadFileToOss(mockFile, ossPath)

      // 验证: 应该先获取了凭证，然后上传到了正确的完整路径
      expect(mockApiGet).toHaveBeenCalledWith('/config/oss-sts-token')
      expect(mockMultipartUpload).toHaveBeenCalledWith(
        'material/reelshort/en/ep01.mp4',
        mockFile,
        expect.anything()
      )

      // Step 3: 获取公共 URL
      const url = await getOssPublicUrl(ossPath)
      expect(url).toContain('reelshort/en/ep01.mp4')
    })

    it('凭证过期场景: 缓存过期后自动刷新', async () => {
      // 获取凭证（会被缓存）
      await getStsCredentials()
      expect(mockApiGet).toHaveBeenCalledTimes(1)

      // 模拟时间流逝 - 手动清除缓存
      clearStsCache()

      // 再次获取应该重新请求
      mockApiGet.mockResolvedValueOnce({
        response: {
          ...MOCK_STS,
          security_token: 'new-token',
        },
      })
      const newCreds = await getStsCredentials()
      expect(newCreds.security_token).toBe('new-token')
      expect(mockApiGet).toHaveBeenCalledTimes(2)
    })
  })
})
