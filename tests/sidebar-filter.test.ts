import { describe, it, expect } from 'vitest'

// 复制侧边栏的过滤逻辑用于测试
interface NavItem {
  title: string
  url: string
  allowedRoles?: ('admin' | 'user')[]
}

interface NavGroup {
  title: string
  url: string
  items: NavItem[]
}

const allNavData: NavGroup[] = [
  {
    title: "频道",
    url: "/",
    items: [
      {
        title: "频道列表",
        url: "/Channel/list",
      },
      {
        title: "监控频道",
        url: "/Channel/monitor",
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
        allowedRoles: ['admin', 'user'],
      },
      {
        title: "运营效果监控",
        url: "/monitor/effect",
      }
    ],
  },
]

// 根据角色过滤菜单
function filterNavByRole(navData: NavGroup[], role: 'admin' | 'user'): NavGroup[] {
  return navData
    .map(group => {
      const filteredItems = group.items.filter(item => {
        const allowedRoles = item.allowedRoles || ['admin']
        return allowedRoles.includes(role)
      })
      
      return {
        ...group,
        items: filteredItems,
      }
    })
    .filter(group => group.items.length > 0)
}

describe('侧边栏菜单过滤逻辑测试', () => {
  describe('admin 角色', () => {
    it('应该显示所有菜单项', () => {
      const filtered = filterNavByRole(allNavData, 'admin')
      
      // 应该有两个分组
      expect(filtered).toHaveLength(2)
      
      // 频道分组应该有两个项目
      const channelGroup = filtered.find(g => g.title === '频道')
      expect(channelGroup?.items).toHaveLength(2)
      
      // 运营监控分组应该有两个项目
      const monitorGroup = filtered.find(g => g.title === '运营监控')
      expect(monitorGroup?.items).toHaveLength(2)
    })
  })

  describe('user 角色', () => {
    it('只应该显示运营排期监控菜单', () => {
      const filtered = filterNavByRole(allNavData, 'user')
      
      // 应该只有一个分组
      expect(filtered).toHaveLength(1)
      
      // 只应该有运营监控分组
      expect(filtered[0].title).toBe('运营监控')
      
      // 该分组只应该有一个项目
      expect(filtered[0].items).toHaveLength(1)
      expect(filtered[0].items[0].title).toBe('运营排期监控')
    })

    it('不应该显示频道分组', () => {
      const filtered = filterNavByRole(allNavData, 'user')
      
      const channelGroup = filtered.find(g => g.title === '频道')
      expect(channelGroup).toBeUndefined()
    })

    it('不应该显示运营效果监控', () => {
      const filtered = filterNavByRole(allNavData, 'user')
      
      const monitorGroup = filtered.find(g => g.title === '运营监控')
      const effectItem = monitorGroup?.items.find(i => i.title === '运营效果监控')
      expect(effectItem).toBeUndefined()
    })
  })
})

describe('空菜单处理', () => {
  it('当所有项目都被过滤时应该返回空数组', () => {
    const emptyNavData: NavGroup[] = [
      {
        title: "测试分组",
        url: "/test",
        items: [
          {
            title: "测试项目",
            url: "/test/item",
            allowedRoles: ['admin'],
          }
        ],
      }
    ]
    
    const filtered = filterNavByRole(emptyNavData, 'user')
    expect(filtered).toHaveLength(0)
  })
})
