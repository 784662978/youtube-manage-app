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
import { Input } from "@/components/ui/input"
import {
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MoreHorizontal,
  Search,
} from "lucide-react"
import type {
  QixingVideo,
  ApiResponse,
  PageResponse,
} from "@/lib/types/drama"

interface QixingVideoListProps {
  languages: { code: number; display_name: string }[]
  onNotification: (message: string, type: NotificationType) => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200]

// 生成页码数组（带省略号）- 与明细排期表一致
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

export function QixingVideoList({ languages, onNotification }: QixingVideoListProps) {
  const [data, setData] = React.useState<QixingVideo[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(50)
  const [pageCount, setPageCount] = React.useState(0)
  const [dataCount, setDataCount] = React.useState(0)

  // 筛选条件（UI 绑定，不会自动触发查询）
  const [language, setLanguage] = React.useState("")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")

  // 实际查询用的条件（仅在搜索时更新）
  const [searchParams, setSearchParams] = React.useState({
    language: "" as string,
    fromDate: "",
    toDate: "",
  })

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), page_size: String(pageSize) }
      if (searchParams.language) params.language = searchParams.language
      if (searchParams.fromDate) params.from = searchParams.fromDate
      if (searchParams.toDate) params.to = searchParams.toDate

      const result = await apiClient.get<ApiResponse<PageResponse<QixingVideo>>>(
        "/qixing/videos",
        params
      )
      const resp = result.response
      setData(resp.data || [])
      setPageCount(resp.pageCount)
      setDataCount(resp.dataCount)
    } catch (error) {
      console.error("Failed to fetch qixing videos:", error)
      onNotification("获取数据失败", "error")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchParams, onNotification])

  // 页码或每页条数变化时重新查询
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // 初始加载
  React.useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    setSearchParams({
      language,
      fromDate,
      toDate,
    })
    setPage(1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  // 语言 code -> 中文名映射
  const languageMap = React.useMemo(() => {
    const map = new Map<number, string>()
    languages.forEach((l) => map.set(l.code, l.display_name))
    return map
  }, [languages])

  const totalPages = pageCount || 1
  const pageNumbers = generatePageNumbers(page, totalPages)

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={language || "__all__"} onValueChange={(v) => setLanguage(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-32.5">
            <SelectValue placeholder="语言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部语言</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={String(lang.code)}>
                {lang.display_name || lang.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-40"
          placeholder="开始日期"
        />
        <span className="text-muted-foreground text-sm">至</span>
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-40"
          placeholder="结束日期"
        />

        <Button size="sm" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
          搜索
        </Button>
      </div>

      {/* 列表 */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">ID</TableHead>
              <TableHead className="whitespace-nowrap">Serial ID</TableHead>
              <TableHead className="whitespace-nowrap">App ID</TableHead>
              <TableHead className="whitespace-nowrap">标题</TableHead>
              <TableHead className="whitespace-nowrap">标签</TableHead>
              <TableHead className="whitespace-nowrap">语言</TableHead>
              <TableHead className="whitespace-nowrap">拉取日期</TableHead>
              <TableHead className="whitespace-nowrap">序号</TableHead>
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
                  <TableCell className="text-muted-foreground whitespace-nowrap">{item.id}</TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{item.serial_id}</TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">{item.app_id}</TableCell>
                  <TableCell className="max-w-50 truncate">{item.title}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.tag}</TableCell>
                  <TableCell className="whitespace-nowrap">{languageMap.get(item.language) || item.language}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.pull_date}</TableCell>
                  <TableCell className="whitespace-nowrap">{item.pull_sequence}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 - 与明细排期表一致 */}
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
            {/* 首页 */}
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
            {/* 上一页 */}
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
            {/* 页码导航 */}
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
            {/* 下一页 */}
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
            {/* 末页 */}
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
