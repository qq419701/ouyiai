import { SystemMode } from '../utils/types';
import { logger } from '../utils/logger';

export class DegradationManager {
  private currentMode: SystemMode = 'active';
  private listeners: ((mode: SystemMode) => void)[] = [];

  setMode(mode: SystemMode): void {
    if (this.currentMode === mode) return;
    const prev = this.currentMode;
    this.currentMode = mode;
    logger.warn({ prev, current: mode }, 'System mode changed');
    this.listeners.forEach(l => l(mode));
  }

  onModeChange(listener: (mode: SystemMode) => void): void {
    this.listeners.push(listener);
  }

  get mode(): SystemMode {
    return this.currentMode;
  }

  canExecute(): boolean {
    return this.currentMode === 'active';
  }

  canNotify(): boolean {
    return this.currentMode !== 'emergency';
  }

  updateFromScore(score: number): void {
    if (score >= 80) this.setMode('active');
    else if (score >= 50) this.setMode('degraded');
    else this.setMode('emergency');
  }
}
