"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { List, SquareActivity, Monitor, BarChart3, Languages } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { usePermission } from '@/components/permission-provider'
import type { UserRole } from '@/lib/permissions'

// 菜单项类型
interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: boolean
  allowedRoles?: UserRole[] // 允许访问的角色，默认只有 admin
}

interface NavGroup {
  title: string
  url: string
  items: NavItem[]
  allowedRoles?: UserRole[] // 整个分组的权限，如果设置则优先于 items 的权限
}

// 完整的菜单数据（包含权限配置）
const allNavData: NavGroup[] = [
  {
    title: "频道",
    url: "/",
    items: [
      {
        title: "频道列表",
        url: "/Channel/list",
        icon: List,
        isActive: true,
      },
      {
        title: "监控频道",
        url: "/Channel/monitor",
        icon: SquareActivity,
        isActive: false,
      }
    ],
  },
  {
    title: "运营监控",
    url: "/monitor",
    items: [
      {
        title: "运营排期监控",
        url: "/monitor/schedule",
        icon: Monitor,
        isActive: false,
        allowedRoles: ['admin', 'user'],
      },
      {
        title: "运营效果监控",
        url: "/monitor/effect",
        icon: BarChart3,
        isActive: false,
        allowedRoles: ['admin', 'user'],
      }
    ],
  },
  {
    title: "语言配置",
    url: "/language",
    items: [
      {
        title: "Reelshort 语言",
        url: "/language/reelshort",
        icon: Languages,
        isActive: false,
      },
      {
        title: "七星语言",
        url: "/language/qixing",
        icon: Languages,
        isActive: false,
      },
      {
        title: "Dramabox 语言",
        url: "/language/dramabox",
        icon: Languages,
        isActive: false,
      },
    ],
  },
]

// 导出 data 以供其他组件（如面包屑）使用
export const data = { navMain: allNavData }

// 根据角色过滤菜单
function filterNavByRole(navData: NavGroup[], role: UserRole): NavGroup[] {
  return navData
    .map(group => {
      // 过滤分组中的项目
      const filteredItems = group.items.filter(item => {
        const allowedRoles = item.allowedRoles || ['admin']
        return allowedRoles.includes(role)
      })
      
      return {
        ...group,
        items: filteredItems,
      }
    })
    .filter(group => group.items.length > 0) // 移除空分组
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { role, isLoading } = usePermission()

  // 根据角色过滤菜单
  const filteredNav = React.useMemo(() => {
    if (isLoading) return []
    return filterNavByRole(allNavData, role)
  }, [role, isLoading])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarGroupLabel>
          <div className="flex items-center">
            <span>Youtube 管理系统</span>
          </div>
        </SidebarGroupLabel>
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {filteredNav.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => {
                  const isActive = pathname === subItem.url || pathname.startsWith(subItem.url + "/")
                  return (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={subItem.url}>
                          {subItem.icon && <subItem.icon className="mr-2" />}
                          {subItem.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
