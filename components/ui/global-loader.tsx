"use client"

import * as React from "react"
import { Loader } from "lucide-react"

export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-medium text-muted-foreground animate-pulse">
          Loading resources...
        </p>
      </div>
    </div>
  )
}
