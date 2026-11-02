# DSH Social Guardian 开发指南

## 目录结构

```text
dsh-social-guardian/
├── src/
│   ├── core/
│   │   ├── emotion-state.js
│   │   └── affection-ledger.js
│   ├── cards/
│   │   ├── card_generator.py
│   │   └── index.js
│   ├── guardian/
│   │   └── watchdog.js
│   ├── memory/
│   │   └── inspector.js
│   └── index.js
├── public/
│   └── index.html
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEVELOPMENT.md
├── package.json
└── README.md
```

## 核心设计规范

1. **零配置自愈冷启动**：
   - 依赖本地持久化目录（默认 `./state`）；
   - 首次启动自动初始化配置与数据文件；
   - 外部调用无需前置安装数据库服务。

2. **状态与表现层解耦**：
   - 数据核心（情绪状态、账本、记忆检索）与 UI/渲染解耦；
   - 卡片渲染保持独立生成逻辑，并经由标准数据模型输入；
   - Web 页面可作为独立管理台，也可挂载为 DSH 客户端插件。

3. **安全与权限边界**：
   - 管理员配置权限与普通群友隔离；
   - 严禁将明文 Token、Cookie、私钥纳入仓库或日志；
   - 对外接口保持只读或安全白名单写入。
