"use client"

import * as React from "react"
import dayjs from "dayjs"
import { apiClient } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Loader, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Languages,
  MoreHorizontal
} from "lucide-react"
import { Notification, NotificationType } from "@/components/ui/notification"
import { LanguageSelectorModal, type Language } from "@/components/common/language-selector-modal"

interface Video {
  id: number
  video_id: string
  title: string
  publish_time: string
  duration: string | number
  country: string
}

interface VideoListResponse {
  data: Video[]
  dataCount: number
  page: number
  pageCount: number
  pageSize: number
}

interface VideoListModalProps {
  isOpen: boolean
  onClose: () => void
  channelId: number | string | null
  channelName: string
}

export function VideoListModal({ isOpen, onClose, channelId, channelName }: VideoListModalProps) {
  const [videos, setVideos] = React.useState<Video[]>([])
  const [loading, setLoading] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(25)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalCount, setTotalCount] = React.useState(0)
  
  const [searchVideoId, setSearchVideoId] = React.useState("")
  const [searchTitle, setSearchTitle] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  
  // Jump to page state
  const [jumpPage, setJumpPage] = React.useState("")

  // Language Modal State
  const [addLangOpen, setAddLangOpen] = React.useState(false)
  const [currentVideoId, setCurrentVideoId] = React.useState<string | null>(null)
  const [languages, setLanguages] = React.useState<Language[]>([])
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([])
  const [langTitle, setLangTitle] = React.useState("")
  const [langDescription, setLangDescription] = React.useState("")
  const [isLangSubmitting, setIsLangSubmitting] = React.useState(false)

  // Notification State
  const [notification, setNotification] = React.useState<{
    message: string
    type: NotificationType
    isVisible: boolean
  }>({ message: "", type: "success", isVisible: false })

  const showNotification = (message: string, type: NotificationType = "success") => {
    setNotification({ message, type, isVisible: true })
  }

  const fetchVideos = React.useCallback(async (pageNum: number, size: number) => {
    if (!channelId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<{ response: VideoListResponse }>(`/video/${channelId}`, {
        page: pageNum,
        page_size: size,
        video_id: searchVideoId,
        title: searchTitle
      })
      
      const data = res.response
      if (data && Array.isArray(data.data)) {
        setVideos(data.data)
        setTotalPages(data.pageCount || 1)
        setPage(data.page || pageNum)
        setTotalCount(data.dataCount || 0)
        setPageSize(data.pageSize || size)
      } else {
        setVideos([])
        setTotalPages(1)
        setTotalCount(0)
      }
    } catch (err) {
      console.error("Failed to fetch videos", err)
      setError("加载视频列表失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }, [channelId, searchVideoId, searchTitle])

  React.useEffect(() => {
    if (isOpen && channelId) {
      setPage(1)
      setSearchVideoId("")
      setSearchTitle("")
      setVideos([])
      setJumpPage("")
      fetchVideos(1, pageSize)
    }
  }, [isOpen, channelId])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchVideos(1, pageSize)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage)
      fetchVideos(newPage, pageSize)
      setJumpPage("")
    }
  }

  const handlePageSizeChange = (newSize: string) => {
    const size = parseInt(newSize)
    setPageSize(size)
    setPage(1)
    fetchVideos(1, size)
  }

  const handleJumpPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(jumpPage)
      if (!isNaN(pageNum)) {
        handlePageChange(pageNum)
      }
    }
  }

  const formatDuration = (seconds: string | number) => {
    const sec = Number(seconds)
    if (isNaN(sec)) return seconds
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Language Logic
  const fetchLanguages = async () => {
    try {
      const { response } = await apiClient.get<{ response: Language[] }>("/lang")
      setLanguages(response)
    } catch (error) {
      console.error("Failed to fetch languages", error)
      showNotification("获取语言列表失败", "error")
    }
  }

  const handleOpenAddLang = (videoId: string) => {
    setCurrentVideoId(videoId)
    setAddLangOpen(true)
    setSelectedLanguages([])
    setLangTitle("")
    setLangDescription("")
    fetchLanguages()
  }

  const handleLangSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentVideoId) return
    if (selectedLanguages.length === 0) {
      showNotification("请至少选择一种语言", "error")
      return
    }
    if (!langTitle.trim()) {
      showNotification("标题不能为空", "error")
      return
    }

    setIsLangSubmitting(true)
    try {
      const payload = {
        langs: selectedLanguages.map(langCode => ({
          lang: langCode,
          title: langTitle,
          description: langDescription
        }))
      }

      await apiClient.post(`/video/add-lang/${currentVideoId}`, payload)

      showNotification("添加语言成功", "success")
      setAddLangOpen(false)
    } catch (error: any) {
      console.error("Add language failed", error)
      showNotification(error.response?.data?.msg || "添加语言失败", "error")
    } finally {
      setIsLangSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[80%] h-[90vh] flex flex-col p-0 gap-0">
        <Notification
            message={notification.message}
            type={notification.type}
            isVisible={notification.isVisible}
            onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        />
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>频道视频列表 - [{channelName}]</DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-2 pb-4 border-b">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="search-video-id" className="text-sm font-medium">Video ID</label>
              <Input 
                id="search-video-id"
                placeholder="精确搜索 Video ID" 
                value={searchVideoId}
                onChange={(e) => setSearchVideoId(e.target.value)}
                className="w-[200px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="search-title" className="text-sm font-medium">标题</label>
              <Input 
                id="search-title"
                placeholder="模糊搜索标题" 
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="w-[300px]"
              />
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>
          </form>
        </div>

        <div className="flex-1 overflow-hidden p-6 pt-0">
          <div className="h-full overflow-auto border rounded-md relative mt-4">
            <Table>
              <TableHeader className="sticky top-0 bg-secondary z-10">
                <TableRow>
                  <TableHead>Video ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>国家/地区</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex justify-center items-center h-full">
                        <Loader className="animate-spin w-6 h-6 mr-2" />
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-red-500">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : videos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  videos.map((video) => (
                    <TableRow key={video.id}>
                      <TableCell className="font-medium">{video.video_id}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={video.title}>
                        {video.title}
                      </TableCell>
                      <TableCell>
                        {dayjs(video.publish_time).format("YYYY-MM-DD HH:mm:ss")}
                      </TableCell>
                      <TableCell>{formatDuration(video.duration)}</TableCell>
                      <TableCell>{video.country}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenAddLang(video.video_id)}>
                              <Languages className="mr-2 h-4 w-4" />添加语言
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                  共 {totalCount} 条
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">每页</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={String(pageSize)} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">条</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground mr-2">
                    第 {page} / {totalPages} 页
                </div>
                
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(1)}
                        disabled={page <= 1 || loading}
                        title="第一页"
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1 || loading}
                        title="上一页"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages || loading}
                        title="下一页"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                     <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={page >= totalPages || loading}
                        title="最后一页"
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                   <span className="text-sm text-muted-foreground whitespace-nowrap">前往</span>
                   <Input 
                     className="h-8 w-12 px-1 text-center" 
                     value={jumpPage} 
                     onChange={(e) => setJumpPage(e.target.value)}
                     onKeyDown={handleJumpPage}
                     placeholder={String(page)}
                     disabled={loading}
                   />
                   <span className="text-sm text-muted-foreground whitespace-nowrap">页</span>
                </div>
            </div>
        </div>

        <LanguageSelectorModal
          open={addLangOpen}
          onOpenChange={setAddLangOpen}
          languages={languages}
          selectedLanguages={selectedLanguages}
          videoId={currentVideoId}
          // Do not allow editing video ID here as it comes from the row
          title={langTitle}
          description={langDescription}
          onSelectedLanguagesChange={setSelectedLanguages}
          onTitleChange={setLangTitle}
          onDescriptionChange={setLangDescription}
          onSubmit={handleLangSubmit}
          isSubmitting={isLangSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
