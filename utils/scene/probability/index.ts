// 확률 계산 관련 모듈들을 통합하여 내보냅니다.

export { ProbabilityCalculator } from './ProbabilityCalculator';

// 기존 호환성을 위한 함수 내보내기
import { ProbabilityCalculator } from './ProbabilityCalculator';
export const calculateProbability = ProbabilityCalculator.calculateProbability;
export const rollProbability = ProbabilityCalculator.rollProbability;
export const processProbability = ProbabilityCalculator.processProbability; 