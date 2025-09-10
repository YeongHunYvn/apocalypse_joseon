import * as SpecialEffectHandlers from './handlers';

import {
  RESOURCES,
  RESOURCE_KEYS,
  STAT_KEYS,
} from '../../../constants/gameConfig';
import { GameState, SceneEffects, SpecialEffects } from '../../../types';
import { getVariableById, isVariableKey } from '../../dataLoader';
import { isBuffKey, isFlagKey } from '../../typeGuards';

import { SPECIAL_EFFECTS } from '../../../constants/specialEffects';
import { getItemById } from '../../dataLoader';
import { ExperienceManager } from '../../ExperienceManager';
import { Logger } from '../../system/Logger';

// 상수 정의
const STAT_MAX_VALUE = 10;

/**
 * 효과 적용기
 * 씬 효과를 게임 상태에 적용하는 로직을 담당합니다.
 */
export class EffectApplier {
  /**
   * 모든 씬 효과를 게임 상태에 순차적으로 적용합니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 게임 상태
   */
  static applyEffects(effects: SceneEffects, gameState: GameState): GameState {
    let newState = this.applyGeneralEffects(effects, gameState);

    // 변수 효과 적용
    newState = this.applyVariableEffects(effects, newState);

    // 통합 경험치 시스템 적용
    newState = this.applyExperienceEffects(effects, newState);

    if (effects.special_effects) {
      newState = this.applySpecialEffects(effects.special_effects, newState);
    }
    return newState;
  }

  /**
   * 통합 경험치 시스템 효과를 적용합니다.
   * 간단한 객체 형태로 여러 경험치 타입에 동시에 경험치를 추가/감소할 수 있습니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 경험치 효과가 적용된 새로운 게임 상태
   */
  static applyExperienceEffects(
    effects: SceneEffects,
    gameState: GameState
  ): GameState {
    let newState = gameState;

    // 경험치 효과 처리 (exp) - 양수: 추가, 음수: 감소
    if (effects.exp) {
      // exp.skills 형태를 평탄화하여 ExperienceManager로 전달
      const expAny: any = effects.exp as any;
      const flatExp: { [key: string]: number } = {};

      // 상위 레벨의 숫자 키들 복사 (기존 하위 호환)
      Object.entries(effects.exp as Record<string, number>).forEach(
        ([key, value]) => {
          if (typeof value === 'number') flatExp[key] = value;
        }
      );

      // skills 하위 키 병합
      if (expAny.skills && typeof expAny.skills === 'object') {
        for (const [skillId, amount] of Object.entries(expAny.skills)) {
          if (typeof amount === 'number') {
            flatExp[skillId] = (flatExp[skillId] || 0) + amount;
          }
        }
      }

      Logger.info(
        '[EffectApplier]',
        `📊 경험치 효과 적용: ${Object.keys(flatExp).length}개 타입`
      );
      newState = ExperienceManager.applyExperience(newState, flatExp);
    }

    // 수동 레벨업 효과 처리 (manual_level_up)
    // 스킬은 자동 레벨업만 사용하므로 수동 레벨업은 처리하지 않음

    return newState;
  }

