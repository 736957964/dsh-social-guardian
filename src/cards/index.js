import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const CARD_PY = 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\src\\cards\\card_generator.py';
const STATE_DIR = 'C:\\Users\\Administrator\\Desktop\\feiyu\\qq-bridge-main\\state';

/**
 * 0-Token 本地快速生成图片卡片
 * @param {'mood'|'affection'} mode 卡片类型
 * @param {object} data 数据载荷
 * @returns {Promise<string|null>} 生成的本地图片绝对路径
 */
export function generateLocalCard(mode, data) {
  return new Promise((resolve) => {
    try {
      const tempJson = path.join(STATE_DIR, `card_req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.json`);
      const outPng = path.join(STATE_DIR, `card_${mode}_${Date.now()}.png`);
      fs.writeFileSync(tempJson, JSON.stringify(data), 'utf8');

      const pyProc = spawn('python', [CARD_PY, mode, tempJson, outPng], {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      pyProc.stdout.on('data', (d) => { stdout += d.toString(); });
      pyProc.on('close', (code) => {
        try { fs.unlinkSync(tempJson); } catch {}
        if (code === 0 && fs.existsSync(outPng)) {
          resolve(outPng);
        } else {
          resolve(null);
        }
      });
      pyProc.on('error', () => {
        try { fs.unlinkSync(tempJson); } catch {}
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}
