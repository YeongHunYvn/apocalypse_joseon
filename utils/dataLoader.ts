import {
  BuffData,
  FlagData,
  ItemData,
  SkillData,
  VariableData,
} from '../types';
import { Logger } from './system/Logger';

// ==========================================
// 🎯 JSON 데이터 로더 시스템
// ==========================================

/**
 * 데이터 로더 에러 타입
 */
export class DataLoaderError extends Error {
  constructor(
    message: string,
    public readonly dataType: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'DataLoaderError';
  }
}

/**
 * 캐시된 데이터 저장소
 * 앱 실행 중 메모리에 데이터를 캐싱하여 성능 향상
 */
interface DataCache {
  buffs: Record<string, BuffData> | null;
  flags: Record<string, FlagData> | null;
  items: Record<string, ItemData> | null;
  variables: Record<string, VariableData> | null;
  skills: Record<string, SkillData> | null;
  lastLoadTime: {
    buffs: number | null;
    flags: number | null;
    items: number | null;
    variables: number | null;
    skills: number | null;
  };
}

// 캐시 저장소 초기화
let dataCache: DataCache = {
  buffs: null,
  flags: null,
  items: null,
  variables: null,
  skills: null,
  lastLoadTime: {
    buffs: null,
    flags: null,
    items: null,
    variables: null,
    skills: null,
  },
};

/**
 * 지연 로딩 설정
 */
const LAZY_LOADING_CONFIG = {
  /** 캐시 유효 시간 (밀리초) - 5분 */
  cacheExpiration: 5 * 60 * 1000,
  /** 자동 만료 검사 활성화 */
  enableExpiration: true,
  /** 로딩 상태 로그 출력 */
  enableLogging: false,
};

/**
 * 로딩 상태 추적
 */
const loadingStates = {
  buffs: false,
  flags: false,
  items: false,
  variables: false,
  skills: false,
};

/**
 * JSON 파일을 로드하고 파싱합니다
 * React Native에서는 require()를 사용하여 로컬 파일을 로드
 *
 * @param dataType 데이터 타입 ('buffs', 'flags', 'items')
 * @returns 파싱된 JSON 데이터
 */
function loadJsonData<T>(dataType: string): Record<string, T> {
  try {
    let data: Record<string, T>;

    switch (dataType) {
      case 'buffs':
        data = require('../assets/config/buffs.json');
        break;
      case 'flags':
        data = require('../assets/config/flags.json');
        break;
      case 'items':
        data = require('../assets/config/items.json');
        break;
      case 'variables':
        data = require('../assets/config/variables.json');
        break;
      case 'skills':
        data = require('../assets/config/skills.json');
        break;
      default:
        throw new DataLoaderError(
          `지원하지 않는 데이터 타입: ${dataType}`,
          dataType
        );
    }

    if (!data || typeof data !== 'object') {
      throw new DataLoaderError(
        `올바르지 않은 JSON 구조: ${dataType}`,
        dataType
      );
    }

    return data;
  } catch (error) {
    if (error instanceof DataLoaderError) {
      throw error;
    }
    throw new DataLoaderError(`JSON 로드 실패: ${dataType}`, dataType, error);
  }
}

/**
 * 캐시가 만료되었는지 확인합니다.
 * @param dataType - 데이터 타입
 * @returns 캐시 만료 여부
 */
function isCacheExpired(dataType: keyof DataCache['lastLoadTime']): boolean {
  if (!LAZY_LOADING_CONFIG.enableExpiration) {
    return false;
  }

  const lastLoadTime = dataCache.lastLoadTime[dataType];
  if (!lastLoadTime) {
    return true; // 로드된 적이 없으면 만료로 간주
  }

  const now = Date.now();
  const elapsed = now - lastLoadTime;
  return elapsed > LAZY_LOADING_CONFIG.cacheExpiration;
}

/**
 * 데이터 로딩 로그를 출력합니다.
 * @param dataType - 데이터 타입
 * @param action - 액션 ('loading', 'loaded', 'cached')
 */
function logDataLoading(
  dataType: string,
  action: 'loading' | 'loaded' | 'cached'
): void {
  if (!LAZY_LOADING_CONFIG.enableLogging) {
    return;
  }

  const messages = {
    loading: `🔄 ${dataType} 데이터 로딩 중...`,
    loaded: `✅ ${dataType} 데이터 로딩 완료`,
    cached: `💾 ${dataType} 데이터 캐시에서 반환`,
  };

  Logger.debug('[DataLoader]', messages[action]);
}

/**
 * 상태(버프) 데이터를 지연 로딩으로 가져옵니다.
 * @returns 상태 데이터 또는 null
 */
