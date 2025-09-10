import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import { 
  useGestureDetector, 
  GestureConfig, 
  GestureCallbacks 
} from '../../hooks/ui/gestures/useGestureDetector';

export interface GestureWrapperProps {
  /** 자식 컴포넌트들 */
  children: React.ReactNode;
  /** 제스처 감지 설정 */
  gestureConfig?: GestureConfig;
  /** 제스처 이벤트 콜백들 */
  gestureCallbacks?: GestureCallbacks;
  /** 컨테이너 스타일 */
  style?: ViewStyle;
  /** 제스처 활성화 여부 */
  enabled?: boolean;
}

/**
 * 순수한 제스처 감지를 담당하는 래퍼 컴포넌트
 * 터치/드래그/길게누르기 감지만 수행하며 다른 로직은 포함하지 않습니다.
 */
export default function GestureWrapper({
  children,
  gestureConfig,
  gestureCallbacks,
  style,
  enabled = true,
}: GestureWrapperProps) {
  
  // 제스처 감지 훅
  const { gestureHandlers, resetGestureState } = useGestureDetector(
    { ...gestureConfig, enabled },
    gestureCallbacks
  );

  // 비활성화 시 제스처 상태 초기화
  useEffect(() => {
    if (!enabled) {
      resetGestureState();
    }
  }, [enabled, resetGestureState]);

  return (
    <View
      style={[{ flex: 1 }, style]}
      {...gestureHandlers}
    >
      {children}
    </View>
  );
}