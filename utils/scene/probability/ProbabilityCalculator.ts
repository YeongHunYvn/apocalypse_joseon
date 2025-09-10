import { GameState, ProbabilityModifiers } from '../../../types';
import {
  isBuffKey,
  isFlagKey,
  isItemId,
  isSkillKey,
  isStatKey,
  isVariableKey,
} from '../../typeGuards';

/**
 * 확률 계산기
 * 확률 계산 및 판정 로직을 담당합니다.
 */
export class ProbabilityCalculator {
  /**
   * 확률 계산 함수
   * @param baseRate - 기본 확률 (0~1)
   * @param modifier - 확률 수정자들
   * @param gameState - 현재 게임 상태
   * @returns 최종 확률 (0~1)
   */
  static calculateProbability(
    baseRate: number,
    modifier: ProbabilityModifiers | undefined,
    gameState: GameState
  ): number {
    let finalRate = baseRate;

    if (!modifier) {
      return Math.max(0, Math.min(1, finalRate));
    }

    // 능력치 수정자 처리
    if (modifier.stats) {
      for (const [statKey, modifierConfig] of Object.entries(modifier.stats)) {
        if (isStatKey(statKey) && modifierConfig) {
          const statValue = gameState[statKey as keyof GameState] as number;
          const perUnit =
            typeof (modifierConfig as any).per_unit === 'number'
              ? (modifierConfig as any).per_unit
              : 0;
          const bonus = statValue * perUnit;
          const cappedBonus = modifierConfig.max
            ? Math.min(bonus, modifierConfig.max)
            : bonus;
          finalRate += cappedBonus;
        }
      }
    }

    // 상태(버프) 수정자 처리
    if (modifier.buffs) {
      for (const [buffId, modifierConfig] of Object.entries(modifier.buffs)) {
        if (isBuffKey(buffId) && modifierConfig) {
          const hasBuff = gameState.buffs.includes(buffId) ? 1 : 0;
          const perUnit =
            typeof (modifierConfig as any).per_unit === 'number'
              ? (modifierConfig as any).per_unit
              : 0;
          const bonus = hasBuff * perUnit;
          const cappedBonus = modifierConfig.max
            ? Math.min(bonus, modifierConfig.max)
            : bonus;
          finalRate += cappedBonus;
        }
      }
    }

    // 플래그 수정자 처리
    if (modifier.flags) {
      for (const [flagId, modifierConfig] of Object.entries(modifier.flags)) {
        if (isFlagKey(flagId) && modifierConfig) {
          const hasFlag = gameState.flags.includes(flagId) ? 1 : 0;
          const perUnit =
            typeof (modifierConfig as any).per_unit === 'number'
              ? (modifierConfig as any).per_unit
              : 0;
          const bonus = hasFlag * perUnit;
          const cappedBonus = modifierConfig.max
            ? Math.min(bonus, modifierConfig.max)
            : bonus;
          finalRate += cappedBonus;
        }
      }
    }

    // 아이템 수정자 처리
    if (modifier.items) {
      for (const [itemId, modifierConfig] of Object.entries(modifier.items)) {
        if (isItemId(itemId) && modifierConfig) {
          const item = gameState.items.find(item => item.id === itemId);
          const itemQuantity = item?.quantity || 0;
          const perUnit =
            typeof (modifierConfig as any).per_unit === 'number'
              ? (modifierConfig as any).per_unit
              : 0;
          const bonus = itemQuantity * perUnit;
          const cappedBonus = modifierConfig.max
            ? Math.min(bonus, modifierConfig.max)
            : bonus;
          finalRate += cappedBonus;
        }
      }
    }

    // 변수 수정자 처리
    if (modifier.variables) {
      for (const [variableId, modifierConfig] of Object.entries(
        modifier.variables
      )) {
        if (isVariableKey(variableId) && modifierConfig) {
          const variableValue = gameState.variables[variableId] || 0;
          const perUnit =
            typeof (modifierConfig as any).per_unit === 'number'
              ? (modifierConfig as any).per_unit
              : 0;
          const bonus = variableValue * perUnit;
          const cappedBonus = modifierConfig.max
            ? Math.min(bonus, modifierConfig.max)
            : bonus;
          finalRate += cappedBonus;
        }
      }
    }

    // 스킬 수정자 처리 (레벨 기반)
    if (modifier.skills) {
      for (const [skillId, modifierConfig] of Object.entries(modifier.skills)) {
        if (isSkillKey(skillId) && modifierConfig) {
          const levelValue = gameState.levels[skillId] || 0;
          const perUnit =
            typeof (modifierConfig as any).per_unit === 'number'
              ? (modifierConfig as any).per_unit
              : 0;
          const bonus = levelValue * perUnit;
          const cappedBonus = modifierConfig.max
            ? Math.min(bonus, modifierConfig.max)
            : bonus;
          finalRate += cappedBonus;
        }
      }
    }

    return Math.max(0, Math.min(1, finalRate));
  }

