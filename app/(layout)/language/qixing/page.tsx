"use client"

import { LanguageListPage } from "@/components/language/language-list"
import type {
  QixingLanguageItem,
  LanguageModuleConfig,
} from "@/lib/types/language"

const qixingConfig: LanguageModuleConfig<QixingLanguageItem> = {
  title: "七星语言列表",
  apiPath: "taskLanguages/qixing",
  columns: [
    { key: "id", label: "ID" },
    { key: "code", label: "语言代码" },
    { key: "display_name", label: "显示名称" },
  ],
  formFields: [
    {
      key: "code",
      label: "语言代码",
      placeholder: "请输入语言代码（整数）",
      type: "number",
      required: true,
    },
    {
      key: "display_name",
      label: "显示名称",
      placeholder: "请输入显示名称（选填）",
      type: "string",
      required: false,
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
    code: 0,
    display_name: "",
    sort_order: 0,
  }),
  transformFormData: (data) => ({
    code: Number(data.code),
    display_name: String(data.display_name),
    sort_order: Number(data.sort_order),
  }),
  deleteConfirmText: (item) =>
    `确定要删除语言代码 "${item.code}" 吗？此操作不可撤销。`,
}

export default function QixingLanguagePage() {
  return <LanguageListPage config={qixingConfig} />
}
