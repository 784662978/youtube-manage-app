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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import type {
  RemixTask,
  RemixTaskStatus,
  RemixTaskListParams,
} from "@/lib/types/material"
import type { ApiResponse, PageResponse } from "@/lib/types/drama"

interface RemixTaskListProps {
  channels: { id: number; name: string; label: string }[]
  languages: { id: number; name: string; label: string }[]
  onNotification: (message: string, type: NotificationType) => void
  onCreateTask: () => void
  onEditTask: (task: RemixTask) => void
}

export interface RemixTaskListRef {
  refresh: () => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100]

const TASK_STATUS_BADGE: Record<RemixTaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待处理", variant: "outline" },
  processing: { label: "处理中", variant: "secondary" },
  completed: { label: "已完成", variant: "default" },
  failed: { label: "异常", variant: "destructive" },
}

const STATUS_OPTIONS: { value: RemixTaskStatus | ""; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待处理" },
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
  function RemixTaskListInner({ channels, languages, onNotification, onCreateTask, onEditTask }, ref) {
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

    const handleDelete = async (id: number) => {
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
        </div>

        {/* 列表 */}
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap w-8"></TableHead>
                <TableHead className="whitespace-nowrap">ID</TableHead>
                <TableHead className="whitespace-nowrap">首视频</TableHead>
                <TableHead className="whitespace-nowrap">渠道</TableHead>
                <TableHead className="whitespace-nowrap">语言</TableHead>
                <TableHead className="whitespace-nowrap">状态</TableHead>
                <TableHead className="whitespace-nowrap">目标时长</TableHead>
                <TableHead className="whitespace-nowrap">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
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
                        <TableCell>
                          {isExpanded
                            ? <ChevronDown className="size-4 text-muted-foreground" />
                            : <ChevronRight className="size-4 text-muted-foreground" />
                          }
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">{task.id}</TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          #{task.head_material_id}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{task.channel}</TableCell>
                        <TableCell className="whitespace-nowrap">{task.language}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {task.target_min_minutes}-{task.target_max_minutes}分钟
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {task.status === "completed" && task.result_oss && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => {
                                  if (!task.result_oss) return
                                  const fileName = task.result_oss.split("/").pop() || `task-${task.id}.mp4`
                                  fetch(task.result_oss)
                                    .then((res) => res.blob())
                                    .then((blob) => {
                                      const url = URL.createObjectURL(blob)
                                      const a = document.createElement("a")
                                      a.href = url
                                      a.download = fileName
                                      document.body.appendChild(a)
                                      a.click()
                                      document.body.removeChild(a)
                                      URL.revokeObjectURL(url)
                                    })
                                }}
                              >
                                <Download className="mr-1 size-3" />
                                下载
                              </Button>
                            )}
                            {task.status === "pending" && (
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
                          <TableCell colSpan={8} className="bg-muted/30 px-8 py-2">
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
      </div>
    )
  }
)
