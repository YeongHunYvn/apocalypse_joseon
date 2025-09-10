import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import { Logger } from '../../utils/system/Logger';

interface UseLongPressVibrationConfig {
  /** 시작 진동 간격 (밀리초) */
  initialInterval?: number;
  /** 최소 진동 간격 (밀리초) - 너무 빨라지지 않게 제한 */
  minInterval?: number;
  /** 가속도 비율 (0.9면 매번 90%로 줄어듦, 1.0이면 일정) */
  accelerationFactor?: number;
  /** 진동 강도 */
  impactStyle?: Haptics.ImpactFeedbackStyle;
  /** 성공 진동 타입 */
  successFeedbackType?: Haptics.NotificationFeedbackType;
}

/**
 * 길게 누르기 시 점점 빨라지는 진동을 제공하는 훅
 * 진행률 애니메이션이 진행되는 동안만 진동이 울리며, 시간이 지날수록 간격이 줄어듭니다.
 */
export function useLongPressVibration({
  initialInterval, // 최초 간격
  minInterval, // 최소 간격
  accelerationFactor, // 매번 해당 값 %로 줄어듦 (점점 빨라짐)
  impactStyle, // 진동 스타일
  successFeedbackType = Haptics.NotificationFeedbackType.Success, // 성공 진동 타입
}: UseLongPressVibrationConfig = {}) {
  const vibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isVibratingRef = useRef(false);
  const currentIntervalRef = useRef(initialInterval);

  /**
   * 재귀적으로 진동을 실행하는 내부 함수
   * 매번 간격을 줄여서 점점 빨라지게 만듭니다.
   */
  const scheduleNextVibration = useCallback(async () => {
    if (!isVibratingRef.current) return;

    try {
      await Haptics.impactAsync(impactStyle);
    } catch (error) {
      Logger.warn('[useLongPressVibration]', 'Haptic feedback failed:', error);
    }

    // 다음 진동 간격 계산 (가속도 적용하되 최소값 제한)
    currentIntervalRef.current = Math.max(
      (currentIntervalRef.current ?? 0) * (accelerationFactor ?? 0),
      minInterval ?? 0
    );

    // 다음 진동 예약
    if (isVibratingRef.current) {
      vibrationTimeoutRef.current = setTimeout(() => {
        scheduleNextVibration();
      }, currentIntervalRef.current);
    }
  }, [impactStyle, accelerationFactor, minInterval]);

  /**
   * 진동을 시작하는 함수
   * 이미 진동 중이면 무시됩니다.
   */
  const startVibration = useCallback(async () => {
    if (isVibratingRef.current) return;

    isVibratingRef.current = true;
    currentIntervalRef.current = initialInterval; // 간격 초기화

    // 즉시 첫 번째 진동
    try {
      await Haptics.impactAsync(impactStyle);
    } catch (error) {
      Logger.warn(
        '[useLongPressVibration]',
        'Initial haptic feedback failed:',
        error
      );
    }

    // 다음 진동들을 점점 빨라지게 예약
    if (isVibratingRef.current) {
      vibrationTimeoutRef.current = setTimeout(() => {
        scheduleNextVibration();
      }, currentIntervalRef.current);
    }
  }, [impactStyle, initialInterval, scheduleNextVibration]);

  /**
   * 진동을 중단하는 함수
   * 진동이 진행 중이 아니면 무시됩니다.
   */
  const stopVibration = useCallback(() => {
    if (!isVibratingRef.current) return;

    isVibratingRef.current = false;

    if (vibrationTimeoutRef.current) {
      clearTimeout(vibrationTimeoutRef.current);
      vibrationTimeoutRef.current = null;
    }

    // 간격 초기화 (다음 사용을 위해)
    currentIntervalRef.current = initialInterval;
  }, [initialInterval]);

  /**
   * 성공 시 강한 진동을 한 번 실행하는 함수
   * 길게 누르기 완료 시 사용됩니다.
   */
  const triggerSuccessVibration = useCallback(async () => {
    try {
      await Haptics.notificationAsync(successFeedbackType);
    } catch (error) {
      Logger.warn(
        '[useLongPressVibration]',
        'Success haptic feedback failed:',
        error
      );
      // 실패 시 강한 임팩트 진동으로 대체
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (fallbackError) {
        Logger.warn(
          '[useLongPressVibration]',
          'Fallback haptic feedback also failed:',
          fallbackError
        );
      }
    }
  }, [successFeedbackType]);

  /**
   * 현재 진동 상태를 반환하는 함수
   */
  const isVibrating = useCallback(() => {
    return isVibratingRef.current;
  }, []);

  /**
   * 현재 진동 간격을 반환하는 함수 (디버그용)
   */
  const getCurrentInterval = useCallback(() => {
    return currentIntervalRef.current;
  }, []);

  /**
   * 컴포넌트 언마운트 시 진동을 정리하는 함수
   */
  const cleanup = useCallback(() => {
    stopVibration();
  }, [stopVibration]);

  return {
    startVibration,
    stopVibration,
    triggerSuccessVibration,
    isVibrating,
    getCurrentInterval,
    cleanup,
  };
}
