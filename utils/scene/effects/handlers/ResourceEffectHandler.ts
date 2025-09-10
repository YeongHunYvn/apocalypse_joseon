import { RESOURCES } from '../../../../constants/gameConfig';

// /utils/scene/effects/handlers/ResourceEffectHandler.ts
import { GameState } from '../../../../types';
import { Logger } from '../../../system/Logger';

/**
 * 'reset_health' 특수 효과를 처리합니다.
 * 체력을 최대치로 회복합니다.
 *
 * @param gameState - 현재 게임 상태
 * @returns 체력이 회복된 새로운 게임 상태
 */
export function handleResetHealth(gameState: GameState): GameState {
  Logger.info('[EffectHandler]', '특수 효과 처리: reset_health');
  return {
    ...gameState,
    health: RESOURCES.health.maxValue,
  };
}

/**
 * 'reset_mind' 특수 효과를 처리합니다.
 * 정신력을 최대치로 회복합니다.
 *
 * @param gameState - 현재 게임 상태
 * @returns 정신력이 회복된 새로운 게임 상태
 */
export function handleResetMind(gameState: GameState): GameState {
  Logger.info('[EffectHandler]', '특수 효과 처리: reset_mind');
  return {
    ...gameState,
    mind: RESOURCES.mind.maxValue,
  };
}
