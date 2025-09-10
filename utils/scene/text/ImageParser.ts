import {
  BACKGROUND_IMAGE_MAP,
  IMAGE_CONFIG,
  IMAGE_SIZE_PRESETS,
  IMAGE_TAG_REGEX,
  ImageInfo,
  ImageParseResult,
  ImageSizePreset,
  INLINE_IMAGE_MAP,
} from '../../../constants/imageConfig';
import { Logger } from '../../system/Logger';

/**
 * 이미지 파서 클래스
 * 대괄호 태그([[image_name]], [[image_name:size]])를 파싱하여 이미지 정보를 추출
 */
export class ImageParser {
  /**
   * 텍스트에서 이미지 태그를 파싱하고 이미지 정보를 추출합니다.
   * @param text 파싱할 텍스트
   * @returns 파싱 결과
   */
  static parse(text: string): ImageParseResult {
    const images: ImageInfo[] = [];
    const errors: string[] = [];
    let hasImages = false;

    // 빈 텍스트 처리
    if (!text || text.trim() === '') {
      return {
        images: [],
        text,
        errors: [],
        hasImages: false,
      };
    }

    // 이미지 태그를 찾아서 파싱
    let match;
    const regex = new RegExp(IMAGE_TAG_REGEX);

    while ((match = regex.exec(text)) !== null) {
      hasImages = true;
      const [fullMatch, imageName, sizeOption] = match;
      const position = match.index;

      try {
        const imageInfo = this.parseImageTag(
          fullMatch,
          imageName,
          sizeOption,
          position
        );
        images.push(imageInfo);

        // 유효하지 않은 이미지인 경우 오류 추가
        if (!imageInfo.isValid) {
          errors.push(`유효하지 않은 이미지: ${imageName}`);
        }
      } catch (error) {
        errors.push(
          `이미지 태그 파싱 실패: ${fullMatch} (위치: ${position}) - ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    // 이미지 태그를 제거한 순수 텍스트 생성
    const cleanText = this.removeImageTags(text);

    return {
      images,
      text: cleanText,
      errors,
      hasImages,
    };
  }

  /**
   * 개별 이미지 태그를 파싱하여 이미지 정보를 생성합니다.
   * @param fullMatch 전체 매치 문자열
   * @param imageName 이미지 파일명
   * @param sizeOption 크기 옵션 (선택적)
   * @param position 텍스트에서의 위치
   * @returns 이미지 정보
   */
  private static parseImageTag(
    fullMatch: string,
    imageName: string,
    sizeOption: string | undefined,
    position: number
  ): ImageInfo {
    // 이미지 파일명 검증
    if (!imageName || imageName.trim() === '') {
      throw new Error('이미지 파일명이 비어있습니다');
    }

    const cleanImageName = imageName.trim();

    // 크기 옵션 파싱
    let size: ImageSizePreset = IMAGE_CONFIG.defaultSize;
    if (sizeOption) {
      const cleanSizeOption = sizeOption.trim() as ImageSizePreset;
      if (cleanSizeOption in IMAGE_SIZE_PRESETS) {
        size = cleanSizeOption;
      } else {
        throw new Error(`지원하지 않는 이미지 크기: ${sizeOption}`);
      }
    }

    // 이미지 소스 찾기
    const imageSource = this.findImageSource(cleanImageName);

    // 이미지 유효성 검증
    const isValid = imageSource !== null;

    return {
      filename: cleanImageName,
      size,
      originalTag: fullMatch,
      position,
      imageSource,
      isValid,
    };
  }

  /**
   * 이미지 맵에서 이미지 소스를 찾습니다.
   * @param filename 이미지 파일명 (확장자 제외)
   * @returns React Native 이미지 소스 또는 null
   */
  private static findImageSource(filename: string) {
    // 1) 인라인 맵 우선
    if (filename in INLINE_IMAGE_MAP) {
      return INLINE_IMAGE_MAP[filename];
    }
    // 2) 하위 호환/마이그레이션 안전장치: 배경 맵에서 백업 검색
    if (filename in BACKGROUND_IMAGE_MAP) {
      Logger.warn(
        '[ImageParser]',
        `인라인에서 찾지 못해 배경 맵에서 대체 로드했습니다: ${filename}`
      );
      return BACKGROUND_IMAGE_MAP[filename];
    }
    // 찾을 수 없으면 null 반환
    Logger.warn('[ImageParser]', `이미지를 찾을 수 없습니다: ${filename}`);
    return null;
  }

  /**
   * 이미지의 유효성을 검증합니다.
   * @param filename 이미지 파일명
   * @returns 유효성 여부
   */
  private static validateImage(filename: string): boolean {
    // 기본적인 파일명 검증
    if (!filename || filename.trim() === '') {
      return false;
    }

    // 특수 문자 검증 (기본적인 파일명 규칙)
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(filename)) {
      return false;
    }

    return true;
  }

  /**
   * 텍스트에서 모든 이미지 태그를 제거합니다.
   * @param text 이미지 태그가 포함된 텍스트
   * @returns 이미지 태그가 제거된 순수 텍스트
   */
  static removeImageTags(text: string): string {
    return text.replace(IMAGE_TAG_REGEX, '');
  }

  /**
   * 텍스트에 이미지 태그가 포함되어 있는지 확인합니다.
   * @param text 검사할 텍스트
   * @returns 이미지 태그 포함 여부
   */
  static hasImageTags(text: string): boolean {
    return IMAGE_TAG_REGEX.test(text);
  }

  /**
   * 이미지를 텍스트 라인으로 분할하여 처리하기 위한 함수
   * 이미지 앞뒤에 자동 줄바꿈을 추가합니다.
   * @param text 원본 텍스트
   * @returns 이미지가 분리된 라인 배열
   */
  static splitTextWithImages(text: string): Array<{
    type: 'text' | 'image';
    content: string;
    imageInfo?: ImageInfo;
  }> {
    const result: Array<{
      type: 'text' | 'image';
      content: string;
      imageInfo?: ImageInfo;
    }> = [];

    // 이미지 파싱
    const parseResult = this.parse(text);

    if (!parseResult.hasImages) {
      // 이미지가 없으면 텍스트로만 처리
      result.push({
        type: 'text',
        content: text,
      });
      return result;
    }

    // 이미지 위치를 기준으로 텍스트 분할
    let lastIndex = 0;
    const sortedImages = parseResult.images.sort(
      (a, b) => a.position - b.position
    );

    for (const imageInfo of sortedImages) {
      // 이미지 이전의 텍스트 추가
      if (imageInfo.position > lastIndex) {
        const textBefore = text.substring(lastIndex, imageInfo.position).trim();
        if (textBefore) {
          result.push({
            type: 'text',
            content: textBefore,
          });
        }
      }

      // 이미지 추가
      result.push({
        type: 'image',
        content: imageInfo.originalTag,
        imageInfo,
      });

      lastIndex = imageInfo.position + imageInfo.originalTag.length;
    }

    // 마지막 이미지 이후의 텍스트 추가
    if (lastIndex < text.length) {
      const textAfter = text.substring(lastIndex).trim();
      if (textAfter) {
        result.push({
          type: 'text',
          content: textAfter,
        });
      }
    }

    return result;
  }

  /**
   * 지원하는 이미지 크기 목록을 반환합니다.
   * @returns 지원하는 이미지 크기 배열
   */
  static getSupportedSizes(): ImageSizePreset[] {
    return Object.keys(IMAGE_SIZE_PRESETS) as ImageSizePreset[];
  }

  /**
   * 특정 크기의 설정 정보를 반환합니다.
   * @param size 이미지 크기
   * @returns 크기 설정 정보
   */
  static getSizeConfig(size: ImageSizePreset) {
    return IMAGE_SIZE_PRESETS[size];
  }

  /**
   * 등록된 이미지 목록을 반환합니다.
   * @returns 사용 가능한 이미지 파일명 배열
   */
  static getAvailableImages(): string[] {
    const set = new Set<string>();
    Object.keys(INLINE_IMAGE_MAP).forEach(k => set.add(k));
    Object.keys(BACKGROUND_IMAGE_MAP).forEach(k => set.add(k));
    return Array.from(set).sort();
  }
}
