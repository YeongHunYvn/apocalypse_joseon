import { useCallback, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useLongPressVibration } from '../useLongPressVibration';
import * as Haptics from 'expo-haptics';

export interface LongPressConfig {
  /** 진행률 애니메이션 지속 시간 (ms) */
  progressDuration?: number;
  /** 진동 설정 */
  vibrationConfig?: {
    initialInterval?: number;
    minInterval?: number;
    accelerationFactor?: number;
    impactStyle?: Haptics.ImpactFeedbackStyle;
  };
  /** 활성화 여부 */
  enabled?: boolean;
}

export interface LongPressCallbacks {
  onComplete?: () => void;
  onCancel?: () => void;
}

export interface LongPressState {
  isActive: boolean;
  progress: number;
  isReady: boolean;
  progressAnimation: Animated.Value;
}

const DEFAULT_CONFIG = {
  progressDuration: 800,
  enabled: true,
} as const;

/**
 * 길게누르기 상태와 진행률 애니메이션을 관리하는 훅
 * 진동 피드백과 시각적 진행률 표시를 제공합니다.
 */
export function useLongPress(
  config: LongPressConfig = {},
  callbacks: LongPressCallbacks = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { progressDuration, vibrationConfig, enabled } = finalConfig;
  const { onComplete, onCancel } = callbacks;

  // 상태 관리
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  // 애니메이션
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const progressTimer = useRef<NodeJS.Timeout | null>(null);

  // 진동 훅
  const { startVibration, stopVibration, triggerSuccessVibration, cleanup } =
    useLongPressVibration({
      initialInterval: 150,
      minInterval: 150,
      accelerationFactor: 0.95,
      impactStyle: Haptics.ImpactFeedbackStyle.Soft,
      ...vibrationConfig,
    });

  /**
   * 진행률 타이머 정리
   */
  const clearProgressTimer = useCallback(() => {
    if (progressTimer.current) {
      clearTimeout(progressTimer.current);
      progressTimer.current = null;
    }
  }, []);

  /**
   * 길게누르기 시작
   */
  const start = useCallback(() => {
    if (!enabled || isActive) return;

    setIsActive(true);
    setProgress(0);
    setIsReady(false);
    startVibration();

    // 진행률 애니메이션 시작
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: progressDuration,
      useNativeDriver: false,
    }).start(() => {
      // 애니메이션 완료 시
      setIsReady(true);
      triggerSuccessVibration();
    });

    // 진행률 업데이트 타이머
    progressTimer.current = setTimeout(() => {
      setIsReady(true);
    }, progressDuration);

    // 진행률 값을 실시간으로 업데이트
    const listener = progressAnimation.addListener(({ value }) => {
      setProgress(value);
    });

    // 리스너 정리를 위해 저장
    (progressAnimation as any).__listenerRef = listener;
  }, [
    enabled,
    isActive,
    startVibration,
    progressAnimation,
    progressDuration,
    triggerSuccessVibration,
  ]);

  /**
   * 길게누르기 취소
   */
  const cancel = useCallback(() => {
    if (!isActive) return;

    setIsActive(false);
    setProgress(0);
    setIsReady(false);
    stopVibration();
    clearProgressTimer();

    // 애니메이션 중단 및 초기화
    progressAnimation.stopAnimation();
    progressAnimation.setValue(0);

    // 리스너 정리
    if ((progressAnimation as any).__listenerRef) {
      progressAnimation.removeListener((progressAnimation as any).__listenerRef);
      (progressAnimation as any).__listenerRef = null;
    }

    onCancel?.();
  }, [
    isActive,
    stopVibration,
    clearProgressTimer,
    progressAnimation,
    onCancel,
  ]);

  /**
   * 길게누르기 완료 처리
   */
  const complete = useCallback(() => {
    if (!isActive || !isReady) return;

    const wasReady = isReady;
    cancel(); // 상태 정리
    
    if (wasReady) {
      onComplete?.();
    }
  }, [isActive, isReady, cancel, onComplete]);

  /**
   * 길게누르기 상태 반환
   */
  const getLongPressState = useCallback((): LongPressState => ({
    isActive,
    progress,
    isReady,
    progressAnimation,
  }), [isActive, progress, isReady, progressAnimation]);

  return {
    start,
    cancel,
    complete,
    getLongPressState,
    cleanup,
    // 개별 상태값들도 직접 노출
    isActive,
    progress,
    isReady,
    progressAnimation,
  };
}