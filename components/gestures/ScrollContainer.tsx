import React, { forwardRef, useImperativeHandle } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import { useAutoScroll } from '../../hooks/ui/gestures/useAutoScroll';

interface ScrollContainerProps extends Omit<ScrollViewProps, 'onScroll' | 'onContentSizeChange'> {
  /** 자동 스크롤 설정 */
  autoScrollConfig?: {
    enabled?: boolean;
    bottomThreshold?: number;
    scrollDelay?: number;
    animated?: boolean;
    enableQuickTouchFix?: boolean;
    newSceneBottomAssumptionTime?: number;
    userScrollThreshold?: number;
    autoScrollDetectionTime?: number;
  };
  /** 자동 스크롤 콜백 */
  autoScrollCallbacks?: {
    onContentHeightChange?: (height: number) => void;
    onScrollPositionChange?: (isAtBottom: boolean) => void;
  };
  /** 성능 최적화 설정 */
  performanceConfig?: {
    removeClippedSubviews?: boolean;
    decelerationRate?: 'normal' | 'fast' | number;
    overScrollMode?: 'auto' | 'always' | 'never';
    showsVerticalScrollIndicator?: boolean;
    nestedScrollEnabled?: boolean;
  };
}

export interface ScrollContainerRef {
  scrollToEnd: (options?: { animated?: boolean }) => void;
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
  notifyNewSceneStart: () => void;
  forceScrollToBottom: () => void;
  resetScrollState: () => void;
  getScrollState: () => any;
}

/**
 * 빠른 반복 터치 문제를 해결한 최종 개선된 스크롤 컨테이너
 * 향상된 자동 스크롤 로직과 사용자 스크롤 감지 기능을 제공합니다.
 */
const ScrollContainer = forwardRef<ScrollContainerRef, ScrollContainerProps>(
  ({ autoScrollConfig = {}, autoScrollCallbacks = {}, performanceConfig = {}, children, ...scrollViewProps }, ref) => {
    const scrollViewRef = React.useRef<ScrollView>(null);

    // 개선된 자동 스크롤 훅 사용
    const {
      handleScroll,
      handleContentSizeChange,
      notifyNewSceneStart,
      forceScrollToBottom,
      resetScrollState,
      getScrollState,
      cleanup,
    } = useAutoScroll(scrollViewRef as React.RefObject<ScrollView>, autoScrollConfig, autoScrollCallbacks);

    // ref를 통한 외부 제어 인터페이스
    useImperativeHandle(ref, () => ({
      scrollToEnd: (options = { animated: true }) => {
        scrollViewRef.current?.scrollToEnd(options);
      },
      scrollTo: (options) => {
        scrollViewRef.current?.scrollTo(options);
      },
      notifyNewSceneStart,
      forceScrollToBottom,
      resetScrollState,
      getScrollState,
    }));

    // 컴포넌트 언마운트 시 정리
    React.useEffect(() => {
      return cleanup;
    }, [cleanup]);

    // 기본 성능 설정
    const defaultPerformanceConfig = {
      removeClippedSubviews: true,
      decelerationRate: 'normal' as const,
      overScrollMode: 'never' as const,
      showsVerticalScrollIndicator: false,
      nestedScrollEnabled: true,
      ...performanceConfig,
    };

    return (
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16} // 60fps로 스크롤 이벤트 수신
        {...defaultPerformanceConfig}
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    );
  }
);

ScrollContainer.displayName = 'ScrollContainer';

export default ScrollContainer;