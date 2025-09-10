import { applyExperience, changeStat } from '../../contexts/GameStateActions';
import { StatKey, UseGameStatsReturn } from '../../types';

import { useCallback } from 'react';
import { useGameState } from './useGameState';

/**
 * 게임 능력치 관리를 담당하는 Hook입니다.
 * 능력치(힘, 민첩, 지혜, 카리스마) 변경 및 경험치 추가 액션을 제공합니다.
 * @returns 능력치 관련 액션 함수들
 */
export function useGameStats(): UseGameStatsReturn {
  const { dispatch } = useGameState();

  /**
   * 능력치를 업데이트합니다.
   * @param stat 변경할 능력치 타입
   * @param value 변경할 값
   */
  const updateStat = useCallback(
    (stat: StatKey, value: number) => {
      dispatch(changeStat(stat, value));
    },
    [dispatch]
  );

  /**
   * 특정 능력치에 경험치를 추가합니다.
   * @param stat 경험치를 추가할 능력치 타입
   * @param value 추가할 경험치 값
   */
  const addExp = useCallback(
    (stat: StatKey, value: number) => {
      dispatch(applyExperience({ [stat]: value }));
    },
    [dispatch]
  );

  return {
    updateStat,
    addExp,
  };
}
