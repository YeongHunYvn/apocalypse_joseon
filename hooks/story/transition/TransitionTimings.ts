/**
 * 씬 전환 타이밍 상수 정의
 * 모든 전환 관련 시간값을 중앙 관리합니다.
 */

export const TRANSITION_PHASES = {
  /** 페이드아웃 지속 시간 (ms) */
  FADE_OUT: 300,

  /** 선택지 처리 최소 대기 시간 (ms) */
  PROCESSING: 500,

  /** 페이드인 지속 시간 (ms) */
  FADE_IN: 300,

  /** 씬 업데이트 반영 대기 시간 (ms) */
  SCENE_UPDATE_DELAY: 33, // ~1 frame at 30fps

  /** 에러 복구 대기 시간 (ms) */
  ERROR_RECOVERY_DELAY: 1000,
} as const;

/**
 * 전환 단계별 애니메이션 설정
 */
export const TRANSITION_ANIMATIONS = {
  fadeOut: {
    duration: TRANSITION_PHASES.FADE_OUT,
    useNativeDriver: true,
  },
  fadeIn: {
    duration: TRANSITION_PHASES.FADE_IN,
    useNativeDriver: true,
  },
} as const;

/**
 * 전환 타임아웃 설정
 */
export const TRANSITION_TIMEOUTS = {
  /** 전체 전환 과정 최대 허용 시간 (ms) */
  TOTAL_TRANSITION: 10000,

  /** 개별 단계별 최대 허용 시간 (ms) */
  SINGLE_PHASE: 3000,

  /** 선택지 처리 최대 허용 시간 (ms) */
  CHOICE_PROCESSING: 5000,
} as const;
