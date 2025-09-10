import { useCallback, useState } from 'react';
import { Logger } from '../../utils/system/Logger';
import {
  TransitionErrorInfo,
  TransitionState,
  createTransitionError,
  executeErrorRecovery,
  isTransitioning as isTransitioningState,
  isValidTransition,
  logTransition,
} from './transition';

import { UseSceneTransitionReturn } from '../../types';
import { useStoryCore } from './core/useStoryCore';
import { useStoryLogic } from './useStoryLogic';

/**
 * 씬 전환 애니메이션 및 상태 관리를 담당하는 Hook입니다.
 * 선택지 처리와 애니메이션을 통합하여 부드러운 전환을 제공합니다.
 * 이제 useStoryCore를 통해 상태를 관리합니다.
 * @returns 전환 관련 상태 및 함수들
 */
export function useSceneTransition(): UseSceneTransitionReturn {

  // 비즈니스 로직
  const { handleChoice } = useStoryLogic();

  // 로컬 상태 머신 관리
  const [transitionState, setTransitionState] =
    useState<TransitionState>('idle');
  const [lastError, setLastError] = useState<TransitionErrorInfo | null>(null);

  /**
   * 상태 전환 함수 (로깅 포함)
   */
  const changeState = useCallback(
    (newState: TransitionState, context?: string) => {
      setTransitionState(prevState => {
        if (isValidTransition(prevState, newState)) {
          logTransition(prevState, newState, context);


          return newState;
        } else {
          Logger.warn(
            '[useSceneTransition]',
            `⚠️ 잘못된 상태 전환 시도: ${prevState} → ${newState}`
          );
          return prevState;
        }
      });
    },
    []
  );

  /**
   * 에러 처리 함수
   */
  const handleError = useCallback(
    async (error: Error, context: string) => {
      const errorInfo = createTransitionError(
        'unknown_error', // TransitionError 타입
        error.message || context,
        transitionState,
        error
      );
      setLastError(errorInfo);

      // 에러 복구 시도
      await executeErrorRecovery(errorInfo, {
        showUserAlert: true,
        recoveryDelay: 1000, // TRANSITION_PHASES.ERROR_RECOVERY_DELAY,
      });

      // 복구 후 idle 상태로
      changeState('idle', 'error recovery');
    },
    [transitionState, changeState]
  );

  /**
   * 선택지 클릭 시 전환 처리
   */
  const handleChoicePress = useCallback(
    async (choiceIndex: number): Promise<void> => {
      // 전환 불가능한 상태 체크
      if (isTransitioningState(transitionState)) {
        Logger.debug(
          '[useSceneTransition]',
          `🚫 전환 중이므로 선택 불가: state=${transitionState}`
        );
        return;
      }

      try {
        // 1. 선택지 처리 (페이드 애니메이션 제거)
        changeState('processing');
        await handleChoice(choiceIndex);

        // 2. React 렌더링 완료 대기 (깜빡임 방지)
        await new Promise(resolve => {
          // 2 프레임 대기: 컴포넌트 언마운트/마운트 완료 보장
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        });

        // 3. 완료
        changeState('idle', 'transition completed');
        setLastError(null);
      } catch (error) {
        await handleError(error as Error, `choice ${choiceIndex} failed`);
      }
    },
    [transitionState, handleChoice, changeState, handleError]
  );

  /**
   * 전환 상태 강제 리셋
   */
  const resetTransition = useCallback(() => {
    changeState('idle', 'manual reset');
    setLastError(null);
  }, [changeState]);

  /**
   * 현재 전환 정보 조회
   */
  const getTransitionInfo = useCallback(() => {
    return {
      state: transitionState,
      isTransitioning: isTransitioningState(transitionState),
      lastError,
    };
  }, [transitionState, lastError]);

  return {
    // 상태
    isTransitioning: isTransitioningState(transitionState), // 로컬 상태 머신 기준
    transitionState,
    lastError,

    // 액션
    handleChoicePress,
    resetTransition,
    getTransitionInfo,
  };
}
