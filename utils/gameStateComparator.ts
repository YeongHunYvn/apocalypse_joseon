import { EXPERIENCE_CONFIGS } from '../constants/experienceConfig';
import {
  RESOURCE_KEYS,
  RESOURCES,
  STAT_KEYS,
  STATS,
} from '../constants/gameConfig';
import { GameState, ItemId, SceneEffects } from '../types';
import { getBuffById, getItemById, getSkillById } from './dataLoader';
import { ExperienceManager } from './ExperienceManager';
import { Logger } from './system/Logger';

/**
 * 변화 타입 정의
 */
export type ChangeType = 'increase' | 'decrease' | 'add' | 'remove';

/**
 * 개별 변화 항목 인터페이스
 */
export interface StateChange {
  /** 변화 카테고리 */
  category: 'stat' | 'resource' | 'buff' | 'item' | 'experience' | 'level';
  /** 변화 타입 */
  type: ChangeType;
  /** 항목 ID */
  id: string;
  /** 표시 이름 */
  displayName: string;
  /** 이전 값 (숫자인 경우) */
  oldValue?: number;
  /** 새로운 값 (숫자인 경우) */
  newValue?: number;
  /** 변화량 (숫자인 경우) */
  change?: number;
  /** 수량 (아이템인 경우) */
  quantity?: number;
  /** 추가 표시 텍스트 (스킬 랭크업 등 특수 포맷) */
  extraText?: string;
}

/**
 * 전체 변화 결과 인터페이스
 */
export interface StateChangeResult {
  /** 변화가 있었는지 여부 */
  hasChanges: boolean;
  /** 변화 항목 목록 */
  changes: StateChange[];
}

/**
 * GameState 변화 비교기
 * 씬 효과 적용 전후의 GameState를 비교하여 변화 내용을 추출합니다.
 */
export class GameStateComparator {
  /**
   * 공통: 변화 항목을 changes 배열에 추가합니다.
   */
  private static pushChange(changes: StateChange[], change: StateChange): void {
    changes.push(change);
  }

  /**
   * 경험치 타입이 스킬 카테고리인지 확인합니다.
   */
  private static isSkillExperienceType(experienceType: string): boolean {
    const config = EXPERIENCE_CONFIGS[experienceType];
    return !!config && config.category === 'skill';
  }

  /**
   * 씬 효과의 경험치(exp)를 평탄화하여 키-값 맵으로 생성합니다.
   * - 상위 exp 숫자 키와 exp.skills 하위 키를 모두 합산합니다.
   */
  private static buildFlatExpFromEffects(
    effects: SceneEffects
  ): Record<string, number> {
    const flatExp: Record<string, number> = {};
    if (!effects.exp) return flatExp;

    // 상위 숫자 키
    for (const [key, value] of Object.entries(effects.exp)) {
      if (key === 'skills') continue;
      if (typeof value === 'number' && value !== 0) {
        flatExp[key] = (flatExp[key] || 0) + value;
      }
    }

    // 하위 skills 키
    const expAny: any = effects.exp as any;
    if (expAny?.skills && typeof expAny.skills === 'object') {
      for (const [skillId, amount] of Object.entries(expAny.skills)) {
        if (typeof amount === 'number' && amount !== 0) {
          flatExp[skillId] = (flatExp[skillId] || 0) + amount;
        }
      }
    }

    return flatExp;
  }

  /**
   * 스킬 랭크 이름을 안전하게 조회합니다. 범위를 벗어나면 "Lv.X"로 대체합니다.
   */
  private static getSkillRankName(skillId: string, level: number): string {
    const skillData = getSkillById(skillId);
    const ranks = skillData?.ranks ?? [];
    return ranks[level - 1]?.name || `Lv.${level}`;
  }

