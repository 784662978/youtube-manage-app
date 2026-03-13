'use client'

import * as React from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface DateRange {
  start: string
  end: string
}

export interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

interface QuickSelectOption {
  label: string
  getValue: () => DateRange
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempRange, setTempRange] = React.useState<DateRange>(value)
  const [shouldAlignRight, setShouldAlignRight] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  // 快速选择选项
  const quickSelectOptions: QuickSelectOption[] = [
    {
      label: '本月',
      getValue: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), 1)
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        }
      },
    },
    {
      label: '上月',
      getValue: () => {
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const end = new Date(now.getFullYear(), now.getMonth(), 0)
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        }
      },
    },
    {
      label: '最近7天',
      getValue: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 6)
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        }
      },
    },
    {
      label: '最近30天',
      getValue: () => {
        const end = new Date()
        const start = new Date()
        start.setDate(start.getDate() - 29)
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        }
      },
    },
    {
      label: '本季度',
      getValue: () => {
        const now = new Date()
        const quarter = Math.floor(now.getMonth() / 3)
        const start = new Date(now.getFullYear(), quarter * 3, 1)
        const end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
        return {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        }
      },
    },
  ]

  // 计算弹窗位置，避免超出视口右侧
  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 340 // w-85 = 340px
      const viewportWidth = window.innerWidth
      
      // 检查弹窗是否会超出右侧边界
      const wouldOverflowRight = buttonRect.left + dropdownWidth > viewportWidth
      
      setShouldAlignRight(wouldOverflowRight)
    }
  }, [isOpen])

  // 点击外部关闭下拉框
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 同步 value 到 tempRange
  React.useEffect(() => {
    setTempRange(value)
  }, [value])

  const handleQuickSelect = (option: QuickSelectOption) => {
    const newRange = option.getValue()
    setTempRange(newRange)
    onChange(newRange)
    setIsOpen(false)
  }

  const handleApply = () => {
    onChange(tempRange)
    setIsOpen(false)
  }

  const handleReset = () => {
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const defaultRange = {
      start: firstDayOfMonth.toISOString().split('T')[0],
      end: lastDayOfMonth.toISOString().split('T')[0],
    }
    setTempRange(defaultRange)
    onChange(defaultRange)
    setIsOpen(false)
  }

  const formatDateDisplay = (range: DateRange) => {
    if (!range.start || !range.end) return '选择日期范围'
    return `${range.start} 至 ${range.end}`
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <Button
        ref={buttonRef}
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="min-w-60 justify-between"
      >
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatDateDisplay(value)}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <div className={cn(
          "absolute top-full z-50 mt-2 w-85 rounded-lg border bg-background p-4 shadow-lg",
          shouldAlignRight ? "right-0" : "left-0"
        )}>
          {/* 快速选择 */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">快速选择</div>
            <div className="flex flex-wrap gap-2">
              {quickSelectOptions.map((option) => (
                <Button
                  key={option.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(option)}
                  className="h-8"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 分隔线 */}
          <div className="mb-4 border-t" />

          {/* 自定义日期 */}
          <div className="mb-4">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">自定义日期</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">开始日期</label>
                <input
                  type="date"
                  value={tempRange.start}
                  onChange={(e) => setTempRange({ ...tempRange, start: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">结束日期</label>
                <input
                  type="date"
                  value={tempRange.end}
                  onChange={(e) => setTempRange({ ...tempRange, end: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-between gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              重置
            </Button>
            <Button size="sm" onClick={handleApply}>
              应用
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
