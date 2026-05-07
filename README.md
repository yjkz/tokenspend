# Token Usage Dashboard

Claude Code token 消耗可视化仪表盘。自动读取本地 `~/.claude/projects/` 下的会话日志，展示 token 使用详情。

## 功能

- **仪表盘** — 总 token、会话数、缓存命中率、平均 token/会话等统计卡片
- **图表** — 按模型分布饼图、每日用量柱状图、token 趋势折线图、Top Sessions 排行
- **会话列表** — 可排序表格，支持标题搜索和项目目录筛选
- **会话详情** — 逐请求 token 明细，堆叠柱状图展示上下文窗口增长
- **多语言** — 中文/英文切换，localStorage 持久化
- **一键启动** — 双击 `start.bat` 即可运行

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+
- Claude Code 已安装并有会话记录

### 启动

**Windows（双击启动）：**

双击 `start.bat`

**命令行启动：**

```bash
npm install
node start.cjs
```

浏览器自动打开 `http://localhost:5173`

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| 图表 | Recharts |
| 后端 | Express + tsx |
| 数据源 | `~/.claude/projects/**/*.jsonl` |

## 项目结构

```
tokenspend/
  start.bat              # 双击启动
  start.cjs              # 一键启动脚本
  server/
    index.ts             # Express 入口 (端口 3001)
    lib/                 # JSONL 解析、token 提取、会话聚合
    routes/              # API 路由
  src/
    i18n/                # 多语言 (zh/en)
    pages/               # Dashboard、Sessions、SessionDetail
    components/          # 图表、布局、统计卡片
```

## API 端点

| 端点 | 说明 |
|---|---|
| `GET /api/dashboard` | 全局聚合统计 |
| `GET /api/sessions` | 会话列表 |
| `GET /api/sessions/:id` | 会话详情 |
| `GET /api/projects` | 项目目录列表 |
| `POST /api/refresh` | 清除缓存 |

## License

MIT
