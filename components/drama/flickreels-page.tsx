"use client"

import * as React from "react"
import { Notification, NotificationType } from "@/components/ui/notification"
import { FlickreelsVideoList } from "./flickreels-video-list"

export function FlickreelsPage() {
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    visible: boolean
  }>({ message: "", type: "success", visible: false })

  const showNotification = React.useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type, visible: true })
  }, [])

  return (
    <div className="container mx-auto py-10 space-y-4">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.visible}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <h1 className="text-2xl font-bold tracking-tight">FlickReels 选剧</h1>

      <FlickreelsVideoList onNotification={showNotification} />
    </div>
  )
}
