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
  auditStatus: '未审核' | '已审核' | '待审核' // 审核状态
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

// 运营效果监控相关类型

// 告警规则
export interface AlertRule {
  id: string
  name: string
  count: number
  type: 'missing_publish_time' | 'video_id_anomaly' | 'view_count_anomaly'
}

// 告警项目 - 发布时间缺失
export interface MissingPublishTimeAlert {
  videoId: string
  dramaName: string
  publishChannel: string
  actualPublishDate: string | null
  operator: string
}

// 告警项目 - 视频ID异常
export interface VideoIdAnomalyAlert {
  type: 'web_has_db_not' | 'db_has_web_not' // 网页有/数据库没有 或 数据库有/网页没有
  videoId: string
  dramaName?: string
  publishChannel?: string
  actualPublishDate?: string | null
  operator?: string
  channelLink?: string
  actualPublishTime?: string
}

// 告警项目 - 播放量异常
export interface ViewCountAnomalyAlert {
  videoId: string
  dramaName: string
  publishChannel: string
  actualPublishTime: string
  actualPublishDate: string
  operator: string
  viewCount: number
  viewDate: string
}

// 下拉选项类型
export interface SelectOption {
  value: string
  label: string
}
