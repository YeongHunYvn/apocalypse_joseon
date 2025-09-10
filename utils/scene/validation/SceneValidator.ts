import { Choice, Condition, Scene, SceneEffects } from '../../../types';
import { getBuffById, getFlagById, getItemById } from '../../dataLoader';
import {
  isBuffKey,
  isFlagKey,
  isItemId,
  isMinMaxRange,
  isResourceKey,
  isStatKey,
} from '../../typeGuards';

/**
 * 씬 유효성 검증 결과 인터페이스
 */
export interface ValidationResult {
  /** 유효성 검증 통과 여부 */
  isValid: boolean;
  /** 오류 메시지 목록 */
  errors: string[];
  /** 경고 메시지 목록 */
  warnings: string[];
}

/**
 * 씬 ID 사용 유효성 검증 클래스
 * 씬에서 사용되는 모든 ID들의 유효성을 검증하여 런타임 오류를 방지합니다.
 */
export class SceneValidator {
  /**
   * 씬의 전체 유효성을 검증합니다.
   * @param scene - 검증할 씬
   * @returns 유효성 검증 결과
   */
  static validateScene(scene: Scene): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 기본 구조 검증
    this.validateBasicStructure(scene, errors);

    // 조건 검증
    if (scene.condition) {
      const conditionResult = this.validateCondition(
        scene.condition,
        `씬 ${scene.id}`
      );
      errors.push(...conditionResult.errors);
      warnings.push(...conditionResult.warnings);
    }

    // 효과 검증
    if (scene.effects) {
      const effectResult = this.validateEffects(
        scene.effects,
        `씬 ${scene.id}`
      );
      errors.push(...effectResult.errors);
      warnings.push(...effectResult.warnings);
    }

