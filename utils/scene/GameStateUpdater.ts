import { GameState, SceneId } from '../../types';
import { Logger } from '../system/Logger';

/**
 * 게임 상태 업데이터
 * 게임 상태 변경 로직을 담당합니다.
 */
export class GameStateUpdater {
  private gameState: GameState;
  private completedScenes: Set<SceneId> = new Set();

  constructor(initialGameState: GameState) {
    this.gameState = initialGameState;
    // 완료된 씬들을 Set으로 초기화
    (this.gameState.completed_scenes ?? []).forEach(sceneId => {
      this.completedScenes.add(sceneId);
    });
  }

  /**
   * 게임 상태를 업데이트합니다.
   * @param newGameState - 새로운 게임 상태
   */
  updateGameState(newGameState: GameState): void {
    this.gameState = newGameState;

    // 완료된 씬들을 Set으로 업데이트
    this.completedScenes.clear();
    (this.gameState.completed_scenes ?? []).forEach(sceneId => {
      this.completedScenes.add(sceneId);
    });
  }

  /**
   * 현재 게임 상태를 반환합니다.
   * @returns 현재 게임 상태
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * 씬을 완료 상태로 표시합니다.
   * @param sceneId - 완료할 씬 ID
   */
  completeScene(sceneId: SceneId): void {
    if (!this.completedScenes.has(sceneId)) {
      this.completedScenes.add(sceneId);
      if (!this.gameState.completed_scenes) {
        this.gameState.completed_scenes = [];
      }
      this.gameState.completed_scenes.push(sceneId);
      Logger.info('[GameStateUpdater]', `씬 완료: ${sceneId}`);
    }
  }

  /**
   * 씬이 완료되었는지 확인합니다.
   * @param sceneId - 확인할 씬 ID
   * @returns 완료 여부
   */
  isSceneCompleted(sceneId: SceneId): boolean {
    return this.completedScenes.has(sceneId);
  }

  /**
   * 완료된 씬 목록을 반환합니다.
   * @returns 완료된 씬 ID 배열
   */
  getCompletedScenes(): SceneId[] {
    return Array.from(this.completedScenes);
  }

  /**
   * 씬을 자동 완료 처리합니다.
   * @param sceneId - 완료할 씬 ID
   */
  autoCompleteScene(sceneId: SceneId): void {
    if (!this.isSceneCompleted(sceneId)) {
      this.completeScene(sceneId);
      Logger.info('[GameStateUpdater]', `씬 자동 완료: ${sceneId}`);
    }
  }

  /**
   * 게임 상태 통계를 반환합니다.
   * @returns 게임 상태 통계
   */
  getGameStateStats(): {
    completedScenesCount: number;
    totalStats: number;
    totalResources: number;
    totalItems: number;
  } {
    const stats = Object.keys(this.gameState).filter(
      key =>
        typeof this.gameState[key as keyof GameState] === 'number' &&
        !['completed_scenes', 'flags'].includes(key)
    ).length;

    const resources = Object.keys(this.gameState).filter(
      key =>
        key.startsWith('resource_') &&
        typeof this.gameState[key as keyof GameState] === 'number'
    ).length;

    const items = (this.gameState.items ?? []).length;

    return {
      completedScenesCount: this.completedScenes.size,
      totalStats: stats,
      totalResources: resources,
      totalItems: items,
    };
  }

  /**
   * 디버그 정보를 출력합니다.
   */
  debugInfo(): void {
    const _stats = this.getGameStateStats();
    // Logger.debug('[GameStateUpdater]', '=== 디버그 정보 ===');
    // Logger.debug('[GameStateUpdater]', `완료된 씬 수: ${stats.completedScenesCount}`);
    // Logger.debug('[GameStateUpdater]', `총 능력치 수: ${stats.totalStats}`);
    // Logger.debug('[GameStateUpdater]', `총 자원 수: ${stats.totalResources}`);
    // Logger.debug('[GameStateUpdater]', `총 아이템 수: ${stats.totalItems}`);

    // 완료된 씬 목록 출력 (최대 10개)
    const _completedScenes = Array.from(this.completedScenes).slice(0, 10);
    // Logger.debug('[GameStateUpdater]', `완료된 씬 목록 (최대 10개): ${completedScenes.join(', ')}`);

    // if (this.completedScenes.size > 10) {
    //   Logger.debug('[GameStateUpdater]', `... 외 ${this.completedScenes.size - 10}개 더`);
    // }
    // Logger.debug('[GameStateUpdater]', '====================');
  }
}
