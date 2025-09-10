// SceneUtils 분리 모듈들을 재내보내는 파일
// 기존 API와의 호환성을 유지하면서 분리된 모듈들을 사용합니다.

// 모든 분리된 모듈들을 재내보냅니다
export * from './scene';

// 기존 호환성을 위한 직접 내보내기
export {
  ChapterUtils,
  ConditionChecker,
  EffectApplier,
  GameOverChecker,
  ProbabilityCalculator,
  SceneFilter,
  SceneValidator,
  TextProcessor,
  // 효과 적용
  applyEffects,
  // 확률 계산
  calculateProbability,
  // 조건 확인
  checkCondition,
  // 게임오버
  checkGameOver,
  convertToChapter,
  filterRandomSelectableScenes,
  // 씬 필터링
  filterScenesByCondition,
  generateChapterId,
  generateChapterName,
  getAvailableChoices,
  // 텍스트 처리
  getSceneText,
  getSceneTextWithEffects,
  // 챕터 유틸리티
  parseChapterId,
  processProbability,
  rollProbability,
} from './scene';
