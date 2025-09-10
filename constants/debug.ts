// 개발용 설정 (빌드/런타임 토글)
// - React Native에서는 __DEV__ 전역을 사용할 수 있습니다.
// - 필요 시 .env 연동 라이브러리를 도입해 확장할 수 있습니다.

export const DEBUG_CONFIG = {
  // 디버그 패널 표시 여부
  showDebugPanel: true,
  // 로그 출력 허용(프로덕션에서 제어)
  enableLogs: false,
} as const;
