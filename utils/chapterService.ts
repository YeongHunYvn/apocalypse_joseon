import localChapters from '../assets/chapters';
import { Chapter } from '../types';
import { Logger } from './system/Logger';
import { isChapter } from './typeGuards';

/**
 * 챕터 서비스 인터페이스
 */
export interface ChapterService {
  loadChapter(chapterId: string): Promise<Chapter>;
  loadAllChapters(): Promise<Chapter[]>;
  preloadChapter(chapterId: string): Promise<void>;
  getCachedChapter(chapterId: string): Chapter | null;
  clearCache(): Promise<void>;
}

/**
 * 서버 API 기반 챕터 서비스
 */
export class ServerChapterService implements ChapterService {
  private cache: Map<string, Chapter> = new Map();
  private loadingPromises: Map<string, Promise<Chapter>> = new Map();
  private baseUrl: string;

  constructor(baseUrl: string = '/api/chapters') {
    this.baseUrl = baseUrl;
  }

  /**
   * 서버에서 특정 챕터를 로드합니다.
   * 캐시된 데이터가 있으면 캐시를 사용하고, 없으면 서버에서 새로 가져옵니다.
   * @param chapterId - 로드할 챕터 ID
   * @returns 로드된 챕터 데이터
   */
  async loadChapter(chapterId: string): Promise<Chapter> {
    // 캐시 확인
    const cached = this.cache.get(chapterId);
    if (cached) {
      Logger.debug('[ChapterService]', `캐시된 챕터 사용: ${chapterId}`);
      return cached;
    }

    // 이미 로딩 중인지 확인
    const loadingPromise = this.loadingPromises.get(chapterId);
    if (loadingPromise) {
      Logger.debug(
        '[ChapterService]',
        `이미 로딩 중인 챕터 대기: ${chapterId}`
      );
      return loadingPromise;
    }

    // 서버에서 로드
    const loadPromise = this.fetchChapterFromServer(chapterId);
    this.loadingPromises.set(chapterId, loadPromise);

    try {
      const chapter = await loadPromise;
      this.cache.set(chapterId, chapter);
      this.loadingPromises.delete(chapterId);
      Logger.info('[ChapterService]', `챕터 로드 완료: ${chapterId}`);
      return chapter;
    } catch (error) {
      this.loadingPromises.delete(chapterId);
      throw error;
    }
  }

  /**
   * 서버에서 모든 챕터를 한 번에 로드합니다.
   * 로드된 챕터들은 캐시에 저장되어 이후 빠른 접근이 가능합니다.
   * @returns 모든 챕터 데이터 배열
   */
  async loadAllChapters(): Promise<Chapter[]> {
    try {
      const response = await fetch(`${this.baseUrl}/all`);
      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const chapters: Chapter[] = await response.json();

      // 캐시에 저장
      chapters.forEach(chapter => {
        this.cache.set(chapter.id, chapter);
      });

      Logger.info(
        '[ChapterService]',
        `모든 챕터 로드 완료: ${chapters.length}개`
      );
      return chapters;
    } catch (error) {
      Logger.error('[ChapterService]', '모든 챕터 로드 실패:', error);
      throw error;
    }
  }

  /**
   * 챕터를 백그라운드에서 미리 로드합니다.
   * 사용자가 해당 챕터에 도달했을 때 빠른 로딩을 위해 사용됩니다.
   * @param chapterId - 미리 로드할 챕터 ID
   */
  async preloadChapter(chapterId: string): Promise<void> {
    if (this.cache.has(chapterId) || this.loadingPromises.has(chapterId)) {
      return; // 이미 로드됨 또는 로딩 중
    }

    Logger.debug('[ChapterService]', `챕터 미리 로드 시작: ${chapterId}`);
    this.loadChapter(chapterId).catch(error => {
      Logger.warn(
        '[ChapterService]',
        `챕터 미리 로드 실패: ${chapterId}`,
        error
      );
    });
  }

  /**
   * 캐시에서 특정 챕터를 가져옵니다.
   * 캐시에 없으면 null을 반환합니다.
   * @param chapterId - 가져올 챕터 ID
   * @returns 캐시된 챕터 또는 null
   */
  getCachedChapter(chapterId: string): Chapter | null {
    return this.cache.get(chapterId) || null;
  }

