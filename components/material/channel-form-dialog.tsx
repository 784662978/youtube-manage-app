"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { MaterialChannel, CreateChannelParams, UpdateChannelParams } from "@/lib/types/material"
import type { ApiResponse } from "@/lib/types/drama"

interface ChannelFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channel: MaterialChannel | null
  onNotification: (message: string, type: NotificationType) => void
  onSuccess: () => void
}

interface FormErrors {
  channel_code?: string
  channel_name?: string
}

export function ChannelFormDialog({ open, onOpenChange, channel, onNotification, onSuccess }: ChannelFormDialogProps) {
  const isEdit = !!channel
  const [channelCode, setChannelCode] = React.useState("")
  const [channelName, setChannelName] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState(0)
  const [isEnabled, setIsEnabled] = React.useState(1)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (channel) {
      setChannelCode(channel.channel_code)
      setChannelName(channel.channel_name)
      setSortOrder(channel.sort_order)
      setIsEnabled(channel.is_enabled)
    } else {
      setChannelCode("")
      setChannelName("")
      setSortOrder(0)
      setIsEnabled(1)
    }
    setErrors({})
  }, [channel, open])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!channelCode.trim()) {
      newErrors.channel_code = "渠道编码不能为空"
    } else if (channelCode.length > 50) {
      newErrors.channel_code = "渠道编码不能超过50个字符"
    }
    if (!channelName.trim()) {
      newErrors.channel_name = "渠道名称不能为空"
    } else if (channelName.length > 50) {
      newErrors.channel_name = "渠道名称不能超过50个字符"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (isEdit && channel) {
        const body: UpdateChannelParams = {
          channel_name: channelName.trim(),
          sort_order: sortOrder,
          is_enabled: isEnabled,
        }
        await apiClient.post(`/materialChannel/update/${channel.id}`, body)
        onNotification("渠道更新成功", "success")
      } else {
        const body: CreateChannelParams = {
          channel_code: channelCode.trim(),
          channel_name: channelName.trim(),
          sort_order: sortOrder,
          is_enabled: isEnabled,
        }
        await apiClient.post("/materialChannel/create", body)
        onNotification("渠道创建成功", "success")
      }

      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      onNotification(error.message || (isEdit ? "更新失败" : "创建失败"), "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[425px]"
        onInteractOutside={(e) => { if (saving) e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑渠道" : "新增渠道"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改渠道信息（渠道编码不可修改）" : "创建一个新的素材渠道"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="channel-code">
                渠道编码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="channel-code"
                value={channelCode}
                onChange={(e) => setChannelCode(e.target.value)}
                placeholder="请输入渠道编码，如 reelshort"
                disabled={saving || isEdit}
                maxLength={50}
                className={errors.channel_code ? "border-red-500" : ""}
              />
              {errors.channel_code && (
                <span className="text-xs text-red-500">{errors.channel_code}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="channel-name">
                渠道名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="请输入渠道名称，如 ReelShort"
                disabled={saving}
                maxLength={50}
                className={errors.channel_name ? "border-red-500" : ""}
              />
              {errors.channel_name && (
                <span className="text-xs text-red-500">{errors.channel_name}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sort-order">排序</Label>
              <Input
                id="sort-order"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                disabled={saving}
                min={0}
              />
            </div>
            <div className="grid gap-2">
              <Label>状态</Label>
              <Select value={String(isEnabled)} onValueChange={(v) => setIsEnabled(Number(v))} disabled={saving}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEdit ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
