# NovelForge - AI 辅助长篇网文创作工作台

<div align="center">

![NovelForge](https://img.shields.io/badge/NovelForge-AI%20%E5%89%91%E5%90%91%E9%95%87%E9%97%BB%E5%86%99%E4%BD%9C-FF6B35?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js)

**基于 AI 的长篇网络小说创作工作台，支持从大纲到审计的完整流程**

[在线 Demo](https://your-frontend.vercel.app) | [开发文档](#技术架构) | [快速开始](#本地运行)

</div>

---

## 特性亮点

### 核心功能

- **智能大纲生成**：AI 分析世界观、角色记忆，自动生成章节大纲
- **流式写作**：实时流式输出，边生成边显示，告别等待焦虑
- **FastAudit 快速检查**：实时检测敏感词、格式规范、错别字
- **DeepAudit 深度审计**：从情节构造、人物塑造、世界观融合等 6 个维度评估质量
- **全文记忆面板**：角色卡片、修仙体系、伏笔追踪，一目了然

### 技术亮点

- **SSE 流式传输**：后端流式输出，前端实时渲染
- **智能降级方案**：API 不可用时自动切换演示模式，确保 Demo 可用
- **深色主题 UI**：专为长时间创作设计的护眼界面
- **响应式布局**：支持 1280px+ 宽屏，布局美观

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         前端 (React + TypeScript + Tailwind)      │
├─────────────────────────────────────────────────────────────────┤
│  WorkspacePage │ EditorPanel │ MemoryPanel │ AuditReportPanel   │
│  ─────────────────────────────────────────────────────────────  │
│  状态管理 (Zustand) │ SSE 流式接收 │ AI 降级检测                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP/SSE
┌──────────────────────────────▼──────────────────────────────────┐
│                         后端 (Hono + Node.js)                    │
├─────────────────────────────────────────────────────────────────┤
│  /api/novels          │  /api/chapters        │  /api/pipeline  │
│  ─────────────────────────────────────────────────────────────  │
│  AI 代理层 (DeepSeek) │ SQLite 数据库        │  记忆检索        │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 | 组件化 UI 开发 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 样式 | Tailwind CSS | 深色主题设计 |
| 后端框架 | Hono | 轻量级 Web 框架 |
| 数据库 | SQLite (sql.js) | 嵌入式数据库 |
| AI 模型 | DeepSeek | 智能创作引擎 |
| 流式传输 | Server-Sent Events | 实时输出 |

---

## 在线 Demo

👉 **访问地址**：https://novelforge.vercel.app

> 提示：首次加载可能需要数秒，请耐心等待 AI 生成内容。

### 预设作品

- **作品名称**：逆天仙途
- **类型**：玄幻修仙
- **主角**：叶凡（混沌圣体）、凌雪（冰灵根）、墨尘（天魔功）

### 操作流程

1. 进入工作台，选择作品「逆天仙途」
2. 点击「生成下一章」，AI 自动生成章节大纲
3. 审核大纲，可修改或批准
4. 批准后进入流式写作阶段
5. 完成后自动进入 FastAudit 和 DeepAudit
6. 在右侧审计面板查看评分和建议

---

## 本地运行

### 环境要求

- Node.js 20+
- pnpm 8+

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd NovelForge

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 DeepSeek API Key
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 4. 启动后端（在新终端）
cd packages/server
pnpm dev

# 5. 启动前端（在新终端）
cd packages/client
pnpm dev
```

### 访问地址

- 前端：http://localhost:5173
- 后端：http://localhost:3000

---

## TRAE AI 创造力大赛参赛说明

本项目 **NovelForge** 报名参加 **TRAE AI 创造力大赛**。

### 开发工具

本项目全程使用 **TRAE IDE** 开发，包括：

- 代码编写与调试
- AI 辅助编程（代码补全、错误修复）
- Git 版本控制
- 前端构建与预览

### 作品亮点

1. **创新性**：将 AI 能力深度融入网文创作流程，覆盖从灵感到审计的完整闭环
2. **实用性**：解决网文作者"卡文"、"质量不稳定"的痛点
3. **技术性**：SSE 流式传输、Zustand 状态管理、深色主题 UI 等现代 Web 技术
4. **完整性**：提供降级方案确保 Demo 可运行，部署配置完善

### 演示视频

（待上传）

---

## 截图预览

### 首页
![首页](screenshots/home.png)

### 工作台
![工作台](screenshots/workspace.png)

### 流式输出中
![流式输出](screenshots/streaming.png)

### 审计报告
![审计报告](screenshots/audit.png)

---

## 项目结构

```
NovelForge/
├── packages/
│   ├── client/              # React 前端
│   │   ├── src/
│   │   │   ├── components/  # UI 组件
│   │   │   ├── hooks/      # 自定义 Hooks
│   │   │   ├── pages/      # 页面
│   │   │   ├── services/   # API 服务
│   │   │   ├── stores/     # 状态管理
│   │   │   └── utils/      # 工具函数
│   │   ├── vite.config.ts  # Vite 配置
│   │   └── tailwind.config.js
│   │
│   └── server/             # Node.js 后端
│       ├── src/
│       │   ├── agents/     # AI 代理
│       │   ├── db/         # 数据库
│       │   ├── memory/     # 记忆检索
│       │   ├── routes/     # API 路由
│       │   └── pipeline.ts # 流程编排
│       ├── scripts/        # 脚本
│       └── Dockerfile
│
├── .env.example            # 环境变量示例
├── README.md              # 项目文档
└── package.json           # 工作区配置
```

---

## License

MIT License
