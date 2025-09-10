import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { COLORS } from '../../constants/theme';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';

const AnimatedRadialGradient = Animated.createAnimatedComponent(RadialGradient);

/**
 * 방사형 그라데이션 배경을 렌더링하는 컴포넌트입니다.
 * 화면 중앙보다 약간 위에서부터 밝은 색상이 퍼지는 효과를 줍니다.
 * Reanimated 2를 사용하여 은은하게 퍼지는 애니메이션 효과가 적용되어 있습니다.
 */
const RadialAnimationBackground = () => {
  const animationValue = useSharedValue(0);

  useEffect(() => {
    animationValue.value = withRepeat(
      withSequence(
        // 꿈 같은 느낌을 위해 애니메이션 주기를 8초로 늘리고, 부드러운 sin easing을 사용합니다.
        withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, // -1: 무한 반복
      true // true: 역방향으로도 반복 (yoyo)
    );
  }, [animationValue]);

  const animatedProps = useAnimatedProps(() => {
    // 그라데이션이 퍼지는 범위를 조절하려면 아래 수식을 변경하세요.
    // animationValue.value는 0과 1 사이를 반복합니다.
    // 꿈 같은 느낌을 위해 변화의 폭을 줄여 더 미묘한 효과를 줍니다.

    // 가로 반지름(rx) 애니메이션 범위: 100% ~ 110%
    const rx = animationValue.value * 0.1 + 1;

    // 세로 반지름(ry) 애니메이션 범위: 65% ~ 75%
    const ry = animationValue.value * 0.1 + 0.65;

    return {
      rx: `${rx * 100}%`,
      ry: `${ry * 100}%`,
    };
  });

  return (
    <Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
      <Defs>
        <AnimatedRadialGradient
          id='grad'
          cx='50%'
          cy='-30%' // 중심점을 화면 상단 밖으로 이동하여 빛이 위에서 은은하게 퍼지도록 설정
          fx='50%'
          fy='-30%' // 자연스러운 그라데이션을 위해 초점(fy)을 중심점(cy)과 동일하게 설정
          animatedProps={animatedProps}
        >
          <Stop offset='0%' stopColor={COLORS.gradientLight} stopOpacity='1' />
          <Stop offset='100%' stopColor={COLORS.background} stopOpacity='1' />
        </AnimatedRadialGradient>
      </Defs>
      <Rect x='0' y='0' width='100%' height='100%' fill='url(#grad)' />
    </Svg>
  );
};

export default RadialAnimationBackground;
