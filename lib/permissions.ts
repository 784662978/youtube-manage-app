// 权限相关类型定义

export type UserRole = 'admin' | 'user'

export interface User {
  id: number
  role: UserRole
}

// 权限配置类型
interface PermissionConfig {
  allowedPaths: string[] // 允许访问的路径列表，支持 '*' 通配符
  hiddenComponents: string[] // 需要隐藏的组件ID列表
}

// 权限配置
export const PERMISSION_CONFIG: Record<UserRole, PermissionConfig> = {
  // admin 可访问所有页面
  admin: {
    allowedPaths: ['*'], // 通配符表示所有页面
    hiddenComponents: [], // 无需隐藏的组件
  },
  // user 只能访问运营排期监控页面
  user: {
    allowedPaths: [
      '/monitor/schedule/',  // 添加尾部斜杠！
      '/monitor/schedule', // 运营排期监控
      '/monitor/effect/',
      '/monitor/effect',
    ],
    hiddenComponents: [
      'schedule-summary', // 排期概况区域
    ],
  },
}

// 路由权限映射
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/Channel/list/': ['admin'],        // 添加尾部斜杠
  '/Channel/list': ['admin'],         // 同时支持
  '/Channel/monitor/': ['admin'],
  '/Channel/monitor': ['admin'],
  '/monitor/schedule/': ['admin', 'user'],
  '/monitor/schedule': ['admin', 'user'],
  '/monitor/effect/': ['admin', 'user'],
  '/monitor/effect': ['admin', 'user'],
  '/language/reelshort/': ['admin'],
  '/language/reelshort': ['admin'],
  '/language/qixing/': ['admin'],
  '/language/qixing': ['admin'],
  '/language/dramabox/': ['admin'],
  '/language/dramabox': ['admin'],
  '/drama/reelshort/': ['admin'],
  '/drama/reelshort': ['admin'],
  '/drama/qixing/': ['admin'],
  '/drama/qixing': ['admin'],
  '/drama/dramabox/': ['admin'],
  '/drama/dramabox': ['admin'],
  '/material/library/': ['admin'],
  '/material/library': ['admin'],
  '/material/channel/': ['admin'],
  '/material/channel': ['admin'],
  '/remix/task/': ['admin'],
  '/remix/task': ['admin'],
}

// 检查用户是否有权限访问某个路径
export function hasPathPermission(role: UserRole, path: string): boolean {
  const config = PERMISSION_CONFIG[role]
  
  // admin 可以访问所有页面
  if (config.allowedPaths.includes('*')) {
    return true
  }
  
  // 检查路径是否在允许列表中
  return config.allowedPaths.some(allowedPath => {
    // 支持前缀匹配
    return path === allowedPath || path.startsWith(allowedPath + '/')
  })
}

// 检查组件是否应该被隐藏
export function shouldHideComponent(role: UserRole, componentId: string): boolean {
  const config = PERMISSION_CONFIG[role]
  return config.hiddenComponents.includes(componentId)
}

// 从 localStorage 获取用户角色
export function getUserRole(): UserRole {
  if (typeof window === 'undefined') return 'user'
  
  const role = localStorage.getItem('user_role')
  if (role === 'admin' || role === 'user') {
    return role
  }
  return 'user' // 默认为 user
}

// 设置用户角色到 localStorage
export function setUserRole(role: UserRole): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('user_role', role)
}

// 清除用户角色
export function clearUserRole(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('user_role')
}
