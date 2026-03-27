"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, CheckCircle, Download } from "lucide-react"
import type {
  ReelshortVideo,
  BatchReviewRequest,
  BatchReviewResponse,
  ApiResponse,
} from "@/lib/types/drama"

interface ReelshortPendingReviewProps {
  languages: { code: string; display_name: string }[]
  onNotification: (message: string, type: NotificationType) => void
}

export function ReelshortPendingReview({ languages, onNotification }: ReelshortPendingReviewProps) {
  const [data, setData] = React.useState<ReelshortVideo[]>([])
  const [loading, setLoading] = React.useState(false)
  const [language, setLanguage] = React.useState("")
  const [exclusiveSet, setExclusiveSet] = React.useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = React.useState(false)
  const [pullCount, setPullCount] = React.useState("30")
  const [pulling, setPulling] = React.useState(false)

  // 实际查询条件
  const [searchLanguage, setSearchLanguage] = React.useState("")

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (searchLanguage) params.language = searchLanguage

      const result = await apiClient.get<ApiResponse<ReelshortVideo[]>>(
        "/reelshort/pending-review",
        params
      )
      setData(result.response || [])
      setExclusiveSet(new Set())
    } catch (error) {
      console.error("Failed to fetch pending review:", error)
      onNotification("获取待审核数据失败", "error")
    } finally {
      setLoading(false)
    }
  }, [searchLanguage, onNotification])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // 初始加载
  React.useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    setSearchLanguage(language === "__all__" ? "" : language)
  }

  const toggleExclusive = (bookId: string) => {
    setExclusiveSet((prev) => {
      const next = new Set(prev)
      if (next.has(bookId)) {
        next.delete(bookId)
      } else {
        next.add(bookId)
      }
      return next
    })
  }

  const handlePullByTime = async () => {
    const count = parseInt(pullCount, 10)
    if (isNaN(count) || count <= 0) {
      onNotification("请输入有效的拉取数量", "error")
      return
    }
    setPulling(true)
    try {
      await apiClient.post<ApiResponse<boolean>>(
        `/dataPull/reelshort-by-time?count=${count}`,
        {}
      )
      onNotification("按时间榜拉取成功", "success")
      fetchData()
    } catch (error) {
      const message = error instanceof Error ? error.message : "按时间榜拉取失败"
      onNotification(message, "error")
    } finally {
      setPulling(false)
    }
  }

  const handleSubmit = async () => {
    if (exclusiveSet.size === 0) {
      onNotification("请至少选择一条数据进行审核", "error")
      return
    }
    setSubmitting(true)
    try {
      const bookIds = Array.from(exclusiveSet)
      const body: BatchReviewRequest = {
        has_r: bookIds,
        no_r: [],
      }
      const result = await apiClient.post<ApiResponse<BatchReviewResponse>>(
        "/reelshort/videos/batch-review",
        body
      )
      const resp = result.response
      const msg = [
        resp.has_r_updated > 0 ? `已标记: ${resp.has_r_updated} 条` : null,
        resp.not_found?.length > 0 ? `未找到: ${resp.not_found.length} 条` : null,
      ].filter(Boolean).join("，")
      onNotification(msg || "操作完成", "success")
      fetchData()
    } catch (error) {
      const message = error instanceof Error ? error.message : "批量审核失败"
      onNotification(message, "error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={language || "__all__"} onValueChange={setLanguage}>
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

        <Button size="sm" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Search className="mr-2 size-4" />}
          搜索
        </Button>

        <input
          type="number"
          min={1}
          value={pullCount}
          onChange={(e) => setPullCount(e.target.value)}
          className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm"
          placeholder="数量"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handlePullByTime}
          disabled={pulling}
        >
          {pulling ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
          按时间榜拉取
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="default">已选: {exclusiveSet.size}</Badge>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || exclusiveSet.size === 0}
        >
          {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle className="mr-2 size-4" />}
          提交审核
        </Button>
      </div>

      {/* 卡片列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" />
          加载中...
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          暂无待审核数据
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {data.map((item) => {
            const isSelected = exclusiveSet.has(item.book_id)
            return (
              <div
                key={item.id}
                className={`group rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md ${
                  isSelected ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                {/* 封面图 */}
                <div className="aspect-3/4 bg-muted relative overflow-hidden">
                  {item.pic_url ? (
                    <img
                      src={item.pic_url}
                      alt={item.title}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground text-xs">
                      无封面
                    </div>
                  )}
                  {/* 榜单序号角标 */}
                  {item.pull_sort && (
                    <Badge
                      variant="secondary"
                      className="absolute top-1.5 left-1.5 text-xs px-1.5 py-0"
                    >
                      {item.pull_sort} #{item.pull_sequence}
                    </Badge>
                  )}
                </div>

                {/* 剧集信息 */}
                <div className="p-2 space-y-1">
                  <div className="text-xs font-medium truncate" title={item.title}>
                    {item.title}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{item.language}</span>
                    <span>{item.pull_date}</span>
                  </div>
                </div>

                {/* 底部多选框 */}
                <div className="border-t px-2 py-1.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExclusive(item.book_id)}
                      className="size-3.5 rounded border-gray-300 accent-primary"
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      独家
                    </span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 底部统计 */}
      {!loading && data.length > 0 && (
        <div className="text-sm text-muted-foreground">
          共 {data.length} 条待审核数据
        </div>
      )}
    </div>
  )
}
