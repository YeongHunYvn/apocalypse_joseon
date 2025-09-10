import { Chapter, Scene, SceneId } from '../../types';
import { Logger } from '../system/Logger';

import { ChapterService } from '../chapterService';

/**
 * 챕터 관리자
 * 챕터 로딩, 캐싱, 전환을 담당합니다.
 */
export class ChapterManager {
  private chapters: Map<string, Chapter> = new Map();
  private chapterService: ChapterService | null;

  constructor(chapterService?: ChapterService) {
    this.chapterService = chapterService || null;
  }

  /**
   * 챕터 서비스를 설정합니다.
   * @param chapterService - 설정할 챕터 서비스 인스턴스
   */
  setChapterService(chapterService: ChapterService): void {
    this.chapterService = chapterService;
  }

  /**
   * 챕터를 등록합니다.
   * 챕터를 내부 맵에 저장하고, 씬 ID → 챕터 ID 매핑 캐시를 업데이트합니다.
   * @param chapter - 등록할 챕터
   */
  registerChapter(chapter: Chapter): void {
    Logger.info(
      '[ChapterManager]',
      `씬 챕터 등록: ${chapter.id} (${chapter.scenes.length}개 씬)`
    );

    // 1. 챕터를 내부 맵에 저장
    this.chapters.set(chapter.id, chapter);

    Logger.debug('[ChapterManager]', `챕터 등록 완료: ${chapter.id}`);
  }

  /**
   * 챕터 서비스를 통해 챕터를 동적으로 로드하고 등록합니다.
   * @param chapterId - 로드할 챕터 ID
   * @returns 로드된 챕터 또는 null
   */
  async loadAndRegisterChapter(chapterId: string): Promise<Chapter | null> {
    if (!this.chapterService) {
      Logger.error('[ChapterManager]', '챕터 서비스가 설정되지 않았습니다.');
      return null;
    }

    try {
      Logger.debug('[ChapterManager]', `챕터 동적 로드 시작: ${chapterId}`);
      const chapter = await this.chapterService.loadChapter(chapterId);
      this.registerChapter(chapter);

      // 다음 챕터 미리 로드
      if (chapter.next_chapter_id) {
        this.chapterService.preloadChapter(chapter.next_chapter_id);
      }

      Logger.info('[ChapterManager]', `챕터 로드 및 등록 완료: ${chapterId}`);
      return chapter;
    } catch (error) {
      Logger.error('[ChapterManager]', `챕터 로드 실패: ${chapterId}`, error);
      return null;
    }
  }

  /**
   * 챕터 전환을 위한 내부 함수
   * @param chapterId - 전환할 챕터 ID
   * @param targetSceneId - 전환할 씬 ID (선택사항)
   * @param gameState - 게임 상태 (필터링에 필요, 선택사항)
   * @param options - 전환 옵션
   * @returns 전환된 씬 또는 null
   */
  async transitionToChapter(
    chapterId: string,
    targetSceneId?: string,
    gameState?: any,
    options?: {
      skipPreload?: boolean;
      forceSync?: boolean;
      customLogging?: boolean;
      preserveCache?: boolean;
    }
  ): Promise<Scene | null> {
    const logPrefix = options?.customLogging ? '🔄 챕터 전환' : '🔄 챕터 이동';
    Logger.info(
      '[ChapterManager]',
      `${logPrefix} 시작: ${chapterId}${targetSceneId ? ` -> ${targetSceneId}` : ''}`
    );

    // 1. 챕터 미리 로드 (성능 최적화 보존)
    if (!options?.skipPreload && this.chapterService) {
      this.chapterService.preloadChapter(chapterId);
    }

    // 2. 챕터 로드 (등록되지 않은 경우)
    let chapter = this.chapters.get(chapterId);
    if (!chapter) {
      Logger.debug('[ChapterManager]', `챕터 ${chapterId} 동적 로드 시도...`);
      const loadedChapter = await this.loadAndRegisterChapter(chapterId);
      if (!loadedChapter) {
        Logger.error(
          '[ChapterManager]',
          `챕터를 찾을 수 없습니다: ${chapterId}`
        );
        return null;
      }
      chapter = loadedChapter;
    }

    Logger.info(
      '[ChapterManager]',
      `${logPrefix} 완료: ${chapter.id} (${chapter.type}, ${chapter.floor}층)`
    );

    // 3. 씬 선택 및 반환
    if (targetSceneId) {
      // 특정 씬으로 이동
      const scene = chapter.scenes.find(s => s.id === targetSceneId);
      if (!scene) {
        Logger.warn(
          '[ChapterManager]',
          `챕터 ${chapterId}에서 씬 ${targetSceneId}를 찾을 수 없습니다.`
        );
        return null;
      }
      return scene;
    } else {
      // gameState가 제공된 경우 필터링된 랜덤 씬 선택 사용
      if (gameState) {
        const { SceneSelector } = await import('./SceneSelector');
        const sceneSelector = new SceneSelector();

        // 현재 챕터 내 씬 배열을 사용해 필터링된 랜덤 씬 선택
        const selectedScene =
          await sceneSelector.selectRandomFromCurrentChapter(
            chapter,
            gameState
          );

        if (selectedScene) {
          Logger.debug(
            '[ChapterManager]',
            `필터링된 랜덤 씬 선택: ${selectedScene.id}`
          );
          return selectedScene;
        }

        Logger.warn(
          '[ChapterManager]',
          '필터링된 랜덤 선택 실패, 단순 랜덤 선택으로 fallback'
        );
      }

      // gameState가 없거나 필터링된 선택이 실패한 경우 단순 랜덤 선택
      const randomIndex = Math.floor(Math.random() * chapter.scenes.length);
      const selectedScene = chapter.scenes[randomIndex];
      Logger.debug(
        '[ChapterManager]',
        `단순 랜덤 씬 선택: ${selectedScene.id}`
      );
      return selectedScene;
    }
  }

