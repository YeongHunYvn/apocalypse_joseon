import { Chapter, ChapterType } from '../../types';

/**
 * 챕터 유틸리티
 * 챕터 관련 유틸리티 함수들을 담당합니다.
 */
export class ChapterUtils {
  /**
   * 챕터 ID에서 타입과 층수 추출
   * @param chapterId - 챕터 ID
   * @returns 파싱된 결과
   */
  static parseChapterId(chapterId: string): { type: ChapterType; floor: number } {
    const match = chapterId.match(/^(\w+)_floor_(\d+)$/);
    if (!match) {
      throw new Error(`Invalid chapter ID format: ${chapterId}`);
    }
    
    const [, type, floorStr] = match;
    const floor = parseInt(floorStr, 10);
    
    if (type !== 'rest' && type !== 'story') {
      throw new Error(`Invalid chapter type: ${type}`);
    }
    
    return { type: type as ChapterType, floor };
  }

  /**
   * 챕터 타입과 층수로 챕터 ID 생성
   * @param type - 챕터 타입
   * @param floor - 층수
   * @returns 챕터 ID
   */
  static generateChapterId(type: ChapterType, floor: number): string {
    return `${type}_floor_${floor}`;
  }

  /**
   * 챕터 이름 생성
   * @param type - 챕터 타입
   * @param floor - 층수
   * @returns 챕터 이름
   */
  static generateChapterName(type: ChapterType, floor: number): string {
    const typeName = type === 'rest' ? '휴식' : '스토리';
    return `${typeName} ${floor}층`;
  }

  /**
   * 챕터 타입을 한글로 변환합니다.
   * @param type - 챕터 타입
   * @returns 한글 이름
   */
  static getChapterTypeName(type: ChapterType): string {
    switch (type) {
      case 'rest':
        return '휴식';
      case 'story':
        return '스토리';
      default:
        return '알 수 없음';
    }
  }

  /**
   * 챕터 ID가 유효한지 확인합니다.
   * @param chapterId - 확인할 챕터 ID
   * @returns 유효성 여부
   */
  static isValidChapterId(chapterId: string): boolean {
    try {
      this.parseChapterId(chapterId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 챕터 ID에서 층수만 추출합니다.
   * @param chapterId - 챕터 ID
   * @returns 층수
   */
  static getFloorFromChapterId(chapterId: string): number {
    return this.parseChapterId(chapterId).floor;
  }

  /**
   * 챕터 ID에서 타입만 추출합니다.
   * @param chapterId - 챕터 ID
   * @returns 챕터 타입
   */
  static getTypeFromChapterId(chapterId: string): ChapterType {
    return this.parseChapterId(chapterId).type;
  }

  /**
   * 챕터를 다른 형식으로 변환합니다.
   * @param scenes - 씬 배열
   * @param chapterId - 챕터 ID
   * @param nextChapterId - 다음 챕터 ID (선택사항)
   * @returns 챕터 객체
   */
  static convertToChapter(
    scenes: any[], 
    chapterId: string, 
    nextChapterId?: string
  ): Chapter {
    const { type, floor } = this.parseChapterId(chapterId);
    
    return {
      id: chapterId,
      name: this.generateChapterName(type, floor),
      type,
      floor,
      next_chapter_id: nextChapterId,
      scenes
    };
  }

  /**
   * 챕터 정보를 로그 메시지로 생성합니다.
   * @param chapter - 챕터 객체
   * @returns 로그 메시지
   */
  static generateChapterLogMessage(chapter: Chapter): string {
    return `📖 챕터 로드: ${chapter.name} (${chapter.scenes.length}개 씬)`;
  }

  /**
   * 챕터 전환 메시지를 생성합니다.
   * @param fromChapterId - 이전 챕터 ID
   * @param toChapterId - 다음 챕터 ID
   * @returns 전환 메시지
   */
  static generateChapterTransitionMessage(fromChapterId: string, toChapterId: string): string {
    const fromInfo = this.parseChapterId(fromChapterId);
    const toInfo = this.parseChapterId(toChapterId);
    
    const fromName = this.generateChapterName(fromInfo.type, fromInfo.floor);
    const toName = this.generateChapterName(toInfo.type, toInfo.floor);
    
    return `🔄 챕터 전환: ${fromName} → ${toName}`;
  }
} 