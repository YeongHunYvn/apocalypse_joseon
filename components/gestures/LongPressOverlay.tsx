import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { FONT_STYLES } from '../../constants/theme';

export interface LongPressOverlayProps {
  /** 길게누르기 진행 중 여부 */
  isActive: boolean;
  /** 진행률 (0~1) */
  progress?: number;
  /** 완료 준비 상태 여부 */
  isReady: boolean;
  /** 진행률 애니메이션 값 */
  progressAnimation?: Animated.Value;
  /** 커스텀 메시지 */
  messages?: {
    preparing?: string;
    ready?: string;
  };
  /** 커스텀 스타일 */
  overlayStyle?: any;
  /** 진행률 바 색상 */
  progressColor?: string;
}

const DEFAULT_MESSAGES = {
  preparing: '다른 페이지로 이동 준비 중...',
  ready: '손을 떼면 이동합니다',
};

/**
 * 길게누르기 진행률을 시각적으로 표시하는 오버레이 컴포넌트
 * 순수한 UI 표시만 담당하며 로직은 포함하지 않습니다.
 */
export default function LongPressOverlay({
  isActive,
  progress = 0,
  isReady,
  progressAnimation,
  messages = DEFAULT_MESSAGES,
  overlayStyle,
  progressColor = '#4CAF50',
}: LongPressOverlayProps) {
  
  // 활성화되지 않았으면 렌더링하지 않음
  if (!isActive) {
    return null;
  }

  const finalMessages = { ...DEFAULT_MESSAGES, ...messages };

  return (
    <View style={[styles.progressOverlay, overlayStyle]}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: progressColor,
                width: progressAnimation 
                  ? progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    })
                  : `${progress * 100}%`,
              },
            ]}
          />
        </View>
        
        <Animated.Text
          style={[
            styles.progressText,
            {
              opacity: progressAnimation
                ? progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  })
                : 0.7 + (progress * 0.3),
            },
          ]}
        >
          {isReady ? finalMessages.ready : finalMessages.preparing}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  progressContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    minWidth: 200,
  },
  progressBackground: {
    width: 200,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    ...FONT_STYLES.semiBold,
  },
});