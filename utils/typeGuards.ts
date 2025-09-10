import { Chapter, MinMaxRange, ResourceKey, StatKey } from '../types';
import { RESOURCE_KEYS, STAT_KEYS } from '../constants/gameConfig';
import {
  isBuffKey as isBuffKeyFromData,
  isFlagKey as isFlagKeyFromData,
  isItemId as isItemIdFromData,
  isSkillKey as isSkillKeyFromData,
  isVariableKey as isVariableKeyFromData,
} from './dataLoader';

/**
 * 타입 안전성을 위한 타입 가드 함수들
 */

/**
 * 능력치 키인지 확인하는 타입 가드
 * @param key - 확인할 키
 * @returns StatKey 타입인지 여부
 */
export const isStatKey = (key: string): key is StatKey =>
  STAT_KEYS.includes(key as StatKey);

/**
 * 자원 키인지 확인하는 타입 가드
 * @param key - 확인할 키
 * @returns ResourceKey 타입인지 여부
 */
export const isResourceKey = (key: string): key is ResourceKey =>
  RESOURCE_KEYS.includes(key as ResourceKey);

/**
 * 상태 키인지 확인하는 타입 가드
 * @param key - 확인할 키
 * @returns 유효한 상태 키인지 여부
 */
export const isBuffKey = (key: string): boolean => isBuffKeyFromData(key);

/**
 * 플래그 키인지 확인하는 타입 가드
 * @param key - 확인할 키
 * @returns 유효한 플래그 키인지 여부
 */
export const isFlagKey = (key: string): boolean => isFlagKeyFromData(key);

/**
 * MinMaxRange 타입인지 확인하는 타입 가드
 * @param value - 확인할 값
 * @returns MinMaxRange 타입인지 여부
 */
export const isMinMaxRange = (value: any): value is MinMaxRange => {
  return (
    typeof value === 'object' &&
    value !== null &&
    (typeof value.min === 'number' || typeof value.max === 'number')
  );
};

/**
 * 숫자인지 확인하는 타입 가드
 * @param value - 확인할 값
 * @returns number 타입인지 여부
 */
export const isNumber = (value: any): value is number =>
  typeof value === 'number';

/**
 * 문자열인지 확인하는 타입 가드
 * @param value - 확인할 값
 * @returns string 타입인지 여부
 */
export const isString = (value: any): value is string =>
  typeof value === 'string';

/**
 * 객체가 Chapter 타입인지 확인하는 타입 가드
 * @param obj - 검사할 객체
 * @returns Chapter 타입 여부
 */
export function isChapter(obj: any): obj is Chapter {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  // 필수 속성 확인
  const hasId = typeof obj.id === 'string';
  const hasName = typeof obj.name === 'string';
  const hasType =
    typeof obj.type === 'string' &&
    (obj.type === 'rest' || obj.type === 'story');
  const hasFloor = typeof obj.floor === 'number';
  const hasScenes = Array.isArray(obj.scenes);

  if (!hasId || !hasName || !hasType || !hasFloor || !hasScenes) {
    return false;
  }

  // scenes 배열의 첫 번째 요소만 간단히 검사 (옵션)
  if (obj.scenes.length > 0) {
    const firstScene = obj.scenes[0];
    if (
      typeof firstScene.id !== 'string' ||
      typeof firstScene.text !== 'string' ||
      !Array.isArray(firstScene.choices)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * 아이템 ID인지 확인하는 타입 가드
 * @param id - 확인할 ID
 * @returns 유효한 아이템 ID인지 여부
 */
export const isItemId = (id: string): boolean => isItemIdFromData(id);

/**
 * 변수 키인지 확인하는 타입 가드
 * @param key - 확인할 키
 * @returns 유효한 변수 키인지 여부
 */
export const isVariableKey = (key: string): boolean =>
  isVariableKeyFromData(key);

/**
 * 스킬 키인지 확인하는 타입 가드
 * @param key - 확인할 스킬 ID
 * @returns 유효한 스킬 ID인지 여부
 */
export const isSkillKey = (key: string): boolean => isSkillKeyFromData(key);
