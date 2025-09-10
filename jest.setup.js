// Jest 테스트 환경 설정

// import 'react-native-gesture-handler/jestSetup';

// React Native 모듈 모킹 (Expo 53/React Native 0.79 이상에서는 필요 없음)
// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Expo 모듈 모킹
jest.mock('expo', () => ({
  ...jest.requireActual('expo'),
  registerRootComponent: jest.fn(),
}));

// AsyncStorage 모킹
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Console 로그 모킹 (테스트 중 로그 출력 제한)
global.console = {
  ...console,
  // 테스트 중에는 debug 로그를 무시
  debug: jest.fn(),
  // 에러는 그대로 출력
  error: console.error,
  // 경고는 그대로 출력
  warn: console.warn,
  // info는 그대로 출력
  info: console.info,
};

// 전역 테스트 타임아웃 설정
jest.setTimeout(10000);

// 테스트 환경 변수 설정
process.env.NODE_ENV = 'test'; 