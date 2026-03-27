'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { ScheduleItem, AdminEditRequest, UserEditRequest, SelectOption } from '@/lib/types/monitor'
import { usePermission } from '@/components/permission-provider'

interface ScheduleEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ScheduleItem | null
  onSave: (data: AdminEditRequest | UserEditRequest) => Promise<boolean>
  options: {
    contentPrimary: SelectOption[]
    contentSecondary: SelectOption[]
    language: SelectOption[]
    copyrightOwner: SelectOption[]
    channel: SelectOption[]
    operator: SelectOption[]
  }
}

export function ScheduleEditDialog({
  open,
  onOpenChange,
  item,
  onSave,
  options,
}: ScheduleEditDialogProps) {
  const { isAdmin } = usePermission()
  const [isSaving, setIsSaving] = React.useState(false)

  // 表单状态
  const [formData, setFormData] = React.useState({
    expected_publish_date: '',
    actual_publish_date: '',
    content_category_level1: '',
    content_category_level2: '',
    language: '',
    is_ypp_approved: '0',
    publish_status: '0',
    copyright_status: '0',
    video_name: '',
    copyright_owner: '',
    expected_publish_channel: '',
    expected_operator: '',
    video_id: '',
    review_status: '0',
    review_result: '',
    review_date: '',
    operation_revision_result: '',
    review_operator: '',
    editing_date: '',
  })

  // 当 item 变化时初始化表单
  React.useEffect(() => {
    if (item) {
      setFormData({
        expected_publish_date: item.expectedPublishDate || '',
        actual_publish_date: item.actualPublishDate || '',
        content_category_level1: item.contentPrimaryCategory || '',
        content_category_level2: item.contentSecondaryCategory || '',
        language: item.language || '',
        is_ypp_approved: item.isYPPPassed ? '1' : '0',
        publish_status: item.publishStatus === '已发布' ? '1' : '0',
        copyright_status: item.copyrightStatus === '正常' ? '1' : '0',
        video_name: item.dramaName || '',
        copyright_owner: item.copyrightOwner || '',
        expected_publish_channel: item.expectedPublishChannel || '',
        expected_operator: item.expectedOperator || '',
        video_id: item.videoId || '',
        review_status: item.auditStatus === '未审核' ? '0' : item.auditStatus === '已审核' ? '1' : '2',
        review_result: item.auditConclusion === '通过' ? '1' : item.auditConclusion === '未通过' ? '0' : '',
        review_date: item.auditDate || '',
        operation_revision_result: item.operatorModification === '已修改' ? '1' : item.operatorModification === '未修改' ? '0' : '',
        review_operator: item.reviewOperator || '',
        editing_date: item.editingDate || '',
      })
    }
  }, [item])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!item) return

    setIsSaving(true)
    try {
      let requestData: AdminEditRequest | UserEditRequest

      if (isAdmin) {
        // 管理员编辑：所有字段
        requestData = {
          id: item.id,
          expected_publish_date: formData.expected_publish_date,
          actual_publish_date: formData.actual_publish_date || null,
          content_category_level1: formData.content_category_level1,
          content_category_level2: formData.content_category_level2,
          language: formData.language,
          is_ypp_approved: parseInt(formData.is_ypp_approved),
          publish_status: parseInt(formData.publish_status),
          copyright_status: parseInt(formData.copyright_status),
          video_name: formData.video_name,
          copyright_owner: formData.copyright_owner,
          expected_publish_channel: formData.expected_publish_channel,
          expected_operator: formData.expected_operator,
          video_id: formData.video_id,
          review_status: parseInt(formData.review_status),
          review_result: formData.review_result ? parseInt(formData.review_result) : null,
          review_date: formData.review_date || null,
          operation_revision_result: formData.operation_revision_result ? parseInt(formData.operation_revision_result) : null,
          review_operator: formData.review_operator || undefined,
          editing_date: formData.editing_date || null,
        }
      } else {
        // 普通用户编辑：仅部分字段
        requestData = {
          id: item.id,
          publish_status: parseInt(formData.publish_status),
          actual_publish_date: formData.actual_publish_date || null,
          copyright_status: parseInt(formData.copyright_status),
          video_id: formData.video_id,
          review_status: parseInt(formData.review_status),
          review_result: formData.review_result ? parseInt(formData.review_result) : null,
          review_date: formData.review_date || null,
          operation_revision_result: formData.operation_revision_result ? parseInt(formData.operation_revision_result) : null,
          editing_date: formData.editing_date || null,
        }
      }

      const success = await onSave(requestData)
      if (success) {
        onOpenChange(false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isAdmin ? '编辑排期信息' : '编辑发布信息'}</DialogTitle>
          <DialogDescription>
            {isAdmin ? '管理员可编辑所有字段' : '普通用户仅可编辑部分字段'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isAdmin ? (
            // 管理员编辑表单 - 所有字段
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expected_publish_date">预计发布日期</Label>
                  <Input
                    id="expected_publish_date"
                    type="date"
                    value={formData.expected_publish_date}
                    onChange={e => handleInputChange('expected_publish_date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actual_publish_date">实际发布日期</Label>
                  <Input
                    id="actual_publish_date"
                    type="date"
                    value={formData.actual_publish_date}
                    onChange={e => handleInputChange('actual_publish_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>内容一级分类</Label>
                  <Select
                    value={formData.content_category_level1}
                    onValueChange={v => handleInputChange('content_category_level1', v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="选择一级分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.contentPrimary.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>内容二级分类</Label>
                  <Select
                    value={formData.content_category_level2}
                    onValueChange={v => handleInputChange('content_category_level2', v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="选择二级分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.contentSecondary.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>语种</Label>
                  <Select
                    value={formData.language}
                    onValueChange={v => handleInputChange('language', v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="选择语种" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.language.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video_name">剧名称</Label>
                  <Input
                    id="video_name"
                    value={formData.video_name}
                    onChange={e => handleInputChange('video_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>版权方</Label>
                  <Select
                    value={formData.copyright_owner}
                    onValueChange={v => handleInputChange('copyright_owner', v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="选择版权方" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.copyrightOwner.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>预计发布频道</Label>
                  <Select
                    value={formData.expected_publish_channel}
                    onValueChange={v => handleInputChange('expected_publish_channel', v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="选择频道" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.channel.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>是否已过YPP</Label>
                  <Select
                    value={formData.is_ypp_approved}
                    onValueChange={v => handleInputChange('is_ypp_approved', v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">否</SelectItem>
                      <SelectItem value="1">是</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>预计负责运营人员</Label>
                  <Select
                    value={formData.expected_operator}
                    onValueChange={v => handleInputChange('expected_operator', v)}
                  >
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder="选择运营人员" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.operator.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          ) : null}

          {/* 公共字段 - admin 和 user 都可编辑 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>发布状态</Label>
              <Select
                value={formData.publish_status}
                onValueChange={v => handleInputChange('publish_status', v)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未发布</SelectItem>
                  <SelectItem value="1">已发布</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>版权状态</Label>
              <Select
                value={formData.copyright_status}
                onValueChange={v => handleInputChange('copyright_status', v)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">禁播</SelectItem>
                  <SelectItem value="1">正常</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="actual_publish_date_user">实际发布日期</Label>
              <Input
                id="actual_publish_date_user"
                type="date"
                value={formData.actual_publish_date}
                onChange={e => handleInputChange('actual_publish_date', e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video_id">视频唯一ID</Label>
              <Input
                id="video_id"
                value={formData.video_id}
                onChange={e => handleInputChange('video_id', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>审核状态</Label>
              <Select
                value={formData.review_status}
                onValueChange={v => handleInputChange('review_status', v)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未审核</SelectItem>
                  <SelectItem value="1">已审核</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>审核结论</Label>
              <Select
                value={formData.review_result}
                onValueChange={v => handleInputChange('review_result', v)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="选择审核结论" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未通过</SelectItem>
                  <SelectItem value="1">通过</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review_date">审核日期</Label>
              <Input
                id="review_date"
                type="date"
                value={formData.review_date}
                onChange={e => handleInputChange('review_date', e.target.value)}
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-4'>
            {/* 审核人员 - 仅 admin 可编辑 */}
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="review_operator">审核人员</Label>
                <Input
                  id="review_operator"
                  type="text"
                  placeholder="请输入审核人员姓名"
                  value={formData.review_operator}
                  onChange={e => handleInputChange('review_operator', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>运营再修改结论</Label>
              <Select
                value={formData.operation_revision_result}
                onValueChange={v => handleInputChange('operation_revision_result', v)}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="选择修改结论" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未修改</SelectItem>
                  <SelectItem value="1">已修改</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editing_date">剪辑日期</Label>
              <Input
                id="editing_date"
                type="date"
                value={formData.editing_date}
                onChange={e => handleInputChange('editing_date', e.target.value)}
              />
            </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
