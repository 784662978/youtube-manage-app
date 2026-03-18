// 运营排期监控相关类型

export interface ScheduleItem {
  id: string
  expectedPublishDate: string // 预计发布日期
  actualPublishDate: string | null // 实际发布日期
  contentPrimaryCategory: string // 内容一级分类
  contentSecondaryCategory: string // 内容二级分类
  language: string // 语种
  dramaName: string // 剧名
  copyrightOwner: string // 版权方
  expectedPublishChannel: string // 预计发布频道
  isYPPPassed: boolean // 是否已过YPP
  expectedOperator: string // 预计负责运营人员
  publishStatus: '已发布' | '未发布' // 发布状态
  copyrightStatus: string // 版权状态
  videoId: string // 视频唯一ID
  auditStatus: '未审核' | '已审核' // 审核状态
  auditConclusion: '通过' | '未通过' | null // 审核结论
  auditDate: string | null // 审核日期
  operatorModification: '已修改' | '未修改' | null // 运营再修改结论
}

// 排期概况统计
export interface ScheduleSummary {
  dateRange: {
    start: string
    end: string
  }
  totalVideos: number
  totalChannels: number
  yppPassedChannels: number
  yppNotPassedChannels: number
  totalOperators: number
}

// 内容类型分布
export interface ContentTypeDistribution {
  primaryCategory: string
  secondaryCategory: string
  videoCount: number
  copyrightDetails: string
}

// 发布情况统计
export interface PublishStatusDistribution {
  status: string
  count: number
  remark: string
}

// 禁播状态视频
export interface BannedVideo {
  videoId: string
  dramaName: string
  expectedChannel: string
  expectedOperator: string
}

// 筛选条件
export interface ScheduleFilter {
  expectedPublishDateStart?: string
  expectedPublishDateEnd?: string
  actualPublishDateStart?: string
  actualPublishDateEnd?: string
  contentPrimaryCategory?: string
  contentSecondaryCategory?: string
  language?: string
  isYPPPassed?: string
  publishStatus?: string
  copyrightStatus?: string
  dramaNames?: string[]
  copyrightOwner?: string
  expectedPublishChannel?: string
  expectedOperator?: string
  videoIds?: string[]
  auditStatus?: string
  auditConclusion?: string
  auditDate?: string
  operatorModification?: string
}

// API 筛选参数 (对应后端接口)
export interface ScheduleSearchParams {
  expected_publish_date_start?: string
  expected_publish_date_end?: string
  actual_publish_date_start?: string
  actual_publish_date_end?: string
  review_date?: string
  video_name?: string
  video_id?: string
  content_category_level1?: string
  content_category_level2?: string
  language?: string
  copyright_owner?: string
  expected_publish_channel?: string
  expected_operator?: string
  is_ypp_approved?: string
  publish_status?: string
  copyright_status?: string
  review_status?: string
  review_result?: string
  operation_revision_result?: string
  page?: number
  page_size?: number
}

// API 排期项响应类型
export interface ScheduleItemResponse {
  id: string
  expected_publish_date: string
  actual_publish_date: string | null
  content_category_level1: string
  content_category_level2: string
  language: string
  is_ypp_approved: number // 0 或 1
  publish_status: number // 0 或 1
  copyright_status: number // 0 或 1
  video_name: string
  copyright_owner: string
  expected_publish_channel: string
  expected_operator: string
  video_id: string
  review_status: number // 0, 1, 2
  review_result: number | null // 0, 1
  review_date: string | null
  operation_revision_result: number | null // 0, 1
}

// API 排期列表响应类型
export interface ScheduleListResponse {
  page: number
  pageCount: number
  dataCount: number
  pageSize: number
  data: ScheduleItemResponse[]
}

// 分页信息
export interface Pagination {
  page: number
  pageSize: number
  total?: number
}

// 导入数据请求类型
export interface ImportDataItem {
  id?: string
  expected_publish_date: string
  actual_publish_date: string | null
  content_category_level1: string
  content_category_level2: string
  language: string
  is_ypp_approved: number // 0 或 1
  publish_status: number // 0 或 1
  copyright_status: number // 0 或 1
  video_name: string
  copyright_owner: string
  expected_publish_channel: string
  expected_operator: string
  video_id: string
  review_status: number // 0, 1, 2
  review_result: number | null // 0, 1
  review_date: string | null
  operation_revision_result: number | null // 0, 1
}

