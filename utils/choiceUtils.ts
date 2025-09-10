import { RESOURCE_KEYS, STATS, STAT_KEYS } from '../constants/gameConfig';
import {
  Choice,
  Condition,
  GameState,
  MinMaxRange,
  Probability,
} from '../types';
import {
  getBuffById,
  getFlagById,
  getItemById,
  getSkillById,
} from './dataLoader';
import { calculateProbability, checkCondition } from './scene';

/**
 * MinMaxRange 타입 가드 함수
 */
function isMinMaxRange(value: unknown): value is MinMaxRange {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('min' in value || 'max' in value)
  );
}

/**
 * 스킬 레벨에 대응하는 랭크 라벨을 반환합니다.
 * - 랭크명이 있으면 "랭크명 Lv.X"
 * - 없거나 범위를 벗어나면 "Lv.X"
 */
function getSkillRankName(skillId: string, level: number): string {
  if (!level || level <= 0) return '미보유';
  const skill: any = getSkillById(skillId);
  const ranks: any[] | undefined = skill?.ranks;
  const idx = level - 1;
  const rank = ranks && ranks[idx];
  const rankName: string | undefined = rank?.name;
  return rankName || '미보유';
}

/**
 * 숫자 조건을 텍스트로 변환 (통합 처리)
 */
function formatNumberCondition(
  key: string,
  conditionValue: number | MinMaxRange,
  currentValue: number,
  gameState: GameState
): string {
  const checkValue = { [key]: conditionValue };
  const isMet = checkCondition(checkValue, gameState);
  const status = isMet ? '✓' : '✗';

  if (typeof conditionValue === 'number') {
    return `${key} =${conditionValue}${status} (${currentValue})`;
  }

  const { min, max } = conditionValue;
  let rangeText = '';

  if (min !== undefined && max !== undefined) {
    rangeText = `${min}-${max}`;
  } else if (min !== undefined) {
    rangeText = `≥${min}`;
  } else if (max !== undefined) {
    rangeText = `≤${max}`;
  }

  return `${key} ${rangeText}${status} (${currentValue})`;
}

/**
 * AtomicCondition을 간단한 텍스트로 변환 (최적화됨)
 * @param atomicCondition - 원자적 조건 객체
 * @param gameState - 현재 게임 상태
 * @returns 조건 텍스트 배열
 */
