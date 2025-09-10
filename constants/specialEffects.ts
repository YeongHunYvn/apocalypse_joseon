// /constants/specialEffects.ts

/**
 * 게임 로직과 직접 연결된 특수 효과들을 정의합니다.
 * 이 효과들은 일반적인 상태 변화(스탯, 아이템 등)와 달리
 * 게임의 흐름 자체를 제어하는 특별한 동작을 수행합니다.
 *
 * 예: 게임오버 처리, 휴식방 정리, 게임 상태 초기화 등
 */

// 특수 효과 ID 타입
export type SpecialEffectId =
  | 'force_gameover'
  | 'rest_room_cleanup'
  | 'reset_game'
  | 'reset_health'
  | 'reset_mind'
  | 'complete_scene'
  | 'increment_death_count'
  | 'set_floor'
  | 'clear_visited_scenes';

// 특수 효과 정의 객체
export const SPECIAL_EFFECTS = {
  // 강제 게임오버
  force_gameover: {
    id: 'force_gameover',
    description: '플레이어를 즉시 게임오버 상태로 만듭니다.',
  },
  // 휴식방 정리
  rest_room_cleanup: {
    id: 'rest_room_cleanup',
    description:
      '휴식방에 도착했을 때 일시적인 상태(temporary 태그, persist: false 아이템)를 정리합니다.',
  },
  // 게임 리셋
  reset_game: {
    id: 'reset_game',
    description: '게임 상태를 초기 상태로 리셋합니다.',
  },
  // 체력 전체 회복
  reset_health: {
    id: 'reset_health',
    description: '체력을 최대치까지 회복합니다.',
  },
  // 정신력 전체 회복
  reset_mind: {
    id: 'reset_mind',
    description: '정신력을 최대치까지 회복합니다.',
  },
  // 씬 완료 처리 (completed_scenes에 추가)
  complete_scene: {
    id: 'complete_scene',
    description: '특정 씬을 완료된 것으로 처리합니다. 값으로 씬 ID를 받습니다.',
    valueType: 'string',
  },
  // 사망 횟수 증가
  increment_death_count: {
    id: 'increment_death_count',
    description: '전체 사망 횟수를 1 증가시킵니다.',
  },
  // 현재 층 설정
  set_floor: {
    id: 'set_floor',
    description: '현재 층을 특정 값으로 설정합니다.',
    valueType: 'number',
  },
  // 방문 이력 초기화
  clear_visited_scenes: {
    id: 'clear_visited_scenes',
    description:
      '모든 씬의 방문 이력을 초기화합니다. LocalStorage도 함께 삭제됩니다.',
  },
} as const;

// 특수 효과 ID 배열 (자동화용)
export const SPECIAL_EFFECT_KEYS = Object.keys(
  SPECIAL_EFFECTS
) as SpecialEffectId[];

// 씬 이펙트에서 사용할 수 있는 특수 효과 타입 정의
// 일부 효과는 값을 받을 수 있습니다 (예: complete_scene: 'scn_quest_1')
export type SpecialEffects = {
  [K in SpecialEffectId]?: K extends 'complete_scene'
    ? string
    : K extends 'set_floor'
      ? number
      : boolean;
};

/**
 * 주어진 객체가 유효한 SpecialEffectId인지 확인하는 타입 가드 함수
 * @param key - 확인할 키
 * @returns SpecialEffectId 여부
 */
export function isValidSpecialEffectId(key: unknown): key is SpecialEffectId {
  return (
    typeof key === 'string' &&
    SPECIAL_EFFECT_KEYS.includes(key as SpecialEffectId)
  );
}
