/**
 * 텍스트 관련 유틸리티 모듈
 * 텍스트 효과 파싱, 처리, 이미지 삽입 등의 기능을 제공
 */

// 텍스트 처리 관련 유틸리티 모듈들

export { ImageParser } from './ImageParser';
export { TextEffectParser } from './TextEffectParser';
export { TextEffectProcessor } from './TextEffectProcessor';
export { wrapWithEffects } from './TextEffectWrapper';
export { TextProcessor, type TextProcessResult } from './TextProcessor';
export { TextVariableParser } from './TextVariableParser';

// 기존 호환성을 위한 함수 내보내기
import { TextProcessor } from './TextProcessor';
export const getSceneText = TextProcessor.getSceneText;
export const getSceneTextWithEffects = TextProcessor.getSceneTextWithEffects;
