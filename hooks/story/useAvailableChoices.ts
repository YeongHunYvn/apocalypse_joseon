import { useCallback, useEffect, useState } from 'react';
import { Choice, GameState, Scene } from '../../types';
import { SceneFilter } from '../../utils/scene/SceneFilter';

/**
 * 현재 씬과 게임 상태를 기반으로 표시 가능한 선택지를 계산하는 훅
 */
export function useAvailableChoices(
  currentScene: Scene | null,
  gameState: GameState
) {
  const [choices, setChoices] = useState<Choice[]>([]);

  const recompute = useCallback(() => {
    if (!currentScene) {
      setChoices([]);
      return;
    }
    const available = SceneFilter.getAvailableChoices(currentScene, gameState);
    setChoices(available);
  }, [currentScene, gameState]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  return { choices, recompute };
}
