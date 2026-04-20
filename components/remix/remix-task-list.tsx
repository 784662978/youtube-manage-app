"use client"

import * as React from "react"
import { useImperativeHandle } from "react"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MoreHorizontal,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  Download,
  AlertTriangle,
  FileText,
  Play,
  CheckCircle2,
  RotateCcw,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type {
  RemixTask,
  RemixTaskStatus,
  RemixTaskListParams,
} from "@/lib/types/material"
import type { ApiResponse, PageResponse } from "@/lib/types/drama"
import type { UseDownloadManagerReturn } from "@/hooks/use-download-manager"
import dayjs from "dayjs"

interface RemixTaskListProps {
  channels: { id: number; name: string; label: string }[]
  languages: { id: number; name: string; label: string }[]
  onNotification: (message: string, type: NotificationType) => void
  onCreateTask: () => void
  onEditTask: (task: RemixTask) => void
  downloadManager: UseDownloadManagerReturn
  onOpenDownloadPanel: () => void
}

export interface RemixTaskListRef {
  refresh: () => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100]

/** 导出 Excel 列定义及字段映射 */
const EXPORT_COLUMNS = [
  { key: 'drama_key', label: 'drama_key' },
  { key: 'content_code', label: 'content_code' },
  { key: 'external_code', label: 'external_code' },
  { key: 'drama_name', label: 'drama_name', source: 'head_material_name_without_suffix' },
  { key: 'cover_url', label: 'cover_url' },
  { key: 'source_lang', label: 'source_lang', source: 'language' },
  { key: 'copyright', label: 'channel', source: 'channel' },
  { key: 'copyright_expire', label: 'copyright_expire', default: '2099-1-1' },
  { key: 'level', label: 'level', default: 'A' },
  { key: 'total_episodes', label: 'total_episodes' },
  { key: 'tags', label: 'tags' },
  { key: 'summary', label: 'summary' },
  { key: 'highlights', label: 'highlights' },
  { key: 'created_at', label: 'created_at' },
  { key: 'target_lang', label: 'target_lang', source: 'target_lang' },
  { key: 'merged_url', label: 'merged_url', source: 'result_oss' },
  { key: 'skip_transfer', label: 'skip_transfer', default: 'TRUE' },
  { key: 'merged_subtitle_ref', label: 'merged_subtitle_ref' },
  { key: 'merged_subtitle_format', label: 'merged_subtitle_format' },
  { key: 'version_label', label: 'version_label', composite: ['channel', 'language'] as const },
  { key: 'delivery_mode', label: 'delivery_mode', default: 'mixed' },
] as const

const TASK_STATUS_BADGE: Record<RemixTaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待处理", variant: "outline" },
  waiting_material: { label: "等待素材处理", variant: "outline" },
  processing: { label: "处理中", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  failed: { label: "异常", variant: "destructive" },
}

const STATUS_OPTIONS: { value: RemixTaskStatus | ""; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待处理" },
  { value: "waiting_material", label: "等待素材处理" },
  { value: "processing", label: "处理中" },
  { value: "completed", label: "已完成" },
  { value: "failed", label: "异常" },
]

function generatePageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "ellipsis")[] = [1]
  if (current <= 4) {
    for (let i = 2; i <= Math.min(5, total - 1); i++) pages.push(i)
    if (total > 5) pages.push("ellipsis")
  } else if (current >= total - 3) {
    pages.push("ellipsis")
    for (let i = Math.max(2, total - 4); i <= total - 1; i++) pages.push(i)
  } else {
    pages.push("ellipsis")
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push("ellipsis")
  }
  if (total > 1) pages.push(total)
  return pages
}

