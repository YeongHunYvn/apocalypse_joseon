import { Chapter, Scene } from '../../types';
import { Logger } from '../system/Logger';
import { ConditionChecker } from './conditions/ConditionChecker';
import { SceneFilter } from './SceneFilter';

/**
 * 씬 선택자
 * 랜덤 선택, 조건 기반 선택을 담당합니다.
 */
export class SceneSelector {
  constructor() {}

  /**
   * 주어진 씬 배열에서 랜덤하게 씬을 선택합니다.
   * @param scenes - 씬 배열
   * @param gameState - 게임 상태 (필터링에 필요)
   * @returns 선택된 씬 또는 null
   */
  selectRandomFromScenes(scenes: Scene[], gameState: any): Scene | null {
    if (scenes.length === 0) {
      Logger.warn('[SceneSelector]', '선택 가능한 씬이 없습니다.');
      return null;
    }

    // 1단계: 우선순위 조건을 만족하는 씬 찾기
    const priorityScene = this.selectPriorityScenes(scenes, gameState);
    if (priorityScene) {
      return priorityScene;
    }

    // 2단계: 우선순위 씬이 없으면 일반 필터링 후 랜덤 선택
    return this.selectFilteredRandomScene(scenes, gameState);
  }

  /**
   * 주어진 씬 목록에서 우선순위 조건을 만족하는 씬을 찾고 그 중 랜덤 반환합니다.
   * @param scenes - 씬 배열
   * @param gameState - 게임 상태
   * @returns 선택된 우선순위 씬 또는 null
   */
  selectPriorityScenes(scenes: Scene[], gameState: any): Scene | null {
    const priorityScenes = scenes.filter(scene => {
      // 우선순위 조건이 없으면 제외
      if (!scene.priority_condition) {
        return false;
      }

      // 우선순위 조건에서는 일반 condition과 random_selectable을 무시
      // // 기본 필터링 조건들 먼저 체크
      // // 1) random_selectable이 true여야 함
      // if (!scene.random_selectable) {
      //   return false;
      // }

      // // 2) 일반 조건 체크
      // if (scene.condition) {
      //   if (!ConditionChecker.checkCondition(scene.condition, gameState)) {
      //     return false;
      //   }
      // }

      // 3) repeatable 체크
      const isCompleted = (gameState.completed_scenes ?? []).includes(scene.id);
      if (isCompleted && !scene.repeatable) {
        return false;
      }

      // 우선순위 조건 체크
      const meetsPriorityCondition = ConditionChecker.checkCondition(
        scene.priority_condition,
        gameState
      );

      if (meetsPriorityCondition) {
        Logger.debug(
          '[SceneSelector]',
          `우선순위 조건 만족 씬 발견: ${scene.id}`
        );
        return true;
      }

      return false;
    });

    // 우선순위 씬이 있으면 그 중에서 랜덤 선택
    if (priorityScenes.length > 0) {
      const randomIndex = Math.floor(Math.random() * priorityScenes.length);
      const selectedScene = priorityScenes[randomIndex];

      Logger.debug(
        '[SceneSelector]',
        `우선순위 씬 선택: ${selectedScene.id} (우선순위 씬 ${priorityScenes.length}개 중 ${randomIndex + 1}번째)`
      );
      return selectedScene;
    }

    return null;
  }

  /**
   * 주어진 씬 목록에서 랜덤 선택 가능한 씬을 필터링하고 그 중 랜덤 반환합니다.
   * @param scenes - 씬 배열
   * @param gameState - 게임 상태
   * @returns 선택된 씬 또는 null
   */
  selectFilteredRandomScene(scenes: Scene[], gameState: any): Scene | null {
    const filteredScenes = SceneFilter.filterRandomSelectableScenes(
      scenes,
      gameState
    );

    if (filteredScenes.length === 0) {
      Logger.debug('[SceneSelector]', '필터링 후 선택 가능한 씬이 없습니다.');
      return null;
    }

    const randomIndex = Math.floor(Math.random() * filteredScenes.length);
    const selectedScene = filteredScenes[randomIndex];

    Logger.debug(
      '[SceneSelector]',
      `일반 랜덤 씬 선택: ${selectedScene.id} (${filteredScenes.length}개 중 ${randomIndex + 1}번째)`
    );
    return selectedScene;
  }

  /**
   * 현재 챕터에서 랜덤하게 씬을 선택합니다.
   * @param currentChapter - 현재 챕터
   * @param gameState - 게임 상태 (필터링에 필요)
   * @returns 선택된 씬 또는 null
   */
  async selectRandomFromCurrentChapter(
    currentChapter: Chapter | null,
    gameState: any
  ): Promise<Scene | null> {
    if (!currentChapter) {
      Logger.error('[SceneSelector]', '현재 챕터가 설정되지 않았습니다.');
      return null;
    }

    // 현재 챕터 범위 내에서만 씬을 선택
    return this.selectRandomFromScenes(currentChapter.scenes, gameState);
  }

  /**
   * 디버그 정보를 출력합니다.
   */
  debugInfo(): void {
    Logger.debug('[SceneSelector]', '=== 디버그 정보 ===');
    Logger.debug('[SceneSelector]', '챕터 스코프 기반 선택자 동작 중');
    Logger.debug('[SceneSelector]', '====================');
  }
}
