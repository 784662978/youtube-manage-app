"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { Notification, NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChannelFormDialog } from "./channel-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { MaterialChannel } from "@/lib/types/material"
import type { ApiResponse } from "@/lib/types/drama"

export function ChannelPage() {
  const [data, setData] = React.useState<MaterialChannel[]>([])
  const [loading, setLoading] = React.useState(true)
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    visible: boolean
  }>({ message: "", type: "success", visible: false })

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingChannel, setEditingChannel] = React.useState<MaterialChannel | null>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<MaterialChannel | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const showNotification = React.useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type, visible: true })
  }, [])

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiClient.get<ApiResponse<MaterialChannel[]>>(
        "/materialChannel/list"
      )
      setData(result.response || [])
    } catch (error) {
      console.error("Failed to fetch channels:", error)
      showNotification("获取渠道列表失败", "error")
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  React.useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = () => {
    setEditingChannel(null)
    setFormOpen(true)
  }

  const handleEdit = (channel: MaterialChannel) => {
    setEditingChannel(channel)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.delete(`/materialChannel/${deleteTarget.id}`)
      showNotification("删除成功", "success")
      setDeleteTarget(null)
      fetchData()
    } catch (error: any) {
      showNotification(error.message || "删除失败（该渠道可能已被素材使用）", "error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-10 space-y-4">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.visible}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">渠道管理</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          新增渠道
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">ID</TableHead>
              <TableHead className="whitespace-nowrap">渠道编码</TableHead>
              <TableHead className="whitespace-nowrap">渠道名称</TableHead>
              <TableHead className="whitespace-nowrap">排序</TableHead>
              <TableHead className="whitespace-nowrap">状态</TableHead>
              <TableHead className="whitespace-nowrap">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{item.id}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{item.channel_code}</TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{item.channel_name}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{item.sort_order}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Badge variant={item.is_enabled ? "default" : "secondary"}>
                      {item.is_enabled ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="mr-1 size-3" />
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 className="mr-1 size-3" />
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ChannelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        channel={editingChannel}
        onNotification={showNotification}
        onSuccess={fetchData}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除渠道「{deleteTarget?.channel_name}」吗？如果该渠道已被素材使用，将无法删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
