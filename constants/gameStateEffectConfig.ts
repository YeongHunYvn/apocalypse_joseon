/**
 * 게임 상태 기반 배경 효과 설정
 * 게임 상태(체력, 정신력 등)에 따라 자동으로 활성화되는 효과들의 설정값들을 관리합니다.
 */

// ==========================================
// 🩺 체력 기반 효과 설정
// ==========================================

/**
 * 체력 경고 임계값 설정
 */
export const HEALTH_THRESHOLDS = {
  /** 체력 경고 시작 임계값 (34% 미만) */
  WARNING_THRESHOLD: 0.34,
  /** 위험 상태 임계값 (20% 미만) */
  CRITICAL_THRESHOLD: 0.2,
  /** 극위험 상태 임계값 (10% 미만) */
  EXTREME_THRESHOLD: 0.1,
} as const;

/**
 * HealthWarning 효과 기본 매개변수
 */
export const HEALTH_WARNING_CONFIG = {
  defaults: {
    /** 기본 색상 (빨간색) */
    color: '#FF0000',
    /** 점멸 주기 (밀리초) */
    pulseInterval: 800,
    /** 페이드 인 지속시간 (밀리초) */
    fadeInDuration: 300,
    /** 페이드 아웃 지속시간 (밀리초) */
    fadeOutDuration: 500,
    /** 최대 불투명도 */
    maxOpacity: 0.3,
    /** 최소 불투명도 */
    minOpacity: 0.05,
    /** 테두리 두께 (픽셀) */
    borderWidth: 8,
  },
  /** 체력 상태별 설정 */
  byHealthLevel: {
    /** 경고 상태 (34% 미만) */
    warning: {
      color: '#FF6B47', // 주황빛 빨강
      pulseInterval: 1200,
      maxOpacity: 0.25,
      minOpacity: 0.05,
      borderWidth: 6,
    },
    /** 위험 상태 (20% 미만) */
    critical: {
      color: '#FF3333', // 밝은 빨강
      pulseInterval: 900,
      maxOpacity: 0.35,
      minOpacity: 0.08,
      borderWidth: 8,
    },
    /** 극위험 상태 (10% 미만) */
    extreme: {
      color: '#FF0000', // 순빨강
      pulseInterval: 600,
      maxOpacity: 0.45,
      minOpacity: 0.12,
      borderWidth: 10,
    },
  },
} as const;

// ==========================================
// 🧠 정신력 기반 효과 설정 (미래 확장용)
// ==========================================

/**
 * 정신력 경고 임계값 설정 (미래 확장용)
 */
export const MIND_THRESHOLDS = {
  WARNING_THRESHOLD: 0.3,
  CRITICAL_THRESHOLD: 0.15,
} as const;

// ==========================================
// 🎯 상태 기반 효과 매핑
// ==========================================

/**
 * 게임 상태 기반 효과 타입 정의
 */
export type GameStateEffectType = 'health_warning' | 'mind_distortion' | 'none';

/**
 * 상태 기반 효과 우선순위 (숫자가 높을수록 우선순위가 높음)
 */
export const GAMESTATE_EFFECT_PRIORITY = {
  health_warning: 100, // 가장 높은 우선순위
  mind_distortion: 80, // 미래 확장용
  none: 0,
} as const;

/**
 * 체력 수치를 기반으로 적절한 HealthWarning 설정을 반환합니다.
 * @param healthPercentage - 체력 비율 (0~1)
 * @returns HealthWarning 설정 또는 null (효과 불필요)
 */
export function getHealthWarningConfig(healthPercentage: number) {
  if (healthPercentage >= HEALTH_THRESHOLDS.WARNING_THRESHOLD) {
    return null; // 체력이 충분함
  }

  if (healthPercentage < HEALTH_THRESHOLDS.EXTREME_THRESHOLD) {
    return HEALTH_WARNING_CONFIG.byHealthLevel.extreme;
  }

  if (healthPercentage < HEALTH_THRESHOLDS.CRITICAL_THRESHOLD) {
    return HEALTH_WARNING_CONFIG.byHealthLevel.critical;
  }

  return HEALTH_WARNING_CONFIG.byHealthLevel.warning;
}

/**
 * 게임 상태를 기반으로 활성화되어야 할 효과를 결정합니다.
 * @param health - 현재 체력
 * @param maxHealth - 최대 체력
 * @param mind - 현재 정신력 (미래 확장용)
 * @param maxMind - 최대 정신력 (미래 확장용)
 * @returns 활성화할 효과 타입
 */
export function determineGameStateEffect(
  health: number,
  maxHealth: number,
  _mind?: number,
  _maxMind?: number
): GameStateEffectType {
  const healthPercentage = health / maxHealth;

  // 체력 경고 효과 우선 확인
  if (healthPercentage < HEALTH_THRESHOLDS.WARNING_THRESHOLD) {
    return 'health_warning';
  }

  // 미래 확장: 정신력 기반 효과
  // if (mind !== undefined && maxMind !== undefined) {
  //   const mindPercentage = mind / maxMind;
  //   if (mindPercentage < MIND_THRESHOLDS.WARNING_THRESHOLD) {
  //     return 'mind_distortion';
  //   }
  // }

  return 'none';
}
