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
    // 关键修改：跳过登录页面
    if (pathname === "/login" || pathname === "/login/") return

    // 检查 token 是否存在
    const token = localStorage.getItem("jwt_token")
    if (!token) {
      // 没有 token，不进行权限检查，让 AuthProvider 处理
      console.log('[PermissionProvider] 没有 token，跳过权限检查')
      return
    }

    // 检查是否有权限访问当前路径
    const hasPermission = hasPathPermission(role, pathname)
    console.log('[PermissionProvider] 权限检查:', { 
      role, 
      pathname, 
      hasPermission 
    })

    if (!hasPermission) {
      // 如果是 user 角色，重定向到运营排期监控页面
      if (role === "user") {
        console.log('[PermissionProvider] 重定向到 /monitor/schedule/')
        router.replace("/monitor/schedule/")
      } else {
        // 其他情况重定向到频道列表
        console.log('[PermissionProvider] 重定向到 /Channel/list/')
        router.replace("/Channel/list/")
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
