import { Chapter, GameState, Scene } from '../types';

import { ChapterServiceFactory } from './chapterService';
import { SceneEngine } from './sceneEngine';
import { Logger } from './system/Logger';

// 챕터 서비스 인스턴스 (환경에 따라 설정)
Logger.info('[SceneLoader]', '📌 ChapterService 생성 요청');
const chapterService = ChapterServiceFactory.create(
  process.env.NODE_ENV === 'production', // 프로덕션에서는 서버 사용
  process.env.REACT_APP_API_BASE_URL || '/api/chapters'
);

// 전역 씬 캐시는 챕터 스코프 설계에서 사용하지 않습니다.

// 모든 챕터의 씬을 전역 Map으로 합치는 함수는 제거되었습니다.

/**
 * 모든 챕터를 로드합니다.
 * 챕터 서비스를 통해 모든 챕터 데이터를 가져옵니다.
 * @returns 챕터 배열
 */
export async function loadAllChapters(): Promise<Chapter[]> {
  Logger.info('[SceneLoader]', '챕터 데이터 로딩 시작...');
  const chapters = await chapterService.loadAllChapters();
  Logger.info(
    '[SceneLoader]',
    `총 ${chapters.length}개의 챕터가 로드되었습니다.`
  );
  return chapters;
}

/**
 * 특정 챕터의 씬들만 로드합니다.
 * @param chapterId - 로드할 챕터 ID
 * @returns 해당 챕터의 씬 배열
 */
export async function loadChapterScenes(chapterId: string): Promise<Scene[]> {
  const chapter = await chapterService.loadChapter(chapterId);
  return chapter.scenes;
}

/**
 * 특정 챕터의 전체 데이터를 로드합니다.
 * @param chapterId - 로드할 챕터 ID
 * @returns 챕터 데이터
 */
export async function loadChapter(chapterId: string): Promise<Chapter> {
  return await chapterService.loadChapter(chapterId);
}

/**
 * 챕터를 백그라운드에서 미리 로드합니다.
 * 사용자가 해당 챕터에 도달했을 때 빠른 로딩을 위해 사용됩니다.
 * @param chapterId - 미리 로드할 챕터 ID
 */
export async function preloadChapter(chapterId: string): Promise<void> {
  await chapterService.preloadChapter(chapterId);
}

/**
 * 캐시에서 특정 챕터를 가져옵니다.
 * @param chapterId - 가져올 챕터 ID
 * @returns 캐시된 챕터 또는 null
 */
export function getCachedChapter(chapterId: string): Chapter | null {
  return chapterService.getCachedChapter(chapterId);
}

/**
 * 모든 씬을 배열 형태로 반환합니다.
 * 캐시된 데이터가 있으면 캐시를 사용합니다.
 * @returns 씬 배열
 */
// 모든 씬 배열 반환 함수는 제거되었습니다.

/**
 * 씬 엔진을 초기화하고 모든 씬을 등록합니다.
 * 기존 방식으로 모든 씬을 한 번에 로드하여 엔진에 등록합니다.
 * @param initialGameState - 초기 게임 상태
 * @returns 초기화된 씬 엔진
 */
export async function initializeSceneEngine(
  initialGameState: GameState
): Promise<SceneEngine> {
  Logger.info('[SceneLoader]', '씬 엔진 초기화 시작...');

  const sceneEngine = new SceneEngine(initialGameState);

  // 모든 챕터 로드 및 등록
  const chapters = await loadAllChapters();
  chapters.forEach(chapter => {
    sceneEngine.registerChapter(chapter);
  });

  Logger.info('[SceneLoader]', '씬 엔진 초기화 완료');
  return sceneEngine;
}

/**
 * 챕터 기반으로 씬 엔진을 초기화합니다.
 * 초기 챕터만 로드하고, 다음 챕터는 미리 로드하여 성능을 최적화합니다.
 * @param initialGameState - 초기 게임 상태
 * @param initialChapterId - 초기 챕터 ID
 * @returns 초기화된 씬 엔진
 */
export async function initializeChapterBasedSceneEngine(
  initialGameState: GameState,
  initialChapterId: string
): Promise<SceneEngine> {
  Logger.info('[SceneLoader]', '챕터 기반 씬 엔진 초기화 시작...');

  const sceneEngine = new SceneEngine(initialGameState);

  // 초기 챕터 로드 및 등록
  const initialChapter = await loadChapter(initialChapterId);
  sceneEngine.registerChapter(initialChapter);

  // 다음 챕터 미리 로드
  if (initialChapter.next_chapter_id) {
    preloadChapter(initialChapter.next_chapter_id);
  }

  Logger.info('[SceneLoader]', '챕터 기반 씬 엔진 초기화 완료');
  return sceneEngine;
}