  /**
   * 스킬 레벨 변화 StateChange를 생성합니다. 최초 획득과 일반 레벨업을 구분합니다.
   */
  private static createSkillLevelChange(
    skillId: string,
    beforeLevel: number,
    afterLevel: number
  ): StateChange | null {
    if (afterLevel <= beforeLevel) return null;

    if (beforeLevel === 0) {
      const firstRankName = this.getSkillRankName(skillId, 1);
      return {
        category: 'level',
        type: 'increase',
        id: skillId,
        displayName: skillId,
        change: afterLevel - beforeLevel,
        extraText: `+ ${firstRankName}`,
      };
    }

    const prevRankName = this.getSkillRankName(skillId, beforeLevel);
    const nextRankName = this.getSkillRankName(skillId, afterLevel);
    return {
      category: 'level',
      type: 'increase',
      id: skillId,
      displayName: skillId,
      change: afterLevel - beforeLevel,
      extraText: `+ ${prevRankName} → ${nextRankName}`,
    };
  }

  /**
   * 스킬 레벨업을 엔진 로직으로 시뮬레이션하고, 실제로 레벨이 오른 스킬만 변화로 반환합니다.
   */
  private static predictSkillLevelChanges(
    currentState: GameState,
    flatExp: Record<string, number>
  ): StateChange[] {
    const result: StateChange[] = [];
    for (const [skillId, amountUnknown] of Object.entries(flatExp)) {
      if (!this.isSkillExperienceType(skillId)) continue;
      const amount = typeof amountUnknown === 'number' ? amountUnknown : 0;
      if (amount <= 0) continue;

      const currentLevel = currentState.levels?.[skillId] || 0;
      const currentExp = currentState.experience?.[skillId] || 0;

      // 이전 상태 추정: 이번 씬 추가량을 빼고, 음수면 레벨 하나 되돌려 보정
      let prevLevel = currentLevel;
      let prevExp = currentExp - amount;
      if (prevExp < 0 && currentLevel > 0) {
        prevLevel = currentLevel - 1;
        const needPrev = ExperienceManager.getExpToLevel(skillId, prevLevel);
        prevExp = prevExp + (Number.isFinite(needPrev) ? needPrev : 0);
      }

      // prev 상태에서 amount를 더했을 때 얼마나 레벨업하는지 시뮬레이션
      let simLevel = prevLevel;
      let simExp = prevExp + amount;
      const maxSafe = 50; // 안전 가드
      let steps = 0;
      while (steps++ < maxSafe) {
        const need = ExperienceManager.getExpToLevel(skillId, simLevel);
        if (!Number.isFinite(need) || need <= 0) break;
        if (simExp >= need) {
          simExp -= need;
          simLevel += 1;
        } else {
          break;
        }
      }

      if (simLevel > prevLevel) {
        const change = this.createSkillLevelChange(
          skillId,
          prevLevel,
          simLevel
        );
        if (change) result.push(change);
      }
    }
    return result;
  }
  /**
   * 두 GameState를 비교하여 변화 내용을 반환합니다.
   * @param oldState - 이전 게임 상태
   * @param newState - 새로운 게임 상태
   * @returns 변화 결과
   */
  static compareStates(
    oldState: GameState,
    newState: GameState
  ): StateChangeResult {
    const changes: StateChange[] = [];

    // 1. 능력치 변화 감지
    this.compareStats(oldState, newState, changes);

    // 2. 자원 변화 감지
    this.compareResources(oldState, newState, changes);

    // 3. 상태(버프) 변화 감지
    this.compareBuffs(oldState, newState, changes);

    // 4. 아이템 변화 감지
    this.compareItems(oldState, newState, changes);

    // 5. 경험치 변화 감지
    this.compareExperience(oldState, newState, changes);

    // 6. 레벨 변화 감지
    this.compareLevels(oldState, newState, changes);

    return {
      hasChanges: changes.length > 0,
      changes: changes,
    };
  }

  /**
   * 능력치 변화를 감지합니다.
   */
  private static compareStats(
    oldState: GameState,
    newState: GameState,
    changes: StateChange[]
  ): void {
    this.compareNumericByKeys(
      STAT_KEYS as unknown as string[],
      oldState,
      newState,
      (key: string) => STATS[key as keyof typeof STATS]?.displayName || key,
      'stat',
      changes
    );
  }

