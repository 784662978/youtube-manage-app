/**
 * 下载管理工具函数
 * 包含类型定义、流式下载、格式化工具等
 */

// ==================== 类型定义 ====================

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "completed"
  | "failed"
  | "cancelled"

export interface DownloadTask {
  id: string
  fileName: string
  url: string
  taskId?: number
  status: DownloadStatus
  loaded: number
  total: number
  speed: number
  eta: number
  retryCount: number
  maxRetries: number
  error?: string
  abortController?: AbortController
  blob?: Blob
}

export interface DownloadProgress {
  loaded: number
  total: number
  speed: number
  eta: number
}

// ==================== 流式下载 ====================

/**
 * 流式下载文件并实时报告进度
 * 使用 ReadableStream 逐块读取，避免大文件一次性占满内存
 */
export async function fetchWithProgress(
  url: string,
  onProgress: (progress: DownloadProgress) => void,
  signal?: AbortSignal
): Promise<Blob> {
  const response = await fetch(url, {
    mode: "cors",
    signal,
  })

  if (!response.ok) {
    throw new Error(`下载失败: HTTP ${response.status} ${response.statusText}`)
  }

  const contentLength = Number(response.headers.get("content-length") || 0)

  // 降级处理：如果浏览器不支持 ReadableStream
  if (!response.body) {
    const blob = await response.blob()
    onProgress({ loaded: blob.size, total: blob.size, speed: 0, eta: 0 })
    return blob
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let loaded = 0

  let lastTime = performance.now()
  let lastLoaded = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      chunks.push(value)
      loaded += value.length

      // 每 200ms 计算一次速度和 ETA
      const now = performance.now()
      const elapsed = (now - lastTime) / 1000
      if (elapsed >= 0.2) {
        const bytesDiff = loaded - lastLoaded
        const speed = bytesDiff / elapsed
        const eta =
          speed > 0 && contentLength > 0
            ? (contentLength - loaded) / speed
            : 0
        onProgress({ loaded, total: contentLength, speed, eta })
        lastTime = now
        lastLoaded = loaded
      }
    }
  } finally {
    reader.releaseLock()
  }

  // 最终进度报告
  onProgress({ loaded, total: contentLength || loaded, speed: 0, eta: 0 })

  return new Blob(chunks as BlobPart[], { type: "video/mp4" })
}

// ==================== 格式化工具 ====================

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * 格式化下载速度
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`
}

/**
 * 格式化剩余时间
 */
export function formatEta(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return ""
  if (seconds < 60) return "< 1分钟"
  if (seconds < 3600) {
    const mins = Math.ceil(seconds / 60)
    return `${mins}分钟`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.ceil((seconds % 3600) / 60)
  return `${hours}小时${mins}分钟`
}

// ==================== 文件保存 ====================

/**
 * 判断是否为移动端设备
 */
function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false
  return navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

/**
 * 保存 Blob 为文件
 * 仅移动端使用 Web Share API，桌面端统一使用 <a> 标签下载
 */
export function saveBlob(blob: Blob, fileName: string) {
  // 仅移动端使用 Web Share API（桌面端 Edge/Chrome 也支持但会弹出分享面板而非下载）
  if (
    isMobileDevice() &&
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.({
      files: [new File([blob], fileName)],
    })
  ) {
    const file = new File([blob], fileName, { type: blob.type })
    navigator
      .share({ files: [file], title: fileName })
      .catch(() => fallbackSave(blob, fileName))
    return
  }

  fallbackSave(blob, fileName)
}

function fallbackSave(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)

  // 方案1: <a download> 标签
  try {
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    a.style.display = "none"
    document.body.appendChild(a)
    a.click()
    // 延迟释放，确保浏览器有足够时间开始下载
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 3000)
    return
  } catch {
    // 方案1 失败时走方案2
  }

  // 方案2: window.open (某些浏览器对 <a download> 限制较严时作为备选)
  try {
    const newWindow = window.open(url, "_blank")
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.close()
          URL.revokeObjectURL(url)
        }, 1000)
      }
      return
    }
  } catch {
    // window.open 也被拦截
  }

  // 最终兜底：使用 FileSaver 风格的 msSaveBlob (IE/Edge 旧版)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any
    if (nav.msSaveOrOpenBlob) {
      nav.msSaveOrOpenBlob(blob, fileName)
      URL.revokeObjectURL(url)
      return
    }
  } catch {
    // 忽略
  }

  URL.revokeObjectURL(url)
}

// ==================== 生成唯一 ID ====================

let idCounter = 0

export function generateDownloadId(): string {
  idCounter += 1
  return `dl_${Date.now()}_${idCounter}`
}