function loadBuffs(): Record<string, BuffData> | null {
  // 중복 로딩 방지
  if (loadingStates.buffs) {
    Logger.warn('[DataLoader]', '상태 데이터가 이미 로딩 중입니다.');
    return dataCache.buffs;
  }

  // 캐시 확인 (만료되지 않았다면 캐시 반환)
  if (dataCache.buffs && !isCacheExpired('buffs')) {
    logDataLoading('buffs', 'cached');
    return dataCache.buffs;
  }

  try {
    loadingStates.buffs = true;
    logDataLoading('buffs', 'loading');

    const buffsData = loadJsonData<BuffData>('buffs');

    // 캐시 업데이트
    dataCache.buffs = buffsData;
    dataCache.lastLoadTime.buffs = Date.now();

    logDataLoading('buffs', 'loaded');
    return buffsData;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 상태 데이터 로드 실패:', error);
    return null;
  } finally {
    loadingStates.buffs = false;
  }
}

/**
 * 플래그 데이터를 지연 로딩으로 가져옵니다.
 * @returns 플래그 데이터 또는 null
 */
function loadFlags(): Record<string, FlagData> | null {
  // 중복 로딩 방지
  if (loadingStates.flags) {
    Logger.warn('[DataLoader]', '플래그 데이터가 이미 로딩 중입니다.');
    return dataCache.flags;
  }

  // 캐시 확인 (만료되지 않았다면 캐시 반환)
  if (dataCache.flags && !isCacheExpired('flags')) {
    logDataLoading('flags', 'cached');
    return dataCache.flags;
  }

  try {
    loadingStates.flags = true;
    logDataLoading('flags', 'loading');

    const flagsData = loadJsonData<FlagData>('flags');

    // 캐시 업데이트
    dataCache.flags = flagsData;
    dataCache.lastLoadTime.flags = Date.now();

    logDataLoading('flags', 'loaded');
    return flagsData;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 플래그 데이터 로드 실패:', error);
    return null;
  } finally {
    loadingStates.flags = false;
  }
}

/**
 * 아이템 데이터를 지연 로딩으로 가져옵니다.
 * @returns 아이템 데이터 또는 null
 */
function loadItems(): Record<string, ItemData> | null {
  // 중복 로딩 방지
  if (loadingStates.items) {
    Logger.warn('[DataLoader]', '아이템 데이터가 이미 로딩 중입니다.');
    return dataCache.items;
  }

  // 캐시 확인 (만료되지 않았다면 캐시 반환)
  if (dataCache.items && !isCacheExpired('items')) {
    logDataLoading('items', 'cached');
    return dataCache.items;
  }

  try {
    loadingStates.items = true;
    logDataLoading('items', 'loading');

    const itemsData = loadJsonData<ItemData>('items');

    // 캐시 업데이트
    dataCache.items = itemsData;
    dataCache.lastLoadTime.items = Date.now();

    logDataLoading('items', 'loaded');
    return itemsData;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 아이템 데이터 로드 실패:', error);
    return null;
  } finally {
    loadingStates.items = false;
  }
}

/**
 * 변수 데이터를 지연 로딩으로 가져옵니다.
 * @returns 변수 데이터 또는 null
 */
function loadVariables(): Record<string, VariableData> | null {
  // 중복 로딩 방지
  if (loadingStates.variables) {
    Logger.warn('[DataLoader]', '변수 데이터가 이미 로딩 중입니다.');
    return dataCache.variables;
  }

  // 캐시 확인 (만료되지 않았다면 캐시 반환)
  if (dataCache.variables && !isCacheExpired('variables')) {
    logDataLoading('variables', 'cached');
    return dataCache.variables;
  }

  try {
    loadingStates.variables = true;
    logDataLoading('variables', 'loading');

    const variablesData = loadJsonData<VariableData>('variables');

    // 캐시 업데이트
    dataCache.variables = variablesData;
    dataCache.lastLoadTime.variables = Date.now();

    logDataLoading('variables', 'loaded');
    return variablesData;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 변수 데이터 로드 실패:', error);
    return null;
  } finally {
    loadingStates.variables = false;
  }
}

/**
 * 스킬 데이터를 지연 로딩으로 가져옵니다.
 * @returns 스킬 데이터 또는 null
 */
function loadSkills(): Record<string, SkillData> | null {
  // 중복 로딩 방지
  if (loadingStates.skills) {
    Logger.warn('[DataLoader]', '스킬 데이터가 이미 로딩 중입니다.');
    return dataCache.skills;
  }

  // 캐시 확인
  if (dataCache.skills && !isCacheExpired('skills')) {
    logDataLoading('skills', 'cached');
    return dataCache.skills;
  }

  try {
    loadingStates.skills = true;
    logDataLoading('skills', 'loading');

    const skillsData = loadJsonData<SkillData>('skills');

    // 캐시 업데이트
    dataCache.skills = skillsData;
    dataCache.lastLoadTime.skills = Date.now();

    logDataLoading('skills', 'loaded');
    return skillsData;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 스킬 데이터 로드 실패:', error);
    return null;
  } finally {
    loadingStates.skills = false;
  }
}

