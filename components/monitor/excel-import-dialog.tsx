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
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react'
import type { ScheduleItem } from '@/lib/types/monitor'

// Excel列名到字段名的映射
const EXCEL_COLUMN_MAPPING: Record<string, keyof ScheduleItem> = {
  'schedule_id': 'id',
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
  '剪辑日期': 'editingDate',
}

// 必填字段
const REQUIRED_FIELDS: (keyof ScheduleItem)[] = [
  'id', // schedule_id 为必填项
  'expectedPublishDate',
  'contentPrimaryCategory',
  'contentSecondaryCategory',
  'language',
  'dramaName',
  'copyrightOwner',
  'expectedPublishChannel',
  'isYPPPassed',
  'expectedOperator',
]

// 日期字段列表
const DATE_FIELDS: (keyof ScheduleItem)[] = [
  'expectedPublishDate',
  'actualPublishDate',
  'auditDate',
  'editingDate',
]

// 预览表格显示的列（按顺序）
const PREVIEW_COLUMNS: { excelCol: string; field: keyof ScheduleItem; width?: string }[] = [
  { excelCol: 'schedule_id', field: 'id', width: 'w-20' },
  { excelCol: '预计发布日期', field: 'expectedPublishDate', width: 'w-28' },
  { excelCol: '实际发布日期', field: 'actualPublishDate', width: 'w-28' },
  { excelCol: '内容一级分类', field: 'contentPrimaryCategory', width: 'w-24' },
  { excelCol: '内容二级分类', field: 'contentSecondaryCategory', width: 'w-24' },
  { excelCol: '语种', field: 'language', width: 'w-20' },
  { excelCol: '剧名称', field: 'dramaName', width: 'w-32' },
  { excelCol: '版权方', field: 'copyrightOwner', width: 'w-24' },
  { excelCol: '预计发布频道', field: 'expectedPublishChannel', width: 'w-28' },
  { excelCol: '是否已过YPP', field: 'isYPPPassed', width: 'w-24' },
  { excelCol: '预计负责运营人员', field: 'expectedOperator', width: 'w-28' },
  { excelCol: '发布状态', field: 'publishStatus', width: 'w-20' },
  { excelCol: '版权状态', field: 'copyrightStatus', width: 'w-20' },
  { excelCol: '视频唯一ID', field: 'videoId', width: 'w-28' },
  { excelCol: '审核状态', field: 'auditStatus', width: 'w-20' },
  { excelCol: '审核结论', field: 'auditConclusion', width: 'w-20' },
  { excelCol: '审核日期', field: 'auditDate', width: 'w-28' },
  { excelCol: '运营再修改结论', field: 'operatorModification', width: 'w-28' },
  { excelCol: '剪辑日期', field: 'editingDate', width: 'w-28' },
]

// 格式化单元格值显示
const formatCellValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">-</span>
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return String(value)
}

