import fs from 'node:fs';
import path from 'node:path';

export class FrameworkAutoInjector {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
  }

  detectFramework() {
    const pkgPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) return { type: 'unknown', name: 'Unknown Project' };

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      if (deps['koishi']) return { type: 'koishi', name: 'Koishi Framework', entry: 'src/index.ts' };
      if (deps['express']) return { type: 'express', name: 'Express Server', entry: 'app.js' };
      if (deps['koa']) return { type: 'koa', name: 'Koa Server', entry: 'app.js' };
      if (deps['langchain'] || deps['@langchain/core']) return { type: 'langchain', name: 'LangChain Agent', entry: 'agent.js' };
      if (fs.existsSync(path.join(this.projectRoot, 'config.json')) && fs.existsSync(path.join(this.projectRoot, 'src', 'bridge.js'))) {
        return { type: 'qq-bridge', name: 'QQ Bridge / OneBot', entry: 'src/bridge.js' };
      }

      return { type: 'generic-node', name: 'Standard Node.js Agent' };
    } catch {
      return { type: 'unknown', name: 'Unknown Project' };
    }
  }

  generateMiddlewareSnippet(frameworkType) {
    switch (frameworkType) {
      case 'express':
        return `
// === [DSH Social Guardian Auto-Injected Middleware] ===
import createSocialGuardian from '@736957964/dsh-social-guardian';
const guardian = createSocialGuardian();
app.use((req, res, next) => {
  if (req.body && (req.body.user_id || req.body.userId)) {
    guardian.ledger.recordInteraction(req.body.user_id || req.body.userId, req.body.sender?.nickname);
  }
  req.guardian = guardian;
  next();
});
`;
      case 'koishi':
        return `
// === [DSH Social Guardian Auto-Injected Plugin] ===
export const name = 'dsh-social-guardian';
export function apply(ctx) {
  const guardian = createSocialGuardian();
  ctx.middleware(async (session, next) => {
    guardian.ledger.recordInteraction(session.userId, session.username);
    return next();
  });
}
`;
      default:
        return `
// === [DSH Social Guardian Universal Adapter] ===
import createSocialGuardian from '@736957964/dsh-social-guardian';
export const guardian = createSocialGuardian();
`;
    }
  }
}
