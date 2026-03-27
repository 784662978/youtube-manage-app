// 语言配置模块类型定义

// API 通用响应
export interface ApiResponse<T> {
  status: number
  success: boolean
  msg: string
  response: T
}

// 通用语言项（基础字段）
export interface LanguageItem {
  id: number
  sort_order: number
}

// Reelshort 语言项
export interface ReelshortLanguageItem extends LanguageItem {
  code: string
  display_name: string
}

// 七星语言项
export interface QixingLanguageItem extends LanguageItem {
  code: number
  display_name: string
}

// Dramabox 语言项
export interface DramaboxLanguageItem extends LanguageItem {
  zh_name: string
  display_name: string
}

// 表格列配置
export interface LanguageColumnConfig {
  key: string
  label: string
}

// 表单字段配置
export interface LanguageFormFieldConfig {
  key: string
  label: string
  placeholder?: string
  type: 'string' | 'number'
  required: boolean
}

// 语言模块配置
export interface LanguageModuleConfig<T extends LanguageItem> {
  title: string
  apiPath: string // e.g. "taskLanguages/reelshort"
  columns: LanguageColumnConfig[]
  formFields: LanguageFormFieldConfig[]
  getDisplayValue: (item: T, key: string) => string | number
  getDefaultFormData: () => Record<string, string | number>
  transformFormData: (data: Record<string, string | number>) => Record<string, unknown>
  deleteConfirmText: (item: T) => string
}
