import chaptersIndex from '../assets/chapters';
import { Chapter } from '../types';

/**
 * 챕터 데이터 소스 인터페이스
 * - 구현체에 따라 로컬/원격에서 챕터 JSON을 제공합니다.
 */
export interface ChapterSource {
  /** 특정 챕터를 ID로 조회합니다. */
  getChapterById(chapterId: string): Promise<Chapter>;
  /** 모든 챕터 목록을 조회합니다. */
  getAllChapters(): Promise<Chapter[]>;
  /** 모든 챕터 ID 목록을 조회합니다. */
  getAllChapterIds(): Promise<string[]>;
}

/**
 * 로컬 챕터 소스 구현체
 * - 번들된 JSON에서 챕터를 제공합니다.
 */
export class LocalChapterSource implements ChapterSource {
  /** 모든 챕터를 메모리에 구성하여 반환합니다. */
  async getAllChapters(): Promise<Chapter[]> {
    const result: Chapter[] = [];
    for (const value of Object.values(chaptersIndex)) {
      // 런타임 타입 체크는 상위 레이어에서 수행
      result.push(value as Chapter);
    }
    return result;
  }

  /** 모든 챕터 ID를 반환합니다. */
  async getAllChapterIds(): Promise<string[]> {
    return Object.keys(chaptersIndex);
  }

  /** 특정 챕터를 ID로 반환합니다. */
  async getChapterById(chapterId: string): Promise<Chapter> {
    const chapter = (chaptersIndex as Record<string, unknown>)[chapterId] as
      | Chapter
      | undefined;
    if (!chapter) {
      throw new Error(`알 수 없는 챕터 ID: ${chapterId}`);
    }
    return chapter;
  }
}

/**
 * 원격 챕터 소스 구현체
 * - 서버 HTTP API를 통해 챕터를 제공합니다.
 */
export class RemoteChapterSource implements ChapterSource {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /** 모든 챕터를 서버에서 조회합니다. */
  async getAllChapters(): Promise<Chapter[]> {
    const response = await fetch(`${this.baseUrl}/all`);
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    const chapters: Chapter[] = await response.json();
    return chapters;
  }

  /** 모든 챕터 ID를 조회합니다. (엔드포인트 없으면 전체 목록에서 유도) */
  async getAllChapterIds(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ids`);
      if (response.ok) {
        const ids: string[] = await response.json();
        return ids;
      }
    } catch (_e) {
      // ignore, fallback below
    }
    const chapters = await this.getAllChapters();
    return chapters.map(c => c.id);
  }

  /** 특정 챕터를 서버에서 조회합니다. */
  async getChapterById(chapterId: string): Promise<Chapter> {
    const response = await fetch(`${this.baseUrl}/${chapterId}`);
    if (!response.ok) {
      throw new Error(`챕터 로드 실패: ${response.status}`);
    }
    const chapter: Chapter = await response.json();
    return chapter;
  }
}
