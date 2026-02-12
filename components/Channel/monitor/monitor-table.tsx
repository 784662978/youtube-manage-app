"use client"

import * as React from "react"
import dayjs from "dayjs"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Loader, Pencil, Trash2, MoreHorizontal } from "lucide-react"

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationType } from "@/components/ui/notification"
import { EditChannelModal } from "./edit-channel-modal"
import { apiClient } from "@/lib/api-client"

export interface MonitorChannel {
  id: number
  channel_id: string
  channel_name: string
  remark: string
  created_at: string
}

interface MonitorTableProps {
  data: MonitorChannel[]
  isLoading: boolean
  onSuccess: () => void
  onNotification: (message: string, type: NotificationType) => void
}

export function MonitorTable({ data, isLoading, onSuccess, onNotification }: MonitorTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "created_at", desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Edit State
  const [editChannel, setEditChannel] = React.useState<MonitorChannel | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)

  // Delete State
  const [deleteChannel, setDeleteChannel] = React.useState<MonitorChannel | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!deleteChannel) return
    
    setIsDeleting(true)
    try {
      await apiClient.delete(`/monitorChannel/${deleteChannel.id}`)
      onNotification("删除监控频道成功", "success")
      setDeleteOpen(false)
      onSuccess()
    } catch (error: any) {
      console.error("Failed to delete monitor channel:", error)
      onNotification(error.message || "删除监控频道失败", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  const columns: ColumnDef<MonitorChannel>[] = React.useMemo(() => [
    {
      accessorKey: "channel_name",
      header: "频道名称",
      cell: ({ row }) => <div className="font-medium">{row.getValue("channel_name")}</div>,
    },
    {
      accessorKey: "channel_id",
      header: "频道ID",
    },
    {
      accessorKey: "remark",
      header: "备注",
      cell: ({ row }) => {
         const remark = row.getValue("remark") as string;
         return <div className="truncate max-w-[300px]" title={remark}>{remark || "-"}</div>
      }
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            创建时间
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string
        return <div>{date ? dayjs(date).format("YYYY-MM-DD HH:mm:ss") : "-"}</div>
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const channel = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setEditChannel(channel)
                setEditOpen(true)
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                修改
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setDeleteChannel(channel)
                  setDeleteOpen(true)
                }}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
    initialState: {
        pagination: {
            pageSize: 20,
        }
    }
  })

  return (
    <div className="w-full">
      <EditChannelModal 
        channel={editChannel}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onSuccess}
        onNotification={onNotification}
      />
      
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除频道 "{deleteChannel?.channel_name}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }} disabled={isDeleting}>
              {isDeleting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
          <TableBody>
            {isLoading ? (
               <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    加载中...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 条记录
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
