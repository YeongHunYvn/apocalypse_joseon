import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface ScaleTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  duration?: number;
  style?: TextStyle;
}

/**
 * 확대/축소 효과를 적용하는 텍스트 컴포넌트
 * @param children 텍스트 내용
 * @param enabled 애니메이션 활성화 여부
 * @param intensity 확대/축소 강도 (0~1)
 * @param duration 애니메이션 지속시간 (밀리초)
 * @param style 추가 스타일
 */
export const ScaleText: React.FC<ScaleTextProps> = React.memo(
  ({ children, enabled = true, intensity = 1, duration = 1000, style }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
      if (enabled) {
        // 확대/축소 애니메이션 시작
        scale.value = withRepeat(
          withTiming(1 + 0.2 * intensity, {
            duration,
            easing: Easing.inOut(Easing.ease),
          }),
          -1, // 무한 반복
          true // 역방향
        );
      } else {
        // 애니메이션 중지하고 원래 크기로
        scale.value = withTiming(1, { duration: 300 });
      }
    }, [enabled, intensity, duration]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });

    return (
      <Animated.Text style={[style, animatedStyle]}>{children}</Animated.Text>
    );
  }
);

export default ScaleText;
