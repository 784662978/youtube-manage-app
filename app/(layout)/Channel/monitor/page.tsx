"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { MonitorTable, MonitorChannel } from "@/components/Channel/monitor/monitor-table"
import { AddChannelModal } from "@/components/Channel/monitor/add-channel-modal"
import { TrendingVideosModal } from "@/components/Channel/monitor/trending-videos-modal"
import { Notification, NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"

export default function MonitorChannelPage() {
  const [data, setData] = React.useState<MonitorChannel[]>([])
  const [loading, setLoading] = React.useState(true)
  const [trendingOpen, setTrendingOpen] = React.useState(false)
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    visible: boolean
  }>({
    message: "",
    type: "success", // Default type
    visible: false,
  })

  const showNotification = React.useCallback((message: string, type: NotificationType) => {
    setNotification({
      message,
      type,
      visible: true,
    })
  }, [])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const { response } = await apiClient.get<{
        response: MonitorChannel[]
      }>("/monitorChannel")
      
      setData(response)
    } catch (error) {
      console.error("Failed to fetch monitor channels:", error)
      showNotification("获取数据失败，请稍后重试", "error")
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="container mx-auto py-10 space-y-4">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.visible}
        onClose={() => setNotification(prev => ({ ...prev, visible: false }))}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">监控频道管理</h1>
        <div className="flex items-center gap-2">
          <AddChannelModal 
              onSuccess={fetchData} 
              onNotification={showNotification}
          />
          <Button onClick={() => setTrendingOpen(true)} variant="outline">
            <Video className="mr-2 h-4 w-4" />
            查看热门剧
          </Button>
        </div>
      </div>

      <TrendingVideosModal
        open={trendingOpen}
        onOpenChange={setTrendingOpen}
        onNotification={showNotification}
      />

      <MonitorTable 
        data={data} 
        isLoading={loading} 
        onSuccess={fetchData}
        onNotification={showNotification}
      />
    </div>
  )
}
