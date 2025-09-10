// 새로운 분리된 SceneEngine으로 교체
// 기존 코드는 utils/sceneEngine.ts.backup에 백업됨

export { ChapterManager } from './scene/ChapterManager';
export { GameOverHandler } from './scene/GameOverHandler';
export { GameStateUpdater } from './scene/GameStateUpdater';
export { SceneEngine, type EngineState } from './scene/SceneEngine';
export { SceneSelector } from './scene/SceneSelector';

// 타입 재내보내기
export type { Chapter, Choice, GameState, Scene, SceneId } from '../types';
