import { useCallback, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { Logger } from '../../../utils/system/Logger';

export interface ScrollTimingConfig {
  /** 기본 스크롤 지연 시간 (ms) */
  baseDelay?: number;
  /** 텍스트 완료 감지 후 추가 지연 시간 (ms) */
  textCompleteDelay?: number;
  /** 선택지 표시 감지 후 추가 지연 시간 (ms) */
  choiceDisplayDelay?: number;
  /** 최대 대기 시간 (ms) */
  maxWaitTime?: number;
}

export interface ScrollTimingState {
  isTextCompleting: boolean;
  isChoiceDisplaying: boolean;
  lastTextCompleteTime: number | null;
  lastChoiceDisplayTime: number | null;
}

const DEFAULT_CONFIG: Required<ScrollTimingConfig> = {
  baseDelay: 50,
  textCompleteDelay: 30,
  choiceDisplayDelay: 100,
  maxWaitTime: 200,
};

/**
 * 스크롤 타이밍을 동적으로 조정하는 훅
 * 텍스트 완료와 선택지 표시를 고려하여 적절한 스크롤 타이밍을 계산합니다.
 */
export function useScrollTiming(config: ScrollTimingConfig = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { baseDelay, textCompleteDelay, choiceDisplayDelay, maxWaitTime } = finalConfig;

  const stateRef = useRef<ScrollTimingState>({
    isTextCompleting: false,
    isChoiceDisplaying: false,
    lastTextCompleteTime: null,
    lastChoiceDisplayTime: null,
  });

  /**
   * 텍스트 완료 시작을 알림
   */
  const notifyTextCompleteStart = useCallback(() => {
    stateRef.current.isTextCompleting = true;
    stateRef.current.lastTextCompleteTime = Date.now();
    Logger.debug('[useScrollTiming]', '텍스트 완료 시작');
  }, []);

  /**
   * 텍스트 완료 종료를 알림
   */
  const notifyTextCompleteEnd = useCallback(() => {
    stateRef.current.isTextCompleting = false;
    Logger.debug('[useScrollTiming]', '텍스트 완료 종료');
  }, []);

  /**
   * 선택지 표시 시작을 알림
   */
  const notifyChoiceDisplayStart = useCallback(() => {
    stateRef.current.isChoiceDisplaying = true;
    stateRef.current.lastChoiceDisplayTime = Date.now();
    Logger.debug('[useScrollTiming]', '선택지 표시 시작');
  }, []);

  /**
   * 선택지 표시 종료를 알림
   */
  const notifyChoiceDisplayEnd = useCallback(() => {
    stateRef.current.isChoiceDisplaying = false;
    Logger.debug('[useScrollTiming]', '선택지 표시 종료');
  }, []);

  /**
   * 현재 상태에 따른 최적 스크롤 지연 시간 계산
   */
  const calculateOptimalDelay = useCallback(() => {
    const now = Date.now();
    const state = stateRef.current;
    
    let delay = baseDelay;
    
    // 텍스트 완료 중이거나 최근에 완료된 경우
    if (state.isTextCompleting || 
        (state.lastTextCompleteTime && now - state.lastTextCompleteTime < textCompleteDelay)) {
      delay += textCompleteDelay;
      Logger.debug('[useScrollTiming]', '텍스트 완료로 인한 지연 추가:', textCompleteDelay);
    }
    
    // 선택지 표시 중이거나 최근에 표시된 경우
    if (state.isChoiceDisplaying || 
        (state.lastChoiceDisplayTime && now - state.lastChoiceDisplayTime < choiceDisplayDelay)) {
      delay += choiceDisplayDelay;
      Logger.debug('[useScrollTiming]', '선택지 표시로 인한 지연 추가:', choiceDisplayDelay);
    }
    
    // 최대 대기 시간 제한
    delay = Math.min(delay, maxWaitTime);
    
    Logger.debug('[useScrollTiming]', '최종 스크롤 지연 시간:', delay);
    return delay;
  }, [baseDelay, textCompleteDelay, choiceDisplayDelay, maxWaitTime]);

  /**
   * 적응형 스크롤 실행
   */
  const executeAdaptiveScroll = useCallback((
    scrollFn: () => void,
    fallbackDelay?: number
  ) => {
    const optimalDelay = calculateOptimalDelay();
    const finalDelay = fallbackDelay ?? optimalDelay;
    
    setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        scrollFn();
      });
    }, finalDelay);
    
    Logger.debug('[useScrollTiming]', '적응형 스크롤 예약:', finalDelay + 'ms');
  }, [calculateOptimalDelay]);

  return {
    // 상태 알림 함수들
    notifyTextCompleteStart,
    notifyTextCompleteEnd,
    notifyChoiceDisplayStart,
    notifyChoiceDisplayEnd,
    
    // 스크롤 실행 함수
    executeAdaptiveScroll,
    calculateOptimalDelay,
    
    // 현재 상태 조회
    getTimingState: () => ({ ...stateRef.current }),
  };
}