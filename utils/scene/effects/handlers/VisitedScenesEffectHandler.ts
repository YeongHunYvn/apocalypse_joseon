// /utils/scene/effects/handlers/VisitedScenesEffectHandler.ts

import { GameState } from '../../../../types';
import { Logger } from '../../../system/Logger';
import { VisitedScenesManager } from '../../VisitedScenesManager';

/**
 * 'clear_visited_scenes' 특수 효과를 처리합니다.
 * 모든 씬의 방문 이력을 초기화하고 LocalStorage도 함께 삭제합니다.
 *
 * @param gameState - 현재 게임 상태
 * @returns 방문 이력이 초기화된 새로운 게임 상태
 */
export function handleClearVisitedScenes(gameState: GameState): GameState {
  Logger.info(
    '[EffectHandler]',
    '특수 효과 처리: clear_visited_scenes (방문 이력 초기화)'
  );

  const newState = { ...gameState };

  // 방문 이력을 초기화하고 LocalStorage도 함께 삭제
  VisitedScenesManager.clearVisitedScenes(newState, true);

  return newState;
}
