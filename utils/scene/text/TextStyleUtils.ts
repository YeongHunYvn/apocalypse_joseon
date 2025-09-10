import { TextStyle } from 'react-native';
import { COLORS, FONT_STYLES } from '../../../constants/theme';
import { TextEffect } from '../../../types';

/**
 * 세그먼트의 효과를 기반으로 스타일을 생성
 * @param effects 적용할 효과들
 * @param baseStyle 기본 텍스트 스타일
 * @returns 적용된 스타일
 */
export function getSegmentStyle(
  effects: TextEffect[],
  baseStyle: TextStyle
): TextStyle {
  let segmentStyle: TextStyle = {};

  // 각 효과를 순서대로 적용
  for (const effect of effects) {
    const effectStyle = getEffectStyle(effect, baseStyle);
    segmentStyle = { ...segmentStyle, ...effectStyle };
  }

  return segmentStyle;
}

/**
 * 개별 효과의 스타일을 생성
 * @param effect 텍스트 효과
 * @param baseStyle 기본 텍스트 스타일
 * @returns 효과 스타일
 */
export function getEffectStyle(effect: TextEffect, _baseStyle: TextStyle): TextStyle {
  const { type, intensity: _intensity = 1, color: effectColor } = effect;

  switch (type) {
    // 텍스트 스타일 효과
    case 'bold':
      return {
        ...FONT_STYLES.bold,
      };

    case 'italic':
      return {
        fontStyle: 'italic' as const,
      };

    case 'underline':
      return {
        textDecorationLine: 'underline',
      };

    case 'highlight':
      return {
        backgroundColor: COLORS.warning + '40', // 40은 투명도 (25%)
      };

    // 색상 효과
    case 'red':
      return {
        color: effectColor || COLORS.danger,
      };

    case 'blue':
      return {
        color: effectColor || COLORS.primary,
      };

    case 'green':
      return {
        color: effectColor || COLORS.success,
      };

    case 'yellow':
      return {
        color: effectColor || COLORS.warning,
      };

    case 'positive':
      return {
        color: effectColor || COLORS.stateChange.positive,
      };

    case 'negative':
      return {
        color: effectColor || COLORS.stateChange.negative,
      };

    case 'neutral':
      return {
        color: effectColor || COLORS.stateChange.neutral,
      };

    // 애니메이션 효과는 래퍼에서 처리
    case 'shake':
    case 'glow':
    case 'fade':
    case 'scale':
    case 'wave':
    case 'pulse':
      return {};

    default:
      return {};
  }
}