'use client'

import * as React from 'react'
import { ScheduleSummary } from './schedule-summary'
import { ScheduleFilterBar } from './schedule-filter'
import { ScheduleTable } from './schedule-table'
import { ExcelImportDialog } from './excel-import-dialog'
import type { ScheduleItem, ScheduleFilter, SelectOption } from '@/lib/types/monitor'

// 模拟下拉选项数据
const defaultSelectOptions = {
  contentPrimary: [
    { value: '短剧', label: '短剧' },
    { value: '长剧', label: '长剧' },
  ],
  contentSecondary: [
    { value: '长剧', label: '长剧' },
    { value: '分销', label: '分销' },
    { value: '解说', label: '解说' },
  ],
  language: [
    { value: '中文', label: '中文' },
    { value: '英文', label: '英文' },
    { value: '日语', label: '日语' },
    { value: '韩语', label: '韩语' },
  ],
  ypp: [
    { value: '是', label: '是' },
    { value: '否', label: '否' },
  ],
  publishStatus: [
    { value: '已发布', label: '已发布' },
    { value: '未发布', label: '未发布' },
  ],
  copyrightStatus: [
    { value: '已授权', label: '已授权' },
    { value: '未授权', label: '未授权' },
    { value: '待确认', label: '待确认' },
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
    { value: '未审核', label: '未审核' },
    { value: '已审核', label: '已审核' },
    { value: '待审核', label: '待审核' },
  ],
  auditConclusion: [
    { value: '通过', label: '通过' },
    { value: '未通过', label: '未通过' },
  ],
  modification: [
    { value: '已修改', label: '已修改' },
    { value: '未修改', label: '未修改' },
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

const mockSummary = {
  dateRange: { start: '2026-01-01', end: '2026-01-31' },
  totalVideos: 2,
  totalChannels: 3,
  yppPassedChannels: 1,
  yppNotPassedChannels: 2,
  totalOperators: 2,
  contentTypes: [
    {
      primaryCategory: '短剧',
      secondaryCategory: '长剧',
      videoCount: 1,
      copyrightDetails: '版权方A 1部',
    },
    {
      primaryCategory: '短剧',
      secondaryCategory: '分销',
      videoCount: 1,
      copyrightDetails: '—',
    },
  ],
  publishStatuses: [
    { status: '已发布', count: 1, remark: '' },
    { status: '未发布', count: 1, remark: '' },
    { status: '处于禁播状态的未发布视频', count: 0, remark: '详见下表格' },
  ],
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
  const [filter, setFilter] = React.useState<ScheduleFilter>({})
  const [data, setData] = React.useState<ScheduleItem[]>(mockScheduleData)
  const [showImportDialog, setShowImportDialog] = React.useState(false)

  const handleSearch = () => {
    // TODO: 实现搜索逻辑（对接API）
    console.log('Search with filter:', filter)
  }

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id))
  }

  const handleSave = (item: ScheduleItem) => {
    // 更新现有记录
    const index = data.findIndex((d) => d.id === item.id)
    if (index >= 0) {
      const newData = [...data]
      newData[index] = item
      setData(newData)
    }
  }

  const handleAdd = (item: ScheduleItem) => {
    // 新增记录
    setData([...data, item])
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

  // 处理Excel导入结果
  const handleImportComplete = (items: ScheduleItem[]) => {
    setData([...data, ...items])
  }

  // 更新概况统计
  const updateSummary = React.useMemo(() => {
    const totalVideos = data.length
    const channels = new Set(data.map((d) => d.expectedPublishChannel))
    const operators = new Set(data.map((d) => d.expectedOperator))
    const yppPassed = data.filter((d) => d.isYPPPassed).length
    const yppNotPassed = totalVideos - yppPassed

    // 内容类型统计
    const typeMap = new Map<string, { count: number; copyrights: Set<string> }>()
    data.forEach((item) => {
      const key = `${item.contentPrimaryCategory}-${item.contentSecondaryCategory}`
      if (!typeMap.has(key)) {
        typeMap.set(key, { count: 0, copyrights: new Set() })
      }
      const entry = typeMap.get(key)!
      entry.count++
      entry.copyrights.add(item.copyrightOwner)
    })
    const contentTypes = Array.from(typeMap.entries()).map(([key, value]) => {
      const [primary, secondary] = key.split('-')
      return {
        primaryCategory: primary,
        secondaryCategory: secondary,
        videoCount: value.count,
        copyrightDetails: Array.from(value.copyrights).join('、') + ` 各${value.count}部`,
      }
    })

    // 发布状态统计
    const published = data.filter((d) => d.publishStatus === '已发布').length
    const unpublished = data.filter((d) => d.publishStatus === '未发布').length
    const publishStatuses = [
      { status: '已发布', count: published, remark: '' },
      { status: '未发布', count: unpublished, remark: '' },
    ]

    return {
      ...mockSummary,
      totalVideos,
      totalChannels: channels.size,
      yppPassedChannels: yppPassed,
      yppNotPassedChannels: yppNotPassed,
      totalOperators: operators.size,
      contentTypes,
      publishStatuses,
    }
  }, [data])

  return (
    <div className="space-y-6 py-4">
      {/* 排期概况 */}
      <ScheduleSummary {...updateSummary} />

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
        onSave={handleSave}
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
        contentPrimaryOptions={defaultSelectOptions.contentPrimary}
        contentSecondaryOptions={defaultSelectOptions.contentSecondary}
        languageOptions={defaultSelectOptions.language}
        channelOptions={defaultSelectOptions.channel}
        operatorOptions={defaultSelectOptions.operator}
        copyrightStatusOptions={defaultSelectOptions.copyrightStatus}
        auditStatusOptions={defaultSelectOptions.auditStatus}
        auditConclusionOptions={defaultSelectOptions.auditConclusion}
        modificationOptions={defaultSelectOptions.modification}
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