  /**
   * 자원 변화를 감지합니다.
   */
  private static compareResources(
    oldState: GameState,
    newState: GameState,
    changes: StateChange[]
  ): void {
    this.compareNumericByKeys(
      RESOURCE_KEYS as unknown as string[],
      oldState,
      newState,
      (key: string) =>
        RESOURCES[key as keyof typeof RESOURCES]?.displayName || key,
      'resource',
      changes
    );
  }

  /**
   * 공통: 숫자형 필드 목록을 비교하여 변화가 있으면 추가합니다.
   */
  private static compareNumericByKeys(
    keys: string[],
    oldState: Record<string, any>,
    newState: Record<string, any>,
    getDisplayName: (key: string) => string,
    category: 'stat' | 'resource',
    changes: StateChange[]
  ): void {
    for (const key of keys) {
      const oldValue = oldState[key] as number;
      const newValue = newState[key] as number;
      if (oldValue !== newValue) {
        const displayName = getDisplayName(key);
        const delta = newValue - oldValue;
        this.pushChange(changes, {
          category,
          type: delta > 0 ? 'increase' : 'decrease',
          id: key,
          displayName,
          oldValue,
          newValue,
          change: Math.abs(delta),
        });
      }
    }
  }

  /**
   * 상태(버프) 변화를 감지합니다.
   */
  private static compareBuffs(
    oldState: GameState,
    newState: GameState,
    changes: StateChange[]
  ): void {
    const oldBuffs = new Set(oldState.buffs || []);
    const newBuffs = new Set(newState.buffs || []);

    // 추가된 버프
    for (const buffKey of newBuffs) {
      if (!oldBuffs.has(buffKey)) {
        const buffData = getBuffById(buffKey);
        changes.push({
          category: 'buff',
          type: 'add',
          id: buffKey,
          displayName: buffData?.displayName || buffKey,
        });
      }
    }

    // 제거된 버프
    for (const buffKey of oldBuffs) {
      if (!newBuffs.has(buffKey)) {
        const buffData = getBuffById(buffKey);
        changes.push({
          category: 'buff',
          type: 'remove',
          id: buffKey,
          displayName: buffData?.displayName || buffKey,
        });
      }
    }
  }

  /**
   * 아이템 변화를 감지합니다.
   */
  private static compareItems(
    oldState: GameState,
    newState: GameState,
    changes: StateChange[]
  ): void {
    // 아이템 ID별로 수량 맵 생성
    const oldItemMap = new Map<ItemId, number>();
    const newItemMap = new Map<ItemId, number>();

    // 이전 상태 아이템 맵 구성
    (oldState.items || []).forEach(item => {
      oldItemMap.set(
        item.id,
        (oldItemMap.get(item.id) || 0) + (item.quantity || 1)
      );
    });

    // 새로운 상태 아이템 맵 구성
    (newState.items || []).forEach(item => {
      newItemMap.set(
        item.id,
        (newItemMap.get(item.id) || 0) + (item.quantity || 1)
      );
    });

    // 모든 아이템 ID 수집
    const allItemIds = new Set([...oldItemMap.keys(), ...newItemMap.keys()]);

    for (const itemId of allItemIds) {
      const oldQuantity = oldItemMap.get(itemId) || 0;
      const newQuantity = newItemMap.get(itemId) || 0;

      if (oldQuantity !== newQuantity) {
        const itemData = getItemById(itemId);
        const displayName = itemData?.name || itemId;

        if (oldQuantity === 0) {
          // 새로 획득
          changes.push({
            category: 'item',
            type: 'add',
            id: itemId,
            displayName,
            quantity: newQuantity,
          });
        } else if (newQuantity === 0) {
          // 완전 상실
          changes.push({
            category: 'item',
            type: 'remove',
            id: itemId,
            displayName,
            quantity: oldQuantity,
          });
        } else {
          // 수량 변화
          const change = newQuantity - oldQuantity;
          changes.push({
            category: 'item',
            type: change > 0 ? 'increase' : 'decrease',
            id: itemId,
            displayName,
            oldValue: oldQuantity,
            newValue: newQuantity,
            change: Math.abs(change),
          });
        }
      }
    }
  }

