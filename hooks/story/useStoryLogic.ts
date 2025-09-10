import { useCallback, useEffect } from 'react';
import { Scene, UseStoryLogicReturn } from '../../types';
import { Logger } from '../../utils/system/Logger';

import { Alert } from 'react-native';
import { useStoryCore } from './core/useStoryCore';

/**
 * 스토리 관련 순수 비즈니스 로직을 담당하는 Hook입니다.
 * 게임 초기화, 선택지 처리, 씬 관리 등의 로직을 제공합니다.
 * 상태 관리는 useStoryCore에 위임합니다.
 * @returns 비즈니스 로직 함수들
 */
export function useStoryLogic(): UseStoryLogicReturn {
  const {
    currentScene,
    isEngineReady,
    startGame,
    selectChoice,
    setIsInitializing,
    setInitializationError,
  } = useStoryCore();

  /**
   * 게임을 초기화합니다.
   * 씬 엔진을 통해 게임을 시작하고 첫 번째 씬을 로드합니다.
   */
  const initializeGame = useCallback(async (): Promise<Scene | null> => {
    try {
      setIsInitializing(true);
      setInitializationError(null);

      const scene = await startGame();
      if (!scene) {
        throw new Error('게임을 시작할 수 없습니다.');
      }
      return scene;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      Logger.error('[useStoryLogic]', '게임 초기화 실패:', error);
      setInitializationError(errorMessage);
      Alert.alert('오류', '게임을 시작할 수 없습니다.');
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [startGame, setIsInitializing, setInitializationError]);

  /**
   * 선택지를 처리하고 다음 씬으로 이동합니다.
   * @param choiceIndex - 선택한 선택지 인덱스
   */
  const handleChoice = useCallback(
    async (choiceIndex: number): Promise<Scene | null> => {
      try {
        // SceneEngine을 통해 선택지 처리
        const nextScene = await selectChoice(choiceIndex);

        if (!nextScene) {
          throw new Error('다음 씬을 찾을 수 없습니다.');
        }
        return nextScene;
      } catch (error) {
        Logger.error('[useStoryLogic]', '선택지 처리 실패:', error);
        Alert.alert('오류', '선택을 처리할 수 없습니다.');
        return null;
      }
    },
    [selectChoice]
  );

  /**
   * 게임 재시작을 처리합니다.
   */
  const restartGame = useCallback(async (): Promise<Scene | null> => {
    setInitializationError(null);
    return await initializeGame();
  }, [initializeGame, setInitializationError]);

  // 엔진이 준비되고 현재 씬이 없으면 자동으로 게임 시작
  useEffect(() => {
    if (!isEngineReady || currentScene) return;
    // GameStateProvider에서 복원 로직과 겹치지 않도록 마이크로태스크로 지연 호출
    // (동일 프레임 내 중복 startGame 방지)
    Promise.resolve().then(() => {
      // 여전히 씬이 없으면 시작
      if (!currentScene) {
        initializeGame();
      }
    });
  }, [isEngineReady, currentScene, initializeGame]);

  return {
    // 비즈니스 로직 함수들
    initializeGame,
    handleChoice,
    restartGame,
  };
}