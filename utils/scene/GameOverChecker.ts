import { SYSTEM_FLAGS } from '../../constants/systemFlags';
import { GameState } from '../../types';

/**
 * 게임오버 체커
 * 게임오버 조건을 확인하는 로직을 담당합니다.
 */
export class GameOverChecker {
  /**
   * 게임 오버 조건을 확인
   * @param gameState - 현재 게임 상태
   * @returns 게임 오버 여부
   */
  static checkGameOver(gameState: GameState): boolean {
    // 강제 게임오버 플래그 체크
    if (gameState.flags.includes(SYSTEM_FLAGS.FORCE_GAMEOVER)) {
      return true;
    }

    // 생존 자원이 0 이하인지 확인 (체력, 정신력만)
    // 재화 등 다른 자원은 0이어도 게임 계속 진행
    const survivalResources = ['health', 'mind'] as const;
    for (const resourceKey of survivalResources) {
      const resourceValue = gameState[resourceKey as keyof GameState];
      if (typeof resourceValue === 'number' && resourceValue <= 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * 체력이 0 이하인지 확인합니다.
   * @param gameState - 현재 게임 상태
   * @returns 체력 게임오버 여부
   */
  static isHealthGameOver(gameState: GameState): boolean {
    return gameState.health <= 0;
  }

  /**
   * 정신력이 0 이하인지 확인합니다.
   * @param gameState - 현재 게임 상태
   * @returns 정신력 게임오버 여부
   */
  static isMindGameOver(gameState: GameState): boolean {
    return gameState.mind <= 0;
  }

  /**
   * 강제 게임오버 플래그가 설정되어 있는지 확인합니다.
   * @param gameState - 현재 게임 상태
   * @returns 강제 게임오버 여부
   */
  static isForceGameOver(gameState: GameState): boolean {
    return gameState.flags.includes(SYSTEM_FLAGS.FORCE_GAMEOVER);
  }

  /**
   * 게임오버 원인을 분석합니다.
   * @param gameState - 현재 게임 상태
   * @returns 게임오버 원인
   */
  static getGameOverReason(gameState: GameState): string {
    if (this.isForceGameOver(gameState)) {
      return '강제 게임오버';
    }

    if (this.isHealthGameOver(gameState)) {
      return '체력 부족';
    }

    if (this.isMindGameOver(gameState)) {
      return '정신력 부족';
    }

    return '알 수 없는 원인';
  }

  /**
   * 게임오버 메시지를 생성합니다.
   * @param gameState - 현재 게임 상태
   * @returns 게임오버 메시지
   */
  static getGameOverMessage(gameState: GameState): string {
    const reason = this.getGameOverReason(gameState);
    const deathCount = gameState.death_count;

    return `게임 오버 - ${reason}\n사망 횟수: ${deathCount}회`;
  }

  /**
   * 게임오버 상태인지 확인하고 원인을 반환합니다.
   * @param gameState - 현재 게임 상태
   * @returns 게임오버 여부와 원인
   */
  static checkGameOverWithReason(gameState: GameState): {
    isGameOver: boolean;
    reason?: string;
  } {
    if (!this.checkGameOver(gameState)) {
      return { isGameOver: false };
    }

    return {
      isGameOver: true,
      reason: this.getGameOverReason(gameState),
    };
  }
}
