'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type {
  ContentTypeDistribution,
  PublishStatusDistribution,
  BannedVideo,
} from '@/lib/types/monitor'

const DEFAULT_PAGE_SIZE = 20

export interface ScheduleSummaryProps {
  isLoading?: boolean
  dateRange: { start: string; end: string }
  onDateRangeChange?: (range: DateRange) => void
  totalVideos: number
  totalChannels: number
  yppPassedChannels: number
  yppNotPassedChannels: number
  totalOperators: number
  contentTypes: ContentTypeDistribution[]
  publishStatuses: PublishStatusDistribution[]
  bannedVideos: BannedVideo[]
}

export function ScheduleSummary({
  isLoading = false,
  dateRange,
  onDateRangeChange,
  totalVideos,
  totalChannels,
  yppPassedChannels,
  yppNotPassedChannels,
  totalOperators,
  contentTypes,
  publishStatuses,
  bannedVideos,
}: ScheduleSummaryProps) {
  // 禁播视频分页状态
  const [bannedPage, setBannedPage] = React.useState(1)
  const totalPages = Math.ceil(bannedVideos.length / DEFAULT_PAGE_SIZE)
  const startIndex = (bannedPage - 1) * DEFAULT_PAGE_SIZE
  const endIndex = startIndex + DEFAULT_PAGE_SIZE
  const currentBannedVideos = bannedVideos.slice(startIndex, endIndex)

  // 数据变化时重置页码
  React.useEffect(() => {
    setBannedPage(1)
  }, [bannedVideos.length])

  const handlePrevPage = () => {
    setBannedPage((p) => Math.max(1, p - 1))
  }

  const handleNextPage = () => {
    setBannedPage((p) => Math.min(totalPages, p + 1))
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">排期概况</CardTitle>
          {onDateRangeChange && (
            <DateRangePicker
              value={dateRange}
              onChange={onDateRangeChange}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 概况描述 */}
        <div className="text-sm leading-relaxed">
          在 <strong className="text-primary">{dateRange.start}</strong> -{' '}
          <strong className="text-primary">{dateRange.end}</strong> 期间，一共排期{' '}
          <strong className="text-primary">{totalVideos}</strong> 个视频，覆盖{' '}
          <strong className="text-primary">{totalChannels}</strong> 个频道，其中已过YPP频道{' '}
          <strong className="text-primary">{yppPassedChannels}</strong> 个，未过YPP频道{' '}
          <strong className="text-primary">{yppNotPassedChannels}</strong> 个，由{' '}
          <strong className="text-primary">{totalOperators}</strong> 位运营负责。
        </div>

        {/* 内容类型分布表 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">内容类型分布</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>内容一级分类</TableHead>
                  <TableHead>内容二级分类</TableHead>
                  <TableHead>视频数量（部）</TableHead>
                  <TableHead>版权方明细</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : contentTypes.length > 0 ? (
                  contentTypes.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.primaryCategory}</TableCell>
                      <TableCell>{item.secondaryCategory}</TableCell>
                      <TableCell>{item.videoCount}</TableCell>
                      <TableCell>{item.copyrightDetails || '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 发布情况表 */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">发布情况</h4>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>发布状态</TableHead>
                  <TableHead>数量（个）</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      <div className="flex items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : publishStatuses.length > 0 ? (
                  publishStatuses.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{item.remark || '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 禁播状态视频列表 */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-semibold">处于禁播状态的未发布视频列表</h4>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>视频唯一ID</TableHead>
                    <TableHead>剧名称</TableHead>
                    <TableHead>预计发布频道</TableHead>
                    <TableHead>预计负责运营人员</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex items-center justify-center text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          加载中...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentBannedVideos.length > 0 ? (
                    currentBannedVideos.map((video, index) => (
                      <TableRow key={startIndex + index}>
                        <TableCell className="font-mono text-xs">{video.videoId}</TableCell>
                        <TableCell>{video.dramaName}</TableCell>
                        <TableCell>{video.expectedChannel}</TableCell>
                        <TableCell>{video.expectedOperator}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 分页控制 */}
            {!isLoading && bannedVideos.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  共 {bannedVideos.length} 条，第 {bannedPage}/{totalPages || 1} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bannedPage <= 1}
                    onClick={handlePrevPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={bannedPage >= totalPages}
                    onClick={handleNextPage}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
