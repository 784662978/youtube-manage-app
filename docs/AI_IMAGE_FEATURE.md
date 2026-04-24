# AI 生图功能开发文档

## 1. 功能概述

### 1.1 功能定位
为 Youtube 管理系统新增 AI 生图模块，集成豆包 Seedream 系列图像生成模型，提供聊天式交互生图体验。

### 1.2 支持模型

| 模型 | 模型 ID | 特点 | 分辨率支持 |
|------|---------|------|-----------|
| Seedream 5.0 Lite | `doubao-seedream-5-0-lite` | 最新轻量旗舰，支持联网搜索增强、深度推理、3K分辨率 | 最高 3024×3024 |
| Seedream 4.5 | `doubao-seedream-4-5` | 高品质图像生成，融合常识与推理能力 | 最高 2048×2048 |
| Seedream 4.0 | `doubao-seedream-4-0` | 基础文生图模型，稳定可靠 | 1024×1024 |

### 1.3 核心功能
- 聊天式交互生图：输入文字描述，AI 生成对应图片
- 多模型切换：支持在三种 Seedream 模型间自由切换
- 会话管理：支持创建多个会话，每个会话独立维护消息记录
- 聊天记录本地持久化：使用 IndexedDB 存储，刷新页面不丢失
- 图片预览与下载：生成图片支持全屏预览和本地下载
- 生成历史：每条消息记录生成参数，方便回溯

## 2. 技术方案

### 2.1 架构约束
- 项目为纯静态导出（`output: 'export'`），无 Server Actions 和 API Routes
- Seedream API 通过浏览器直接调用火山方舟接口
- API Key 存储在 localStorage，用户需在界面配置
- 图片数据使用 IndexedDB 存储（localStorage 有 5MB 限制）

### 2.2 API 接入方案
调用火山方舟 OpenAI 兼容格式接口：

```
POST https://ark.cn-beijing.volces.com/api/v3/images/generations
Authorization: Bearer <API_KEY>
Content-Type: application/json

{
  "model": "<endpoint_id>",
  "prompt": "文字描述",
  "size": "1024x1024",
  "seed": -1,
  "n": 1,
  "response_format": "b64_json"
}
```

响应格式：
```json
{
  "data": [
    {
      "b64_json": "base64编码的图片数据"
    }
  ]
}
```

### 2.3 本地持久化方案
使用 IndexedDB 存储以下数据：
- **会话列表**：会话 ID、标题、创建时间、更新时间
- **消息记录**：消息 ID、角色（user/assistant）、内容、图片数据、生成参数、时间戳
- **图片数据**：Base64 编码的生成图片

IndexedDB 配置：
- 数据库名：`ai-image-db`
- 版本：1
- Object Stores：`conversations`、`messages`

## 3. 页面与路由

### 3.1 新增路由
- 路径：`/ai-image/`
- 页面文件：`app/(layout)/ai-image/page.tsx`
- 面包屑：AI 生图

### 3.2 侧边栏菜单
在侧边栏新增「AI 生图」分组，包含一个菜单项：
```typescript
{
  title: "AI 生图",
  url: "/ai-image",
  items: [
    { title: "图片生成", url: "/ai-image/generate", icon: ImageIcon, allowedRoles: ['admin', 'user'] }
  ]
}
```

### 3.3 权限配置
- admin 和 user 均可访问
- 在 `lib/permissions.ts` 的 user allowedPaths 中添加 `/ai-image` 相关路径

## 4. UI 组件设计

### 4.1 页面布局
```
┌─────────────────────────────────────────────────────┐
│  左侧面板 (280px)        │  右侧聊天区域              │
│  ┌───────────────────┐   │  ┌─────────────────────┐  │
│  │ [+ 新建会话]       │   │  │  消息列表区域        │  │
│  ├───────────────────┤   │  │  (可滚动)            │  │
│  │  会话1             │   │  │                     │  │
│  │  会话2             │   │  │  用户消息            │  │
│  │  会话3 (当前)      │   │  │  AI 回复 + 图片      │  │
│  │  ...              │   │  │                     │  │
│  │                   │   │  ├─────────────────────┤  │
│  │                   │   │  │ [模型选择] [发送按钮] │  │
│  │                   │   │  │ [输入框.............]│  │
│  └───────────────────┘   │  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 4.2 组件清单

| 组件 | 文件路径 | 说明 |
|------|---------|------|
| AiImagePage | `components/ai-image/ai-image-page.tsx` | 主页面容器 |
| ConversationList | `components/ai-image/conversation-list.tsx` | 会话列表面板 |
| ChatMessage | `components/ai-image/chat-message.tsx` | 单条聊天消息 |
| ModelSelector | `components/ai-image/model-selector.tsx` | 模型选择下拉框 |
| PromptInput | `components/ai-image/prompt-input.tsx` | Prompt 输入区域 |
| ImagePreview | `components/ai-image/image-preview.tsx` | 图片预览弹窗 |
| AiImageProvider | `components/ai-image/ai-image-provider.tsx` | Context 状态管理 |

## 5. 数据流与状态管理

### 5.1 状态管理架构
使用 React Context + useReducer 管理全局状态：

```
AiImageProvider (Context)
  ├── state
  │   ├── conversations: Conversation[]      // 会话列表
  │   ├── currentConversationId: string      // 当前会话 ID
  │   ├── messages: Message[]                // 当前会话消息
  │   ├── selectedModel: SeedreamModel       // 当前选中模型
  │   ├── isLoading: boolean                 // 生成中状态
  │   └── apiConfig: ApiConfig               // API 配置
  ├── actions
  │   ├── createConversation()               // 新建会话
  │   ├── deleteConversation(id)             // 删除会话
  │   ├── selectConversation(id)             // 切换会话
  │   ├── sendMessage(prompt)                // 发送消息
  │   ├── setModel(model)                    // 切换模型
  │   └── updateApiConfig(config)            // 更新 API 配置
  └── persistence
      ├── loadConversations()                // 从 IndexedDB 加载
      ├── saveConversation()                 // 保存到 IndexedDB
      └── saveMessage()                      // 保存消息到 IndexedDB
```

### 5.2 数据流
1. 用户输入 Prompt → dispatch(sendMessage)
2. 添加 user 消息到 state + IndexedDB
3. 调用 Seedream API（设置 isLoading = true）
4. API 返回 → 解析图片数据 → 添加 assistant 消息
5. 保存 assistant 消息到 IndexedDB（含图片 Base64）
6. 设置 isLoading = false

## 6. 文件清单

```
新增文件：
├── lib/types/ai-image.ts                           # 类型定义
├── lib/ai-image-db.ts                              # IndexedDB 持久化
├── lib/seedream-api.ts                             # Seedream API 客户端
├── components/ai-image/
│   ├── ai-image-provider.tsx                       # Context + Hook
│   ├── ai-image-page.tsx                           # 主页面
│   ├── chat-message.tsx                            # 聊天消息
│   ├── model-selector.tsx                          # 模型选择器
│   ├── prompt-input.tsx                            # 输入区域
│   ├── image-preview.tsx                           # 图片预览
│   └── conversation-list.tsx                       # 会话列表
├── app/(layout)/ai-image/page.tsx                  # 页面路由

修改文件：
├── components/app-sidebar.tsx                       # 添加侧边栏菜单
├── lib/permissions.ts                               # 添加权限路径
├── lib/types/index.ts                               # 导出 AI 生图类型
```
