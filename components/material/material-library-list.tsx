"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  Trash2,
} from "lucide-react"
import type { MaterialItem, MaterialListParams } from "@/lib/types/material"
import type { ApiResponse, PageResponse } from "@/lib/types/drama"

interface MaterialLibraryListProps {
  channels: { id: number; name: string; label: string }[]
  languages: { id: number; name: string; label: string }[]
  onNotification: (message: string, type: NotificationType) => void
  onRefresh: () => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100]

function generatePageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages: (number | "ellipsis")[] = []
  pages.push(1)
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

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return min > 0 ? `${min}分${sec}秒` : `${sec}秒`
}

export function MaterialLibraryList({ channels, languages, onNotification, onRefresh }: MaterialLibraryListProps) {
  const [data, setData] = React.useState<MaterialItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [pageCount, setPageCount] = React.useState(0)
  const [dataCount, setDataCount] = React.useState(0)

  // 筛选条件
  const [channel, setChannel] = React.useState("")
  const [language, setLanguage] = React.useState("")
  const [name, setName] = React.useState("")

  const [searchParams, setSearchParams] = React.useState({
    channel: "",
    language: "",
    name: "",
  })

  // 批量选择
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [deleting, setDeleting] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: MaterialListParams = { page, page_size: pageSize }
      if (searchParams.channel) params.channel = searchParams.channel
      if (searchParams.language) params.language = searchParams.language
      if (searchParams.name) params.name = searchParams.name

      const result = await apiClient.get<ApiResponse<PageResponse<MaterialItem>>>(
        "/materialLibrary/list",
        params as Record<string, string>
      )
      const resp = result.response
      setData(resp.data || [])
      setPageCount(resp.pageCount)
      setDataCount(resp.dataCount)
    } catch (error) {
      console.error("Failed to fetch materials:", error)
      onNotification("获取素材列表失败", "error")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchParams, onNotification])

  React.useEffect(() => { fetchData() }, [fetchData])

  const handleSearch = () => {
    setSearchParams({ channel, language, name })
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map((item) => item.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const handleDeleteSingle = async (id: number) => {
    setDeleting(true)
    try {
      await apiClient.delete(`/materialLibrary/${id}`)
      onNotification("删除成功", "success")
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      fetchData()
    } catch (error: any) {
      onNotification(error.message || "删除失败", "error")
    } finally {
      setDeleting(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    setDeleting(true)
    try {
      const result = await apiClient.post<
        ApiResponse<{ success_ids: number[]; failed_items: { id: number; reason: string }[] }>
      >("/materialLibrary/batch-delete", { ids: Array.from(selectedIds) })

      const resp = result.response
      const successCount = resp.success_ids.length
      const failedCount = resp.failed_items.length

      if (failedCount === 0) {
        onNotification(`成功删除 ${successCount} 条`, "success")
      } else {
        const reasons = resp.failed_items.map((f) => `ID ${f.id}: ${f.reason}`).join("; ")
        onNotification(`成功 ${successCount} 条，失败 ${failedCount} 条: ${reasons}`, "error")
      }

      setSelectedIds(new Set())
      fetchData()
    } catch (error: any) {
      onNotification(error.message || "批量删除失败", "error")
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
          <span className="text-sm text-muted-foreground whitespace-nowrap">渠道</span>
          <Select value={channel || "__all__"} onValueChange={(v) => {
            setChannel(v === "__all__" ? "" : v)
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部渠道" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部渠道</SelectItem>
              {channels.map((ch) => (
                <SelectItem key={ch.id} value={ch.name}>
                  {ch.label}
                </SelectItem>
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

        <div className="flex items-center gap-1.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="素材名称"
            className="w-36"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <Button size="sm" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
          搜索
        </Button>
      </div>

      {/* 批量操作栏 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-2 py-2 bg-muted/50 rounded-md border">
          <span className="text-sm text-muted-foreground">已选 {selectedIds.size} 项</span>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleBatchDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
            批量删除
          </Button>
        </div>
      )}

      {/* 列表 */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap w-10">
                <Checkbox
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="whitespace-nowrap">ID</TableHead>
              <TableHead className="whitespace-nowrap">名称</TableHead>
              <TableHead className="whitespace-nowrap">渠道</TableHead>
              <TableHead className="whitespace-nowrap">语言</TableHead>
              <TableHead className="whitespace-nowrap">时长</TableHead>
              <TableHead className="whitespace-nowrap">使用次数</TableHead>
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
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) => handleSelectOne(item.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{item.id}</TableCell>
                  <TableCell className="max-w-50 truncate font-medium">{item.name}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.channel}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.language}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDuration(item.duration_seconds)}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.use_count}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => handleDeleteSingle(item.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="mr-1 size-3" />
                      删除
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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
            <Select
              value={String(pageSize)}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
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
                  return (
                    <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                      <MoreHorizontal className="size-4" />
                    </span>
                  )
                }
                return (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "outline"}
                    size="icon"
                    className="size-8"
                    disabled={loading}
                    onClick={() => setPage(p)}
                  >
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
