"use client"

import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { Notification, NotificationType } from "@/components/ui/notification"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Loader2 } from "lucide-react"
import type {
  LanguageItem,
  LanguageModuleConfig,
  LanguageFormFieldConfig,
  ApiResponse,
} from "@/lib/types/language"

interface AddLanguageModalProps {
  config: LanguageModuleConfig<LanguageItem>
  onSuccess: () => void
  onNotification: (message: string, type: NotificationType) => void
}

export function AddLanguageModal({ config, onSuccess, onNotification }: AddLanguageModalProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<Record<string, string | number>>(
    () => config.getDefaultFormData()
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = config.transformFormData(formData)
      await apiClient.post<ApiResponse<LanguageItem>>(`/${config.apiPath}`, body)
      onNotification("新增成功", "success")
      setOpen(false)
      setFormData(config.getDefaultFormData())
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : "新增失败"
      onNotification(message, "error")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setFormData(config.getDefaultFormData())
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新增
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增语言</DialogTitle>
          <DialogDescription>
            请填写以下信息来新增{config.title}语言配置
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {config.formFields.map((field) => (
              <div key={field.key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={field.key} className="text-right">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  value={formData[field.key] ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]:
                        field.type === "number"
                          ? Number(e.target.value) || 0
                          : e.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="col-span-3"
                  required={field.required}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认新增
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface LanguageListPageProps<T extends LanguageItem> {
  config: LanguageModuleConfig<T>
}

export function LanguageListPage<T extends LanguageItem>({
  config,
}: LanguageListPageProps<T>) {
  const [data, setData] = React.useState<T[]>([])
  const [loading, setLoading] = React.useState(true)
  const [deleteTarget, setDeleteTarget] = React.useState<T | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    visible: boolean
  }>({
    message: "",
    type: "success",
    visible: false,
  })

  const showNotification = React.useCallback(
    (message: string, type: NotificationType) => {
      setNotification({ message, type, visible: true })
    },
    []
  )

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiClient.get<ApiResponse<T[]>>(
        `/${config.apiPath}`
      )
      setData(result.response || [])
    } catch (error) {
      console.error("Failed to fetch language list:", error)
      showNotification("获取数据失败，请稍后重试", "error")
    } finally {
      setLoading(false)
    }
  }, [config.apiPath, showNotification])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await apiClient.delete<ApiResponse<boolean>>(
        `/${config.apiPath}/${deleteTarget.id}`
      )
      showNotification("删除成功", "success")
      setDeleteTarget(null)
      fetchData()
    } catch (error) {
      const message = error instanceof Error ? error.message : "删除失败"
      showNotification(message, "error")
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
        onClose={() =>
          setNotification((prev) => ({ ...prev, visible: false }))
        }
      />

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
        <AddLanguageModal
          config={config}
          onSuccess={fetchData}
          onNotification={showNotification}
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {config.columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-20 text-center">排序</TableHead>
              <TableHead className="w-20 text-center">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={config.columns.length + 2}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={config.columns.length + 2}
                  className="h-24 text-center text-muted-foreground"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {config.columns.map((col) => (
                    <TableCell key={col.key}>
                      {config.getDisplayValue(item, col.key)}
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    {item.sort_order}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? config.deleteConfirmText(deleteTarget)
                : "确定要删除此项吗？"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