  /**
   * 모든 캐시된 챕터 데이터를 삭제합니다.
   * 메모리 정리나 강제 새로고침 시 사용됩니다.
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.loadingPromises.clear();
    Logger.info('[ChapterService]', '챕터 캐시 클리어됨');
  }

  /**
   * 서버 API에서 특정 챕터 데이터를 가져옵니다.
   * 내부적으로만 사용되는 private 메서드입니다.
   * @param chapterId - 가져올 챕터 ID
   * @returns 서버에서 받은 챕터 데이터
   */
  private async fetchChapterFromServer(chapterId: string): Promise<Chapter> {
    try {
      const response = await fetch(`${this.baseUrl}/${chapterId}`);
      if (!response.ok) {
        throw new Error(`챕터 로드 실패: ${response.status}`);
      }

      const chapter: Chapter = await response.json();
      Logger.debug('[ChapterService]', `서버에서 챕터 로드: ${chapterId}`);
      return chapter;
    } catch (error) {
      Logger.error('[ChapterService]', `챕터 로드 실패: ${chapterId}`, error);
      throw error;
    }
  }
}

/**
 * 개발용 로컬 챕터 서비스 (서버 없이 테스트용)
 */
export class LocalChapterService implements ChapterService {
  private cache: Map<string, Chapter> = new Map();
  private persistentCacheLoaded = false;

  constructor() {
    this.initializeCache();
  }

  /**
   * 로컬 챕터 데이터를 캐시에 미리 로드하고 검증합니다.
   * 더미 JSON 파일들에서 Chapter 타입에 맞는 데이터만 필터링하여 캐시에 저장
   */
  private async initializeCache(): Promise<void> {
    // 1. 저장소에서 캐시된 챕터 데이터 로드 시도
    await this.loadPersistentCache();

    // 2. 로컬 파일에서 챕터 데이터 로드 및 캐시 업데이트
    const localLoadedIds = new Set<string>();
    Object.values(localChapters).forEach((chapterData: unknown) => {
      if (isChapter(chapterData)) {
        if (this.cache.has(chapterData.id)) {
          // 캐시→로컬 덮어쓰기(의도됨)는 debug로 강등, 로컬 내부 중복만 warn 유지
          if (localLoadedIds.has(chapterData.id)) {
            Logger.warn(
              '[ChapterService]',
              `로컬 챕터 중복 감지: ${chapterData.id}. 이전 로컬 데이터를 덮어씁니다.`
            );
          } else if (this.persistentCacheLoaded) {
            Logger.debug(
              '[ChapterService]',
              `중복된 챕터 ID 감지(캐시→로컬 덮어쓰기, 의도됨): ${chapterData.id}`
            );
          } else {
            Logger.warn(
              '[ChapterService]',
              `중복된 챕터 ID를 감지했습니다: ${chapterData.id}. 기존 챕터를 덮어씁니다.`
            );
          }
        }
        this.cache.set(chapterData.id, chapterData);
        localLoadedIds.add(chapterData.id);
      } else {
        Logger.warn(
          '유효하지 않은 챕터 형식의 파일이 발견되어 건너뜁니다:',
          chapterData
        );
      }
    });

    // 3. 업데이트된 캐시를 저장소에 저장
    await this.savePersistentCache();
    Logger.info(
      '[ChapterService]',
      `로컬 챕터 ${this.cache.size}개 캐시 완료.`
    );
  }

  /**
   * 저장소에서 챕터 캐시를 로드합니다.
   */
  private async loadPersistentCache(): Promise<void> {
    try {
      const { store: _store, retrieve } = await import('./storage');
      const cachedChapters =
        await retrieve<Record<string, Chapter>>('chapter_cache');

      if (cachedChapters) {
        Object.entries(cachedChapters).forEach(([id, chapter]) => {
          if (isChapter(chapter)) {
            this.cache.set(id, chapter);
          }
        });
        Logger.info(
          '[ChapterService]',
          `💾 저장소에서 ${Object.keys(cachedChapters).length}개 챕터 캐시 로드됨`
        );
        this.persistentCacheLoaded = true;
      }
    } catch (error) {
      Logger.warn('[ChapterService]', '챕터 캐시 로드 실패:', error);
    }
  }

  /**
   * 챕터 캐시를 저장소에 저장합니다.
   */
  private async savePersistentCache(): Promise<void> {
    try {
      const { store } = await import('./storage');
      const cacheObject = Object.fromEntries(this.cache);
      await store('chapter_cache', cacheObject);
      Logger.info(
        '[ChapterService]',
        `💾 ${this.cache.size}개 챕터 캐시 저장됨`
      );
    } catch (error) {
      Logger.warn('[ChapterService]', '챕터 캐시 저장 실패:', error);
    }
  }

