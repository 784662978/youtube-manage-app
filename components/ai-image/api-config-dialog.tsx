"use client"

import * as React from "react"
import { Key, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAiImage } from "./ai-image-provider"
import { DEFAULT_API_CONFIG } from "@/lib/types/ai-image"

export function ApiConfigDialog() {
  const { state, updateApiConfig } = useAiImage()
  const [open, setOpen] = React.useState(false)
  const [apiKey, setApiKey] = React.useState(state.apiConfig.apiKey)
  const [endpoint, setEndpoint] = React.useState(state.apiConfig.endpoint)

  React.useEffect(() => {
    if (open) {
      setApiKey(state.apiConfig.apiKey)
      setEndpoint(state.apiConfig.endpoint)
    }
  }, [open, state.apiConfig])

  const handleSave = React.useCallback(() => {
    updateApiConfig({ apiKey, endpoint })
    setOpen(false)
  }, [apiKey, endpoint, updateApiConfig])

  const handleReset = React.useCallback(() => {
    setEndpoint(DEFAULT_API_CONFIG.endpoint)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs">
          <Key className="h-3.5 w-3.5" />
          {state.apiConfig.apiKey ? "API 已配置" : "配置 API Key"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API 配置</DialogTitle>
          <DialogDescription>
            配置火山方舟 Seedream API 的访问凭证。API Key 将保存在浏览器本地。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key" className="flex items-center gap-1">
              <Key className="h-3.5 w-3.5" />
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="请输入火山方舟 API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              在火山方舟控制台创建接入点后获取 API Key
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endpoint" className="flex items-center gap-1">
              <Server className="h-3.5 w-3.5" />
              API 端点
            </Label>
            <Input
              id="endpoint"
              placeholder="API 端点地址"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                默认: {DEFAULT_API_CONFIG.endpoint}
              </p>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={handleReset}>
                重置为默认
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