    // 선택지 검증
    scene.choices.forEach((choice, index) => {
      const choiceResult = this.validateChoice(
        choice,
        `씬 ${scene.id} 선택지 ${index + 1}`
      );
      errors.push(...choiceResult.errors);
      warnings.push(...choiceResult.warnings);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 씬의 기본 구조를 검증합니다.
   * @param scene - 검증할 씬
   * @param errors - 오류 메시지 배열
   */
  private static validateBasicStructure(scene: Scene, errors: string[]): void {
    // 씬 ID 형식 검증
    if (!scene.id.startsWith('scn_')) {
      errors.push(`씬 ID는 'scn_' 접두어로 시작해야 합니다: ${scene.id}`);
    }

    // 텍스트 존재 여부 검증
    if (!scene.text || scene.text.trim() === '') {
      errors.push(`씬 ${scene.id}: 텍스트가 비어있습니다.`);
    }

    // 선택지 존재 여부 검증
    if (!scene.choices || scene.choices.length === 0) {
      errors.push(`씬 ${scene.id}: 선택지가 없습니다.`);
    }
  }

  /**
   * 조건의 유효성을 검증합니다.
   * @param condition - 검증할 조건
   * @param context - 오류 메시지용 컨텍스트
   * @returns 유효성 검증 결과
   */
  static validateCondition(
    condition: Condition,
    context: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // MongoDB 스타일 조건 처리
    if ('$and' in condition || '$or' in condition) {
      // 중첩 조건은 재귀적으로 처리
      const conditions =
        '$and' in condition
          ? condition.$and
          : '$or' in condition
            ? condition.$or
            : [];
      conditions.forEach((subCondition: any) => {
        const subResult = this.validateCondition(subCondition, context);
        errors.push(...subResult.errors);
        warnings.push(...subResult.warnings);
      });
      return { isValid: errors.length === 0, errors, warnings };
    }

    // AtomicCondition 검증
    const atomicCondition = condition as any;

    // 능력치 조건 검증
    Object.keys(atomicCondition).forEach(key => {
      if (isStatKey(key)) {
        // 유효한 능력치 키
        return;
      }
      if (isResourceKey(key)) {
        // 유효한 자원 키
        return;
      }
    });

    // 상태 조건 검증 (in / not_in 전용)
    if (atomicCondition.buffs) {
      const buffsCondition = atomicCondition.buffs;
      const allowedKeys = new Set(['in', 'not_in']);
      if (typeof buffsCondition !== 'object' || Array.isArray(buffsCondition)) {
        errors.push(
          `${context}: buffs는 { in?: string[], not_in?: string[] } 객체여야 합니다.`
        );
      } else {
        for (const key of Object.keys(buffsCondition)) {
          if (!allowedKeys.has(key)) {
            errors.push(
              `${context}: buffs에는 'in'과 'not_in'만 사용할 수 있습니다. (발견됨: '${key}')`
            );
          }
        }

        const checkArray = (arr: any, label: string) => {
          if (arr !== undefined) {
            if (!Array.isArray(arr)) {
              errors.push(`${context}: buffs.${label}는 배열이어야 합니다.`);
              return;
            }
            arr.forEach((buffId: any) => {
              if (!isBuffKey(buffId)) {
                errors.push(`${context}: 정의되지 않은 상태 ID '${buffId}'`);
                return;
              }
              const buffData = getBuffById(buffId);
              if (!buffData) {
                warnings.push(
                  `${context}: 상태 '${buffId}'의 데이터를 찾을 수 없습니다.`
                );
              }
            });
          }
        };

        checkArray(buffsCondition.in, 'in');
        checkArray(buffsCondition.not_in, 'not_in');
      }
    }

    // 플래그 조건 검증 (in / not_in 전용)
    if (atomicCondition.flags) {
      const flagsCondition = atomicCondition.flags;
      const allowedKeys = new Set(['in', 'not_in']);
      if (typeof flagsCondition !== 'object' || Array.isArray(flagsCondition)) {
        errors.push(
          `${context}: flags는 { in?: string[], not_in?: string[] } 객체여야 합니다.`
        );
      } else {
        for (const key of Object.keys(flagsCondition)) {
          if (!allowedKeys.has(key)) {
            errors.push(
              `${context}: flags에는 'in'과 'not_in'만 사용할 수 있습니다. (발견됨: '${key}')`
            );
          }
        }

        const checkArray = (arr: any, label: string) => {
          if (arr !== undefined) {
            if (!Array.isArray(arr)) {
              errors.push(`${context}: flags.${label}는 배열이어야 합니다.`);
              return;
            }
            arr.forEach((flagId: any) => {
              if (!isFlagKey(flagId)) {
                errors.push(`${context}: 정의되지 않은 플래그 ID '${flagId}'`);
                return;
              }
              const flagData = getFlagById(flagId);
              if (!flagData) {
                warnings.push(
                  `${context}: 플래그 '${flagId}'의 데이터를 찾을 수 없습니다.`
                );
              }
            });
          }
        };

        checkArray(flagsCondition.in, 'in');
        checkArray(flagsCondition.not_in, 'not_in');
      }
    }

    // 아이템 조건 검증
    if (atomicCondition.items) {
      Object.entries(atomicCondition.items).forEach(
        ([itemId, conditionValue]) => {
          if (!isItemId(itemId)) {
            errors.push(`${context}: 정의되지 않은 아이템 ID '${itemId}'`);
            return;
          }

          const itemData = getItemById(itemId);
          if (!itemData) {
            warnings.push(
              `${context}: 아이템 '${itemId}'의 데이터를 찾을 수 없습니다.`
            );
          }

          // 개수 조건 검증 (number 또는 MinMaxRange)
          if (isMinMaxRange(conditionValue)) {
            if (conditionValue.min !== undefined && conditionValue.min < 0) {
              errors.push(
                `${context}: 아이템 '${itemId}'의 최소 개수는 0 이상이어야 합니다.`
              );
            }
            if (conditionValue.max !== undefined && conditionValue.max < 0) {
              errors.push(
                `${context}: 아이템 '${itemId}'의 최대 개수는 0 이상이어야 합니다.`
              );
            }
            if (
              conditionValue.min !== undefined &&
              conditionValue.max !== undefined &&
              conditionValue.min > conditionValue.max
            ) {
              errors.push(
                `${context}: 아이템 '${itemId}'의 최소 개수가 최대 개수보다 클 수 없습니다.`
              );
            }
          } else if (typeof conditionValue === 'number' && conditionValue < 0) {
            errors.push(
              `${context}: 아이템 '${itemId}'의 개수는 0 이상이어야 합니다.`
            );
          }
        }
      );
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 효과의 유효성을 검증합니다.
   * @param effects - 검증할 효과
   * @param context - 오류 메시지용 컨텍스트
   * @returns 유효성 검증 결과
   */
  static validateEffects(
    effects: SceneEffects,
    context: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 상태 효과 검증
    if (effects.add_buffs) {
      effects.add_buffs.forEach(buffId => {
        if (!isBuffKey(buffId)) {
          errors.push(
            `${context}: add_buffs에 정의되지 않은 상태 ID '${buffId}'`
          );
          return;
        }

        const buffData = getBuffById(buffId);
        if (!buffData) {
          warnings.push(
            `${context}: 추가할 상태 '${buffId}'의 데이터를 찾을 수 없습니다.`
          );
        }
      });
    }

    if (effects.remove_buffs) {
      effects.remove_buffs.forEach(buffId => {
        if (!isBuffKey(buffId)) {
          errors.push(
            `${context}: remove_buffs에 정의되지 않은 상태 ID '${buffId}'`
          );
          return;
        }

        const buffData = getBuffById(buffId);
        if (!buffData) {
          warnings.push(
            `${context}: 제거할 상태 '${buffId}'의 데이터를 찾을 수 없습니다.`
          );
        }
      });
    }

    // 플래그 효과 검증
    if (effects.set_flags) {
      effects.set_flags.forEach(flagId => {
        if (!isFlagKey(flagId)) {
          errors.push(
            `${context}: set_flags에 정의되지 않은 플래그 ID '${flagId}'`
          );
          return;
        }

        const flagData = getFlagById(flagId);
        if (!flagData) {
          warnings.push(
            `${context}: 설정할 플래그 '${flagId}'의 데이터를 찾을 수 없습니다.`
          );
        }
      });
    }

    if (effects.unset_flags) {
      effects.unset_flags.forEach(flagId => {
        if (!isFlagKey(flagId)) {
          errors.push(
            `${context}: unset_flags에 정의되지 않은 플래그 ID '${flagId}'`
          );
          return;
        }

        const flagData = getFlagById(flagId);
        if (!flagData) {
          warnings.push(
            `${context}: 해제할 플래그 '${flagId}'의 데이터를 찾을 수 없습니다.`
          );
        }
      });
    }

    // 아이템 효과 검증 (키-값 방식)
    if (effects.items) {
      for (const [itemId, quantity] of Object.entries(effects.items) as [
        string,
        number,
      ][]) {
        if (!isItemId(itemId)) {
          errors.push(
            `${context}: items에 정의되지 않은 아이템 ID '${itemId}'`
          );
          continue;
        }

        const itemData = getItemById(itemId);
        if (!itemData) {
          warnings.push(
            `${context}: 아이템 '${itemId}'의 데이터를 찾을 수 없습니다.`
          );
        }

        // quantity 검증
        if (typeof quantity !== 'number') {
          errors.push(
            `${context}: 아이템 '${itemId}'의 quantity가 숫자가 아닙니다.`
          );
          continue;
        }

        if (quantity === 0) {
          warnings.push(
            `${context}: 아이템 '${itemId}'의 quantity가 0입니다. 효과가 없습니다.`
          );
        }

        // 양수/음수 모두 허용 (양수: 추가, 음수: 제거)
        // 매우 큰 음수 값 체크 (실수 방지)
        if (quantity < -1000) {
          warnings.push(
            `${context}: 아이템 '${itemId}'의 quantity가 매우 큰 음수입니다 (${quantity}). 의도한 값이 맞는지 확인하세요.`
          );
        }
      }
    }

    // 경험치 효과 검증 (통합 방식)
    if (effects.exp) {
      if (typeof effects.exp === 'object' && !Array.isArray(effects.exp)) {
        Object.entries(effects.exp).forEach(([expType, amount]) => {
          if (typeof expType !== 'string' || expType.trim() === '') {
            errors.push(`${context}: exp에 빈 문자열 경험치 타입이 포함됨`);
          }

          if (typeof amount !== 'number') {
            errors.push(`${context}: exp['${expType}']의 값은 숫자여야 함`);
          }
        });
      } else {
        errors.push(
          `${context}: exp는 객체여야 함 (예: {"strength": 10, "level": -5})`
        );
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 선택지의 유효성을 검증합니다.
   * @param choice - 검증할 선택지
   * @param context - 오류 메시지용 컨텍스트
   * @returns 유효성 검증 결과
   */
  static validateChoice(choice: Choice, context: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 선택지 텍스트 검증
    if (!choice.text || choice.text.trim() === '') {
      errors.push(`${context}: 선택지 텍스트가 비어있습니다.`);
    }

    // 선택지 조건 검증
    if (choice.condition) {
      const conditionResult = this.validateCondition(choice.condition, context);
      errors.push(...conditionResult.errors);
      warnings.push(...conditionResult.warnings);
    }

    // 확률 검증
    if (choice.probability) {
      if (
        choice.probability.base_rate < 0 ||
        choice.probability.base_rate > 1
      ) {
        errors.push(`${context}: 확률값은 0과 1 사이여야 합니다.`);
      }

      // 확률 수정자 검증
      if (choice.probability.modifier) {
        Object.keys(choice.probability.modifier).forEach(statKey => {
          if (!isStatKey(statKey)) {
            errors.push(
              `${context}: 확률 수정자에 정의되지 않은 능력치 '${statKey}'`
            );
          }
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * 여러 씬의 유효성을 일괄 검증합니다.
   * @param scenes - 검증할 씬 배열
   * @returns 통합된 유효성 검증 결과
   */
  static validateScenes(scenes: Scene[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const sceneIds = new Set<string>();

    scenes.forEach(scene => {
      // 씬 ID 중복 검증
      if (sceneIds.has(scene.id)) {
        allErrors.push(`중복된 씬 ID: ${scene.id}`);
      } else {
        sceneIds.add(scene.id);
      }

      // 개별 씬 검증
      const result = this.validateScene(scene);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    });

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  /**
   * 유효성 검증 결과를 콘솔에 출력합니다.
   * @param result - 검증 결과
   * @param title - 출력 제목
   */
  static printValidationResult(
    result: ValidationResult,
    _title: string = '유효성 검증 결과'
  ): void {
    // 개발자 콘솔 출력. 필요 시 Logger로 치환 가능
    // Logger.info('[SceneValidator]', `=== ${title} ===`);

    if (result.isValid) {
      // Logger.info('[SceneValidator]', '✅ 모든 검증을 통과했습니다.');
    } else {
      // Logger.warn('[SceneValidator]', '❌ 검증 실패');
    }

    if (result.errors.length > 0) {
      // Logger.error('[SceneValidator]', '오류 목록');
      // result.errors.forEach(error => Logger.error('[SceneValidator]', `  - ${error}`));
    }

    if (result.warnings.length > 0) {
      // Logger.warn('[SceneValidator]', '경고 목록');
      // result.warnings.forEach(warning => Logger.warn('[SceneValidator]', `  - ${warning}`));
    }

    // Logger.info('[SceneValidator]', '========================');
  }
}
