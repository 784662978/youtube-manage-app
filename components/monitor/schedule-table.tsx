'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, Trash2, Loader2, Pencil, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, CheckCircle } from 'lucide-react'
import type { ScheduleItem } from '@/lib/types/monitor'
import { usePermission } from '@/components/permission-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// 每页条数选项
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 生成页码数组（带省略号）
function generatePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  // 始终显示第1页
  pages.push(1)

  if (current <= 4) {
    // 当前页靠近开头
    for (let i = 2; i <= Math.min(5, total - 1); i++) {
      pages.push(i)
    }
    if (total > 5) {
      pages.push('ellipsis')
    }
  } else if (current >= total - 3) {
    // 当前页靠近结尾
    pages.push('ellipsis')
    for (let i = Math.max(2, total - 4); i <= total - 1; i++) {
      pages.push(i)
    }
  } else {
    // 当前页在中间
    pages.push('ellipsis')
    for (let i = current - 1; i <= current + 1; i++) {
      pages.push(i)
    }
    pages.push('ellipsis')
  }

  // 始终显示最后一页
  if (total > 1) {
    pages.push(total)
  }

  return pages
}

interface ScheduleTableProps {
  data: ScheduleItem[]
  onDelete: (id: string) => void
  onEdit: (item: ScheduleItem) => void
  onAudit: (item: ScheduleItem) => void
  onExport: () => void
  onImport: () => void
  isLoading?: boolean
  isExporting?: boolean
  pagination?: {
    page: number
    pageSize: number
    total?: number
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function ScheduleTable({
  data,
  onDelete,
  onEdit,
  onAudit,
  onExport,
  onImport,
  isLoading = false,
  isExporting = false,
  pagination,
  onPageChange,
  onPageSizeChange,
}: ScheduleTableProps) {
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const { isAdmin } = usePermission()

  // 计算分页信息
  const currentPage = pagination?.page || 1
  const pageSize = pagination?.pageSize || 20
  const total = pagination?.total || 0
  const totalPages = Math.ceil(total / pageSize) || 1
  const pageNumbers = generatePageNumbers(currentPage, totalPages)

  // 删除功能
  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">明细排期表</CardTitle>
            <div className="flex gap-2">
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={onImport}>
                  <Upload className="size-4" />
                  上传Excel
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                {isExporting ? '导出中...' : '下载 Excel'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">剪辑日期</TableHead>
                  <TableHead className="whitespace-nowrap">预计发布日期</TableHead>
                  <TableHead className="whitespace-nowrap">实际发布日期</TableHead>
                  <TableHead className="whitespace-nowrap">内容一级分类</TableHead>
                  <TableHead className="whitespace-nowrap">内容二级分类</TableHead>
                  <TableHead className="whitespace-nowrap">语种</TableHead>
                  <TableHead className="whitespace-nowrap">剧名称</TableHead>
                  <TableHead className="whitespace-nowrap">版权方</TableHead>
                  <TableHead className="whitespace-nowrap">预计发布频道</TableHead>
                  <TableHead className="whitespace-nowrap">是否已过YPP</TableHead>
                  <TableHead className="whitespace-nowrap">预计负责运营人员</TableHead>
                  <TableHead className="whitespace-nowrap">发布状态</TableHead>
                  <TableHead className="whitespace-nowrap">版权状态</TableHead>
                  <TableHead className="whitespace-nowrap">视频唯一ID</TableHead>
                  <TableHead className="whitespace-nowrap">播放量</TableHead>
                  <TableHead className="whitespace-nowrap">审核人员</TableHead>
                  <TableHead className="whitespace-nowrap">审核状态</TableHead>
                  <TableHead className="whitespace-nowrap">审核结论</TableHead>
                  <TableHead className="whitespace-nowrap">审核日期</TableHead>
                  <TableHead className="whitespace-nowrap">运营再修改结论</TableHead>
                  <TableHead className="whitespace-nowrap sticky right-0 bg-background z-10 w-[120px] min-w-[120px] shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={21} className="h-24 text-center">
                      <div className="flex items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length > 0 ? (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.editingDate || '—'}</TableCell>
                      <TableCell>{item.expectedPublishDate}</TableCell>
                      <TableCell>{item.actualPublishDate || '—'}</TableCell>
                      <TableCell>{item.contentPrimaryCategory}</TableCell>
                      <TableCell>{item.contentSecondaryCategory}</TableCell>
                      <TableCell>{item.language}</TableCell>
                      <TableCell>{item.dramaName}</TableCell>
                      <TableCell>{item.copyrightOwner}</TableCell>
                      <TableCell>{item.expectedPublishChannel}</TableCell>
                      <TableCell>{item.isYPPPassed ? '是' : '否'}</TableCell>
                      <TableCell>{item.expectedOperator}</TableCell>
                      <TableCell>
                        <Badge variant={item.publishStatus === '已发布' ? 'default' : 'secondary'}>
                          {item.publishStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.copyrightStatus}</TableCell>
                      <TableCell className="font-mono text-xs">{item.videoId}</TableCell>
                      <TableCell>{item.viewCount?.toLocaleString() || '—'}</TableCell>
                      <TableCell>{item.reviewOperator || '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.auditStatus === '已审核'
                              ? 'default'
                              : item.auditStatus === '未审核'
                                ? 'outline'
                                : 'secondary'
                          }
                        >
                          {item.auditStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.auditConclusion || '—'}</TableCell>
                      <TableCell>{item.auditDate || '—'}</TableCell>
                      <TableCell>{item.operatorModification || '—'}</TableCell>
                      <TableCell className="sticky right-0 bg-background z-10 w-[120px] min-w-[120px] shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => onAudit(item)}
                            title="审核操作"
                            className='cursor-pointer'
                          >
                            <CheckCircle className="size-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => onEdit(item)}
                            title="编辑操作"
                            className='cursor-pointer'
                          >
                            <Pencil className="size-3" />
                          </Button>
                          {isAdmin &&
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => setDeleteId(item.id)}
                              title="删除操作"
                              className='cursor-pointer'
                            >
                              <Trash2 className="size-3 text-destructive" />
                            </Button>
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={21} className="text-center text-muted-foreground py-12">
                      暂无排期数据，请调整筛选条件
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>共 {total} 条</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-3">
                <span>每页</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => onPageSizeChange?.(Number(value))}
                >
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>条</span>
              </div>
              <div className="flex items-center gap-1">
                {/* 首页 */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => onPageChange?.(1)}
                  title="首页"
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                {/* 上一页 */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => onPageChange?.(currentPage - 1)}
                  title="上一页"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {/* 页码导航 */}
                <div className="flex items-center gap-1 px-1">
                  {pageNumbers.map((page, index) => {
                    if (page === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                          <MoreHorizontal className="size-4" />
                        </span>
                      )
                    }
                    const isActive = page === currentPage
                    return (
                      <Button
                        key={page}
                        variant={isActive ? 'default' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        disabled={isLoading}
                        onClick={() => onPageChange?.(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                {/* 下一页 */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => onPageChange?.(currentPage + 1)}
                  title="下一页"
                >
                  <ChevronRight className="size-4" />
                </Button>
                {/* 末页 */}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage >= totalPages || isLoading}
                  onClick={() => onPageChange?.(totalPages)}
                  title="末页"
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后不可恢复，确定要删除这条排期记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
