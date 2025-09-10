import { GameState, SceneId } from '../../types';
import { GameStorage } from '../storage';
import { Logger } from '../system/Logger';

/**
 * 씬 방문 이력을 관리하는 유틸리티 클래스
 * 최초 방문 감지와 저장소 연동을 제공합니다.
 */
export class VisitedScenesManager {
  /**
   * 특정 씬이 최초 방문인지 확인합니다.
   * @param sceneId - 확인할 씬 ID
   * @param gameState - 현재 게임 상태
   * @returns 최초 방문 여부 (true: 최초 방문, false: 재방문)
   */
  static isFirstVisit(sceneId: SceneId, gameState: GameState): boolean {
    if (!gameState.visited_scenes) {
      return true; // visited_scenes가 없으면 최초 방문으로 간주
    }
    return !gameState.visited_scenes.includes(sceneId);
  }

  /**
   * 씬을 방문했음을 기록합니다.
   * @param sceneId - 방문한 씬 ID
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 visited_scenes 배열
   */
  static markAsVisited(sceneId: SceneId, gameState: GameState): SceneId[] {
    if (!gameState.visited_scenes) {
      gameState.visited_scenes = [];
    }

    // 이미 방문한 씬이면 중복 추가하지 않음
    if (!gameState.visited_scenes.includes(sceneId)) {
      gameState.visited_scenes.push(sceneId);
      Logger.debug('[VisitedScenes]', `씬 최초 방문 기록: ${sceneId}`);
    }

    // 저장소에 저장
    this.saveToStorage(gameState.visited_scenes);

    return [...gameState.visited_scenes];
  }

  /**
   * 방문 이력을 저장소에 저장합니다.
   * @param visitedScenes - 방문한 씬 ID 배열
   */
  static async saveToStorage(visitedScenes: SceneId[]): Promise<void> {
    try {
      await GameStorage.saveVisitedScenes(visitedScenes);
    } catch (error) {
      Logger.warn('[VisitedScenes]', '방문 이력 저장 실패:', error);
    }
  }

  /**
   * 방문 이력을 저장소에서 로드합니다.
   * @returns 저장된 방문 씬 ID 배열 (없으면 빈 배열)
   */
  static async loadFromStorage(): Promise<SceneId[]> {
    try {
      return await GameStorage.loadVisitedScenes();
    } catch (error) {
      Logger.warn('[VisitedScenes]', '방문 이력 로드 실패:', error);
      return [];
    }
  }

  /**
   * 게임 상태의 방문 이력을 저장소와 동기화합니다.
   * @param gameState - 게임 상태
   * @returns 동기화된 visited_scenes 배열
   */
  static async syncWithStorage(gameState: GameState): Promise<SceneId[]> {
    try {
      const storedVisitedScenes = await this.loadFromStorage();

      if (!gameState.visited_scenes) {
        gameState.visited_scenes = storedVisitedScenes;
      } else {
        // 현재 게임 상태와 저장된 데이터를 병합 (중복 제거)
        const mergedScenes = [
          ...new Set([...gameState.visited_scenes, ...storedVisitedScenes]),
        ];
        gameState.visited_scenes = mergedScenes;
      }

      // 최신 상태를 다시 저장
      await this.saveToStorage(gameState.visited_scenes);

      return [...gameState.visited_scenes];
    } catch (error) {
      Logger.warn('[VisitedScenes]', '방문 이력 동기화 실패:', error);
      return gameState.visited_scenes || [];
    }
  }

  /**
   * 방문 이력을 초기화합니다.
   * @param gameState - 게임 상태
   * @param clearStorage - 저장소도 함께 초기화할지 여부 (기본값: false)
   */
  static async clearVisitedScenes(
    gameState: GameState,
    clearStorage: boolean = false
  ): Promise<void> {
    gameState.visited_scenes = [];

    if (clearStorage) {
      try {
        await GameStorage.saveVisitedScenes([]);
        Logger.info(
          '[VisitedScenes]',
          '🗑️ 방문 이력 초기화 완료 (저장소 포함)'
        );
      } catch (error) {
        Logger.warn('[VisitedScenes]', '방문 이력 저장소 삭제 실패:', error);
      }
    } else {
      Logger.info('[VisitedScenes]', '🗑️ 방문 이력 초기화 완료 (메모리만)');
    }
  }

  /**
   * 방문 이력 통계를 조회합니다.
   * @param gameState - 게임 상태
   * @returns 방문 이력 통계 정보
   */
  static getVisitStats(gameState: GameState): {
    totalVisited: number;
    visitedScenes: SceneId[];
    lastVisited: SceneId | null;
  } {
    const visitedScenes = gameState.visited_scenes || [];

    return {
      totalVisited: visitedScenes.length,
      visitedScenes: [...visitedScenes],
      lastVisited:
        visitedScenes.length > 0
          ? visitedScenes[visitedScenes.length - 1]
          : null,
    };
  }

  /**
   * 특정 패턴으로 방문한 씬들을 필터링합니다.
   * @param gameState - 게임 상태
   * @param pattern - 필터링할 패턴 (예: 'scn_rest_', 'scn_story_floor_1')
   * @returns 패턴에 맞는 방문한 씬 ID 배열
   */
  static getVisitedScenesWithPattern(
    gameState: GameState,
    pattern: string
  ): SceneId[] {
    const visitedScenes = gameState.visited_scenes || [];
    return visitedScenes.filter(sceneId => sceneId.includes(pattern));
  }
}
