import fs from 'node:fs';
import path from 'node:path';

export class AffectionLedger {
  constructor(stateDir, ownerQq = null) {
    this.stateDir = stateDir;
    this.ownerQq = String(ownerQq || '');
    this.file = path.join(stateDir, 'global-impressions.json');
    this.store = this.load();
  }

  load() {
    fs.mkdirSync(this.stateDir, { recursive: true });
    try {
      return JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch {
      return {};
    }
  }

  save() {
    fs.writeFileSync(this.file, JSON.stringify(this.store, null, 2), 'utf8');
  }

  getMember(qq) {
    const id = String(qq);
    if (this.ownerQq && id === this.ownerQq) {
      return {
        affection: 100,
        isOwner: true,
        interactionCount: 9999,
        traits: ['至高老爹、创造者、全宇宙唯一真神！'],
        primaryName: '老爹'
      };
    }
    return this.store[id] || {
      affection: 50,
      isOwner: false,
      interactionCount: 0,
      traits: ['初次见面的群友'],
      primaryName: `群友(${id.slice(-4)})`
    };
  }

  recordInteraction(qq, name = '') {
    const id = String(qq);
    if (id === this.ownerQq) return this.getMember(id);
    if (!this.store[id]) {
      this.store[id] = {
        affection: 50,
        isOwner: false,
        interactionCount: 0,
        traits: [name ? `群内活跃群友【${name}】` : '群内活跃群友'],
        primaryName: name || `群友(${id.slice(-4)})`,
        lastDailyDate: '',
        dailyPointsAdded: 0,
        lastSeenAt: Date.now()
      };
    }
    const mem = this.store[id];
    mem.interactionCount = (mem.interactionCount || 0) + 1;
    mem.lastSeenAt = Date.now();
    if (name) mem.primaryName = name;

    const today = new Date().toISOString().slice(0, 10);
    if (mem.lastDailyDate !== today) {
      mem.lastDailyDate = today;
      mem.dailyPointsAdded = 0;
    }
    if (mem.dailyPointsAdded < 1 && mem.affection < 80) {
      mem.affection += 1;
      mem.dailyPointsAdded += 1;
    }
    this.save();
    return mem;
  }
}
