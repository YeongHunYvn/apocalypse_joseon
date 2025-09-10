import { UseSafeAreaReturn } from '../../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 디바이스의 안전 영역(safe area) 인셋 값을 제공하는 커스텀 훅입니다.
 * 상단, 하단, 좌측, 우측의 노치나 시스템 UI를 피하기 위한 여백 값을 반환합니다.
 * @returns \{ top: number, bottom: number, left: number, right: number }
 */
export function useSafeArea(): UseSafeAreaReturn {
  const insets = useSafeAreaInsets();
  return insets;
}
