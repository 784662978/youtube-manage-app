// 素材库 & 混剪任务相关类型定义

import type { ApiResponse, PageResponse } from './drama'

// ==================== 素材库 ====================

export interface MaterialItem {
  id: number
  name: string
  channel: string
  language: string
  duration_seconds: number
  oss: string
  use_count: number
  created_at: string
  updated_at: string
}

export interface MaterialListParams {
  page?: number
  page_size?: number
  channel?: string
  language?: string
  name?: string
}

export interface PrecheckItem {
  name: string
  channel: string
  language: string
}

export interface PrecheckResult {
  name: string
  channel: string
  language: string
  exists: boolean
  message: string
}

export interface UploadParams {
  name: string
  channel: string
  language: string
  duration_seconds: number
  oss: string
}

export interface BatchDeleteResponse {
  success_ids: number[]
  failed_items: { id: number; reason: string }[]
}

// ==================== 渠道管理 ====================

export interface MaterialChannel {
  id: number
  channel_code: string
  channel_name: string
  sort_order: number
  is_enabled: number
}

export interface CreateChannelParams {
  channel_code: string
  channel_name: string
  sort_order: number
  is_enabled: number
}

export interface UpdateChannelParams {
  channel_name: string
  sort_order: number
  is_enabled: number
}

// ==================== STS 凭证 ====================

export interface StsCredentials {
  AccessKeyId: string
  AccessKeySecret: string
  SecurityToken: string
  Expiration: string
  region: string
  bucket: string
  endpoint: string
}

// ==================== 混剪任务 ====================

export type RemixTaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface RemixTaskItem {
  material_id: number
  material_name: string
  sort_index: number
  duration_seconds: number
}

export interface RemixTask {
  id: number
  head_material_id: number
  channel: string
  language: string
  status: RemixTaskStatus
  result_oss: string | null
  start_trim_seconds?: number
  end_trim_seconds?: number
  highlight_start_seconds?: number | null
  highlight_end_seconds?: number | null
  target_min_minutes: number
  target_max_minutes: number
  items: RemixTaskItem[]
  created_at?: string
  updated_at?: string
}

export interface RemixTaskListParams {
  page?: number
  page_size?: number
  status?: RemixTaskStatus
  channel?: string
  language?: string
}

export interface CreateRemixTaskItem {
  head_material_id: number
  start_trim_seconds?: number
  end_trim_seconds?: number
  highlight_start_seconds?: number | null
  highlight_end_seconds?: number | null
  target_min_minutes: number
  target_max_minutes: number
}

export interface CreateRemixTaskParams {
  items: CreateRemixTaskItem[]
}

export interface CreateRemixTaskResponse {
  task_ids: number[]
}

export interface EditRemixTaskParams {
  start_trim_seconds?: number
  end_trim_seconds?: number
  highlight_start_seconds?: number | null
  highlight_end_seconds?: number | null
  target_min_minutes: number
  target_max_minutes: number
}

// ==================== 素材上传辅助 ====================

export interface PendingFile {
  file: File
  name: string
  channel: string
  language: string
  duration_seconds: number
  status: 'pending' | 'prechecked' | 'exists' | 'uploading' | 'success' | 'error'
  message?: string
}

// ==================== 复用已有通用类型（避免循环依赖） ====================

export type { ApiResponse, PageResponse }
