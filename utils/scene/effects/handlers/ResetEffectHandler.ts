// /utils/scene/effects/handlers/ResetEffectHandler.ts
import { INITIAL_GAME_STATE } from '../../../../constants/gameConfig';
import { GameState } from '../../../../types';
import { Logger } from '../../../system/Logger';

/**
 * 'reset_game' 특수 효과를 처리합니다.
 * 게임 상태 전체를 초기 상태(`INITIAL_GAME_STATE`)로 리셋합니다.
 *
 * @param gameState - 현재 게임 상태 (사용되지 않음)
 * @returns 초기화된 새로운 게임 상태
 */
export function handleResetGame(_gameState: GameState): GameState {
  Logger.info('[EffectHandler]', '특수 효과 처리: reset_game');
  return {
    ...INITIAL_GAME_STATE,
  };
}
