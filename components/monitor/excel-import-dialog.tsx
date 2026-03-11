'use client'

import * as React from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import type { ScheduleItem, SelectOption } from '@/lib/types/monitor'

// Excel列名到字段名的映射
const EXCEL_COLUMN_MAPPING: Record<string, keyof ScheduleItem> = {
  '预计发布日期': 'expectedPublishDate',
  '实际发布日期': 'actualPublishDate',
  '内容一级分类': 'contentPrimaryCategory',
  '内容二级分类': 'contentSecondaryCategory',
  '语种': 'language',
  '剧名称': 'dramaName',
  '版权方': 'copyrightOwner',
  '预计发布频道': 'expectedPublishChannel',
  '是否已过YPP': 'isYPPPassed',
  '预计负责运营人员': 'expectedOperator',
  '发布状态': 'publishStatus',
  '版权状态': 'copyrightStatus',
  '视频唯一ID': 'videoId',
  '审核状态': 'auditStatus',
  '审核结论': 'auditConclusion',
  '审核日期': 'auditDate',
  '运营再修改结论': 'operatorModification',
}

// 必填字段
const REQUIRED_FIELDS: (keyof ScheduleItem)[] = [
  'expectedPublishDate',
  'contentPrimaryCategory',
  'contentSecondaryCategory',
  'language',
  'dramaName',
  'copyrightOwner',
  'expectedPublishChannel',
  'expectedOperator',
  'videoId',
]