function getAtomicConditionText(
  atomicCondition: any,
  gameState: GameState
): string[] {
  const conditions: string[] = [];

  // 능력치/자원 조건 (통합 처리)
  const numberKeys = [...STAT_KEYS, ...RESOURCE_KEYS];
  for (const key of numberKeys) {
    if (key in atomicCondition) {
      const currentValue = gameState[key as keyof GameState] as number;
      conditions.push(
        formatNumberCondition(
          key,
          atomicCondition[key],
          currentValue,
          gameState
        )
      );
    }
  }

  // 상태/플래그 조건 (in / not_in)
  const listConditionKeys: Array<{
    key: 'buffs' | 'flags';
    label: string;
    gameArray: string[];
  }> = [
    { key: 'buffs', label: '상태', gameArray: gameState.buffs },
    { key: 'flags', label: '플래그', gameArray: gameState.flags },
  ];

  for (const { key, label, gameArray } of listConditionKeys) {
    const obj = atomicCondition[key];
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const inArr: string[] | undefined = obj.in;
      const notInArr: string[] | undefined = obj.not_in;

      if (inArr && inArr.length > 0) {
        const ok = inArr.every(v => gameArray.includes(v));
        conditions.push(`${label} 포함: ${inArr.join(', ')}${ok ? '✓' : '✗'}`);
      }
      if (notInArr && notInArr.length > 0) {
        const ok = notInArr.every(v => !gameArray.includes(v));
        conditions.push(
          `${label} 제외: ${notInArr.join(', ')}${ok ? '✓' : '✗'}`
        );
      }
    }
  }

  // 아이템 조건
  if (atomicCondition.items && Object.keys(atomicCondition.items).length > 0) {
    const itemTexts: string[] = [];

    for (const [itemId, conditionValue] of Object.entries(
      atomicCondition.items
    )) {
      const item = (gameState.items ?? []).find(item => item.id === itemId);

      let itemMet = false;
      let itemText = itemId;

      // 개수 조건 (number 또는 MinMaxRange)
      // 아이템이 없으면 수량을 0으로 처리
      const currentQuantity = item?.quantity ?? 0;
      itemMet = checkCondition(
        { items: { [itemId]: conditionValue } },
        gameState
      );

      if (typeof conditionValue === 'number') {
        itemText = `${itemId}×${conditionValue}`;
      } else if (isMinMaxRange(conditionValue)) {
        const { min, max } = conditionValue;
        if (min !== undefined && max !== undefined) {
          itemText = `${itemId}×${min}-${max}`;
        } else if (min !== undefined) {
          itemText = `${itemId}×${min}+`;
        } else if (max !== undefined) {
          itemText = `${itemId}×-${max}`;
        }
      }
      itemText += ` (${currentQuantity})`;

      itemTexts.push(`${itemText}${itemMet ? '✓' : '✗'}`);
    }

    conditions.push(`아이템: ${itemTexts.join(', ')}`);
  }

  // 스킬 조건 (레벨 기반)
  if (
    atomicCondition.skills &&
    Object.keys(atomicCondition.skills).length > 0
  ) {
    const skillTexts: string[] = [];
    for (const [skillId, conditionValue] of Object.entries(
      atomicCondition.skills
    )) {
      const currentLevel = (gameState.levels && gameState.levels[skillId]) || 0;
      const isMet = checkCondition(
        { skills: { [skillId]: conditionValue } } as any,
        gameState
      );

      let skillText = skillId;
      if (typeof conditionValue === 'number') {
        const requiredName = getSkillRankName(skillId, conditionValue);
        skillText = `${skillId} ${requiredName}`;
      } else if (isMinMaxRange(conditionValue)) {
        const { min, max } = conditionValue as MinMaxRange;
        if (min !== undefined && max !== undefined) {
          skillText = `${skillId} Lv.${min}-${max}`;
        } else if (min !== undefined) {
          skillText = `${skillId} Lv.≥${min}`;
        } else if (max !== undefined) {
          skillText = `${skillId} Lv.≤${max}`;
        }
      }
      const currentName = getSkillRankName(skillId, currentLevel);
      skillText += ` (${currentName})`;
      skillTexts.push(`${skillText}${isMet ? '✓' : '✗'}`);
    }
    conditions.push(`스킬: ${skillTexts.join(', ')}`);
  }

  // 기타 조건들 (변수, 층, 사망 횟수 등)
  if (atomicCondition.current_floor !== undefined) {
    const isMet = gameState.current_floor === atomicCondition.current_floor;
    conditions.push(
      `층: ${atomicCondition.current_floor}${isMet ? '✓' : '✗'} (${gameState.current_floor})`
    );
  }

  if (atomicCondition.scene_count !== undefined) {
    const currentCount = gameState.scene_count ?? 0;
    const sceneCountValue = atomicCondition.scene_count;

    if (typeof sceneCountValue === 'number') {
      const isMet = currentCount === sceneCountValue;
      conditions.push(
        `씬수: =${sceneCountValue}${isMet ? '✓' : '✗'} (${currentCount})`
      );
    } else if (isMinMaxRange(sceneCountValue)) {
      const { min, max } = sceneCountValue;
      let conditionText = '';
      if (min !== undefined && max !== undefined) {
        conditionText = `씬수: ${min}-${max}`;
      } else if (min !== undefined) {
        conditionText = `씬수: ≥${min}`;
      } else if (max !== undefined) {
        conditionText = `씬수: ≤${max}`;
      }

      const isMet = checkCondition({ scene_count: sceneCountValue }, gameState);
      conditions.push(`${conditionText}${isMet ? '✓' : '✗'} (${currentCount})`);
    }
  }

  if (atomicCondition.can_level_up !== undefined) {
    const isMet = checkCondition(
      { can_level_up: atomicCondition.can_level_up },
      gameState
    );
    conditions.push(
      `레벨업: ${atomicCondition.can_level_up}${isMet ? '✓' : '✗'}`
    );
  }

  return conditions;
}

