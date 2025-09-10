/**
 * 게임 전체 초기화를 위한 유틸리티 모음
 *
 * 목적
 * - 디버그 패널, 설정 화면 등에서 “전체 초기화” 기능을 간단히 호출할 수 있게 합니다.
 * - 영속 저장소(AsyncStorage, SecureStore, 자동저장)를 깨끗하게 비우고,
 *   메모리 상태를 초기화한 뒤, 초기 챕터로 재시작합니다.
 *
 * 권장 사용처
 * - 디버그 패널의 리셋 버튼
 * - 설정 화면의 “저장 데이터 초기화” 옵션
 * - 치명적 오류 후 복구 루틴
 *
 * 사용 예시
 * ```ts
 * import { useContext } from 'react';
 * import { GameStateContext } from '../../contexts/GameStateContext';
 * import { hardResetAndRestart } from '../../utils/system/ResetManager';
 *
 * const gameCtx = useContext(GameStateContext)!;
 * await hardResetAndRestart({
 *   dispatch: gameCtx.dispatch,
 *   executeChapter: gameCtx.executeChapter,
 * });
 * ```
 */
import { GAME_CONFIG, INITIAL_GAME_STATE } from '../../constants/gameConfig';
import { GameAction, Scene } from '../../types';
import { AutoSaveManager } from '../storage/AutoSaveManager';
import { clear as clearAsyncStorage } from '../storage/asyncStorage';
import { clearAllSecureData } from '../storage/secureStorage';

/**
 * 모든 영속 저장소(AsyncStorage, SecureStore, 자동저장)를 비웁니다.
 */
/**
 * 모든 영속 저장소(AsyncStorage, SecureStore, 자동저장)를 비웁니다.
 * - 주의: AsyncStorage 전체를 삭제하므로 앱의 다른 캐시/설정도 함께 삭제될 수 있습니다.
 * - 민감 정보는 SecureStore에서 별도로 삭제합니다.
 */
export async function clearAllPersistentGameData(): Promise<void> {
  try {
    await AutoSaveManager.clearAutoSave();
  } catch (_e) {
    // ignore
  }
  try {
    await clearAsyncStorage();
  } catch (_e) {
    // ignore
  }
  try {
    await clearAllSecureData();
  } catch (_e) {
    // ignore
  }
}

/**
 * 메모리 내 게임 상태를 초기 상태로 되돌립니다.
 * - 리듀서에 `LOAD_SAVED_PROGRESS`로 초기 상태를 주입합니다.
 * - 씬 엔진의 내부 캐시는 GameStateContext 쪽 흐름에 따라 갱신됩니다.
 * @param dispatch GameStateContext의 dispatch
 */
export function resetGameStateInMemory(
  dispatch: React.Dispatch<GameAction>
): void {
  dispatch({ type: 'LOAD_SAVED_PROGRESS', savedProgress: INITIAL_GAME_STATE });
}

/**
 * 초기 챕터를 명시적으로 실행해 시작 씬으로 이동합니다.
 * - `startGame()`은 사전에 챕터가 등록되어 있어야 동작합니다.
 * - 초기화 직후는 챕터가 비어있을 수 있으므로 `executeChapter(initial_chapter_id)`를 사용합니다.
 * @param executeChapter GameStateContext의 executeChapter
 */
export async function restartGameAtInitialChapter(
  executeChapter: (chapterId: string) => Promise<Scene | null>
): Promise<void> {
  await executeChapter(GAME_CONFIG.initial_chapter_id);
}

/**
 * 하드 리셋: 저장소 전체 삭제 → 메모리 상태 리셋 → 초기 챕터 재시작
 * - UI 버튼 등에서 이 함수 하나만 호출하면 전체 초기화가 일관되게 수행됩니다.
 */
export async function hardResetAndRestart(params: {
  dispatch: React.Dispatch<GameAction>;
  executeChapter: (chapterId: string) => Promise<Scene | null>;
}): Promise<void> {
  await clearAllPersistentGameData();
  resetGameStateInMemory(params.dispatch);
  await restartGameAtInitialChapter(params.executeChapter);
}
