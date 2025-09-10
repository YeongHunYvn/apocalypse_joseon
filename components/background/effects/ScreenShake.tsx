import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { SCREEN_SHAKE } from '../../../constants/backgroundEffectConfig';

/**
 * ScreenShake 컴포넌트의 Props 인터페이스
 */
interface ScreenShakeProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 흔들림 강도 (픽셀 단위, 기본: 4) */
  intensity?: number;
  /** 지속시간 (밀리초, undefined이거나 0이면 무한 반복) */
  duration?: number;
  /** 흔들림 주기 (밀리초, 기본: 40) */
  frequency?: number;
  /** 효과 완료 시 콜백 */
  onComplete?: () => void;
  /** 추가 스타일 */
  style?: ViewStyle;
}

/**
 * 화면 흔들림 효과 컴포넌트
 * 무한 반복: duration이 undefined이거나 0이면 컴포넌트가 언마운트될 때까지 계속 흔들림
 */
const ScreenShake: React.FC<ScreenShakeProps> = ({
  children,
  intensity = SCREEN_SHAKE.defaults.intensity,
  duration = SCREEN_SHAKE.defaults.duration,
  frequency = SCREEN_SHAKE.defaults.frequency,
  onComplete,
  style,
}) => {
  // X축과 Y축 흔들림을 위한 애니메이션 값
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;

  // 무한 반복 제어를 위한 ref
  const isUnmounted = useRef(false);
  const currentAnimation = useRef<Animated.CompositeAnimation | null>(null);

  /**
   * 단일 흔들림 사이클을 생성합니다.
   * @param cycleDuration 사이클 지속시간
   * @returns 흔들림 애니메이션
   */
  const createShakeCycle = (
    cycleDuration: number
  ): Animated.CompositeAnimation => {
    const shakeCount = Math.floor(cycleDuration / frequency);
    const animations: Animated.CompositeAnimation[] = [];

    // 각 주기마다 랜덤한 방향으로 흔들림
    for (let i = 0; i < shakeCount; i++) {
      const randomX = (Math.random() - 0.5) * 2 * intensity;
      const randomY = (Math.random() - 0.5) * 2 * intensity;

      animations.push(
        Animated.parallel([
          Animated.timing(shakeX, {
            toValue: randomX,
            duration: frequency / 2,
            useNativeDriver: true,
          }),
          Animated.timing(shakeY, {
            toValue: randomY,
            duration: frequency / 2,
            useNativeDriver: true,
          }),
        ])
      );

      // 원점으로 돌아가기
      animations.push(
        Animated.parallel([
          Animated.timing(shakeX, {
            toValue: 0,
            duration: frequency / 2,
            useNativeDriver: true,
          }),
          Animated.timing(shakeY, {
            toValue: 0,
            duration: frequency / 2,
            useNativeDriver: true,
          }),
        ])
      );
    }

    return Animated.sequence(animations);
  };

  /**
   * 흔들림 애니메이션을 시작합니다.
   */
  const startShakeAnimation = () => {
    // 컴포넌트가 언마운트되었으면 실행하지 않음
    if (isUnmounted.current) return;

    if (duration === undefined || duration === 0) {
      // 무한 반복 모드 (duration이 undefined이거나 0)
      const cycleDuration = SCREEN_SHAKE.defaults.infiniteCycleDuration;
      const shakeAnimation = createShakeCycle(cycleDuration);

      currentAnimation.current = shakeAnimation;
      shakeAnimation.start(({ finished }) => {
        // 완료되었고 컴포넌트가 아직 마운트되어 있으면 다시 시작
        if (finished && !isUnmounted.current) {
          startShakeAnimation(); // 재귀 호출로 무한 반복
        }
      });
    } else {
      // 지정된 지속시간 모드
      const shakeAnimation = createShakeCycle(duration);

      currentAnimation.current = shakeAnimation;
      shakeAnimation.start(({ finished }) => {
        if (finished && !isUnmounted.current) {
          // 애니메이션 완료 후 정리
          shakeX.setValue(0);
          shakeY.setValue(0);
          onComplete?.();
        }
      });
    }
  };

  /**
   * 애니메이션을 정리합니다.
   */
  const cleanupAnimation = () => {
    // 현재 실행 중인 애니메이션 중단
    if (currentAnimation.current) {
      currentAnimation.current.stop();
      currentAnimation.current = null;
    }

    // 개별 애니메이션 값들도 중단
    shakeX.stopAnimation();
    shakeY.stopAnimation();

    // 위치 초기화
    shakeX.setValue(0);
    shakeY.setValue(0);
  };

  useEffect(() => {
    isUnmounted.current = false;

    // 컴포넌트 마운트 시 즉시 흔들림 시작
    startShakeAnimation();

    return () => {
      // 컴포넌트 언마운트 시 플래그 설정 및 애니메이션 정리
      isUnmounted.current = true;
      cleanupAnimation();
    };
  }, [intensity, duration, frequency]); // 매개변수가 변경되면 애니메이션 재시작

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          transform: [{ translateX: shakeX }, { translateY: shakeY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenShake;
