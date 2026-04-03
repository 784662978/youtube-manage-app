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
import type { MaterialLanguage, CreateMaterialLanguageParams, UpdateMaterialLanguageParams } from "@/lib/types/material"

interface MaterialLanguageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  language: MaterialLanguage | null
  onNotification: (message: string, type: NotificationType) => void
  onSuccess: () => void
}

interface FormErrors {
  language_code?: string
  language_name?: string
}

export function MaterialLanguageFormDialog({ open, onOpenChange, language, onNotification, onSuccess }: MaterialLanguageFormDialogProps) {
  const isEdit = !!language
  const [languageCode, setLanguageCode] = React.useState("")
  const [languageName, setLanguageName] = React.useState("")
  const [sortOrder, setSortOrder] = React.useState(0)
  const [isEnabled, setIsEnabled] = React.useState(1)
  const [errors, setErrors] = React.useState<FormErrors>({})
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (language) {
      setLanguageCode(language.language_code)
      setLanguageName(language.language_name)
      setSortOrder(language.sort_order)
      setIsEnabled(language.is_enabled)
    } else {
      setLanguageCode("")
      setLanguageName("")
      setSortOrder(0)
      setIsEnabled(1)
    }
    setErrors({})
  }, [language, open])

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!languageCode.trim()) {
      newErrors.language_code = "语言编码不能为空"
    } else if (languageCode.length > 50) {
      newErrors.language_code = "语言编码不能超过50个字符"
    }
    if (!languageName.trim()) {
      newErrors.language_name = "语言名称不能为空"
    } else if (languageName.length > 50) {
      newErrors.language_name = "语言名称不能超过50个字符"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      if (isEdit && language) {
        const body: UpdateMaterialLanguageParams = {
          language_name: languageName.trim(),
          sort_order: sortOrder,
          is_enabled: isEnabled,
        }
        await apiClient.post(`/materialLanguage/update/${language.id}`, body)
        onNotification("语言更新成功", "success")
      } else {
        const body: CreateMaterialLanguageParams = {
          language_code: languageCode.trim(),
          language_name: languageName.trim(),
          sort_order: sortOrder,
          is_enabled: isEnabled,
        }
        await apiClient.post("/materialLanguage/create", body)
        onNotification("语言创建成功", "success")
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
          <DialogTitle>{isEdit ? "编辑语言" : "新增语言"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改语言信息（语言编码不可修改）" : "创建一个新的素材语言"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="language-code">
                语言编码 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="language-code"
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                placeholder="请输入语言编码，如 en"
                disabled={saving || isEdit}
                maxLength={50}
                className={errors.language_code ? "border-red-500" : ""}
              />
              {errors.language_code && (
                <span className="text-xs text-red-500">{errors.language_code}</span>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="language-name">
                语言名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="language-name"
                value={languageName}
                onChange={(e) => setLanguageName(e.target.value)}
                placeholder="请输入语言名称，如 英语"
                disabled={saving}
                maxLength={50}
                className={errors.language_name ? "border-red-500" : ""}
              />
              {errors.language_name && (
                <span className="text-xs text-red-500">{errors.language_name}</span>
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
