import { DEBUG_CONFIG } from '../../constants/debug';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 중앙 로깅 유틸리티
 * - 환경별 출력 제어(__DEV__ 또는 DEBUG_CONFIG.enableLogs)
 * - 태그 기반 구조화 출력
 */
export class Logger {
  private static shouldLog(_level: LogLevel): boolean {
    // 프로덕션에서는 enableLogs가 켜져 있어야 출력
    if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
    return Boolean(DEBUG_CONFIG.enableLogs);
  }

  static debug(tag: string, ...args: unknown[]): void {
    if (!this.shouldLog('debug')) return;

    console.debug(`[DEBUG] ${tag}`, ...args);
  }

  static info(tag: string, ...args: unknown[]): void {
    if (!this.shouldLog('info')) return;

    console.log(`[INFO] ${tag}`, ...args);
  }

  static warn(tag: string, ...args: unknown[]): void {
    if (!this.shouldLog('warn')) return;

    console.warn(`[WARN] ${tag}`, ...args);
  }

  static error(tag: string, ...args: unknown[]): void {
    // 에러는 항상 출력

    console.error(`[ERROR] ${tag}`, ...args);
  }
}

export default Logger;
