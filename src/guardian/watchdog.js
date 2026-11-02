export class WatchdogGuardian {
  constructor(options = {}) {
    this.timeoutMs = options.timeoutMs || 180000;
    this.locks = new Map();
    this.timers = new Map();
  }

  acquireLock(sessionId) {
    const now = Date.now();
    this.locks.set(sessionId, now);
    if (this.timers.has(sessionId)) clearTimeout(this.timers.get(sessionId));
    
    const timer = setTimeout(() => {
      this.handleTimeout(sessionId);
    }, this.timeoutMs);
    this.timers.set(sessionId, timer);
    return true;
  }

  releaseLock(sessionId) {
    this.locks.delete(sessionId);
    if (this.timers.has(sessionId)) {
      clearTimeout(this.timers.get(sessionId));
      this.timers.delete(sessionId);
    }
  }

  handleTimeout(sessionId) {
    console.warn(`[Watchdog] Session ${sessionId} exceeded ${this.timeoutMs}ms, triggering force release and safe wake guarantee.`);
    this.releaseLock(sessionId);
  }
}
