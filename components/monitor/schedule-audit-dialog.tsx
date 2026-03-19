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
import type { ScheduleItem, AuditRequest } from '@/lib/types/monitor'

// 本地存储的 key
const STORAGE_KEY_REVIEW_OPERATOR = 'audit_review_operator'

interface ScheduleAuditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ScheduleItem | null
  onSave: (data: AuditRequest) => Promise<boolean>
}

export function ScheduleAuditDialog({
  open,
  onOpenChange,
  item,
  onSave,
}: ScheduleAuditDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false)

  // 表单状态
  const [formData, setFormData] = React.useState({
    review_status: '0',
    review_result: '',
    review_date: '',
    review_operator: '景兰',
    operation_revision_result: '',
  })

  // 当 item 变化时初始化表单
  React.useEffect(() => {
    if (item) {
      // 从本地存储读取上次保存的审核人员，如果没有则使用默认值"景兰"
      const savedOperator = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY_REVIEW_OPERATOR) || '景兰'
        : '景兰'

      setFormData({
        review_status: item.auditStatus === '未审核' ? '0' : '1',
        review_result: item.auditConclusion === '通过' ? '1' : item.auditConclusion === '未通过' ? '0' : '',
        review_date: item.auditDate || new Date().toISOString().split('T')[0],
        review_operator: savedOperator,
        operation_revision_result: item.operatorModification === '已修改' ? '1' : item.operatorModification === '未修改' ? '0' : '',
      })
    }
  }, [item])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setIsSaving(true)
    try {
      const data: AuditRequest = {
        id: item.id,
        review_status: Number(formData.review_status),
        review_result: formData.review_result ? Number(formData.review_result) : null,
        review_date: formData.review_date || null,
        review_operator: formData.review_operator,
        operation_revision_result: formData.operation_revision_result ? Number(formData.operation_revision_result) : null,
      }

      const success = await onSave(data)
      if (success) {
        // 成功后保存审核人员到本地存储
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_REVIEW_OPERATOR, formData.review_operator)
        }
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Audit failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>审核操作</DialogTitle>
          <DialogDescription>
            审核排期项目：{item?.dramaName || '-'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="review_status">审核状态</Label>
              <Select
                value={formData.review_status}
                onValueChange={(v) => handleInputChange('review_status', v)}
                required
              >
                <SelectTrigger id="review_status" className='w-full'>
                  <SelectValue placeholder="选择审核状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未审核</SelectItem>
                  <SelectItem value="1">已审核</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_result">审核结论</Label>
              <Select
                value={formData.review_result}
                onValueChange={(v) => handleInputChange('review_result', v)}
              >
                <SelectTrigger id="review_result" className='w-full'>
                  <SelectValue placeholder="选择审核结论" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">通过</SelectItem>
                  <SelectItem value="0">未通过</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_date">审核日期</Label>
              <Input
                id="review_date"
                type="date"
                value={formData.review_date}
                onChange={(e) => handleInputChange('review_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_operator">审核人员</Label>
              <Input
                id="review_operator"
                type="text"
                placeholder="请输入审核人员姓名"
                value={formData.review_operator}
                onChange={(e) => handleInputChange('review_operator', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="operation_revision_result">运营再修改结论</Label>
              <Select
                value={formData.operation_revision_result}
                onValueChange={(v) => handleInputChange('operation_revision_result', v)}
              >
                <SelectTrigger id="operation_revision_result" className='w-1/2'>
                  <SelectValue placeholder="选择运营再修改结论" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">已修改</SelectItem>
                  <SelectItem value="0">未修改</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