  /**
   * 일반 게임 상태 효과(스탯, 자원, 아이템 등)를 적용합니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 게임 상태
   */
  static applyGeneralEffects(
    effects: SceneEffects,
    gameState: GameState
  ): GameState {
    const newState = {
      ...gameState,
      buffs: [...(gameState.buffs ?? [])],
      flags: [...(gameState.flags ?? [])],
      items: [...(gameState.items ?? [])],
      completed_scenes: [...(gameState.completed_scenes ?? [])],
      experience: { ...gameState.experience },
      levels: { ...gameState.levels },
      death_count_by_floor: { ...gameState.death_count_by_floor },
    };

    // 능력치 변화 적용 (자동화)
    for (const statKey of STAT_KEYS) {
      if (statKey in effects) {
        const change = effects[statKey];
        if (typeof change === 'number') {
          const currentValue = newState[statKey];
          if (typeof currentValue === 'number') {
            newState[statKey] = Math.max(
              0,
              Math.min(STAT_MAX_VALUE, currentValue + change)
            );
          }
        }
      }
    }

    // 자원 변화 (자동화)
    for (const resourceKey of RESOURCE_KEYS) {
      if (resourceKey in effects) {
        const change = effects[resourceKey as keyof SceneEffects];
        if (typeof change === 'number') {
          const maxValue = RESOURCES[resourceKey].maxValue;
          const currentValue = newState[resourceKey as keyof GameState];
          if (typeof currentValue === 'number') {
            const newValue = Math.max(
              0,
              Math.min(maxValue, currentValue + change)
            );
            (newState as GameState)[resourceKey] = newValue;
          }
        }
      }
    }

    // 상태 추가/제거
    if (effects.add_buffs) {
      for (const buff of effects.add_buffs) {
        if (isBuffKey(buff) && !newState.buffs.includes(buff)) {
          newState.buffs.push(buff);
        }
      }
    }

    if (effects.remove_buffs) {
      newState.buffs = (newState.buffs ?? []).filter(
        buff => !effects.remove_buffs!.includes(buff)
      );
    }

    // 플래그 설정/해제
    if (effects.set_flags) {
      for (const flag of effects.set_flags) {
        if (isFlagKey(flag) && !newState.flags.includes(flag)) {
          newState.flags.push(flag);
        }
      }
    }

    if (effects.unset_flags) {
      newState.flags = (newState.flags ?? []).filter(
        flag => !effects.unset_flags!.includes(flag)
      );
    }

    // 아이템 추가/제거 (키-값 방식)
    if (effects.items) {
      for (const [itemId, quantity] of Object.entries(effects.items) as [
        string,
        number,
      ][]) {
        if (quantity > 0) {
          // 아이템 추가
          const existingItem = newState.items.find(
            existing => existing.id === itemId
          );

          if (existingItem) {
            // 기존 아이템이 있으면 개수 증가
            newState.items = newState.items.map(existing =>
              existing.id === itemId
                ? {
                    ...existing,
                    quantity: (existing.quantity || 1) + quantity,
                  }
                : existing
            );
          } else {
            // 새 아이템 추가 (items.json에서 정보 로드)
            const itemData = getItemById(itemId);
            if (itemData) {
              newState.items.push({
                id: itemId,
                name: itemData.name,
                description: itemData.description,
                persist: itemData.persist ?? false,
                quantity: quantity,
              });
            } else {
              Logger.warn(
                '[EffectApplier]',
                `아이템 정보를 찾을 수 없습니다: ${itemId}`
              );
            }
          }
        } else if (quantity < 0) {
          // 아이템 제거
          const removeQuantity = Math.abs(quantity);
          const existingItem = newState.items.find(item => item.id === itemId);

          if (existingItem) {
            const currentQuantity = existingItem.quantity || 1;

            if (currentQuantity <= removeQuantity) {
              // 완전 제거
              newState.items = newState.items.filter(
                item => item.id !== itemId
              );
            } else {
              // 일부만 제거
              newState.items = newState.items.map(item =>
                item.id === itemId
                  ? { ...item, quantity: currentQuantity - removeQuantity }
                  : item
              );
            }
          }
        }
        // quantity가 0이면 아무것도 하지 않음
      }
    }

    // 게임 진행 상태 업데이트 (자동화)
    if (effects.current_floor !== undefined) {
      newState.current_floor = effects.current_floor;
    }

    if (effects.death_count !== undefined) {
      newState.death_count = effects.death_count;
    }

    if (effects.death_count_by_floor) {
      for (const [floor, count] of Object.entries(
        effects.death_count_by_floor
      )) {
        newState.death_count_by_floor[parseInt(floor)] = count;
      }
    }

    if (effects.completed_scenes) {
      newState.completed_scenes.push(...effects.completed_scenes);
    }

    return newState;
  }

