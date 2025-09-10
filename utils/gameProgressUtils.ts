import { GAME_PROGRESS, GAME_PROGRESS_KEYS } from '../constants/gameConfig';
import { GameState, SceneId } from '../types';

/**
 * 게임 진행 상태 관련 유틸리티 함수들
 */

/**
 * 게임 진행 상태의 유효성을 검증합니다.
 * GAME_PROGRESS_KEYS를 활용하여 모든 필수 진행 상태가 올바른지 확인합니다.
 * @param gameState - 검증할 게임 상태
 * @returns 검증 결과와 오류 메시지
 */
export const validateGameProgress = (
  gameState: GameState
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  for (const progressKey of GAME_PROGRESS_KEYS) {
    const value = gameState[progressKey];
    const config = GAME_PROGRESS[progressKey];

    // 값이 존재하는지 확인
    if (value === undefined || value === null) {
      errors.push(`🚨 진행 상태 누락: ${config.displayName} (${progressKey})`);
      continue;
    }

    // 타입별 검증
    switch (progressKey) {
      case 'current_floor':
        if (typeof value !== 'number' || value < 1) {
          errors.push(`🚨 잘못된 현재 층: ${value} (1 이상이어야 함)`);
        }
        break;
      case 'death_count':
        if (typeof value !== 'number' || value < 0) {
          errors.push(`🚨 잘못된 사망 횟수: ${value} (0 이상이어야 함)`);
        }
        break;
      case 'death_count_by_floor':
        if (typeof value !== 'object' || value === null) {
          errors.push(
            `🚨 잘못된 층별 사망 횟수: ${typeof value} (객체여야 함)`
          );
        }
        break;
      case 'completed_scenes':
        if (!Array.isArray(value)) {
          errors.push(
            `🚨 잘못된 완료 씬 목록: ${typeof value} (배열이어야 함)`
          );
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 게임 진행 상태 통계를 계산합니다.
 * GAME_PROGRESS_KEYS를 활용하여 모든 진행 상태의 요약 정보를 제공합니다.
 * @param gameState - 게임 상태
 * @returns 진행 상태 통계
 */
export const getGameProgressStats = (gameState: GameState) => {
  const stats: Record<string, any> = {};

  for (const progressKey of GAME_PROGRESS_KEYS) {
    const value = gameState[progressKey];
    const config = GAME_PROGRESS[progressKey];

    switch (progressKey) {
      case 'current_floor':
        stats.currentFloor = {
          value,
          displayName: config.displayName,
          description: `현재 ${value}층에 위치`,
        };
        break;
      case 'death_count':
        stats.totalDeaths = {
          value,
          displayName: config.displayName,
          description: `총 ${value}번 사망`,
        };
        break;
      case 'death_count_by_floor':
        const currentFloorDeaths =
          (value as Record<number, number>)[gameState.current_floor] || 0;
        stats.currentFloorDeaths = {
          value: currentFloorDeaths,
          displayName: '현재 층 사망 횟수',
          description: `${gameState.current_floor}층에서 ${currentFloorDeaths}번 사망`,
        };
        break;
      case 'completed_scenes':
        stats.completedScenes = {
          value: (value as string[]).length,
          displayName: config.displayName,
          description: `총 ${(value as string[]).length}개 씬 완료`,
        };
        break;
    }
  }

  return stats;
};

/**
 * 게임 진행 상태를 초기값으로 리셋합니다.
 * GAME_PROGRESS 상수를 활용하여 안전하게 초기화합니다.
 * @param gameState - 현재 게임 상태
 * @returns 진행 상태가 초기화된 게임 상태
 */
export const resetGameProgress = (gameState: GameState): GameState => {
  const resetData: Partial<GameState> = {};

  for (const progressKey of GAME_PROGRESS_KEYS) {
    const config = GAME_PROGRESS[progressKey];
    (resetData as any)[progressKey] = config.initialValue;
  }

  return {
    ...gameState,
    ...resetData,
  };
};

/**
 * 현재 층의 사망 횟수를 가져옴
 * @param gameState - 게임 상태
 * @returns 현재 층 사망 횟수
 */
export const getCurrentFloorDeathCount = (gameState: GameState): number => {
  return gameState.death_count_by_floor[gameState.current_floor] || 0;
};

/**
 * 특정 층의 사망 횟수를 가져옴
 * @param gameState - 게임 상태
 * @param floor - 층 번호
 * @returns 해당 층 사망 횟수
 */
export const getFloorDeathCount = (
  gameState: GameState,
  floor: number
): number => {
  return gameState.death_count_by_floor[floor] || 0;
};

/**
 * 사망 횟수를 증가시킨 새로운 상태를 반환
 * @param gameState - 게임 상태
 * @returns 업데이트된 게임 상태
 */
export const incrementDeathCount = (gameState: GameState): GameState => {
  const currentFloor = gameState.current_floor;
  const currentFloorDeathCount = getCurrentFloorDeathCount(gameState);

  return {
    ...gameState,
    death_count: gameState.death_count + 1,
    death_count_by_floor: {
      ...gameState.death_count_by_floor,
      [currentFloor]: currentFloorDeathCount + 1,
    },
  };
};

/**
 * 특정 층의 사망 횟수를 증가시킨 새로운 상태를 반환
 * @param gameState - 게임 상태
 * @param floor - 층 번호
 * @returns 업데이트된 게임 상태
 */
export const incrementFloorDeathCount = (
  gameState: GameState,
  floor: number
): GameState => {
  const floorDeathCount = getFloorDeathCount(gameState, floor);

  return {
    ...gameState,
    death_count_by_floor: {
      ...gameState.death_count_by_floor,
      [floor]: floorDeathCount + 1,
    },
  };
};

/**
 * 층을 설정한 새로운 상태를 반환
 * @param gameState - 게임 상태
 * @param floor - 설정할 층 번호
 * @returns 업데이트된 게임 상태
 */
export const setFloor = (gameState: GameState, floor: number): GameState => {
  return {
    ...gameState,
    current_floor: floor,
  };
};

/**
 * 특정 씬을 완료 처리
 * @param gameState - 현재 게임 상태
 * @param sceneId - 완료할 씬 ID
 * @returns 업데이트된 게임 상태
 */
export const completeScene = (
  gameState: GameState,
  sceneId: SceneId
): GameState => {
  if (gameState.completed_scenes.includes(sceneId)) return gameState;
  return {
    ...gameState,
    completed_scenes: [...gameState.completed_scenes, sceneId],
  };
};

/**
 * 챕터 전환 시 완료된 씬 목록을 초기화
 * 새로운 챕터에서 랜덤 씬 선택이 제대로 작동하도록 합니다.
 * @param gameState - 현재 게임 상태
 * @returns 업데이트된 게임 상태
 */
export const resetChapterCompletedScenes = (
  gameState: GameState
): GameState => {
  return {
    ...gameState,
    completed_scenes: [],
  };
};

/**
 * 게임 진행 상태를 포맷팅하여 반환
 * @param gameState - 게임 상태
 * @returns 포맷팅된 문자열
 */
export const formatGameProgress = (gameState: GameState): string => {
  const currentFloorDeathCount = getCurrentFloorDeathCount(gameState);
  return `층: ${gameState.current_floor} | 전체 사망: ${gameState.death_count} | 현재 층 사망: ${currentFloorDeathCount} | 완료 씬: ${gameState.completed_scenes.length}`;
};

/**
 * 게임 진행 상태의 유효성 검사
 * @param gameState - 검사할 게임 상태
 * @returns 유효성 여부
 */
export const isValidGameProgress = (gameState: GameState): boolean => {
  return (
    gameState.current_floor >= 1 &&
    gameState.death_count >= 0 &&
    gameState.completed_scenes.length >= 0
  );
};
