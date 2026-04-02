"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { Notification, NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import { Loader2, Upload } from "lucide-react"
import { MaterialLibraryList } from "./material-library-list"
import { UploadDialog } from "./upload-dialog"
import type { MaterialChannel } from "@/lib/types/material"
import type { ApiResponse } from "@/lib/types/drama"

export function MaterialLibraryPage() {
  const [channels, setChannels] = React.useState<{ id: number; name: string; label: string }[]>([])
  const [channelsLoading, setChannelsLoading] = React.useState(true)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    visible: boolean
  }>({ message: "", type: "success", visible: false })

  const showNotification = React.useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type, visible: true })
  }, [])

  const fetchChannels = React.useCallback(async () => {
    try {
      const result = await apiClient.get<ApiResponse<MaterialChannel[]>>(
        "/materialChannel/list"
      )
      setChannels((result.response || []).map((ch) => ({ id: ch.id, name: ch.channel_code, label: ch.channel_name })))
    } catch (error) {
      console.error("Failed to fetch channels:", error)
    } finally {
      setChannelsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  if (channelsLoading) {
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

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">素材库</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 size-4" />
          上传素材
        </Button>
      </div>

      <MaterialLibraryList
        channels={channels}
        onNotification={showNotification}
        onRefresh={fetchChannels}
      />

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        channels={channels}
        onNotification={showNotification}
        onSuccess={fetchChannels}
      />
    </div>
  )
}