  /**
   * 로컬 JSON 파일에서 특정 챕터를 로드합니다.
   * 개발 및 테스트 환경에서 서버 없이 사용할 수 있습니다.
   * @param chapterId - 로드할 챕터 ID
   * @returns 로드된 챕터 데이터
   */
  async loadChapter(chapterId: string): Promise<Chapter> {
    const chapter = this.cache.get(chapterId);
    if (chapter) {
      Logger.debug('[ChapterService]', `로컬 캐시에서 챕터 로드: ${chapterId}`);
      return Promise.resolve(chapter);
    } else {
      Logger.error('[ChapterService]', `챕터를 찾을 수 없습니다: ${chapterId}`);
      return Promise.reject(new Error(`알 수 없는 챕터 ID: ${chapterId}`));
    }
  }

  /**
   * 로컬 JSON 파일에서 모든 챕터를 로드합니다.
   * 개발 환경에서 사용되는 모든 챕터를 한 번에 가져옵니다.
   * @returns 모든 챕터 데이터 배열
   */
  async loadAllChapters(): Promise<Chapter[]> {
    return Promise.resolve(Array.from(this.cache.values()));
  }

  /**
   * 로컬 환경에서 챕터를 미리 로드합니다.
   * 로컬에서는 즉시 로드되므로 실제로는 preload 기능이 없습니다.
   * @param chapterId - 미리 로드할 챕터 ID
   */
  async preloadChapter(chapterId: string): Promise<void> {
    if (!this.cache.has(chapterId)) {
      Logger.warn(
        '[ChapterService]',
        `미리 로드하려는 챕터를 찾을 수 없음: ${chapterId}`
      );
    }
    return Promise.resolve();
  }

  /**
   * 로컬 캐시에서 특정 챕터를 가져옵니다.
   * @param chapterId - 가져올 챕터 ID
   * @returns 캐시된 챕터 또는 null
   */
  getCachedChapter(chapterId: string): Chapter | null {
    return this.cache.get(chapterId) || null;
  }

  /**
   * 로컬 캐시를 클리어합니다.
   * 메모리 정리 시 사용됩니다.
   */
  async clearCache(): Promise<void> {
    this.cache.clear();

    // 저장소의 persistent 캐시도 삭제
    try {
      const { remove } = await import('./storage');
      await remove('chapter_cache');
      Logger.info('[ChapterService]', '💾 저장소 챕터 캐시도 삭제됨');
    } catch (error) {
      Logger.warn('[ChapterService]', '저장소 챕터 캐시 삭제 실패:', error);
    }

    await this.initializeCache();
    Logger.info('[ChapterService]', '로컬 챕터 캐시 클리어 후 재초기화 완료.');
  }
}

/**
 * 챕터 서비스 팩토리
 * 개발 환경과 프로덕션 환경에 따라 적절한 챕터 서비스를 생성합니다.
 */
export class ChapterServiceFactory {
  private static instance: ChapterService | null = null;

  /**
   * 환경에 따라 적절한 챕터 서비스를 생성합니다.
   * 싱글톤 패턴으로 구현되어 동일한 환경에서는 하나의 인스턴스만 반환합니다.
   * @param useServer - 서버 API 사용 여부 (true: ServerChapterService, false: LocalChapterService)
   * @param baseUrl - 서버 API 기본 URL (useServer가 true일 때만 사용)
   * @returns 생성된 챕터 서비스 인스턴스
   */
  static create(useServer: boolean = false, baseUrl?: string): ChapterService {
    // 이미 생성된 인스턴스가 있으면 반환
    if (this.instance) {
      return this.instance;
    }

    Logger.info(
      '[ChapterServiceFactory]',
      `${useServer ? 'Server' : 'Local'} 챕터 서비스 생성 시작`
    );

    // 새 인스턴스 생성
    if (useServer) {
      this.instance = new ServerChapterService(baseUrl);
    } else {
      this.instance = new LocalChapterService();
    }

    Logger.info(
      '[ChapterServiceFactory]',
      `${useServer ? 'Server' : 'Local'} 챕터 서비스 생성 완료`
    );
    return this.instance;
  }

  /**
   * 캐시된 인스턴스를 제거합니다. (테스트용)
   */
  static reset(): void {
    this.instance = null;
  }
}
