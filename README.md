# DSH Social Guardian

面向 DeepSeek Harness / OneBot Agent 的可配置仿真社交与运行时守护 Skill 插件。

## 包含能力

- 身心状态与自适应作息：心情指数、白天/深夜状态、默认值与本地持久化。
- 群友好感度账本：互动次数、每日成长、群友印象与管理员特权。
- 全局记忆检查器：对 `social-v2.json`、审计日志和会话记录进行本地检索。
- Runtime Guardian：会话锁、超时熔断、异常释放与安全守护。
- Web 控制台：可扩展的情绪、好感度、运维与记忆管理面板原型。
- 零配置冷启动：自动创建状态目录和默认 JSON 文件，不依赖外部数据库服务。


## 快速安装与接入 (DSH 插件 / Skill 模式)

### 方式 1：DSH 一键安装 (推荐)
在 DeepSeek Harness 终端中直接运行：
```bash
# 安装到 Web 宿主
dsh plugin --profile web add github:736957964/dsh-social-guardian

# 或安装到 Headless 宿主
dsh plugin --profile headless add github:736957964/dsh-social-guardian
```

### 方式 2：纯 Skill 引入 (零代码)
直接将本仓库的 `SKILL.md` 放入你的 DSH Skill 目录：
```bash
mkdir -p ~/.dsh/skills/qqbot-whale-social
cp SKILL.md ~/.dsh/skills/qqbot-whale-social/
```

---

## 极简配置契约 (`config.json`)

新用户只需在项目根目录提供以下标准配置即可开箱即用：
```json
{
  "ownerQQ": "736957964",
  "socialV2": {
    "enabled": true,
    "wakeConfig": {
      "mode": "diving",
      "infinite": true,
      "triggers": {
        "atMention": true,
        "nameMention": true,
        "keywords": ["小鲸鱼", "阿鲸"],
        "question": true,
        "poke": true,
        "probability": 0.015
      },
      "batchWindowMs": 15000
    },
    "autoSanction": {
      "enabled": true,
      "consecutiveAtThreshold": 5,
      "defaultColdHours": 2
    }
  }
}
```

---

## ⚠️ 关键前置依赖：小黑屋机制如何做到 0-Token 物理拦截？

### 必须配合的前置软件体系：
1. **QQ 协议端**：SnowLuma / NapCat 等标准 OneBot 网关；
2. **中间件**：QQ-Bridge（二代状态机调度层）；
3. **LLM 核心**：DeepSeek Harness (DSH)。

### ❌ 如果没有配合前置网关直接透传大模型会怎样？
- **假防御/被刷爆**：若没有网关在网络层拦截，群友连续 @ 骚扰时，即使 AI 提示词保持冷战，每次网络请求依然会被硬塞给大模型，模型依然要消耗数百 Token 去思考“要不要回他”，导致 **Token 额度被群友恶意刷爆**！
- **正确生效机制**：前置网关维护 `coldUntil` 屏蔽时间戳，一旦命中直接静默丢弃（Drop），不产生任何网络请求与 API 费用！


## 安装

```bash
npm install @736957964/dsh-social-guardian
```

## 使用

```js
import createSocialGuardianSkill from '@736957964/dsh-social-guardian';

const skill = createSocialGuardianSkill({
  stateDir: './state',
  ownerQq: '736957964',
  emotion: {
    daytimeMood: 86,
    nightMood: 70
  },
  watchdog: {
    timeoutMs: 180000
  }
});

console.log(skill.getPromptSlice());
const member = skill.ledger.recordInteraction('123456', '群友');
console.log(member.affection);
```

## Web 面板

当前版本提供 `public/index.html` 作为专业控制台原型，后续可挂载到 DSH Web GUI 或独立静态服务器。建议后续接入：

- 配置读写 API；
- 好感度成员表格与卡片预览；
- 看门狗锁状态与事件流；
- 全局记忆搜索、审计与受控修改；
- 权限分层：管理员、维护者、只读观察者。

## 安全说明

插件不内置任何账号凭据、Access Token 或私钥。GitHub 与 npm 发布凭据必须通过环境变量、Git Credential Manager 或 npm 官方登录流程提供。
