"use client"

import * as React from "react"
import dayjs from "dayjs"
import { apiClient } from "@/lib/api-client"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown, MoreHorizontal, Loader, Plus, SquarePen, Trash, KeyRound, RefreshCw, Languages, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Notification, NotificationType } from "@/components/ui/notification"
import { VideoListModal } from "./video-list-modal"

// 定义表格数据类型
export type Payment = {
  id: number,
  user_id: number,
  name: string,
  description: string,
  auth_status: number,
  channel_id: string,
  channel_title: string,
  channel_country: string,
  channel_published_at: string,
  created_at: string
}

export function DataTableDemo() {
  const [data, setData] = React.useState<Payment[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [loading, setLoading] = React.useState(true)
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Notification State
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    isVisible: boolean
  }>({ message: "", type: "success", isVisible: false })

  const showNotification = (message: string, type: NotificationType = "success") => {
    setNotification({ message, type, isVisible: true })
  }

  // Edit State
  const [isAdd, setIsAdd] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false)
  const [currentProject, setCurrentProject] = React.useState<{
    id?: number,
    name: string,
    description: string
  } | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  // Delete State
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [projectToDelete, setProjectToDelete] = React.useState<Payment | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Search State
  const [idFilter, setIdFilter] = React.useState("")

  // Sync State
  const [syncingId, setSyncingId] = React.useState<number | null>(null)

  const handleSync = async (id: number) => {
    setSyncingId(id)
    try {
      await apiClient.get(`/data/sync-all/${id}`)
      showNotification("同步成功", "success")
    } catch (error) {
      console.error("Sync failed", error)
      showNotification("同步失败", "error")
    } finally {
      setSyncingId(null)
    }
  }

  // Video List State
  const [videoListOpen, setVideoListOpen] = React.useState(false)
  const [currentChannelForVideo, setCurrentChannelForVideo] = React.useState<{ id: number, name: string } | null>(null)

  const columnTranslations: { [key: string]: string } = {
    id: "ID",
    name: "频道名称",
    description: "频道描述",
    created_at: "创建时间",
    auth_status: "授权状态",
    actions: "操作",
  }

  // Debounce Search
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      // Ensure we only filter if table is ready
      // Note: table instance is created below, so this effect should be fine as it depends on [idFilter]
      // But we can't access 'table' variable here because it's defined below.
      // We need to move table definition up or use a ref?
      // Actually, standard way is to just pass state to useReactTable.
      // But we are using 'table.getColumn' which requires table instance.
      // Correct way: The 'table' instance is derived from state.
      // We can't access 'table' inside an effect that is defined before 'table'.
      // We should move this effect AFTER table definition.
    }, 300)
    return () => clearTimeout(timeout)
  }, [idFilter])

  // Fetch Data
  const fetchData = async () => {
    setLoading(true)
    try {
      const { response } = await apiClient.get<{ response: Payment[] }>("/project")
      setData(response)
    } catch (error) {
      console.error("Failed to fetch projects", error)
      showNotification("获取项目列表失败", "error")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchData()
  }, [])

  // Handle Google Authorization
  const handleAuthorize = async (id: number) => {
    try {
      const res = await apiClient.get<{ response: string }>(`/googleAuth/authorize/${id}`)
      if (res && res.response) {
        const authUrl = res.response
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const popup = window.open(authUrl, "Google Auth", `width=${width},height=${height},left=${left},top=${top}`)

        // Start Polling for status change
        const pollInterval = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(pollInterval)
            return
          }

          try {
            // Silently fetch data to check status
            const { response } = await apiClient.get<{ response: Payment[] }>("/project")
            const project = response.find(p => p.id === id)

            // Assuming auth_status != 0 means authorized (e.g. 1)
            if (project && project.auth_status !== 0) {
              clearInterval(pollInterval)
              popup?.close()
              setData(response) // Update UI with new data
              showNotification("授权成功！", "success")
            }
          } catch (err) {
            // Ignore polling errors to avoid spamming console
          }
        }, 2000)

        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval)
        }, 120000)

      } else {
        showNotification("无法获取授权链接", "error")
      }
    } catch (error) {
      console.error("Authorization error", error)
      showNotification("授权请求失败", "error")
    }
  }

  // Columns
  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: "id",
      header: "ID",
      filterFn: 'includesString',
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("id")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: () => <div className="text-center">频道名称</div>,
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="truncate capitalize cursor-pointer text-center">
              {row.getValue("name")}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{row.getValue("name")}</p>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      accessorKey: "description",
      header: () => <div className="text-center">频道描述</div>,
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-[200px] truncate capitalize cursor-pointer text-center mx-auto">
              {row.getValue("description")}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] break-words">
            <p>{row.getValue("description")}</p>
          </TooltipContent>
        </Tooltip>
      ),
    },
    {
      accessorKey: "created_at",
      header: () => <div className="text-center">创建时间</div>,
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-[150px] truncate capitalize cursor-pointer text-center mx-auto">
              {dayjs(row.getValue("created_at")).format("YYYY-MM-DD HH:mm:ss")}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dayjs(row.getValue("created_at")).format("YYYY-MM-DD HH:mm:ss")}</p>
          </TooltipContent>
        </Tooltip>
      ),
    },
    // 授权状态
    {
      accessorKey: "auth_status",
      header: "授权状态",
      cell: ({ row }) => (
        <div className="capitalize">
          <Badge
            variant={row.getValue("auth_status") === 0 ? "destructive" : "default"}
          >
            {row.getValue("auth_status") === 0 ? "未授权" : "已授权"}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const payment = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>数据操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => {
                setCurrentProject(payment)
                setIsAdd(false)
                setEditOpen(true)
              }}>
                <SquarePen className="mr-2 h-4 w-4" />编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setProjectToDelete(payment)
                setDeleteOpen(true)
              }}>
                <Trash className="mr-2 h-4 w-4" />删除
              </DropdownMenuItem>
              <DropdownMenuLabel>频道操作</DropdownMenuLabel>
              {
                payment.auth_status === 0 &&
                <DropdownMenuItem onClick={() => handleAuthorize(payment.id)}>
                  <KeyRound className="mr-2 h-4 w-4" />授权频道
                </DropdownMenuItem>
              }
              {
                payment.auth_status !== 0 &&
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      handleSync(payment.id)
                    }}
                    disabled={syncingId === payment.id}
                  >
                    {syncingId === payment.id ? (
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    同步内容
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => {
                    setCurrentChannelForVideo({ id: payment.id, name: payment.name })
                    setVideoListOpen(true)
                  }}>
                    <Video className="mr-2 h-4 w-4" />查看视频
                  </DropdownMenuItem>
                </>
              }

            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Move debounce effect here to access 'table'
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      table.getColumn("id")?.setFilterValue(idFilter)
    }, 300)
    return () => clearTimeout(timeout)
  }, [idFilter, table])


  // Handlers
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProject) return

    setIsSaving(true)

    try {
      if (isAdd) {
        await apiClient.post(`/project`, {
          name: currentProject.name,
          description: currentProject.description
        })
        showNotification("创建成功", "success")
      } else {
        await apiClient.put(`/project/${currentProject.id}`, {
          name: currentProject.name,
          description: currentProject.description
        })
        showNotification("更新成功", "success")
      }
      setEditOpen(false)
      fetchData()
    } catch (error) {
      console.error("Update failed", error)
      showNotification("操作失败", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)
    try {
      await apiClient.delete(`/project/${projectToDelete.id}`)
      setDeleteOpen(false)
      fetchData()
      showNotification("删除成功", "success")
    } catch (error) {
      console.error("Delete failed", error)
      showNotification("删除失败", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full">
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
      />

      <div className="flex items-center py-4 gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="查询ID"
            value={idFilter}
            onChange={(event) => setIdFilter(event.target.value)}
            className="max-w-sm w-[200px]"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              列 <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {columnTranslations[column.id] || column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="ml-2" onClick={() => {
          setIsAdd(true);
          setEditOpen(true)
          setCurrentProject({
            name: "",
            description: ""
          })
        }}>
          <Plus />创建频道
        </Button>
      </div>
      <div className="overflow-hidden rounded-md border mb-10">
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="**:data-[slot=table-cell]:first:w-8">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <Loader className="animate-spin" />
                    </div>
                  ) : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{isAdd ? "创建频道" : "编辑频道"}</SheetTitle>
            <SheetDescription>
              {isAdd ? "填写以下信息以创建新频道。" : "修改频道信息并保存。"}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 px-4">
            <div className="space-y-2">
              <Label htmlFor="name">频道名称</Label>
              <Input
                id="name"
                value={currentProject?.name || ""}
                onChange={(e) =>
                  setCurrentProject((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">频道描述</Label>
              <Textarea
                id="description"
                value={currentProject?.description || ""}
                onChange={(e) =>
                  setCurrentProject((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
              />
            </div>
            <SheetFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。这将永久删除频道 {projectToDelete?.name}。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VideoListModal
        isOpen={videoListOpen}
        onClose={() => setVideoListOpen(false)}
        channelId={currentChannelForVideo?.id ?? null}
        channelName={currentChannelForVideo?.name ?? ""}
      />
    </div>
  )
}
