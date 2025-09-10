// /utils/scene/effects/handlers/ProgressEffectHandler.ts
import { GameState, SceneId } from '../../../../types';
import { Logger } from '../../../system/Logger';

/**
 * 'complete_scene' 특수 효과를 처리합니다.
 * 특정 씬을 완료된 것으로 처리하여 `completed_scenes` 배열에 추가합니다.
 *
 * @param gameState - 현재 게임 상태
 * @param sceneId - 완료 처리할 씬의 ID
 * @returns `completed_scenes`가 업데이트된 새로운 게임 상태
 */
export function handleCompleteScene(
  gameState: GameState,
  sceneId: SceneId
): GameState {
  Logger.info(
    '[EffectHandler]',
    `특수 효과 처리: complete_scene (sceneId: ${sceneId})`
  );
  if (gameState.completed_scenes.includes(sceneId)) {
    return gameState; // 이미 완료된 경우 상태 변경 없음
  }
  return {
    ...gameState,
    completed_scenes: [...gameState.completed_scenes, sceneId],
  };
}

/**
 * 'increment_death_count' 특수 효과를 처리합니다.
 * 전체 사망 횟수(`death_count`)를 1 증가시킵니다.
 *
 * @param gameState - 현재 게임 상태
 * @returns `death_count`가 증가된 새로운 게임 상태
 */
export function handleIncrementDeathCount(gameState: GameState): GameState {
  Logger.info('[EffectHandler]', '특수 효과 처리: increment_death_count');
  return {
    ...gameState,
    death_count: gameState.death_count + 1,
  };
}

/**
 * 'set_floor' 특수 효과를 처리합니다.
 * 현재 층(`current_floor`)을 지정된 값으로 설정합니다.
 *
 * @param gameState - 현재 게임 상태
 * @param floor - 설정할 층 번호
 * @returns `current_floor`가 업데이트된 새로운 게임 상태
 */
export function handleSetFloor(gameState: GameState, floor: number): GameState {
  Logger.info('[EffectHandler]', `특수 효과 처리: set_floor (floor: ${floor})`);
  return {
    ...gameState,
    current_floor: floor,
  };
}
