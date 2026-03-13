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
import { Upload, Download, Trash2, Loader2 } from 'lucide-react'
import type { ScheduleItem } from '@/lib/types/monitor'

interface ScheduleTableProps {
  data: ScheduleItem[]
  onDelete: (id: string) => void
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
}

export function ScheduleTable({
  data,
  onDelete,
  onExport,
  onImport,
  isLoading = false,
  isExporting = false,
  pagination,
  onPageChange,
}: ScheduleTableProps) {
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

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
              <Button size="sm" variant="outline" onClick={onImport}>
                <Upload className="size-4" />
                上传Excel
              </Button>
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
                  <TableHead className="whitespace-nowrap">审核状态</TableHead>
                  <TableHead className="whitespace-nowrap">审核结论</TableHead>
                  <TableHead className="whitespace-nowrap">审核日期</TableHead>
                  <TableHead className="whitespace-nowrap">运营再修改结论</TableHead>
                  <TableHead className="whitespace-nowrap sticky right-0 bg-background z-10">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={18} className="h-24 text-center">
                      <div className="flex items-center justify-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length > 0 ? (
                  data.map((item) => (
                    <TableRow key={item.id}>
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
                      <TableCell>
                        <Badge
                          variant={
                            item.auditStatus === '已审核'
                              ? 'default'
                              : item.auditStatus === '待审核'
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
                      <TableCell className="sticky right-0 bg-background z-10">
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center text-muted-foreground py-12">
                      暂无排期数据，请调整筛选条件
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
            <span>共 {pagination?.total || data.length} 条</span>
            <div className="flex items-center gap-2">
              <span>每页 {pagination?.pageSize || 20} 条</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination || pagination.page <= 1 || isLoading}
                  onClick={() => onPageChange?.((pagination?.page || 1) - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination || !pagination.total || pagination.page >= Math.ceil(pagination.total / pagination.pageSize) || isLoading}
                  onClick={() => onPageChange?.((pagination?.page || 1) + 1)}
                >
                  下一页
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
