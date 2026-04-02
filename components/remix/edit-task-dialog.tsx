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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import type { RemixTask, EditRemixTaskParams } from "@/lib/types/material"
import type { ApiResponse } from "@/lib/types/drama"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: RemixTask | null
  onNotification: (message: string, type: NotificationType) => void
  onSuccess: () => void
}

interface FormErrors {
  target_min_minutes?: string
  target_max_minutes?: string
  highlight?: string
}

export function EditTaskDialog({ open, onOpenChange, task, onNotification, onSuccess }: EditTaskDialogProps) {
  const [startTrim, setStartTrim] = React.useState("")
  const [endTrim, setEndTrim] = React.useState("")
  const [hlStart, setHlStart] = React.useState("")
  const [hlEnd, setHlEnd] = React.useState("")
  const [targetMin, setTargetMin] = React.useState("")
  const [targetMax, setTargetMax] = React.useState("")
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (task) {
      setStartTrim(task.start_trim_seconds ? String(task.start_trim_seconds) : "")
      setEndTrim(task.end_trim_seconds ? String(task.end_trim_seconds) : "")
      setHlStart(task.highlight_start_seconds != null ? String(task.highlight_start_seconds) : "")
      setHlEnd(task.highlight_end_seconds != null ? String(task.highlight_end_seconds) : "")
      setTargetMin(String(task.target_min_minutes))
      setTargetMax(String(task.target_max_minutes))
    }
    setErrors({})
  }, [task, open])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!targetMin || Number(targetMin) <= 0) newErrors.target_min_minutes = "最短时长需大于0"
    if (!targetMax || Number(targetMax) <= 0) newErrors.target_max_minutes = "最长时长需大于0"
    if (targetMin && targetMax && Number(targetMin) >= Number(targetMax)) {
      newErrors.target_max_minutes = "最短时长需小于最长时长"
    }

    const hlS = hlStart ? Number(hlStart) : null
    const hlE = hlEnd ? Number(hlEnd) : null
    if ((hlS !== null) !== (hlE !== null)) {
      newErrors.highlight = "高光起点和终点需同时填写或同时留空"
    } else if (hlS !== null && hlE !== null && hlS >= hlE) {
      newErrors.highlight = "高光起点需小于终点"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !validate()) return

    setSaving(true)
    try {
      const body: EditRemixTaskParams = {
        start_trim_seconds: startTrim ? Number(startTrim) : undefined,
        end_trim_seconds: endTrim ? Number(endTrim) : undefined,
        highlight_start_seconds: hlStart ? Number(hlStart) : null,
        highlight_end_seconds: hlEnd ? Number(hlEnd) : null,
        target_min_minutes: Number(targetMin),
        target_max_minutes: Number(targetMax),
      }

      await apiClient.post(`/materialRemixTask/edit/${task.id}`, body)
      onNotification("任务更新成功", "success")
      onOpenChange(false)
      onSuccess()
    } catch (error: any) {
      onNotification(error.message || "更新失败", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[500px]"
        onInteractOutside={(e) => { if (saving) e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>编辑混剪任务</DialogTitle>
          <DialogDescription>
            任务 #{task?.id}，首视频素材 ID: {task?.head_material_id}（不可修改）
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">开头跳过（秒）</Label>
                <Input
                  type="number"
                  min="0"
                  value={startTrim}
                  onChange={(e) => setStartTrim(e.target.value)}
                  placeholder="0"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">结尾跳过（秒）</Label>
                <Input
                  type="number"
                  min="0"
                  value={endTrim}
                  onChange={(e) => setEndTrim(e.target.value)}
                  placeholder="0"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">高光起点（秒）</Label>
                <Input
                  type="number"
                  min="0"
                  value={hlStart}
                  onChange={(e) => setHlStart(e.target.value)}
                  placeholder="留空表示不设置"
                  disabled={saving}
                  className={errors.highlight ? "border-red-500" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">高光终点（秒）</Label>
                <Input
                  type="number"
                  min="0"
                  value={hlEnd}
                  onChange={(e) => setHlEnd(e.target.value)}
                  placeholder="留空表示不设置"
                  disabled={saving}
                  className={errors.highlight ? "border-red-500" : ""}
                />
              </div>
            </div>
            {errors.highlight && (
              <p className="text-xs text-red-500">{errors.highlight}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  最短时长（分钟）<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={targetMin}
                  onChange={(e) => setTargetMin(e.target.value)}
                  disabled={saving}
                  className={errors.target_min_minutes ? "border-red-500" : ""}
                />
                {errors.target_min_minutes && (
                  <p className="text-xs text-red-500">{errors.target_min_minutes}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  最长时长（分钟）<span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={targetMax}
                  onChange={(e) => setTargetMax(e.target.value)}
                  disabled={saving}
                  className={errors.target_max_minutes ? "border-red-500" : ""}
                />
                {errors.target_max_minutes && (
                  <p className="text-xs text-red-500">{errors.target_max_minutes}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
