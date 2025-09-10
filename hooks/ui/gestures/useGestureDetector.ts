import { useCallback, useRef } from 'react';
import { Logger } from '../../../utils/system/Logger';

export interface GesturePosition {
  x: number;
  y: number;
}

export interface GestureEvent {
  type: 'tap' | 'dragStart' | 'dragEnd' | 'longPressStart' | 'longPressCancel';
  position: GesturePosition;
  timestamp: number;
}

export interface GestureConfig {
  /** 드래그로 판정할 최소 거리 (px) */
  dragThreshold?: number;
  /** 길게누르기 시작까지 대기 시간 (ms) */
  longPressDelay?: number;
  /** 제스처 감지 활성화 여부 */
  enabled?: boolean;
}

export interface GestureCallbacks {
  onTap?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onLongPressStart?: () => void;
  onLongPressCancel?: () => void;
}

export interface GestureState {
  isDragging: boolean;
  isLongPressing: boolean;
  touchStartPosition: GesturePosition | null;
}

const DEFAULT_CONFIG: Required<GestureConfig> = {
  dragThreshold: 10,
  longPressDelay: 700,
  enabled: true,
};

/**
 * 순수한 터치 제스처 감지를 담당하는 훅
 * 터치/드래그/길게누르기를 구분하여 콜백을 호출합니다.
 */
export function useGestureDetector(
  config: GestureConfig = {},
  callbacks: GestureCallbacks = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { dragThreshold, longPressDelay, enabled } = finalConfig;
  const { onTap, onDragStart, onDragEnd, onLongPressStart, onLongPressCancel } = callbacks;

  // 제스처 상태 관리
  const touchStartPos = useRef<GesturePosition | null>(null);
  const isDragging = useRef(false);
  const isLongPressing = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * 안전한 콜백 실행
   */
  const safeCallback = useCallback((callback?: () => void, eventType?: string) => {
    if (!enabled) return;
    
    try {
      callback?.();
    } catch (error) {
      Logger.warn('[useGestureDetector]', `${eventType} callback failed:`, error);
    }
  }, [enabled]);

  /**
   * 길게누르기 타이머 정리
   */
  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  /**
   * 제스처 상태 초기화
   */
  const resetGestureState = useCallback(() => {
    touchStartPos.current = null;
    isDragging.current = false;
    isLongPressing.current = false;
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  /**
   * 터치 시작 처리
   */
  const handleTouchStart = useCallback(
    (event: any) => {
      if (!enabled) return;

      const touch = event.nativeEvent.touches[0];
      if (!touch) return;

      const position: GesturePosition = { x: touch.pageX, y: touch.pageY };
      touchStartPos.current = position;
      isDragging.current = false;
      isLongPressing.current = false;

      // 길게누르기 타이머 시작
      longPressTimer.current = setTimeout(() => {
        // 드래그 중이 아닐 때만 길게누르기 시작
        if (!isDragging.current && touchStartPos.current) {
          isLongPressing.current = true;
          safeCallback(onLongPressStart, 'longPressStart');
        }
      }, longPressDelay);

      Logger.debug('[useGestureDetector]', '터치 시작:', position);
    },
    [enabled, longPressDelay, onLongPressStart, safeCallback]
  );

  /**
   * 터치 이동 처리
   */
  const handleTouchMove = useCallback(
    (event: any) => {
      if (!enabled || !touchStartPos.current) return;

      const touch = event.nativeEvent.touches[0];
      if (!touch) return;

      const currentPos: GesturePosition = { x: touch.pageX, y: touch.pageY };
      const deltaX = Math.abs(currentPos.x - touchStartPos.current.x);
      const deltaY = Math.abs(currentPos.y - touchStartPos.current.y);

      // 드래그 임계값 초과 시 드래그로 판정
      if (!isDragging.current && (deltaX > dragThreshold || deltaY > dragThreshold)) {
        isDragging.current = true;
        
        // 길게누르기 취소
        if (isLongPressing.current) {
          isLongPressing.current = false;
          safeCallback(onLongPressCancel, 'longPressCancel');
        }
        clearLongPressTimer();
        
        safeCallback(onDragStart, 'dragStart');
        Logger.debug('[useGestureDetector]', '드래그 시작:', currentPos);
      }
    },
    [enabled, dragThreshold, onDragStart, onLongPressCancel, safeCallback, clearLongPressTimer]
  );

  /**
   * 터치 종료 처리
   */
  const handleTouchEnd = useCallback(
    (_event: any) => {
      if (!enabled) return;

      const wasDragging = isDragging.current;
      const wasLongPressing = isLongPressing.current;

      Logger.debug('[useGestureDetector]', '터치 종료:', { wasDragging, wasLongPressing });

      // 제스처별 콜백 실행
      if (wasDragging) {
        safeCallback(onDragEnd, 'dragEnd');
      } else if (!wasLongPressing) {
        // 드래그도 아니고 길게누르기도 아니면 탭
        safeCallback(onTap, 'tap');
      }

      // 길게누르기 중이었다면 취소
      if (wasLongPressing) {
        safeCallback(onLongPressCancel, 'longPressCancel');
      }

      // 상태 초기화
      resetGestureState();
    },
    [enabled, onTap, onDragEnd, onLongPressCancel, safeCallback, resetGestureState]
  );

  /**
   * 현재 제스처 상태 반환
   */
  const getGestureState = useCallback((): GestureState => ({
    isDragging: isDragging.current,
    isLongPressing: isLongPressing.current,
    touchStartPosition: touchStartPos.current,
  }), []);

  /**
   * 터치 핸들러들
   */
  const gestureHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    gestureHandlers,
    getGestureState,
    resetGestureState,
  };
}