  /**
   * 경험치 변화를 감지합니다.
   */
  private static compareExperience(
    oldState: GameState,
    newState: GameState,
    changes: StateChange[]
  ): void {
    const oldExp = oldState.experience || {};
    const newExp = newState.experience || {};

    // 모든 경험치 타입 수집
    const allExpTypes = new Set([
      ...Object.keys(oldExp),
      ...Object.keys(newExp),
    ]);

    for (const expType of allExpTypes) {
      const oldValue = oldExp[expType] || 0;
      const newValue = newExp[expType] || 0;

      if (oldValue !== newValue) {
        const config = EXPERIENCE_CONFIGS[expType];
        const displayName = config?.displayName || expType;
        const change = newValue - oldValue;

        changes.push({
          category: 'experience',
          type: change > 0 ? 'increase' : 'decrease',
          id: expType,
          displayName: `${displayName} 경험치`,
          oldValue,
          newValue,
          change: Math.abs(change),
        });
      }
    }
  }

  /**
   * 레벨 변화를 감지합니다.
   */
  private static compareLevels(
    oldState: GameState,
    newState: GameState,
    changes: StateChange[]
  ): void {
    const oldLevels = oldState.levels || {};
    const newLevels = newState.levels || {};

    // 모든 레벨 타입 수집
    const allLevelTypes = new Set([
      ...Object.keys(oldLevels),
      ...Object.keys(newLevels),
    ]);

    for (const levelType of allLevelTypes) {
      const oldValue = oldLevels[levelType] || 0;
      const newValue = newLevels[levelType] || 0;

      if (oldValue !== newValue) {
        const config = EXPERIENCE_CONFIGS[levelType];
        const displayName = config?.displayName || levelType;
        const change = newValue - oldValue;

        changes.push({
          category: 'level',
          type: change > 0 ? 'increase' : 'decrease',
          id: levelType,
          displayName: `${displayName} 레벨`,
          oldValue,
          newValue,
          change: Math.abs(change),
        });
      }
    }
  }

  /**
   * 씬 효과를 기반으로 예상 변화를 계산합니다.
   * 실제 적용 전에 어떤 변화가 있을지 미리 보여주기 위한 용도입니다.
   * @param effects - 씬 효과
   * @returns 예상 변화 결과
   */
  static predictChangesFromEffects(
    effects: SceneEffects,
    currentState?: GameState
  ): StateChangeResult {
    const changes: StateChange[] = [];

    // 1. 능력치 변화 예측
    this.predictNumericByKeys(
      effects,
      STAT_KEYS as unknown as string[],
      (key: string) => STATS[key as keyof typeof STATS]?.displayName || key,
      'stat',
      changes
    );

    // 2. 자원 변화 예측
    this.predictNumericByKeys(
      effects,
      RESOURCE_KEYS as unknown as string[],
      (key: string) =>
        RESOURCES[key as keyof typeof RESOURCES]?.displayName || key,
      'resource',
      changes
    );

    // 3~4. 상태/아이템 예측(공통 헬퍼)
    this.predictBuffAndItemChanges(effects, changes);

    // 5. 경험치 예측 (공통 빌더 + 스킬 시뮬)
    if (effects.exp) {
      const flatExp = this.buildFlatExpFromEffects(effects);

      for (const [expType, amount] of Object.entries(flatExp)) {
        if (this.isSkillExperienceType(expType)) continue;
        const config = EXPERIENCE_CONFIGS[expType];
        const displayName = config?.displayName || expType;
        this.pushChange(changes, {
          category: 'experience',
          type: amount > 0 ? 'increase' : 'decrease',
          id: expType,
          displayName: `${displayName} 경험치`,
          change: Math.abs(amount),
        });
      }

      if (currentState) {
        const skillLevelChanges = this.predictSkillLevelChanges(
          currentState,
          flatExp
        );
        skillLevelChanges.forEach(c => this.pushChange(changes, c));
      }
    }

    // 6. 수동 레벨업 예측
    if (effects.manual_level_up && effects.manual_level_up.length > 0) {
      for (const levelType of effects.manual_level_up) {
        const config = EXPERIENCE_CONFIGS[levelType];
        const displayName = config?.displayName || levelType;
        this.pushChange(changes, {
          category: 'level',
          type: 'increase',
          id: levelType,
          displayName: `${displayName} 레벨`,
          change: 1,
        });
      }
    }

    return {
      hasChanges: changes.length > 0,
      changes,
    };
  }