export const RemixTaskList = React.forwardRef<RemixTaskListRef, RemixTaskListProps>(
  function RemixTaskListInner({ channels, languages, onNotification, onCreateTask, onEditTask, downloadManager, onOpenDownloadPanel }, ref) {
    const [data, setData] = React.useState<RemixTask[]>([])
    const [loading, setLoading] = React.useState(false)
    const [page, setPage] = React.useState(1)
    const [pageSize, setPageSize] = React.useState(20)
    const [pageCount, setPageCount] = React.useState(0)
    const [dataCount, setDataCount] = React.useState(0)

    const [status, setStatus] = React.useState<RemixTaskStatus | "">("")
    const [channel, setChannel] = React.useState("")
    const [language, setLanguage] = React.useState("")

    const [searchParams, setSearchParams] = React.useState({
      status: "" as RemixTaskStatus | "",
      channel: "",
      language: "",
    })

    const [expandedIds, setExpandedIds] = React.useState<Set<number>>(new Set())
    const [deleting, setDeleting] = React.useState(false)
    const [deleteTaskId, setDeleteTaskId] = React.useState<number | null>(null)

    const fetchData = React.useCallback(async () => {
      setLoading(true)
      try {
        const params: RemixTaskListParams = { page, page_size: pageSize }
        if (searchParams.status) params.status = searchParams.status
        if (searchParams.channel) params.channel = searchParams.channel
        if (searchParams.language) params.language = searchParams.language

        const result = await apiClient.get<ApiResponse<PageResponse<RemixTask>>>(
          "/materialRemixTask/list",
          params as Record<string, string>
        )
        const resp = result.response
        setData(resp.data || [])
        setPageCount(resp.pageCount)
        setDataCount(resp.dataCount)
      } catch (error) {
        console.error("Failed to fetch tasks:", error)
        onNotification("获取任务列表失败", "error")
      } finally {
        setLoading(false)
      }
    }, [page, pageSize, searchParams, onNotification])

    React.useEffect(() => { fetchData() }, [fetchData])

    useImperativeHandle(ref, () => ({ refresh: fetchData }), [fetchData])

    const handleSearch = () => {
      setSearchParams({ status, channel, language })
      setPage(1)
    }

    const handlePageSizeChange = (size: number) => { setPageSize(size); setPage(1) }

    const toggleExpand = (id: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }

    const doDelete = async (id: number) => {
      setDeleting(true)
      try {
        await apiClient.delete(`/materialRemixTask/${id}`)
        onNotification("任务删除成功", "success")
        fetchData()
      } catch (error: any) {
        onNotification(error.message || "删除失败", "error")
      } finally {
        setDeleting(false)
      }
    }

    const handleDelete = (id: number) => {
      setDeleteTaskId(id)
    }

    const [exporting, setExporting] = React.useState(false)
    const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())

    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)

    /** URL 显示最大字符数 */
    const URL_MAX_LENGTH = 40

    // 勾选逻辑
    const allSelected = data.length > 0 && data.every((t) => selectedIds.has(t.id))

    const toggleAll = () => {
      if (allSelected) {
        setSelectedIds(new Set())
      } else {
        setSelectedIds(new Set(data.map((t) => t.id)))
      }
    }

    const toggleSelect = (id: number) => {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }

    const handleExportExcel = async () => {
      if (selectedIds.size === 0) {
        onNotification("请先勾选需要导出的任务", "error")
        return
      }

      setExporting(true)
      try {
        const selectedTasks = data.filter((t) => selectedIds.has(t.id))

        if (selectedTasks.length === 0) {
          onNotification("没有可导出的任务", "error")
          return
        }

        // 构建导出数据
        const rows = selectedTasks.map((task) => {
          const row: Record<string, unknown> = {}
          for (const col of EXPORT_COLUMNS) {
            if ('composite' in col && col.composite) {
              const taskRecord = task as unknown as Record<string, unknown>
              const parts = col.composite.map((k) => taskRecord[k] ?? '')
              const value = parts.filter(Boolean).join('_')
              row[col.key] = value || ('default' in col ? col.default : '')
            } else if ('source' in col && col.source) {
              const value = (task as unknown as Record<string, unknown>)[col.source!]
              row[col.key] = value ?? ('default' in col ? col.default : '')
            } else {
              row[col.key] = 'default' in col ? col.default : ''
            }
          }
          return row
        })

        const headers = EXPORT_COLUMNS.map((c) => c.key)

        // CSV 转义：包含逗号/双引号/换行时用双引号包裹，内部双引号翻倍
        const escapeCSV = (val: unknown): string => {
          const str = String(val ?? '')
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }
        // 强制文本格式：避免 Excel 将长数字显示为科学计数法
        const escapeCSVAsText = (val: unknown): string => {
          const str = String(val ?? '')
          return `"\t${str.replace(/"/g, '""')}"`
        }

        // 拼接 CSV 内容
        const csvLines: string[] = []
        // 表头行
        csvLines.push(headers.map(escapeCSV).join(','))
        // 数据行：ID 列（第一个 key）用文本格式
        const idKey = headers[0]
        for (const row of rows) {
          csvLines.push(headers.map((h) => h === idKey ? escapeCSVAsText(row[h]) : escapeCSV(row[h])).join(','))
        }

        const csvContent = csvLines.join('\r\n')

        // 添加 UTF-8 BOM，确保 Excel 正确识别中文编码
        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })

        // 触发下载
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const now = new Date()
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
        a.download = `混剪任务_${dateStr}.csv`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 3000)

        onNotification(`成功导出 ${selectedTasks.length} 条任务`, "success")
      } catch (error: any) {
        onNotification(error.message || "导出失败", "error")
      } finally {
        setExporting(false)
      }
    }

    const [exportingDetail, setExportingDetail] = React.useState(false)

    const handleExportMaterialDetail = async () => {
      if (selectedIds.size === 0) {
        onNotification("请先勾选需要导出的任务", "error")
        return
      }

      setExportingDetail(true)
      try {
        const selectedTasks = data.filter((t) => selectedIds.has(t.id))

        if (selectedTasks.length === 0) {
          onNotification("没有可导出的任务", "error")
          return
        }

        const headers = ["合集", "首剧首剧名", "合集其他剧目", "创建时间", "更新时间"]
        const escapeCSV = (val: unknown): string => {
          const str = String(val ?? '')
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }
        const escapeCSVAsText = (val: unknown): string => {
          const str = String(val ?? '')
          return `"\t${str.replace(/"/g, '""')}"`
        }

        const csvLines: string[] = [headers.map(escapeCSV).join(',')]

        for (const task of selectedTasks) {
          const otherItems = task.items.filter((item) => item.material_id !== task.head_material_id)
          if (otherItems.length === 0) {
            csvLines.push([
              escapeCSVAsText(task.id),
              escapeCSV(task.head_material_name_without_suffix ?? ''),
              escapeCSV(''),
              escapeCSV(dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')?? ''),
              escapeCSV(dayjs(task.updated_at).format('YYYY-MM-DD HH:mm:ss') ?? '')
            ].join(','))
          } else {
            for (const item of otherItems) {
              csvLines.push([
                escapeCSVAsText(task.id),
                escapeCSV(task.head_material_name_without_suffix ?? ''),
                escapeCSV(item.material_name),
                escapeCSV(dayjs(task.created_at).format('YYYY-MM-DD HH:mm:ss')?? ''),
                escapeCSV(dayjs(task.updated_at).format('YYYY-MM-DD HH:mm:ss') ?? '')
              ].join(','))
            }
          }
        }

        const BOM = '\uFEFF'
        const blob = new Blob([BOM + csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const now = new Date()
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
        a.download = `素材明细_${dateStr}.csv`
        a.style.display = 'none'
        document.body.appendChild(a)
        a.click()
        setTimeout(() => {
          URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }, 3000)

        onNotification(`成功导出 ${selectedTasks.length} 条任务的素材明细`, "success")
      } catch (error: any) {
        onNotification(error.message || "导出失败", "error")
      } finally {
        setExportingDetail(false)
      }
    }

    const totalPages = pageCount || 1
    const pageNumbers = generatePageNumbers(page, totalPages)

    return (
      <div className="space-y-4">
        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground whitespace-nowrap">状态</span>
            <Select value={status || "__all__"} onValueChange={(v) => setStatus(v === "__all__" ? "" : (v as RemixTaskStatus))}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value || "__all__"} value={opt.value || "__all__"}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground whitespace-nowrap">渠道</span>
            <Select value={channel || "__all__"} onValueChange={(v) => { setChannel(v === "__all__" ? "" : v) }}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="全部渠道" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部渠道</SelectItem>
                {channels.map((ch) => (
                  <SelectItem key={ch.id} value={ch.name}>{ch.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground whitespace-nowrap">语言</span>
            <Select value={language || "__all__"} onValueChange={(v) => setLanguage(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="全部语言" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部语言</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.name}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button size="sm" onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
            搜索
          </Button>

          <Button size="sm" onClick={onCreateTask}>
            <Plus className="mr-2 size-4" />
            创建任务
          </Button>

          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={exporting || selectedIds.size === 0}>
            {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileText className="mr-2 size-4" />}
            导出勾选项 {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>

          <Button size="sm" variant="outline" onClick={handleExportMaterialDetail} disabled={exportingDetail || selectedIds.size === 0}>
            {exportingDetail ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileText className="mr-2 size-4" />}
            导出素材明细 {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </div>

        {/* 列表 */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="全选"
                  />
                </TableHead>
                <TableHead className="whitespace-nowrap">ID</TableHead>
                <TableHead className="whitespace-nowrap">剧名</TableHead>
                <TableHead className="whitespace-nowrap">渠道</TableHead>
                <TableHead className="whitespace-nowrap">语言</TableHead>
                <TableHead className="whitespace-nowrap">目标时长</TableHead>
                <TableHead className="whitespace-nowrap">拼接条数</TableHead>
                <TableHead className="whitespace-nowrap">成片时长</TableHead>
                <TableHead className="whitespace-nowrap">视频链接</TableHead>
                <TableHead className="whitespace-nowrap">状态</TableHead>
                <TableHead className="whitespace-nowrap">创建时间</TableHead>
                <TableHead className="whitespace-nowrap">更新时间</TableHead>
                <TableHead className="whitespace-nowrap">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="h-32 text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                data.map((task) => {
                  const badge = TASK_STATUS_BADGE[task.status] || { label: task.status, variant: "outline" as const }
                  const isExpanded = expandedIds.has(task.id)
                  return (
                    <React.Fragment key={task.id}>
                      <TableRow className="cursor-pointer" onClick={() => toggleExpand(task.id)}>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(task.id)}
                            onCheckedChange={() => toggleSelect(task.id)}
                            aria-label={`选择任务 ${task.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            {isExpanded
                              ? <ChevronDown className="size-3.5 text-muted-foreground" />
                              : <ChevronRight className="size-3.5 text-muted-foreground" />
                            }
                            {task.id}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm max-w-50 truncate" title={task.head_material_name_without_suffix}>
                          {task.head_material_name_without_suffix}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{task.channel}</TableCell>
                        <TableCell className="whitespace-nowrap">{task.language}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          ≥{task.target_min_minutes}分钟
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{task.concat_file_count ?? 3}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {task.result_duration_seconds != null ? `${Math.floor(task.result_duration_seconds / 60)}分${task.result_duration_seconds % 60}秒` : '-'}
                        </TableCell>
                        <TableCell className="max-w-50" onClick={(e) => e.stopPropagation()}>
                          {task.result_oss ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer w-full text-left"
                                  onClick={() => setPreviewUrl(task.result_oss)}
                                >
                                  <Play className="size-3 shrink-0" />
                                  <span className="truncate">
                                    {task.result_oss.length > URL_MAX_LENGTH
                                      ? task.result_oss.slice(0, URL_MAX_LENGTH) + '...'
                                      : task.result_oss}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="max-w-md break-all">
                                {task.result_oss}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            {task.status === "failed" && task.error_message && (
                              <p className="text-xs text-destructive max-w-40 truncate" title={task.error_message}>
                                {task.error_message}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {task.created_at ? dayjs(task.created_at).format("YYYY-MM-DD HH:mm") : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {task.updated_at ? dayjs(task.updated_at).format("YYYY-MM-DD HH:mm") : "-"}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {task.status === "completed" && task.result_oss && (() => {
                              const dlTask = downloadManager.getTaskByTaskId(task.id)
                              const fileName = task.result_oss.split("/").pop() || `task-${task.id}.mp4`

                              // 已完成：显示重新保存
                              if (dlTask && dlTask.status === "completed") {
                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-green-600 dark:text-green-400"
                                    onClick={() => downloadManager.saveFile(dlTask.id)}
                                  >
                                    <CheckCircle2 className="mr-1 size-3" />
                                    完成
                                  </Button>
                                )
                              }

                              // 下载中/排队中：显示进度，点击打开面板
                              if (dlTask && (dlTask.status === "downloading" || dlTask.status === "pending")) {
                                const percent = dlTask.total > 0
                                  ? Math.round((dlTask.loaded / dlTask.total) * 100)
                                  : 0
                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-primary"
                                    onClick={onOpenDownloadPanel}
                                  >
                                    {dlTask.status === "downloading"
                                      ? <>
                                          <Loader2 className="mr-1 size-3 animate-spin" />
                                          {percent}%
                                        </>
                                      : <>
                                          <Loader2 className="mr-1 size-3 animate-spin" />
                                          排队
                                        </>
                                    }
                                  </Button>
                                )
                              }

                              // 失败：显示重试
                              if (dlTask && dlTask.status === "failed") {
                                return (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-destructive"
                                    onClick={() => downloadManager.retry(dlTask.id)}
                                  >
                                    <RotateCcw className="mr-1 size-3" />
                                    重试
                                  </Button>
                                )
                              }

                              // 未下载：显示下载按钮
                              return (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => downloadManager.addDownload(task.result_oss!, fileName, task.id)}
                                >
                                  <Download className="mr-1 size-3" />
                                  下载
                                </Button>
                              )
                            })()}
                            {(task.status === "pending" || task.status === "waiting_material") && (
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEditTask(task)}>
                                <Pencil className="mr-1 size-3" />
                                编辑
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDelete(task.id)}
                              disabled={deleting}
                            >
                              <Trash2 className="mr-1 size-3" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && task.items.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={13} className="bg-muted/30 px-8 py-2">
                            <div className="text-xs font-medium mb-2 text-muted-foreground">素材明细</div>
                            <div className="space-y-1">
                              {task.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm py-1">
                                  <span className="text-muted-foreground">#{item.sort_index}</span>
                                  <span className="font-mono text-xs">{item.material_name}</span>
                                  <span className="text-xs text-muted-foreground">{item.duration_seconds}秒</span>
                                </div>
                              ))}
                            </div>
                            {task.start_trim_seconds != null && task.start_trim_seconds > 0 && (
                              <div className="text-xs text-muted-foreground mt-2">
                                开头跳过: {task.start_trim_seconds}秒
                              </div>
                            )}
                            {task.end_trim_seconds != null && task.end_trim_seconds > 0 && (
                              <div className="text-xs text-muted-foreground">
                                结尾跳过: {task.end_trim_seconds}秒
                              </div>
                            )}
                            {task.highlight_start_seconds != null && task.highlight_end_seconds != null && (
                              <div className="text-xs text-muted-foreground">
                                高光区间: {task.highlight_start_seconds}s - {task.highlight_end_seconds}s
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>共 {dataCount} 条</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-3">
              <span>每页</span>
              <Select value={String(pageSize)} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>条</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8" disabled={page <= 1 || loading} onClick={() => setPage(1)}>
                <ChevronsLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((p, index) => {
                  if (p === "ellipsis") {
                    return <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground"><MoreHorizontal className="size-4" /></span>
                  }
                  return (
                    <Button key={p} variant={p === page ? "default" : "outline"} size="icon" className="size-8" disabled={loading} onClick={() => setPage(p)}>
                      {p}
                    </Button>
                  )
                })}
              </div>
              <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8" disabled={page >= totalPages || loading} onClick={() => setPage(totalPages)}>
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 删除确认弹窗 */}
        <AlertDialog open={deleteTaskId !== null} onOpenChange={(open) => { if (!open) setDeleteTaskId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                确认删除
              </AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除任务 #{deleteTaskId} 吗？此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (deleteTaskId !== null) { const id = deleteTaskId; setDeleteTaskId(null); doDelete(id) } }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 视频预览弹窗 */}
        <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null) }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="size-5" />
                视频预览
              </DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <div className="aspect-video w-full rounded-md overflow-hidden bg-black">
                <video
                  key={previewUrl}
                  src={previewUrl}
                  controls
                  autoPlay
                  className="w-full h-full"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }
)