/**
 * 선택지 조건을 간단한 텍스트로 변환 (MongoDB 스타일 조건 지원)
 * @param condition - 조건 객체 ($and/$or 형식)
 * @param gameState - 현재 게임 상태
 * @returns 조건 텍스트
 */
export function getConditionText(
  condition: Condition,
  gameState: GameState
): string {
  const conditions: string[] = [];

  // $and 조건 처리
  if ('$and' in condition && condition.$and) {
    const andConditions: string[] = [];

    for (const subCondition of condition.$and) {
      if ('$and' in subCondition || '$or' in subCondition) {
        // 중첩된 논리 조건은 재귀적으로 처리
        const nestedText = getConditionText(
          subCondition as Condition,
          gameState
        );
        if (nestedText) {
          andConditions.push(`(${nestedText})`);
        }
      } else {
        // AtomicCondition 처리
        const atomicTexts = getAtomicConditionText(subCondition, gameState);
        andConditions.push(...atomicTexts);
      }
    }

    if (andConditions.length > 0) {
      conditions.push(andConditions.join(' & '));
    }
  }

  // $or 조건 처리
  if ('$or' in condition && condition.$or) {
    const orConditions: string[] = [];

    for (const subCondition of condition.$or) {
      if ('$and' in subCondition || '$or' in subCondition) {
        // 중첩된 논리 조건은 재귀적으로 처리
        const nestedText = getConditionText(
          subCondition as Condition,
          gameState
        );
        if (nestedText) {
          orConditions.push(`(${nestedText})`);
        }
      } else {
        // AtomicCondition 처리
        const atomicTexts = getAtomicConditionText(subCondition, gameState);
        orConditions.push(...atomicTexts);
      }
    }

    if (orConditions.length > 0) {
      conditions.push(orConditions.join(' | '));
    }
  }

  return conditions.join(' ');
}

/**
 * 확률 정보를 간단한 텍스트로 변환 (디버그용)
 * @param probability - 확률 객체
 * @param gameState - 현재 게임 상태
 * @returns 확률 텍스트
 */
export function getProbabilityText(
  probability: Probability,
  gameState: GameState
): string {
  const { percentage, statIcons, otherModifiers } = getProbabilityDisplayInfo(
    probability,
    gameState
  );

  let text = `${percentage}%`;

  // max_rate가 100%보다 낮으면 표시
  if (probability.max_rate !== undefined && probability.max_rate < 1) {
    const maxPercentage = Math.round(probability.max_rate * 100);
    text += ` (최대 ${maxPercentage}%)`;
  }

  // 수정자가 있으면 표시
  const allModifiers = [...statIcons, ...otherModifiers];
  if (allModifiers.length > 0) {
    text += ` (${allModifiers.join(', ')})`;
  }

  return text;
}

/**
 * 확률 수정자에서 실제로 적용되는 요소들만 추출
 */
