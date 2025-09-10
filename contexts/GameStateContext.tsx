import React, {
  ReactNode,
  createContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { GAME_CONFIG, INITIAL_GAME_STATE } from '../constants/gameConfig';
import { GameState, Scene } from '../types';

import { GameAction } from '../types';
import { ChapterServiceFactory } from '../utils/chapterService';
import { checkGameOver } from '../utils/scene';
import { SceneEngine } from '../utils/sceneEngine';
import { initializeChapterBasedSceneEngine } from '../utils/sceneLoader';
import { Logger } from '../utils/system/Logger';
import { Platform } from 'react-native';

import { gameReducer } from './GameStateReducer';

// 게임 상태 Context 타입
interface GameStateContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  loadScene: (scene: Scene) => void;
  resetAfterFailure: () => void;
  sceneEngine: SceneEngine | null;
  currentScene: Scene | null;
  isEngineReady: boolean;
  isGameOver: boolean;
  startGame: () => Promise<Scene | null>;
  selectChoice: (choiceIndex: number) => Promise<Scene | null>;
  executeChapter: (chapterId: string) => Promise<Scene | null>;
}

// Context 생성
export const GameStateContext = createContext<GameStateContextType | undefined>(
  undefined
);

// Provider 컴포넌트
interface GameStateProviderProps {
  children: ReactNode;
}

/**
 * 게임 상태를 관리하는 컨텍스트 프로바이더 컴포넌트입니다.
 * 씬 엔진, 게임 상태, 게임 진행 로직을 전체 앱에 제공합니다.
 * @param children - 하위 컴포넌트들
 */
