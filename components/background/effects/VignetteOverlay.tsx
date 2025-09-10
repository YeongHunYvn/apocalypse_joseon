import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { VIGNETTE_OVERLAY } from '../../../constants/backgroundEffectConfig';

/**
 * VignetteOverlay 컴포넌트의 Props 인터페이스
 */
export interface VignetteOverlayProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 비네트 색상 (기본: 검은색) */
  color?: string;
  /** 지속시간 (밀리초, undefined면 무한 지속) */
  duration?: number;
  /** 최대 불투명도 (0~1, 기본: 0.7) */
  maxOpacity?: number;
  /** 비네트 강도 (0~1, 기본: 0.8, 높을수록 가장자리가 더 어둠) */
  intensity?: number;
  /** 투명 범위 (0~1, 기본: 0.6, 중앙에서 어느 정도까지 투명할지) */
  fadeRange?: number;
  /** 효과 완료 시 콜백 */
  onComplete?: () => void;
  /** 추가 스타일 */
  style?: ViewStyle;
}

/**
 * 비네트 오버레이 효과 컴포넌트
 * 화면 가장자리를 어둡게 만드는 비네트 효과를 제공합니다.
 */
const VignetteOverlay: React.FC<VignetteOverlayProps> = ({
  children,
  color = VIGNETTE_OVERLAY.defaults.color,
  duration = VIGNETTE_OVERLAY.defaults.duration,
  maxOpacity = VIGNETTE_OVERLAY.defaults.maxOpacity,
  intensity = VIGNETTE_OVERLAY.defaults.intensity,
  fadeRange = VIGNETTE_OVERLAY.defaults.fadeRange,
  onComplete,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // 고정된 fade 지속시간 사용
  const fadeInDuration = VIGNETTE_OVERLAY.defaults.fadeInDuration;
  const fadeOutDuration = VIGNETTE_OVERLAY.defaults.fadeOutDuration;

  // 애니메이션 제어를 위한 ref
  const isUnmounted = useRef(false);
  const fadeOutTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 페이드 인 애니메이션을 시작합니다.
   */
  const startFadeIn = () => {
    if (isUnmounted.current) return;

    Animated.timing(opacityAnim, {
      toValue: maxOpacity,
      duration: fadeInDuration,
      useNativeDriver: false, // SVG는 native driver 미지원
    }).start(({ finished }) => {
      if (finished && !isUnmounted.current) {
        handleFadeInComplete();
      }
    });
  };

  /**
   * 페이드 인 완료 후 처리를 담당합니다.
   */
  const handleFadeInComplete = () => {
    if (isUnmounted.current) return;

    if (duration === undefined || duration === 0) {
      // 무한 지속 모드 - 계속 표시
      return;
    } else {
      // 지정된 지속시간 후 페이드 아웃
      fadeOutTimer.current = setTimeout(() => {
        if (!isUnmounted.current) {
          startFadeOut();
        }
      }, duration);
    }
  };

  /**
   * 페이드 아웃 애니메이션을 시작합니다.
   */
  const startFadeOut = () => {
    if (isUnmounted.current) return;

    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: fadeOutDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !isUnmounted.current) {
        onComplete?.();
      }
    });
  };

  /**
   * 애니메이션을 정리합니다.
   */
  const cleanupAnimation = () => {
    // 타이머 정리
    if (fadeOutTimer.current) {
      clearTimeout(fadeOutTimer.current);
      fadeOutTimer.current = null;
    }

    // 애니메이션 중단
    opacityAnim.stopAnimation();

    // 불투명도 초기화
    opacityAnim.setValue(0);
  };

  useEffect(() => {
    isUnmounted.current = false;

    // 컴포넌트 마운트 시 즉시 페이드 인 시작
    startFadeIn();

    return () => {
      // 컴포넌트 언마운트 시 플래그 설정 및 애니메이션 정리
      isUnmounted.current = true;
      cleanupAnimation();
    };
  }, [color, duration, maxOpacity, intensity, fadeRange]); // 매개변수가 변경되면 애니메이션 재시작

  // 그라데이션 중단점 계산 (fadeRange와 intensity에 따라 조정)
  const centerStop = Math.max(0, fadeRange * (1 - intensity)); // fadeRange가 클수록 투명 영역이 커짐
  const edgeStart = Math.min(1, centerStop + 0.3); // 부드러운 전환을 위한 중간 지점

  return (
    <React.Fragment>
      {children}
      <Animated.View
        style={[
          styles.overlay,
          style,
          {
            opacity: opacityAnim,
          },
        ]}
        pointerEvents='none' // 터치 이벤트 통과
      >
        <Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient
              id='vignette'
              cx='50%'
              cy='50%'
              fx='50%'
              fy='50%'
              rx='70%'
              ry='70%'
            >
              {/* 중앙: 완전 투명 */}
              <Stop
                offset={`${centerStop * 100}%`}
                stopColor={color}
                stopOpacity='0'
              />
              {/* 중간: 점진적 전환 */}
              <Stop
                offset={`${edgeStart * 100}%`}
                stopColor={color}
                stopOpacity='0.3'
              />
              {/* 가장자리: 최대 불투명도 */}
              <Stop offset='100%' stopColor={color} stopOpacity='1' />
            </RadialGradient>
          </Defs>
          <Rect x='0' y='0' width='100%' height='100%' fill='url(#vignette)' />
        </Svg>
      </Animated.View>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000, // 다른 요소들 위에 표시
  },
});

export default VignetteOverlay;
