import { useEffect } from 'react';

interface UseRevealBackupTimerParams {
  currentSceneExists: boolean;
  hasChoices: boolean;
  showChoices: boolean;
  isAnimating: () => boolean | undefined;
  onForceShowChoices: () => void;
}

/**
 * 텍스트 애니메이션이 멈춘 경우 선택지를 강제로 표시하는 백업 타이머
 * - 메모리 누수 방지를 위해 setTimeout/setInterval을 적절히 정리
 */
export function useRevealBackupTimer({
  currentSceneExists,
  hasChoices,
  showChoices,
  isAnimating,
  onForceShowChoices,
}: UseRevealBackupTimerParams) {
  useEffect(() => {
    if (!(currentSceneExists && hasChoices && !showChoices)) return;

    let checkCount = 0;
    const maxChecks = 6; // 3초 동안 0.5초마다 확인 (총 6번)
    let intervalId: any | null = null;
    let startTimeoutId: any | null = null;

    const tick = () => {
      checkCount++;
      const animating = isAnimating();
      if (animating) {
        if (checkCount >= maxChecks) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
        }
        return;
      }
      if (!showChoices) {
        onForceShowChoices();
      }
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
    };

    // 1초 후부터 확인 시작 (초기 애니메이션 시작 시간 고려)
    startTimeoutId = setTimeout(() => {
      intervalId = setInterval(tick, 500);
    }, 1000);

    return () => {
      if (startTimeoutId) clearTimeout(startTimeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    currentSceneExists,
    hasChoices,
    showChoices,
    isAnimating,
    onForceShowChoices,
  ]);
}
