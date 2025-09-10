/**
 * 이미지 삽입 시스템 설정
 * 씬 텍스트에서 사용할 이미지 크기 프리셋과 관련 설정을 정의합니다.
 */

import { ImageSourcePropType } from 'react-native';
import {
  BACKGROUND_IMAGE_MAP as GENERATED_BACKGROUND_IMAGE_MAP,
  INLINE_IMAGE_MAP as GENERATED_INLINE_IMAGE_MAP,
} from './generated/imageMaps';

/**
 * 이미지 크기 프리셋 타입
 */
export type ImageSizePreset = 'lg' | 'md' | 'sm';

/**
 * 이미지 크기 설정 인터페이스
 */
export interface ImageSizeConfig {
  /** 고정 너비 (픽셀) */
  width: number;
  /** 고정 높이 (픽셀) */
  height: number;
  /** 설명 */
  description: string;
}

/**
 * 인라인(씬 텍스트 내)에서 사용할 이미지 맵
 * React Native에서는 동적 require가 불가능하므로 모든 이미지를 사전에 등록합니다.
 * WebP 형식과 다중 해상도(@1x, @2x, @3x)를 지원합니다.
 */
export const INLINE_IMAGE_MAP: Record<string, ImageSourcePropType> =
  GENERATED_INLINE_IMAGE_MAP;

/**
 * 배경에서 사용할 이미지 맵
 * 현재는 효과/그라데이션 기반 배경을 사용하고 있으므로 비워둡니다.
 * 배경 이미지를 도입할 경우 아래에 `assets/images/backgrounds/*` 경로를 등록하세요.
 */
export const BACKGROUND_IMAGE_MAP: Record<string, ImageSourcePropType> =
  GENERATED_BACKGROUND_IMAGE_MAP;

/**
 * 이미지 크기 프리셋 정의
 */
export const IMAGE_SIZE_PRESETS: Record<ImageSizePreset, ImageSizeConfig> = {
  lg: {
    width: 300,
    height: 300,
    description: '대형 이미지',
  },
  md: {
    width: 300,
    height: 200,
    description: '중형 이미지 (기본값)',
  },
  sm: {
    width: 200,
    height: 150,
    description: '소형 이미지',
  },
};

/**
 * 이미지 삽입 시스템 전역 설정
 */
export const IMAGE_CONFIG = {
  /** 기본 이미지 크기 */
  defaultSize: 'md' as ImageSizePreset,

  /** 이미지 페이드인 애니메이션 지속시간 (밀리초) */
  fadeInDuration: 800,

  /** 이미지 로드 실패 시 표시할 대체 텍스트 */
  fallbackText: '[이미지를 불러올 수 없습니다]',
} as const;

/**
 * 이미지 태그 정규식 패턴
 * [[image_name]] 또는 [[image_name:size]] 형태를 매치
 */
export const IMAGE_TAG_REGEX = /\[\[([^:\]]+)(?::([^:\]]+))?\]\]/g;

/**
 * 이미지 파싱 결과 인터페이스
 */
export interface ImageParseResult {
  /** 파싱된 이미지 정보 */
  images: ImageInfo[];
  /** 이미지 태그가 제거된 순수 텍스트 */
  text: string;
  /** 파싱 오류 */
  errors: string[];
  /** 이미지 포함 여부 */
  hasImages: boolean;
}

/**
 * 이미지 정보 인터페이스
 */
export interface ImageInfo {
  /** 이미지 파일명 (확장자 제외) */
  filename: string;
  /** 이미지 크기 프리셋 */
  size: ImageSizePreset;
  /** 원본 태그 문자열 */
  originalTag: string;
  /** 텍스트에서의 위치 */
  position: number;
  /** React Native 이미지 소스 */
  imageSource: ImageSourcePropType | null;
  /** 유효한 이미지인지 여부 */
  isValid: boolean;
}
