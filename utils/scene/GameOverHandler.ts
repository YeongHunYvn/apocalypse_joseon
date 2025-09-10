import { SYSTEM_FLAGS } from '../../constants/systemFlags';
import { GameState } from '../../types';
import { removeGameOverFlags } from '../gameOverUtils';
import { Logger } from '../system/Logger';
import { GameOverChecker } from './GameOverChecker';

/**
 * 게임오버 핸들러
 * 게임오버 판정 및 처리를 담당합니다.
 */
export class GameOverHandler {
  private gameState: GameState;
  private dispatch?: React.Dispatch<any>;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  /**
   * dispatch 함수를 설정합니다.
   * React 상태 업데이트를 위해 필요합니다.
   * @param dispatch - React dispatch 함수
   */
  setDispatch(dispatch: React.Dispatch<any>): void {
    this.dispatch = dispatch;
  }

  /**
   * 게임 상태를 업데이트합니다.
   * @param newGameState - 새로운 게임 상태
   */
  updateGameState(newGameState: GameState): void {
    this.gameState = newGameState;
  }

  /**
   * 게임오버 상태를 초기화합니다.
   * React 상태를 업데이트하여 UI에 반영합니다.
   */
  resetGameOverState(): void {
    // React 상태 업데이트를 통해 게임오버 플래그 제거
    if (this.dispatch) {
      // force_gameover 플래그가 있는 경우에만 제거
      if (this.gameState.flags.includes(SYSTEM_FLAGS.FORCE_GAMEOVER)) {
        Logger.info(
          '[GameOverHandler]',
          '🔄 게임오버 플래그 제거 - React 상태 업데이트'
        );
        this.dispatch({
          type: 'UNSET_FLAG',
          flag: SYSTEM_FLAGS.FORCE_GAMEOVER,
        });
      }
    } else {
      // fallback: 로컬 상태만 업데이트 (UI에 반영되지 않음)
      Logger.warn(
        '[GameOverHandler]',
        '⚠️ dispatch가 설정되지 않아 로컬 상태만 업데이트합니다.'
      );
      this.gameState.flags = removeGameOverFlags(this.gameState.flags);
    }

    Logger.info('[GameOverHandler]', '게임오버 상태 초기화됨');
  }

  /**
   * 현재 게임오버 상태를 확인합니다.
   * @returns 게임오버 여부
   */
  isGameOver(): boolean {
    return GameOverChecker.checkGameOver(this.gameState);
  }

  /**
   * 게임오버 원인을 분석합니다.
   * @returns 게임오버 원인
   */
  getGameOverReason(): string {
    return GameOverChecker.getGameOverReason(this.gameState);
  }

  /**
   * 게임오버 통계를 반환합니다.
   * @returns 게임오버 통계
   */
  getGameOverStats(): {
    isGameOver: boolean;
    reason: string;
    flags: string[];
  } {
    return {
      isGameOver: this.isGameOver(),
      reason: this.getGameOverReason(),
      flags: (this.gameState.flags ?? []).filter(
        flag => flag === SYSTEM_FLAGS.FORCE_GAMEOVER
      ),
    };
  }

  /**
   * 디버그 정보를 출력합니다.
   */
  debugInfo(): void {
    const stats = this.getGameOverStats();
    Logger.debug('[GameOverHandler]', '=== 디버그 정보 ===');
    Logger.debug(
      '[GameOverHandler]',
      `게임오버 상태: ${stats.isGameOver ? '예' : '아니오'}`
    );
    Logger.debug('[GameOverHandler]', `게임오버 원인: ${stats.reason}`);
    Logger.debug(
      '[GameOverHandler]',
      `게임오버 플래그: ${stats.flags.join(', ')}`
    );
    Logger.debug('[GameOverHandler]', '====================');
  }
}