  /**
   * 변수 효과를 적용합니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 변수 효과가 적용된 새로운 게임 상태
   */
  static applyVariableEffects(
    effects: SceneEffects,
    gameState: GameState
  ): GameState {
    if (!effects.variables || effects.variables.length === 0) {
      return gameState;
    }

    let newState = {
      ...gameState,
      variables: { ...gameState.variables },
    };

    for (const effect of effects.variables) {
      if (!isVariableKey(effect.id)) {
        Logger.warn('[EffectApplier]', `⚠️ 알 수 없는 변수 ID: ${effect.id}`);
        continue;
      }

      const currentValue = newState.variables[effect.id] ?? 0;
      const variableData = getVariableById(effect.id);
      let newValue: number;

      // 연산자에 따른 값 계산
      switch (effect.operator) {
        case 'add':
          newValue = currentValue + effect.value;
          break;
        case 'subtract':
          newValue = currentValue - effect.value;
          break;
        case 'set':
          newValue = effect.value;
          break;
        case 'multiply':
          newValue = Math.floor(currentValue * effect.value);
          break;
        default:
          Logger.warn(
            '[EffectApplier]',
            `⚠️ 알 수 없는 연산자: ${effect.operator}`
          );
          continue;
      }

      // 최소/최대값 제한 적용
      if (variableData) {
        if (variableData.minValue !== undefined) {
          newValue = Math.max(newValue, variableData.minValue);
        }
        if (variableData.maxValue !== undefined) {
          newValue = Math.min(newValue, variableData.maxValue);
        }
      }

      newState.variables[effect.id] = newValue;
      Logger.debug(
        '[EffectApplier]',
        `변수 ${effect.operator}: ${effect.id} ${currentValue} ${this.getOperatorSymbol(effect.operator)} ${effect.value} = ${newValue}`
      );
    }

    return newState;
  }

  /**
   * 연산자에 대응하는 기호를 반환합니다.
   * @param operator - 연산자
   * @returns 기호 문자열
   */
  private static getOperatorSymbol(operator: string): string {
    switch (operator) {
      case 'add':
        return '+';
      case 'subtract':
        return '-';
      case 'set':
        return '=';
      case 'multiply':
        return '*';
      default:
        return operator;
    }
  }

  /**
   * 특수 효과를 게임 상태에 적용합니다.
   * SPECIAL_EFFECTS 상수를 활용하여 동적으로 효과를 처리합니다.
   * @param specialEffects - 적용할 특수 효과
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 게임 상태
   */
  static applySpecialEffects(
    specialEffects: SpecialEffects,
    gameState: GameState
  ): GameState {
    let newState = { ...gameState };

    // 각 특수 효과에 대해 동적으로 처리
    for (const [effectId, effectValue] of Object.entries(specialEffects)) {
      if (!effectValue) continue; // false 또는 undefined인 경우 스킵

      const effectConfig =
        SPECIAL_EFFECTS[effectId as keyof typeof SPECIAL_EFFECTS];
      if (!effectConfig) {
        Logger.warn('[EffectApplier]', `🚨 알 수 없는 특수 효과: ${effectId}`);
        continue;
      }

      Logger.info(
        '[EffectApplier]',
        `⚡ 특수 효과 처리: ${effectId}${'valueType' in effectConfig ? ` (${effectValue})` : ''}`
      );

      // 각 효과별 핸들러 호출
      try {
        switch (effectId) {
          case 'force_gameover':
            newState = SpecialEffectHandlers.handleForceGameOver(newState);
            break;
          case 'rest_room_cleanup':
            newState = SpecialEffectHandlers.handleRestRoomCleanup(newState);
            break;
          case 'reset_game':
            newState = SpecialEffectHandlers.handleResetGame(newState);
            break;
          case 'reset_health':
            newState = SpecialEffectHandlers.handleResetHealth(newState);
            break;
          case 'reset_mind':
            newState = SpecialEffectHandlers.handleResetMind(newState);
            break;
          case 'increment_death_count':
            newState =
              SpecialEffectHandlers.handleIncrementDeathCount(newState);
            break;
          case 'complete_scene':
            if (typeof effectValue === 'string') {
              newState = SpecialEffectHandlers.handleCompleteScene(
                newState,
                effectValue
              );
            }
            break;
          case 'set_floor':
            if (typeof effectValue === 'number') {
              newState = SpecialEffectHandlers.handleSetFloor(
                newState,
                effectValue
              );
            }
            break;
          case 'clear_visited_scenes':
            newState = SpecialEffectHandlers.handleClearVisitedScenes(newState);
            break;
          default:
            Logger.warn(
              '[EffectApplier]',
              `🚨 구현되지 않은 특수 효과: ${effectId}`
            );
        }
      } catch (error) {
        Logger.error(
          '[EffectApplier]',
          `🚨 특수 효과 처리 실패: ${effectId}`,
          error
        );
      }
    }

    return newState;
  }

