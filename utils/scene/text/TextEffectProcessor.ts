import {
  DefaultEffectOptions,
  TextDisplayMode,
  TextEffect,
} from '../../../types';

import { DEFAULT_EFFECTS_CONFIG } from '../../../constants/animationConfig';
import { TextEffectParser } from './TextEffectParser';

/**
 * 텍스트 효과 처리기
 * 기본 효과 적용 및 텍스트 파싱을 담당합니다.
 */
export class TextEffectProcessor {
  /**
   * 텍스트를 파싱하고 기본 효과를 적용합니다.
   * @param text - 원본 텍스트
   * @param displayMode - 텍스트 표시 모드 ('scene' | 'choice')
   * @param options - 기본 효과 적용 옵션
   * @returns 파싱 및 효과 적용 결과
   */
  static processText(
    text: string,
    displayMode: TextDisplayMode,
    options: DefaultEffectOptions = {}
  ): {
    text: string;
    effects: TextEffect[];
    hasDefaultEffects: boolean;
  } {
    const { enableDefaultEffects = true } = options;

    // 기존 텍스트 효과 파싱
    const parseResult = TextEffectParser.parse(text);
    let effects = [...parseResult.allEffects];

    // 기본 효과 추가 (충돌 없이 단순 추가)
    if (enableDefaultEffects) {
      const defaultEffects = TextEffectProcessor.generateDefaultEffects(
        parseResult.originalText,
        displayMode
      );
      effects.push(...defaultEffects);
    }

    return {
      text: parseResult.originalText,
      effects,
      hasDefaultEffects: enableDefaultEffects,
    };
  }

  /**
   * 텍스트에 기본 효과를 생성합니다.
   * @param text - 원본 텍스트
   * @param displayMode - 텍스트 표시 모드
   * @returns 기본 효과 배열
   */
  private static generateDefaultEffects(
    text: string,
    displayMode: TextDisplayMode
  ): TextEffect[] {
    const effects: TextEffect[] = [];
    const config = DEFAULT_EFFECTS_CONFIG[displayMode];

    if (!config) {
      return effects;
    }

    // 씬 텍스트의 경우 기본 효과 없음 (RevealTextWrapper에서 처리)
    if (displayMode === 'scene') {
      return effects;
    }

    // 선택지 텍스트의 경우 페이드 인 효과 적용
    if (displayMode === 'choice' && 'fade' in config && config.fade.enabled) {
      effects.push({
        type: 'fade',
        start: 0,
        end: text.length,
        intensity: config.fade.intensity,
        duration: config.fade.duration,
      });
    }

    return effects;
  }
}
