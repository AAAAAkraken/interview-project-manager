# 🐂🐎 牛马速通器

> 面试准备利器 —— 把做过的项目一键变成面试档案，应对面试官拷问。

## ✨ 这是什么

一个 **Electron 桌面应用**，帮你管理做过的项目，用 AI 分析项目代码生成面试档案：

- 📋 **项目概览**：语言、架构、目录结构
- 🛠 **技术栈**：框架、数据库、关键库
- 📄 **关键文件**：每个文件的角色和技术要点
- 🎤 **面试问答**：按分类整理的常见问题和建议回答
- ✨ **简历亮点**：STAR 法则写好的简历描述，一键复制

## 🎯 使用流程

```
创建项目 → 生成 AI 提示词 → 复制到 ChatGPT/Claude
    → AI 分析代码返回 JSON → 粘贴回来 → 自动解析展示
    → 面试前打开回顾，导出简历文本
```

全程离线，数据存在本地，不需要任何 API Key。

## 🖥️ 界面截图

（待补充）

## 🚀 快速开始

### 安装依赖

> **注意**：项目默认配置了国内 npm 镜像（npmmirror），解决 Electron / better-sqlite3 二进制包在国内下载慢或失败的问题。

```bash
# 安装依赖（国内用户直接用这行）
npm install
```

如果你不在中国，可以删掉 `.npmrc` 或改为官方源：

```bash
rm .npmrc   # 删掉镜像配置，恢复官方源
npm install
```

### 启动（开发模式）

```bash
npm run electron:dev
```

### 打包成 .exe

```bash
# 生成安装包
npm run dist

# 安装包在 release/ 目录下
```

## 🛠 技术栈

| 层 | 技术 |
|---|------|
| 桌面框架 | Electron 43 |
| 前端 | Next.js 15 + React 19 + TypeScript |
| 样式 | Tailwind CSS 3 |
| 数据库 | SQLite (better-sqlite3) |
| 打包 | electron-builder |

## 📂 项目结构

```
牛马速通器/
├── electron/              # Electron 桌面壳
│   ├── main.js            #   主进程（窗口管理）
│   ├── preload.js         #   安全预加载
│   ├── server.js          #   生产模式 Next.js 启动器
│   └── start.js           #   开发模式启动编排器
├── src/
│   ├── app/               # Next.js 页面和 API 路由
│   │   ├── page.tsx       #   仪表盘首页
│   │   ├── layout.tsx     #   根布局
│   │   ├── project/[id]/  #   项目详情 / 导入 / 导出
│   │   └── api/           #   REST API（项目 CRUD、分析导入等）
│   ├── components/
│   │   ├── ui/            #   通用 UI 组件
│   │   ├── dashboard/     #   仪表盘组件
│   │   ├── project/       #   项目详情 Tab 组件
│   │   ├── import/        #   导入向导 3 步骤
│   │   └── layout/        #   侧边栏
│   ├── lib/
│   │   ├── db.ts          #   数据库初始化和建表
│   │   ├── repositories/  #   数据访问层
│   │   ├── prompt/        #   AI 提示词模板
│   │   ├── parser/        #   AI 回复 JSON 解析器
│   │   └── export/        #   简历导出
│   └── types/             #   TypeScript 类型定义
├── assets/                # 应用图标
├── database/              # SQLite 数据库（已 gitignore）
├── package.json           # 项目配置和依赖
└── next.config.js         # Next.js 配置
```

## 🔒 隐私说明

- **无 API Key**：不调用任何 AI API，采用「复制提示词 → 粘贴回复」的离线模式
- **数据本地存储**：所有项目数据存在本地 SQLite 数据库
- **数据库已 gitignore**：`database/` 目录不会上传到 GitHub
- **无网络请求**：应用不连接任何外部服务

## 📄 License

MIT
