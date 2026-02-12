"use client"

import * as React from "react"
import { Loader, X, ExternalLink, Search, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table"
import { apiClient } from "@/lib/api-client"
import { NotificationType } from "@/components/ui/notification"
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

interface TrendingVideo {
  video_id: string
  video_title: string
  video_url: string
  view_count: number
  delta_view_count: number
}

interface TrendingVideosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNotification: (message: string, type: NotificationType) => void
}

export function TrendingVideosModal({ 
  open, 
  onOpenChange, 
  onNotification 
}: TrendingVideosModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<TrendingVideo[]>([])
  
  // Search Filters
  const [title, setTitle] = React.useState("reelshort,dramabox")
  const [minDeltaViews, setMinDeltaViews] = React.useState<number | "">("")

  // Ignore Video State
  const [ignoreVideo, setIgnoreVideo] = React.useState<TrendingVideo | null>(null)
  const [ignoreDialogOpen, setIgnoreDialogOpen] = React.useState(false)
  const [isIgnoring, setIsIgnoring] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (title) queryParams.append("title", title)
      if (minDeltaViews !== "") queryParams.append("min_delta_views", minDeltaViews.toString())
      else queryParams.append("min_delta_views", "0")

      const { response } = await apiClient.get<{
        response: TrendingVideo[]
      }>(`/monitor/trending-videos?${queryParams.toString()}`)
      
      if (Array.isArray(response)) {
        setData(response)
      } else if ((response as any).data && Array.isArray((response as any).data)) {
         setData((response as any).data)
      } else {
         setData([])
      }
    } catch (error: any) {
      console.error("Failed to fetch trending videos:", error)
      onNotification("获取热门剧数据失败，请重试", "error")
    } finally {
      setLoading(false)
    }
  }, [title, minDeltaViews, onNotification])

  // Initial load when modal opens
  React.useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, fetchData])

  const handleIgnore = async () => {
    if (!ignoreVideo) return

    setIsIgnoring(true)
    try {
      await apiClient.post(`/monitorChannel/ignore-video/${ignoreVideo.video_id}`, {})
      
      // Remove from local data
      setData(prev => prev.filter(v => v.video_id !== ignoreVideo.video_id))
      onNotification("已忽略该视频", "success")
      setIgnoreDialogOpen(false)
      setIgnoreVideo(null)
    } catch (error: any) {
      console.error("Failed to ignore video:", error)
      onNotification(error.message || "忽略视频失败", "error")
    } finally {
      setIsIgnoring(false)
    }
  }

  // Table Configuration
  const columns: ColumnDef<TrendingVideo>[] = React.useMemo(() => [
    {
      accessorKey: "video_title",
      header: "剧名",
      cell: ({ row }) => (
        <a 
          href={row.original.video_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1"
        >
          {row.getValue("video_title")}
          <ExternalLink className="h-3 w-3" />
        </a>
      ),
    },
    {
      accessorKey: "view_count",
      header: "总观看数",
      cell: ({ row }) => {
        const value = row.getValue("view_count") as number
        return <div>{value.toLocaleString()}</div>
      },
    },
    {
      accessorKey: "delta_view_count",
      header: "增量观看数",
      cell: ({ row }) => {
        const value = row.getValue("delta_view_count") as number
        return <div className="text-green-600 font-medium">+{value.toLocaleString()}</div>
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => {
            setIgnoreVideo(row.original)
            setIgnoreDialogOpen(true)
          }}
        >
          忽略视频
        </Button>
      ),
    },
  ], [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
        pagination: {
            pageSize: 20,
        }
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>热门剧监控</DialogTitle>
             {/* Close button is automatically added by DialogContent usually, but we can custom if needed. 
                 Radix UI DialogContent includes a close button. */}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Area */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="search_title">剧名</Label>
              <Input 
                id="search_title" 
                placeholder="请输入剧名" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="min_delta">最小增量观看数</Label>
              <Input 
                id="min_delta" 
                type="number" 
                placeholder="0" 
                value={minDeltaViews}
                onChange={(e) => setMinDeltaViews(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
            <Button onClick={fetchData} disabled={loading}>
              {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              查询
            </Button>
          </div>

          {/* Table Area */}
          <div className="rounded-md border flex-1 overflow-auto">
             <Table>
              <TableHeader className="sticky top-0 bg-secondary z-10">
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
                {loading ? (
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
          
           {/* Pagination */}
           <div className="flex items-center justify-end space-x-2 pt-2 border-t">
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

        {/* Ignore Confirmation Dialog */}
        <AlertDialog open={ignoreDialogOpen} onOpenChange={setIgnoreDialogOpen}>
            <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>确认忽略该视频？</AlertDialogTitle>
                <AlertDialogDescription>
                忽略后不再出现在热门列表。
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isIgnoring}>取消</AlertDialogCancel>
                <AlertDialogAction onClick={(e) => {
                    e.preventDefault()
                    handleIgnore()
                }} disabled={isIgnoring} className="bg-red-600 hover:bg-red-700">
                {isIgnoring && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                确认忽略
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </DialogContent>
    </Dialog>
  )
}
