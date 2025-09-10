import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { Logger } from '../../utils/system/Logger';

/**
 * 간단한 햅틱 피드백 훅
 * - selection: 짧은 선택 피드백
 * - impact: 임팩트 강도 지정
 * - notification: 성공/경고/오류 알림 피드백
 */
export function useHaptics() {
  const selection = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      Logger.warn('[useHaptics]', 'selection failed:', error);
    }
  }, []);

  const impact = useCallback(async (style?: Haptics.ImpactFeedbackStyle) => {
    try {
      await Haptics.impactAsync(style ?? Haptics.ImpactFeedbackStyle.Soft);
    } catch (error) {
      Logger.warn('[useHaptics]', 'impact failed:', error);
    }
  }, []);

  const notification = useCallback(
    async (type?: Haptics.NotificationFeedbackType) => {
      try {
        await Haptics.notificationAsync(
          type ?? Haptics.NotificationFeedbackType.Success
        );
      } catch (error) {
        Logger.warn('[useHaptics]', 'notification failed:', error);
        // 폴백: 강한 임팩트
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (fallbackError) {
          Logger.warn('[useHaptics]', 'fallback impact failed:', fallbackError);
        }
      }
    },
    []
  );

  return { selection, impact, notification } as const;
}