export function GameStateProvider({ children }: GameStateProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);
  const [sceneEngine, setSceneEngine] = useState<SceneEngine | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasRestoredOnce, setHasRestoredOnce] = useState(false); // 중복 복원 방지

  // React 18 개발 모드 중복 실행 방지 (useState 방식)
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * 컴포넌트 마운트 시 저장된 게임 데이터를 로드합니다.
   */
  useEffect(() => {
    const loadGameData = async () => {
      try {
        // 자동 저장 데이터 로드 시도
        const { AutoSaveManager } = await import(
          '../utils/storage/AutoSaveManager'
        );
        const autoSaveData = await AutoSaveManager.loadAutoSave();

        if (autoSaveData) {
          Logger.info('[GameState]', '💾 자동 저장 데이터 로드됨');

          // 게임 상태 복원
          dispatch({
            type: 'LOAD_SAVED_PROGRESS',
            savedProgress: autoSaveData.gameState,
          });

          // 현재 씬과 챕터 복원 (있는 경우)
          if (autoSaveData.currentScene && autoSaveData.currentChapterId) {
            setCurrentScene(autoSaveData.currentScene);
            setCurrentChapterId(autoSaveData.currentChapterId);
            Logger.info(
              '[GameState]',
              `🎬 저장된 씬/챕터로 복원: ${autoSaveData.currentScene.id} (${autoSaveData.currentChapterId})`
            );
          }
        }

        // 방문 이력 동기화
        const { VisitedScenesManager } = await import(
          '../utils/scene/VisitedScenesManager'
        );
        const currentState = { ...state };
        const syncedScenes =
          await VisitedScenesManager.syncWithStorage(currentState);

        // 동기화된 결과로 상태 업데이트
        if (syncedScenes.length !== state.visited_scenes?.length) {
          dispatch({
            type: 'UPDATE_VISITED_SCENES',
            visitedScenes: syncedScenes,
          });
        }
      } catch (error) {
        Logger.warn('[GameState]', '게임 데이터 로드 실패:', error);
      }
    };

    loadGameData();
  }, []);

  /**
   * 씬 엔진을 초기화합니다.
   * 환경에 따라 적절한 챕터 서비스를 생성하고 챕터 기반 씬 엔진을 설정합니다.
   */
  useEffect(() => {
    // React 18 개발 모드 중복 실행 방지
    if (isInitialized) {
      Logger.debug('[GameStateProvider]', '이미 초기화됨 - 중복 실행 방지');
      return;
    }

    Logger.info('[GameStateProvider]', 'useEffect 시작 - 씬 엔진 초기화');
    setIsInitialized(true);

    const initEngine = async () => {
      try {
        // 챕터 서비스 생성 (환경에 따라 설정)
        const useServer =
          Platform.OS === 'web' && process.env.NODE_ENV === 'production';
        Logger.info('[GameStateContext]', 'ChapterService 생성 요청');
        const chapterService = ChapterServiceFactory.create(
          useServer,
          (process.env.EXPO_PUBLIC_API_BASE_URL ||
            process.env.REACT_APP_API_BASE_URL ||
            '/api/chapters') as string
        );

        // 챕터 기반 씬 엔진 초기화
        const engine = await initializeChapterBasedSceneEngine(
          INITIAL_GAME_STATE,
          GAME_CONFIG.initial_chapter_id
        );

        // 챕터 서비스 설정
        engine.setChapterService(chapterService);

        // dispatch 설정
        engine.setDispatch(dispatch);

        setSceneEngine(engine);
        setIsEngineReady(true);
        Logger.info('[GameStateProvider]', '챕터 기반 씬 엔진 초기화 완료');
      } catch (error) {
        Logger.error('[GameStateProvider]', 'SceneEngine 초기화 실패:', error);
        // 에러 발생 시 초기화 플래그 리셋
        setIsInitialized(false);
      }
    };

    initEngine();

    // 클린업 함수 추가 (React 18 개발 모드 테스트)
    return () => {
      Logger.debug('[GameStateProvider]', 'useEffect 클린업');
    };
  }, [isInitialized]);

  /**
   * 게임 상태가 변경될 때 씬 엔진과 동기화합니다.
   */
  useEffect(() => {
    if (sceneEngine) {
      sceneEngine.updateGameState(state);
    }
  }, [state, sceneEngine]);

  /**
   * 엔진이 준비되고 저장된 챕터/씬 정보가 있으면 복원합니다.
   */
  useEffect(() => {
    Logger.debug(
      '[GameStateProvider]',
      `🔍 복원 조건 체크: 엔진=${isEngineReady}, 챕터=${currentChapterId}, 씬=${currentScene?.id}, 복원중=${isRestoring}, 복원완료=${hasRestoredOnce}`
    );

    if (
      !isEngineReady ||
      !sceneEngine ||
      !currentChapterId ||
      !currentScene ||
      isRestoring ||
      hasRestoredOnce // 이미 복원했으면 다시 실행하지 않음
    ) {
      return;
    }

    Logger.info(
      '[GameStateProvider]',
      `📖 저장된 챕터 로드 시도: ${currentChapterId}`
    );
    setIsRestoring(true);

    const restoreSavedScene = async () => {
      try {
        // 해당 챕터 실행하여 씬 엔진에 등록
        await sceneEngine.executeChapter(currentChapterId);

        // 이제 저장된 씬으로 직접 이동 (복원이므로 효과 적용 안함)
        const scene = sceneEngine.getScene(currentScene.id);
        if (scene) {
          setCurrentScene(scene);
          dispatch({ type: 'RESTORE_SCENE', scene }); // 🔧 RESTORE_SCENE 사용
          Logger.info(
            '[GameStateProvider]',
            `✅ 저장된 씬으로 복원 완료: ${currentScene.id} (효과 적용 안함)`
          );

          // 복원 완료 후 현재 챕터 ID가 올바른지 확인하고 수정
          const actualCurrentChapter = sceneEngine.getCurrentChapter();
          if (actualCurrentChapter?.id !== currentChapterId) {
            Logger.warn(
              '[GameStateProvider]',
              `⚠️ 챕터 불일치 감지: 예상=${currentChapterId}, 실제=${actualCurrentChapter?.id}`
            );
            // 불일치 시 현재 챕터 ID를 엔진 상태로 보정
            if (actualCurrentChapter?.id) {
              Logger.info(
                '[GameStateProvider]',
                `🔄 챕터 ID 자동 보정: ${currentChapterId} → ${actualCurrentChapter.id}`
              );
              setCurrentChapterId(actualCurrentChapter.id);
            }
          }
        } else {
          Logger.warn(
            '[GameStateProvider]',
            `⚠️ 저장된 씬을 찾을 수 없음: ${currentScene.id}`
          );
          // 저장된 씬을 찾을 수 없으면 게임 시작
          const startScene = await sceneEngine.startGame();
          if (startScene) {
            setCurrentScene(startScene);
            dispatch({ type: 'LOAD_SCENE', scene: startScene });
          }
        }
      } catch (error) {
        Logger.error('[GameStateProvider]', '저장된 챕터/씬 복원 실패:', error);
        // 복원 실패 시 게임 시작
        try {
          const startScene = await sceneEngine.startGame();
          if (startScene) {
            setCurrentScene(startScene);
            dispatch({ type: 'LOAD_SCENE', scene: startScene });
          }
        } catch (startError) {
          Logger.error('[GameStateProvider]', '게임 시작도 실패:', startError);
        }
      } finally {
        setIsRestoring(false);
        setHasRestoredOnce(true); // 복원 완료 플래그 설정
      }
    };

    restoreSavedScene();
  }, [
    isEngineReady,
    sceneEngine,
    currentChapterId,
    currentScene,
    isRestoring,
    hasRestoredOnce,
  ]);

  /**
   * 현재 씬이나 게임 상태가 변경될 때 자동 저장합니다.
   */
  useEffect(() => {
    // 엔진이 준비되고 현재 씬이 있고 복원 중이 아닐 때만 저장
    if (!isEngineReady || !currentScene || !sceneEngine || isRestoring) {
      return;
    }

    const saveCurrentProgress = async () => {
      try {
        const { AutoSaveManager } = await import(
          '../utils/storage/AutoSaveManager'
        );

        // 현재 챕터 ID 가져오기
        const currentChapter = sceneEngine.getCurrentChapter();
        const chapterId = currentChapter?.id || null;

        await AutoSaveManager.autoSave(state, currentScene, chapterId);

        // 현재 챕터 ID 상태 업데이트 (복원 중이 아닐 때만)
        if (chapterId && chapterId !== currentChapterId && !isRestoring) {
          Logger.info(
            '[GameStateProvider]',
            `🔄 챕터 ID 상태 업데이트: ${currentChapterId} → ${chapterId}`
          );
          setCurrentChapterId(chapterId);
        }
      } catch (error) {
        Logger.warn('[GameStateProvider]', '자동 저장 실패:', error);
      }
    };

    // 100ms 디바운싱으로 과도한 저장 방지
    const timeoutId = setTimeout(saveCurrentProgress, 100);
    return () => clearTimeout(timeoutId);
  }, [
    state,
    currentScene,
    isEngineReady,
    sceneEngine,
    currentChapterId,
    isRestoring,
  ]);

  /**
   * 게임오버 상태를 감지하고 처리합니다.
   */
  useEffect(() => {
    const gameOverStatus = checkGameOver(state);
    if (gameOverStatus !== isGameOver) {
      setIsGameOver(gameOverStatus);
      if (gameOverStatus) {
        Logger.warn(
          '[GameStateProvider]',
          '🚨 게임오버 상태가 감지되었습니다.'
        );
      }
    }
  }, [state.health, state.mind, state.flags, isGameOver]);

  /**
   * 씬을 로드하고 효과를 적용합니다.
   * @param scene - 로드할 씬
   */
  const loadScene = (scene: Scene) => {
    setCurrentScene(scene);
    dispatch({ type: 'LOAD_SCENE', scene });
  };

  /**
   * 실패 후 게임 상태를 초기화합니다.
   * 체력과 정신력을 회복하고 일시적 아이템과 태그를 제거합니다.
   */
  const resetAfterFailure = () => {
    dispatch({ type: 'RESET_AFTER_FAILURE' });
  };

  /**
   * 게임을 시작합니다.
   * 씬 엔진을 통해 게임을 시작하고 첫 번째 씬을 반환합니다.
   * @returns 시작 씬 또는 null
   */
  const startGame = async (): Promise<Scene | null> => {
    if (!sceneEngine) {
      Logger.error('[GameStateProvider]', '씬 엔진이 초기화되지 않았습니다.');
      return null;
    }

    try {
      const startScene = await sceneEngine.startGame();
      if (startScene) {
        loadScene(startScene);
      }
      return startScene;
    } catch (error) {
      Logger.error('[GameStateProvider]', '게임 시작 실패:', error);
      return null;
    }
  };

  /**
   * 플레이어가 선택한 선택지를 처리합니다.
   * 씬 엔진을 통해 선택지를 처리하고 다음 씬을 반환합니다.
   * @param choiceIndex - 선택한 선택지 인덱스
   * @returns 다음 씬 또는 null
   */
  const selectChoice = async (choiceIndex: number): Promise<Scene | null> => {
    if (!sceneEngine) {
      Logger.error('[GameStateProvider]', '씬 엔진이 초기화되지 않았습니다.');
      return null;
    }

    try {
      // 현재 UI에 표시된 씬을 엔진에 전달하여 상태 동기화 보장
      const nextScene = await sceneEngine.selectChoice(
        choiceIndex,
        currentScene || undefined
      );
      if (nextScene) {
        loadScene(nextScene);
      }
      return nextScene;
    } catch (error) {
      Logger.error('[GameStateProvider]', '선택지 처리 실패:', error);
      return null;
    }
  };

  /**
   * 특정 챕터를 실행합니다.
   * 씬 엔진을 통해 챕터를 실행하고 첫 번째 씬을 반환합니다.
   * @param chapterId - 실행할 챕터 ID
   * @returns 선택된 씬 또는 null
   */
  const executeChapter = async (chapterId: string): Promise<Scene | null> => {
    if (!sceneEngine) {
      Logger.error('[GameStateProvider]', '씬 엔진이 초기화되지 않았습니다.');
      return null;
    }

    try {
      const firstScene = await sceneEngine.executeChapter(chapterId);
      if (firstScene) {
        loadScene(firstScene);
      }
      return firstScene;
    } catch (error) {
      Logger.error('[GameStateProvider]', '챕터 실행 실패:', error);
      return null;
    }
  };

  const contextValue: GameStateContextType = {
    state,
    dispatch,
    loadScene,
    resetAfterFailure,
    sceneEngine,
    currentScene,
    isEngineReady,
    isGameOver,
    startGame,
    selectChoice,
    executeChapter,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}
