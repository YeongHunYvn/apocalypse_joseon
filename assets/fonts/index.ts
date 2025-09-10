import { useFonts } from 'expo-font';

/**
 * MaruBuri 폰트 설정
 * 모든 MaruBuri 폰트 파일을 정의하고 로딩하는 모듈
 */

// 폰트 파일 경로 정의
export const FONT_FILES = {
  'MaruBuri-ExtraLight': require('./MaruBuri-ExtraLight.ttf'),
  'MaruBuri-Light': require('./MaruBuri-Light.ttf'),
  'MaruBuri-Regular': require('./MaruBuri-Regular.ttf'),
  'MaruBuri-SemiBold': require('./MaruBuri-SemiBold.ttf'),
  'MaruBuri-Bold': require('./MaruBuri-Bold.ttf'),
} as const;

// 폰트 패밀리 이름 타입
export type FontFamily = keyof typeof FONT_FILES;

/**
 * MaruBuri 폰트를 로딩하는 훅
 * @returns [fontsLoaded, fontError] - 폰트 로딩 상태와 에러
 */
export function useMaruBuriFonts() {
  return useFonts(FONT_FILES);
}