function getActiveModifiers(
  probability: Probability,
  gameState: GameState
): string[] {
  const modifiers: string[] = [];

  if (!probability.modifier) return modifiers;

  // 능력치 수정자 (값이 0보다 큰 경우만)
  if (probability.modifier.stats) {
    for (const [statKey, config] of Object.entries(
      probability.modifier.stats
    )) {
      if (!config) continue;

      const statValue = gameState[statKey as keyof GameState] as number;
      if (statValue > 0) {
        const statLabel =
          STATS[statKey as keyof typeof STATS]?.displayName || statKey;
        const bonus = Math.round(statValue * config.per_unit * 100);
        const cappedBonus = config.max
          ? Math.min(bonus, config.max * 100)
          : bonus;
        modifiers.push(`${statLabel} (+${cappedBonus}%)`);
      }
    }
  }

  // 버프 수정자 (보유한 것만)
  if (probability.modifier.buffs) {
    for (const [buffId, config] of Object.entries(probability.modifier.buffs)) {
      if (config && gameState.buffs.includes(buffId)) {
        const buffData = getBuffById(buffId);
        modifiers.push(buffData?.displayName || buffId);
      }
    }
  }

  // 플래그 수정자 (보유한 것만)
  if (probability.modifier.flags) {
    for (const [flagId, config] of Object.entries(probability.modifier.flags)) {
      if (config && gameState.flags.includes(flagId)) {
        const flagData = getFlagById(flagId);
        modifiers.push(flagData?.displayName || flagId);
      }
    }
  }

  // 아이템 수정자 (보유한 것만)
  if (probability.modifier.items) {
    for (const [itemId, config] of Object.entries(probability.modifier.items)) {
      if (!config) continue;

      const item = gameState.items.find(item => item.id === itemId);
      if ((item?.quantity ?? 0) > 0) {
        const itemData = getItemById(itemId);
        modifiers.push(itemData?.name || itemId);
      }
    }
  }

  // 변수 수정자 (값이 0보다 큰 것만)
  if (probability.modifier.variables) {
    for (const [variableId, config] of Object.entries(
      probability.modifier.variables
    )) {
      if (config && (gameState.variables[variableId] || 0) > 0) {
        modifiers.push(variableId);
      }
    }
  }

  // 스킬 수정자 (레벨이 1 이상인 것만)
  if (probability.modifier.skills) {
    for (const [skillId, config] of Object.entries(
      probability.modifier.skills as Record<string, any>
    )) {
      if (config) {
        const level = (gameState.levels && gameState.levels[skillId]) || 0;
        if (level > 0) {
          const rankName = getSkillRankName(skillId, level);
          modifiers.push(rankName);
        }
      }
    }
  }

  return modifiers;
}

export interface ProbabilityDisplayInfo {
  percentage: number;
  statIcons: string[]; // 스탯 아이콘 이름들 (strength, agility 등)
  otherModifiers: string[]; // 다른 수정자들 (버프, 플래그 등)
}

/**
 * 선택지 확률 정보를 UI에 적합한 형식으로 변환 (레이아웃 분리)
 * @param probability - 확률 객체
 * @param gameState - 현재 게임 상태
 * @returns 확률 정보 객체
 */
export function getProbabilityDisplayInfo(
  probability: Probability,
  gameState: GameState
): ProbabilityDisplayInfo {
  // 최종 확률 계산
  let finalRate = calculateProbability(
    probability.base_rate,
    probability.modifier,
    gameState
  );

  // max_rate 적용
  if (probability.max_rate !== undefined) {
    finalRate = Math.max(0, Math.min(probability.max_rate, finalRate));
  }

  const percentage = Math.round(finalRate * 100);
  const { statIcons, otherModifiers } = getSeparatedModifiers(
    probability,
    gameState
  );

  return {
    percentage,
    statIcons: statIcons || [],
    otherModifiers: otherModifiers || [],
  };
}

/**
 * 확률 수정자를 스탯 아이콘과 다른 수정자들로 분리
 */
