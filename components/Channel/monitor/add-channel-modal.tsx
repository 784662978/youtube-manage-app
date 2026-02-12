"use client"

import * as React from "react"
import { Loader, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"

interface AddChannelModalProps {
  onSuccess: () => void
  onNotification: (message: string, type: NotificationType) => void
}

interface FormData {
  channel_name: string
  channel_id: string
  remark: string
}

interface FormErrors {
  channel_name?: string
  channel_id?: string
  remark?: string
}

export function AddChannelModal({ onSuccess, onNotification }: AddChannelModalProps) {
  const [open, setOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({
    channel_name: "",
    channel_id: "",
    remark: "",
  })
  const [errors, setErrors] = React.useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    let isValid = true

    if (!formData.channel_name.trim()) {
      newErrors.channel_name = "频道名称不能为空"
      isValid = false
    } else if (formData.channel_name.length > 50) {
      newErrors.channel_name = "频道名称不能超过50个字符"
      isValid = false
    }

    if (!formData.channel_id.trim()) {
      newErrors.channel_id = "频道ID不能为空"
      isValid = false
    } else if (formData.channel_id.length > 100) {
      newErrors.channel_id = "频道ID不能超过100个字符"
      isValid = false
    }

    if (formData.remark.length > 200) {
      newErrors.remark = "备注不能超过200个字符"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsLoading(true)

    try {
      await apiClient.post("/monitorChannel", formData)

      onNotification("添加监控频道成功", "success")
      setOpen(false)
      setFormData({
        channel_name: "",
        channel_id: "",
        remark: "",
      })
      onSuccess()
    } catch (error: any) {
      console.error("Failed to add monitor channel:", error)
      onNotification(error.message || "添加监控频道失败", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Only allow closing via UI interactions if not loading
    if (isLoading && !newOpen) return
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          添加监控频道
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
        // Prevent closing when clicking outside if loading
        if (isLoading) e.preventDefault();
      }}>
        <DialogHeader>
          <DialogTitle>添加监控频道</DialogTitle>
          <DialogDescription>
            请输入需要监控的频道信息。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="channel_name" className="required">
                频道名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="channel_name"
                value={formData.channel_name}
                onChange={(e) =>
                  setFormData({ ...formData, channel_name: e.target.value })
                }
                placeholder="请输入频道名称"
                disabled={isLoading}
                maxLength={50}
                className={errors.channel_name ? "border-red-500" : ""}
              />
              {errors.channel_name && (
                <span className="text-xs text-red-500">{errors.channel_name}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="channel_id">
                频道ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="channel_id"
                value={formData.channel_id}
                onChange={(e) =>
                  setFormData({ ...formData, channel_id: e.target.value })
                }
                placeholder="请输入频道ID"
                disabled={isLoading}
                maxLength={100}
                className={errors.channel_id ? "border-red-500" : ""}
              />
              {errors.channel_id && (
                <span className="text-xs text-red-500">{errors.channel_id}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remark">备注</Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
                placeholder="请输入备注信息（选填）"
                disabled={isLoading}
                maxLength={200}
                className={errors.remark ? "border-red-500" : ""}
              />
              {errors.remark && (
                <span className="text-xs text-red-500">{errors.remark}</span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              提交
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
