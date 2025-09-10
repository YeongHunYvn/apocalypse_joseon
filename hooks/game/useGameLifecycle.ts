import { Scene, UseGameLifecycleReturn } from '../../types';
import {
  incrementDeathCount,
  incrementFloorDeathCount,
  loadScene,
  resetAfterFailure,
} from '../../contexts/GameStateActions';

import { useCallback } from 'react';
import { useGameState } from './useGameState';

/**
 * 게임 생명주기 관리를 담당하는 Hook입니다.
 * 게임 시작, 종료, 리셋, 사망 등 생명주기 관련 액션을 제공합니다.
 * @returns 게임 생명주기 관련 액션 함수들
 */
export function useGameLifecycle(): UseGameLifecycleReturn {
  const { dispatch, startGame } = useGameState();

  /**
   * 전체 사망 횟수를 증가시킵니다.
   */
  const incrementGameDeathCount = useCallback(() => {
    dispatch(incrementDeathCount());
  }, [dispatch]);

  /**
   * 특정 층의 사망 횟수를 증가시킵니다.
   * @param floor 사망이 발생한 층 번호
   */
  const incrementGameFloorDeathCount = useCallback(
    (floor: number) => {
      dispatch(incrementFloorDeathCount(floor));
    },
    [dispatch]
  );

  /**
   * 실패 후 게임 상태를 리셋합니다.
   * 사망 등으로 인한 게임 재시작 시 사용합니다.
   */
  const resetGameAfterFailure = useCallback(() => {
    dispatch(resetAfterFailure());
  }, [dispatch]);

  /**
   * 특정 씬을 로드합니다.
   * @param scene 로드할 씬 데이터
   */
  const loadGameScene = useCallback(
    (scene: Scene) => {
      dispatch(loadScene(scene));
    },
    [dispatch]
  );

  /**
   * 게임을 시작합니다.
   * GameStateContext에서 제공하는 startGame 함수를 래핑합니다.
   */
  const startGameSession = useCallback(async () => {
    return await startGame();
  }, [startGame]);

  return {
    incrementGameDeathCount,
    incrementGameFloorDeathCount,
    resetGameAfterFailure,
    loadGameScene,
    startGameSession,
  };
}
