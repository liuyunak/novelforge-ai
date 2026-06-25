# NovelForge 部署指南

## 部署概述

NovelForge 需要部署两部分：
- **后端**：Node.js 服务，处理 AI 请求和数据库
- **前端**：React 应用，用户界面

---

## 后端部署 (Render/Railway)

### 方式一：Render 部署

1. **创建 Render 账号**
   - 访问 https://render.com
   - 使用 GitHub 登录

2. **创建 Web Service**
   - 点击 "New +" → "Web Service"
   - 连接 GitHub 仓库
   - 设置以下配置：
     - **Root Directory**: `packages/server`
     - **Build Command**: `pnpm install && pnpm run build`
     - **Start Command**: `npx tsx src/index.ts`
     - **Instance Type**: Free

3. **设置环境变量**
   - 点击 "Environment" 标签
   - 添加环境变量：
     ```
     DEEPSEEK_API_KEY = your_api_key_here
     DEEPSEEK_BASE_URL = https://api.deepseek.com
     ```

4. **部署**
   - 点击 "Create Web Service"
   - 等待构建完成（约 2-3 分钟）
   - 获得后端 URL：如 `https://novelforge-server.onrender.com`

### 方式二：Railway 部署

1. **创建 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 登录

2. **部署**
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择仓库和 `packages/server` 目录
   - Railway 会自动检测 Node.js 应用

3. **设置环境变量**
   - 在 Variables 中添加：
     ```
     DEEPSEEK_API_KEY = your_api_key_here
     DEEPSEEK_BASE_URL = https://api.deepseek.com
     ```

4. **设置启动命令**
   - 在 Settings 中设置：
     - **Start Command**: `npx tsx src/index.ts`

### 方式三：Docker 部署

```bash
cd packages/server

# 构建镜像
docker build -t novelforge-server .

# 运行容器
docker run -p 3000:3000 \
  -e DEEPSEEK_API_KEY=your_api_key \
  novelforge-server
```

---

## 前端部署 (Vercel)

### 部署步骤

1. **创建 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub 登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 导入 GitHub 仓库
   - 设置以下配置：
     - **Root Directory**: `packages/client`
     - **Framework Preset**: Vite
     - **Build Command**: `pnpm build`
     - **Output Directory**: `dist`

3. **设置环境变量**
   - 在 Environment Variables 中添加：
     ```
     VITE_API_URL = https://your-backend.onrender.com
     ```
     > 注意：替换为实际的后端部署地址

4. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 1-2 分钟）
   - 获得前端 URL：如 `https://novelforge.vercel.app`

### 自定义域名（可选）

1. 在 Vercel 项目设置中点击 "Domains"
2. 输入你的域名（如 `novelforge.example.com`）
3. 按照指示添加 DNS 记录

---

## 验证部署

### 健康检查

访问后端健康检查：
```
https://your-backend.onrender.com/health
```
应返回 `OK`

### 完整流程测试

1. 访问前端：`https://your-frontend.vercel.app`
2. 点击进入工作台
3. 选择作品"逆天仙途"
4. 点击"生成下一章"
5. 验证完整流程：
   - [ ] 大纲生成
   - [ ] 批准大纲
   - [ ] 流式写作
   - [ ] FastAudit
   - [ ] DeepAudit

---

## 降级模式

如果后端 AI API 不可用，系统会自动切换到**演示模式**：
- 使用预设的示例大纲和内容
- 页面顶部显示"演示模式"Badge
- 确保评委能看到完整 Demo 流程

---

## 故障排查

### 前端无法连接后端

1. 检查后端是否正常运行
2. 确认 CORS 配置包含前端域名
3. 检查环境变量 `VITE_API_URL` 是否正确

### AI 生成失败

1. 确认 `DEEPSEEK_API_KEY` 正确
2. 检查 API 配额是否充足
3. 查看后端日志错误信息

### 流式输出中断

1. 检查网络连接
2. 确认后端 SSE 超时设置
3. 可能是 API 响应超时

---

## 更新部署

### 后端更新

```bash
git push origin main
# Render/Railway 会自动重新部署
```

### 前端更新

```bash
git push origin main
# Vercel 会自动重新部署
```

如需手动触发：
1. 登录 Vercel
2. 进入项目
3. 点击 "Deployments"
4. 选择最新部署，点击 "..." → "Redeploy"
