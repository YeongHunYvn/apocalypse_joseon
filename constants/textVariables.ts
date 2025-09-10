import { getAllVariables } from '../utils/dataLoader';
import {
  GAME_PROGRESS,
  GAME_PROGRESS_KEYS,
  RESOURCE_KEYS,
  RESOURCES,
  STAT_KEYS,
  STATS,
} from './gameConfig';

/**
 * 지원하는 텍스트 변수 카테고리
 */
export type TextVariableCategory =
  | 'stats' // 능력치 (힘, 민첩, 지혜, 카리스마)
  | 'resources' // 자원 (체력, 정신력)
  | 'progress' // 게임 진행 (현재층, 사망횟수 등)
  | 'exps' // 경험치
  | 'levels' // 레벨
  | 'vars' // 사용자 정의 변수
  | 'buffs' // 상태/버프 (has 체크)
  | 'flags' // 플래그 (has 체크)
  | 'items'; // 아이템 (has 체크)

/**
 * 지원하는 텍스트 변수 타입
 */
export type TextVariableType = 'number' | 'string' | 'boolean';

/**
 * 텍스트 변수 정의 인터페이스
 */
export interface TextVariableDefinition {
  /** 변수 카테고리 */
  category: TextVariableCategory;
  /** 변수 키 */
  key: string;
  /** 변수 타입 */
  type: TextVariableType;
  /** 표시 이름 */
  displayName: string;
  /** 기본값 (값이 없을 때) */
  defaultValue: string;
  /** 게임 상태에서 값을 추출하는 경로 */
  statePath: string;
  /** 값 포맷팅 함수 (선택적) */
  formatter?: (value: any) => string;
  /** 설명 */
  description?: string;
}

/**
 * 동적으로 텍스트 변수 정의를 생성하는 함수
 * @returns 텍스트 변수 정의 맵
 */
