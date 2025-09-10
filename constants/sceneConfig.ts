// 씬 히스토리 관리 설정
export const SCENE_HISTORY_CONFIG = {
  // 최대 높이 배수 (화면 높이의 배수)
  MAX_HEIGHT_MULTIPLIER: 1.5,
  // 최소 유지할 씬 개수
  MIN_SCENES_TO_KEEP: 2,
  // 제거 애니메이션 시간 (ms)
  REMOVAL_ANIMATION_DURATION: 300,
  // 성능 모니터링 활성화
  ENABLE_PERFORMANCE_MONITORING: false,
  // 높이 측정 디바운스 시간 (ms) - 300ms에서 150ms로 감소
  HEIGHT_DEBOUNCE_MS: 150,
  // 스크롤 최적화 설정
  SCROLL_OPTIMIZATION: {
    // 메모리 임계값 (MB) - 메모리가 이 값을 초과하면 더 공격적으로 씬 제거
    MEMORY_THRESHOLD_MB: 100,
    // 최대 히스토리 씬 개수 (하드 리밋)
    MAX_HISTORY_SCENES: 20,
    // 애니메이션 프레임 스킵 (텍스트 작성 중일 때)
    SKIP_FRAMES_DURING_ANIMATION: true,
    // 스크롤 이벤트 디바운스 (ms)
    SCROLL_EVENT_DEBOUNCE_MS: 16,
  },
} as const;

// 씬 UI 스타일 설정
export const SCENE_STYLE_CONFIG = {
  // 히스토리 씬 투명도 (이전 씬은 약간 투명하게)
  HISTORY_OPACITY: 0.7,
  // 현재 씬 투명도
  CURRENT_OPACITY: 1.0,
  // 제거 애니메이션 시작 투명도
  REMOVAL_START_OPACITY: 1.0,
  // 제거 애니메이션 종료 투명도
  REMOVAL_END_OPACITY: 0.0,
} as const;

// 씬 전환 관련 설정
export const SCENE_TRANSITION_CONFIG = {
  // 기본 전환 지연 시간 (밀리초)
  DEFAULT_TRANSITION_DELAY: 100,
  // 에러 시 재시도 지연 시간 (밀리초)
  ERROR_RETRY_DELAY: 1000,
  // 최대 재시도 횟수
  MAX_RETRY_COUNT: 3,
} as const;

// 텍스트 효과 성능 설정
export const TEXT_EFFECTS_CONFIG = {
  // 전역 애니메이션 설정
  global: {
    enableAnimations: true, // 전역 애니메이션 활성화 여부
    performanceMode: false, // 성능 모드 (애니메이션 단순화)
    maxConcurrentAnimations: 10, // 동시 실행 가능한 최대 애니메이션 수
  },

  // 개별 효과별 설정
  effects: {
    shake: {
      enabled: true,
      maxIntensity: 3.0, // 최대 강도 제한
      defaultIntensity: 1.0,
    },
    glow: {
      enabled: true,
      maxIntensity: 2.0,
      defaultIntensity: 1.0,
    },
    pulse: {
      enabled: true,
      maxIntensity: 2.0,
      defaultIntensity: 1.0,
    },
    fade: {
      enabled: true,
      maxIntensity: 1.0,
      defaultIntensity: 1.0,
      defaultDuration: 1000, // 기본 지속시간 (밀리초)
    },
    scale: {
      enabled: true,
      maxIntensity: 1.5, // 최대 확대 비율
      defaultIntensity: 1.1,
    },
    wave: {
      enabled: true,
      maxIntensity: 1.5,
      defaultIntensity: 1.0,
    },
  },

  // 캐싱 설정
  caching: {
    enableParsingCache: true, // 텍스트 파싱 결과 캐싱
    maxCacheSize: 100, // 최대 캐시 항목 수
    cacheExpiryTime: 5 * 60 * 1000, // 캐시 만료 시간 (5분)
  },

  // 메모리 관리 설정
  memory: {
    enableMemoryOptimization: true, // 메모리 최적화 활성화
    cleanupInterval: 30 * 1000, // 정리 주기 (30초)
    maxAnimationObjects: 50, // 최대 애니메이션 객체 수
  },
} as const;

// 씬 로딩 설정
export const SCENE_LOADING_CONFIG = {
  // 로딩 타임아웃 (밀리초)
  LOADING_TIMEOUT: 10000,
  // 로딩 메시지 표시 지연 시간
  LOADING_MESSAGE_DELAY: 500,
  // 프리로딩 씬 개수
  PRELOAD_SCENE_COUNT: 3,
} as const;

// 씬 유효성 검사 설정
export const SCENE_VALIDATION_CONFIG = {
  // 엄격한 유효성 검사 모드
  STRICT_MODE: __DEV__,
  // 필수 필드 검사
  REQUIRE_ALL_FIELDS: __DEV__,
  // 경고 메시지 표시
  SHOW_WARNINGS: __DEV__,
} as const;
