'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import type {
  MissingPublishTimeAlert,
  VideoIdAnomalyAlert,
  ViewCountAnomalyAlert,
} from '@/lib/types/monitor'

// 模拟数据
const mockMissingPublishTimeAlerts: MissingPublishTimeAlert[] = [
  {
    videoId: 'vid_001',
    dramaName: '示例剧A',
    publishChannel: '频道1',
    actualPublishDate: null,
    operator: '张三',
  },
  {
    videoId: 'vid_002',
    dramaName: '示例剧B',
    publishChannel: '频道2',
    actualPublishDate: null,
    operator: '李四',
  },
]

const mockVideoIdAnomalyAlerts: VideoIdAnomalyAlert[] = [
  {
    type: 'web_has_db_not',
    videoId: 'vid_003',
    dramaName: '示例剧C',
    publishChannel: '频道1',
    actualPublishDate: '2026-01-10',
    operator: '王五',
  },
  {
    type: 'db_has_web_not',
    videoId: 'vid_005',
    channelLink: 'https://youtube.com/...',
    actualPublishTime: '2026-01-12 14:00',
  },
]

const mockViewCountAnomalyAlerts: ViewCountAnomalyAlert[] = [
  {
    videoId: 'vid_004',
    dramaName: '示例剧D',
    publishChannel: '频道2',
    actualPublishTime: '10:00',
    actualPublishDate: '2026-01-08',
    operator: '赵六',
    viewCount: 0,
    viewDate: '2026-01-09',
  },
]

export function EffectMonitorPage() {
  const [dateStart, setDateStart] = React.useState('')
  const [dateEnd, setDateEnd] = React.useState('')

  const handleQuery = () => {
    // TODO: 实现查询逻辑
    console.log('Query alerts for:', dateStart, dateEnd)
  }

  const handleQuickDate = (days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days + 1)
    setDateStart(start.toISOString().split('T')[0])
    setDateEnd(end.toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6 py-4">
      {/* 日期筛选器 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">告警统计时间范围</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">统计日期范围</span>
              <Input
                type="date"
                className="w-36"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
              />
              <span className="text-muted-foreground">—</span>
              <Input
                type="date"
                className="w-36"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => handleQuickDate(2)}>
              近两天
            </Button>
            <Button size="sm" onClick={handleQuery}>
              查询
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 告警规则卡片区 */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">告警规则与明细</h3>

        {/* 规则一：发布时间填写缺失 */}
        <Card>
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                规则一：发布时间填写缺失
              </CardTitle>
              <Badge variant="destructive">
                共有告警信息 {mockMissingPublishTimeAlerts.length} 条
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>视频唯一ID</TableHead>
                    <TableHead>剧名称</TableHead>
                    <TableHead>发布频道</TableHead>
                    <TableHead>实际发布日期</TableHead>
                    <TableHead>预计负责运营人员</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMissingPublishTimeAlerts.length > 0 ? (
                    mockMissingPublishTimeAlerts.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{item.videoId}</TableCell>
                        <TableCell>{item.dramaName}</TableCell>
                        <TableCell>{item.publishChannel}</TableCell>
                        <TableCell>{item.actualPublishDate || '—'}</TableCell>
                        <TableCell>{item.operator}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        暂无告警
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 规则二：视频唯一ID异常 */}
        <Card>
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                规则二：视频唯一ID异常
              </CardTitle>
              <Badge variant="destructive">
                共有告警信息 {mockVideoIdAnomalyAlerts.length} 条
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {/* 网页有 / 数据库没有 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">网页有 / 数据库没有</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>视频唯一ID</TableHead>
                      <TableHead>剧名称</TableHead>
                      <TableHead>发布频道</TableHead>
                      <TableHead>实际发布日期</TableHead>
                      <TableHead>预计负责运营人员</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockVideoIdAnomalyAlerts
                      .filter((item) => item.type === 'web_has_db_not')
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">{item.videoId}</TableCell>
                          <TableCell>{item.dramaName}</TableCell>
                          <TableCell>{item.publishChannel}</TableCell>
                          <TableCell>{item.actualPublishDate}</TableCell>
                          <TableCell>{item.operator}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* 数据库有 / 网页没有 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">数据库有 / 网页没有</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>视频唯一ID</TableHead>
                      <TableHead>发布频道链接</TableHead>
                      <TableHead>实际发布时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockVideoIdAnomalyAlerts
                      .filter((item) => item.type === 'db_has_web_not')
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">{item.videoId}</TableCell>
                          <TableCell>
                            <a
                              href={item.channelLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {item.channelLink}
                            </a>
                          </TableCell>
                          <TableCell>{item.actualPublishTime}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 规则三：播放量异常 */}
        <Card>
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                规则三：播放量异常
              </CardTitle>
              <Badge variant="destructive">
                共有告警信息 {mockViewCountAnomalyAlerts.length} 条
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>视频唯一ID</TableHead>
                    <TableHead>剧名称</TableHead>
                    <TableHead>发布频道</TableHead>
                    <TableHead>实际发布时间</TableHead>
                    <TableHead>实际发布日期</TableHead>
                    <TableHead>预计负责运营人员</TableHead>
                    <TableHead>观看量</TableHead>
                    <TableHead>观看日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockViewCountAnomalyAlerts.length > 0 ? (
                    mockViewCountAnomalyAlerts.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">{item.videoId}</TableCell>
                        <TableCell>{item.dramaName}</TableCell>
                        <TableCell>{item.publishChannel}</TableCell>
                        <TableCell>{item.actualPublishTime}</TableCell>
                        <TableCell>{item.actualPublishDate}</TableCell>
                        <TableCell>{item.operator}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{item.viewCount}</Badge>
                        </TableCell>
                        <TableCell>{item.viewDate}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        暂无告警
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
