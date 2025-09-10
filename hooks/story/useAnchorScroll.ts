import { useCallback, useEffect, useState } from 'react';
import type { Scene } from '../../types';

export interface AnchorControls {
  setAnchorY: (y: number) => void;
  markCurrentSceneReady: () => void;
  scheduleAnchorScroll: () => void;
}

export function useAnchorScroll(
  currentScene: Scene | null,
  scrollTo: (y: number, animated?: boolean) => void
): AnchorControls {
  const [anchorY, setAnchorYState] = useState<number | null>(null);
  const [pendingAnchorScroll, setPendingAnchorScroll] = useState(false);
  const [currentSceneReady, setCurrentSceneReady] = useState(false);

  // 씬 변경 시 스크롤 예약 및 레이아웃 준비 상태 초기화
  useEffect(() => {
    if (!currentScene) return;
    setPendingAnchorScroll(true);
    setCurrentSceneReady(false);
  }, [currentScene?.id]);

  // 준비 완료 시 한 번 스크롤
  useEffect(() => {
    if (pendingAnchorScroll && anchorY != null && currentSceneReady) {
      requestAnimationFrame(() => {
        scrollTo(anchorY, true);
        setPendingAnchorScroll(false);
      });
    }
  }, [pendingAnchorScroll, anchorY, currentSceneReady, scrollTo]);

  const setAnchorY = useCallback((y: number) => setAnchorYState(y), []);
  const markCurrentSceneReady = useCallback(
    () => setCurrentSceneReady(true),
    []
  );
  const scheduleAnchorScroll = useCallback(
    () => setPendingAnchorScroll(true),
    []
  );

  return { setAnchorY, markCurrentSceneReady, scheduleAnchorScroll };
}
