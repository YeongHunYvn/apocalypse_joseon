import React, { useEffect, useRef } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ShakeTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  duration?: number;
  style?: TextStyle;
}

/**
 * 떨림 효과를 적용하는 텍스트 컴포넌트
 * @param children 텍스트 내용
 * @param enabled 애니메이션 활성화 여부
 * @param intensity 떨림 강도 (0~1)
 * @param duration 애니메이션 지속시간 (밀리초)
 * @param style 추가 스타일
 */
export const ShakeText: React.FC<ShakeTextProps> = React.memo(
  ({
    children,
    enabled = true,
    intensity = 1,
    duration: _duration = 1000,
    style,
  }) => {
    const translateX = useSharedValue(0);
    const isAnimating = useRef(false);

    useEffect(() => {
      if (enabled && !isAnimating.current) {
        isAnimating.current = true;

        // 떨림 애니메이션 시작
        translateX.value = withRepeat(
          withSequence(
            withTiming(-1 * intensity, {
              duration: 50,
              easing: Easing.linear,
            }),
            withTiming(1 * intensity, {
              duration: 50,
              easing: Easing.linear,
            }),
            withTiming(-0.5 * intensity, {
              duration: 50,
              easing: Easing.linear,
            }),
            withTiming(0.5 * intensity, {
              duration: 50,
              easing: Easing.linear,
            }),
            withTiming(0, { duration: 50, easing: Easing.linear })
          ),
          -1, // 무한 반복
          true // 역방향
        );
      } else if (!enabled && isAnimating.current) {
        isAnimating.current = false;

        // 애니메이션 중지하고 원래 위치로
        translateX.value = withTiming(0, { duration: 100 });
      }
    }, [enabled, intensity]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: translateX.value }],
      };
    });

    return (
      <Animated.Text style={[style, animatedStyle]}>{children}</Animated.Text>
    );
  }
);

export default ShakeText;
