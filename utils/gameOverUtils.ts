import { SYSTEM_FLAGS } from '../constants/systemFlags';
import { FlagKey, GameState } from '../types';

/**
 * 게임오버 플래그 패턴 (향후 확장성을 위해)
 */
export const GAMEOVER_FLAG_PATTERNS = [
  SYSTEM_FLAGS.FORCE_GAMEOVER,
  // 추후 다른 게임오버 플래그가 추가되면 여기에 추가
] as const;

/**
 * 게임오버 플래그를 제거합니다.
 * @param flags - 플래그 배열
 * @returns 게임오버 플래그가 제거된 플래그 배열
 */
export const removeGameOverFlags = (flags: FlagKey[]): FlagKey[] => {
  return flags.filter(flag => flag !== SYSTEM_FLAGS.FORCE_GAMEOVER);
};

/**
 * 게임오버 플래그를 설정합니다.
 * @param gameState - 게임 상태
 * @returns 게임오버 플래그가 설정된 게임 상태
 */
export const setGameOverFlag = (gameState: GameState): GameState => {
  if (!(gameState.flags ?? []).includes(SYSTEM_FLAGS.FORCE_GAMEOVER)) {
    return {
      ...gameState,
      flags: [...(gameState.flags ?? []), SYSTEM_FLAGS.FORCE_GAMEOVER],
    };
  }
  return gameState;
};

/**
 * 게임오버 플래그를 제거합니다.
 * @param gameState - 게임 상태
 * @returns 게임오버 플래그가 제거된 게임 상태
 */
export const removeGameOverFlagsFromState = (
  gameState: GameState
): GameState => {
  return {
    ...gameState,
    flags: removeGameOverFlags(gameState.flags),
  };
};

/**
 * 게임오버 플래그가 설정되어 있는지 확인합니다.
 * @param gameState - 게임 상태
 * @returns 게임오버 여부
 */
export const hasGameOverFlag = (gameState: GameState): boolean => {
  return (gameState.flags ?? []).includes(SYSTEM_FLAGS.FORCE_GAMEOVER);
};
