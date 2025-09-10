import {
  ANIMATION_CONFIG,
  ANIMATION_DURATIONS,
} from '../../constants/animationConfig';
import { useCallback, useMemo, useRef } from 'react';

import { Animated } from 'react-native';
import { UseAnimationReturn } from '../../types';

// 지원하는 애니메이션 타입들
export type AnimationType =
  | 'fade'
  | 'scale'
  | 'shake'
  | 'glow'
  | 'pulse'
  | 'wave';

export interface AnimationConfig {
  /** 애니메이션 타입 */
  type: AnimationType;
  /** 애니메이션 지속시간 (밀리초) */
  duration?: number;
  /** 애니메이션 강도 (0~1) */
  intensity?: number;
  /** 자동 반복 여부 */
  loop?: boolean;
  /** 네이티브 드라이버 사용 여부 */
  useNativeDriver?: boolean;
}

/**
 * 통합 애니메이션 훅
 * 다양한 애니메이션 타입을 지원하며 기존 useContentAnimation의 기능을 포함합니다.
 * @param config 애니메이션 설정
 * @returns 애니메이션 관련 값과 함수들
 */
export function useAnimation(config: AnimationConfig): UseAnimationReturn {
  const {
    type,
    duration,
    intensity = 1,
    loop = false,
    useNativeDriver = true,
  } = config;

  // 애니메이션 값 초기화
  const getInitialValue = () => {
    switch (type) {
      case 'fade':
        return 1; // 완전 불투명으로 시작
      case 'scale':
        return 1; // 원래 크기로 시작
      case 'shake':
      case 'wave':
        return 0; // 중앙 위치로 시작
      case 'glow':
      case 'pulse':
        return 1; // 기본 상태로 시작
      default:
        return 0;
    }
  };

  const animatedValue = useRef(new Animated.Value(getInitialValue())).current;

  /**
   * 애니메이션 타입별 목표값과 설정 계산
   */
  const animationConfig = useMemo(() => {
    const baseConfig = ANIMATION_CONFIG[type];
    const animationDuration = duration ?? baseConfig?.duration ?? 1000;

    switch (type) {
      case 'fade':
        return {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver,
        };
      case 'scale':
        return {
          toValue: 1.2 * intensity,
          duration: animationDuration,
          useNativeDriver,
        };
      case 'shake':
        return {
          toValue: 10 * intensity,
          duration: animationDuration / 4, // 빠른 반복을 위해 짧게
          useNativeDriver,
        };
      case 'glow':
      case 'pulse':
        return {
          toValue: 1.3 * intensity,
          duration: animationDuration,
          useNativeDriver: false, // 색상/그림자 효과는 네이티브 드라이버 미지원
        };
      case 'wave':
        return {
          toValue: 5 * intensity,
          duration: animationDuration / 2,
          useNativeDriver,
        };
      default:
        return {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver,
        };
    }
  }, [type, duration, intensity, useNativeDriver]);

  /**
   * 애니메이션 시작
   */
  const startAnimation = useCallback(
    (callback?: () => void) => {
      if (type === 'shake' || type === 'wave') {
        // 흔들기/물결 애니메이션은 앞뒤로 반복
        const createSequence = () =>
          Animated.sequence([
            Animated.timing(animatedValue, {
              ...animationConfig,
              toValue: animationConfig.toValue,
            }),
            Animated.timing(animatedValue, {
              ...animationConfig,
              toValue: -animationConfig.toValue,
            }),
            Animated.timing(animatedValue, {
              ...animationConfig,
              toValue: 0,
            }),
          ]);

        if (loop) {
          Animated.loop(createSequence()).start();
        } else {
          createSequence().start(callback);
        }
      } else if (type === 'pulse' || type === 'glow') {
        // 펄스/글로우는 확대-축소 반복
        const createPulse = () =>
          Animated.sequence([
            Animated.timing(animatedValue, animationConfig),
            Animated.timing(animatedValue, {
              ...animationConfig,
              toValue: 1,
            }),
          ]);

        if (loop) {
          Animated.loop(createPulse()).start();
        } else {
          createPulse().start(callback);
        }
      } else {
        // 일반 애니메이션
        if (loop) {
          Animated.loop(
            Animated.timing(animatedValue, animationConfig)
          ).start();
        } else {
          Animated.timing(animatedValue, animationConfig).start(callback);
        }
      }
    },
    [animatedValue, animationConfig, type, loop]
  );

  /**
   * 애니메이션 정지
   */
  const stopAnimation = useCallback(() => {
    animatedValue.stopAnimation();
  }, [animatedValue]);

  /**
   * 애니메이션 리셋
   */
  const resetAnimation = useCallback(() => {
    animatedValue.stopAnimation();
    animatedValue.setValue(getInitialValue());
  }, [animatedValue]);

  /**
   * 페이드 전용 - 특정 값으로 애니메이션 (useContentAnimation 호환성)
   */
  const animateTo = useCallback(
    (toValue: number, callback?: () => void) => {
      if (type === 'fade') {
        Animated.timing(animatedValue, {
          toValue,
          duration:
            toValue === 0
              ? ANIMATION_DURATIONS.FADE_OUT
              : ANIMATION_DURATIONS.FADE_IN,
          useNativeDriver: true,
        }).start(callback);
      }
    },
    [animatedValue, type]
  );

  return {
    animatedValue,
    startAnimation,
    stopAnimation,
    resetAnimation,
    ...(type === 'fade' && { animateTo }),
  };
}
