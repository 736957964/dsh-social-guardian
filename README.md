# DSH Social Guardian

面向 DeepSeek Harness / OneBot Agent 的可配置仿真社交与运行时守护 Skill 插件。

## 包含能力

- 身心状态与自适应作息：心情指数、白天/深夜状态、默认值与本地持久化。
- 群友好感度账本：互动次数、每日成长、群友印象与管理员特权。
- 全局记忆检查器：对 `social-v2.json`、审计日志和会话记录进行本地检索。
- Runtime Guardian：会话锁、超时熔断、异常释放与安全守护。
- Web 控制台：可扩展的情绪、好感度、运维与记忆管理面板原型。
- 零配置冷启动：自动创建状态目录和默认 JSON 文件，不依赖外部数据库服务。

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
