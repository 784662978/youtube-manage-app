"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { Notification, NotificationType } from "@/components/ui/notification"
import { Loader2 } from "lucide-react"
import { RemixTaskList } from "./remix-task-list"
import { CreateTaskDialog } from "./create-task-dialog"
import { EditTaskDialog } from "./edit-task-dialog"
import type { MaterialChannel, RemixTask } from "@/lib/types/material"
import type { ApiResponse } from "@/lib/types/drama"

export function RemixTaskPage() {
  const [channels, setChannels] = React.useState<{ id: number; name: string; label: string }[]>([])
  const [channelsLoading, setChannelsLoading] = React.useState(true)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editTask, setEditTask] = React.useState<RemixTask | null>(null)

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

  React.useEffect(() => { fetchChannels() }, [fetchChannels])

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

      <h1 className="text-2xl font-bold tracking-tight">混剪任务</h1>

      <RemixTaskList
        channels={channels}
        onNotification={showNotification}
        onCreateTask={() => setCreateOpen(true)}
        onEditTask={(task) => setEditTask(task)}
        onRefresh={fetchChannels}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        channels={channels}
        onNotification={showNotification}
        onSuccess={fetchChannels}
      />

      {editTask && (
        <EditTaskDialog
          open={!!editTask}
          onOpenChange={(open) => { if (!open) setEditTask(null) }}
          task={editTask}
          onNotification={showNotification}
          onSuccess={fetchChannels}
        />
      )}
    </div>
  )
}
