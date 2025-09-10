import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Scene } from '../../types';

export interface HistoryEntry {
  id: string;
  sceneId: string;
  resolvedText: string;
  chosenText?: string;
  measuredHeight: number;
  timestamp: number;
}

interface PendingHistoryEntry {
  sceneId: string;
  resolvedText: string;
  chosenText?: string;
}

interface UseSceneHistoryResult {
  history: HistoryEntry[];
  totalHistoryHeight: number;
  setPendingSnapshot: (entry: PendingHistoryEntry) => void;
  appendChoiceToPending: (chosenText: string) => void;
  onItemLayoutMeasure: (id: string, height: number) => void;
}

/**
 * 씬 이력 관리 훅: 스냅샷 추가, 높이 기반 프루닝, 높이 측정 누적
 * - 씬 변경을 자동 감지하여 보류 스냅샷을 히스토리에 반영하고 프루닝 수행
 */
export function useSceneHistory(
  currentScene: Scene | null,
  viewportHeight: number
): UseSceneHistoryResult {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [totalHistoryHeight, setTotalHistoryHeight] = useState(0);
  const [pendingEntry, setPendingEntry] = useState<PendingHistoryEntry | null>(
    null
  );

  const MAX_HISTORY_HEIGHT = useMemo(
    () => viewportHeight * 4,
    [viewportHeight]
  );

  // 씬 변경 감지: 보류 스냅샷을 반영하고, 프루닝 실행
  useEffect(() => {
    if (!currentScene) return;

    // 보류 스냅샷을 히스토리에 추가 (중복 방지)
    if (pendingEntry && pendingEntry.sceneId !== currentScene.id) {
      setHistory(prev => [
        ...prev,
        {
          id: `${pendingEntry.sceneId}-${Date.now()}`,
          sceneId: pendingEntry.sceneId,
          resolvedText: pendingEntry.resolvedText,
          chosenText: pendingEntry.chosenText,
          measuredHeight: 0,
          timestamp: Date.now(),
        },
      ]);
      setPendingEntry(null);
    }

    // 프루닝: 총 높이가 예산을 초과하면 오래된 항목부터 제거
    setHistory(prev => {
      let next = [...prev];
      let runningHeight = next.reduce((s, e) => s + (e.measuredHeight || 0), 0);
      const budget = MAX_HISTORY_HEIGHT - viewportHeight;
      while (runningHeight > budget && next.length > 0) {
        const removed = next.shift()!;
        runningHeight -= removed.measuredHeight || 0;
      }
      setTotalHistoryHeight(runningHeight);
      return next;
    });
  }, [currentScene?.id, MAX_HISTORY_HEIGHT, viewportHeight, pendingEntry]);

  const setPendingSnapshot = useCallback((entry: PendingHistoryEntry) => {
    setPendingEntry(entry);
  }, []);

  const appendChoiceToPending = useCallback((chosenText: string) => {
    setPendingEntry(prev => (prev ? { ...prev, chosenText } : prev));
  }, []);

  const onItemLayoutMeasure = useCallback((id: string, height: number) => {
    setHistory(prev => {
      let changed = false;
      const next = prev.map(item => {
        if (item.id === id && item.measuredHeight !== height) {
          changed = true;
          return { ...item, measuredHeight: height };
        }
        return item;
      });
      if (changed) {
        const total = next.reduce((s, it) => s + (it.measuredHeight || 0), 0);
        setTotalHistoryHeight(total);
      }
      return next;
    });
  }, []);

  return {
    history,
    totalHistoryHeight,
    setPendingSnapshot,
    appendChoiceToPending,
    onItemLayoutMeasure,
  };
}
