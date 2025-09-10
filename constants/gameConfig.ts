import { GameState } from '../types';
import { getAllSkillsAsArray, getAllVariables } from '../utils/dataLoader';

// 능력치 정의 (색상 포함)
export const STATS = {
  strength: {
    id: 'strength',
    displayName: '힘',
    maxValue: 100,
    color: '#FF3B30',
  },
  agility: {
    id: 'agility',
    displayName: '민첩',
    maxValue: 100,
    color: '#007AFF',
  },
  wisdom: {
    id: 'wisdom',
    displayName: '지혜',
    maxValue: 100,
    color: '#24B769',
  },
  charisma: {
    id: 'charisma',
    displayName: '카리스마',
    maxValue: 100,
    color: '#FF9500',
  },
} as const;

// 자원 정의 (색상 포함)
export const RESOURCES = {
  health: { id: 'health', displayName: '체력', maxValue: 3, color: '#FF3B30' },
  mind: { id: 'mind', displayName: '정신력', maxValue: 3, color: '#5856D6' },
  gold: { id: 'gold', displayName: '재화', maxValue: 4, color: '#FFD700' },
} as const;

// 게임 진행 상태 정의
export const GAME_PROGRESS = {
  current_floor: {
    id: 'current_floor',
    displayName: '현재 층',
    initialValue: 1,
  },
  death_count: {
    id: 'death_count',
    displayName: '전체 사망 횟수',
    initialValue: 0,
  },
  death_count_by_floor: {
    id: 'death_count_by_floor',
    displayName: '층별 사망 횟수',
    initialValue: {},
  },
  completed_scenes: {
    id: 'completed_scenes',
    displayName: '챕터 내 완료된 씬',
    initialValue: [],
  },
  visited_scenes: {
    id: 'visited_scenes',
    displayName: '게임 내 방문한 씬',
    initialValue: [],
  },
} as const;

// 태그 및 플래그는 JSON 파일에서 로드됨
// 참조: /assets/config/buffs.json, /assets/config/flags.json

// 능력치/자원 색상을 자동으로 생성 (theme.ts에서 참조용)
export const STAT_COLORS = Object.fromEntries(
  Object.entries(STATS).map(([key, stat]) => [key, stat.color])
) as { [K in keyof typeof STATS]: string };

export const RESOURCE_COLORS = Object.fromEntries(
  Object.entries(RESOURCES).map(([key, resource]) => [key, resource.color])
) as { [K in keyof typeof RESOURCES]: string };

// 자동화를 위한 key 배열들
export const STAT_KEYS = Object.keys(STATS) as Array<keyof typeof STATS>;
export const RESOURCE_KEYS = Object.keys(RESOURCES) as Array<
  keyof typeof RESOURCES
>;
export const GAME_PROGRESS_KEYS = Object.keys(GAME_PROGRESS) as Array<
  keyof typeof GAME_PROGRESS
>;
// BUFF_KEYS와 FLAG_KEYS는 JSON 데이터에서 동적으로 생성됨
// 참조: /utils/dataLoader.ts

// 게임 설정
export const GAME_CONFIG = {
  initial_health: 3,
  initial_mind: 3,
  initial_gold: 0,
  initial_strength: 1,
  initial_agility: 1,
  initial_wisdom: 1,
  initial_charisma: 1,
  game_start_scene_id: 'scn_game_start',
  game_over_scene_id: 'scn_game_over',
  initial_chapter_id: 'chapter_common',
  max_floors: 10,
} as const;

/**
 * 변수들을 기본값으로 초기화하는 함수
 * @returns 초기화된 변수 객체
 */
function initializeVariables(): { [key: string]: number } {
  try {
    const allVariables = getAllVariables();
    const initialVariables: { [key: string]: number } = {};

    Object.values(allVariables).forEach(variable => {
      initialVariables[variable.id] = variable.defaultValue;
    });

    return initialVariables;
  } catch (_error) {
    // 초기화 실패는 개발 중 디버깅 대상이지만 런타임에서는 조용히 기본값으로 대체
    // Logger.warn('[GameConfig]', '변수 초기화 실패, 빈 객체로 초기화:', error);
    return {};
  }
}

// 초기 게임 상태
export const INITIAL_GAME_STATE: GameState = {
  // 능력치 - STATS에서 자동으로 가져옴
  ...(Object.fromEntries(
    STAT_KEYS.map(statKey => [
      statKey,
      GAME_CONFIG[`initial_${statKey}` as keyof typeof GAME_CONFIG],
    ])
  ) as { [K in keyof typeof STATS]: number }),

  // 자원 - RESOURCES에서 자동으로 가져옴
  ...(Object.fromEntries(
    RESOURCE_KEYS.map(resourceKey => [
      resourceKey,
      GAME_CONFIG[`initial_${resourceKey}` as keyof typeof GAME_CONFIG],
    ])
  ) as { [K in keyof typeof RESOURCES]: number }),

  // 상태
  buffs: [],
  flags: [],
  items: [],

  // 변수 - 기본값으로 초기화 (JSON에서 정의된 변수들)
  variables: initializeVariables(),

  // 통합 경험치 시스템 - 모든 경험치 타입 초기화
  experience: (() => {
    const skills = getAllSkillsAsArray();
    const skillExp = Object.fromEntries(skills.map(skill => [skill.id, 0]));
    const statExp = Object.fromEntries(STAT_KEYS.map(statKey => [statKey, 0]));
    return {
      // 능력치 경험치 (STATS 기반)
      ...statExp,
      // 레벨 경험치
      level: 0,
      // 스킬 경험치 (skills.json 기반)
      ...skillExp,
    } as { [key: string]: number };
  })(),

  // 레벨 시스템 - 모든 경험치 타입의 현재 레벨
  levels: (() => {
    const skills = getAllSkillsAsArray();
    const skillLevels = Object.fromEntries(skills.map(skill => [skill.id, 0]));
    const statLevels = Object.fromEntries(
      STAT_KEYS.map(statKey => [
        statKey,
        GAME_CONFIG[`initial_${statKey}` as keyof typeof GAME_CONFIG],
      ])
    );
    return {
      // 능력치 레벨 (실제 능력치 값과 동일하게 초기화)
      ...statLevels,
      // 전체 레벨
      level: 1,
      // 스킬 레벨 (skills.json 기반)
      ...skillLevels,
    } as { [key: string]: number };
  })(),

  // 게임 진행 상태 - GAME_PROGRESS에서 자동으로 가져옴
  ...(Object.fromEntries(
    GAME_PROGRESS_KEYS.map(progressKey => [
      progressKey,
      GAME_PROGRESS[progressKey].initialValue,
    ])
  ) as {
    current_floor: number;
    death_count: number;
    death_count_by_floor: { [floor: number]: number };
    completed_scenes: string[];
    visited_scenes: string[];
  }),

  // 방문 누계 기본값
  scene_count: 0,
};