  /**
   * 확률 계산 함수 (max_rate 지원)
   * @param baseRate - 기본 확률 (0~1)
   * @param maxRate - 최대 확률 (선택적, 0~1)
   * @param modifier - 확률 수정자들
   * @param gameState - 현재 게임 상태
   * @returns 최종 확률 (0~1)
   */
  static calculateProbabilityWithMax(
    baseRate: number,
    maxRate: number | undefined,
    modifier: ProbabilityModifiers | undefined,
    gameState: GameState
  ): number {
    const finalRate = this.calculateProbability(baseRate, modifier, gameState);

    // max_rate가 설정되어 있으면 그 값으로 제한
    if (maxRate !== undefined) {
      return Math.max(0, Math.min(maxRate, finalRate));
    }

    return finalRate;
  }

  /**
   * 확률 기반 성공/실패 판정
   * @param probability - 확률 (0~1)
   * @returns 성공 여부
   */
  static rollProbability(probability: number): boolean {
    return Math.random() < probability;
  }

  /**
   * 확률 분기를 처리하여 성공/실패 여부를 결정
   * @param probability - 확률 설정
   * @param gameState - 현재 게임 상태
   * @returns 성공 시 success_next, 실패 시 failure_next
   */
  static processProbability(
    probability: {
      base_rate: number;
      max_rate?: number;
      modifier?: any;
      success_next: any;
      failure_next: any;
    },
    gameState: GameState
  ): { chapter_id?: string; scene_id?: string } {
    // max_rate를 고려한 확률 계산 로직 사용
    const successRate = this.calculateProbabilityWithMax(
      probability.base_rate,
      probability.max_rate,
      probability.modifier,
      gameState
    );

    // 랜덤 확률 계산
    const random = Math.random();

    return random < successRate
      ? probability.success_next
      : probability.failure_next;
  }

  /**
   * 확률을 백분율로 변환합니다.
   * @param probability - 확률 (0~1)
   * @returns 백분율 (0~100)
   */
  static toPercentage(probability: number): number {
    return Math.round(probability * 100);
  }

  /**
   * 백분율을 확률로 변환합니다.
   * @param percentage - 백분율 (0~100)
   * @returns 확률 (0~1)
   */
  static fromPercentage(percentage: number): number {
    return Math.max(0, Math.min(1, percentage / 100));
  }

  /**
   * 확률을 설명 텍스트로 변환합니다.
   * @param probability - 확률 (0~1)
   * @returns 설명 텍스트
   */
  static toDescription(probability: number): string {
    const percentage = this.toPercentage(probability);

    if (percentage <= 10) return '매우 낮음';
    if (percentage <= 25) return '낮음';
    if (percentage <= 40) return '보통 이하';
    if (percentage <= 60) return '보통';
    if (percentage <= 75) return '보통 이상';
    if (percentage <= 90) return '높음';
    return '매우 높음';
  }
}