// 导入结果类型
interface ImportResult {
  success: boolean
  rowIndex: number
  data?: Partial<ScheduleItem>
  errors: string[]
  warnings: string[]
}

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (items: ScheduleItem[]) => void
  // 用于验证的选项列表
  contentPrimaryOptions: SelectOption[]
  contentSecondaryOptions: SelectOption[]
  languageOptions: SelectOption[]
  channelOptions: SelectOption[]
  operatorOptions: SelectOption[]
  copyrightStatusOptions: SelectOption[]
  auditStatusOptions: SelectOption[]
  auditConclusionOptions: SelectOption[]
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  onImport,
  contentPrimaryOptions,
  contentSecondaryOptions,
  languageOptions,
  channelOptions,
  operatorOptions,
  copyrightStatusOptions,
  auditStatusOptions,
  auditConclusionOptions,
}: ExcelImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [parseResults, setParseResults] = React.useState<ImportResult[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [step, setStep] = React.useState<'upload' | 'preview' | 'result'>('upload')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 重置状态
  const resetState = () => {
    setFile(null)
    setParseResults([])
    setStep('upload')
    setIsProcessing(false)
  }

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  // 验证单行数据
  const validateRow = (
    rowData: Record<string, unknown>,
    rowIndex: number,
    validOptions: {
      contentPrimary: string[]
      contentSecondary: string[]
      language: string[]
      channel: string[]
      operator: string[]
      copyrightStatus: string[]
      auditStatus: string[]
      auditConclusion: string[]
    }
  ): ImportResult => {
    const errors: string[] = []
    const warnings: string[] = []
    const data: Partial<ScheduleItem> = {}

    // 映射字段
    Object.entries(EXCEL_COLUMN_MAPPING).forEach(([excelCol, field]) => {
      const value = rowData[excelCol]
      if (value !== undefined && value !== null && value !== '') {
        // 特殊处理布尔值
        if (field === 'isYPPPassed') {
          data[field] = value === '是' || value === true || value === 'TRUE' || value === 1
        } else if (field === 'actualPublishDate' || field === 'auditDate') {
          data[field] = value ? String(value) : null
        } else {
          data[field] = String(value)
        }
      }
    })

    // 检查必填字段
    REQUIRED_FIELDS.forEach((field) => {
      const value = data[field]
      if (value === undefined || value === null || value === '') {
        errors.push(`缺少必填字段: ${Object.keys(EXCEL_COLUMN_MAPPING).find(k => EXCEL_COLUMN_MAPPING[k] === field)}`)
      }
    })

    // 验证选项值是否在允许范围内
    if (data.contentPrimaryCategory && !validOptions.contentPrimary.includes(data.contentPrimaryCategory)) {
      warnings.push(`内容一级分类 "${data.contentPrimaryCategory}" 不在预设选项中`)
    }
    if (data.contentSecondaryCategory && !validOptions.contentSecondary.includes(data.contentSecondaryCategory)) {
      warnings.push(`内容二级分类 "${data.contentSecondaryCategory}" 不在预设选项中`)
    }
    if (data.language && !validOptions.language.includes(data.language)) {
      warnings.push(`语种 "${data.language}" 不在预设选项中`)
    }
    if (data.expectedPublishChannel && !validOptions.channel.includes(data.expectedPublishChannel)) {
      warnings.push(`预计发布频道 "${data.expectedPublishChannel}" 不在预设选项中`)
    }
    if (data.expectedOperator && !validOptions.operator.includes(data.expectedOperator)) {
      warnings.push(`预计负责运营人员 "${data.expectedOperator}" 不在预设选项中`)
    }

    // 验证发布状态
    if (data.publishStatus && !['已发布', '未发布'].includes(data.publishStatus)) {
      errors.push(`发布状态 "${data.publishStatus}" 无效，应为 "已发布" 或 "未发布"`)
    }

    // 验证审核状态
    if (data.auditStatus && !['未审核', '已审核', '待审核'].includes(data.auditStatus)) {
      warnings.push(`审核状态 "${data.auditStatus}" 不在预设选项中`)
    }

    // 验证审核结论
    if (data.auditConclusion && !['通过', '未通过'].includes(data.auditConclusion)) {
      warnings.push(`审核结论 "${data.auditConclusion}" 不在预设选项中`)
    }

    // 验证日期格式
    const dateFields = ['expectedPublishDate', 'actualPublishDate', 'auditDate'] as const
    dateFields.forEach((field) => {
      const value = data[field]
      if (value && typeof value === 'string') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(value) && !isNaN(Date.parse(value))) {
          // 尝试转换日期格式
          const date = new Date(value)
          data[field] = date.toISOString().split('T')[0]
        } else if (!dateRegex.test(value)) {
          errors.push(`日期格式错误: ${field} = "${value}"，应为 YYYY-MM-DD`)
        }
      }
    })

    return {
      success: errors.length === 0,
      rowIndex,
      data,
      errors,
      warnings,
    }
  }

  // 解析Excel文件
  const parseExcelFile = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // 转换为JSON
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)
      
      // 有效的选项值列表
      const validOptions = {
        contentPrimary: contentPrimaryOptions.map(o => o.value),
        contentSecondary: contentSecondaryOptions.map(o => o.value),
        language: languageOptions.map(o => o.value),
        channel: channelOptions.map(o => o.value),
        operator: operatorOptions.map(o => o.value),
        copyrightStatus: copyrightStatusOptions.map(o => o.value),
        auditStatus: auditStatusOptions.map(o => o.value),
        auditConclusion: auditConclusionOptions.map(o => o.value),
      }

      // 验证每一行数据
      const results: ImportResult[] = jsonData.map((row, index) => 
        validateRow(row, index + 2, validOptions) // Excel行号从2开始（第1行是表头）
      )

      setParseResults(results)
      setStep('preview')
    } catch (error) {
      console.error('Parse error:', error)
      alert('文件解析失败，请检查文件格式是否正确')
    } finally {
      setIsProcessing(false)
    }
  }

  // 执行导入
  const executeImport = () => {
    const validItems: ScheduleItem[] = parseResults
      .filter(r => r.success && r.data)
      .map((r, index) => ({
        id: `import_${Date.now()}_${index}`,
        expectedPublishDate: r.data!.expectedPublishDate || '',
        actualPublishDate: r.data!.actualPublishDate || null,
        contentPrimaryCategory: r.data!.contentPrimaryCategory || '',
        contentSecondaryCategory: r.data!.contentSecondaryCategory || '',
        language: r.data!.language || '',
        dramaName: r.data!.dramaName || '',
        copyrightOwner: r.data!.copyrightOwner || '',
        expectedPublishChannel: r.data!.expectedPublishChannel || '',
        isYPPPassed: r.data!.isYPPPassed || false,
        expectedOperator: r.data!.expectedOperator || '',
        publishStatus: (r.data!.publishStatus as '已发布' | '未发布') || '未发布',
        copyrightStatus: r.data!.copyrightStatus || '',
        videoId: r.data!.videoId || '',
        auditStatus: (r.data!.auditStatus as ScheduleItem['auditStatus']) || '未审核',
        auditConclusion: (r.data!.auditConclusion as '通过' | '未通过') || null,
        auditDate: r.data!.auditDate || null,
        operatorModification: (r.data!.operatorModification as '已修改' | '未修改') || null,
      }))

    onImport(validItems)
    setStep('result')
  }

  // 关闭对话框
  const handleClose = () => {
    resetState()
    onOpenChange(false)
  }

  // 统计信息
  const stats = {
    total: parseResults.length,
    success: parseResults.filter(r => r.success).length,
    failed: parseResults.filter(r => !r.success).length,
    warnings: parseResults.filter(r => r.warnings.length > 0).length,
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" />
            Excel导入
          </DialogTitle>
          <DialogDescription>
            上传Excel文件，系统将自动解析并导入数据
          </DialogDescription>
        </DialogHeader>

        {/* 上传步骤 */}
        {step === 'upload' && (
          <div className="py-6">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                点击上传或拖拽文件到此处
              </p>
              <p className="text-xs text-muted-foreground">
                支持 .xlsx, .xls, .csv 格式
              </p>
              {file && (
                <p className="text-sm text-primary mt-4">
                  已选择: {file.name}
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 字段映射说明 */}
            <Card className="mt-6">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Excel列名要求</CardTitle>
              </CardHeader>
              <CardContent className="text-xs">
                <div className="grid grid-cols-3 gap-2 text-muted-foreground">
                  {Object.keys(EXCEL_COLUMN_MAPPING).map((col) => (
                    <div key={col} className="flex items-center gap-1">
                      {REQUIRED_FIELDS.includes(EXCEL_COLUMN_MAPPING[col]) && (
                        <span className="text-destructive">*</span>
                      )}
                      <span>{col}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-muted-foreground">
                  <span className="text-destructive">*</span> 为必填字段
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 预览步骤 */}
        {step === 'preview' && (
          <div className="py-4 space-y-4">
            {/* 统计信息 */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="py-3 text-center">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">总行数</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                  <div className="text-xs text-muted-foreground">可导入</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-xs text-muted-foreground">错误</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                  <div className="text-xs text-muted-foreground">警告</div>
                </CardContent>
              </Card>
            </div>

            {/* 预览表格 */}
            <div className="border rounded-md overflow-y-auto max-h-75">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">行号</TableHead>
                    <TableHead className="w-20">状态</TableHead>
                    <TableHead>剧名称</TableHead>
                    <TableHead>视频ID</TableHead>
                    <TableHead>错误/警告</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResults.map((result, index) => (
                    <TableRow key={index} className={!result.success ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                      <TableCell>{result.rowIndex}</TableCell>
                      <TableCell>
                        {result.success ? (
                          result.warnings.length > 0 ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                              <AlertCircle className="size-3 mr-1" />
                              警告
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <CheckCircle2 className="size-3 mr-1" />
                              正常
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
                            <XCircle className="size-3 mr-1" />
                            错误
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{result.data?.dramaName || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{result.data?.videoId || '-'}</TableCell>
                      <TableCell className="text-xs">
                        {result.errors.length > 0 && (
                          <div className="text-red-600">
                            {result.errors.map((e, i) => <div key={i}>{e}</div>)}
                          </div>
                        )}
                        {result.warnings.length > 0 && (
                          <div className="text-yellow-600">
                            {result.warnings.map((w, i) => <div key={i}>{w}</div>)}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {stats.failed > 0 && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <AlertCircle className="size-4 inline mr-2 text-yellow-600" />
                存在 {stats.failed} 行数据校验失败，这些行将被跳过，仅导入有效数据
              </div>
            )}
          </div>
        )}

        {/* 结果步骤 */}
        {step === 'result' && (
          <div className="py-8 text-center">
            <CheckCircle2 className="size-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-medium mb-2">导入完成</h3>
            <p className="text-muted-foreground">
              成功导入 {stats.success} 条数据
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button onClick={parseExcelFile} disabled={!file || isProcessing}>
                {isProcessing ? '解析中...' : '解析文件'}
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { resetState(); setStep('upload'); }}>
                重新上传
              </Button>
              <Button 
                onClick={executeImport} 
                disabled={stats.success === 0}
              >
                导入 {stats.success} 条有效数据
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={handleClose}>
              完成
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
