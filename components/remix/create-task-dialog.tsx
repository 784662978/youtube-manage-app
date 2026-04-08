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
import { TimeInput } from "@/components/ui/time-input"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type {
  CreateRemixTaskItem,
  CreateRemixTaskResponse,
  MaterialItem,
} from "@/lib/types/material"
import type { ApiResponse, PageResponse } from "@/lib/types/drama"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channels: { id: number; name: string; label: string }[]
  languages: { id: number; name: string; label: string }[]
  onNotification: (message: string, type: NotificationType) => void
  onSuccess: () => void
}

interface TaskRow {
  head_material_id: number
  start_trim_seconds: string
  end_trim_seconds: string
  highlight_start_seconds: string
  highlight_end_seconds: string
  target_min_minutes: string
  target_max_minutes: string
}

interface FormErrors {
  items?: { [index: number]: string }
  _form?: string
}

const emptyRow = (): TaskRow => ({
  head_material_id: 0,
  start_trim_seconds: "",
  end_trim_seconds: "",
  highlight_start_seconds: "",
  highlight_end_seconds: "",
  target_min_minutes: "",
  target_max_minutes: "",
})

export function CreateTaskDialog({ open, onOpenChange, channels, languages, onNotification, onSuccess }: CreateTaskDialogProps) {
  const [channel, setChannel] = React.useState("")
  const [language, setLanguage] = React.useState("")
  const [materials, setMaterials] = React.useState<MaterialItem[]>([])
  const [rows, setRows] = React.useState<TaskRow[]>([emptyRow()])
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [saving, setSaving] = React.useState(false)
  const [materialsLoading, setMaterialsLoading] = React.useState(false)

  // 弹窗打开时彻底重置状态
  React.useEffect(() => {
    if (open) {
      setRows([emptyRow()])
      setChannel("")
      setLanguage("")
      setMaterials([])
      setErrors({})
    }
  }, [open])

  const fetchMaterials = React.useCallback(async () => {
    if (!channel || !language) { setMaterials([]); return }
    setMaterialsLoading(true)
    try {
      const result = await apiClient.get<ApiResponse<PageResponse<MaterialItem>>>(
        "/materialLibrary/list",
        { page: "1", page_size: "200", channel, language }
      )
      setMaterials(result.response.data || [])
    } catch { setMaterials([]) }
    finally { setMaterialsLoading(false) }
  }, [channel, language])

  React.useEffect(() => { fetchMaterials() }, [fetchMaterials])

  const handleAddRow = () => {
    setRows((prev) => [...prev, emptyRow()])
  }

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof TaskRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    let valid = true

    rows.forEach((row, idx) => {
      const rowErrors: string[] = []
      if (!row.head_material_id) rowErrors.push("首视频不能为空")
      if (!row.target_min_minutes || Number(row.target_min_minutes) <= 0) rowErrors.push("最短时长需大于0")
      if (!row.target_max_minutes || Number(row.target_max_minutes) <= 0) rowErrors.push("最长时长需大于0")
      if (
        row.target_min_minutes && row.target_max_minutes &&
        Number(row.target_min_minutes) >= Number(row.target_max_minutes)
      ) {
        rowErrors.push("最短时长需小于最长时长")
      }

      const hlStart = row.highlight_start_seconds ? Number(row.highlight_start_seconds) : null
      const hlEnd = row.highlight_end_seconds ? Number(row.highlight_end_seconds) : null
      if ((hlStart !== null) !== (hlEnd !== null)) {
        rowErrors.push("高光起点和终点需同时填写或同时留空")
      }
      if (hlStart !== null && hlEnd !== null && hlStart >= hlEnd) {
        rowErrors.push("高光起点需小于终点")
      }

      if (rowErrors.length > 0) {
        newErrors.items = { ...(newErrors.items || {}), [idx]: rowErrors.join("; ") }
        valid = false
      }
    })

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      const items: CreateRemixTaskItem[] = rows.map((row) => ({
        head_material_id: row.head_material_id,
        start_trim_seconds: row.start_trim_seconds ? Number(row.start_trim_seconds) : undefined,
        end_trim_seconds: row.end_trim_seconds ? Number(row.end_trim_seconds) : undefined,
        highlight_start_seconds: row.highlight_start_seconds ? Number(row.highlight_start_seconds) : null,
        highlight_end_seconds: row.highlight_end_seconds ? Number(row.highlight_end_seconds) : null,
        target_min_minutes: Number(row.target_min_minutes),
        target_max_minutes: Number(row.target_max_minutes),
      }))

      const result = await apiClient.post<ApiResponse<CreateRemixTaskResponse>>(
        "/materialRemixTask/create",
        { items }
      )

      const count = result.response.task_ids.length
      onNotification(`成功创建 ${count} 个混剪任务`, "success")
      handleClose()
      onSuccess()
    } catch (error: any) {
      onNotification(error.message || "创建任务失败", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (saving) return
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o) }}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col"
        onInteractOutside={(e) => { if (saving) e.preventDefault() }}>
        <DialogHeader>
          <DialogTitle>创建混剪任务</DialogTitle>
          <DialogDescription>为每个首视频设置裁剪参数，可添加多个任务行</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 py-2 flex-1 overflow-y-auto min-h-0">
            {/* 渠道和语言 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  渠道 <span className="text-red-500">*</span>
                </Label>
                <Select value={channel} onValueChange={setChannel} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="选择渠道" /></SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.name}>{ch.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  语言 <span className="text-red-500">*</span>
                </Label>
                <Select value={language} onValueChange={setLanguage} disabled={saving}>
                  <SelectTrigger><SelectValue placeholder="选择语言" /></SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.name}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 任务行 */}
            {rows.map((row, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">任务 #{idx + 1}</span>
                  {rows.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => handleRemoveRow(idx)}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>

                {errors.items?.[idx] && (
                  <p className="text-xs text-red-500">{errors.items[idx]}</p>
                )}

                {/* 首视频选择 */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    首视频素材 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={row.head_material_id ? String(row.head_material_id) : ""}
                    onValueChange={(v) => updateRow(idx, "head_material_id", v)}
                    disabled={!channel || !language || materialsLoading || saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={materialsLoading ? "加载中..." : materials.length === 0 ? "无可用素材" : "选择首视频"} />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={String(m.id)}>
                          {m.name} ({m.duration_seconds}秒)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 裁剪参数 */}
                <div className="grid grid-cols-2 gap-3">
                  <TimeInput
                    value={row.start_trim_seconds ? Number(row.start_trim_seconds) : undefined}
                    onChange={(v) => updateRow(idx, "start_trim_seconds", v !== undefined ? String(v) : "")}
                    label="开头跳过"
                    placeholder="00:00:00"
                    disabled={saving}
                  />
                  <TimeInput
                    value={row.end_trim_seconds ? Number(row.end_trim_seconds) : undefined}
                    onChange={(v) => updateRow(idx, "end_trim_seconds", v !== undefined ? String(v) : "")}
                    label="结尾跳过"
                    placeholder="00:00:00"
                    disabled={saving}
                  />
                </div>

                {/* 高光区间 */}
                <div className="grid grid-cols-2 gap-3">
                  <TimeInput
                    value={row.highlight_start_seconds ? Number(row.highlight_start_seconds) : null}
                    onChange={(v) => updateRow(idx, "highlight_start_seconds", v !== undefined && v !== null ? String(v) : "")}
                    label="高光起点"
                    placeholder="留空不设置"
                    disabled={saving}
                  />
                  <TimeInput
                    value={row.highlight_end_seconds ? Number(row.highlight_end_seconds) : null}
                    onChange={(v) => updateRow(idx, "highlight_end_seconds", v !== undefined && v !== null ? String(v) : "")}
                    label="高光终点"
                    placeholder="留空不设置"
                    disabled={saving}
                  />
                </div>

                {/* 目标时长 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      最短时长（分钟）<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.target_min_minutes}
                      onChange={(e) => updateRow(idx, "target_min_minutes", e.target.value)}
                      placeholder="60"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      最长时长（分钟）<span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={row.target_max_minutes}
                      onChange={(e) => updateRow(idx, "target_max_minutes", e.target.value)}
                      placeholder="120"
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>
            ))}

            {errors._form && (
              <p className="text-xs text-red-500">{errors._form}</p>
            )}

            <Button type="button" variant="outline" size="sm" onClick={handleAddRow} disabled={saving}>
              <Plus className="mr-2 size-4" />
              添加任务行
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
              取消
            </Button>
            <Button type="submit" disabled={saving || !channel || !language}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              创建任务
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
