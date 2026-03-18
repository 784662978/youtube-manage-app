"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { 
  UserRole, 
  getUserRole, 
  setUserRole as persistUserRole, 
  clearUserRole as clearPersistedRole,
  hasPathPermission,
  shouldHideComponent,
} from "@/lib/permissions"
import { GlobalLoader } from "@/components/ui/global-loader"

interface PermissionContextType {
  role: UserRole
  isLoading: boolean
  setRole: (role: UserRole) => void
  clearRole: () => void
  hasPermission: (path: string) => boolean
  isComponentHidden: (componentId: string) => boolean
  isAdmin: boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ children }: { children: ReactNode }) {
  // 使用惰性初始化从 localStorage 读取角色
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window === 'undefined') return 'user'
    const storedRole = getUserRole()
    console.log('[PermissionProvider] 初始化角色:', storedRole)
    return storedRole
  })
  const [isLoading] = useState(false) // 惰性初始化已同步完成，无需 loading
  const pathname = usePathname()
  const router = useRouter()

  // 路由守卫：检查当前页面访问权限
  useEffect(() => {
    if (isLoading) return

    // 跳过公开路径
    if (pathname === "/login") return

    // 检查是否有权限访问当前路径
    if (!hasPathPermission(role, pathname)) {
      // 如果是 user 角色，重定向到运营排期监控页面
      if (role === "user") {
        router.replace("/monitor/schedule")
      } else {
        // 其他情况重定向到首页
        router.replace("/Channel/list")
      }
    }
  }, [pathname, role, isLoading, router])

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState(newRole)
    persistUserRole(newRole)
  }, [])

  const clearRole = useCallback(() => {
    setRoleState("user")
    clearPersistedRole()
  }, [])

  const hasPermission = useCallback((path: string) => {
    return hasPathPermission(role, path)
  }, [role])

  const isComponentHidden = useCallback((componentId: string) => {
    return shouldHideComponent(role, componentId)
  }, [role])

  const value: PermissionContextType = {
    role,
    isLoading,
    setRole,
    clearRole,
    hasPermission,
    isComponentHidden,
    isAdmin: role === "admin",
  }

  // 加载中显示 loading
  if (isLoading) {
    return <GlobalLoader />
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermission() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermission must be used within a PermissionProvider")
  }
  return context
}

// 高阶组件：用于保护页面
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  _requiredPaths: string[] // eslint-disable-line @typescript-eslint/no-unused-vars
) {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission, isLoading } = usePermission()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
      if (!isLoading && !hasPermission(pathname)) {
        router.replace("/monitor/schedule")
      }
    }, [isLoading, hasPermission, pathname, router])

    if (isLoading) {
      return <GlobalLoader />
    }

    if (!hasPermission(pathname)) {
      return null
    }

    return <Component {...props} />
  }
}
