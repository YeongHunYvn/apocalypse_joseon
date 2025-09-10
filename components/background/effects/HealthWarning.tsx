import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { HEALTH_WARNING_CONFIG } from '../../../constants/gameStateEffectConfig';

/**
 * HealthWarning 컴포넌트의 Props 인터페이스
 */
export interface HealthWarningProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 경고 색상 (기본: 빨간색) */
  color?: string;
  /** 점멸 주기 (밀리초) */
  pulseInterval?: number;
  /** 최대 불투명도 (0~1) */
  maxOpacity?: number;
  /** 최소 불투명도 (0~1) */
  minOpacity?: number;
  /** 테두리 두께 (픽셀) */
  borderWidth?: number;
  /** 효과 완료 시 콜백 */
  onComplete?: () => void;
  /** 추가 스타일 */
  style?: ViewStyle;
}

/**
 * 체력 경고 효과 컴포넌트
 * 체력이 낮을 때 화면 가장자리에 빨간 점멸 효과를 제공합니다.
 */
const HealthWarning: React.FC<HealthWarningProps> = ({
  children,
  color = HEALTH_WARNING_CONFIG.defaults.color,
  pulseInterval = HEALTH_WARNING_CONFIG.defaults.pulseInterval,
  maxOpacity = HEALTH_WARNING_CONFIG.defaults.maxOpacity,
  minOpacity = HEALTH_WARNING_CONFIG.defaults.minOpacity,
  borderWidth = HEALTH_WARNING_CONFIG.defaults.borderWidth,
  onComplete,
  style,
}) => {
  const opacityAnim = useRef(new Animated.Value(minOpacity)).current;
  const isUnmounted = useRef(false);
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  /**
   * 점멸 애니메이션을 시작합니다.
   */
  const startPulseAnimation = () => {
    if (isUnmounted.current) return;

    // 순환 점멸 애니메이션 생성
    const pulse = Animated.loop(
      Animated.sequence([
        // 페이드 인 (어두워짐)
        Animated.timing(opacityAnim, {
          toValue: maxOpacity,
          duration: pulseInterval / 2,
          useNativeDriver: false,
        }),
        // 페이드 아웃 (밝아짐)
        Animated.timing(opacityAnim, {
          toValue: minOpacity,
          duration: pulseInterval / 2,
          useNativeDriver: false,
        }),
      ]),
      { iterations: -1 } // 무한 반복
    );

    pulseLoop.current = pulse;
    pulse.start();
  };

  /**
   * 점멸 애니메이션을 중단합니다.
   */
  const _stopPulseAnimation = () => {
    if (pulseLoop.current) {
      pulseLoop.current.stop();
      pulseLoop.current = null;
    }

    // 부드럽게 페이드 아웃
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: HEALTH_WARNING_CONFIG.defaults.fadeOutDuration,
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
    // 애니메이션 중단
    if (pulseLoop.current) {
      pulseLoop.current.stop();
      pulseLoop.current = null;
    }

    opacityAnim.stopAnimation();
    opacityAnim.setValue(0);
  };

  useEffect(() => {
    isUnmounted.current = false;

    // 컴포넌트 마운트 시 점멸 애니메이션 시작
    startPulseAnimation();

    return () => {
      // 컴포넌트 언마운트 시 플래그 설정 및 애니메이션 정리
      isUnmounted.current = true;
      cleanupAnimation();
    };
  }, [color, pulseInterval, maxOpacity, minOpacity, borderWidth]); // 매개변수가 변경되면 애니메이션 재시작

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
        {/* 상단 테두리 */}
        <View
          style={[
            styles.border,
            styles.topBorder,
            {
              backgroundColor: color,
              height: borderWidth,
            },
          ]}
        />
        {/* 하단 테두리 */}
        <View
          style={[
            styles.border,
            styles.bottomBorder,
            {
              backgroundColor: color,
              height: borderWidth,
            },
          ]}
        />
        {/* 좌측 테두리 */}
        <View
          style={[
            styles.border,
            styles.leftBorder,
            {
              backgroundColor: color,
              width: borderWidth,
            },
          ]}
        />
        {/* 우측 테두리 */}
        <View
          style={[
            styles.border,
            styles.rightBorder,
            {
              backgroundColor: color,
              width: borderWidth,
            },
          ]}
        />
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
  border: {
    position: 'absolute',
  },
  topBorder: {
    top: 0,
    left: 0,
    right: 0,
  },
  bottomBorder: {
    bottom: 0,
    left: 0,
    right: 0,
  },
  leftBorder: {
    top: 0,
    bottom: 0,
    left: 0,
  },
  rightBorder: {
    top: 0,
    bottom: 0,
    right: 0,
  },
});

export default HealthWarning;
