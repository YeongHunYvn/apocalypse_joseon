import { GameAction, GameState } from '../../types';
import { Logger } from '../system/Logger';

import React from 'react';

// gameReducer는 사용하지 않습니다. (초기화는 휴식방 정리로 일원화)

// 스킬 초기화는 휴식방 정리 핸들러로 이동했습니다.

/**
 * 챕터 전환 시 필요한 정리 작업을 담당하는 클래스
 * 현재는 completed_scenes 초기화만 담당하지만, 향후 확장 가능
 */
export class ChapterTransitionManager {
  private gameState: GameState;
  private dispatch?: React.Dispatch<GameAction>;

  constructor(initialGameState: GameState) {
    this.gameState = initialGameState;
  }

  /**
   * GameStateContext의 dispatch 함수를 설정합니다.
   * @param dispatch - React dispatch 함수
   */
  setDispatch(dispatch: React.Dispatch<GameAction>): void {
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
   * 현재 게임 상태를 반환합니다.
   * @returns 현재 게임 상태
   */
  getGameState(): GameState {
    return this.gameState;
  }

  // 완료된 씬 초기화는 휴식방 정리(rest_room_cleanup)로 일원화되었습니다.

  /**
   * 챕터 전환 시 필요한 모든 초기화 작업을 수행합니다.
   * 향후 추가될 초기화 로직들을 여기에 통합할 수 있습니다.
   * @returns 초기화된 게임 상태
   */
  performChapterTransitionCleanup(): GameState {
    // 챕터 전환 시에는 자동 초기화를 수행하지 않습니다.
    // 휴식방 특수 효과(rest_room_cleanup)에서 일괄 초기화됩니다.
    return this.gameState;
  }

  /**
   * 디버그 정보를 출력합니다.
   */
  debugInfo(): void {
    Logger.debug('[ChapterTransitionManager]', '=== 디버그 정보 ===');
    Logger.debug(
      '[ChapterTransitionManager]',
      `완료된 씬 수: ${this.gameState.completed_scenes.length}`
    );
    Logger.debug(
      '[ChapterTransitionManager]',
      `현재 층: ${this.gameState.current_floor}`
    );
    Logger.debug(
      '[ChapterTransitionManager]',
      `사망 횟수: ${this.gameState.death_count}`
    );
    Logger.debug('[ChapterTransitionManager]', '====================');
  }
}
