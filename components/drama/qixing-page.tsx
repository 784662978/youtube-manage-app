"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { Notification, NotificationType } from "@/components/ui/notification"
import { Loader2 } from "lucide-react"
import { QixingVideoList } from "./qixing-video-list"
import type { ApiResponse, QixingLanguageItem } from "@/lib/types"

export function QixingPage() {
  const [languages, setLanguages] = React.useState<{ code: number; display_name: string }[]>([])
  const [languagesLoading, setLanguagesLoading] = React.useState(true)
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    visible: boolean
  }>({ message: "", type: "success", visible: false })

  const showNotification = React.useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type, visible: true })
  }, [])

  React.useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const result = await apiClient.get<ApiResponse<QixingLanguageItem[]>>(
          "/taskLanguages/qixing"
        )
        setLanguages(
          (result.response || []).map((l) => ({
            code: l.code,
            display_name: l.display_name,
          }))
        )
      } catch (error) {
        console.error("Failed to fetch languages:", error)
      } finally {
        setLanguagesLoading(false)
      }
    }
    fetchLanguages()
  }, [])

  if (languagesLoading) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-4">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.visible}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <h1 className="text-2xl font-bold tracking-tight">七星剧目</h1>

      <QixingVideoList languages={languages} onNotification={showNotification} />
    </div>
  )
}
