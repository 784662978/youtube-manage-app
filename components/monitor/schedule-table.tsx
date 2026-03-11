'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Plus, Upload, Download, Pencil, Trash2 } from 'lucide-react'
import type { ScheduleItem, SelectOption } from '@/lib/types/monitor'

interface ScheduleTableProps {
  data: ScheduleItem[]
  onDelete: (id: string) => void
  onSave: (item: ScheduleItem) => void
  onAdd: (item: ScheduleItem) => void
  onExport: () => void
  onImport: () => void
  // 下拉选项
  contentPrimaryOptions: SelectOption[]
  contentSecondaryOptions: SelectOption[]
  languageOptions: SelectOption[]
  channelOptions: SelectOption[]
  operatorOptions: SelectOption[]
  copyrightStatusOptions: SelectOption[]
  auditStatusOptions: SelectOption[]
  auditConclusionOptions: SelectOption[]
  modificationOptions: SelectOption[]
}

export function ScheduleTable({
  data,
  onDelete,
  onSave,
  onAdd,
  onExport,
  onImport,
  contentPrimaryOptions,
  contentSecondaryOptions,
  languageOptions,
  channelOptions,
  operatorOptions,
  copyrightStatusOptions,
  auditStatusOptions,
  auditConclusionOptions,
  modificationOptions,
}: ScheduleTableProps) {
  const [showEditDialog, setShowEditDialog] = React.useState(false)
  const [showAddDialog, setShowAddDialog] = React.useState(false)
  const [editData, setEditData] = React.useState<Partial<ScheduleItem>>({})
  const [addData, setAddData] = React.useState<Partial<ScheduleItem>>({})
  const [deleteId, setDeleteId] = React.useState<string | null>(null)

  // 编辑功能
  const handleEdit = (item: ScheduleItem) => {
    setEditData({ ...item })
    setShowEditDialog(true)
  }

  const handleCancelEdit = () => {
    setEditData({})
    setShowEditDialog(false)
  }

  const handleSaveEdit = () => {
    if (editData.id) {
      onSave(editData as ScheduleItem)
    }
    setEditData({})
    setShowEditDialog(false)
  }

  // 新增功能
  const handleOpenAdd = () => {
    setAddData({
      expectedPublishDate: '',
      actualPublishDate: null,
      contentPrimaryCategory: '',
      contentSecondaryCategory: '',
      language: '',
      dramaName: '',
      copyrightOwner: '',
      expectedPublishChannel: '',
      isYPPPassed: false,
      expectedOperator: '',
      publishStatus: '未发布',
      copyrightStatus: '',
      videoId: '',
      auditStatus: '未审核',
      auditConclusion: null,
      auditDate: null,
      operatorModification: null,
    })
    setShowAddDialog(true)
  }

  const handleCancelAdd = () => {
    setAddData({})
    setShowAddDialog(false)
  }

  const handleSaveAdd = () => {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      expectedPublishDate: addData.expectedPublishDate || '',
      actualPublishDate: addData.actualPublishDate || null,
      contentPrimaryCategory: addData.contentPrimaryCategory || '',
      contentSecondaryCategory: addData.contentSecondaryCategory || '',
      language: addData.language || '',
      dramaName: addData.dramaName || '',
      copyrightOwner: addData.copyrightOwner || '',
      expectedPublishChannel: addData.expectedPublishChannel || '',
      isYPPPassed: addData.isYPPPassed || false,
      expectedOperator: addData.expectedOperator || '',
      publishStatus: addData.publishStatus || '未发布',
      copyrightStatus: addData.copyrightStatus || '',
      videoId: addData.videoId || '',
      auditStatus: addData.auditStatus || '未审核',
      auditConclusion: addData.auditConclusion || null,
      auditDate: addData.auditDate || null,
      operatorModification: addData.operatorModification || null,
    }
    onAdd(newItem)
    setAddData({})
    setShowAddDialog(false)
  }

  // 删除功能
  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId)
      setDeleteId(null)
    }
  }

  // 验证必填字段
  const validateRequired = (item: Partial<ScheduleItem>, isEdit: boolean): boolean => {
    const requiredFields = isEdit
      ? ['expectedPublishDate', 'dramaName', 'videoId']
      : [
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
    return requiredFields.every((field) => {
      const value = item[field as keyof ScheduleItem]
      return value !== undefined && value !== null && value !== ''
    })
  }

  const canSaveEdit = validateRequired(editData, true)
  const canSaveAdd = validateRequired(addData, false)

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">明细排期表</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="size-4" />
                新增
              </Button>
              <Button size="sm" variant="outline" onClick={onImport}>
                <Upload className="size-4" />
                上传Excel
              </Button>
              <Button size="sm" variant="outline" onClick={onExport}>
                <Download className="size-4" />
                下载 Excel
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
                {data.length > 0 ? (
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
                        <div className="flex gap-1">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={18} className="text-center text-muted-foreground py-12">
                      暂无排期数据，请新增或调整筛选条件
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
            <span>共 {data.length} 条</span>
            <div className="flex items-center gap-2">
              <span>每页 20 条</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled>
                  上一页
                </Button>
                <Button variant="outline" size="sm" disabled>
                  下一页
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 编辑对话框 - 仅允许修改特定字段 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑排期</DialogTitle>
            <DialogDescription>
              仅可修改预计发布日期、实际发布日期、剧名称、发布状态、版权状态、视频唯一ID、审核状态及审核结论
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* 可编辑字段 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">预计发布日期 *</label>
              <Input
                type="date"
                value={editData.expectedPublishDate || ''}
                onChange={(e) =>
                  setEditData({ ...editData, expectedPublishDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">实际发布日期</label>
              <Input
                type="date"
                value={editData.actualPublishDate || ''}
                onChange={(e) =>
                  setEditData({ ...editData, actualPublishDate: e.target.value || null })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">剧名称 *</label>
              <Input
                type="text"
                value={editData.dramaName || ''}
                onChange={(e) =>
                  setEditData({ ...editData, dramaName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">发布状态 *</label>
              <Select
                value={editData.publishStatus || ''}
                onValueChange={(v) =>
                  setEditData({ ...editData, publishStatus: v as '已发布' | '未发布' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="已发布">已发布</SelectItem>
                    <SelectItem value="未发布">未发布</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">版权状态</label>
              <Select
                value={editData.copyrightStatus || ''}
                onValueChange={(v) =>
                  setEditData({ ...editData, copyrightStatus: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {copyrightStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">视频唯一ID *</label>
              <Input
                type="text"
                value={editData.videoId || ''}
                onChange={(e) =>
                  setEditData({ ...editData, videoId: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">审核状态</label>
              <Select
                value={editData.auditStatus || ''}
                onValueChange={(v) =>
                  setEditData({ ...editData, auditStatus: v as ScheduleItem['auditStatus'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {auditStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">审核结论</label>
              <Select
                value={editData.auditConclusion || ''}
                onValueChange={(v) =>
                  setEditData({
                    ...editData,
                    auditConclusion: v ? (v as '通过' | '未通过') : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择结论" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {auditConclusionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* 只读字段 - 显示但不可编辑 */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">只读信息</h4>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">内容一级分类：</span>
                  <span>{editData.contentPrimaryCategory || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">内容二级分类：</span>
                  <span>{editData.contentSecondaryCategory || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">语种：</span>
                  <span>{editData.language || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">版权方：</span>
                  <span>{editData.copyrightOwner || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">预计发布频道：</span>
                  <span>{editData.expectedPublishChannel || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">是否已过YPP：</span>
                  <span>{editData.isYPPPassed ? '是' : '否'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">预计负责运营人员：</span>
                  <span>{editData.expectedOperator || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">审核日期：</span>
                  <span>{editData.auditDate || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">运营再修改结论：</span>
                  <span>{editData.operatorModification || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={!canSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新增对话框 - 允许填写所有字段 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增排期</DialogTitle>
            <DialogDescription>
              请填写完整的排期信息，标有 * 的为必填项
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">预计发布日期 *</label>
              <Input
                type="date"
                value={addData.expectedPublishDate || ''}
                onChange={(e) =>
                  setAddData({ ...addData, expectedPublishDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">实际发布日期</label>
              <Input
                type="date"
                value={addData.actualPublishDate || ''}
                onChange={(e) =>
                  setAddData({ ...addData, actualPublishDate: e.target.value || null })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">内容一级分类 *</label>
              <Select
                value={addData.contentPrimaryCategory || ''}
                onValueChange={(v) =>
                  setAddData({ ...addData, contentPrimaryCategory: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {contentPrimaryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">内容二级分类 *</label>
              <Select
                value={addData.contentSecondaryCategory || ''}
                onValueChange={(v) =>
                  setAddData({ ...addData, contentSecondaryCategory: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {contentSecondaryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">语种 *</label>
              <Select
                value={addData.language || ''}
                onValueChange={(v) => setAddData({ ...addData, language: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择语种" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {languageOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">剧名称 *</label>
              <Input
                type="text"
                value={addData.dramaName || ''}
                onChange={(e) =>
                  setAddData({ ...addData, dramaName: e.target.value })
                }
                placeholder="请输入剧名称"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">版权方 *</label>
              <Input
                type="text"
                value={addData.copyrightOwner || ''}
                onChange={(e) =>
                  setAddData({ ...addData, copyrightOwner: e.target.value })
                }
                placeholder="请输入版权方"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">预计发布频道 *</label>
              <Select
                value={addData.expectedPublishChannel || ''}
                onValueChange={(v) =>
                  setAddData({ ...addData, expectedPublishChannel: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择频道" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {channelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">是否已过YPP</label>
              <Select
                value={addData.isYPPPassed !== undefined ? String(addData.isYPPPassed) : ''}
                onValueChange={(v) =>
                  setAddData({ ...addData, isYPPPassed: v === 'true' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="true">是</SelectItem>
                    <SelectItem value="false">否</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">预计负责运营人员 *</label>
              <Select
                value={addData.expectedOperator || ''}
                onValueChange={(v) =>
                  setAddData({ ...addData, expectedOperator: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择人员" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {operatorOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">发布状态</label>
              <Select
                value={addData.publishStatus || '未发布'}
                onValueChange={(v) =>
                  setAddData({ ...addData, publishStatus: v as '已发布' | '未发布' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="已发布">已发布</SelectItem>
                    <SelectItem value="未发布">未发布</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">版权状态</label>
              <Select
                value={addData.copyrightStatus || ''}
                onValueChange={(v) =>
                  setAddData({ ...addData, copyrightStatus: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {copyrightStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">视频唯一ID *</label>
              <Input
                type="text"
                value={addData.videoId || ''}
                onChange={(e) =>
                  setAddData({ ...addData, videoId: e.target.value })
                }
                placeholder="请输入视频唯一ID"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">审核状态</label>
              <Select
                value={addData.auditStatus || '未审核'}
                onValueChange={(v) =>
                  setAddData({ ...addData, auditStatus: v as ScheduleItem['auditStatus'] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {auditStatusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">审核结论</label>
              <Select
                value={addData.auditConclusion || ''}
                onValueChange={(v) =>
                  setAddData({
                    ...addData,
                    auditConclusion: v ? (v as '通过' | '未通过') : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择结论" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {auditConclusionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">审核日期</label>
              <Input
                type="date"
                value={addData.auditDate || ''}
                onChange={(e) =>
                  setAddData({ ...addData, auditDate: e.target.value || null })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">运营再修改结论</label>
              <Select
                value={addData.operatorModification || ''}
                onValueChange={(v) =>
                  setAddData({
                    ...addData,
                    operatorModification: v ? (v as '已修改' | '未修改') : null,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择结论" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {modificationOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelAdd}>
              取消
            </Button>
            <Button onClick={handleSaveAdd} disabled={!canSaveAdd}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
