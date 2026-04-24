"use client"

import * as React from "react"
import { SEEDREAM_MODELS, type SeedreamModel } from "@/lib/types/ai-image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ModelSelectorProps {
  value: SeedreamModel
  onChange: (model: SeedreamModel) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SeedreamModel)}>
      <SelectTrigger className="w-[200px] h-9 text-sm">
        <SelectValue placeholder="选择模型" />
      </SelectTrigger>
      <SelectContent>
        {SEEDREAM_MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex flex-col">
              <span className="font-medium">{model.name}</span>
              <span className="text-xs text-muted-foreground">{model.description}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
