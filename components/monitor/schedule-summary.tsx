import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  ContentTypeDistribution,
  PublishStatusDistribution,
  BannedVideo,
} from '@/lib/types/monitor'

interface ScheduleSummaryProps {
  dateRange: { start: string; end: string }
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
  dateRange,
  totalVideos,
  totalChannels,
  yppPassedChannels,
  yppNotPassedChannels,
  totalOperators,
  contentTypes,
  publishStatuses,
  bannedVideos,
}: ScheduleSummaryProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">排期概况</CardTitle>
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
                {contentTypes.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.primaryCategory}</TableCell>
                    <TableCell>{item.secondaryCategory}</TableCell>
                    <TableCell>{item.videoCount}</TableCell>
                    <TableCell>{item.copyrightDetails || '—'}</TableCell>
                  </TableRow>
                ))}
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
                {publishStatuses.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{item.count}</TableCell>
                    <TableCell>{item.remark || '—'}</TableCell>
                  </TableRow>
                ))}
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
                  {bannedVideos.length > 0 ? (
                    bannedVideos.map((video, index) => (
                      <TableRow key={index}>
                        <TableCell>{video.videoId}</TableCell>
                        <TableCell>{video.dramaName}</TableCell>
                        <TableCell>{video.expectedChannel}</TableCell>
                        <TableCell>{video.expectedOperator}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
