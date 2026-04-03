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
import { Loader2, Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { uploadFileToOss, getVideoDuration, buildOssPath } from "@/lib/oss-upload"
import type {
  PrecheckItem,
  PrecheckResult,
  PendingFile,
} from "@/lib/types/material"
import type { ApiResponse } from "@/lib/types/drama"

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  channels: { id: number; name: string; label: string }[]
  languages: { id: number; name: string; label: string }[]
  onNotification: (message: string, type: NotificationType) => void
  onSuccess: () => void
}

const ACCEPTED_VIDEO_TYPES = ".mp4,.mov,.avi,.mkv,.webm"

export function UploadDialog({ open, onOpenChange, channels, languages, onNotification, onSuccess }: UploadDialogProps) {
  const [channel, setChannel] = React.useState("")
  const [language, setLanguage] = React.useState("")
  const [files, setFiles] = React.useState<PendingFile[]>([])
  const [uploading, setUploading] = React.useState(false)
  const [showOverride, setShowOverride] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 弹窗打开时彻底重置状态
  React.useEffect(() => {
    if (open) {
      setFiles([])
      setChannel("")
      setLanguage("")
      setShowOverride(false)
    }
  }, [open])

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    if (!channel) {
      onNotification("请先选择渠道", "error")
      return
    }
    if (!language) {
      onNotification("请先选择语言", "error")
      return
    }

    const newFiles: PendingFile[] = []
    for (const file of Array.from(fileList)) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext || '')) {
        onNotification(`文件 ${file.name} 不是支持的视频格式`, "error")
        continue
      }
      try {
        const duration = await getVideoDuration(file)
        newFiles.push({
          file,
          name: file.name,
          channel,
          language,
          duration_seconds: duration,
          status: 'pending',
        })
      } catch {
        onNotification(`文件 ${file.name} 无法读取时长`, "error")
      }
    }
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePrecheck = async () => {
    if (files.length === 0) return
    setUploading(true)
    try {
      const items: PrecheckItem[] = files.map((f) => ({
        name: f.name,
        channel: f.channel,
        language: f.language,
      }))
      const result = await apiClient.post<ApiResponse<PrecheckResult[]>>(
        "/materialLibrary/precheck-upload",
        { items }
      )
      const results = result.response

      const hasExists = results.some((r) => r.exists)
      if (hasExists) {
        setShowOverride(true)
        setFiles((prev) =>
          prev.map((f) => {
            const match = results.find(
              (r) => r.name === f.name && r.channel === f.channel && r.language === f.language
            )
            if (match?.exists) {
              return { ...f, status: 'exists', message: match.message }
            }
            return { ...f, status: 'prechecked' }
          })
        )
      } else {
        await doUpload()
      }
    } catch (error: any) {
      onNotification(error.message || "预检查失败", "error")
    } finally {
      setUploading(false)
    }
  }

  const doUpload = async () => {
    setUploading(true)
    setShowOverride(false)
    let successCount = 0
    let failCount = 0

    const filesToUpload = files.filter((f) => f.status !== 'error')

    for (let i = 0; i < filesToUpload.length; i++) {
      const f = filesToUpload[i]
      setFiles((prev) =>
        prev.map((item, idx) =>
          item === f ? { ...item, status: 'uploading' } : item
        )
      )

      try {
        // 构建 OSS 路径：material/{channel}/{language}/{filename}
        const ossPath = buildOssPath(f.channel, f.language, f.name)

        // 上传到 OSS
        await uploadFileToOss(f.file, ossPath)

        // 写入元数据
        await apiClient.post("/materialLibrary/upload", {
          name: f.name,
          channel: f.channel,
          language: f.language,
          duration_seconds: f.duration_seconds,
          oss: ossPath,
        })

        setFiles((prev) =>
          prev.map((item) =>
            item === f ? { ...item, status: 'success' } : item
          )
        )
        successCount++
      } catch (error: any) {
        setFiles((prev) =>
          prev.map((item) =>
            item === f ? { ...item, status: 'error', message: error.message } : item
          )
        )
        failCount++
      }
    }

    setUploading(false)
    if (failCount === 0) {
      onNotification(`上传完成，成功 ${successCount} 个`, "success")
      handleClose()
      onSuccess()
    } else {
      onNotification(`上传完成，成功 ${successCount} 个，失败 ${failCount} 个`, "error")
    }
  }

  const handleClose = () => {
    if (uploading) return
    onOpenChange(false)
  }

  const hasPending = files.some((f) => f.status === 'pending' || f.status === 'prechecked' || f.status === 'exists')
  const allDone = files.length > 0 && files.every((f) => f.status === 'success' || f.status === 'error')

  const statusIcon = (status: PendingFile['status']) => {
    switch (status) {
      case 'pending': return <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
      case 'prechecked': return <CheckCircle className="size-4 text-blue-500" />
      case 'exists': return <AlertCircle className="size-4 text-yellow-500" />
      case 'uploading': return <Loader2 className="size-4 animate-spin text-blue-500" />
      case 'success': return <CheckCircle className="size-4 text-green-500" />
      case 'error': return <AlertCircle className="size-4 text-red-500" />
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col"
          onInteractOutside={(e) => { if (uploading) e.preventDefault() }}>
          <DialogHeader>
            <DialogTitle>上传素材</DialogTitle>
            <DialogDescription>选择渠道和语言后，添加视频文件进行上传</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 flex-1 overflow-y-auto">
            {/* 渠道和语言选择 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  渠道 <span className="text-red-500">*</span>
                </Label>
                <Select value={channel} onValueChange={setChannel} disabled={uploading}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择渠道" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map((ch) => (
                      <SelectItem key={ch.id} value={ch.name}>
                        {ch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  语言 <span className="text-red-500">*</span>
                </Label>
                <Select value={language} onValueChange={setLanguage} disabled={uploading}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择语言" />
                  </SelectTrigger>
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

            {/* 文件选择 */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                点击或拖拽文件到此区域
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持 .mp4 .mov .avi .mkv .webm 格式
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_VIDEO_TYPES}
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>

            {/* 文件列表 */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">待上传文件 ({files.length})</div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-sm">
                      {statusIcon(f.status)}
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {f.duration_seconds}秒
                      </span>
                      {!uploading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleRemoveFile(idx)}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                      {f.message && f.status === 'error' && (
                        <span className="text-xs text-red-500 truncate max-w-32" title={f.message}>
                          {f.message}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            {allDone ? (
              <Button onClick={handleClose}>完成</Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleClose} disabled={uploading}>
                  取消
                </Button>
                <Button
                  onClick={handlePrecheck}
                  disabled={uploading || !hasPending || files.length === 0}
                >
                  {uploading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 size-4" />
                  )}
                  {uploading ? "上传中..." : "开始上传"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 覆盖确认弹窗 */}
      <Dialog open={showOverride} onOpenChange={(open) => { if (!uploading) setShowOverride(open) }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>文件覆盖确认</DialogTitle>
            <DialogDescription>
              以下文件已存在，继续上传将覆盖原有文件。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {files
              .filter((f) => f.status === 'exists')
              .map((f, idx) => (
                <div key={idx} className="text-sm px-2 py-1 rounded bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertCircle className="inline size-3 text-yellow-500 mr-1" />
                  {f.name}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverride(false)} disabled={uploading}>
              取消
            </Button>
            <Button onClick={doUpload}>
              确认覆盖并上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
