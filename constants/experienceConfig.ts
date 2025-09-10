import { GameState, SkillData } from '../types';
import { getAllSkillsAsArray } from '../utils/dataLoader';
import { STATS, STAT_KEYS } from './gameConfig';

/**
 * 통합 경험치 시스템 설정 인터페이스
 * 모든 경험치 타입(능력치, 레벨, 랭크 등)을 통합 관리
 */
export interface ExperienceConfig {
  /** 경험치 타입 고유 식별자 */
  id: string;

  /** 표시용 이름 */
  displayName: string;

  /** 자동 레벨업 여부 (true: 경험치 충족 시 자동 상승, false: 수동 상승) */
  autoLevelUp: boolean;

  /** 레벨업에 필요한 경험치 계산 함수 */
  expToLevel: (currentLevel: number) => number;

  /** 최대 레벨 (선택적, 기본값: 무제한) */
  maxLevel?: number;

  /** 레벨업 시 실행할 추가 효과 (선택적) */
  onLevelUp?: (
    gameState: GameState,
    newLevel: number,
    experienceType: string
  ) => GameState;

  /** UI 표시 색상 (선택적) */
  color?: string;

  /** 카테고리 (UI 그룹핑용, 선택적) */
  category?: 'stat' | 'level' | 'rank' | 'skill';
}

/**
 * 모든 경험치 타입의 설정을 정의
 * gameConfig.ts의 STATS를 기반으로 자동 생성하여 일관성 확보
 */
export const EXPERIENCE_CONFIGS: Record<string, ExperienceConfig> = {
  // 능력치 경험치 (gameConfig.ts의 STATS 기반으로 자동 생성)
  ...Object.fromEntries(
    STAT_KEYS.map(statKey => [
      statKey,
      {
        id: statKey,
        displayName: STATS[statKey].displayName, // gameConfig.js에서 가져옴
        autoLevelUp: false,
        // 레벨업 필요 경험치: 1→2는 10, 2→3은 20 ... 레벨당 10씩 증가, 최대 100으로 고정
        // 초기 레벨이 0인 경우를 대비해 최소 10 보장
        expToLevel: (level: number) => {
          const required = level * 10;
          return Math.max(10, Math.min(100, required));
        },
        maxLevel: STATS[statKey].maxValue, // gameConfig.js의 maxValue와 일치
        color: STATS[statKey].color, // gameConfig.js에서 가져옴
        category: 'stat' as const,
      } satisfies ExperienceConfig,
    ])
  ),

  // 레벨 경험치 (자동 레벨업)
  level: {
    id: 'level',
    displayName: '레벨',
    autoLevelUp: true,
    expToLevel: level => 200 + level * 100, // 능력치보다 더 많은 경험치 필요
    color: '#9b59b6',
    category: 'level',
    onLevelUp: (gameState, _newLevel) => {
      // 레벨 업은 UI에서 처리하므로 여기서는 로그 생략 또는 디버그 수준으로만 노출
      // Logger.debug('[Experience]', `🎉 레벨 상승! 새로운 레벨: ${newLevel}`);
      // 레벨업 시 체력/정신력 약간 회복 등의 보너스 효과 가능
      return {
        ...gameState,
        health: Math.min(3, gameState.health + 1), // 체력 1 회복 (최대 3)
        mind: Math.min(3, gameState.mind + 1), // 정신력 1 회복 (최대 3)
      };
    },
  },
  // 스킬 경험치 (skills.json 기반 동적 생성)
  ...(() => {
    const entries: [string, ExperienceConfig][] = [];
    const skills = getAllSkillsAsArray();
    skills.forEach((skill: SkillData) => {
      const maxLevel = skill.ranks?.length || 0;
      const expToLevel = (level: number) => {
        // level: 현재 레벨(0 기반). L→L+1 필요 exp는 ranks[L].exp
        if (!skill.ranks || level < 0 || level >= maxLevel) return Infinity;
        const rank = skill.ranks[level];
        if (!rank || typeof rank.exp !== 'number' || rank.exp <= 0) {
          return Infinity;
        }
        return rank.exp;
      };

      entries.push([
        skill.id,
        {
          id: skill.id,
          displayName: skill.displayName || skill.id, // UI 표기 최소화(랭크명이 주 표기)
          autoLevelUp: true,
          expToLevel,
          maxLevel,
          category: 'skill',
        } satisfies ExperienceConfig,
      ]);
    });
    return Object.fromEntries(entries);
  })(),
} as const;

