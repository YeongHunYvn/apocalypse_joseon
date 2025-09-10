import { Choice, GameState, Scene } from '../../types';
import { Logger } from '../system/Logger';

import { ConditionChecker } from './conditions/ConditionChecker';

/**
 * 씬 필터
 * 씬과 선택지 필터링 로직을 담당합니다.
 */
export class SceneFilter {
  /**
   * 조건에 맞는 씬만 필터링
   * @param scenes - 전체 씬 배열
   * @param gameState - 현재 게임 상태
   * @returns 조건에 맞는 씬 배열
   */
  static filterScenesByCondition(
    scenes: Scene[],
    gameState: GameState
  ): Scene[] {
    return scenes.filter(scene => {
      if (!scene.condition) return true; // 조건이 없으면 항상 실행 가능
      return ConditionChecker.checkCondition(scene.condition, gameState);
    });
  }

  /**
   * 랜덤 선택 가능한 씬만 필터링
   *
   * 다음 순서로 필터링합니다:
   * 1. 조건이 안 되는 경우 선택 불가
   * 2. 해당 씬을 이미 본 경우, repeatable(true, false, undefined) 속성이 false거나 없으면 선택 불가
   * 3. 랜덤 선택 가능 여부(true, false, undefined)가 false 또는 없으면 선택 불가
   * 나머지는 선택 가능.
   *
   * @param scenes - 전체 씬 배열
   * @param gameState - 현재 게임 상태
   * @returns 랜덤 선택 가능한 씬 배열
   */
  static filterRandomSelectableScenes(
    scenes: Scene[],
    gameState: GameState
  ): Scene[] {
    return scenes.filter(scene => {
      // 1. 조건이 안 되는 경우 선택 불가
      if (scene.condition) {
        if (!ConditionChecker.checkCondition(scene.condition, gameState)) {
          return false;
        }
      }

      // 2. 해당 씬을 이미 본 경우, repeatable(true, false, undefined) 속성이 false거나 없으면 선택 불가
      const isCompleted = (gameState.completed_scenes ?? []).includes(scene.id);
      if (isCompleted && !scene.repeatable) {
        return false;
      }

      // 랜덤 선택 가능 여부가 false 또는 undefined(기본값 false)인 경우 선택 불가
      if (!scene.random_selectable) {
        return false;
      }

      // 나머지는 선택 가능
      return true;
    });
  }

  /**
   * 씬에서 선택 가능한 선택지 필터링
   * @param scene - 현재 씬
   * @param gameState - 현재 게임 상태
   * @returns 선택 가능한 선택지 배열
   */
  static getAvailableChoices(scene: Scene, gameState: GameState): Choice[] {
    // 씬에 choices가 없거나 undefined인 경우 빈 배열 반환
    if (!scene.choices || !Array.isArray(scene.choices)) {
      Logger.warn('[SceneFilter]', `씬 ${scene.id}에 선택지가 없습니다.`);
      return [];
    }

    return scene.choices.filter(choice => {
      if (!choice.condition) return true; // 조건이 없으면 항상 선택 가능

      const conditionMet = ConditionChecker.checkCondition(
        choice.condition,
        gameState
      );

      // visible_if_failed_condition이 false이면 조건이 맞지 않을 때 숨김
      if (choice.visible_if_failed_condition === false && !conditionMet) {
        return false;
      }

      return true;
    });
  }

  /**
   * 완료된 씬들을 필터링합니다.
   * @param scenes - 전체 씬 배열
   * @param gameState - 현재 게임 상태
   * @returns 완료되지 않은 씬 배열
   */
  static filterIncompleteScenes(
    scenes: Scene[],
    gameState: GameState
  ): Scene[] {
    return scenes.filter(
      scene => !(gameState.completed_scenes ?? []).includes(scene.id)
    );
  }

  /**
   * 특정 타입의 씬들을 필터링합니다.
   * @param scenes - 전체 씬 배열
   * @param type - 필터링할 씬 타입
   * @returns 해당 타입의 씬 배열
   */
  static filterScenesByType(
    scenes: Scene[],
    type: 'main' | 'side' | 'event'
  ): Scene[] {
    return scenes.filter(scene => scene.type === type);
  }

  /**
   * 조건을 만족하는 선택지만 필터링합니다.
   * @param choices - 전체 선택지 배열
   * @param gameState - 현재 게임 상태
   * @returns 조건을 만족하는 선택지 배열
   */
  static filterChoicesByCondition(
    choices: Choice[],
    gameState: GameState
  ): Choice[] {
    // choices가 없거나 undefined인 경우 빈 배열 반환
    if (!choices || !Array.isArray(choices)) {
      Logger.warn('[SceneFilter]', '선택지 배열이 유효하지 않습니다.');
      return [];
    }

    return choices.filter(choice => {
      if (!choice.condition) return true;
      return ConditionChecker.checkCondition(choice.condition, gameState);
    });
  }

  /**
   * 보이는 선택지만 필터링합니다.
   * @param choices - 전체 선택지 배열
   * @param gameState - 현재 게임 상태
   * @returns 보이는 선택지 배열
   */
  static filterVisibleChoices(
    choices: Choice[],
    gameState: GameState
  ): Choice[] {
    // choices가 없거나 undefined인 경우 빈 배열 반환
    if (!choices || !Array.isArray(choices)) {
      Logger.warn('[SceneFilter]', '선택지 배열이 유효하지 않습니다.');
      return [];
    }

    return choices.filter(choice => {
      if (!choice.condition) return true;

      const conditionMet = ConditionChecker.checkCondition(
        choice.condition,
        gameState
      );

      // visible_if_failed_condition이 false이면 조건이 맞지 않을 때 숨김
      if (choice.visible_if_failed_condition === false && !conditionMet) {
        return false;
      }

      return true;
    });
  }
}