  /**
   * 능력치 효과를 적용합니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 게임 상태
   */
  static applyStatEffects(
    effects: SceneEffects,
    gameState: GameState
  ): GameState {
    const newState = {
      ...gameState,
      buffs: [...(gameState.buffs ?? [])],
      flags: [...(gameState.flags ?? [])],
      items: [...(gameState.items ?? [])],
      completed_scenes: [...(gameState.completed_scenes ?? [])],
      death_count_by_floor: { ...gameState.death_count_by_floor },
    };

    for (const statKey of STAT_KEYS) {
      if (statKey in effects) {
        const change = effects[statKey];
        if (typeof change === 'number') {
          const currentValue = newState[statKey];
          if (typeof currentValue === 'number') {
            newState[statKey] = Math.max(
              0,
              Math.min(STAT_MAX_VALUE, currentValue + change)
            );
          }
        }
      }
    }

    return newState;
  }

  /**
   * 자원 효과를 적용합니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 게임 상태
   */
  static applyResourceEffects(
    effects: SceneEffects,
    gameState: GameState
  ): GameState {
    const newState = {
      ...gameState,
      buffs: [...(gameState.buffs ?? [])],
      flags: [...(gameState.flags ?? [])],
      items: [...(gameState.items ?? [])],
      completed_scenes: [...(gameState.completed_scenes ?? [])],
      death_count_by_floor: { ...gameState.death_count_by_floor },
    };

    for (const resourceKey of RESOURCE_KEYS) {
      if (resourceKey in effects) {
        const change = effects[resourceKey as keyof SceneEffects];
        if (typeof change === 'number') {
          const maxValue = RESOURCES[resourceKey].maxValue;
          const currentValue = newState[resourceKey as keyof GameState];
          if (typeof currentValue === 'number') {
            const newValue = Math.max(
              0,
              Math.min(maxValue, currentValue + change)
            );
            (newState as GameState)[resourceKey] = newValue;
          }
        }
      }
    }

    return newState;
  }

  /**
   * 상태 효과를 적용합니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 게임 상태
   */
  static applyBuffEffects(
    effects: SceneEffects,
    gameState: GameState
  ): GameState {
    const newState = {
      ...gameState,
      buffs: [...(gameState.buffs ?? [])],
      flags: [...(gameState.flags ?? [])],
      items: [...(gameState.items ?? [])],
      completed_scenes: [...(gameState.completed_scenes ?? [])],
      death_count_by_floor: { ...gameState.death_count_by_floor },
    };

    // 상태 추가
    if (effects.add_buffs) {
      for (const buff of effects.add_buffs) {
        if (isBuffKey(buff) && !newState.buffs.includes(buff)) {
          newState.buffs.push(buff);
        }
      }
    }

    // 상태 제거
    if (effects.remove_buffs) {
      newState.buffs = (newState.buffs ?? []).filter(
        buff => !effects.remove_buffs!.includes(buff)
      );
    }

    return newState;
  }

  /**
   * 플래그 효과를 적용합니다.
   * @param effects - 적용할 효과
   * @param gameState - 현재 게임 상태
   * @returns 업데이트된 게임 상태
   */
  static applyFlagEffects(
    effects: SceneEffects,
    gameState: GameState
  ): GameState {
    const newState = {
      ...gameState,
      buffs: [...(gameState.buffs ?? [])],
      flags: [...(gameState.flags ?? [])],
      items: [...(gameState.items ?? [])],
      completed_scenes: [...(gameState.completed_scenes ?? [])],
      death_count_by_floor: { ...gameState.death_count_by_floor },
    };

    // 플래그 설정
    if (effects.set_flags) {
      for (const flag of effects.set_flags) {
        if (isFlagKey(flag) && !newState.flags.includes(flag)) {
          newState.flags.push(flag);
        }
      }
    }

    // 플래그 해제
    if (effects.unset_flags) {
      newState.flags = (newState.flags ?? []).filter(
        flag => !effects.unset_flags!.includes(flag)
      );
    }

    return newState;
  }
}