function getSeparatedModifiers(
  probability: Probability,
  gameState: GameState
): { statIcons: string[]; otherModifiers: string[] } {
  const statIcons: string[] = [];
  const otherModifiers: string[] = [];

  if (!probability.modifier) return { statIcons, otherModifiers };

  // 스탯 수정자 (아이콘만)
  if (probability.modifier.stats) {
    for (const [statKey, config] of Object.entries(
      probability.modifier.stats
    )) {
      if (!config) continue;

      const statValue = gameState[statKey as keyof GameState] as number;
      if (statValue > 0) {
        statIcons.push(statKey); // strength, agility 등
      }
    }
  }

  // 버프 수정자 (텍스트만)
  if (probability.modifier.buffs) {
    for (const [buffId, config] of Object.entries(probability.modifier.buffs)) {
      if (config && gameState.buffs.includes(buffId)) {
        const buffData = getBuffById(buffId);
        otherModifiers.push(buffData?.displayName || buffId);
      }
    }
  }

  // 플래그 수정자 (텍스트만)
  if (probability.modifier.flags) {
    for (const [flagId, config] of Object.entries(probability.modifier.flags)) {
      if (config && gameState.flags.includes(flagId)) {
        const flagData = getFlagById(flagId);
        otherModifiers.push(flagData?.displayName || flagId);
      }
    }
  }

  // 아이템 수정자 (텍스트만)
  if (probability.modifier.items) {
    for (const [itemId, config] of Object.entries(probability.modifier.items)) {
      if (!config) continue;

      const item = gameState.items.find(item => item.id === itemId);
      if ((item?.quantity ?? 0) > 0) {
        const itemData = getItemById(itemId);
        otherModifiers.push(itemData?.name || itemId);
      }
    }
  }

  // 변수 수정자 (텍스트만)
  if (probability.modifier.variables) {
    for (const [variableId, config] of Object.entries(
      probability.modifier.variables
    )) {
      if (config && (gameState.variables[variableId] || 0) > 0) {
        otherModifiers.push(variableId);
      }
    }
  }

  // 스킬 수정자 (텍스트만)
  if (probability.modifier.skills) {
    for (const [skillId, config] of Object.entries(
      probability.modifier.skills as Record<string, any>
    )) {
      if (config) {
        const level = (gameState.levels && gameState.levels[skillId]) || 0;
        if (level > 0) {
          const rankName = getSkillRankName(skillId, level);
          otherModifiers.push(rankName);
        }
      }
    }
  }

  return {
    statIcons: statIcons || [],
    otherModifiers: otherModifiers || [],
  };
}

/**
 * Next 정보를 간단한 텍스트로 변환
 * @param next - Next 객체
 * @returns Next 텍스트
 */
export function getNextText(next: {
  chapter_id?: string;
  scene_id?: string;
}): string {
  if (!next) return '랜덤';

  const { chapter_id, scene_id } = next;

  if (chapter_id && scene_id) {
    return `챕터+씬`;
  } else if (chapter_id) {
    return `챕터`;
  } else if (scene_id) {
    return `씬`;
  } else {
    return '랜덤';
  }
}

/**
 * 선택지의 모든 정보를 종합하여 표시용 텍스트 생성
 * @param choice - 선택지
 * @param gameState - 현재 게임 상태
 * @returns 표시용 정보 텍스트
 */
export function getChoiceInfoText(
  choice: Choice,
  gameState: GameState
): string {
  const infoParts: string[] = [];

  // 조건 정보
  if (choice.condition) {
    const conditionText = getConditionText(choice.condition, gameState);
    if (conditionText) {
      infoParts.push(`조건: ${conditionText}`);
    }
  }

  // 확률 정보 (확률 분기가 있으면 이것이 우선)
  if (choice.probability) {
    const probabilityText = getProbabilityText(choice.probability, gameState);
    const successNextText = getNextText(choice.probability.success_next);
    const failureNextText = getNextText(choice.probability.failure_next);
    infoParts.push(
      `확률: ${probabilityText} (성공:${successNextText}, 실패:${failureNextText})`
    );
  }
  // 일반 이동 정보 (확률 분기가 없을 때만 표시)
  else if (choice.next) {
    const nextText = getNextText(choice.next);
    infoParts.push(`이동: ${nextText}`);
  } else {
    infoParts.push('이동: 랜덤');
  }

  return infoParts.join(' | ');
}

/**
 * 선택지가 현재 조건을 만족하는지 확인
 * @param choice - 선택지
 * @param gameState - 현재 게임 상태
 * @returns 조건 만족 여부
 */
export function isChoiceAvailable(
  choice: Choice,
  gameState: GameState
): boolean {
  if (!choice.condition) return true;
  return checkCondition(choice.condition, gameState);
}
