// 🎯 배경 효과 시스템 (1~4단계)
// 각 단계별로 점진적으로 발전하는 배경 효과 시스템

// 효과 적용기 (1단계: 기본 효과)
export { EffectApplier } from './EffectApplier';

// 배경 효과 매니저 (단일 + 다중 효과 지원)
export { BackgroundEffectManager } from './BackgroundEffectManager';
export type {
  BackgroundEffectInfo,
  BackgroundEffectProps,
  BackgroundEffectType,
  MultipleBackgroundEffectInfo,
  UnifiedBackgroundEffectInfo,
  UnifiedBackgroundEffectType,
} from './BackgroundEffectManager';

// 배경 효과 연속성 매니저 (3단계: 연속성 관리 및 최적화)
export {
  BackgroundEffectContinuityManager,
  useBackgroundEffectContinuity,
} from './BackgroundEffectContinuityManager';

// 상태 기반 효과 시스템 (4단계: 상태 기반 자동 효과)
export { GameStateEffectMonitor } from './GameStateEffectMonitor';
export type {
  GameStateEffectInfo,
  StateMonitoringResult,
} from './GameStateEffectMonitor';

// 효과 핸들러들
export * from './handlers';
