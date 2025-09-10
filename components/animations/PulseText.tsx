import React, { useEffect, useRef } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface PulseTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  duration?: number;
  style?: TextStyle;
}

/**
 * 펄스 효과를 적용하는 텍스트 컴포넌트
 * @param children 텍스트 내용
 * @param enabled 애니메이션 활성화 여부
 * @param intensity 펄스 강도 (0~1)
 * @param duration 애니메이션 지속시간 (밀리초)
 * @param style 추가 스타일
 */
export const PulseText: React.FC<PulseTextProps> = React.memo(
  ({ children, enabled = true, intensity = 1, duration = 1000, style }) => {
    const opacity = useSharedValue(1);
    const isAnimating = useRef(false);

    useEffect(() => {
      if (enabled && !isAnimating.current) {
        isAnimating.current = true;

        // 펄스 애니메이션 시작 - 투명도가 최소값과 최대값 사이를 오감
        // intensity가 높을수록 더 큰 변화폭
        const minOpacity = Math.max(0.3, 1 - intensity * 0.7);
        const _maxOpacity = 1.0;

        opacity.value = withRepeat(
          withTiming(minOpacity, {
            duration: duration / 2,
            easing: Easing.inOut(Easing.ease),
          }),
          -1, // 무한 반복
          true // 역방향
        );
      } else if (!enabled && isAnimating.current) {
        isAnimating.current = false;

        // 애니메이션 중지하고 원래 투명도로
        opacity.value = withTiming(1, { duration: 300 });
      }
    }, [enabled, intensity, duration]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    });

    return (
      <Animated.Text style={[style, animatedStyle]}>{children}</Animated.Text>
    );
  }
);

export default PulseText;
