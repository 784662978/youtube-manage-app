// 选剧频道相关类型定义

// API 通用响应
export interface ApiResponse<T> {
  status: number
  success: boolean
  msg: string
  response: T
}

// 分页响应
export interface PageResponse<T> {
  page: number
  pageCount: number
  dataCount: number
  pageSize: number
  data: T[]
}

// ==================== Reelshort ====================

export interface ReelshortVideo {
  id: number
  book_id: string
  title: string
  pic_url: string
  language: string
  pull_date: string
  pull_sort: string
  pull_sequence: number
  review_status: string
}

export type RStatus = 'pending' | 'has_r' | 'no_r'

export interface ReelshortVideoParams {
  r_status?: RStatus
  language?: string
  from?: string
  to?: string
  pull_sort?: 'time' | 'money'
  only_new_money_list?: string
  page?: number
  page_size?: number
}

export interface BatchReviewRequest {
  has_r: string[]
  no_r: string[]
}

export interface BatchReviewResponse {
  has_r_updated: number
  no_r_updated: number
  not_found: string[]
}

// ==================== 七星剧目 ====================

export interface QixingVideo {
  id: number
  serial_id: number
  app_id: string
  title: string
  tag: string
  language: number
  pull_date: string
  pull_sequence: number
}

export interface QixingVideoParams {
  language?: number
  from?: string
  to?: string
  page?: number
  page_size?: number
}

// ==================== Dramabox ====================

export interface DramaboxVideo {
  id: number
  drama_id: number
  api_list_id: number
  drama_name: string
  drama_oversea_name: string
  exclusive_type: string
  languages: string
  curate_time: number
  updated_at: string
  pull_date: string
  pull_sequence: number
}

export interface DramaboxVideoParams {
  exclusive_type?: string
  language?: string
  from?: string
  to?: string
  page?: number
  page_size?: number
}
