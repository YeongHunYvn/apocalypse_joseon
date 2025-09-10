/**
 * 배경 효과 관련 설정
 * 모든 배경 효과의 기본값과 프리셋을 중앙에서 관리
 */

/**
 * ScreenShake 효과 전체 설정 (기본값 + 프리셋)
 */
export const SCREEN_SHAKE = {
  /** 기본 설정값들 */
  defaults: {
    /** 기본 흔들림 강도 (픽셀 단위) */
    intensity: 2,
    /** 기본 흔들림 주기 (밀리초) */
    frequency: 40,
    /** 기본 지속시간 (밀리초, 0 또는 undefined면 무한 반복) */
    duration: 0,
    /** 무한 반복 시 각 주기별 최대 지속시간 (메모리 절약용) */
    infiniteCycleDuration: 10000,
  },
  /** 사전 정의된 프리셋들 (기본값 위에 덮어쓰기) */
  presets: {
    /** 가벼운 흔들림 - 미묘한 효과 */
    light: {
      intensity: 3,
      duration: 400,
    },
    /** 기본 흔들림 - 일반적인 효과 */
    normal: {
      intensity: 7,
      duration: 500,
      frequency: 50,
    },
    /** 강한 흔들림 - 강렬한 효과 */
    strong: {
      intensity: 15,
      duration: 500,
      frequency: 30,
    },
    /** 무한 떨림 - 계속되는 미묘한 효과 */
    infinite_tremor: {
      intensity: 1,
      duration: 0, // 무한 반복
      frequency: 60,
    },
    /** 무한 진동 - 계속되는 중간 강도 효과 */
    infinite_vibration: {},
  },
} as const;

/**
 * VignetteOverlay 효과 전체 설정 (기본값 + 프리셋)
 */
export const VIGNETTE_OVERLAY = {
  /** 기본 설정값들 */
  defaults: {
    /** 기본 색상 */
    color: 'rgb(255, 0, 0)',
    /** 기본 지속시간 (밀리초, undefined면 무한 지속) */
    duration: 0,
    /** 기본 페이드 인 지속시간 (밀리초) */
    fadeInDuration: 500,
    /** 기본 페이드 아웃 지속시간 (밀리초) */
    fadeOutDuration: 500,
    /** 기본 최대 불투명도 (0~1) */
    maxOpacity: 0.2,
    /** 기본 비네트 강도 (0~1) */
    intensity: 0.8,
    /** 기본 투명 범위 (0~1, 중앙에서 어느 정도까지 투명할지) */
    fadeRange: 0.8,
  },
  /** 사전 정의된 프리셋들 (기본값 위에 덮어쓰기) */
  presets: {
    /** 붉은 경고 - 위험한 상황 */
    warning: {
      color: 'rgb(255, 0, 0)',
    },
    /** 푸른 차가움 - 차가운 환경 */
    cold: {
      color: 'rgb(0, 50, 150)',
    },
    /** 녹색 독기 - 독성 환경 */
    poison: {
      color: 'rgb(50, 150, 0)',
    },
    /** 무한 그림자 - 계속되는 어둠 */
    shadow: {
      color: 'rgb(0, 0, 0)',
      fadeInDuration: 1000,
      fadeOutDuration: 1000,
      maxOpacity: 0.8,
      intensity: 0.8,
      fadeRange: 0.9,
    },
  },
} as const;

/**
 * 프리셋 이름 타입들
 */
export type ScreenShakePreset = keyof typeof SCREEN_SHAKE.presets;
export type VignetteOverlayPreset = keyof typeof VIGNETTE_OVERLAY.presets;

/**
 * 효과별 매개변수 인터페이스들
 */
export interface ScreenShakeParams {
  /** 흔들림 강도 (픽셀 단위) */
  intensity: number;
  /** 지속시간 (밀리초, undefined이거나 0이면 무한 반복) */
  duration?: number;
  /** 흔들림 주기 (밀리초) */
  frequency: number;
}

export interface VignetteOverlayParams {
  /** 비네트 색상 */
  color: string;
  /** 지속시간 (밀리초, undefined이거나 0이면 무한 지속) */
  duration?: number;
  /** 최대 불투명도 (0~1) */
  maxOpacity: number;
  /** 비네트 강도 (0~1, 높을수록 가장자리가 더 어둠) */
  intensity: number;
  /** 투명 범위 (0~1, 중앙에서 어느 정도까지 투명할지) */
  fadeRange: number;
}

/**
 * 프리셋 가져오기 함수들 (기본값과 프리셋 병합)
 */
export function getScreenShakePreset(
  preset: ScreenShakePreset
): ScreenShakeParams {
  return {
    ...SCREEN_SHAKE.defaults,
    ...SCREEN_SHAKE.presets[preset],
  };
}

export function getVignetteOverlayPreset(
  preset: VignetteOverlayPreset
): VignetteOverlayParams {
  return {
    ...VIGNETTE_OVERLAY.defaults,
    ...VIGNETTE_OVERLAY.presets[preset],
  };
}

/**
 * 설정 파싱 함수들
 */
export function parseScreenShakeSetting(setting: string): ScreenShakeParams {
  // 기본값으로 시작
  let params: ScreenShakeParams = {
    ...SCREEN_SHAKE.defaults,
  };

  // 설정 파싱
  const parts = setting.split(':');

  if (parts.length > 1) {
    const option = parts[1];

    // 프리셋 확인 (기본값 위에 프리셋 덮어쓰기)
    if (option in SCREEN_SHAKE.presets) {
      params = getScreenShakePreset(option as ScreenShakePreset);
    } else {
      // Logger.warn('[BackgroundEffectConfig]', `알 수 없는 ScreenShake 프리셋: ${option}`);
    }
  }

  return params;
}

export function parseVignetteOverlaySetting(
  setting: string
): VignetteOverlayParams {
  // 기본값으로 시작
  let params: VignetteOverlayParams = {
    ...VIGNETTE_OVERLAY.defaults,
  };

  // 설정 파싱
  const parts = setting.split(':');

  if (parts.length > 1) {
    const option = parts[1];

    // 프리셋 확인 (기본값 위에 프리셋 덮어쓰기)
    if (option in VIGNETTE_OVERLAY.presets) {
      params = getVignetteOverlayPreset(option as VignetteOverlayPreset);
    } else {
      // Logger.warn('[BackgroundEffectConfig]', `알 수 없는 VignetteOverlay 프리셋: ${option}`);
    }
  }

  return params;
}

/**
 * 모든 배경 효과들의 설정
 */
export const BACKGROUND_EFFECT_CONFIG = {
  screen_shake: SCREEN_SHAKE,
  vignette: VIGNETTE_OVERLAY,
} as const;
