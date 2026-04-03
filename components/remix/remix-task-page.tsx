"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { Notification, NotificationType } from "@/components/ui/notification"
import { Loader2 } from "lucide-react"
import { RemixTaskList, RemixTaskListRef } from "./remix-task-list"
import { CreateTaskDialog } from "./create-task-dialog"
import { EditTaskDialog } from "./edit-task-dialog"
import type { MaterialChannel, MaterialLanguage, RemixTask } from "@/lib/types/material"
import type { ApiResponse } from "@/lib/types/drama"

export function RemixTaskPage() {
  const [channels, setChannels] = React.useState<{ id: number; name: string; label: string }[]>([])
  const [languages, setLanguages] = React.useState<{ id: number; name: string; label: string }[]>([])
  const [channelsLoading, setChannelsLoading] = React.useState(true)
  const taskListRef = React.useRef<RemixTaskListRef>(null)

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
      const [channelResult, languageResult] = await Promise.all([
        apiClient.get<ApiResponse<MaterialChannel[]>>("/materialChannel/list"),
        apiClient.get<ApiResponse<MaterialLanguage[]>>("/materialLanguage/list"),
      ])
      setChannels((channelResult.response || []).map((ch) => ({ id: ch.id, name: ch.channel_code, label: ch.channel_name })))
      setLanguages((languageResult.response || []).map((lang) => ({ id: lang.id, name: lang.language_code, label: lang.language_name })))
    } catch (error) {
      console.error("Failed to fetch channels/languages:", error)
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
        ref={taskListRef}
        channels={channels}
        languages={languages}
        onNotification={showNotification}
        onCreateTask={() => setCreateOpen(true)}
        onEditTask={(task) => setEditTask(task)}
      />

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        channels={channels}
        languages={languages}
        onNotification={showNotification}
        onSuccess={() => taskListRef.current?.refresh()}
      />

      {editTask && (
        <EditTaskDialog
          open={!!editTask}
          onOpenChange={(open) => { if (!open) setEditTask(null) }}
          task={editTask}
          onNotification={showNotification}
          onSuccess={() => taskListRef.current?.refresh()}
        />
      )}
    </div>
  )
}