// ==========================================
// 🎯 데이터 접근 유틸리티 함수들
// ==========================================

/**
 * ID로 상태를 조회합니다
 * @param buffId 조회할 상태 ID
 * @returns 상태 데이터 또는 null
 */
export function getBuffById(buffId: string): BuffData | null {
  try {
    const buffs = loadBuffs();
    if (!buffs) {
      Logger.error('[DataLoader]', '❌ 상태 데이터를 로드할 수 없습니다.');
      return null;
    }
    return buffs[buffId] || null;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 상태 조회 실패:', error);
    return null;
  }
}

/**
 * ID로 플래그를 조회합니다
 * @param flagId 조회할 플래그 ID
 * @returns 플래그 데이터 또는 null
 */
export function getFlagById(flagId: string): FlagData | null {
  try {
    const flags = loadFlags();
    if (!flags) {
      Logger.error('[DataLoader]', '❌ 플래그 데이터를 로드할 수 없습니다.');
      return null;
    }
    return flags[flagId] || null;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 플래그 조회 실패:', error);
    return null;
  }
}

/**
 * ID로 아이템을 조회합니다
 * @param itemId 조회할 아이템 ID
 * @returns 아이템 데이터 또는 null
 */
export function getItemById(itemId: string): ItemData | null {
  try {
    const items = loadItems();
    if (!items) {
      Logger.error('[DataLoader]', '❌ 아이템 데이터를 로드할 수 없습니다.');
      return null;
    }
    return items[itemId] || null;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 아이템 조회 실패:', error);
    return null;
  }
}

/**
 * ID로 변수를 조회합니다
 * @param variableId 조회할 변수 ID
 * @returns 변수 데이터 또는 null
 */
export function getVariableById(variableId: string): VariableData | null {
  try {
    const variables = loadVariables();
    if (!variables) {
      Logger.error('[DataLoader]', '❌ 변수 데이터를 로드할 수 없습니다.');
      return null;
    }
    return variables[variableId] || null;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 변수 조회 실패:', error);
    return null;
  }
}

/**
 * 모든 아이템 데이터를 조회합니다
 *
 * @returns 아이템 데이터 객체 또는 빈 객체
 */
export function getAllItems(): Record<string, ItemData> {
  try {
    const items = loadItems();
    return items || {};
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 모든 아이템 목록 조회 실패:', error);
    return {};
  }
}

/**
 * 임시 상태(temporary: true) 목록을 조회합니다.
 * 휴식방에서 일시적 상태들을 제거할 때 사용합니다.
 *
 * @returns 임시 상태 ID 배열
 */
