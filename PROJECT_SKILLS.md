# YouTube Manage App - 技术栈与核心技能 (Skills)

## 1. 前端技术栈 (Frontend Stack)
- **核心框架**: Next.js 16.1.1 (App Router, Static Export).
- **UI 库**: React 19.2.
- **开发语言**: TypeScript 5.
- **样式处理**: Tailwind CSS 4.0+, PostCSS.
- **组件标准**: Shadcn UI (基于 Radix UI 原型).
- **动画库**: Framer Motion (motion).
- **表格处理**: TanStack Table v8 (@tanstack/react-table).

## 2. 状态管理与数据流 (Data Management)
- **表单状态**: React 19 `useActionState`, `useFormStatus`.
- **数据请求**: 原生 `fetch` 封装，支持自动 Token 刷新 (Refresh Token flow)。
- **持久化**: 客户端使用 `localStorage` 存储用户信息及 JWT。

## 3. API 设计与后端集成 (API Integration)
- **API 类型**: RESTful API.
- **基地址**: `https://dataapi.aipopshort.com/v1/api`.
- **认证机制**: 
    - JWT Bearer Token.
    - 自动 401 拦截并尝试刷新 Token。
- **响应处理**: 统一错误处理及 Notification 提示。

## 4. 测试与验证 (Testing & Verification)
- **单元测试**: Node.js 原生测试运行器 (`node:test`)。
- **验证重点**: 
    - 静态导出报告 (`export_report.json`) 完整性。
    - 关键路由 (`/`, `/login`) 导出状态。
- **代码规范**: ESLint 9 (Next.js Core Web Vitals 配置)。

## 5. 部署与环境 (Deployment)
- **构建工具**: Next.js Compiler.
- **导出模式**: `output: 'export'` (SSG/SPA 混合模式)。
- **包管理器**: pnpm.
- **运行环境**: Node.js 20+。

## 6. 性能指标基准 (Performance Baselines)
- **首屏加载 (FCP)**: < 1.2s (静态导出优势)。
- **交互延迟 (INP)**: < 200ms。
- **构建时间**: 全量构建应在 2 分钟内完成。

## 7. 安全防护措施 (Security Measures)
- **CSRF 防护**: 利用 Server Actions 的内置保护。
- **XSS 防护**: React 自动转义及内容安全策略建议。
- **会话失效**: 401 自动重定向至登录页并保留 `redirect` 参数。

## 8. 团队协作标准 (Team Collaboration)
- **编辑器配置**: `.vscode/settings.json` 已配置基础开发环境。
- **代码审查**: 关注组件复用性、Tailwind 类名冗余、TypeScript 类型覆盖率。
- **文档维护**: 核心逻辑及导出流程需在 `docs/` 下记录（如 `STATIC_EXPORT.md`）。