export interface ImportRequest {
  datas: ImportDataItem[]
}

// 运营效果监控相关类型

// 告警规则
export interface AlertRule {
  id: string
  name: string
  count: number
  type: 'missing_publish_time' | 'video_id_anomaly' | 'view_count_anomaly'
}

// API 告警响应类型 - 规则1：发布时间填写缺失
export interface WarningRule1Item {
  video_id: string
  video_name: string
  publish_channel: string
  actual_publish_date: string | null
  expected_operator: string
}

// API 告警响应类型 - 规则2.1：网页有/数据库没有
export interface WarningRule21Item {
  video_id: string
  video_name: string
  publish_channel: string
  actual_publish_date: string
  expected_operator: string
}

// API 告警响应类型 - 规则2.2：数据库有/网页没有
export interface WarningRule22Item {
  video_id: string
  publish_url: string
  actual_publish_time: string
}

// API 告警响应类型 - 规则3：播放量异常
export interface WarningRule3Item {
  video_id: string
  video_name: string
  publish_channel: string
  publish_time: string
  expected_operator: string
  view_count: number
  view_date: string
}

// API 告警响应
export interface WarningResponse {
  rule1_datas: WarningRule1Item[]
  rile2_1_datas: WarningRule21Item[]
  rile2_2_datas: WarningRule22Item[]
  rule3_datas: WarningRule3Item[]
}

// 告警项目 - 发布时间缺失 (前端使用)
export interface MissingPublishTimeAlert {
  videoId: string
  videoName: string
  publishChannel: string
  actualPublishDate: string | null
  operator: string
}

// API Response Types
export interface ScheduleSummaryReportResponse {
  contentTypeDistributions: {
    contentCategoryLevel1: string
    contentCategoryLevel2: string
    videoCount: number
    copyrightDetail: string
  }[]
  publishStatusSummaries: {
    status: string
    count: number
    remark: string
  }[]
  prohibitedVideos: {
    videoId: string
    videoName: string
    plannedChannel: string
    plannedOperator: string
  }[]
}

// 告警项目 - 视频ID异常 - 网页有/数据库没有 (前端使用)
export interface VideoIdAnomalyWebAlert {
  videoId: string
  videoName: string
  publishChannel: string
  actualPublishDate: string
  operator: string
}

// 告警项目 - 视频ID异常 - 数据库有/网页没有 (前端使用)
export interface VideoIdAnomalyDbAlert {
  videoId: string
  publishUrl: string
  actualPublishTime: string
}

// 告警项目 - 播放量异常 (前端使用)
export interface ViewCountAnomalyAlert {
  videoId: string
  videoName: string
  publishChannel: string
  publishTime: string
  operator: string
  viewCount: number
  viewDate: string
}

// 下拉选项类型
export interface SelectOption {
  value: string
  label: string
}

// 字典接口响应类型
export interface DictionariesResponse {
  expected_operator: string[]
  content_category_level1: string[]
  content_category_level2: string[]
  language: string[]
  copyright_owner: string[]
  expected_publish_channel: string[]
}

// 排期概况统计响应类型
export interface ScheduleOverviewResponse {
  total_videos: number
  total_channels: number
  ypp_approved_channels: number
  ypp_not_approved_channels: number
  operators_count: number
}

// 管理员编辑请求参数
export interface AdminEditRequest {
  id: string
  expected_publish_date: string
  actual_publish_date: string | null
  content_category_level1: string
  content_category_level2: string
  language: string
  is_ypp_approved: number
  publish_status: number
  copyright_status: number
  video_name: string
  copyright_owner: string
  expected_publish_channel: string
  expected_operator: string
  video_id: string
  review_status: number
  review_result: number | null
  review_date: string | null
  operation_revision_result: number | null
}

// 普通用户编辑请求参数
export interface UserEditRequest {
  id: string
  publish_status: number
  actual_publish_date: string | null
  copyright_status: number
  video_id: string
  review_status: number
  review_result: number | null
  review_date: string | null
  operation_revision_result: number | null
}
