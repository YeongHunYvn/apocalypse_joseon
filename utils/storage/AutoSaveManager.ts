import { GameState, Scene } from '../../types';
import { Logger } from '../system/Logger';
import { GameStorage } from './index';

/**
 * 자동 저장 데이터 인터페이스
 */
export interface AutoSaveData {
  /** 게임 상태 데이터 */
  gameState: GameState;
  /** 현재 씬 데이터 (불러올 때 이 씬으로 이동) */
  currentScene: Scene | null;
  /** 현재 챕터 ID (씬 복원을 위해 필요) */
  currentChapterId: string | null;
  /** 저장 날짜 및 시간 */
  savedAt: Date;
  /** 게임 버전 (호환성 확인용) */
  gameVersion?: string;
}

/**
 * 자동 저장/로드를 관리하는 클래스
 * 단순하고 안정적인 자동 저장 기능만 제공합니다.
 */
export class AutoSaveManager {
  private static readonly AUTO_SAVE_KEY = 'auto_save_game_state';
  private static readonly GAME_VERSION = '1.0.0'; // 향후 호환성 확인용

  /**
   * 게임 상태를 자동 저장합니다.
   * @param gameState - 저장할 게임 상태
   * @param currentScene - 현재 씬 (불러올 때 이 씬으로 이동)
   * @param currentChapterId - 현재 챕터 ID (씬 복원을 위해 필요)
   * @returns 저장 성공 여부
   */
  static async autoSave(
    gameState: GameState,
    currentScene: Scene | null = null,
    currentChapterId: string | null = null
  ): Promise<boolean> {
    try {
      const saveData: AutoSaveData = {
        gameState,
        currentScene,
        currentChapterId,
        savedAt: new Date(),
        gameVersion: this.GAME_VERSION,
      };

      const success = await GameStorage.saveProgress(
        this.AUTO_SAVE_KEY,
        saveData
      );

      if (success) {
        // 챕터 경계 변화 시에만 info, 그 외는 debug
        const isChapterBoundary = Boolean(currentScene && currentChapterId);
        if (isChapterBoundary) {
          Logger.info(
            '[AutoSave]',
            '💾 자동 저장 완료',
            `(씬: ${currentScene?.id}, 챕터: ${currentChapterId})`
          );
        } else {
          Logger.debug('[AutoSave]', '💾 자동 저장 완료');
        }
      } else {
        Logger.warn('[AutoSave]', '❌ 자동 저장 실패');
      }

      return success;
    } catch (error) {
      Logger.error('[AutoSave]', '자동 저장 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 자동 저장된 게임 상태와 씬을 로드합니다.
   * @returns 로드된 게임 상태, 씬, 챕터 정보 또는 null
   */
  static async loadAutoSave(): Promise<{
    gameState: GameState;
    currentScene: Scene | null;
    currentChapterId: string | null;
  } | null> {
    try {
      const saveData = await GameStorage.loadProgress<AutoSaveData>(
        this.AUTO_SAVE_KEY
      );

      if (!saveData?.gameState) {
        Logger.debug('[AutoSave]', '자동 저장 데이터가 없습니다.');
        return null;
      }

      // 게임 버전 호환성 확인 (향후 필요시 사용)
      if (saveData.gameVersion && saveData.gameVersion !== this.GAME_VERSION) {
        Logger.warn(
          '[AutoSave]',
          `게임 버전이 다릅니다. 저장된 버전: ${saveData.gameVersion}, 현재 버전: ${this.GAME_VERSION}`
        );
        // 필요시 마이그레이션 로직 추가
      }

      Logger.debug(
        '[AutoSave]',
        '💾 자동 저장 데이터 로드됨',
        saveData.currentScene
          ? `(씬: ${saveData.currentScene.id}, 챕터: ${saveData.currentChapterId})`
          : ''
      );
      return {
        gameState: saveData.gameState,
        currentScene: saveData.currentScene || null,
        currentChapterId: saveData.currentChapterId || null,
      };
    } catch (error) {
      Logger.error('[AutoSave]', '자동 저장 로드 중 오류 발생:', error);
      return null;
    }
  }

  /**
   * 자동 저장 데이터가 존재하는지 확인합니다.
   * @returns 자동 저장 데이터 존재 여부
   */
  static async hasAutoSave(): Promise<boolean> {
    try {
      const saveData = await GameStorage.loadProgress<AutoSaveData>(
        this.AUTO_SAVE_KEY
      );
      return saveData?.gameState !== undefined;
    } catch (error) {
      Logger.error('[AutoSave]', '자동 저장 존재 확인 중 오류:', error);
      return false;
    }
  }

  /**
   * 자동 저장 데이터를 삭제합니다.
   * @returns 삭제 성공 여부
   */
  static async clearAutoSave(): Promise<boolean> {
    try {
      const success = await GameStorage.removeProgress(this.AUTO_SAVE_KEY);

      if (success) {
        Logger.debug('[AutoSave]', '🗑️ 자동 저장 데이터 삭제 완료');
      } else {
        Logger.warn('[AutoSave]', '❌ 자동 저장 데이터 삭제 실패');
      }

      return success;
    } catch (error) {
      Logger.error('[AutoSave]', '자동 저장 삭제 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 자동 저장 정보를 가져옵니다 (디버깅용).
   * @returns 자동 저장 메타데이터 또는 null
   */
  static async getAutoSaveInfo(): Promise<Omit<
    AutoSaveData,
    'gameState'
  > | null> {
    try {
      const saveData = await GameStorage.loadProgress<AutoSaveData>(
        this.AUTO_SAVE_KEY
      );

      if (!saveData) {
        return null;
      }

      // gameState를 제외한 메타데이터만 반환
      const { gameState: _gameState, ...metaData } = saveData;
      return metaData;
    } catch (error) {
      Logger.error('[AutoSave]', '자동 저장 정보 조회 중 오류:', error);
      return null;
    }
  }

  /**
   * 자동 저장 시스템이 정상적으로 작동하는지 테스트합니다.
   * @param testGameState - 테스트용 게임 상태
   * @returns 테스트 성공 여부
   */
  static async testAutoSave(testGameState: GameState): Promise<boolean> {
    try {
      Logger.info('[AutoSave]', '🧪 자동 저장 시스템 테스트 시작');

      // 테스트용 씬 생성
      const testScene: Scene = {
        id: 'test_scene',
        text: '테스트용 씬입니다.',
        choices: [],
      };

      // 저장 테스트
      const saveSuccess = await this.autoSave(testGameState, testScene);

      if (!saveSuccess) {
        Logger.error('[AutoSave]', '❌ 저장 테스트 실패');
        return false;
      }

      // 로드 테스트
      const loadedData = await this.loadAutoSave();

      if (!loadedData) {
        Logger.error('[AutoSave]', '❌ 로드 테스트 실패');
        return false;
      }

      // 기본적인 데이터 일치 확인
      const isMatching =
        loadedData.gameState.health === testGameState.health &&
        loadedData.gameState.mind === testGameState.mind &&
        loadedData.gameState.gold === testGameState.gold &&
        loadedData.currentScene?.id === testScene.id;

      if (!isMatching) {
        Logger.error('[AutoSave]', '❌ 데이터 일치 테스트 실패');
        return false;
      }

      Logger.info('[AutoSave]', '✅ 자동 저장 시스템 테스트 성공');
      return true;
    } catch (error) {
      Logger.error('[AutoSave]', '❌ 자동 저장 테스트 중 오류:', error);
      return false;
    }
  }
}
