// /utils/scene/effects/handlers/GameOverEffectHandler.ts
import { SYSTEM_FLAGS } from '../../../../constants/systemFlags';
import { GameState } from '../../../../types';
import { Logger } from '../../../system/Logger';

/**
 * 'force_gameover' 특수 효과를 처리합니다.
 * 이 효과는 게임오버 상태를 트리거하고 사망 횟수를 증가시킵니다.
 *
 * @param gameState - 현재 게임 상태
 * @returns 'force_gameover' 플래그가 추가되고 사망 횟수가 증가된 새로운 게임 상태
 */
export function handleForceGameOver(gameState: GameState): GameState {
  Logger.info(
    '[EffectHandler]',
    '특수 효과 처리: force_gameover. 게임오버 플래그를 설정하고 사망 횟수를 증가시킵니다.'
  );

  // 1. force_gameover 플래그 추가
  const newFlags = [...(gameState.flags ?? [])];
  if (!newFlags.includes(SYSTEM_FLAGS.FORCE_GAMEOVER)) {
    newFlags.push(SYSTEM_FLAGS.FORCE_GAMEOVER);
  }

  // 2. 전체 사망 횟수 증가
  const newDeathCount = gameState.death_count + 1;

  // 3. 현재 층의 사망 횟수 증가
  const newDeathCountByFloor = {
    ...gameState.death_count_by_floor,
    [gameState.current_floor]:
      (gameState.death_count_by_floor[gameState.current_floor] || 0) + 1,
  };

  Logger.info(
    '[EffectHandler]',
    `💀 사망 처리: 전체 ${newDeathCount}회, ${gameState.current_floor}층에서 ${newDeathCountByFloor[gameState.current_floor]}회`
  );

  return {
    ...gameState,
    flags: newFlags,
    death_count: newDeathCount,
    death_count_by_floor: newDeathCountByFloor,
  };
}
