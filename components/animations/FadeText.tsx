import React, { useEffect } from 'react';
import { TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface FadeTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  duration?: number;
  style?: TextStyle;
}

/**
 * 페이드 인 효과를 적용하는 텍스트 컴포넌트
 * @param children 텍스트 내용
 * @param enabled 애니메이션 활성화 여부
 * @param intensity 페이드 강도 (0~1)
 * @param duration 애니메이션 지속시간 (밀리초)
 * @param style 추가 스타일
 */
export const FadeText: React.FC<FadeTextProps> = React.memo(
  ({ children, enabled = true, intensity = 1, duration = 1000, style }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
      if (enabled) {
        // 페이드 인 애니메이션 시작
        opacity.value = withTiming(intensity, {
          duration,
          easing: Easing.out(Easing.ease),
        });
      } else {
        // 즉시 표시
        opacity.value = withTiming(1, { duration: 100 });
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

export default FadeText;
