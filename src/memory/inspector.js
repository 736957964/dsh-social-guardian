import fs from 'node:fs';
import path from 'node:path';

export class MemoryInspector {
  constructor(options = {}) {
    this.stateDir = options.stateDir;
    this.memoryDbPath = options.memoryDbPath || path.join(this.stateDir, 'memory.db');
    this.socialV2Path = options.socialV2Path || path.join(this.stateDir, 'social-v2.json');
  }

  queryAuditLogs(limit = 20) {
    const file = path.join(this.stateDir, 'tool-calls.jsonl');
    if (!fs.existsSync(file)) return [];
    try {
      const lines = fs.readFileSync(file, 'utf8').trim().split('\n');
      return lines.slice(-limit).map(l => {
        try { return JSON.parse(l); } catch { return { raw: l }; }
      });
    } catch {
      return [];
    }
  }

  queryRecentConversations(key, limit = 10) {
    if (!fs.existsSync(this.socialV2Path)) return [];
    try {
      const data = JSON.parse(fs.readFileSync(this.socialV2Path, 'utf8'));
      const conv = data.conversations?.[key];
      if (!conv || !Array.isArray(conv.recentMessages)) return [];
      return conv.recentMessages.slice(-limit);
    } catch {
      return [];
    }
  }

  searchKeyword(q, limit = 10) {
    const results = [];
    if (!q || !fs.existsSync(this.socialV2Path)) return results;
    try {
      const data = JSON.parse(fs.readFileSync(this.socialV2Path, 'utf8'));
      for (const [key, conv] of Object.entries(data.conversations || {})) {
        for (const m of (conv.recentMessages || [])) {
          if (typeof m.text === 'string' && m.text.includes(q)) {
            results.push({ key, sender: m.sender, text: m.text, time: m.time });
            if (results.length >= limit) return results;
          }
        }
      }
    } catch {}
    return results;
  }
}
