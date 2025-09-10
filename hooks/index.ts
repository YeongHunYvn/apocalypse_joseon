// ===== 통합 훅 export =====
// 모든 훅을 한 곳에서 import할 수 있도록 통합 export

// ===== 애니메이션 관련 훅들 =====
export { useAnimation } from './animation/useAnimation';

// ===== 게임 상태 및 로직 관련 훅들 =====
// 기본 상태 접근
export { useGameState } from './game/useGameState';

// 통합된 도메인별 훅들 (권장)
export { useGameInventory } from './game/useGameInventory';
export { useGameLifecycle } from './game/useGameLifecycle';
export { useGameProgress } from './game/useGameProgress'; // 통합된 진행 상태 관리
export { useGameStats } from './game/useGameStats';

// ===== 스토리 관련 훅들 =====
// Core - 단일 진실의 원천 (신규)
export { useStoryCore } from './story/core/useStoryCore';


// 비즈니스 로직 (개선됨)
export { useStoryLogic } from './story/useStoryLogic';


// 통합 전환 관리 (개선됨)
export { useSceneTransition } from './story/useSceneTransition';

// ===== UI 관련 훅들 =====
export { useSafeArea } from './ui/useSafeArea';


// ===== 서브폴더별 일괄 Export (선택적 사용) =====
// export * from './animation';
// export * from './game';
// export * from './story';
// export * from './ui';