  /**
   * 공통: SceneEffects에서 숫자형 변화 예측을 추가합니다.
   */
  private static predictNumericByKeys(
    effects: SceneEffects,
    keys: string[],
    getDisplayName: (key: string) => string,
    category: 'stat' | 'resource',
    changes: StateChange[]
  ): void {
    for (const key of keys) {
      if (!(key in effects)) continue;
      const changeValue = (effects as Record<string, any>)[key];
      if (typeof changeValue !== 'number' || changeValue === 0) continue;
      const displayName = getDisplayName(key);
      this.pushChange(changes, {
        category,
        type: changeValue > 0 ? 'increase' : 'decrease',
        id: key,
        displayName,
        change: Math.abs(changeValue),
      });
    }
  }

  /**
   * 공통: 버프/아이템 변화 예측을 추가합니다.
   */
  private static predictBuffAndItemChanges(
    effects: SceneEffects,
    changes: StateChange[]
  ): void {
    // 버프 추가/제거
    if (effects.add_buffs && effects.add_buffs.length > 0) {
      for (const buffKey of effects.add_buffs) {
        const buffData = getBuffById(buffKey);
        this.pushChange(changes, {
          category: 'buff',
          type: 'add',
          id: buffKey,
          displayName: buffData?.displayName || buffKey,
        });
      }
    }
    if (effects.remove_buffs && effects.remove_buffs.length > 0) {
      for (const buffKey of effects.remove_buffs) {
        const buffData = getBuffById(buffKey);
        this.pushChange(changes, {
          category: 'buff',
          type: 'remove',
          id: buffKey,
          displayName: buffData?.displayName || buffKey,
        });
      }
    }

    // 아이템 추가/제거
    if (effects.items) {
      for (const [itemId, quantity] of Object.entries(effects.items) as [
        string,
        number,
      ][]) {
        if (quantity === 0) continue;
        const itemData = getItemById(itemId);
        const displayName = itemData?.name || itemId;
        this.pushChange(changes, {
          category: 'item',
          type: quantity > 0 ? 'add' : 'remove',
          id: itemId,
          displayName,
          quantity: Math.abs(quantity),
        });
      }
    }
  }

