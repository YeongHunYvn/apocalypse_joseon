// Scene 관련 유틸리티 함수 및 클래스들을 모아둔 인덱스 파일

// 챕터 관리
export { ChapterManager } from './ChapterManager';
export { ChapterTransitionManager } from './ChapterTransitionManager';
export { ChapterUtils } from './ChapterUtils';

// 조건 확인
export { ConditionChecker } from './conditions/ConditionChecker';

// 확률 계산
export { ProbabilityCalculator } from './probability/ProbabilityCalculator';

// 효과 적용
export { EffectApplier } from './effects/EffectApplier';

// 씬 필터링 및 선택
export { SceneFilter } from './SceneFilter';
export { SceneSelector } from './SceneSelector';

// 게임 상태 업데이트
export { GameStateUpdater } from './GameStateUpdater';

// 게임 오버 처리
export { GameOverChecker } from './GameOverChecker';
export { GameOverHandler } from './GameOverHandler';

// 씬 엔진 (코어)
export { SceneEngine } from './SceneEngine';

// 방문 이력 관리
export { VisitedScenesManager } from './VisitedScenesManager';

// 텍스트 처리
export {
  TextEffectParser,
  TextEffectProcessor,
  TextProcessor,
  TextVariableParser,
} from './text';

// 씬 검증
export { SceneValidator } from './validation/SceneValidator';

// ==========================================
// 🔄 기존 코드 호환성을 위한 편의 함수들
// ==========================================

// 확률 계산 함수 (호환성)
export const calculateProbability = (
  baseRate: any,
  modifier: any,
  gameState: any
) => {
  const {
    ProbabilityCalculator,
  } = require('./probability/ProbabilityCalculator');
  return ProbabilityCalculator.calculateProbability(
    baseRate,
    modifier,
    gameState
  );
};

// 조건 확인 함수 (호환성)
export const checkCondition = (condition: any, gameState: any) => {
  const { ConditionChecker } = require('./conditions/ConditionChecker');
  return ConditionChecker.checkCondition(condition, gameState);
};

// 효과 적용 함수 (호환성)
export const applyEffects = (effects: any, gameState: any) => {
  const { EffectApplier } = require('./effects/EffectApplier');
  return EffectApplier.applyEffects(effects, gameState);
};

// 게임오버 확인 함수 (호환성)
export const checkGameOver = (gameState: any) => {
  const { GameOverChecker } = require('./GameOverChecker');
  return GameOverChecker.checkGameOver(gameState);
};

// 씬 필터링 함수들 (호환성)
export const filterScenesByCondition = (scenes: any[], gameState: any) => {
  const { SceneFilter } = require('./SceneFilter');
  return SceneFilter.filterScenesByCondition(scenes, gameState);
};

export const filterRandomSelectableScenes = (scenes: any[]) => {
  const { SceneFilter } = require('./SceneFilter');
  return SceneFilter.filterRandomSelectableScenes(scenes);
};

export const getAvailableChoices = (scene: any, gameState: any) => {
  const { SceneFilter } = require('./SceneFilter');
  return SceneFilter.getAvailableChoices(scene, gameState);
};

// 텍스트 처리 함수들 (호환성)
export const getSceneText = (scene: any, gameState: any) => {
  const { TextProcessor } = require('./text/TextProcessor');
  return TextProcessor.getSceneText(scene, gameState);
};

export const getSceneTextWithEffects = (
  scene: any,
  gameState: any,
  effects: any
) => {
  const { TextProcessor } = require('./text/TextProcessor');
  return TextProcessor.getSceneTextWithEffects(scene, gameState, effects);
};

// 확률 처리 함수들 (호환성)
export const processProbability = (probability: any, gameState: any) => {
  const {
    ProbabilityCalculator,
  } = require('./probability/ProbabilityCalculator');
  return ProbabilityCalculator.processProbability(probability, gameState);
};

export const rollProbability = (baseRate: number, modifier: number) => {
  const {
    ProbabilityCalculator,
  } = require('./probability/ProbabilityCalculator');
  return ProbabilityCalculator.rollProbability(baseRate, modifier);
};

// 챕터 유틸리티 함수들 (호환성)
export const parseChapterId = (chapterId: string) => {
  const { ChapterUtils } = require('./ChapterUtils');
  return ChapterUtils.parseChapterId(chapterId);
};

export const generateChapterId = (type: string, floor: number) => {
  const { ChapterUtils } = require('./ChapterUtils');
  return ChapterUtils.generateChapterId(type, floor);
};

export const generateChapterName = (type: string, floor: number) => {
  const { ChapterUtils } = require('./ChapterUtils');
  return ChapterUtils.generateChapterName(type, floor);
};

export const convertToChapter = (scenes: any[], chapterId: string) => {
  const { ChapterUtils } = require('./ChapterUtils');
  return ChapterUtils.convertToChapter(scenes, chapterId);
};
