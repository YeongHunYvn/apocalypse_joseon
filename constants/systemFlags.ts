/**
 * 시스템 플래그 ID 상수 정의
 * 게임 로직에서 직접 참조하는 중요한 플래그들의 ID를 관리합니다.
 * JSON 파일에서 플래그 ID가 변경되어도 이 파일만 수정하면 됩니다.
 */

// ==========================================
// 🎯 시스템 플래그 ID 상수들
// ==========================================

/**
 * 시스템에서 직접 참조하는 중요한 플래그들
 */
export const SYSTEM_FLAGS = {
  /** 강제 게임오버 플래그 */
  FORCE_GAMEOVER: 'force_gameover',

  /** 첫 방문 플래그 */
  FIRST_VISIT: 'first_visit',

  /** 챕터 완료 플래그 */
  CHAPTER_COMPLETE: 'chapter_complete',

  /** 층 완료 플래그 */
  FLOOR_COMPLETE: 'floor_complete',

  /** 탐험 준비 완료 플래그 */
  READY_TO_EXPLORE: 'ready_to_explore',
} as const;

// ==========================================
// 🔍 타입 정의
// ==========================================

export type SystemFlagKey = keyof typeof SYSTEM_FLAGS;

// ==========================================
// 🛠️ 유틸리티 함수들
// ==========================================

/**
 * 시스템 플래그 ID를 가져옵니다
 * @param flagKey 시스템 플래그 키
 * @returns 시스템 플래그 ID
 */
export function getSystemFlagId(flagKey: SystemFlagKey): string {
  return SYSTEM_FLAGS[flagKey];
}
