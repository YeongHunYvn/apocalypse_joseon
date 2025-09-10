import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { TextStyle } from 'react-native';

interface WaveTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  duration?: number;
  style?: TextStyle;
}

/**
 * 웨이브 효과를 적용하는 텍스트 컴포넌트
 * @param children 텍스트 내용
 * @param enabled 애니메이션 활성화 여부
 * @param intensity 웨이브 강도 (0~1)
 * @param duration 애니메이션 지속시간 (밀리초)
 * @param style 추가 스타일
 */
export const WaveText: React.FC<WaveTextProps> = React.memo(
  ({ children, enabled = true, intensity = 1, duration = 2000, style }) => {
    const translateY = useSharedValue(0);

    useEffect(() => {
      if (enabled) {
        // 웨이브 애니메이션 시작
        translateY.value = withRepeat(
          withTiming(-3 * intensity, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          -1, // 무한 반복
          true // 역방향
        );
      } else {
        // 애니메이션 중지하고 원래 위치로
        translateY.value = withTiming(0, { duration: 300 });
      }
    }, [enabled, intensity, duration]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateY: translateY.value }],
      };
    });

    return (
      <Animated.Text style={[style, animatedStyle]}>{children}</Animated.Text>
    );
  }
);

export default WaveText;
