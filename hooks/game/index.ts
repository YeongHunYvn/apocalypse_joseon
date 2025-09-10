// 게임 상태 및 로직 관련 훅들

// 기본 상태 접근
export { useGameState } from './useGameState';

// 통합된 도메인별 훅들 (권장)
export { useGameInventory } from './useGameInventory';
export { useGameLifecycle } from './useGameLifecycle';
export { useGameProgress } from './useGameProgress'; // 진행 상태 통합 (읽기/쓰기)
export { useGameStats } from './useGameStats';