/**
 * 미래 확장용 랭크 시스템 예시 (주석으로 참고용)
 *
 * rank_combat: {
 *   id: 'rank_combat',
 *   displayName: '전투 랭크',
 *   autoLevelUp: false,
 *   expToLevel: (level) => 500 + (level * 200),
 *   maxLevel: 5,
 *   color: '#e74c3c',
 *   category: 'rank',
 * },
 *
 * rank_magic: {
 *   id: 'rank_magic',
 *   displayName: '마법 랭크',
 *   autoLevelUp: false,
 *   expToLevel: (level) => 500 + (level * 200),
 *   maxLevel: 5,
 *   color: '#8e44ad',
 *   category: 'rank',
 * },
 */

/**
 * 경험치 타입 키 배열 (자동 생성)
 */
export const EXPERIENCE_TYPE_KEYS = Object.keys(
  EXPERIENCE_CONFIGS
) as (keyof typeof EXPERIENCE_CONFIGS)[];

/**
 * 카테고리별 경험치 타입 그룹핑
 */
export const EXPERIENCE_TYPES_BY_CATEGORY = {
  stat: EXPERIENCE_TYPE_KEYS.filter(
    key => EXPERIENCE_CONFIGS[key].category === 'stat'
  ),
  level: EXPERIENCE_TYPE_KEYS.filter(
    key => EXPERIENCE_CONFIGS[key].category === 'level'
  ),
  rank: EXPERIENCE_TYPE_KEYS.filter(
    key => EXPERIENCE_CONFIGS[key].category === 'rank'
  ),
  skill: EXPERIENCE_TYPE_KEYS.filter(
    key => EXPERIENCE_CONFIGS[key].category === 'skill'
  ),
} as const;

/**
 * 자동 레벨업 타입과 수동 레벨업 타입 분리
 */
export const AUTO_LEVELUP_TYPES = EXPERIENCE_TYPE_KEYS.filter(
  key => EXPERIENCE_CONFIGS[key].autoLevelUp
);
export const MANUAL_LEVELUP_TYPES = EXPERIENCE_TYPE_KEYS.filter(
  key => !EXPERIENCE_CONFIGS[key].autoLevelUp
);

/**
 * 주어진 키가 유효한 경험치 타입인지 확인하는 타입 가드 함수
 * @param key - 확인할 키
 * @returns 유효한 경험치 타입 여부
 */
export function isValidExperienceType(
  key: unknown
): key is keyof typeof EXPERIENCE_CONFIGS {
  return typeof key === 'string' && key in EXPERIENCE_CONFIGS;
}

/**
 * 경험치 설정을 안전하게 조회하는 함수
 * @param experienceType - 경험치 타입
 * @returns 해당 경험치 타입의 설정 (없으면 null)
 */
export function getExperienceConfig(
  experienceType: string
): ExperienceConfig | null {
  return EXPERIENCE_CONFIGS[experienceType] || null;
}

/**
 * 특정 카테고리의 경험치 타입들을 조회하는 함수
 * @param category - 카테고리
 * @returns 해당 카테고리의 경험치 타입 배열
 */
export function getExperienceTypesByCategory(
  category: ExperienceConfig['category']
): string[] {
  if (!category) return [];
  return EXPERIENCE_TYPES_BY_CATEGORY[category] || [];
}
