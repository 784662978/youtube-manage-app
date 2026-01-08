"use client"

import { useEffect } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type NotificationType = "success" | "error"

interface NotificationProps {
  message: string
  type?: NotificationType
  isVisible: boolean
  onClose: () => void
}

export function Notification({ message, type = "success", isVisible, onClose }: NotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 animate-in slide-in-from-top-2 fade-in",
      type === "success" 
        ? "bg-white border-green-200 text-green-800" 
        : "bg-white border-red-200 text-red-800"
    )}>
      {type === "success" ? (
        <div className="bg-green-100 p-1 rounded-full">
            <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      ) : (
        <div className="bg-red-100 p-1 rounded-full">
            <XCircle className="h-4 w-4 text-red-600" />
        </div>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button 
        onClick={onClose} 
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
