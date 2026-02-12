"use client"

import * as React from "react"
import { Loader } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"
import { MonitorChannel } from "./monitor-table"

interface EditChannelModalProps {
  channel: MonitorChannel | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onNotification: (message: string, type: NotificationType) => void
}

export function EditChannelModal({ 
  channel, 
  open, 
  onOpenChange, 
  onSuccess, 
  onNotification 
}: EditChannelModalProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [channelName, setChannelName] = React.useState("")
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (channel) {
      setChannelName(channel.channel_name)
      setError("")
    }
  }, [channel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!channel) return

    if (!channelName.trim()) {
      setError("频道名称不能为空")
      return
    }

    if (channelName.length > 50) {
        setError("频道名称不能超过50个字符")
        return
    }

    setIsLoading(true)

    try {
      await apiClient.put(`/monitorChannel/${channel.id}`, { channel_name: channelName })

      onNotification("修改监控频道成功", "success")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      console.error("Failed to update monitor channel:", error)
      onNotification(error.message || "修改监控频道失败", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (isLoading && !newOpen) return
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
        if (isLoading) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle>修改监控频道</DialogTitle>
          <DialogDescription>
            修改频道名称。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_channel_name">
                频道名称
              </Label>
              <Input
                id="edit_channel_name"
                value={channelName}
                onChange={(e) => {
                    setChannelName(e.target.value)
                    if(error) setError("")
                }}
                placeholder="请输入频道名称"
                disabled={isLoading}
                maxLength={50}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <span className="text-xs text-red-500">{error}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              确认
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
