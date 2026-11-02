import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_EMOTION_CONFIG = {
  initialMood: 80,
  minMood: 0,
  maxMood: 100,
  daytimeMood: 86,
  nightMood: 70,
  nightStartHour: 23,
  nightEndHour: 7,
  decayPerHour: 1,
  recoveryPerHour: 2,
};

export function loadEmotionState(stateDir, config = {}) {
  fs.mkdirSync(stateDir, { recursive: true });
  const file = path.join(stateDir, 'emotion-state.json');
  const merged = { ...DEFAULT_EMOTION_CONFIG, ...config };
  let state;
  try { state = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { state = { mood: merged.initialMood, updatedAt: Date.now() }; }
  return { ...state, config: merged, file };
}

export function calculateMood(hour = new Date().getHours(), config = DEFAULT_EMOTION_CONFIG) {
  const isNight = hour >= config.nightStartHour || hour < config.nightEndHour;
  return isNight ? config.nightMood : config.daytimeMood;
}

export function saveEmotionState(state) {
  fs.writeFileSync(state.file, JSON.stringify({ mood: state.mood, updatedAt: Date.now() }, null, 2), 'utf8');
}
