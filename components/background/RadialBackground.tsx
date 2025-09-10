import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import Animated from 'react-native-reanimated';
import { COLORS } from '../../constants/theme';
import { StyleSheet } from 'react-native';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * 방사형 그라데이션 배경을 렌더링하는 컴포넌트입니다.
 * 화면 중앙보다 약간 위에서부터 밝은 색상이 퍼지는 효과를 줍니다.
 */
const RadialBackground = () => {
  return (
    <Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient
          id='grad'
          cx='50%'
          cy='-30%' // 중심점을 화면 상단 30% 지점으로 설정
          fx='50%'
          fy='-30%' // 초점도 동일하게 설정
          rx='105%' // 가로 방향으로 퍼지는 범위
          ry='70%' // 세로 방향으로 퍼지는 범위 (타원 형태)
        >
          <Stop
            offset='0%'
            stopColor={COLORS.gradientLight}
            stopOpacity='1' // 중심부는 약간 더 선명하게
          />
          <Stop
            offset='100%'
            stopColor={COLORS.background}
            stopOpacity='1' // 가장자리는 완전히 투명하게
          />
        </RadialGradient>
      </Defs>
      <AnimatedRect x='0' y='0' width='100%' height='100%' fill='url(#grad)' />
    </Svg>
  );
};

export default RadialBackground;