  /**
   * 챕터 전환을 위한 동기 버전
   * @param chapterId - 전환할 챕터 ID
   * @returns 전환된 씬 또는 null
   */
  transitionToChapterSync(chapterId: string): Scene | null {
    const chapter = this.chapters.get(chapterId);
    if (!chapter) {
      Logger.error('[ChapterManager]', `챕터를 찾을 수 없습니다: ${chapterId}`);
      return null;
    }

    Logger.info(
      '[ChapterManager]',
      `🔄 챕터 이동: ${chapter.id} (${chapter.type}, ${chapter.floor}층)`
    );

    // 챕터 내에서 랜덤 씬 선택
    const randomIndex = Math.floor(Math.random() * chapter.scenes.length);
    return chapter.scenes[randomIndex];
  }

  /**
   * 특정 챕터를 실행합니다.
   * @param chapterId - 실행할 챕터 ID
   * @param gameState - 게임 상태 (선택사항)
   * @returns 선택된 씬 또는 null
   */
  async executeChapter(
    chapterId: string,
    gameState?: any
  ): Promise<Scene | null> {
    Logger.info('[ChapterManager]', `씬 챕터 실행 시작: ${chapterId}`);
    return await this.transitionToChapter(chapterId, undefined, gameState, {
      customLogging: true,
      skipPreload: false,
    });
  }

  /**
   * 챕터 내 특정 씬으로 이동합니다.
   * @param chapterId - 챕터 ID
   * @param sceneId - 씬 ID
   * @param gameState - 게임 상태 (선택사항)
   * @returns 씬 또는 null
   */
  async moveToChapterScene(
    chapterId: string,
    sceneId: string,
    gameState?: any
  ): Promise<Scene | null> {
    return await this.transitionToChapter(chapterId, sceneId, gameState, {
      customLogging: true,
      skipPreload: false,
    });
  }

  /**
   * 현재 챕터 내에서 특정 씬으로 이동합니다.
   * @param sceneId - 씬 ID
   * @param currentChapter - 현재 챕터
   * @returns 씬 또는 null
   */
  async moveToSceneInCurrentChapter(
    sceneId: string,
    currentChapter: Chapter | null
  ): Promise<Scene | null> {
    if (!currentChapter) {
      Logger.error('[ChapterManager]', '현재 챕터가 설정되지 않았습니다.');
      return null;
    }

    const scene = currentChapter.scenes.find(s => s.id === sceneId);
    if (!scene) {
      Logger.warn(
        '[ChapterManager]',
        `현재 챕터 ${currentChapter.id}에서 씬 ${sceneId}를 찾을 수 없습니다.`
      );
      return null;
    }

    return scene;
  }

  /**
   * 챕터 ID로 챕터를 가져옵니다.
   * @param chapterId - 챕터 ID
   * @returns 챕터 또는 null
   */
  getChapter(chapterId: string): Chapter | null {
    return this.chapters.get(chapterId) || null;
  }

  /**
   * 씬 ID로 챕터를 찾습니다.
   * @param sceneId - 씬 ID
   * @returns 챕터 또는 null
   */
  findChapterBySceneId(_sceneId: SceneId): Chapter | null {
    // 전역 ID 역탐색은 제거됨. 호출부에서 chapterId를 명시하세요.
    return null;
  }

  /**
   * 씬 ID에 해당하는 챕터 ID를 업데이트합니다.
   * @param sceneId - 씬 ID
   */
  updateCurrentChapterForScene(sceneId: SceneId): void {
    // 캐시 기반 역탐색은 제거되었습니다. 현재 챕터는 호출부에서 명시적으로 설정됩니다.
    Logger.debug(
      '[ChapterManager]',
      `updateCurrentChapterForScene(no-op): ${sceneId}`
    );
  }

  /**
   * 챕터 캐시를 무효화합니다.
   */
  invalidateChapterCache(): void {
    Logger.info('[ChapterManager]', '챕터 캐시 무효화 완료');
  }

  /**
   * 특정 씬의 캐시를 무효화합니다.
   * @param sceneId - 씬 ID
   */
  invalidateSceneCache(_sceneId: SceneId): void {
    Logger.debug('[ChapterManager]', '씬 캐시 무효화 호출(무시됨)');
  }

  /**
   * 캐시 통계를 반환합니다.
   * @returns 캐시 통계
   */
  getCacheStats(): {
    cacheSize: number;
    totalChapters: number;
    totalScenes: number;
  } {
    let totalScenes = 0;
    this.chapters.forEach(chapter => {
      totalScenes += chapter.scenes.length;
    });

    return {
      cacheSize: 0,
      totalChapters: this.chapters.size,
      totalScenes,
    };
  }

  /**
   * 모든 챕터를 반환합니다.
   * @returns 챕터 맵
   */
  getAllChapters(): Map<string, Chapter> {
    return this.chapters;
  }

  /**
   * 디버그 정보를 출력합니다.
   */
  debugInfo(): void {
    const stats = this.getCacheStats();
    Logger.debug('[ChapterManager]', '=== 디버그 정보 ===');
    Logger.debug('[ChapterManager]', `총 챕터 수: ${stats.totalChapters}`);
    Logger.debug('[ChapterManager]', `총 씬 수: ${stats.totalScenes}`);
    Logger.debug('[ChapterManager]', `캐시 크기: ${stats.cacheSize}`);

    this.chapters.forEach((chapter, id) => {
      Logger.debug(
        '[ChapterManager]',
        `- ${id}: ${chapter.scenes.length}개 씬`
      );
    });
    Logger.debug('[ChapterManager]', '====================');
  }
}
