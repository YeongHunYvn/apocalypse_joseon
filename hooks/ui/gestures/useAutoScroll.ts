import { useCallback, useRef } from 'react';
import { InteractionManager, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { Logger } from '../../../utils/system/Logger';

export interface AutoScrollConfig {
  /** 자동 스크롤 활성화 여부 */
  enabled?: boolean;
  /** 하단 스크롤 감지 여유 거리 (px) */
  bottomThreshold?: number;
  /** 스크롤 지연 시간 (ms) */
  scrollDelay?: number;
  /** 스크롤 애니메이션 사용 여부 */
  animated?: boolean;
  /** 빠른 터치 보정 활성화 */
  enableQuickTouchFix?: boolean;
  /** 새 씬 시작 시 하단 가정 시간 (ms) */
  newSceneBottomAssumptionTime?: number;
  /** 사용자 스크롤 감지 임계값 (px) - 이보다 많이 스크롤해야 사용자 스크롤로 인식 */
  userScrollThreshold?: number;
  /** 자동 스크롤 감지 시간 (ms) - 이 시간 내 스크롤은 자동 스크롤로 간주 */
  autoScrollDetectionTime?: number;
}

export interface AutoScrollCallbacks {
  /** 컨텐츠 높이 변경 시 호출 */
  onContentHeightChange?: (height: number) => void;
  /** 스크롤 위치 변경 시 호출 */
  onScrollPositionChange?: (isAtBottom: boolean) => void;
}

const DEFAULT_CONFIG: Required<AutoScrollConfig> = {
  enabled: true,
  bottomThreshold: 10,
  scrollDelay: 50,
  animated: true,
  enableQuickTouchFix: true,
  newSceneBottomAssumptionTime: 500,
  userScrollThreshold: 50, // 50px 이상 스크롤해야 사용자 스크롤로 인식
  autoScrollDetectionTime: 300, // 300ms 내 스크롤은 자동 스크롤로 간주
};

/**
 * 빠른 터치 문제를 해결한 개선된 자동 스크롤 훅
 * isAtBottom 상태 관리와 컨텐츠 높이 변화 감지를 개선했습니다.
 */
export function useAutoScroll(
  scrollViewRef: React.RefObject<ScrollView>,
  config: AutoScrollConfig = {},
  callbacks: AutoScrollCallbacks = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { 
    enabled, 
    bottomThreshold, 
    scrollDelay, 
    animated,
    enableQuickTouchFix,
    newSceneBottomAssumptionTime,
    userScrollThreshold,
    autoScrollDetectionTime
  } = finalConfig;
  const { onContentHeightChange, onScrollPositionChange } = callbacks;

  // 스크롤 상태 관리
  const isAtBottom = useRef(true);
  const lastContentHeight = useRef(0);
  const pendingScrollRef = useRef<NodeJS.Timeout | null>(null);
  const lastSceneChangeTime = useRef<number>(Date.now());
  const hasUserScrolled = useRef(false);
  
  // 자동 스크롤 추적
  const autoScrollState = useRef({
    lastAutoScrollTime: 0,
    lastScrollY: 0,
    isAutoScrolling: false,
  });

  /**
   * 새 씬 시작 알림 (외부에서 호출)
   */
  const notifyNewSceneStart = useCallback(() => {
    lastSceneChangeTime.current = Date.now();
    hasUserScrolled.current = false;
    isAtBottom.current = true;
    autoScrollState.current.isAutoScrolling = false;
    // 새 씬 시작 시 상태 초기화
  }, []);

  /**
   * 대기 중인 스크롤 타이머 정리
   */
  const clearPendingScroll = useCallback(() => {
    if (pendingScrollRef.current) {
      clearTimeout(pendingScrollRef.current);
      pendingScrollRef.current = null;
    }
  }, []);

  /**
   * 지능형 하단 위치 판정
   * 빠른 터치 시나리오를 고려하여 더 관대한 판정을 수행합니다.
   */
  const isEffectivelyAtBottom = useCallback(() => {
    const now = Date.now();
    const timeSinceSceneChange = now - lastSceneChangeTime.current;
    const timeSinceAutoScroll = now - autoScrollState.current.lastAutoScrollTime;
    
    // 빠른 터치 보정이 비활성화된 경우 기본 로직 사용
    if (!enableQuickTouchFix) {
      return isAtBottom.current;
    }
    
    // 자동 스크롤 중이거나 방금 완료된 경우
    if (autoScrollState.current.isAutoScrolling || timeSinceAutoScroll < autoScrollDetectionTime) {
      // 자동 스크롤 중
      return true;
    }
    
    // 새 씬 시작 후 일정 시간 내에는 하단에 있다고 가정
    if (timeSinceSceneChange < newSceneBottomAssumptionTime && !hasUserScrolled.current) {
      // 새 씬 시간대 하단 가정
      return true;
    }
    
    // 일반적인 경우 실제 스크롤 위치 사용
    return isAtBottom.current;
  }, [enableQuickTouchFix, newSceneBottomAssumptionTime, autoScrollDetectionTime]);

  /**
   * 하단으로 스크롤
   */
  const scrollToBottom = useCallback(() => {
    if (!enabled || !scrollViewRef.current) return;

    clearPendingScroll();
    autoScrollState.current.isAutoScrolling = true;
    autoScrollState.current.lastAutoScrollTime = Date.now();
    
    pendingScrollRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (scrollViewRef.current) {
          // 하단 스크롤 실행
          scrollViewRef.current.scrollToEnd({ animated });
          
          // 스크롤 실행 후 하단 상태 업데이트
          isAtBottom.current = true;
          
          // 자동 스크롤 완료 처리 (애니메이션 시간 고려)
          setTimeout(() => {
            autoScrollState.current.isAutoScrolling = false;
          }, animated ? 300 : 100);
        }
      });
    }, scrollDelay);
  }, [enabled, scrollViewRef, animated, scrollDelay, clearPendingScroll]);

  /**
   * 스크롤 위치 변경 처리
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!enabled) return;

      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const currentScrollY = contentOffset.y;
      const scrollDelta = Math.abs(currentScrollY - autoScrollState.current.lastScrollY);
      const timeSinceAutoScroll = Date.now() - autoScrollState.current.lastAutoScrollTime;

      // 현재 스크롤이 맨 아래에 있는지 확인
      const isCurrentlyAtBottom =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - bottomThreshold;
      
      const wasAtBottom = isAtBottom.current;
      isAtBottom.current = isCurrentlyAtBottom;

      // 사용자 스크롤 감지 로직 개선
      // 자동 스크롤 감지 시간 외부이고, 임계값 이상 스크롤한 경우만 사용자 스크롤로 인식
      if (timeSinceAutoScroll > autoScrollDetectionTime && 
          scrollDelta > userScrollThreshold &&
          !autoScrollState.current.isAutoScrolling) {
        hasUserScrolled.current = true;
        // 사용자 스크롤 감지됨
      }

      autoScrollState.current.lastScrollY = currentScrollY;

      // 하단 위치 변경 시 콜백 호출
      if (wasAtBottom !== isCurrentlyAtBottom) {
        onScrollPositionChange?.(isCurrentlyAtBottom);
        // 스크롤 위치 변경됨
      }
    },
    [enabled, bottomThreshold, onScrollPositionChange, userScrollThreshold, autoScrollDetectionTime]
  );

  /**
   * 컨텐츠 크기 변경 처리 (개선된 버전)
   */
  const handleContentSizeChange = useCallback(
    (_contentWidth: number, contentHeight: number) => {
      if (!enabled) return;

      // 컨텐츠 크기 변경 감지

      // 콜백 호출
      onContentHeightChange?.(contentHeight);

      // 이전 스크롤 타이머 취소
      clearPendingScroll();

      // 컨텐츠가 증가했고, 효과적으로 하단에 있는 경우 자동 스크롤
      if (
        enabled &&
        isEffectivelyAtBottom() && // 🔧 개선된 하단 위치 판정 사용
        contentHeight > lastContentHeight.current &&
        scrollViewRef.current
      ) {
        // 자동 하단 스크롤 실행
        scrollToBottom();
      }
      // 높이가 감소한 경우의 처리는 기존과 동일하게 유지
      else if (contentHeight < lastContentHeight.current) {
        // 높이 감소 감지
      }
      else {
        // 자동 스크롤 조건 미충족
      }

      lastContentHeight.current = contentHeight;
    },
    [
      enabled,
      isEffectivelyAtBottom,
      clearPendingScroll,
      scrollToBottom,
      scrollViewRef,
      onContentHeightChange
    ]
  );

  /**
   * 강제로 하단 스크롤 (터치 완료 시 호출 가능)
   */
  const forceScrollToBottom = useCallback(() => {
    Logger.debug('[useAutoScroll]', '강제 하단 스크롤 실행');
    scrollToBottom();
  }, [scrollToBottom]);

  /**
   * 스크롤 상태 재설정 (디버깅용)
   */
  const resetScrollState = useCallback(() => {
    isAtBottom.current = true;
    hasUserScrolled.current = false;
    lastSceneChangeTime.current = Date.now();
    clearPendingScroll();
    Logger.debug('[useAutoScroll]', '스크롤 상태 재설정');
  }, [clearPendingScroll]);

  return {
    // 핸들러들
    handleScroll,
    handleContentSizeChange,
    
    // 제어 함수들
    notifyNewSceneStart,
    forceScrollToBottom,
    resetScrollState,
    
    // 상태 조회
    getScrollState: () => ({
      isAtBottom: isAtBottom.current,
      isEffectivelyAtBottom: isEffectivelyAtBottom(),
      hasUserScrolled: hasUserScrolled.current,
      lastContentHeight: lastContentHeight.current,
      timeSinceSceneChange: Date.now() - lastSceneChangeTime.current,
    }),
    
    // 정리
    cleanup: clearPendingScroll,
  };
}