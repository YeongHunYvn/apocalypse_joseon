import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Scene, UseStoryCoreReturn } from '../../../types';
import { Logger } from '../../../utils/system/Logger';
import { useGameState } from '../../game/useGameState';

/**
 * 스토리 관련 핵심 상태를 중앙에서 관리하는 Hook입니다.
 * 단일 진실의 원천(Single Source of Truth)으로 작동합니다.
 * 모든 스토리 관련 상태와 기본 액션을 제공합니다.
 * @returns 스토리 핵심 상태 및 액션
 */
export function useStoryCore(): UseStoryCoreReturn {
  // 게임 상태 컨텍스트
  const gameState = useGameState();
  const {
    state,
    currentScene,
    isEngineReady,
    isGameOver,
    sceneEngine,
    startGame,
    selectChoice,
  } = gameState;

  // ===== 중앙 상태 관리 =====
  // 로딩/에러 상태
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  // 게임 진행 상태
  const [hasGameStarted, setHasGameStarted] = useState(false);



  // ===== 계산된 상태 =====
  /**
   * 전체 로딩 상태 (단일 소스)
   */
  const isLoading = useMemo(() => {
    return !isEngineReady || isInitializing;
  }, [isEngineReady, isInitializing]);

  /**
   * 에러 상태 (단일 소스)
   */
  const hasError = useMemo(() => {
    return (
      (hasGameStarted && isEngineReady && !currentScene && !isInitializing) ||
      !!initializationError
    );
  }, [
    hasGameStarted,
    isEngineReady,
    currentScene,
    isInitializing,
    initializationError,
  ]);

  /**
   * UI 준비 상태
   */
  const isUIReady = useMemo(() => {
    return !isLoading && !hasError && currentScene !== null;
  }, [isLoading, hasError, currentScene]);

  // ===== 핵심 액션 =====

  /**
   * 모든 상태 초기화
   */
  const clearAllState = useCallback(() => {

    // 에러 상태 초기화
    setInitializationError(null);

  }, []);



  // ===== 자동 상태 관리 =====
  // 게임 시작 시 초기화
  useEffect(() => {
    if (!hasGameStarted) {
      clearAllState();
    }
  }, [hasGameStarted, clearAllState]);

  // 게임 리셋 감지
  useEffect(() => {
    if (!currentScene && hasGameStarted) {
      setHasGameStarted(false);
    }
  }, [currentScene, hasGameStarted]);


  // 게임 시작 플래그 설정
  useEffect(() => {
    if (currentScene && !hasGameStarted) {
      Logger.debug('[useStoryCore]', '게임 시작 플래그 설정');
      setHasGameStarted(true);
    }
  }, [currentScene, hasGameStarted]);


  return {
    // ===== 게임 상태 (읽기 전용) =====
    state,
    currentScene,
    isEngineReady,
    isGameOver,

    // ===== 계산된 상태 (단일 소스) =====
    isLoading,
    hasError,
    isUIReady,
    isInitializing,
    hasGameStarted,
    initializationError,

    // ===== 상태 설정 함수 =====
    setIsInitializing,
    setInitializationError,

    // ===== 핵심 액션 =====
    startGame,
    selectChoice,
    clearAllState,

    // ===== 엔진 참조 =====
    sceneEngine,
  };
}
