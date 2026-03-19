import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ScheduleFilter, SelectOption } from '@/lib/types/monitor'

interface ScheduleFilterProps {
  filter: ScheduleFilter
  onFilterChange: (filter: ScheduleFilter) => void
  onSearch: () => void
  // 下拉选项
  contentPrimaryOptions: SelectOption[]
  contentSecondaryOptions: SelectOption[]
  languageOptions: SelectOption[]
  yppOptions: SelectOption[]
  publishStatusOptions: SelectOption[]
  copyrightStatusOptions: SelectOption[]
  copyrightOwnerOptions: SelectOption[]
  channelOptions: SelectOption[]
  operatorOptions: SelectOption[]
  auditStatusOptions: SelectOption[]
  auditConclusionOptions: SelectOption[]
  modificationOptions: SelectOption[]
}

export function ScheduleFilterBar({
  filter,
  onFilterChange,
  onSearch,
  contentPrimaryOptions,
  contentSecondaryOptions,
  languageOptions,
  yppOptions,
  publishStatusOptions,
  copyrightStatusOptions,
  copyrightOwnerOptions,
  channelOptions,
  operatorOptions,
  auditStatusOptions,
  auditConclusionOptions,
  modificationOptions,
}: ScheduleFilterProps) {
  const handleDateChange = (
    field: keyof ScheduleFilter,
    value: string
  ) => {
    onFilterChange({ ...filter, [field]: value })
  }

  const handleSelectChange = (
    field: keyof ScheduleFilter,
    value: string
  ) => {
    onFilterChange({ ...filter, [field]: value === '全部' ? undefined : value })
  }

  const handleTextInputChange = (
    field: keyof ScheduleFilter,
    value: string
  ) => {
    // 支持逗号分隔
    const values = value.split(',').map((v) => v.trim()).filter(Boolean)
    onFilterChange({ ...filter, [field]: values.length > 0 ? values : undefined })
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">筛选条件</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 第一行：日期筛选 */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">预计发布日期</span>
            <Input
              type="date"
              className="w-36 cursor-pointer"
              value={filter.expectedPublishDateStart || ''}
              onChange={(e) => handleDateChange('expectedPublishDateStart', e.target.value)}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              className="w-36 cursor-pointer"
              value={filter.expectedPublishDateEnd || ''}
              onChange={(e) => handleDateChange('expectedPublishDateEnd', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">实际发布日期</span>
            <Input
              type="date"
              className="w-36 cursor-pointer"
              value={filter.actualPublishDateStart || ''}
              onChange={(e) => handleDateChange('actualPublishDateStart', e.target.value)}
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="date"
              className="w-36 cursor-pointer"
              value={filter.actualPublishDateEnd || ''}
              onChange={(e) => handleDateChange('actualPublishDateEnd', e.target.value)}
            />
          </div>
        </div>

        {/* 第二行：下拉筛选 */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">内容一级分类</span>
            <Select
              value={filter.contentPrimaryCategory || '全部'}
              onValueChange={(v) => handleSelectChange('contentPrimaryCategory', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {contentPrimaryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">内容二级分类</span>
            <Select
              value={filter.contentSecondaryCategory || '全部'}
              onValueChange={(v) => handleSelectChange('contentSecondaryCategory', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {contentSecondaryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">语种</span>
            <Select
              value={filter.language || '全部'}
              onValueChange={(v) => handleSelectChange('language', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {languageOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">是否已过YPP</span>
            <Select
              value={filter.isYPPPassed || '全部'}
              onValueChange={(v) => handleSelectChange('isYPPPassed', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {yppOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">发布状态</span>
            <Select
              value={filter.publishStatus || '全部'}
              onValueChange={(v) => handleSelectChange('publishStatus', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {publishStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">版权状态</span>
            <Select
              value={filter.copyrightStatus || '全部'}
              onValueChange={(v) => handleSelectChange('copyrightStatus', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {copyrightStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 第三行：文本和更多下拉 */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">剧名称</span>
            <Input
              type="text"
              placeholder="输入剧名称"
              className="w-40"
              defaultValue={filter.dramaNames?.join(', ') || ''}
              onBlur={(e) => handleTextInputChange('dramaNames', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">版权方</span>
            <Select
              value={filter.copyrightOwner || '全部'}
              onValueChange={(v) => handleSelectChange('copyrightOwner', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {copyrightOwnerOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">预计发布频道</span>
            <Select
              value={filter.expectedPublishChannel || '全部'}
              onValueChange={(v) => handleSelectChange('expectedPublishChannel', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {channelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">预计负责运营人员</span>
            <Select
              value={filter.expectedOperator || '全部'}
              onValueChange={(v) => handleSelectChange('expectedOperator', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {operatorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">视频唯一ID</span>
            <Input
              type="text"
              placeholder="输入视频ID"
              className="w-40"
              defaultValue={filter.videoIds?.join(', ') || ''}
              onBlur={(e) => handleTextInputChange('videoIds', e.target.value)}
            />
          </div>
        </div>

        {/* 第四行：审核相关 */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">审核状态</span>
            <Select
              value={filter.auditStatus || '全部'}
              onValueChange={(v) => handleSelectChange('auditStatus', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {auditStatusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">审核结论</span>
            <Select
              value={filter.auditConclusion || '全部'}
              onValueChange={(v) => handleSelectChange('auditConclusion', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {auditConclusionOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">审核日期</span>
            <Input
              type="date"
              className="w-36 cursor-pointer"
              value={filter.auditDate || ''}
              onChange={(e) => handleDateChange('auditDate', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">运营再修改结论</span>
            <Select
              value={filter.operatorModification || '全部'}
              onValueChange={(v) => handleSelectChange('operatorModification', v)}
            >
              <SelectTrigger className="w-28">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="全部">全部</SelectItem>
                  {modificationOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">排序字段</span>
            <Select
              value={filter.sortField || 'expected_publish_date'}
              onValueChange={(v) => onFilterChange({ ...filter, sortField: v as 'expected_publish_date' | 'view_count' })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="expected_publish_date">预计发布日期</SelectItem>
                  <SelectItem value="view_count">播放量</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">排序方式</span>
            <Select
              value={filter.sortOrder || 'desc'}
              onValueChange={(v) => onFilterChange({ ...filter, sortOrder: v as 'asc' | 'desc' })}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="asc">升序</SelectItem>
                  <SelectItem value="desc">降序</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 搜索按钮 */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onSearch}>搜索</Button>
        </div>
      </CardContent>
    </Card>
  )
}
