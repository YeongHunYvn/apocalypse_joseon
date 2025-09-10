import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '../system/Logger';

// 저장 성공 로그 과다 방지를 위한 간단한 스로틀/중복 방지
const SUCCESS_LOG_THROTTLE_MS = 1500;
const lastSuccessLogAt: Map<string, number> = new Map();
const lastStoredValueByKey: Map<string, string> = new Map();

function logSaveSuccessThrottled(key: string): void {
  const now = Date.now();
  const previous = lastSuccessLogAt.get(key) ?? 0;
  if (now - previous > SUCCESS_LOG_THROTTLE_MS) {
    Logger.debug('[AsyncStorage]', `저장 성공: ${key}`);
    lastSuccessLogAt.set(key, now);
  }
}

/**
 * 일반적인 데이터 저장을 위한 AsyncStorage 유틸리티
 * 보안이 필요하지 않은 데이터 (설정, 캐시, 게임 진행상황 등)에 사용
 */

/**
 * 데이터를 AsyncStorage에 저장합니다
 * @param key - 저장할 키
 * @param value - 저장할 값 (객체는 자동으로 JSON.stringify 됩니다)
 * @returns 성공 여부
 */
export async function setItem<T = any>(
  key: string,
  value: T
): Promise<boolean> {
  try {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    // 값 변화 없으면 저장/로그 스킵 (불필요한 IO/로그 감소)
    const previousValue = lastStoredValueByKey.get(key);
    if (previousValue === stringValue) {
      Logger.debug('[AsyncStorage]', `저장 스킵(변화 없음): ${key}`);
      return true;
    }

    await AsyncStorage.setItem(key, stringValue);
    lastStoredValueByKey.set(key, stringValue);
    logSaveSuccessThrottled(key);
    return true;
  } catch (error) {
    Logger.error('[AsyncStorage]', `저장 실패: ${key}`, error as Error);
    return false;
  }
}

/**
 * AsyncStorage에서 데이터를 가져옵니다
 * @param key - 가져올 키
 * @param defaultValue - 값이 없을 때 반환할 기본값
 * @returns 저장된 값 또는 기본값
 */
export async function getItem<T = any>(
  key: string,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) {
      Logger.debug('[AsyncStorage]', `값 없음: ${key} -> 기본값 사용`);
      return defaultValue ?? undefined;
    }

    // JSON 파싱 시도, 실패하면 문자열 그대로 반환
    try {
      const parsedValue = JSON.parse(value);
      Logger.debug('[AsyncStorage]', `로드 성공: ${key}`);
      return parsedValue;
    } catch {
      // JSON이 아닌 문자열인 경우
      Logger.debug('[AsyncStorage]', `문자열 로드: ${key}`);
      return value as T;
    }
  } catch (error) {
    Logger.error('[AsyncStorage]', `로드 실패: ${key}`, error as Error);
    return defaultValue ?? undefined;
  }
}

/**
 * AsyncStorage에서 데이터를 제거합니다
 * @param key - 제거할 키
 * @returns 성공 여부
 */
export async function removeItem(key: string): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(key);
    Logger.debug('[AsyncStorage]', `삭제 성공: ${key}`);
    return true;
  } catch (error) {
    Logger.error('[AsyncStorage]', `삭제 실패: ${key}`, error as Error);
    return false;
  }
}

/**
 * 여러 키를 한 번에 제거합니다
 * @param keys - 제거할 키 배열
 * @returns 성공 여부
 */
export async function removeMultiple(keys: string[]): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove(keys);
    Logger.debug('[AsyncStorage]', `다중 삭제 성공: ${keys.join(', ')}`);
    return true;
  } catch (error) {
    Logger.error(
      '[AsyncStorage]',
      '다중 삭제 실패:',
      keys as any,
      error as Error
    );
    return false;
  }
}

/**
 * AsyncStorage의 모든 키를 가져옵니다
 * @returns 모든 키 배열
 */
export async function getAllKeys(): Promise<readonly string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    Logger.debug('[AsyncStorage]', `모든 키 조회: ${keys.length}개`);
    return [...keys];
  } catch (error) {
    Logger.error('[AsyncStorage]', '키 조회 실패:', error as Error);
    return [];
  }
}

/**
 * AsyncStorage를 완전히 비웁니다 (주의: 모든 데이터 삭제)
 * @returns 성공 여부
 */
export async function clear(): Promise<boolean> {
  try {
    await AsyncStorage.clear();
    Logger.debug('[AsyncStorage]', '전체 삭제 완료');
    return true;
  } catch (error) {
    Logger.error('[AsyncStorage]', '전체 삭제 실패:', error as Error);
    return false;
  }
}

/**
 * 특정 키가 존재하는지 확인합니다
 * @param key - 확인할 키
 * @returns 존재 여부
 */
export async function hasItem(key: string): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  } catch (error) {
    Logger.error('[AsyncStorage]', `존재 확인 실패: ${key}`, error as Error);
    return false;
  }
}

/**
 * 저장소의 사용량 정보를 가져옵니다 (디버그용)
 * @returns 저장된 항목 수와 키 목록
 */
export async function getStorageInfo(): Promise<{
  itemCount: number;
  keys: readonly string[];
}> {
  try {
    const keys = await getAllKeys();
    return {
      itemCount: keys.length,
      keys,
    };
  } catch (error) {
    Logger.error('[AsyncStorage]', '정보 조회 실패:', error as Error);
    return {
      itemCount: 0,
      keys: [],
    };
  }
}