export function getTemporaryBuffs(): string[] {
  try {
    const buffs = loadBuffs();
    if (!buffs) {
      Logger.error('[DataLoader]', '❌ 상태 데이터를 로드할 수 없습니다.');
      return [];
    }

    return Object.values(buffs)
      .filter(buff => buff.temporary === true)
      .map(buff => buff.id);
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 임시 상태 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 카테고리별 상태 목록을 조회합니다
 *
 * @param category 상태 카테고리
 * @returns 해당 카테고리의 상태 ID 배열
 */
export function getBuffsByCategory(category: BuffData['category']): string[] {
  try {
    const buffs = loadBuffs();
    if (!buffs) {
      Logger.error('[DataLoader]', '❌ 상태 데이터를 로드할 수 없습니다.');
      return [];
    }
    return Object.values(buffs)
      .filter(buff => buff.category === category)
      .map(buff => buff.id);
  } catch (error) {
    Logger.error(
      '[DataLoader]',
      `❌ 카테고리별 상태 조회 실패 (${category}):`,
      error
    );
    return [];
  }
}

/**
 * 지속성 여부별 아이템 목록을 조회합니다
 *
 * @param persistent 지속성 여부
 * @returns 해당 지속성의 아이템 ID 배열
 */
export function getItemsByPersistent(persistent: boolean): string[] {
  try {
    const items = loadItems();
    if (!items) {
      Logger.error('[DataLoader]', '❌ 아이템 데이터를 로드할 수 없습니다.');
      return [];
    }
    return Object.values(items)
      .filter(item => item.persist === persistent)
      .map(item => item.id);
  } catch (error) {
    Logger.error(
      '[DataLoader]',
      `❌ 지속성별 아이템 조회 실패 (${persistent}):`,
      error
    );
    return [];
  }
}

/**
 * 모든 변수 데이터를 조회합니다
 *
 * @returns 변수 데이터 객체 또는 빈 객체
 */
export function getAllVariables(): Record<string, VariableData> {
  try {
    const variables = loadVariables();
    return variables || {};
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 모든 변수 목록 조회 실패:', error);
    return {};
  }
}

/**
 * 모든 변수 데이터를 배열로 조회합니다.
 * @returns 변수 데이터 배열
 */
export function getAllVariablesAsArray(): VariableData[] {
  try {
    const variables = loadVariables();
    if (!variables) {
      Logger.error('[DataLoader]', '❌ 변수 데이터를 로드할 수 없습니다.');
      return [];
    }
    return Object.values(variables);
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 변수 배열 조회 실패:', error);
    return [];
  }
}

/**
 * 모든 변수 ID 목록을 조회합니다
 *
 * @returns 변수 ID 배열
 */
export function getAllVariableIds(): string[] {
  try {
    const variables = loadVariables();
    if (!variables) {
      Logger.error('[DataLoader]', '❌ 변수 데이터를 로드할 수 없습니다.');
      return [];
    }
    return Object.keys(variables);
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 변수 ID 목록 조회 실패:', error);
    return [];
  }
}

// ==========================================
// 🔍 타입 가드 함수들
// ==========================================

/**
 * 상태 ID가 유효한지 확인합니다
 * @param buffId 확인할 상태 ID
 * @returns 유효한 상태 ID인지 여부
 */
export function isBuffKey(buffId: string): boolean {
  try {
    const buffs = loadBuffs();
    if (!buffs) {
      Logger.error('[DataLoader]', '❌ 상태 데이터를 로드할 수 없습니다.');
      return false;
    }
    return buffId in buffs;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 상태 ID 유효성 검사 실패:', error);
    return false;
  }
}

/**
 * 플래그 ID가 유효한지 확인합니다
 * @param flagId 확인할 플래그 ID
 * @returns 유효한 플래그 ID인지 여부
 */
export function isFlagKey(flagId: string): boolean {
  try {
    const flags = loadFlags();
    if (!flags) {
      Logger.error('[DataLoader]', '❌ 플래그 데이터를 로드할 수 없습니다.');
      return false;
    }
    return flagId in flags;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 플래그 ID 유효성 검사 실패:', error);
    return false;
  }
}

/**
 * 아이템 ID가 유효한지 검증합니다.
 * @param itemId - 검증할 아이템 ID
 * @returns 유효한 아이템 ID인지 여부
 */
export function isItemId(itemId: string): boolean {
  const itemsData = getAllItems();
  if (!itemsData) {
    Logger.error('[DataLoader]', '❌ 아이템 데이터를 로드할 수 없습니다.');
    return false;
  }
  return Object.prototype.hasOwnProperty.call(itemsData, itemId);
}

/**
 * 변수 ID가 유효한지 확인합니다
 * @param variableId 확인할 변수 ID
 * @returns 유효한 변수 ID인지 여부
 */
export function isVariableKey(variableId: string): boolean {
  try {
    const variables = loadVariables();
    if (!variables) {
      Logger.error('[DataLoader]', '❌ 변수 데이터를 로드할 수 없습니다.');
      return false;
    }
    return variableId in variables;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 변수 ID 유효성 검사 실패:', error);
    return false;
  }
}

/**
 * 스킬 ID로 스킬을 조회합니다
 * @param skillId 조회할 스킬 ID
 * @returns 스킬 데이터 또는 null
 */
export function getSkillById(skillId: string): SkillData | null {
  try {
    const skills = loadSkills();
    if (!skills) {
      Logger.error('[DataLoader]', '❌ 스킬 데이터를 로드할 수 없습니다.');
      return null;
    }
    return skills[skillId] || null;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 스킬 조회 실패:', error);
    return null;
  }
}

/**
 * 모든 스킬 ID 목록을 조회합니다
 * @returns 스킬 ID 배열
 */
export function getAllSkillIds(): string[] {
  try {
    const skills = loadSkills();
    if (!skills) return [];
    return Object.keys(skills);
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 스킬 ID 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 모든 스킬 데이터를 배열로 조회합니다.
 * @returns 스킬 데이터 배열
 */
export function getAllSkillsAsArray(): SkillData[] {
  try {
    const skills = loadSkills();
    if (!skills) return [];
    return Object.values(skills);
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 스킬 배열 조회 실패:', error);
    return [];
  }
}

/**
 * 스킬 ID가 유효한지 확인합니다
 * @param skillId 확인할 스킬 ID
 * @returns 유효한 스킬 ID인지 여부
 */
export function isSkillKey(skillId: string): boolean {
  try {
    const skills = loadSkills();
    if (!skills) return false;
    return skillId in skills;
  } catch (error) {
    Logger.error('[DataLoader]', '❌ 스킬 ID 유효성 검사 실패:', error);
    return false;
  }
}
