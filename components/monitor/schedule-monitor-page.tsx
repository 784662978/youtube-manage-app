'use client'

import * as React from 'react'
import dayjs from 'dayjs'
import { ScheduleSummary, type ScheduleSummaryProps } from './schedule-summary'
import type { DateRange } from '@/components/ui/date-range-picker'
import { ScheduleFilterBar } from './schedule-filter'
import { ScheduleTable } from './schedule-table'
import { ExcelImportDialog } from './excel-import-dialog'
import { apiClient } from '@/lib/api-client'
import type { ScheduleItem, ScheduleFilter, ScheduleSummaryReportResponse } from '@/lib/types/monitor'

// 模拟下拉选项数据
const defaultSelectOptions = {
  contentPrimary: [
    { value: '短剧', label: '短剧' },
    { value: '动态漫', label: '动态漫' },
    { value: '电视剧', label: '电视剧' },
    { value: '真人短剧', label: '真人短剧' },
  ],
  contentSecondary: [
    { value: '长剧', label: '长剧' },
    { value: '分销', label: '分销' },
    { value: '解说', label: '解说' },
    { value: '其他', label: '其他' },
  ],
  language: [
    { value: '中文', label: '中文' },
    { value: '英文', label: '英文' },
    { value: '日语', label: '日语' },
    { value: '韩语', label: '韩语' },
  ],
  ypp: [
    { value: '1', label: '是' },
    { value: '0', label: '否' },
  ],
  publishStatus: [
    { value: '1', label: '已发布' },
    { value: '0', label: '未发布' },
  ],
  copyrightStatus: [
    { value: '1', label: '正常' },
    { value: '0', label: '禁播' },
  ],
  copyrightOwner: [
    { value: '版权方A', label: '版权方A' },
    { value: '版权方B', label: '版权方B' },
    { value: '版权方C', label: '版权方C' },
  ],
  channel: [
    { value: '频道1', label: '频道1' },
    { value: '频道2', label: '频道2' },
    { value: '频道3', label: '频道3' },
  ],
  operator: [
    { value: '张三', label: '张三' },
    { value: '李四', label: '李四' },
    { value: '王五', label: '王五' },
  ],
  auditStatus: [
    { value: '0', label: '未审核' },
    { value: '1', label: '已审核' },
  ],
  auditConclusion: [
    { value: '1', label: '通过' },
    { value: '0', label: '未通过' },
  ],
  modification: [
    { value: '1', label: '已修改' },
    { value: '0', label: '未修改' },
  ],
}

// 模拟数据
const mockScheduleData: ScheduleItem[] = [
  {
    id: '1',
    expectedPublishDate: '2026-01-15',
    actualPublishDate: null,
    contentPrimaryCategory: '短剧',
    contentSecondaryCategory: '长剧',
    language: '中文',
    dramaName: '示例剧名1',
    copyrightOwner: '版权方A',
    expectedPublishChannel: '频道1',
    isYPPPassed: true,
    expectedOperator: '张三',
    publishStatus: '未发布',
    copyrightStatus: '已授权',
    videoId: 'vid_001',
    auditStatus: '待审核',
    auditConclusion: null,
    auditDate: null,
    operatorModification: null,
  },
  {
    id: '2',
    expectedPublishDate: '2026-01-20',
    actualPublishDate: '2026-01-20',
    contentPrimaryCategory: '短剧',
    contentSecondaryCategory: '分销',
    language: '中文',
    dramaName: '示例剧名2',
    copyrightOwner: '版权方B',
    expectedPublishChannel: '频道2',
    isYPPPassed: false,
    expectedOperator: '李四',
    publishStatus: '已发布',
    copyrightStatus: '已授权',
    videoId: 'vid_002',
    auditStatus: '已审核',
    auditConclusion: '通过',
    auditDate: '2026-01-19',
    operatorModification: '已修改',
  },
]

const defaultSummary: ScheduleSummaryProps = {
  dateRange: { start: '', end: '' },
  totalVideos: 0,
  totalChannels: 0,
  yppPassedChannels: 0,
  yppNotPassedChannels: 0,
  totalOperators: 0,
  contentTypes: [],
  publishStatuses: [],
  bannedVideos: [],
}

