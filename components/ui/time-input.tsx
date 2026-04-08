"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TimeInputProps {
  /** 当前秒数值 */
  value: number | undefined | null
  /** 值变化回调，传出秒数（number | undefined） */
  onChange: (seconds: number | undefined) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 标签文本 */
  label?: string
  /** 占位提示 */
  placeholder?: string
  /** 是否有错误 */
  error?: boolean
  /** 额外 className */
  className?: string
}

/** 将秒数拆分为 [时, 分, 秒]，undefined/null 时返回 [0, 0, 0] */
function secondsToHMS(seconds: number | undefined | null): [number, number, number] {
  if (seconds === undefined || seconds === null) return [0, 0, 0]
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s]
}

/** 将时、分、秒合并为总秒数 */
function hmsToSeconds(h: number, m: number, s: number): number | undefined {
  if (h === 0 && m === 0 && s === 0) return undefined
  return h * 3600 + m * 60 + s
}

/**
 * 时分秒输入组件
 * 三个独立输入框（时、分、秒），冒号分隔
 * 内部存储秒数，自动双向转换
 */
export function TimeInput({
  value,
  onChange,
  disabled,
  label,
  placeholder,
  error,
  className,
}: TimeInputProps) {
  const [h, m, s] = secondsToHMS(value)
  const [hours, setHours] = React.useState(h)
  const [minutes, setMinutes] = React.useState(m)
  const [seconds, setSeconds] = React.useState(s)

  // 外部值变化时同步
  React.useEffect(() => {
    const [nh, nm, ns] = secondsToHMS(value)
    setHours(nh)
    setMinutes(nm)
    setSeconds(ns)
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  // 任意字段变化时计算并通知父组件
  const notifyChange = React.useCallback((newH: number, newM: number, newS: number) => {
    // 分钟/秒数上限纠正
    const clampedM = Math.min(newM, 59)
    const clampedS = Math.min(newS, 59)
    onChange(hmsToSeconds(newH, clampedM, clampedS))
  }, [onChange])

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "")
    const val = Math.min(Number(raw) || 0, 9999)
    setHours(val)
    notifyChange(val, minutes, seconds)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "")
    const val = Math.min(Number(raw) || 0, 59)
    setMinutes(val)
    notifyChange(hours, val, seconds)
  }

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "")
    const val = Math.min(Number(raw) || 0, 59)
    setSeconds(val)
    notifyChange(hours, minutes, val)
  }

  // Tab/右箭头自动跳转到下一个输入框
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (e.key === ":" || e.key === "ArrowRight") {
      e.preventDefault()
      nextRef.current?.focus()
      nextRef.current?.select()
    }
  }

  const hoursRef = React.useRef<HTMLInputElement>(null)
  const minutesRef = React.useRef<HTMLInputElement>(null)
  const secondsRef = React.useRef<HTMLInputElement>(null)

  const inputBaseClass = `w-14 text-center font-mono text-sm px-1 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`

  return (
    <div className={className}>
      {label && (
        <Label className="text-xs">{label}</Label>
      )}
      <div className="flex items-center gap-0">
        <Input
          ref={hoursRef}
          type="text"
          inputMode="numeric"
          value={hours}
          onChange={handleHoursChange}
          onKeyDown={(e) => handleKeyDown(e, minutesRef)}
          placeholder="00"
          disabled={disabled}
          className={`${inputBaseClass} rounded-r-none`}
          maxLength={4}
        />
        <span className="flex items-center justify-center w-4 text-sm font-mono text-muted-foreground select-none bg-muted border-y border-input h-9">
          :
        </span>
        <Input
          ref={minutesRef}
          type="text"
          inputMode="numeric"
          value={minutes}
          onChange={handleMinutesChange}
          onKeyDown={(e) => handleKeyDown(e, secondsRef)}
          placeholder="00"
          disabled={disabled}
          className={`${inputBaseClass} rounded-none border-l-0`}
          maxLength={2}
        />
        <span className="flex items-center justify-center w-4 text-sm font-mono text-muted-foreground select-none bg-muted border-y border-input h-9">
          :
        </span>
        <Input
          ref={secondsRef}
          type="text"
          inputMode="numeric"
          value={seconds}
          onChange={handleSecondsChange}
          placeholder="00"
          disabled={disabled}
          className={`${inputBaseClass} rounded-l-none border-l-0`}
          maxLength={2}
        />
      </div>
    </div>
  )
}