// 格式化日期为 YYYY-MM-DD 格式
// 主要处理 Excel 序列号日期，避免时区问题
const formatDate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  // 如果是数字（Excel 序列号日期）- 最常见的情况
  if (typeof value === 'number') {
    // Excel 日期序列号转换公式：
    // Excel 序列号 1 = 1900-01-01
    // 但 Excel 有一个 bug：它认为 1900 年是闰年，所以 1900-02-29 被计为序列号 60
    // 因此对于序列号 >= 60 的日期，需要减 1 来修正
    // 更简单的方法：使用 UTC 日期计算，Excel 序列号代表的是纯日期，没有时区
    
    // 方法：Excel 序列号转 JS Date
    // JS Date 的 UTC 时间戳 = (Excel序列号 - 25569) * 86400000
    // 其中 25569 是 1970-01-01 对应的 Excel 序列号
    
    const excelSerial = value;
    const jsTime = (excelSerial - 25569) * 86400000;
    const date = new Date(jsTime);
    
    // 使用 UTC 方法获取日期，确保不受本地时区影响
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    console.log('Excel序列号转换:', excelSerial, '->', `${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
  }

  // 如果是 Date 对象（兼容旧数据或特殊情况）
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    // 假设 Date 对象已经正确表示了日期，使用本地时区获取
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    console.log('Date对象转换:', value, '->', `${year}-${month}-${day}`)
    return `${year}-${month}-${day}`
  }

  // 如果是字符串
  if (typeof value === 'string') {
    const dateStr = value.trim()
    
    // 已经是 YYYY-MM-DD 格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    // 尝试解析其他格式
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear()
      const month = String(parsed.getMonth() + 1).padStart(2, '0')
      const day = String(parsed.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  return null
}

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
  onImport: (items: ScheduleItem[]) => Promise<boolean>
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  onImport,
}: ExcelImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null)
  const [parseResults, setParseResults] = React.useState<ImportResult[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [importError, setImportError] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<'upload' | 'preview' | 'result'>('upload')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // 重置状态
  const resetState = () => {
    setFile(null)
    setParseResults([])
    setStep('upload')
    setIsProcessing(false)
    setIsImporting(false)
    setImportError(null)
  }

  // 弹窗打开时重置状态
  React.useEffect(() => {
    if (open) {
      resetState()
    }
  }, [open])

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
    rowIndex: number
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
          ;(data as Record<string, unknown>)[field] = value === '是' || value === true || value === 'TRUE' || value === 1
        } else if (DATE_FIELDS.includes(field)) {
          // 日期字段格式化
          ;(data as Record<string, unknown>)[field] = formatDate(value)
        } else {
          ;(data as Record<string, unknown>)[field] = String(value)
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
      // 不使用 cellDates，让日期保持为数字序列号，避免时区问题
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false })
      
      // 获取第一个工作表
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      // 转换为JSON
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet)
      console.log('Excel原始数据:', jsonData)

      // 验证每一行数据
      const results: ImportResult[] = jsonData.map((row, index) => 
        validateRow(row, index + 2) // Excel行号从2开始（第1行是表头）
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
  const executeImport = async () => {
    const validItems: ScheduleItem[] = parseResults
      .filter(r => r.success && r.data && r.data.id) // id 必须存在
      .map((r) => ({
        id: r.data!.id!, // id 已经过滤确保存在
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
        editingDate: r.data!.editingDate || null,
      }))

    setIsImporting(true)
    setImportError(null)

    try {
      const success = await onImport(validItems)
      if (success) {
        setStep('result')
      } else {
        setImportError('导入失败，请重试')
      }
    } catch (error) {
      console.error('Import error:', error)
      setImportError(error instanceof Error ? error.message : '导入失败，请重试')
    } finally {
      setIsImporting(false)
    }
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
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                  {Object.keys(EXCEL_COLUMN_MAPPING).map((col) => {
                    const field = EXCEL_COLUMN_MAPPING[col]
                    const isRequired = REQUIRED_FIELDS.includes(field)
                    return (
                      <div key={col} className="flex items-center gap-1">
                        <span>{col}</span>
                        {isRequired && <span className="text-red-500">*</span>}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-2 text-muted-foreground">* 标记为必填字段</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 预览步骤 */}
        {step === 'preview' && (
          <div className="py-4 space-y-4 flex-1 min-h-0 overflow-hidden flex flex-col">
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
            <div className="border rounded-md overflow-auto max-h-96 flex-1 min-h-0 relative">
              {/* 滚动提示指示器 */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-linear-to-l from-background to-transparent pointer-events-none z-30 flex items-center justify-center">
                <ChevronRight className="size-4 text-muted-foreground/50" />
              </div>
              <Table className="min-w-max">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-16 sticky left-0 bg-background z-20">行号</TableHead>
                    <TableHead className="w-20 sticky left-16 bg-background z-20">状态</TableHead>
                    {PREVIEW_COLUMNS.map((col) => (
                      <TableHead key={col.field} className={col.width}>
                        {col.excelCol}
                      </TableHead>
                    ))}
                    <TableHead className="w-48 sticky right-0 bg-background z-20">错误/警告</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResults.map((result, index) => {
                    const isErrorRow = !result.success
                    const rowBgClass = isErrorRow ? 'bg-red-50 dark:bg-red-950/30' : 'bg-background'
                    return (
                      <TableRow key={index} className={isErrorRow ? 'bg-red-50 dark:bg-red-950/30' : ''}>
                        <TableCell className={`sticky left-0 ${rowBgClass} z-10`}>{result.rowIndex}</TableCell>
                        <TableCell className={`sticky left-16 ${rowBgClass} z-10`}>
                          {result.success ? (
                            result.warnings.length > 0 ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700">
                                <AlertCircle className="size-3 mr-1" />
                                警告
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
                                <CheckCircle2 className="size-3 mr-1" />
                                正常
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">
                              <XCircle className="size-3 mr-1" />
                              错误
                            </Badge>
                          )}
                        </TableCell>
                        {PREVIEW_COLUMNS.map((col) => (
                          <TableCell key={col.field} className={col.width}>
                            {formatCellValue(result.data?.[col.field])}
                          </TableCell>
                        ))}
                        <TableCell className={`text-xs sticky right-0 ${rowBgClass} z-10`}>
                          {result.errors.length > 0 && (
                            <div className="text-red-600 dark:text-red-400">
                              {result.errors.map((e, i) => <div key={i}>{e}</div>)}
                            </div>
                          )}
                          {result.warnings.length > 0 && (
                            <div className="text-yellow-600 dark:text-yellow-400">
                              {result.warnings.map((w, i) => <div key={i}>{w}</div>)}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {stats.failed > 0 && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                <AlertCircle className="size-4 inline mr-2 text-yellow-600" />
                存在 {stats.failed} 行数据校验失败，这些行将被跳过，仅导入有效数据
              </div>
            )}

            {importError && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded flex items-center gap-2">
                <XCircle className="size-4" />
                {importError}
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
              <Button variant="outline" onClick={() => { resetState(); setStep('upload'); }} disabled={isImporting}>
                重新上传
              </Button>
              <Button 
                onClick={executeImport} 
                disabled={stats.success === 0 || isImporting}
              >
                {isImporting ? '导入中...' : `导入 ${stats.success} 条有效数据`}
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
