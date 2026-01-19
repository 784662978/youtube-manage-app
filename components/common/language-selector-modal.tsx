import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader } from "lucide-react"

export interface Language {
  code: string
  name: string
}

export interface LanguageSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  
  // Data
  languages: Language[]
  selectedLanguages: string[]
  
  // Form Data
  videoId: string | number | null
  onVideoIdChange?: (id: string) => void
  title: string
  description: string
  
  // Handlers
  onSelectedLanguagesChange: (languages: string[]) => void
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onSubmit: (e: React.FormEvent) => void
  
  // Status
  isSubmitting: boolean
}

export function LanguageSelectorModal({
  open,
  onOpenChange,
  languages,
  selectedLanguages,
  videoId,
  onVideoIdChange,
  title,
  description,
  onSelectedLanguagesChange,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  isSubmitting
}: LanguageSelectorModalProps) {

  const toggleLanguage = (langCode: string) => {
    const newSelection = selectedLanguages.includes(langCode)
      ? selectedLanguages.filter(c => c !== langCode)
      : [...selectedLanguages, langCode]
    onSelectedLanguagesChange(newSelection)
  }

  const toggleAllLanguages = (checked: boolean) => {
    if (checked) {
      onSelectedLanguagesChange(languages.map(l => l.code))
    } else {
      onSelectedLanguagesChange([])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加视频语言</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video-id">视频ID <span className="text-red-500">*</span></Label>
            <Input
              id="video-id"
              value={videoId ?? ''}
              onChange={(e) => onVideoIdChange?.(e.target.value)}
              disabled={!onVideoIdChange}
              className={!onVideoIdChange ? "bg-muted" : ""}
            />
            <p className="text-xs text-muted-foreground">当前选中的视频 ID</p>
          </div>
          <div className="space-y-2">
            <Label>选择语言 <span className="text-red-500">*</span></Label>
            <div className="flex items-center space-x-2 mb-2">
              <Checkbox
                id="select-all"
                checked={languages.length > 0 && selectedLanguages.length === languages.length}
                onCheckedChange={(checked) => toggleAllLanguages(!!checked)}
              />
              <Label htmlFor="select-all" className="cursor-pointer">全选 / 取消全选</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border p-4 rounded-md max-h-[200px] overflow-y-auto">
              {languages.map((lang) => (
                <div key={lang.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${lang.code}`}
                    checked={selectedLanguages.includes(lang.code)}
                    onCheckedChange={() => toggleLanguage(lang.code)}
                  />
                  <Label htmlFor={`lang-${lang.code}`} className="cursor-pointer text-sm">
                    {lang.name} ({lang.code})
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lang-title">标题 <span className="text-red-500">*</span></Label>
            <Input
              id="lang-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="输入视频标题"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lang-desc">详情描述 <span className="text-red-500">*</span></Label>
            <Textarea
              id="lang-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="输入详情描述（可选）"
              className="h-24"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              提交
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
