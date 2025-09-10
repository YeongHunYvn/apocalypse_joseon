import {
  addBuff as addBuffAction,
  addCompletedScene as addCompletedSceneAction,
  removeBuff as removeBuffAction,
  setFlag as setFlagAction,
  setFloor,
  unsetFlag as unsetFlagAction,
} from '../../contexts/GameStateActions';
import { BuffKey, FlagKey, UseGameProgressReturn } from '../../types';

import { useCallback, useMemo } from 'react';
import { useGameState } from './useGameState';

/**
 * 게임 진행 상태를 종합적으로 관리하는 통합 Hook입니다.
 * 진행 상태의 읽기와 쓰기 기능을 모두 제공합니다.
 *
 * 이 훅은 다음을 포함합니다:
 * - 층 관리 (현재 층, 사망 횟수)
 * - 씬 완료 상태
 * - 상태(buffs) 및 플래그 관리
 * - 진행률 계산
 * - 게임 상태 확인
 *
 * @returns 진행 상태 관련 모든 값과 액션들
 */
export function useGameProgress(): UseGameProgressReturn {
  const {
    state,
    dispatch,
    sceneEngine,
    currentScene,
    isEngineReady,
    isGameOver,
  } = useGameState();

  // ===== 계산된 값들 (읽기) =====

  /**
   * 현재 층의 사망 횟수를 계산합니다.
   */
  const currentFloorDeathCount = useMemo(() => {
    return state.death_count_by_floor[state.current_floor] || 0;
  }, [state.death_count_by_floor, state.current_floor]);

  /**
   * 전체 진행률을 계산합니다.
   * 완료된 씬 수를 기반으로 계산합니다.
   */
  const progressPercentage = useMemo(() => {
    // 완료된 씬이 없으면 0%
    if (state.completed_scenes.length === 0) {
      return 0;
    }

    // 임시로 100%를 최대값으로 설정 (실제로는 전체 씬 수를 알아야 함)
    return Math.min(100, (state.completed_scenes.length / 10) * 100);
  }, [state.completed_scenes.length]);

  /**
   * 게임이 시작 가능한 상태인지 확인합니다.
   */
  const canStartGame = useMemo(() => {
    return isEngineReady && !isGameOver && sceneEngine !== null;
  }, [isEngineReady, isGameOver, sceneEngine]);

  /**
   * 선택지를 선택할 수 있는 상태인지 확인합니다.
   */
  const canSelectChoice = useMemo(() => {
    return (
      isEngineReady &&
      !isGameOver &&
      currentScene !== null &&
      sceneEngine !== null
    );
  }, [isEngineReady, isGameOver, currentScene, sceneEngine]);

  /**
   * 현재 씬에 선택지가 있는지 확인합니다.
   */
  const hasChoices = useMemo(() => {
    return Boolean(currentScene?.choices && currentScene.choices.length > 0);
  }, [currentScene]);

  /**
   * 게임이 일시정지 상태인지 확인합니다.
   */
  const isPaused = useMemo(() => {
    return !isEngineReady || isGameOver;
  }, [isEngineReady, isGameOver]);

  /**
   * 현재 층 정보를 반환합니다.
   */
  const currentFloorInfo = useMemo(() => {
    return {
      floor: state.current_floor,
      deathCount: currentFloorDeathCount,
      totalDeathCount: state.death_count,
    };
  }, [state.current_floor, currentFloorDeathCount, state.death_count]);

  /**
   * 게임 통계 정보를 반환합니다.
   */
  const gameStats = useMemo(() => {
    return {
      completedScenes: state.completed_scenes.length,
      totalDeathCount: state.death_count,
      currentFloor: state.current_floor,
      progressPercentage,
    };
  }, [
    state.completed_scenes.length,
    state.death_count,
    state.current_floor,
    progressPercentage,
  ]);

  // ===== 액션 함수들 (쓰기) =====

  /**
   * 상태(buff)를 추가합니다.
   * @param buff 추가할 상태
   */
  const addBuff = useCallback(
    (buff: BuffKey) => {
      dispatch(addBuffAction(buff));
    },
    [dispatch]
  );

  /**
   * 상태(buff)를 제거합니다.
   * @param buff 제거할 상태
   */
  const removeBuff = useCallback(
    (buff: BuffKey) => {
      dispatch(removeBuffAction(buff));
    },
    [dispatch]
  );

  /**
   * 플래그를 설정합니다.
   * @param flag 설정할 플래그
   */
  const updateFlag = useCallback(
    (flag: FlagKey) => {
      dispatch(setFlagAction(flag));
    },
    [dispatch]
  );

  /**
   * 플래그를 해제합니다.
   * @param flag 해제할 플래그
   */
  const removeFlag = useCallback(
    (flag: FlagKey) => {
      dispatch(unsetFlagAction(flag));
    },
    [dispatch]
  );

  /**
   * 현재 층을 설정합니다.
   * @param floor 설정할 층 번호
   */
  const updateFloor = useCallback(
    (floor: number) => {
      dispatch(setFloor(floor));
    },
    [dispatch]
  );

  /**
   * 완료된 씬을 목록에 추가합니다.
   * @param sceneId 완료된 씬 ID
   */
  const addCompletedScene = useCallback(
    (sceneId: string) => {
      dispatch(addCompletedSceneAction(sceneId));
    },
    [dispatch]
  );

  return {
    // === 읽기: 상태 정보 ===
    canStartGame,
    canSelectChoice,
    hasChoices,
    isPaused,

    // === 읽기: 진행 정보 ===
    currentFloorInfo,
    gameStats,
    progressPercentage,
    currentFloorDeathCount,

    // === 쓰기: 액션 함수들 ===
    addBuff,
    removeBuff,
    updateFlag,
    removeFlag,
    updateFloor,
    addCompletedScene,
  };
}
