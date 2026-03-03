# YouTube Manage App - 编码规范与开发标准 (Rules)

## 1. 编码规范 (Coding Standards)
- **核心框架**: 必须遵循 Next.js 16.1.1 (App Router) 和 React 19 的最新实践。
- **TypeScript**: 
    - 强制开启严格模式 (`strict: true`)。
    - 避免使用 `any` 类型，优先定义 `interface` 或 `type`。
    - 组件 Props 必须明确类型定义。
- **React 最佳实践**:
    - 优先使用函数组件和 Hooks。
    - 利用 React 19 的 `useActionState` 处理表单状态。
    - 使用 Server Actions 处理数据提交（见 `app/actions`）。
    - 客户端组件必须在文件顶部标注 `"use client"`。

## 2. 目录结构标准 (Directory Structure)
- `app/`: 路由定义、页面 (page.tsx)、布局 (layout.tsx) 及路由组 (如 `(layout)`)。
- `components/`: 
    - `ui/`: 基础 UI 组件（基于 Shadcn UI）。
    - `[Feature]/`: 按功能模块分组的业务组件（如 `Channel`, `login`）。
    - `common/`: 通用业务组件。
- `lib/`: 工具类函数 (`utils.ts`)、API 客户端 (`api-client.ts`) 等。
- `actions/`: 服务端动作，用于处理数据请求和业务逻辑。
- `hooks/`: 自定义 React Hooks。
- `public/`: 静态资源文件。
- `scripts/`: 构建、导出及验证脚本。

## 3. 命名约定 (Naming Conventions)
- **文件与文件夹**: 统一使用 `kebab-case` (例如: `login-form.tsx`, `api-client.ts`)。
- **组件名称**: 使用 `PascalCase` (例如: `DataTableDemo`, `LoginForm`)。
- **变量与函数**: 使用 `camelCase` (例如: `isRefreshing`, `handleDelete`)。
- **常量**: 使用大写 `SNAKE_CASE` (例如: `BASE_URL`)。

## 4. 代码风格指南 (Code Style)
- **样式方案**: 统一使用 Tailwind CSS 4。
- **UI 组件**: 采用 Radix UI / Shadcn UI 规范。
- **图标**: 统一使用 `lucide-react`。
- **日期处理**: 使用 `dayjs` 库。
- **动画**: 使用 `motion` (Framer Motion) 进行交互增强。

## 5. 提交规范 (Commit Convention)
提交信息应遵循以下格式：`<type>(<scope>): <subject>`
- `feat`: 新功能
- `fix`: 修补 bug
- `docs`: 文档变更
- `style`: 代码格式变更（不影响功能）
- `refactor`: 重构（既不是新增功能也不是修补 bug）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动

## 6. 性能优化准则 (Performance)
- **静态导出**: 项目配置为 `output: 'export'`，所有页面必须支持静态生成。
- **图片优化**: 由于静态导出限制，`next/image` 需设置 `unoptimized: true`。
- **API 请求**: 
    - 客户端请求使用封装好的 `api-client`。
    - 默认配置 `cache: 'no-store'` 确保数据实时性。
- **代码分割**: 利用 Next.js 自动代码分割特性。

## 7. 安全规范 (Security)
- **认证管理**: JWT Token 存储于 `localStorage`，通过 `Authorization: Bearer` 头部发送。
- **敏感信息**: 禁止在代码中硬编码密钥，使用环境变量。
- **输入校验**: 所有表单提交前必须进行前端校验，Server Actions 中进行二次校验。

## 8. 质量检查标准 (Quality Checks)
- **Lint 检查**: 运行 `pnpm lint` 必须无 Error。
- **类型检查**: `pnpm build` 过程中 TypeScript 检查必须通过。
- **导出验证**: 运行 `node scripts/verify-export.test.js` 验证静态文件完整性。