function generateTextVariables(): Record<string, TextVariableDefinition> {
  const variables: Record<string, TextVariableDefinition> = {};

  // 1. 능력치 변수 생성 (gameConfig.ts의 STATS 기반)
  STAT_KEYS.forEach(statKey => {
    const stat = STATS[statKey];
    const fullKey = `stats:${statKey}`;
    variables[fullKey] = {
      category: 'stats',
      key: statKey,
      type: 'number',
      displayName: stat.displayName,
      defaultValue: '0',
      statePath: statKey,
      description: `${stat.displayName} 능력치 값`,
    };
  });

  // 2. 자원 변수 생성 (gameConfig.ts의 RESOURCES 기반)
  RESOURCE_KEYS.forEach(resourceKey => {
    const resource = RESOURCES[resourceKey];
    const fullKey = `resources:${resourceKey}`;
    variables[fullKey] = {
      category: 'resources',
      key: resourceKey,
      type: 'number',
      displayName: resource.displayName,
      defaultValue: '0',
      statePath: resourceKey,
      description: `${resource.displayName} 자원 값`,
    };

    // 최대값 포함 형태도 추가 (예: health_max -> "2/3")
    const maxKey = `resources:${resourceKey}_max`;
    variables[maxKey] = {
      category: 'resources',
      key: `${resourceKey}_max`,
      type: 'string',
      displayName: `${resource.displayName} (최대값 포함)`,
      defaultValue: '0/0',
      statePath: resourceKey,
      formatter: (value: number) => `${value}/${resource.maxValue}`,
      description: `${resource.displayName} 현재값/최대값 형태`,
    };
  });

  // 3. 게임 진행 변수 생성 (gameConfig.ts의 GAME_PROGRESS 기반)
  GAME_PROGRESS_KEYS.forEach(progressKey => {
    const progress = GAME_PROGRESS[progressKey];
    const fullKey = `progress:${progressKey}`;
    variables[fullKey] = {
      category: 'progress',
      key: progressKey,
      type: typeof progress.initialValue === 'number' ? 'number' : 'string',
      displayName: progress.displayName,
      defaultValue: String(progress.initialValue),
      statePath: progressKey,
      description: `${progress.displayName} 진행 상태`,
    };
  });

  // 4. 경험치 변수 생성
  STAT_KEYS.forEach(statKey => {
    const stat = STATS[statKey];
    const expKey = `exps:${statKey}`;
    variables[expKey] = {
      category: 'exps',
      key: statKey,
      type: 'number',
      displayName: `${stat.displayName} 경험치`,
      defaultValue: '0',
      statePath: `experience.${statKey}`,
      description: `${stat.displayName} 경험치 값`,
    };
  });

  // 전체 경험치도 추가
  variables['exps:level'] = {
    category: 'exps',
    key: 'level',
    type: 'number',
    displayName: '레벨 경험치',
    defaultValue: '0',
    statePath: 'experience.level',
    description: '전체 레벨 경험치 값',
  };

  // 5. 레벨 변수 생성
  STAT_KEYS.forEach(statKey => {
    const stat = STATS[statKey];
    const levelKey = `levels:${statKey}`;
    variables[levelKey] = {
      category: 'levels',
      key: statKey,
      type: 'number',
      displayName: `${stat.displayName} 레벨`,
      defaultValue: '1',
      statePath: `levels.${statKey}`,
      description: `${stat.displayName} 현재 레벨`,
    };
  });

  // 전체 레벨도 추가
  variables['levels:level'] = {
    category: 'levels',
    key: 'level',
    type: 'number',
    displayName: '전체 레벨',
    defaultValue: '1',
    statePath: 'levels.level',
    description: '전체 레벨 값',
  };

  // 6. 사용자 정의 변수 생성 (variables.json 기반)
  try {
    const allVariables = getAllVariables();
    Object.values(allVariables).forEach(variable => {
      const varKey = `vars:${variable.id}`;
      variables[varKey] = {
        category: 'vars',
        key: variable.id,
        type: 'number',
        displayName: variable.description,
        defaultValue: String(variable.defaultValue),
        statePath: `variables.${variable.id}`,
        description:
          variable.description || `사용자 정의 변수 ${variable.description}`,
      };
    });
  } catch (_error) {
    // Logger.warn('[TextVariables]', '사용자 정의 변수 로드 실패:', _error);
  }

  // 7-9. 상태/버프, 플래그, 아이템 변수는 추후 구현 예정
  // TODO: 상태/버프 변수 구현 (buffs:상태명)
  // TODO: 플래그 변수 구현 (flags:플래그명)
  // TODO: 아이템 변수 구현 (items:아이템명)

  return variables;
}

/**
 * 지원하는 텍스트 변수 목록 (동적 생성)
 */
export const TEXT_VARIABLES = generateTextVariables();

/**
 * 변수 표시 문법 정규식 - 새로운 ${category:key} 형태
 */
export const TEXT_VARIABLE_REGEX = /\$\{([a-zA-Z_]+):([a-zA-Z0-9_]+)\}/g;

/**
 * 카테고리별 변수 목록을 가져오는 헬퍼 함수
 * @param category 카테고리
 * @returns 해당 카테고리의 변수 정의 배열
 */
export function getVariablesByCategory(
  category: TextVariableCategory
): TextVariableDefinition[] {
  return Object.values(TEXT_VARIABLES).filter(
    variable => variable.category === category
  );
}

/**
 * 모든 카테고리 목록을 가져오는 함수
 * @returns 카테고리 배열
 */
export function getAllCategories(): TextVariableCategory[] {
  return [
    'stats',
    'resources',
    'progress',
    'exps',
    'levels',
    'vars',
    'buffs',
    'flags',
    'items',
  ];
}

/**
 * 변수 정의를 키로 검색하는 함수
 * @param category 카테고리
 * @param key 키
 * @returns 변수 정의 또는 undefined
 */
export function getVariable(
  category: TextVariableCategory,
  key: string
): TextVariableDefinition | undefined {
  const fullKey = `${category}:${key}`;
  return TEXT_VARIABLES[fullKey];
}

/**
 * 지원되는 모든 변수 키 목록을 가져오는 함수 (디버깅용)
 * @returns 변수 키 배열
 */
export function getAllVariableKeys(): string[] {
  return Object.keys(TEXT_VARIABLES);
}
