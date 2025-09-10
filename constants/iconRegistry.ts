import React from 'react';
import { SvgProps } from 'react-native-svg';
import { COLORS } from './theme';

// SVG 컴포넌트들을 직접 import
import DebugSvg from '../assets/icons/debug.svg';

// 이미지(WebP) 리소스 import
import AgilityWebp from '../assets/icons/agility.webp';
import CharismaWebp from '../assets/icons/charisma.webp';
import GoldWebp from '../assets/icons/gold.webp';
import HealthWebp from '../assets/icons/health.webp';
import MindWebp from '../assets/icons/mind.webp';
import StrengthWebp from '../assets/icons/strength.webp';
import WisdomWebp from '../assets/icons/wisdom.webp';

/** SVG 아이콘 설정 */
export interface SvgIconConfig {
  /** 구성 요소 타입 식별자 */
  type: 'svg';
  /** SVG 컴포넌트 */
  component: React.FC<SvgProps>;
  /** 기본 색상 */
  defaultColor: string;
}

/** 이미지 아이콘 설정 (예: WebP) */
export interface ImageIconConfig {
  /** 구성 요소 타입 식별자 */
  type: 'image';
  /** 정적 에셋 소스 (require 결과 번호) */
  source: number;
}

export type IconConfig = SvgIconConfig | ImageIconConfig;

/**
 * 아이콘 레지스트리: 모든 아이콘을 키로 관리합니다.
 * - SVG: 색상 지정 가능 (fill/color)
 * - 이미지(WebP 등): 색상 틴트 비권장/비적용 (원본 사용)
 */
export const ICON_REGISTRY = {
  // 자원 아이콘들
  health: {
    type: 'image',
    source: HealthWebp,
  } as const,
  mind: {
    type: 'image',
    source: MindWebp,
  } as const,
  gold: {
    type: 'image',
    source: GoldWebp,
  } as const,

  // 능력치 아이콘들
  strength: {
    type: 'image',
    source: StrengthWebp,
  } as const,
  agility: {
    type: 'image',
    source: AgilityWebp,
  } as const,
  wisdom: {
    type: 'image',
    source: WisdomWebp,
  } as const,
  charisma: {
    type: 'image',
    source: CharismaWebp,
  } as const,

  // 버튼 아이콘들
  debug: {
    type: 'svg',
    component: DebugSvg,
    defaultColor: COLORS.stateChange.neutral,
  } as const satisfies SvgIconConfig,
} as const satisfies Record<string, IconConfig>;

export type IconKey = keyof typeof ICON_REGISTRY;
