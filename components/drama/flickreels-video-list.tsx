"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
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
import {
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react"
import type {
  FlickreelsVideo,
  FlickreelsSyncResult,
  ApiResponse,
  PageResponse,
} from "@/lib/types/drama"

interface FlickreelsVideoListProps {
  onNotification: (message: string, type: NotificationType) => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200]

function generatePageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | "ellipsis")[] = []
  pages.push(1)

  if (current <= 4) {
    for (let i = 2; i <= Math.min(5, total - 1); i++) {
      pages.push(i)
    }
    if (total > 5) {
      pages.push("ellipsis")
    }
  } else if (current >= total - 3) {
    pages.push("ellipsis")
    for (let i = Math.max(2, total - 4); i <= total - 1; i++) {
      pages.push(i)
    }
  } else {
    pages.push("ellipsis")
    for (let i = current - 1; i <= current + 1; i++) {
      pages.push(i)
    }
    pages.push("ellipsis")
  }

  if (total > 1) {
    pages.push(total)
  }

  return pages
}

export function FlickreelsVideoList({ onNotification }: FlickreelsVideoListProps) {
  const [data, setData] = React.useState<FlickreelsVideo[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(50)
  const [pageCount, setPageCount] = React.useState(0)
  const [dataCount, setDataCount] = React.useState(0)

  const [syncing, setSyncing] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiClient.get<ApiResponse<PageResponse<FlickreelsVideo>>>(
        "/flickreels/videos",
        { page, page_size: pageSize }
      )
      const resp = result.response
      setData(resp.data || [])
      setPageCount(resp.pageCount)
      setDataCount(resp.dataCount)
    } catch (error) {
      console.error("Failed to fetch flickreels videos:", error)
      onNotification("获取数据失败", "error")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, onNotification])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await apiClient.post<ApiResponse<FlickreelsSyncResult>>(
        "/dataPull/flickreels-feishu",
        {}
      )
      const resp = result.response
      const msg = `同步完成：插入 ${resp.inserted_count} 条，跳过 ${resp.skipped_count} 条，飞书总数 ${resp.feishu_total_count} 条`
      onNotification(msg, "success")
      fetchData()
    } catch (error) {
      const message = error instanceof Error ? error.message : "同步表格数据失败"
      onNotification(message, "error")
    } finally {
      setSyncing(false)
    }
  }

  const totalPages = pageCount || 1
  const pageNumbers = generatePageNumbers(page, totalPages)

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
          同步表格数据
        </Button>
      </div>

      {/* 列表 */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">ID</TableHead>
              <TableHead className="whitespace-nowrap">剧名</TableHead>
              <TableHead className="whitespace-nowrap">语言</TableHead>
              <TableHead className="whitespace-nowrap">版权信息</TableHead>
              <TableHead className="whitespace-nowrap">分发日期</TableHead>
              <TableHead className="whitespace-nowrap">拉取序号</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{item.id}</TableCell>
                  <TableCell className="max-w-50 truncate">{item.drama_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.language}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.copyright_info}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.distribution_date || "-"}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.pull_sequence}</TableCell>
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
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1 || loading}
              onClick={() => setPage(1)}
              title="首页"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              title="上一页"
            >
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
                const isActive = p === page
                return (
                  <Button
                    key={p}
                    variant={isActive ? "default" : "outline"}
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
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              title="下一页"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(totalPages)}
              title="末页"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