// Excel导出功能
function exportToExcel(data: ScheduleItem[], filename: string = '排期明细') {
  // 定义列标题映射
  const columns: { key: keyof ScheduleItem; label: string }[] = [
    { key: 'expectedPublishDate', label: '预计发布日期' },
    { key: 'actualPublishDate', label: '实际发布日期' },
    { key: 'contentPrimaryCategory', label: '内容一级分类' },
    { key: 'contentSecondaryCategory', label: '内容二级分类' },
    { key: 'language', label: '语种' },
    { key: 'dramaName', label: '剧名称' },
    { key: 'copyrightOwner', label: '版权方' },
    { key: 'expectedPublishChannel', label: '预计发布频道' },
    { key: 'isYPPPassed', label: '是否已过YPP' },
    { key: 'expectedOperator', label: '预计负责运营人员' },
    { key: 'publishStatus', label: '发布状态' },
    { key: 'copyrightStatus', label: '版权状态' },
    { key: 'videoId', label: '视频唯一ID' },
    { key: 'auditStatus', label: '审核状态' },
    { key: 'auditConclusion', label: '审核结论' },
    { key: 'auditDate', label: '审核日期' },
    { key: 'operatorModification', label: '运营再修改结论' },
  ]

  // 构建CSV内容（使用UTF-8 BOM以确保Excel正确识别中文）
  const BOM = '\uFEFF'
  const header = columns.map((col) => col.label).join(',')
  
  const rows = data.map((item) => {
    return columns.map((col) => {
      const value = item[col.key]
      // 处理特殊值
      if (value === null || value === undefined) {
        return ''
      }
      if (typeof value === 'boolean') {
        return value ? '是' : '否'
      }
      // 转义包含逗号或换行的内容
      const strValue = String(value)
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`
      }
      return strValue
    }).join(',')
  })

  const csvContent = BOM + header + '\n' + rows.join('\n')

  // 创建Blob并下载
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function ScheduleMonitorPage() {
  const [filter, setFilter] = React.useState<ScheduleFilter>({
    expectedPublishDateStart: dayjs().startOf('month').format('YYYY-MM-DD'),
    expectedPublishDateEnd: dayjs().endOf('month').format('YYYY-MM-DD'),
  })
  const [data, setData] = React.useState<ScheduleItem[]>(mockScheduleData)
  const [summary, setSummary] = React.useState<ScheduleSummaryProps>(defaultSummary)
  const [showImportDialog, setShowImportDialog] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  const fetchSummary = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const startDate = filter.expectedPublishDateStart || dayjs().startOf('month').format('YYYY-MM-DD')
      const endDate = filter.expectedPublishDateEnd || dayjs().endOf('month').format('YYYY-MM-DD')

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })

      const { response } = await apiClient.get<{ response: ScheduleSummaryReportResponse }>(`/publishPlan/schedule-summary-report?${params.toString()}`)

      // Transform API response to ScheduleSummaryProps
      const newSummary = {
        dateRange: { start: startDate, end: endDate },
        totalVideos: response.contentTypeDistributions.reduce((acc, curr) => acc + curr.videoCount, 0),
        // Since API doesn't provide these counts yet, we keep them as 0 or could fetch separately if needed
        totalChannels: 0,
        yppPassedChannels: 0,
        yppNotPassedChannels: 0,
        totalOperators: 0,
        contentTypes: response.contentTypeDistributions.map(item => ({
          primaryCategory: item.contentCategoryLevel1,
          secondaryCategory: item.contentCategoryLevel2,
          videoCount: item.videoCount,
          copyrightDetails: item.copyrightDetail
        })),
        publishStatuses: response.publishStatusSummaries.map(item => ({
          status: item.status,
          count: item.count,
          remark: item.remark
        })),
        bannedVideos: response.prohibitedVideos.map(item => ({
          videoId: item.videoId,
          dramaName: item.videoName,
          expectedChannel: item.plannedChannel,
          expectedOperator: item.plannedOperator
        }))
      }

      setSummary(newSummary)
    } catch (error) {
      console.error('Failed to fetch schedule summary', error)
    } finally {
      setIsLoading(false)
    }
  }, [filter.expectedPublishDateStart, filter.expectedPublishDateEnd])

  React.useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handleSearch = () => {
    // TODO: 实现搜索逻辑（对接API）
    console.log('Search with filter:', filter)
    fetchSummary()
  }

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id))
  }

  const handleExport = () => {
    if (data.length === 0) {
      alert('暂无数据可导出')
      return
    }
    try {
      exportToExcel(data)
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败，请重试')
    }
  }

  const handleImport = () => {
    setShowImportDialog(true)
  }

  // 处理日期范围变化
  const handleDateRangeChange = (range: DateRange) => {
    setFilter(prev => ({
      ...prev,
      expectedPublishDateStart: range.start,
      expectedPublishDateEnd: range.end,
    }))
  }

  // 处理Excel导入结果
  const handleImportComplete = (items: ScheduleItem[]) => {
    setData([...data, ...items])
  }

  return (
    <div className="space-y-6 py-4">
      {/* 排期概况 */}
      <ScheduleSummary 
        {...summary} 
        isLoading={isLoading}
        onDateRangeChange={handleDateRangeChange}
      />

      {/* 筛选栏 */}
      <ScheduleFilterBar
        filter={filter}
        onFilterChange={setFilter}
        onSearch={handleSearch}
        contentPrimaryOptions={defaultSelectOptions.contentPrimary}
        contentSecondaryOptions={defaultSelectOptions.contentSecondary}
        languageOptions={defaultSelectOptions.language}
        yppOptions={defaultSelectOptions.ypp}
        publishStatusOptions={defaultSelectOptions.publishStatus}
        copyrightStatusOptions={defaultSelectOptions.copyrightStatus}
        copyrightOwnerOptions={defaultSelectOptions.copyrightOwner}
        channelOptions={defaultSelectOptions.channel}
        operatorOptions={defaultSelectOptions.operator}
        auditStatusOptions={defaultSelectOptions.auditStatus}
        auditConclusionOptions={defaultSelectOptions.auditConclusion}
        modificationOptions={defaultSelectOptions.modification}
      />

      {/* 明细排期表 */}
      <ScheduleTable
        data={data}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Excel导入对话框 */}
      <ExcelImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportComplete}
        contentPrimaryOptions={defaultSelectOptions.contentPrimary}
        contentSecondaryOptions={defaultSelectOptions.contentSecondary}
        languageOptions={defaultSelectOptions.language}
        channelOptions={defaultSelectOptions.channel}
        operatorOptions={defaultSelectOptions.operator}
        copyrightStatusOptions={defaultSelectOptions.copyrightStatus}
        auditStatusOptions={defaultSelectOptions.auditStatus}
        auditConclusionOptions={defaultSelectOptions.auditConclusion}
      />
    </div>
  )
}
