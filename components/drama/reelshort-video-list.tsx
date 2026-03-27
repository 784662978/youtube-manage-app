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
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MoreHorizontal,
  Search,
  Eye,
  ImageIcon,
} from "lucide-react"
import type {
  ReelshortVideo,
  ReelshortVideoParams,
  RStatus,
  ApiResponse,
  PageResponse,
} from "@/lib/types/drama"

interface ReelshortVideoListProps {
  languages: { code: string; display_name: string }[]
  onNotification: (message: string, type: NotificationType) => void
}

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200]

const R_STATUS_OPTIONS: { value: RStatus | ""; label: string }[] = [
  { value: "", label: "全部" },
  { value: "pending", label: "待识别" },
  { value: "has_r", label: "有R" },
  { value: "no_r", label: "无R" },
]

const rStatusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待识别", variant: "outline" },
  has_r: { label: "有R", variant: "default" },
  no_r: { label: "无R", variant: "secondary" },
}

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

export function ReelshortVideoList({ languages, onNotification }: ReelshortVideoListProps) {
  const [data, setData] = React.useState<ReelshortVideo[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(50)
  const [pageCount, setPageCount] = React.useState(0)
  const [dataCount, setDataCount] = React.useState(0)

  // 筛选条件（UI 绑定，不会自动触发查询）
  const [rStatus, setRStatus] = React.useState<RStatus | "">("")
  const [language, setLanguage] = React.useState("")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")

  // 实际查询用的条件（仅在搜索时更新）
  const [searchParams, setSearchParams] = React.useState({
    rStatus: "" as RStatus | "",
    language: "",
    fromDate: "",
    toDate: "",
  })

  // 封面预览
  const [previewImage, setPreviewImage] = React.useState<{ url: string; title: string } | null>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: ReelshortVideoParams = { page, page_size: pageSize }
      if (searchParams.rStatus) params.r_status = searchParams.rStatus
      if (searchParams.language) params.language = searchParams.language
      if (searchParams.fromDate) params.from = searchParams.fromDate
      if (searchParams.toDate) params.to = searchParams.toDate

      const result = await apiClient.get<ApiResponse<PageResponse<ReelshortVideo>>>(
        "/reelshort/videos",
        params as Record<string, string>
      )
      const resp = result.response
      setData(resp.data || [])
      setPageCount(resp.pageCount)
      setDataCount(resp.dataCount)
    } catch (error) {
      console.error("Failed to fetch reelshort videos:", error)
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
      rStatus,
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

  const totalPages = pageCount || 1
  const pageNumbers = generatePageNumbers(page, totalPages)

  return (
    <>
      <div className="space-y-4">
        {/* 筛选栏 */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={rStatus || "__all__"} onValueChange={(v) => setRStatus(v === "__all__" ? "" : (v as RStatus))}>
            <SelectTrigger className="w-32.5">
              <SelectValue placeholder="R状态" />
            </SelectTrigger>
            <SelectContent>
              {R_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value || "__all__"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={language || "__all__"} onValueChange={(v) => setLanguage(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-32.5">
              <SelectValue placeholder="语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">全部语言</SelectItem>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
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
                <TableHead className="whitespace-nowrap">Book ID</TableHead>
                <TableHead className="whitespace-nowrap">标题</TableHead>
                <TableHead className="whitespace-nowrap">封面</TableHead>
                <TableHead className="whitespace-nowrap">语言</TableHead>
                <TableHead className="whitespace-nowrap">拉取日期</TableHead>
                <TableHead className="whitespace-nowrap">榜单</TableHead>
                <TableHead className="whitespace-nowrap">序号</TableHead>
                <TableHead className="whitespace-nowrap">R状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      加载中...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => {
                  const badge = rStatusBadge[item.review_status] || { label: item.review_status, variant: "outline" as const }
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{item.id}</TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{item.book_id}</TableCell>
                      <TableCell className="max-w-50 truncate">{item.title}</TableCell>
                      <TableCell>
                        {item.pic_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-primary"
                            onClick={() => setPreviewImage({ url: item.pic_url, title: item.title })}
                          >
                            <Eye className="mr-1 size-3" />
                            查看封面
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-xs flex items-center gap-1">
                            <ImageIcon className="size-3" />
                            无封面
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{item.language}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.pull_date}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.pull_sort}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.pull_sequence}</TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
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

      {/* 封面预览弹窗 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full mx-4 rounded-lg bg-background border shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium truncate">{previewImage.title}</span>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() => setPreviewImage(null)}
              >
                ✕
              </Button>
            </div>
            <div className="p-2 flex items-center justify-center bg-muted/30">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-96 w-auto rounded object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
