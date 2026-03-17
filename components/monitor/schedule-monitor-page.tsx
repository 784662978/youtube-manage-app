'use client'

import * as React from 'react'
import dayjs from 'dayjs'
import { ScheduleSummary, type ScheduleSummaryProps } from './schedule-summary'
import type { DateRange } from '@/components/ui/date-range-picker'
import { ScheduleFilterBar } from './schedule-filter'
import { ScheduleTable } from './schedule-table'
import { ExcelImportDialog } from './excel-import-dialog'
import { apiClient } from '@/lib/api-client'
import type { ScheduleItem, ScheduleFilter, ScheduleSummaryReportResponse, SelectOption, ScheduleSearchParams, ScheduleItemResponse, ScheduleListResponse, Pagination, ImportDataItem, DictionariesResponse, ScheduleOverviewResponse } from '@/lib/types/monitor'
import { Notification } from '@/components/ui/notification'

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
    { value: '印地语', label: '印地语' },
    { value: '西班牙语', label: '西班牙语' },
    { value: '法语', label: '法语' },
    { value: '阿拉伯语', label: '阿拉伯语' },
    { value: '孟加拉语', label: '孟加拉语' },
    { value: '俄语', label: '俄语' },
    { value: '葡萄牙语', label: '葡萄牙语' },
    { value: '日语', label: '日语' },
    { value: '德语', label: '德语' },
    { value: '韩语', label: '韩语' },
    { value: '越南语', label: '越南语' },
    { value: '泰语', label: '泰语' },
    { value: '意大利语', label: '意大利语' },
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
  // 排期概况的独立日期范围
  const [summaryDateRange, setSummaryDateRange] = React.useState({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  })
  
  // 筛选条件（用于明细排期表）
  const [filter, setFilter] = React.useState<ScheduleFilter>({})
  
  // 实际用于查询的筛选条件（只在点击搜索时更新）
  const [searchFilter, setSearchFilter] = React.useState<ScheduleFilter>({})
  
  const [data, setData] = React.useState<ScheduleItem[]>([])
  const [summary, setSummary] = React.useState<ScheduleSummaryProps>(defaultSummary)
  const [showImportDialog, setShowImportDialog] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isTableLoading, setIsTableLoading] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  // 字典数据状态
  const [operatorOptions, setOperatorOptions] = React.useState<SelectOption[]>(defaultSelectOptions.operator)
  const [contentPrimaryOptions, setContentPrimaryOptions] = React.useState<SelectOption[]>(defaultSelectOptions.contentPrimary)
  const [contentSecondaryOptions, setContentSecondaryOptions] = React.useState<SelectOption[]>(defaultSelectOptions.contentSecondary)
  const [languageOptions, setLanguageOptions] = React.useState<SelectOption[]>(defaultSelectOptions.language)
  const [copyrightOwnerOptions, setCopyrightOwnerOptions] = React.useState<SelectOption[]>(defaultSelectOptions.copyrightOwner)
  const [channelOptions, setChannelOptions] = React.useState<SelectOption[]>(defaultSelectOptions.channel)
  const [pagination, setPagination] = React.useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
  })
  const [notification, setNotification] = React.useState<{
    isVisible: boolean
    message: string
    type: 'success' | 'error'
  }>({
    isVisible: false,
    message: '',
    type: 'success',
  })

  // 将筛选条件映射为API参数
  const buildSearchParams = (filter: ScheduleFilter, page: number, pageSize: number): ScheduleSearchParams => {
    const params: ScheduleSearchParams = {
      page,
      page_size: pageSize,
    }

    if (filter.expectedPublishDateStart) {
      params.expected_publish_date_start = filter.expectedPublishDateStart
    }
    if (filter.expectedPublishDateEnd) {
      params.expected_publish_date_end = filter.expectedPublishDateEnd
    }
    if (filter.actualPublishDateStart) {
      params.actual_publish_date_start = filter.actualPublishDateStart
    }
    if (filter.actualPublishDateEnd) {
      params.actual_publish_date_end = filter.actualPublishDateEnd
    }
    if (filter.contentPrimaryCategory) {
      params.content_category_level1 = filter.contentPrimaryCategory
    }
    if (filter.contentSecondaryCategory) {
      params.content_category_level2 = filter.contentSecondaryCategory
    }
    if (filter.language) {
      params.language = filter.language
    }
    if (filter.copyrightOwner) {
      params.copyright_owner = filter.copyrightOwner
    }
    if (filter.expectedPublishChannel) {
      params.expected_publish_channel = filter.expectedPublishChannel
    }
    if (filter.expectedOperator) {
      params.expected_operator = filter.expectedOperator
    }
    if (filter.isYPPPassed) {
      params.is_ypp_approved = filter.isYPPPassed
    }
    if (filter.publishStatus) {
      params.publish_status = filter.publishStatus
    }
    if (filter.copyrightStatus) {
      params.copyright_status = filter.copyrightStatus
    }
    if (filter.auditStatus) {
      params.review_status = filter.auditStatus
    }
    if (filter.auditConclusion) {
      params.review_result = filter.auditConclusion
    }
    if (filter.auditDate) {
      params.review_date = filter.auditDate
    }
    if (filter.operatorModification) {
      params.operation_revision_result = filter.operatorModification
    }
    if (filter.dramaNames && filter.dramaNames.length > 0) {
      params.video_name = filter.dramaNames[0] // 简化处理，只取第一个
    }
    if (filter.videoIds && filter.videoIds.length > 0) {
      params.video_id = filter.videoIds[0] // 简化处理，只取第一个
    }

    return params
  }

  // 将API响应转换为本地数据格式
  const transformScheduleItem = (item: ScheduleItemResponse): ScheduleItem => {
    return {
      id: item.id,
      expectedPublishDate: item.expected_publish_date,
      actualPublishDate: item.actual_publish_date,
      contentPrimaryCategory: item.content_category_level1,
      contentSecondaryCategory: item.content_category_level2,
      language: item.language,
      dramaName: item.video_name,
      copyrightOwner: item.copyright_owner,
      expectedPublishChannel: item.expected_publish_channel,
      isYPPPassed: item.is_ypp_approved === 1,
      expectedOperator: item.expected_operator,
      publishStatus: item.publish_status === 1 ? '已发布' : '未发布',
      copyrightStatus: item.copyright_status === 1 ? '正常' : '禁播',
      videoId: item.video_id,
      auditStatus: item.review_status === 0 ? '未审核' : item.review_status === 1 ? '已审核' : '待审核',
      auditConclusion: item.review_result === 1 ? '通过' : item.review_result === 0 ? '未通过' : null,
      auditDate: item.review_date,
      operatorModification: item.operation_revision_result === 1 ? '已修改' : item.operation_revision_result === 0 ? '未修改' : null,
    }
  }

  // 将本地数据转换为API导入格式
  const transformToImportData = (item: ScheduleItem): ImportDataItem => {
    return {
      id: item.id,
      expected_publish_date: item.expectedPublishDate,
      actual_publish_date: item.actualPublishDate,
      content_category_level1: item.contentPrimaryCategory,
      content_category_level2: item.contentSecondaryCategory,
      language: item.language,
      is_ypp_approved: item.isYPPPassed ? 1 : 0,
      publish_status: item.publishStatus === '已发布' ? 1 : 0,
      copyright_status: item.copyrightStatus === '正常' ? 1 : 0,
      video_name: item.dramaName,
      copyright_owner: item.copyrightOwner,
      expected_publish_channel: item.expectedPublishChannel,
      expected_operator: item.expectedOperator,
      video_id: item.videoId,
      review_status: item.auditStatus === '未审核' ? 0 : item.auditStatus === '已审核' ? 1 : 2,
      review_result: item.auditConclusion === '通过' ? 1 : item.auditConclusion === '未通过' ? 0 : null,
      review_date: item.auditDate,
      operation_revision_result: item.operatorModification === '已修改' ? 1 : item.operatorModification === '未修改' ? 0 : 0,
    }
  }

  // 获取字典数据
  const fetchDictionaries = React.useCallback(async () => {
    try {
      const { response } = await apiClient.get<{ response: DictionariesResponse }>('/publishPlan/dictionaries')
      
      // 将字符串数组转换为 SelectOption 格式
      const toOptions = (items: string[]) => items.map(item => ({ value: item, label: item }))
      
      setOperatorOptions(toOptions(response.expected_operator))
      setContentPrimaryOptions(toOptions(response.content_category_level1))
      setContentSecondaryOptions(toOptions(response.content_category_level2))
      setLanguageOptions(toOptions(response.language))
      setCopyrightOwnerOptions(toOptions(response.copyright_owner))
      setChannelOptions(toOptions(response.expected_publish_channel))
    } catch (error) {
      console.error('Failed to fetch dictionaries:', error)
      // 失败时使用默认数据
      setOperatorOptions(defaultSelectOptions.operator)
      setContentPrimaryOptions(defaultSelectOptions.contentPrimary)
      setContentSecondaryOptions(defaultSelectOptions.contentSecondary)
      setLanguageOptions(defaultSelectOptions.language)
      setCopyrightOwnerOptions(defaultSelectOptions.copyrightOwner)
      setChannelOptions(defaultSelectOptions.channel)
    }
  }, [])

  // 获取排期明细列表
  const fetchScheduleList = React.useCallback(async () => {
    setIsTableLoading(true)
    try {
      const params = buildSearchParams(searchFilter, pagination.page, pagination.pageSize)
      console.log('params', params)
      const { response } = await apiClient.get<{ response: ScheduleListResponse }>('/publishPlan/search', { ...params })
      
      // 转换数据格式
      const scheduleItems = response.data.map(transformScheduleItem)
      setData(scheduleItems)
      
      // 更新分页信息
      setPagination(prev => ({ 
        ...prev, 
        page: response.page,
        pageSize: response.pageSize,
        total: response.dataCount 
      }))
    } catch (error) {
      console.error('Failed to fetch schedule list:', error)
      // 失败时使用模拟数据
      setData(mockScheduleData)
    } finally {
      setIsTableLoading(false)
    }
  }, [searchFilter, pagination.page, pagination.pageSize])

  const fetchSummary = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const startDate = summaryDateRange.start || dayjs().startOf('month').format('YYYY-MM-DD')
      const endDate = summaryDateRange.end || dayjs().endOf('month').format('YYYY-MM-DD')

      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate
      })

      // 并行调用两个接口
      const [summaryReportRes, overviewRes] = await Promise.all([
        apiClient.get<{ response: ScheduleSummaryReportResponse }>(`/publishPlan/schedule-summary-report?${params.toString()}`),
        apiClient.get<{ response: ScheduleOverviewResponse }>(`/publishPlan/schedule-overview?${params.toString()}`)
      ])

      // Transform API response to ScheduleSummaryProps
      const newSummary = {
        dateRange: { start: startDate, end: endDate },
        totalVideos: overviewRes.response.total_videos,
        totalChannels: overviewRes.response.total_channels,
        yppPassedChannels: overviewRes.response.ypp_approved_channels,
        yppNotPassedChannels: overviewRes.response.ypp_not_approved_channels,
        totalOperators: overviewRes.response.operators_count,
        contentTypes: summaryReportRes.response.contentTypeDistributions.map(item => ({
          primaryCategory: item.contentCategoryLevel1,
          secondaryCategory: item.contentCategoryLevel2,
          videoCount: item.videoCount,
          copyrightDetails: item.copyrightDetail
        })),
        publishStatuses: summaryReportRes.response.publishStatusSummaries.map(item => ({
          status: item.status,
          count: item.count,
          remark: item.remark
        })),
        bannedVideos: summaryReportRes.response.prohibitedVideos.map(item => ({
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
  }, [summaryDateRange.start, summaryDateRange.end])

  React.useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  // 组件挂载时获取字典数据和排期明细
  React.useEffect(() => {
    fetchDictionaries()
    fetchScheduleList()
  }, [fetchDictionaries, fetchScheduleList])

  const handleSearch = () => {
    // 更新查询条件，触发明细排期表搜索
    setSearchFilter(filter)
    // 重置到第一页
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete<{ response: boolean }>(`/publishPlan/delete/${id}`)
      
      // 显示成功通知
      setNotification({
        isVisible: true,
        message: '删除成功',
        type: 'success',
      })
      
      // 重新获取明细排期表
      fetchScheduleList()
      
      // 重新获取概况数据
      fetchSummary()
    } catch (error) {
      console.error('Delete failed:', error)
      
      // 显示失败通知
      setNotification({
        isVisible: true,
        message: '删除失败，请重试',
        type: 'error',
      })
    }
  }

  const handleExport = async () => {
    if (isExporting) return
    
    setIsExporting(true)
    try {
      // 获取全部数据用于导出（使用较大的pageSize）
      const params = buildSearchParams(searchFilter, 1, 10000)
      const { response } = await apiClient.get<{ response: ScheduleListResponse }>('/publishPlan/search', { ...params })
      
      if (!response.data || response.data.length === 0) {
        setNotification({
          isVisible: true,
          message: '暂无数据可导出',
          type: 'error',
        })
        return
      }
      
      // 转换数据格式
      const allData = response.data.map(transformScheduleItem)
      
      // 导出Excel
      exportToExcel(allData)
      
      setNotification({
        isVisible: true,
        message: `成功导出 ${allData.length} 条数据`,
        type: 'success',
      })
    } catch (error) {
      console.error('Export failed:', error)
      setNotification({
        isVisible: true,
        message: '导出失败，请重试',
        type: 'error',
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = () => {
    setShowImportDialog(true)
  }

  // 处理日期范围变化（仅影响排期概况）
  const handleDateRangeChange = (range: DateRange) => {
    setSummaryDateRange({
      start: range.start,
      end: range.end,
    })
  }

  // 处理Excel导入结果
  const handleImportComplete = async (items: ScheduleItem[]): Promise<boolean> => {
    if (items.length === 0) {
      return false
    }

    try {
      // 转换数据格式
      const importData = items.map(transformToImportData)
      
      // 调用导入API
      await apiClient.post<{ response: boolean }>('/publishPlan/import', {
        datas: importData
      })

      // 显示成功通知
      setNotification({
        isVisible: true,
        message: `成功导入 ${items.length} 条数据`,
        type: 'success',
      })

      // 关闭导入对话框
      setShowImportDialog(false)

      // 重新获取明细排期表
      fetchScheduleList()

      // 重新获取概况数据
      fetchSummary()

      return true
    } catch (error) {
      console.error('Import failed:', error)
      
      // 显示失败通知
      setNotification({
        isVisible: true,
        message: '导入失败，请重试',
        type: 'error',
      })

      return false
    }
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
        contentPrimaryOptions={contentPrimaryOptions}
        contentSecondaryOptions={contentSecondaryOptions}
        languageOptions={languageOptions}
        yppOptions={defaultSelectOptions.ypp}
        publishStatusOptions={defaultSelectOptions.publishStatus}
        copyrightStatusOptions={defaultSelectOptions.copyrightStatus}
        copyrightOwnerOptions={copyrightOwnerOptions}
        channelOptions={channelOptions}
        operatorOptions={operatorOptions}
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
        isLoading={isTableLoading}
        isExporting={isExporting}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Excel导入对话框 */}
      <ExcelImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportComplete}
      />

      {/* 通知组件 */}
      <Notification
        isVisible={notification.isVisible}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}
