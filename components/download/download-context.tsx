"use client"

import * as React from "react"
import type { UseDownloadManagerReturn } from "@/hooks/use-download-manager"

interface DownloadManagerContextValue extends UseDownloadManagerReturn {
  openPanel: () => void
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
}

const DownloadManagerContext = React.createContext<DownloadManagerContextValue | null>(null)

/**
 * 桥接组件：将页面级的 useDownloadManager 状态注入到全局 Context
 * 放置在 RemixTaskPage 中，包裹需要使用下载管理的子组件
 */
export function DownloadManagerBridge({
  manager,
  children,
}: {
  manager: UseDownloadManagerReturn
  children: React.ReactNode
}) {
  const [panelOpen, setPanelOpen] = React.useState(false)

  const value = React.useMemo<DownloadManagerContextValue>(
    () => ({
      ...manager,
      openPanel: () => setPanelOpen(true),
      panelOpen,
      setPanelOpen,
    }),
    [manager, panelOpen]
  )

  return (
    <DownloadManagerContext.Provider value={value}>
      {children}
    </DownloadManagerContext.Provider>
  )
}

/**
 * 获取下载管理 Context
 * 如果没有 Provider 包裹（如不在混剪任务页面），返回 null
 */
export function useDownloadManagerContext(): DownloadManagerContextValue | null {
  return React.useContext(DownloadManagerContext)
}
