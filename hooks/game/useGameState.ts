import { GameStateContext } from '../../contexts/GameStateContext';
import { UseGameStateReturn } from '../../types';
import { useContext } from 'react';

/**
 * 게임 상태 Context를 사용하기 위한 기본 Hook입니다.
 * 게임 상태와 관련된 모든 기능에 접근할 수 있습니다.
 * @returns 게임 상태 Context 값
 * @throws Error - GameStateProvider 외부에서 사용 시
 */
export function useGameState(): UseGameStateReturn {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
}
