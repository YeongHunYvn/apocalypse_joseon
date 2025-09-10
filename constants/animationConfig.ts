import { TextEffectType } from '../types';
import { COLORS } from './theme';

/**
 * 애니메이션 효과 기본 설정
 * 모든 애니메이션 효과의 기본값을 중앙에서 관리
 * 색상은 theme.ts의 COLORS를 참조하여 일관성 유지
 */
export const ANIMATION_CONFIG = {
  // 텍스트 스타일 효과 (애니메이션 없음)
  bold: { intensity: 1.0, duration: 0, color: '' },
  italic: { intensity: 1.0, duration: 0, color: '' },
  underline: { intensity: 1.0, duration: 0, color: '' },
  highlight: { intensity: 0.8, duration: 0, color: COLORS.yellow },

  // 색상 효과 (애니메이션 없음) - theme.ts의 직관적 색상 참조
  red: { intensity: 1.0, duration: 0, color: COLORS.red },
  blue: { intensity: 1.0, duration: 0, color: COLORS.blue },
  green: { intensity: 1.0, duration: 0, color: COLORS.green },
  yellow: { intensity: 1.0, duration: 0, color: COLORS.yellow },
  // 상태 변화 의미 색상 (텍스트 효과 타입에 존재)
  positive: { intensity: 1.0, duration: 0, color: COLORS.stateChange.positive },
  negative: { intensity: 1.0, duration: 0, color: COLORS.stateChange.negative },
  neutral: { intensity: 1.0, duration: 0, color: COLORS.stateChange.neutral },

  // 애니메이션 효과
  shake: { intensity: 1.0, duration: 1000, color: '' },
  glow: { intensity: 1.0, duration: 2000, color: COLORS.yellow },
  fade: { intensity: 1.0, duration: 3000, color: '' },
  scale: { intensity: 1.0, duration: 1500, color: '' },
  wave: { intensity: 1.0, duration: 1500, color: '' },
  pulse: { intensity: 1.0, duration: 1000, color: '' },
} as const;

/**
 * 씬 텍스트 애니메이션 관련 설정
 */
export const SCENE_ANIMATION_CONFIG = {
  /** 줄 단위 순차 페이드 인 애니메이션의 강도 */
  REVEAL_INTENSITY: 0.2,
  /** 줄별 Reveal Animation 사이의 지연시간 (밀리초) */
  DEFAULT_REVEAL_DELAY: 50,
  /** 각 줄의 Reveal Animation 지속시간 (밀리초) */
  DEFAULT_REVEAL_DURATION: 300,
  /** 문자별 Reveal Animation 사이의 지연시간 (밀리초) */
  DEFAULT_CHAR_DELAY: 30,
  /** 한 줄에서 애니메이션으로 처리할 최대 문자 수 (초과분은 즉시 렌더) */
  MAX_ANIMATED_CHARS_PER_LINE: 200,
} as const;

/**
 * 선택지 텍스트 애니메이션 관련 설정
 */
export const CHOICE_ANIMATION_CONFIG = {
  /** 선택지가 나타날 때의 페이드 인 애니메이션 강도 */
  FADE_INTENSITY: 0.9,
  /** 선택지 텍스트의 페이드 인 애니메이션 지속시간 (밀리초) */
  DEFAULT_FADE_DURATION: 600,
} as const;

/**
 * 문장부호별 추가 지연시간 설정
 * Reveal Animation에서 문장부호를 만났을 때 추가로 기다리는 시간 (밀리초)
 * 각 문장부호별로 다른 지연시간을 설정하여 더 자연스러운 리듬감 연출
 */
export const PUNCTUATION_DELAYS = {
  ',': 0, // 쉼표: 짧은 휴식
  '.': 0, // 마침표: 긴 휴식
  '…': 0, // 말줄임표: 가장 긴 휴식
} as const;

/**
 * 문장부호별 지연시간 조회 함수
 * @param char 문장부호
 * @returns 해당 문장부호의 지연시간 (밀리초), 없으면 0
 */
export function getPunctuationDelay(char: string): number {
  return PUNCTUATION_DELAYS[char as keyof typeof PUNCTUATION_DELAYS] ?? 0;
}

/**
 * 기본 효과 설정
 * 씬 텍스트와 선택지 텍스트에 적용될 기본 효과들의 설정
 */
export const DEFAULT_EFFECTS_CONFIG = {
  // 씬 텍스트 기본 효과
  scene: {
    // Reveal Animation 기본 설정
    reveal: {
      intensity: SCENE_ANIMATION_CONFIG.REVEAL_INTENSITY,
      delay: SCENE_ANIMATION_CONFIG.DEFAULT_REVEAL_DELAY,
      duration: SCENE_ANIMATION_CONFIG.DEFAULT_REVEAL_DURATION,
      enabled: true,
    },
  },
  // 선택지 텍스트 기본 효과
  choice: {
    // 페이드 인 기본 설정
    fade: {
      intensity: CHOICE_ANIMATION_CONFIG.FADE_INTENSITY,
      duration: CHOICE_ANIMATION_CONFIG.DEFAULT_FADE_DURATION,
      enabled: true,
    },
  },
} as const;

/**
 * 특정 효과의 기본 강도 반환
 * @param effectType 효과 타입
 * @returns 기본 강도 (0~1)
 */
export function getDefaultIntensity(effectType: TextEffectType): number {
  return ANIMATION_CONFIG[effectType]?.intensity ?? 1.0;
}

/**
 * 특정 효과의 기본 애니메이션 지속시간 반환
 * @param effectType 효과 타입
 * @returns 기본 지속시간 (밀리초)
 */
export function getDefaultDuration(effectType: TextEffectType): number {
  return ANIMATION_CONFIG[effectType]?.duration ?? 0;
}

/**
 * 특정 효과의 기본 색상 반환
 * @param effectType 효과 타입
 * @returns 기본 색상 (hex 코드)
 */
export function getDefaultColor(effectType: TextEffectType): string {
  return ANIMATION_CONFIG[effectType]?.color ?? '';
}

export const ANIMATION_DURATIONS = {
  FADE_IN: 0, // ms
  FADE_OUT: 300, // ms
  LOADING_TRANSITION: 300, // ms
};
