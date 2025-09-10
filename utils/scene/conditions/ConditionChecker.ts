import { RESOURCE_KEYS, STAT_KEYS } from '../../../constants/gameConfig';
import { AtomicCondition, Condition, GameState } from '../../../types';
import {
  isBuffKey,
  isFlagKey,
  isMinMaxRange,
  isSkillKey,
} from '../../typeGuards';

import { ExperienceManager } from '../../ExperienceManager';
import { isVariableKey } from '../../dataLoader';

/**
 * 조건 확인기
 * 씬과 선택지의 조건을 확인하는 로직을 담당합니다.
 */
export class ConditionChecker {
  /**
   * 숫자 값과 조건(숫자 또는 min/max 범위)을 비교합니다.
   * @param currentValue - 현재 값
   * @param condition - 비교할 조건 (숫자 또는 min/max 범위)
   * @returns 조건 충족 여부
   */
  private static checkNumericCondition(
    currentValue: number,
    condition: number | { min?: number; max?: number }
  ): boolean {
    if (typeof condition === 'number') {
      return currentValue === condition;
    } else if (isMinMaxRange(condition)) {
      if (condition.min !== undefined && currentValue < condition.min)
        return false;
      if (condition.max !== undefined && currentValue > condition.max)
        return false;
      return true;
    }
    return false;
  }
  /**
   * 조건 확인 함수 (MongoDB 스타일 논리 연산자 + 기존 방식 혼용)
   * $and, $or 연산자 또는 직접 AtomicCondition 처리
   * @param condition - 확인할 조건 (Condition 또는 AtomicCondition)
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkCondition(
    condition: Condition | any,
    gameState: GameState
  ): boolean {
    // $and 처리: 모든 조건이 참이어야 함
    if ('$and' in condition && condition.$and) {
      return condition.$and.every((subCondition: AtomicCondition | Condition) =>
        this.checkCondition(subCondition, gameState)
      );
    }

    // $or 처리: 조건 중 하나라도 참이면 됨
    if ('$or' in condition && condition.$or) {
      return condition.$or.some((subCondition: AtomicCondition | Condition) =>
        this.checkCondition(subCondition, gameState)
      );
    }

    // 논리 연산자가 없는 경우, 직접 AtomicCondition으로 처리
    return this.checkAtomicCondition(condition, gameState);
  }

  /**
   * 원자적 조건 확인 함수 (기존 checkCondition 로직)
   * @param condition - 원자적 조건
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  private static checkAtomicCondition(
    condition: AtomicCondition,
    gameState: GameState
  ): boolean {
    // 능력치 조건 확인 (자동화)
    for (const statKey of STAT_KEYS as (keyof GameState)[]) {
      if (statKey in condition) {
        const statValue = condition[statKey as keyof Condition] as
          | number
          | { min?: number; max?: number };
        const currentValue = gameState[statKey];

        // 타입 가드: 능력치는 number 타입
        if (typeof currentValue === 'number') {
          if (!this.checkNumericCondition(currentValue, statValue))
            return false;
        }
      }
    }

    // 자원 조건 확인 (자동화)
    for (const resourceKey of RESOURCE_KEYS) {
      if (resourceKey in condition) {
        const resourceValue = condition[resourceKey as keyof Condition] as
          | number
          | { min?: number; max?: number };
        const currentValue = gameState[resourceKey as keyof GameState];

        // 타입 가드: 자원은 number 타입
        if (typeof currentValue === 'number') {
          if (!this.checkNumericCondition(currentValue, resourceValue))
            return false;
        }
      }
    }

    // 상태 조건 확인 (in / not_in)
    if (condition.buffs) {
      // 구버전 배열 스키마는 허용하지 않음 (명시적으로 실패)
      if (Array.isArray(condition.buffs)) {
        return false;
      }
      const buffsCondition = condition.buffs as {
        in?: string[];
        not_in?: string[];
      };
      const currentBuffs = gameState.buffs ?? [];

      if (buffsCondition.in && buffsCondition.in.length > 0) {
        for (const buffId of buffsCondition.in) {
          if (isBuffKey(buffId) && !currentBuffs.includes(buffId)) {
            return false;
          }
        }
      }

      if (buffsCondition.not_in && buffsCondition.not_in.length > 0) {
        for (const buffId of buffsCondition.not_in) {
          if (isBuffKey(buffId) && currentBuffs.includes(buffId)) {
            return false;
          }
        }
      }
    }

    // 플래그 조건 확인 (in / not_in)
    if (condition.flags) {
      // 구버전 배열 스키마는 허용하지 않음 (명시적으로 실패)
      if (Array.isArray(condition.flags)) {
        return false;
      }
      const flagsCondition = condition.flags as {
        in?: string[];
        not_in?: string[];
      };
      const currentFlags = gameState.flags ?? [];

      if (flagsCondition.in && flagsCondition.in.length > 0) {
        for (const flagId of flagsCondition.in) {
          if (isFlagKey(flagId) && !currentFlags.includes(flagId)) {
            return false;
          }
        }
      }

      if (flagsCondition.not_in && flagsCondition.not_in.length > 0) {
        for (const flagId of flagsCondition.not_in) {
          if (isFlagKey(flagId) && currentFlags.includes(flagId)) {
            return false;
          }
        }
      }
    }

    // 아이템 조건 확인
    if (condition.items) {
      for (const [itemId, conditionValue] of Object.entries(condition.items)) {
        const item = (gameState.items ?? []).find(item => item.id === itemId);

        // 개수 조건 (number 또는 MinMaxRange)
        // 아이템이 없으면 수량을 0으로 처리
        const currentQuantity = item?.quantity ?? 0;
        if (!this.checkNumericCondition(currentQuantity, conditionValue)) {
          return false;
        }
      }
    }

    // 변수 조건 확인
    if (condition.variables) {
      for (const [variableId, conditionValue] of Object.entries(
        condition.variables
      )) {
        if (isVariableKey(variableId)) {
          const currentValue = gameState.variables?.[variableId] ?? 0;

          if (!this.checkNumericCondition(currentValue, conditionValue)) {
            return false;
          }
        }
      }
    }

    // 스킬 레벨 조건 확인
    if (condition.skills) {
      for (const [skillId, condValue] of Object.entries(condition.skills)) {
        if (isSkillKey(skillId)) {
          const currentLevel = gameState.levels?.[skillId] || 0;
          if (!this.checkNumericCondition(currentLevel, condValue as any)) {
            return false;
          }
        }
      }
    }

    // 통합 경험치 시스템 - 레벨업 가능 여부 확인
    if (condition.can_level_up) {
      const canLevelUp = ExperienceManager.canLevelUp(
        condition.can_level_up,
        gameState
      );
      if (!canLevelUp) {
        return false;
      }
    }

    // 게임 진행 상태 조건 확인
    if (condition.current_floor !== undefined) {
      if (gameState.current_floor !== condition.current_floor) return false;
    }

    if (condition.death_count !== undefined) {
      if (
        !this.checkNumericCondition(
          gameState.death_count,
          condition.death_count
        )
      )
        return false;
    }

    if (condition.death_count_by_floor !== undefined) {
      const floorCounts = condition.death_count_by_floor;
      for (const [floorStr, value] of Object.entries(floorCounts)) {
        const floorNum = parseInt(floorStr);
        const floorValue = gameState.death_count_by_floor[floorNum] || 0;

        if (!this.checkNumericCondition(floorValue, value)) return false;
      }
    }

    if (condition.current_floor_death_count !== undefined) {
      const currentValue =
        gameState.death_count_by_floor[gameState.current_floor] || 0;

      if (
        !this.checkNumericCondition(
          currentValue,
          condition.current_floor_death_count
        )
      )
        return false;
    }

    if (condition.completed_scenes !== undefined) {
      // 완료된 씬 조건 검사 (in: 완료되어야 할 씬들, not_in: 완료되면 안 되는 씬들)
      const { in: requiredScenes, not_in: forbiddenScenes } =
        condition.completed_scenes;

      // 성능 최적화: 배열을 Set으로 변환하여 O(1) 검색 구현
      const completedScenesArray = gameState.completed_scenes ?? [];
      const completedScenesSet = new Set(completedScenesArray);

      // 필수 완료 씬들이 모두 완료되었는지 검사
      if (requiredScenes) {
        for (const sceneId of requiredScenes) {
          if (!completedScenesSet.has(sceneId)) {
            return false;
          }
        }
      }

      // 금지된 씬들이 완료되지 않았는지 검사
      if (forbiddenScenes) {
        for (const sceneId of forbiddenScenes) {
          if (completedScenesSet.has(sceneId)) {
            return false;
          }
        }
      }
    }

    // 씬 카운트 조건 → 전역 방문 누계(scene_count) 기준
    if (condition.scene_count !== undefined) {
      const currentSceneCount = gameState.scene_count ?? 0;

      if (!this.checkNumericCondition(currentSceneCount, condition.scene_count))
        return false;
    }

    // visit_count 키는 지원 종료, scene_count로 통일

    // 씬별 방문 누계 조건은 제거됨 (전역 visit_count만 지원)

    return true;
  }

  /**
   * 능력치 조건을 확인합니다.
   * @param statKey - 확인할 능력치 키
   * @param value - 요구되는 값 또는 범위
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkStatCondition(
    statKey: string,
    value: number | { min?: number; max?: number },
    gameState: GameState
  ): boolean {
    const currentValue = gameState[statKey as keyof GameState];

    if (typeof currentValue !== 'number') return false;

    return this.checkNumericCondition(currentValue, value);
  }

  /**
   * 자원 조건을 확인합니다.
   * @param resourceKey - 확인할 자원 키
   * @param value - 요구되는 값 또는 범위
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkResourceCondition(
    resourceKey: string,
    value: number | { min?: number; max?: number },
    gameState: GameState
  ): boolean {
    const currentValue = gameState[resourceKey as keyof GameState];

    if (typeof currentValue !== 'number') return false;

    return this.checkNumericCondition(currentValue, value);
  }

  /**
   * 상태 조건을 확인합니다.
   * @param requiredBuffs - 요구되는 상태들
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkBuffCondition(
    requiredBuffs: string[],
    gameState: GameState
  ): boolean {
    for (const requiredBuff of requiredBuffs) {
      if (
        isBuffKey(requiredBuff) &&
        !(gameState.buffs ?? []).includes(requiredBuff)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * 플래그 조건을 확인합니다.
   * @param requiredFlags - 요구되는 플래그들
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkFlagCondition(
    requiredFlags: string[],
    gameState: GameState
  ): boolean {
    for (const requiredFlag of requiredFlags) {
      if (
        isFlagKey(requiredFlag) &&
        !(gameState.flags ?? []).includes(requiredFlag)
      ) {
        return false;
      }
    }
    return true;
  }

  /**
   * 아이템 조건을 확인합니다.
   * @param itemConditions - 아이템 조건 객체 (키-값 구조)
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkItemCondition(
    itemConditions: {
      [itemId: string]: number | { min?: number; max?: number };
    },
    gameState: GameState
  ): boolean {
    for (const [itemId, conditionValue] of Object.entries(itemConditions)) {
      const item = (gameState.items ?? []).find(item => item.id === itemId);

      // 개수 조건 (number 또는 MinMaxRange)
      // 아이템이 없으면 수량을 0으로 처리
      const currentQuantity = item?.quantity ?? 0;
      if (!this.checkNumericCondition(currentQuantity, conditionValue)) {
        return false;
      }
    }
    return true;
  }

  /**
   * 변수 조건을 확인합니다.
   * @param variableId - 확인할 변수 ID
   * @param value - 요구되는 값 또는 범위
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkVariableCondition(
    variableId: string,
    value: number | { min?: number; max?: number },
    gameState: GameState
  ): boolean {
    const currentValue = gameState.variables?.[variableId] ?? 0;

    return this.checkNumericCondition(currentValue, value);
  }

  /**
   * 챕터별 씬 카운트 조건을 확인합니다.
   * 게임 상태의 완료된 씬 목록 길이를 사용하여 현재 챕터에서 경험한 씬 수를 확인합니다.
   * @param value - 요구되는 씬 카운트 값 또는 범위
   * @param gameState - 현재 게임 상태
   * @returns 조건 충족 여부
   */
  static checkSceneCountCondition(
    value: number | { min?: number; max?: number },
    gameState: GameState
  ): boolean {
    const currentSceneCount = (gameState.completed_scenes ?? []).length;

    return this.checkNumericCondition(currentSceneCount, value);
  }
}
