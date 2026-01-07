"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Slash } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { data } from "@/components/app-sidebar"

interface BreadcrumbItemType {
  title: string
  url: string
  isLast?: boolean
}

export function DynamicBreadcrumb() {
  const pathname = usePathname()

  const breadcrumbs = React.useMemo(() => {
    const cleanPathname = pathname === "/" ? "/" : pathname.replace(/\/$/, "")
    
    // 寻找匹配的最长菜单路径
    let bestMatch: { path: BreadcrumbItemType[], length: number } = { path: [], length: 0 }

    const updateMatch = (path: BreadcrumbItemType[], urlLength: number) => {
      if (urlLength > bestMatch.length) {
        bestMatch = { path, length: urlLength }
      }
    }

    if (data && data.navMain) {
      for (const group of data.navMain) {
        const groupPath = [{ title: group.title, url: group.url || "#" }]
        
        // 检查组本身 (精确匹配或前缀匹配)
        if (group.url && group.url !== "#") {
          if (group.url === cleanPathname) {
            updateMatch(groupPath, group.url.length)
          } else if (cleanPathname.startsWith(group.url + "/")) {
            updateMatch(groupPath, group.url.length)
          }
        }

        // 检查组内项目
        if (group.items) {
          for (const item of group.items) {
            const itemPath = [...groupPath, { title: item.title, url: item.url }]
            
            if (item.url === cleanPathname) {
              updateMatch(itemPath, item.url.length)
            } else if (cleanPathname.startsWith(item.url + "/")) {
              updateMatch(itemPath, item.url.length)
            }
          }
        }
      }
    }

    const matchedMenuPath = bestMatch.path
    const matchedUrlLength = bestMatch.length
    
    // 处理剩余的动态路径部分
    let dynamicItems: BreadcrumbItemType[] = []
    const remainingPath = cleanPathname.slice(matchedUrlLength)
    const segments = remainingPath.split("/").filter(s => s !== "")
    
    let currentUrl = cleanPathname.slice(0, matchedUrlLength)
    
    dynamicItems = segments.map(segment => {
      // 确保路径拼接正确
      const separator = currentUrl.endsWith("/") ? "" : "/"
      currentUrl += `${separator}${segment}`
      return {
        title: formatSegment(segment),
        url: currentUrl
      }
    })

    // 合并结果
    const finalItems = [...matchedMenuPath, ...dynamicItems]
    
    // 标记最后一项
    if (finalItems.length > 0) {
      finalItems[finalItems.length - 1].isLast = true
    }

    return finalItems
  }, [pathname])

  if (pathname === "/") {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        
        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item.url + index}>
            <BreadcrumbItem className="hidden md:block">
              {item.isLast ? (
                <BreadcrumbPage>{item.title}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator className="hidden md:block" />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}