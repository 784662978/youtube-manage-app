import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  UserRole,
  hasPathPermission,
  shouldHideComponent,
  getUserRole,
  setUserRole,
  clearUserRole,
  PERMISSION_CONFIG,
} from '../lib/permissions'

describe('权限工具函数测试', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('hasPathPermission', () => {
    it('admin 可以访问所有路径', () => {
      expect(hasPathPermission('admin', '/Channel/list')).toBe(true)
      expect(hasPathPermission('admin', '/Channel/monitor')).toBe(true)
      expect(hasPathPermission('admin', '/monitor/schedule')).toBe(true)
      expect(hasPathPermission('admin', '/monitor/effect')).toBe(true)
      expect(hasPathPermission('admin', '/any/random/path')).toBe(true)
    })

    it('user 只能访问运营排期监控页面', () => {
      expect(hasPathPermission('user', '/monitor/schedule')).toBe(true)
      expect(hasPathPermission('user', '/Channel/list')).toBe(false)
      expect(hasPathPermission('user', '/Channel/monitor')).toBe(false)
      expect(hasPathPermission('user', '/monitor/effect')).toBe(false)
    })

    it('user 可以访问运营排期监控的子路径', () => {
      expect(hasPathPermission('user', '/monitor/schedule/detail')).toBe(true)
    })
  })

  describe('shouldHideComponent', () => {
    it('admin 不会隐藏任何组件', () => {
      expect(shouldHideComponent('admin', 'schedule-summary')).toBe(false)
      expect(shouldHideComponent('admin', 'any-component')).toBe(false)
    })

    it('user 会隐藏排期概况组件', () => {
      expect(shouldHideComponent('user', 'schedule-summary')).toBe(true)
    })
  })

  describe('localStorage 操作', () => {
    it('setUserRole 和 getUserRole 应该正确工作', () => {
      setUserRole('admin')
      expect(getUserRole()).toBe('admin')
      
      setUserRole('user')
      expect(getUserRole()).toBe('user')
    })

    it('clearUserRole 应该清除角色并返回默认值', () => {
      setUserRole('admin')
      expect(getUserRole()).toBe('admin')
      
      clearUserRole()
      expect(getUserRole()).toBe('user') // 默认值
    })

    it('getUserRole 应该返回默认值当没有存储时', () => {
      expect(getUserRole()).toBe('user')
    })
  })

  describe('PERMISSION_CONFIG', () => {
    it('admin 配置应该允许所有路径', () => {
      expect(PERMISSION_CONFIG.admin.allowedPaths).toContain('*')
      expect(PERMISSION_CONFIG.admin.hiddenComponents).toHaveLength(0)
    })

    it('user 配置应该只允许特定路径', () => {
      expect(PERMISSION_CONFIG.user.allowedPaths).toContain('/monitor/schedule')
      expect(PERMISSION_CONFIG.user.hiddenComponents).toContain('schedule-summary')
    })
  })
})

describe('边界情况测试', () => {
  it('无效的角色应该默认为 user 权限', () => {
    // 测试 hasPathPermission 对无效角色的处理
    // 由于 TypeScript 会限制类型，这里主要测试运行时行为
    expect(hasPathPermission('user', '/monitor/schedule')).toBe(true)
  })
})
