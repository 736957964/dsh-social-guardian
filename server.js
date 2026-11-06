import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3888;
const STATE_DIR = 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\state';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MEMORY_PATHS = [
  { name: '全局群友印象与好感度账本', path: 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\state\\global-impressions.json', type: 'JSON', desc: '记录所有群友的好感度、互动次数、每日增益与个性印象' },
  { name: '社交V2全量会话与最近消息', path: 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\state\\social-v2.json', type: 'JSON', desc: '白名单群与私聊上下文、消息快照、唤醒条件与Token' },
  { name: 'L1 识海记忆数据库 (SQLite)', path: 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\state\\memory.db', type: 'SQLite', desc: '长期记忆、知识节点、重要事实与群友对话归档' },
  { name: '桥接工具调用全量审计日志', path: 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\state\\tool-calls.jsonl', type: 'JSONL', desc: '所有工具调用的入参、响应、耗时与错误记录' },
  { name: 'QQ 互动全量活动流水', path: 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\state\\qq-activity.log', type: 'LOG', desc: '原始消息接入、唤醒决策、发送结果流水' }
];

function readJsonSafe(file, def = {}) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return def;
  }
}

function writeJsonSafe(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 路由
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/config/identity') {
      const cfgFile = path.join(STATE_DIR, 'guardian-identity.json');
      if (req.method === 'GET') {
        const data = readJsonSafe(cfgFile, { ownerId: 'YOUR_QQ_NUMBER', ownerTitle: '管理员', botNickname: '大肥鱼' });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(data));
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            writeJsonSafe(cfgFile, data);
            
            // 同时热同步到 qq-bridge 运行态配置与提示词切片
            const v2File = path.join(STATE_DIR, 'social-v2.json');
            const v2Data = readJsonSafe(v2File, {});
            v2Data.customIdentity = data;
            writeJsonSafe(v2File, v2Data);

            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ ok: true, data }));
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
          }
        });
        return;
      }
    }

    if (pathname === '/api/memory-paths') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(MEMORY_PATHS));
      return;
    }

    if (pathname === '/api/members') {
      const impFile = path.join(STATE_DIR, 'global-impressions.json');
      const data = readJsonSafe(impFile, {});
      const list = Object.entries(data).map(([qq, info]) => ({
        qq,
        primaryName: info.primaryName || `群友(${qq.slice(-4)})`,
        affection: info.affection || 50,
        interactionCount: info.interactionCount || 0,
        traits: info.traits || [],
        lastSeenAt: info.lastSeenAt || 0,
        dailyPointsAdded: info.dailyPointsAdded || 0
      }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(list));
      return;
    }

    if (pathname === '/api/member/update' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { qq, affection, traits, primaryName } = JSON.parse(body);
          const impFile = path.join(STATE_DIR, 'global-impressions.json');
          const data = readJsonSafe(impFile, {});
          if (!data[qq]) data[qq] = {};
          if (affection !== undefined) data[qq].affection = Number(affection);
          if (traits !== undefined) data[qq].traits = Array.isArray(traits) ? traits : [traits];
          if (primaryName !== undefined) data[qq].primaryName = primaryName;
          writeJsonSafe(impFile, data);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, member: data[qq] }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    if (pathname === '/api/watchdog') {
      const v2File = path.join(STATE_DIR, 'social-v2.json');
      const data = readJsonSafe(v2File, {});
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        watchdogTimeoutMs: 180000,
        conversations: Object.keys(data.conversations || {}),
        activeLocks: 0
      }));
      return;
    }

    if (pathname === '/api/search') {
      const q = url.searchParams.get('q') || '';
      const results = [];
      const v2File = path.join(STATE_DIR, 'social-v2.json');
      const v2Data = readJsonSafe(v2File, {});
      for (const [key, conv] of Object.entries(v2Data.conversations || {})) {
        for (const m of (conv.recentMessages || [])) {
          if (m.text && m.text.includes(q)) {
            results.push({
              source: `会话 ${key}`,
              sender: m.sender || m.userId,
              text: m.text,
              time: m.time || 0
            });
            if (results.length >= 50) break;
          }
        }
        if (results.length >= 50) break;
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(results));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API not found' }));
    return;
  }

  // 静态页面
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const mimeMap = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png'
  };

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'text/plain' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`DSH Social Guardian Server running on http://127.0.0.1:${PORT}`);
});
