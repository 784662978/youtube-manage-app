'use client'

import * as React from 'react'
import dayjs from 'dayjs'
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
import { Notification } from '@/components/ui/notification'
import { AlertTriangle, Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { generateExcelXML, downloadExcel } from '@/lib/excel-helper'
import type {
  WarningResponse,
  MissingPublishTimeAlert,
  VideoIdAnomalyWebAlert,
  VideoIdAnomalyDbAlert,
  ViewCountAnomalyAlert,
} from '@/lib/types/monitor'

const DEFAULT_PAGE_SIZE = 20

// 通用分页表格组件
interface PaginatedTableProps<T> {
  data: T[]
  isLoading: boolean
  columns: { key: keyof T; header: string; render?: (value: unknown, item: T) => React.ReactNode }[]
  pageSize?: number
  onExportExcel?: () => void
}

function PaginatedTable<T extends object>({
  data,
  isLoading,
  columns,
  pageSize = DEFAULT_PAGE_SIZE,
  onExportExcel,
}: PaginatedTableProps<T>) {
  const [page, setPage] = React.useState(1)
  const totalPages = Math.ceil(data.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = data.slice(startIndex, endIndex)

  // 数据变化时重置页码
  React.useEffect(() => {
    setPage(1)
  }, [data.length])

  const handlePrevPage = () => {
    setPage((p) => Math.max(1, p - 1))
  }

  const handleNextPage = () => {
    setPage((p) => Math.min(totalPages, p + 1))
  }

  return (
    <div className="space-y-3">
      {/* 导出按钮 */}
      {onExportExcel && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-1" />
            下载Excel
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.key)}>{col.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : currentData.length > 0 ? (
              currentData.map((item, index) => (
                <TableRow key={startIndex + index}>
                  {columns.map((col) => (
                    <TableCell key={String(col.key)}>
                      {col.render ? col.render(item[col.key], item) : (item[col.key] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  暂无告警
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页控制 */}
      {!isLoading && data.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            共 {data.length} 条，第 {page}/{totalPages || 1} 页
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={handlePrevPage}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={handleNextPage}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function EffectMonitorPage() {
  const [dateStart, setDateStart] = React.useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))
  const [dateEnd, setDateEnd] = React.useState(dayjs().format('YYYY-MM-DD'))
  const [isLoading, setIsLoading] = React.useState(false)

  // 告警数据
  const [rule1Data, setRule1Data] = React.useState<MissingPublishTimeAlert[]>([])
  const [rule21Data, setRule21Data] = React.useState<VideoIdAnomalyWebAlert[]>([])
  const [rule22Data, setRule22Data] = React.useState<VideoIdAnomalyDbAlert[]>([])
  const [rule3Data, setRule3Data] = React.useState<ViewCountAnomalyAlert[]>([])

  // 通知状态
  const [notification, setNotification] = React.useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false,
  })

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type, visible: true })
  }

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }))
  }

  // 转换规则1数据
  const transformRule1Data = (items: WarningResponse['rule1_datas']): MissingPublishTimeAlert[] => {
    return items.map(item => ({
      videoId: item.video_id,
      videoName: item.video_name,
      publishChannel: item.publish_channel,
      actualPublishDate: item.actual_publish_date,
      operator: item.expected_operator,
    }))
  }

  // 转换规则2.1数据
  const transformRule21Data = (items: WarningResponse['rile2_1_datas']): VideoIdAnomalyWebAlert[] => {
    return items.map(item => ({
      videoId: item.video_id,
      videoName: item.video_name,
      publishChannel: item.publish_channel,
      actualPublishDate: item.actual_publish_date,
      operator: item.expected_operator,
    }))
  }

  // 转换规则2.2数据
  const transformRule22Data = (items: WarningResponse['rile2_2_datas']): VideoIdAnomalyDbAlert[] => {
    return items.map(item => ({
      videoId: item.video_id,
      publishUrl: item.publish_url,
      actualPublishTime: item.actual_publish_time,
    }))
  }

  // 转换规则3数据
  const transformRule3Data = (items: WarningResponse['rule3_datas']): ViewCountAnomalyAlert[] => {
    return items.map(item => ({
      videoId: item.video_id,
      videoName: item.video_name,
      publishChannel: item.publish_channel,
      publishTime: item.publish_time,
      operator: item.expected_operator,
      viewCount: item.view_count,
      viewDate: item.view_date,
    }))
  }

  // 查询告警数据
  const fetchWarnings = React.useCallback(async () => {
    if (!dateStart || !dateEnd) {
      return
    }

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        date_start: dateStart,
        date_end: dateEnd,
      })

      const { response } = await apiClient.get<{ response: WarningResponse }>(
        `/publishPlan/warning?${params.toString()}`
      )

      // 转换数据
      setRule1Data(transformRule1Data(response.rule1_datas || []))
      setRule21Data(transformRule21Data(response.rile2_1_datas || []))
      setRule22Data(transformRule22Data(response.rile2_2_datas || []))
      setRule3Data(transformRule3Data(response.rule3_datas || []))
    } catch (error) {
      console.error('Failed to fetch warnings:', error)
      // 清空数据
      setRule1Data([])
      setRule21Data([])
      setRule22Data([])
      setRule3Data([])
    } finally {
      setIsLoading(false)
    }
  }, [dateStart, dateEnd])

  // 初始加载
  React.useEffect(() => {
    fetchWarnings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQuery = () => {
    fetchWarnings()
  }

  const handleQuickDate = (days: number) => {
    const end = dayjs()
    const start = end.subtract(days - 1, 'day')
    setDateStart(start.format('YYYY-MM-DD'))
    setDateEnd(end.format('YYYY-MM-DD'))
  }

  // 通用的导出Excel函数
  const exportToExcel = <T extends object>(
    data: T[],
    columns: { key: keyof T; header: string }[],
    fileName: string
  ) => {
    if (data.length === 0) {
      showNotification('当前表格无数据可下载', 'error')
      return
    }

    const excelColumns = columns.map(col => ({
      header: col.header,
      key: String(col.key),
      width: 120,
    }))

    const excelData = data.map(item => {
      const row: Record<string, unknown> = {}
      columns.forEach(col => {
        row[String(col.key)] = item[col.key]
      })
      return row
    })

    const xmlContent = generateExcelXML([{
      name: fileName,
      columns: excelColumns,
      data: excelData,
    }])

    downloadExcel(xmlContent, fileName)
    showNotification('Excel文件已下载', 'success')
  }

  // 各表格导出处理函数
  const handleExportRule1 = () => exportToExcel(rule1Data, rule1Columns, '发布时间填写缺失')

  const handleExportRule21 = () => exportToExcel(rule21Data, rule21Columns, '视频ID异常-网页有数据库没有')

  const handleExportRule22 = () => exportToExcel(rule22Data, rule22Columns, '视频ID异常-数据库有网页没有')

  const handleExportRule3 = () => exportToExcel(rule3Data, rule3Columns, '播放量异常')

  const rule2Total = rule21Data.length + rule22Data.length

  // 规则1表格列定义
  const rule1Columns: { key: keyof MissingPublishTimeAlert; header: string; render?: (value: unknown, item: MissingPublishTimeAlert) => React.ReactNode }[] = [
    { 
      key: 'videoId', 
      header: '视频唯一ID', 
      render: (value) => (
        <a
          href={`https://www.youtube.com/watch?v=${value as string}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono text-xs"
        >
          {value as string}
        </a>
      ) 
    },
    { key: 'videoName', header: '剧名称' },
    { key: 'publishChannel', header: '发布频道' },
    { key: 'actualPublishDate', header: '实际发布日期', render: (value) => (value as string | null) || '—' },
    { key: 'operator', header: '预计负责运营人员' },
  ]

  // 规则2.1表格列定义
  const rule21Columns: { key: keyof VideoIdAnomalyWebAlert; header: string; render?: (value: unknown, item: VideoIdAnomalyWebAlert) => React.ReactNode }[] = [
    { 
      key: 'videoId', 
      header: '视频唯一ID', 
      render: (value) => (
        <a
          href={`https://www.youtube.com/watch?v=${value as string}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono text-xs"
        >
          {value as string}
        </a>
      ) 
    },
    { key: 'videoName', header: '剧名称' },
    { key: 'publishChannel', header: '发布频道' },
    { key: 'actualPublishDate', header: '实际发布日期' },
    { key: 'operator', header: '预计负责运营人员' },
  ]

  // 规则2.2表格列定义
  const rule22Columns: { key: keyof VideoIdAnomalyDbAlert; header: string; render?: (value: unknown, item: VideoIdAnomalyDbAlert) => React.ReactNode }[] = [
    { 
      key: 'videoId', 
      header: '视频唯一ID', 
      render: (value) => (
        <a
          href={`https://www.youtube.com/watch?v=${value as string}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono text-xs"
        >
          {value as string}
        </a>
      ) 
    },
    { 
      key: 'publishUrl', 
      header: '发布频道链接', 
      render: (value) => (
        <a
          // href={value as string}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all"
        >
          {value as string}
        </a>
      ) 
    },
    { 
      key: 'actualPublishTime', 
      header: '实际发布时间', 
      render: (value) => {
        if (!value) return '—'
        const date = dayjs(value as string)
        return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : (value as string)
      }
    },
  ]

  // 规则3表格列定义
  const rule3Columns: { key: keyof ViewCountAnomalyAlert; header: string; render?: (value: unknown, item: ViewCountAnomalyAlert) => React.ReactNode }[] = [
    { 
      key: 'videoId', 
      header: '视频唯一ID', 
      render: (value) => (
        <a
          href={`https://www.youtube.com/watch?v=${value as string}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-mono text-xs"
        >
          {value as string}
        </a>
      ) 
    },
    { key: 'videoName', header: '剧名称' },
    { key: 'publishChannel', header: '发布频道' },
    { key: 'publishTime', header: '发布时间' },
    { key: 'operator', header: '预计负责运营人员' },
    { 
      key: 'viewCount', 
      header: '观看量', 
      render: (value) => <Badge variant="destructive">{value as number}</Badge> 
    },
    { key: 'viewDate', header: '观看日期' },
  ]

  return (
    <div className="space-y-6 py-4">
      {/* 通知组件 */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.visible}
        onClose={hideNotification}
      />
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
              className="w-36 cursor-pointer"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              className="w-36 cursor-pointer"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
            <Button variant="outline" size="sm" onClick={() => handleQuickDate(2)}>
              近两天
            </Button>
            <Button size="sm" onClick={handleQuery} disabled={isLoading}>
              {isLoading ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
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
                共有告警信息 {rule1Data.length} 条
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <PaginatedTable
              data={rule1Data}
              isLoading={isLoading}
              columns={rule1Columns}
              onExportExcel={handleExportRule1}
            />
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
                共有告警信息 {rule2Total} 条
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            {/* 网页有 / 数据库没有 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">网页有 / 数据库没有 ({rule21Data.length}条)</h4>
              <PaginatedTable
                data={rule21Data}
                isLoading={isLoading}
                columns={rule21Columns}
                onExportExcel={handleExportRule21}
              />
            </div>

            {/* 数据库有 / 网页没有 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">数据库有 / 网页没有 ({rule22Data.length}条)</h4>
              <PaginatedTable
                data={rule22Data}
                isLoading={isLoading}
                columns={rule22Columns}
                onExportExcel={handleExportRule22}
              />
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
                共有告警信息 {rule3Data.length} 条
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <PaginatedTable
              data={rule3Data}
              isLoading={isLoading}
              columns={rule3Columns}
              onExportExcel={handleExportRule3}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
