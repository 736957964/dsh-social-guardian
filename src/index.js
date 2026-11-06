import { loadEmotionState, calculateMood, saveEmotionState } from './core/emotion-state.js';
import { AffectionLedger } from './core/affection-ledger.js';
import { WatchdogGuardian } from './guardian/watchdog.js';
import { MemoryInspector } from './memory/inspector.js';
import { FrameworkAutoInjector } from './core/auto-injector.js';

export {
  loadEmotionState,
  calculateMood,
  saveEmotionState,
  AffectionLedger,
  WatchdogGuardian,
  MemoryInspector,
  FrameworkAutoInjector
};

export default function createSocialGuardianSkill(config = {}) {
  const stateDir = config.stateDir || './state';
  const ownerQq = config.ownerQq || null;

  const emotion = loadEmotionState(stateDir, config.emotion);
  const ledger = new AffectionLedger(stateDir, ownerQq);
  const watchdog = new WatchdogGuardian(config.watchdog);
  const memory = new MemoryInspector({ stateDir });
  const injector = new FrameworkAutoInjector({ projectRoot: config.projectRoot || process.cwd() });

  return {
    name: 'dsh-social-guardian',
    version: '1.0.0',
    emotion,
    ledger,
    watchdog,
    memory,
    injector,
    getPromptSlice() {
      const mood = calculateMood(new Date().getHours(), emotion.config);
      return `【身心状态】心情指数: ${mood}/100, 处于自适应作息中。`;
    }
  };
}
