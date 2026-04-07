"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  type DownloadTask,
  type DownloadProgress,
  type DownloadStatus,
  fetchWithProgress,
  generateDownloadId,
  saveBlob,
} from "@/lib/download-utils"

const MAX_CONCURRENT = 3
const MAX_CONCURRENT_MOBILE = 1
const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // 指数退避

export interface UseDownloadManagerReturn {
  tasks: DownloadTask[]
  activeCount: number
  completedCount: number
  addDownload: (url: string, fileName: string, taskId?: number) => string | null
  retry: (id: string) => void
  cancel: (id: string) => void
  remove: (id: string) => void
  clearCompleted: () => void
  saveFile: (id: string) => void
  getTaskByTaskId: (taskId: number) => DownloadTask | undefined
}

export function useDownloadManager(): UseDownloadManagerReturn {
  const [tasks, setTasks] = React.useState<DownloadTask[]>([])
  const isMobile = useIsMobile()
  const maxConcurrent = isMobile ? MAX_CONCURRENT_MOBILE : MAX_CONCURRENT

  // 获取活跃（正在下载）的任务数量
  const activeCount = React.useMemo(
    () => tasks.filter((t) => t.status === "downloading").length,
    [tasks]
  )

  const completedCount = React.useMemo(
    () => tasks.filter((t) => t.status === "completed").length,
    [tasks]
  )

  // 更新单个任务的字段
  const updateTask = React.useCallback(
    (id: string, patch: Partial<DownloadTask>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      )
    },
    []
  )

  // 获取排队中的任务
  const pendingTasks = React.useMemo(
    () => tasks.filter((t) => t.status === "pending"),
    [tasks]
  )

  // 处理排队任务：当有空闲槽位时自动启动
  React.useEffect(() => {
    if (activeCount >= maxConcurrent || pendingTasks.length === 0) return

    const nextTask = pendingTasks[0]
    startDownload(nextTask)
  }, [activeCount, pendingTasks, maxConcurrent]) // eslint-disable-line react-hooks/exhaustive-deps

  // 开始下载
  const startDownload = React.useCallback(
    (task: DownloadTask) => {
      const abortController = new AbortController()
      updateTask(task.id, {
        status: "downloading",
        abortController,
        error: undefined,
      })

      fetchWithProgress(
        task.url,
        (progress: DownloadProgress) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? {
                    ...t,
                    loaded: progress.loaded,
                    total: progress.total,
                    speed: progress.speed,
                    eta: progress.eta,
                  }
                : t
            )
          )
        },
        abortController.signal
      )
        .then((blob) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, status: "completed", blob, loaded: blob.size, total: blob.size, speed: 0, eta: 0 }
                : t
            )
          )
          // 下载完成后自动保存文件到浏览器
          saveBlob(blob, task.fileName)
        })
        .catch((error) => {
          // 用户主动取消
          if (error instanceof DOMException && error.name === "AbortError") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === task.id
                  ? { ...t, status: "cancelled", speed: 0, eta: 0 }
                  : t
              )
            )
            return
          }

          // 下载失败，尝试重试
          setTasks((prev) => {
            const current = prev.find((t) => t.id === task.id)
            if (!current) return prev

            const newRetryCount = current.retryCount + 1
            if (newRetryCount < current.maxRetries) {
              // 延迟后重试
              const delay = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)]
              setTimeout(() => {
                setTasks((prev2) => {
                  const t = prev2.find((x) => x.id === task.id)
                  if (!t || t.status !== "failed") return prev2
                  return prev2.map((x) =>
                    x.id === task.id ? { ...x, status: "pending" } : x
                  )
                })
              }, delay)

              return prev.map((t) =>
                t.id === task.id
                  ? {
                      ...t,
                      status: "failed",
                      retryCount: newRetryCount,
                      error: error instanceof Error ? error.message : "下载失败",
                      speed: 0,
                      eta: 0,
                    }
                  : t
              )
            } else {
              // 超过重试次数
              return prev.map((t) =>
                t.id === task.id
                  ? {
                      ...t,
                      status: "failed",
                      error: error instanceof Error ? error.message : "下载失败",
                      speed: 0,
                      eta: 0,
                    }
                  : t
              )
            }
          })
        })
    },
    [updateTask]
  )

  // 添加下载任务
  const addDownload = React.useCallback(
    (url: string, fileName: string, taskId?: number): string | null => {
      // 防重复：检查是否有相同 URL 且未失败/取消的任务
      const existing = tasks.find(
        (t) =>
          t.url === url &&
          (t.status === "pending" || t.status === "downloading")
      )
      if (existing) return existing.id

      const id = generateDownloadId()
      const newTask: DownloadTask = {
        id,
        fileName,
        url,
        taskId,
        status: "pending",
        loaded: 0,
        total: 0,
        speed: 0,
        eta: 0,
        retryCount: 0,
        maxRetries: MAX_RETRIES,
      }

      setTasks((prev) => [...prev, newTask])
      return id
    },
    [tasks]
  )

  // 重试失败的任务
  const retry = React.useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: "pending", retryCount: 0, error: undefined }
            : t
        )
      )
    },
    []
  )

  // 取消下载
  const cancel = React.useCallback((id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id)
      if (!task) return prev

      if (task.status === "downloading" && task.abortController) {
        task.abortController.abort()
      }

      return prev.map((t) =>
        t.id === id
          ? { ...t, status: "cancelled", speed: 0, eta: 0 }
          : t
      )
    })
  }, [])

  // 从列表移除
  const remove = React.useCallback((id: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === id)
      if (task?.status === "downloading" && task.abortController) {
        task.abortController.abort()
      }
      return prev.filter((t) => t.id !== id)
    })
  }, [])

  // 清除已完成和已取消的任务
  const clearCompleted = React.useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === "pending" || t.status === "downloading" || t.status === "failed"))
  }, [])

  // 重新保存已完成的文件
  const saveFile = React.useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (task?.blob) {
        saveBlob(task.blob, task.fileName)
      }
    },
    [tasks]
  )

  // 根据 taskId 查找下载任务
  const getTaskByTaskId = React.useCallback(
    (taskId: number) => {
      return tasks.find((t) => t.taskId === taskId)
    },
    [tasks]
  )

  return {
    tasks,
    activeCount,
    completedCount,
    addDownload,
    retry,
    cancel,
    remove,
    clearCompleted,
    saveFile,
    getTaskByTaskId,
  }
}
