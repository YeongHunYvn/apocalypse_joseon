import { useCallback, useRef } from 'react';
import { Logger } from '../../../utils/system/Logger';

export interface HeightChangeEvent {
  id: string;
  type: 'content' | 'layout' | 'removal';
  height: number;
  timestamp: number;
  source: string;
}

export interface HeightCoordinatorConfig {
  /** 높이 변화 이벤트 디바운스 시간 (ms) */
  debounceTime?: number;
  /** 연속적인 높이 변화 감지 시간 윈도우 (ms) */
  changeWindow?: number;
  /** 최소 높이 변화 임계값 (px) */
  minChangeThreshold?: number;
  /** 높이 변화 히스토리 보관 시간 (ms) */
  historyRetention?: number;
}

export interface HeightCoordinatorCallbacks {
  /** 안정화된 높이 변화 시 호출 */
  onStableHeightChange?: (height: number, events: HeightChangeEvent[]) => void;
  /** 스크롤 실행 여부 결정 */
  shouldScroll?: (height: number, events: HeightChangeEvent[]) => boolean;
}

const DEFAULT_CONFIG: Required<HeightCoordinatorConfig> = {
  debounceTime: 100,
  changeWindow: 200,
  minChangeThreshold: 5,
  historyRetention: 1000,
};

/**
 * 다양한 높이 변화 이벤트들을 조정하고 통합하는 훅
 * 연쇄적인 높이 변화를 감지하고 안정화된 후에 스크롤을 실행합니다.
 */
export function useHeightCoordinator(
  config: HeightCoordinatorConfig = {},
  callbacks: HeightCoordinatorCallbacks = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { debounceTime, changeWindow, minChangeThreshold, historyRetention } = finalConfig;
  const { onStableHeightChange, shouldScroll } = callbacks;

  const eventsRef = useRef<HeightChangeEvent[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastStableHeight = useRef<number>(0);

  /**
   * 이벤트 히스토리 정리
   */
  const cleanupHistory = useCallback(() => {
    const now = Date.now();
    eventsRef.current = eventsRef.current.filter(
      event => now - event.timestamp < historyRetention
    );
  }, [historyRetention]);

  /**
   * 높이 변화 이벤트 등록
   */
  const registerHeightChange = useCallback((
    type: HeightChangeEvent['type'],
    height: number,
    source: string
  ) => {
    const now = Date.now();
    const event: HeightChangeEvent = {
      id: `${type}-${now}-${Math.random()}`,
      type,
      height,
      timestamp: now,
      source,
    };

    eventsRef.current.push(event);
    cleanupHistory();

    Logger.debug('[useHeightCoordinator]', '높이 변화 등록:', {
      type,
      height,
      source,
      totalEvents: eventsRef.current.length
    });

    // 기존 디바운스 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 새로운 디바운스 타이머 시작
    debounceTimerRef.current = setTimeout(() => {
      processStableHeight();
    }, debounceTime);
  }, [debounceTime, cleanupHistory]);

  /**
   * 안정화된 높이 처리
   */
  const processStableHeight = useCallback(() => {
    const now = Date.now();
    
    // 최근 변화 윈도우 내의 이벤트들만 고려
    const recentEvents = eventsRef.current.filter(
      event => now - event.timestamp < changeWindow
    );

    if (recentEvents.length === 0) return;

    // 최종 높이 결정 (가장 최근 이벤트의 높이)
    const latestEvent = recentEvents[recentEvents.length - 1];
    const finalHeight = latestEvent.height;

    // 최소 변화 임계값 체크
    const heightDifference = Math.abs(finalHeight - lastStableHeight.current);
    if (heightDifference < minChangeThreshold) {
      Logger.debug('[useHeightCoordinator]', '높이 변화 미미하여 무시:', {
        difference: heightDifference,
        threshold: minChangeThreshold
      });
      return;
    }

    lastStableHeight.current = finalHeight;

    Logger.debug('[useHeightCoordinator]', '안정화된 높이 처리:', {
      finalHeight,
      eventCount: recentEvents.length,
      events: recentEvents.map(e => ({ type: e.type, source: e.source, height: e.height }))
    });

    // 스크롤 실행 여부 결정
    const shouldExecuteScroll = shouldScroll?.(finalHeight, recentEvents) ?? true;

    if (shouldExecuteScroll) {
      onStableHeightChange?.(finalHeight, recentEvents);
    } else {
      Logger.debug('[useHeightCoordinator]', '스크롤 실행 생략됨');
    }

    // 처리된 이벤트들 정리
    const processedTimestamp = now - changeWindow;
    eventsRef.current = eventsRef.current.filter(
      event => event.timestamp > processedTimestamp
    );
  }, [
    changeWindow,
    minChangeThreshold,
    shouldScroll,
    onStableHeightChange,
  ]);

  /**
   * 특정 타입의 이벤트가 최근에 발생했는지 확인
   */
  const hasRecentEvent = useCallback((
    type: HeightChangeEvent['type'],
    timeWindow: number = changeWindow
  ) => {
    const now = Date.now();
    return eventsRef.current.some(
      event => event.type === type && now - event.timestamp < timeWindow
    );
  }, [changeWindow]);

  /**
   * 현재 진행 중인 높이 변화가 있는지 확인
   */
  const isHeightChanging = useCallback(() => {
    return debounceTimerRef.current !== null;
  }, []);

  /**
   * 강제로 높이 안정화 처리 실행
   */
  const forceStabilize = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    processStableHeight();
  }, [processStableHeight]);

  return {
    registerHeightChange,
    hasRecentEvent,
    isHeightChanging,
    forceStabilize,
    
    // 디버깅용
    getEventHistory: () => [...eventsRef.current],
    getLastStableHeight: () => lastStableHeight.current,
  };
}