  /**
   * 변화 내용을 텍스트로 포맷팅합니다.
   * 씬 텍스트에 추가할 수 있도록 문자열로 반환합니다.
   * @param effects - 씬 효과
   * @returns 포맷팅된 변화 텍스트
   */
  static formatChangesAsText(
    effects: SceneEffects,
    currentState?: GameState
  ): string {
    // 상태 디버그: 스킬 관련 현재 수치와 이번 효과로 추가될 양을 함께 출력
    if (currentState && effects.exp) {
      try {
        const flatExp = this.buildFlatExpFromEffects(effects);
        const skillDebugLines: string[] = [];
        for (const [expType, amount] of Object.entries(flatExp)) {
          if (!this.isSkillExperienceType(expType)) continue;
          const level = currentState.levels?.[expType] || 0;
          const exp = currentState.experience?.[expType] || 0;
          const need = ExperienceManager.getExpToLevel(expType, level);
          skillDebugLines.push(
            `${expType}: Lv.${level}, exp=${exp}, add=${amount}, need=${Number.isFinite(need) ? need : '∞'}`
          );
        }
        if (skillDebugLines.length > 0) {
          Logger.debug(
            '[GameStateComparator]',
            `🔎 현재 상태(스킬): ${skillDebugLines.join(' | ')}`
          );
        }
      } catch (e) {
        Logger.warn('[GameStateComparator]', '상태 디버그 준비 중 오류', e);
      }
    }

    const result = this.predictChangesFromEffects(effects, currentState);

    // 로그: 예측된 변화 요약
    try {
      if (result.hasChanges) {
        const summary = result.changes
          .map(
            c =>
              `${c.category}:${c.id}:${c.type}${c.change ? `(${c.change})` : ''}${c.extraText ? ` ${c.extraText}` : ''}`
          )
          .join(', ');
        Logger.debug(
          '[GameStateComparator]',
          `📝 이펙트 텍스트 예측 결과: ${summary}`
        );
      } else {
        Logger.debug(
          '[GameStateComparator]',
          '📝 이펙트 텍스트 예측 결과: 변화 없음'
        );
      }
    } catch (e) {
      Logger.warn('[GameStateComparator]', '이펙트 예측 로그 출력 중 오류', e);
    }

    if (!result.hasChanges) {
      return '';
    }

    const changeTexts: string[] = [];

    // 카테고리별 우선순위에 따라 정렬
    const categoryOrder = [
      'stat',
      'resource',
      'level',
      'experience',
      'buff',
      'item',
    ];

    categoryOrder.forEach(category => {
      const categoryChanges = result.changes.filter(
        change => change.category === category
      );

      categoryChanges.forEach(change => {
        let changeText = '';

        switch (change.category) {
          case 'stat':
          case 'resource':
            const icon = change.type === 'increase' ? '+' : '-';
            const color = change.type === 'increase' ? 'positive' : 'negative';
            changeText = `{{${color}}}${change.displayName} ${icon} ${change.change}{{${color}}}`;
            break;

          case 'experience':
            const expIcon = change.type === 'increase' ? '+' : '-';
            const expColor =
              change.type === 'increase' ? 'positive' : 'negative';
            changeText = `{{${expColor}}}${change.displayName} ${expIcon} ${change.change}{{${expColor}}}`;
            break;

          case 'level': {
            const config = EXPERIENCE_CONFIGS[change.id];
            if (config && config.category === 'skill' && change.extraText) {
              changeText = `{{positive}}${change.extraText}{{positive}}`;
            } else {
              changeText = `{{positive}}${change.displayName} + ${change.change}{{positive}}`;
            }
            break;
          }

          case 'buff':
            if (change.type === 'add') {
              changeText = `{{positive}}+ ${change.displayName}{{positive}}`;
            } else {
              changeText = `{{negative}}- ${change.displayName}{{negative}}`;
            }
            break;

          case 'item':
            if (change.type === 'add') {
              const quantityText =
                change.quantity && change.quantity > 1
                  ? ` x${change.quantity}`
                  : '';
              changeText = `{{positive}}+ ${change.displayName}${quantityText}{{positive}}`;
            } else if (change.type === 'remove') {
              const quantityText =
                change.quantity && change.quantity > 1
                  ? ` x${change.quantity}`
                  : '';
              changeText = `{{negative}}- ${change.displayName}${quantityText}{{negative}}`;
            } else {
              const itemIcon = change.type === 'increase' ? '+' : '-';
              const itemColor =
                change.type === 'increase' ? 'positive' : 'negative';
              changeText = `{{${itemColor}}}${change.displayName} ${itemIcon} ${change.change}{{${itemColor}}}`;
            }
            break;
        }

        if (changeText) {
          changeTexts.push(changeText);
        }
      });
    });

    if (changeTexts.length === 0) {
      return '';
    }

    // 변화 내용을 줄바꿈으로 구분하여 합치기
    const effectsText = `\n\n${changeTexts.join('\n')}\n`;

    // 로그: 최종 텍스트
    try {
      Logger.debug(
        '[GameStateComparator]',
        `🖨️ 이펙트 텍스트 출력:\n${effectsText}`
      );
    } catch (e) {
      Logger.warn(
        '[GameStateComparator]',
        '이펙트 텍스트 로그 출력 중 오류',
        e
      );
    }

    return effectsText;
  }
}
