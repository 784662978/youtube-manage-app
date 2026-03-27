"use client"

import { LanguageListPage } from "@/components/language/language-list"
import type {
  DramaboxLanguageItem,
  LanguageModuleConfig,
} from "@/lib/types/language"

const dramaboxConfig: LanguageModuleConfig<DramaboxLanguageItem> = {
  title: "Dramabox 语言列表",
  apiPath: "taskLanguages/dramabox",
  columns: [
    { key: "id", label: "ID" },
    { key: "zh_name", label: "中文名称" },
    { key: "display_name", label: "显示名称" },
  ],
  formFields: [
    {
      key: "zh_name",
      label: "中文名称",
      placeholder: "请输入中文名称",
      type: "string",
      required: true,
    },
    {
      key: "sort_order",
      label: "排序",
      placeholder: "请输入排序值",
      type: "number",
      required: true,
    },
  ],
  getDisplayValue: (item, key) => {
    const value = (item as unknown as Record<string, unknown>)[key]
    return (typeof value === "string" || typeof value === "number" ? value : "") as string | number
  },
  getDefaultFormData: () => ({
    zh_name: "",
    sort_order: 0,
  }),
  transformFormData: (data) => ({
    zh_name: String(data.zh_name),
    sort_order: Number(data.sort_order),
  }),
  deleteConfirmText: (item) =>
    `确定要删除语言 "${item.zh_name}" 吗？此操作不可撤销。`,
}

export default function DramaboxLanguagePage() {
  return <LanguageListPage config={dramaboxConfig} />
}
