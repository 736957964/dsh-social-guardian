#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverScript = path.join(__dirname, '..', 'server.js');

console.log('🚀 正在启动 DSH Social Guardian 控制台...');
const proc = spawn(process.execPath, [serverScript], { stdio: 'inherit' });

proc.on('close', code => {
  process.exit(code || 0);
});
