"use client"

import * as React from "react"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
import { apiClient } from "@/lib/api-client"

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Loader,
  Download,
  Calendar as CalendarIcon,
  TrendingUp,
  DollarSign,
  Eye,
  Clock,
  RefreshCw
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { cn } from "@/lib/utils"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { generateExcelXML, downloadExcel } from "@/lib/excel-helper"

interface AnalyticsData {
  date: string
  estimated_revenue: number
  estimated_revenue_tw: number
  estimated_revenue_us: number
  views: number
  average_view_duration: number
}

interface VideoAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  videoId: number | string | null
  videoTitle: string
}

type SortField = 'date' | 'views' | 'estimated_revenue'
type SortOrder = 'asc' | 'desc'

export function VideoAnalyticsModal({ isOpen, onClose, videoId, videoTitle }: VideoAnalyticsModalProps) {
  const [data, setData] = React.useState<AnalyticsData[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [dateRange, setDateRange] = React.useState<{ start: string; end: string }>({ start: "", end: "" })
  const [sortConfig, setSortConfig] = React.useState<{ field: SortField; order: SortOrder }>({ field: 'date', order: 'desc' })

  const fetchData = React.useCallback(async () => {
    if (!videoId) return
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<{ response: AnalyticsData[] }>(`/data/analytics-daily/${videoId}`)
      // Sort by date desc by default
      const sortedData = (res.response || []).sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
      setData(sortedData)
      
      // Initialize date range
      if (sortedData.length > 0) {
        const dates = sortedData.map(d => d.date).sort()
        setDateRange({
          start: dates[0],
          end: dates[dates.length - 1]
        })
      }
    } catch (err) {
      console.error("Failed to fetch analytics", err)
      setError("获取数据失败，请重试")
    } finally {
      setLoading(false)
    }
  }, [videoId])

  React.useEffect(() => {
    if (isOpen && videoId) {
      fetchData()
    }
  }, [isOpen, videoId, fetchData])

  // Filter and Sort Data
  const filteredData = React.useMemo(() => {
    let filtered = [...data]

    // Date Filter
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        const d = dayjs(item.date)
        return d.isSameOrAfter(dateRange.start) && d.isSameOrBefore(dateRange.end)
      })
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = sortConfig.field === 'date' ? dayjs(a.date).unix() : a[sortConfig.field]
      const bValue = sortConfig.field === 'date' ? dayjs(b.date).unix() : b[sortConfig.field]
      
      if (aValue < bValue) return sortConfig.order === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.order === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [data, dateRange, sortConfig])

  // Stats Summary
  const stats = React.useMemo(() => {
    const totalViews = filteredData.reduce((sum, item) => sum + item.views, 0)
    const totalRevenue = filteredData.reduce((sum, item) => sum + item.estimated_revenue, 0)
    const avgDuration = filteredData.length > 0 
      ? filteredData.reduce((sum, item) => sum + item.average_view_duration, 0) / filteredData.length 
      : 0
    
    return { totalViews, totalRevenue, avgDuration }
  }, [filteredData])

  const handleExport = () => {
    setLoading(true)
    setTimeout(() => {
      try {
        const xml = generateExcelXML([
          {
            name: "数据概况",
            columns: [
              { header: "日期", key: "date", width: 80, type: "String" },
              { header: "观看次数", key: "views", width: 100, type: "Number" },
              { header: "预估收入", key: "estimated_revenue", width: 100, type: "Number" },
              { header: "台湾预估收入", key: "estimated_revenue_tw", width: 120, type: "Number" },
              { header: "美国预估收入", key: "estimated_revenue_us", width: 120, type: "Number" },
              { header: "平均观看时长", key: "average_view_duration", width: 120, type: "Number" },
            ],
            data: filteredData
          }
        ])
        downloadExcel(xml, `analytics_${videoId}_${dayjs().format("YYYYMMDD")}.xls`)
      } catch (e) {
        console.error("Export failed", e)
      } finally {
        setLoading(false)
      }
    }, 100) // Small delay to show loading state if needed
  }

  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc'
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90%] w-[1000px] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Youtube数据概况 - <span className="text-muted-foreground text-sm font-normal truncate max-w-[400px]">{videoTitle}</span>
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                刷新
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={loading || data.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
          {loading && data.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="animate-spin w-8 h-8 text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-full gap-4">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchData}>重试</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  title="总观看次数" 
                  value={<AnimatedNumber value={stats.totalViews} />} 
                  icon={<Eye className="w-4 h-4 text-blue-500" />} 
                />
                <Card 
                  title="总预估收入" 
                  value={<AnimatedNumber value={stats.totalRevenue} prefix="$" decimals={2} />} 
                  icon={<DollarSign className="w-4 h-4 text-green-500" />} 
                />
                <Card 
                  title="平均观看时长" 
                  value={<AnimatedNumber value={stats.avgDuration} suffix="s" decimals={1} />} 
                  icon={<Clock className="w-4 h-4 text-orange-500" />} 
                />
              </div>

              {/* Chart Section - Enhanced SVG Line Chart */}
              <div className="bg-card border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">趋势图表</h3>
                <div className="h-[300px] w-full">
                   <EnhancedLineChart data={filteredData} />
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('date')}>
                        日期 {sortConfig.field === 'date' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('views')}>
                        观看次数 {sortConfig.field === 'views' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort('estimated_revenue')}>
                        预估收入 {sortConfig.field === 'estimated_revenue' && (sortConfig.order === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>台湾收入</TableHead>
                      <TableHead>美国收入</TableHead>
                      <TableHead>平均时长(秒)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.views.toLocaleString()}</TableCell>
                        <TableCell className="text-green-600 font-medium">${row.estimated_revenue.toFixed(4)}</TableCell>
                        <TableCell>${row.estimated_revenue_tw.toFixed(4)}</TableCell>
                        <TableCell>${row.estimated_revenue_us.toFixed(4)}</TableCell>
                        <TableCell>{row.average_view_duration.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    {filteredData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Card({ title, value, icon }: { title: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

// Enhanced SVG Line Chart Component with Interactivity and Animations
function EnhancedLineChart({ data }: { data: AnalyticsData[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [hoverData, setHoverData] = React.useState<{ x: number, y: number, data: AnalyticsData } | null>(null)
  
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
  }, [data])
  
  if (sortedData.length < 2) return <div className="flex items-center justify-center h-full text-muted-foreground">数据不足以生成图表</div>

  const width = 1000
  const height = 300
  const padding = 40 // Increased padding for axis labels

  const maxViews = Math.max(...sortedData.map(d => d.views), 1)
  // const maxRevenue = Math.max(...sortedData.map(d => d.estimated_revenue), 0.01)

  const getX = (index: number) => (index / (sortedData.length - 1)) * (width - padding * 2) + padding
  const getY = (value: number, max: number) => height - (value / max) * (height - padding * 2) - padding

  const pointsViews = sortedData.map((d, i) => `${getX(i)},${getY(d.views, maxViews)}`).join(" ")
  // const pointsRevenue = sortedData.map((d, i) => `${getX(i)},${getY(d.estimated_revenue, maxRevenue)}`).join(" ")

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const relativeX = (x / rect.width) * width
    
    // Find nearest point
    const index = Math.round(((relativeX - padding) / (width - padding * 2)) * (sortedData.length - 1))
    const safeIndex = Math.max(0, Math.min(index, sortedData.length - 1))
    const d = sortedData[safeIndex]
    
    setHoverData({
      x: getX(safeIndex),
      y: getY(d.views, maxViews),
      data: d
    })
  }

  const handleMouseLeave = () => {
    setHoverData(null)
  }

  // X Axis Label Logic
  const getXAxisLabel = (dateStr: string, index: number, total: number) => {
    const date = dayjs(dateStr)
    const today = dayjs()
    const diffDays = today.diff(date, 'day')
    
    // Determine step to avoid overcrowding
    const step = Math.max(1, Math.floor(total / 8))
    if (index % step !== 0 && index !== total - 1) return null

    if (diffDays === 0) return date.format("HH:mm") // Just concept, daily data won't have time usually
    if (diffDays < 7) return `周${"日一二三四五六"[date.day()]}`
    if (date.year() !== today.year()) return date.format("YYYY-MM-DD")
    return date.format("MM-DD")
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
          <line 
            key={tick}
            x1={padding} 
            y1={height - tick * (height - padding * 2) - padding} 
            x2={width - padding} 
            y2={height - tick * (height - padding * 2) - padding} 
            stroke="#e5e7eb" 
            strokeDasharray="4"
          />
        ))}

        {/* X Axis Labels */}
        {sortedData.map((d, i) => {
          const label = getXAxisLabel(d.date, i, sortedData.length)
          if (!label) return null
          return (
            <text 
              key={d.date} 
              x={getX(i)} 
              y={height - 10} 
              textAnchor="middle" 
              fontSize="12" 
              fill="#6b7280"
            >
              {label}
            </text>
          )
        })}

        {/* Views Line */}
        <motion.path
          d={`M ${pointsViews}`}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        />

        {/* Area under curve (Gradient) */}
        <defs>
          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <motion.path
           d={`M ${pointsViews} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
           fill="url(#viewsGradient)"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.2 }}
        />

        {/* Hover Indicator */}
        {hoverData && (
          <g>
            <line 
              x1={hoverData.x} 
              y1={padding} 
              x2={hoverData.x} 
              y2={height - padding} 
              stroke="#9ca3af" 
              strokeDasharray="4"
            />
            <circle 
              cx={hoverData.x} 
              cy={hoverData.y} 
              r="6" 
              fill="#3b82f6" 
              stroke="white" 
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      
      {/* Tooltip Overlay */}
      {hoverData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bg-background/95 backdrop-blur border rounded-lg shadow-lg p-3 text-sm pointer-events-none z-10"
          style={{ 
            left: `${(hoverData.x / width) * 100}%`, 
            top: `${(hoverData.y / height) * 100}%`,
            transform: 'translate(-50%, -120%)'
          }}
        >
          <div className="font-semibold mb-1">{hoverData.data.date}</div>
          <div className="flex items-center gap-2 text-blue-600">
            <Eye className="w-3 h-3" />
            <span>{hoverData.data.views.toLocaleString()} 次观看</span>
          </div>
          <div className="flex items-center gap-2 text-green-600 mt-1">
            <DollarSign className="w-3 h-3" />
            <span>${hoverData.data.estimated_revenue.toFixed(2)}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
