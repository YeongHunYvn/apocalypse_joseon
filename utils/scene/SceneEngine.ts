import { Chapter, Choice, GameState, Scene, SceneId } from '../../types';

import { GAME_CONFIG } from '../../constants/gameConfig';
import { SYSTEM_FLAGS } from '../../constants/systemFlags';
import { GameAction } from '../../types';
import { ChapterService } from '../chapterService';
import { Logger } from '../system/Logger';
import { ChapterManager } from './ChapterManager';
import { ChapterTransitionManager } from './ChapterTransitionManager';
import { GameOverHandler } from './GameOverHandler';
import { GameStateUpdater } from './GameStateUpdater';
import { ProbabilityCalculator } from './probability/ProbabilityCalculator';
import { SceneFilter } from './SceneFilter';
import { SceneSelector } from './SceneSelector';

/**
 * 씬 엔진 상태
 */
export type EngineState = {
  currentScene: Scene | null;
  currentChapter: Chapter | null;
  gameState: GameState;
  allScenes: Map<SceneId, Scene>;
  chapters: Map<string, Chapter>;
  chapterService: ChapterService | null;
  dispatch?: React.Dispatch<GameAction>; // dispatch 함수 추가
};

/**
 * 씬 흐름 제어 엔진
 * 분리된 모듈들을 통합하여 씬 흐름을 제어합니다.
 */
export class SceneEngine {
  private state: EngineState;
  private chapterManager: ChapterManager;
  private sceneSelector: SceneSelector;
  private gameStateUpdater: GameStateUpdater;
  private gameOverHandler: GameOverHandler;
  private chapterTransitionManager: ChapterTransitionManager;

  /**
   * 씬 엔진을 초기화합니다.
   * @param initialGameState - 초기 게임 상태
   * @param chapterService - 챕터 서비스 (선택사항)
   */
  constructor(initialGameState: GameState, chapterService?: ChapterService) {
    this.state = {
      currentScene: null,
      currentChapter: null,
      gameState: initialGameState,
      allScenes: new Map(),
      chapters: new Map(),
      chapterService: chapterService || null,
      dispatch: undefined, // 초기에는 undefined
    };

    // 모듈들 초기화
    this.chapterManager = new ChapterManager(chapterService);
    this.sceneSelector = new SceneSelector();
    this.gameStateUpdater = new GameStateUpdater(initialGameState);
    this.gameOverHandler = new GameOverHandler(initialGameState);
    this.chapterTransitionManager = new ChapterTransitionManager(
      initialGameState
    );
  }

  /**
   * dispatch 함수를 설정합니다.
   * @param dispatch - React dispatch 함수
   */
  setDispatch(dispatch: React.Dispatch<GameAction>): void {
    this.state.dispatch = dispatch;
    this.chapterTransitionManager.setDispatch(dispatch);
    this.gameOverHandler.setDispatch(dispatch);
  }

  /**
   * 챕터 서비스를 설정합니다.
   * @param chapterService - 설정할 챕터 서비스 인스턴스
   */
  setChapterService(chapterService: ChapterService): void {
    this.state.chapterService = chapterService;
    this.chapterManager.setChapterService(chapterService);
  }

  /**
   * 챕터를 엔진에 등록합니다.
   * ChapterManager에 챕터를 등록하고, SceneEngine의 상태도 함께 업데이트합니다.
   * @param chapter - 등록할 챕터
   */
  registerChapter(chapter: Chapter): void {
    // 1. ChapterManager에 챕터 등록 (챕터 관리 + 씬-챕터 매핑 캐시)
    this.chapterManager.registerChapter(chapter);

    // 2. SceneEngine의 챕터 맵 업데이트 (상태 동기화)
    //    주의: 챕터 스코프 설계로 전역 씬 맵은 더 이상 사용하지 않습니다.
    this.state.chapters = this.chapterManager.getAllChapters();
  }

  /**
   * 챕터 서비스를 통해 챕터를 동적으로 로드하고 등록합니다.
   * @param chapterId - 로드할 챕터 ID
   * @returns 로드된 챕터 또는 null
   */
  async loadAndRegisterChapter(chapterId: string): Promise<Chapter | null> {
    const chapter = await this.chapterManager.loadAndRegisterChapter(chapterId);
    if (chapter) {
      // 챕터 맵 업데이트만 수행 (전역 씬 맵은 사용하지 않음)
      this.state.chapters = this.chapterManager.getAllChapters();
    }
    return chapter;
  }

  /**
   * 게임을 시작합니다.
   * @param chapterId - 시작할 챕터 ID (선택사항)
   * @returns 시작 씬 또는 null
   */
  async startGame(chapterId?: string): Promise<Scene | null> {
    // 중복 호출 가드: 이미 현재 씬이 설정되어 있으면 재호출하지 않음
    if (this.state.currentScene) {
      Logger.debug(
        '[SceneEngine]',
        `게임 시작 스킵(이미 현재 씬 존재): ${this.state.currentScene.id}`
      );
      return this.state.currentScene;
    }
    Logger.info('[SceneEngine]', '게임 시작');

    // 챕터 ID가 제공된 경우 해당 챕터로 시작
    if (chapterId) {
      return await this.executeChapter(chapterId);
    }

    // 등록된 챕터가 있으면 첫 번째 챕터를 현재 챕터로 설정
    if (this.state.chapters.size > 0 && !this.state.currentChapter) {
      const firstChapter = Array.from(this.state.chapters.values())[0];
      this.state.currentChapter = firstChapter;
    }

    // 게임 시작 시 scn_game_start 씬을 우선적으로 찾아서 실행
    if (this.state.currentChapter) {
      const gameStartScene = this.state.currentChapter.scenes.find(
        scene => scene.id === GAME_CONFIG.game_start_scene_id
      );

      if (gameStartScene) {
        this.setCurrentScene(
          gameStartScene,
          this.state.currentChapter?.id || undefined
        );
        Logger.info('[SceneEngine]', `게임 시작 씬: ${gameStartScene.id}`);
        return gameStartScene;
      }

      // scn_game_start가 없는 경우 랜덤 씬 선택 (기존 동작)
      const scene = await this.sceneSelector.selectRandomFromCurrentChapter(
        this.state.currentChapter,
        this.state.gameState
      );

      if (scene) {
        this.setCurrentScene(scene, this.state.currentChapter?.id || undefined);
        Logger.info('[SceneEngine]', `게임 시작 씬: ${scene.id}`);
        return scene;
      }
    }

    Logger.error(
      '[SceneEngine]',
      '시작 씬을 찾을 수 없습니다. 챕터를 먼저 등록하거나 chapterId를 제공하세요.'
    );
    return null;
  }

  /**
   * 특정 씬을 가져옵니다. (챕터 스코프)
   * - 현재 챕터의 씬 배열에서만 탐색합니다.
   * @param sceneId - 씬 ID
   * @returns 씬 또는 null
   */
  getScene(sceneId: SceneId): Scene | null {
    // 현재 챕터 범위 내에서만 탐색
    const currentChapter = this.state.currentChapter;
    if (!currentChapter) {
      Logger.error(
        '[SceneEngine]',
        '현재 챕터가 설정되지 않아 씬을 가져올 수 없습니다.'
      );
      return null;
    }
    const scene = currentChapter.scenes.find(s => s.id === sceneId) || null;
    return scene;
  }

  /**
   * 선택지를 처리합니다.
   * @param choiceIndex - 선택한 선택지 인덱스 (필터링된 availableChoices 배열 기준)
   * @param currentScene - 현재 씬 (UI에서 전달받아 상태 동기화 보장)
   * @returns 다음 씬 또는 null
   */
  async selectChoice(
    choiceIndex: number,
    currentScene?: Scene
  ): Promise<Scene | null> {
    // 현재 씬 확인 - 매개변수로 전달받은 씬을 우선 사용
    const sceneToProcess = currentScene || this.state.currentScene;
    if (!sceneToProcess) {
      Logger.error('[SceneEngine]', '현재 씬이 없습니다.');
      return null;
    }

    // 1. 게임오버 씬에 있는 경우 게임오버 판정 건너뛰기
    const isInGameOverScene =
      sceneToProcess.id === GAME_CONFIG.game_over_scene_id;

    // 2. 게임오버 상태 확인 (게임오버 씬이 아닐 때만)
    if (!isInGameOverScene && this.isGameOver()) {
      Logger.info(
        '[SceneEngine]',
        '게임오버 상태에서 선택이 시도되었습니다. 게임오버 씬으로 이동합니다.'
      );
      return this.moveToGameOverScene();
    }

    Logger.debug('[SceneEngine]', `선택지 처리 대상 씬: ${sceneToProcess.id}`);

    // UI와 동일한 필터링 로직 적용 - 조건에 맞는 선택지만 가져오기
    const availableChoices = SceneFilter.getAvailableChoices(
      sceneToProcess,
      this.state.gameState
    );

    const choice = availableChoices[choiceIndex];
    if (!choice) {
      Logger.error(
        '[SceneEngine]',
        `필터링된 선택지 ${choiceIndex}가 존재하지 않습니다. 사용 가능한 선택지 수: ${availableChoices.length}`
      );
      Logger.error('[SceneEngine]', `처리 대상 씬: ${sceneToProcess.id}`);
      Logger.error(
        '[SceneEngine]',
        `사용 가능한 선택지:`,
        availableChoices.map(c => c.text)
      );
      return null;
    }

    Logger.debug('[SceneEngine]', `선택지 선택: ${choice.text}`);

    // 확률 분기 처리
    if (choice.probability) {
      return await this.handleProbabilityChoice(choice);
    }

    // 일반 선택지 처리
    return await this.handleChoiceMove(choice);
  }

  /**
   * 확률 분기 선택지를 처리합니다.
   * @param choice - 확률 분기 선택지
   * @returns 다음 씬 또는 null
   */
  private async handleProbabilityChoice(choice: Choice): Promise<Scene | null> {
    if (!choice.probability) {
      Logger.error('[SceneEngine]', '확률 정보가 없습니다.');
      return null;
    }

    const next = ProbabilityCalculator.processProbability(
      choice.probability,
      this.state.gameState
    );

    // next가 undefined일 수 있으므로 안전하게 처리
    if (!next) {
      Logger.error('[SceneEngine]', '확률 분기 결과가 없습니다.');
      return null;
    }

    Logger.debug(
      '[SceneEngine]',
      `확률 분기 결과: ${next.chapter_id || next.scene_id ? '성공' : '실패'}`
    );

    return await this.handleChoiceMove(choice, next);
  }

  /**
   * 선택지 이동을 처리합니다.
   * @param choice - 선택지
   * @param next - 다음 이동 정보 (선택사항)
   * @returns 다음 씬 또는 null
   */
  private async handleChoiceMove(
    choice: Choice,
    next?: { chapter_id?: string; scene_id?: string }
  ): Promise<Scene | null> {
    const nextTarget = next || choice.next;

    if (!nextTarget) {
      Logger.debug(
        '[SceneEngine]',
        '다음 이동 정보가 없습니다. 랜덤 씬 선택을 시도합니다.'
      );

      // 랜덤 씬 선택 시도
      if (this.state.currentChapter) {
        const randomScene =
          await this.sceneSelector.selectRandomFromCurrentChapter(
            this.state.currentChapter,
            this.state.gameState
          );

        if (randomScene) {
          return randomScene;
        }
      }

      // 랜덤 씬 선택이 실패하면 scn_game_over로 이동
      Logger.warn(
        '[SceneEngine]',
        '랜덤 씬 선택 실패. scn_game_over로 이동합니다.'
      );
      return await this.moveToChapterScene(
        GAME_CONFIG.initial_chapter_id,
        GAME_CONFIG.game_over_scene_id
      );
    }

    // 챕터 내 특정 씬으로 이동
    if (nextTarget.chapter_id && nextTarget.scene_id) {
      // 해당 챕터가 등록되어 있지 않으면 동적 로드
      await this.ensureChapterLoaded(nextTarget.chapter_id);
      return await this.moveToChapterScene(
        nextTarget.chapter_id,
        nextTarget.scene_id
      );
    }

    // 챕터로 이동
    if (nextTarget.chapter_id) {
      // 해당 챕터가 등록되어 있지 않으면 동적 로드
      await this.ensureChapterLoaded(nextTarget.chapter_id);
      return await this.moveToChapter(nextTarget.chapter_id);
    }

    // 현재 챕터 내 씬으로 이동
    if (nextTarget.scene_id) {
      return await this.moveToSceneInCurrentChapter(nextTarget.scene_id);
    }

    // 랜덤 씬 선택
    if (this.state.currentChapter) {
      const randomScene =
        await this.sceneSelector.selectRandomFromCurrentChapter(
          this.state.currentChapter,
          this.state.gameState
        );

      if (randomScene) {
        return randomScene;
      }

      // 랜덤 씬 선택이 실패하면 scn_game_over로 이동
      Logger.warn(
        '[SceneEngine]',
        '랜덤 씬 선택 실패. scn_game_over로 이동합니다.'
      );
      return await this.moveToChapterScene(
        GAME_CONFIG.initial_chapter_id,
        GAME_CONFIG.game_over_scene_id
      );
    }

    Logger.error('[SceneEngine]', '유효한 이동 정보가 없습니다.');
    return null;
  }

  // 챕터 전환 시 자동 초기화는 제거되었습니다. 휴식방 특수 효과(rest_room_cleanup)에서 일괄 초기화합니다.

  /**
   * 해당 챕터가 로드되어 있는지 확인하고, 없으면 로드하여 등록합니다.
   * @param chapterId - 확인할 챕터 ID
   */
  private async ensureChapterLoaded(chapterId: string): Promise<void> {
    // 이미 등록된 챕터인지 확인
    if (this.state.chapters.has(chapterId)) {
      return;
    }

    Logger.info(
      '[SceneEngine]',
      `챕터 ${chapterId}를 동적으로 로드하고 등록합니다.`
    );

    // 챕터를 로드하고 등록
    const chapter = await this.loadAndRegisterChapter(chapterId);
    if (chapter) {
      Logger.info(
        '[SceneEngine]',
        `챕터 ${chapterId} 로드 및 등록 완료. 씬 수: ${chapter.scenes.length}`
      );
    } else {
      Logger.error('[SceneEngine]', `챕터 ${chapterId} 로드 실패`);
    }
  }

  /**
   * 특정 챕터의 특정 씬으로 이동합니다. (챕터 명시 이동)
   * @param chapterId - 챕터 ID
   * @param sceneId - 씬 ID
   * @returns 씬 또는 null
   */
  private async moveToChapterScene(
    chapterId: string,
    sceneId: string
  ): Promise<Scene | null> {
    // 챕터 전환 시 자동 초기화를 수행하지 않습니다. 휴식방에서 정리.

    const scene = await this.chapterManager.moveToChapterScene(
      chapterId,
      sceneId,
      this.state.gameState
    );
    if (scene) {
      this.setCurrentScene(scene, chapterId);
    }
    return scene;
  }

  /**
   * 챕터로 이동합니다. (랜덤 씬 선택)
   * @param chapterId - 챕터 ID
   * @returns 씬 또는 null
   */
  private async moveToChapter(chapterId: string): Promise<Scene | null> {
    // 챕터 전환 시 자동 초기화를 수행하지 않습니다. 휴식방에서 정리.

    const scene = await this.chapterManager.transitionToChapter(
      chapterId,
      undefined,
      this.state.gameState
    );
    if (scene) {
      this.setCurrentScene(scene, chapterId);
    }
    return scene;
  }

  /**
   * 현재 챕터 내에서 특정 씬으로 이동합니다. (챕터 스코프)
   * @param sceneId - 씬 ID
   * @returns 씬 또는 null
   */
  private async moveToSceneInCurrentChapter(
    sceneId: string
  ): Promise<Scene | null> {
    const scene = await this.chapterManager.moveToSceneInCurrentChapter(
      sceneId,
      this.state.currentChapter
    );
    if (scene) {
      this.setCurrentScene(scene, this.state.currentChapter?.id || undefined);
    }
    return scene;
  }

  /**
   * 특정 씬으로 이동합니다. (현재 챕터 스코프)
   * @param sceneId - 씬 ID
   * @returns 씬 또는 null
   */
  moveToScene(sceneId: SceneId): Scene | null {
    // 현재 챕터 범위 내에서만 탐색하여 이동
    if (!this.state.currentChapter) {
      Logger.error(
        '[SceneEngine]',
        '현재 챕터가 없어 씬으로 이동할 수 없습니다.'
      );
      return null;
    }
    const scene =
      this.state.currentChapter.scenes.find(s => s.id === sceneId) || null;
    if (scene) {
      this.setCurrentScene(scene, this.state.currentChapter.id);
    }
    return scene;
  }

  /**
   * 현재 씬을 설정하고 관련 상태를 업데이트합니다.
   * - 가급적 chapterId를 명시하여 현재 챕터를 확정합니다.
   * @param scene - 설정할 씬
   * @param chapterId - 챕터 ID (선택사항, 제공되지 않으면 역탐색 시도)
   */
  private setCurrentScene(scene: Scene, chapterId?: string): void {
    this.state.currentScene = scene;

    // 현재 챕터 업데이트
    if (chapterId) {
      this.state.currentChapter = this.chapterManager.getChapter(chapterId);
    }
  }

  /**
   * 게임 상태를 업데이트합니다.
   * @param newGameState - 새로운 게임 상태
   */
  updateGameState(newGameState: GameState): void {
    this.state.gameState = newGameState;
    this.gameStateUpdater.updateGameState(newGameState);
    this.gameOverHandler.updateGameState(newGameState);
    this.chapterTransitionManager.updateGameState(newGameState);
  }

  /**
   * 엔진 상태를 반환합니다.
   * @returns 엔진 상태
   */
  getState(): EngineState {
    return this.state;
  }

  /**
   * 현재 씬을 반환합니다.
   * @returns 현재 씬 또는 null
   */
  getCurrentScene(): Scene | null {
    return this.state.currentScene;
  }

  /**
   * 현재 게임 상태를 반환합니다.
   * @returns 현재 게임 상태
   */
  getGameState(): GameState {
    return this.state.gameState;
  }

  /**
   * 모든 씬을 반환합니다. (호환성 유지용)
   * - 전역 씬 맵은 더 이상 사용하지 않으므로, 추후 제거 예정입니다.
   * @returns 씬 맵
   */
  getAllScenes(): Map<SceneId, Scene> {
    return this.state.allScenes;
  }

  /**
   * 씬이 존재하는지 확인합니다. (현재 챕터 스코프)
   * @param sceneId - 씬 ID
   * @returns 존재 여부
   */
  hasScene(sceneId: SceneId): boolean {
    if (!this.state.currentChapter) return false;
    return this.state.currentChapter.scenes.some(s => s.id === sceneId);
  }

  /**
   * 주어진 씬 ID 목록에서 랜덤하게 씬을 선택합니다. (현재 챕터 스코프)
   * @param sceneIds - 씬 ID 배열
   * @returns 선택된 씬 또는 null
   */
  selectRandomScene(sceneIds: SceneId[]): Scene | null {
    if (!this.state.currentChapter) {
      Logger.error(
        '[SceneEngine]',
        '현재 챕터가 없어 랜덤 씬을 선택할 수 없습니다.'
      );
      return null;
    }
    const scenes = this.state.currentChapter.scenes.filter(s =>
      sceneIds.includes(s.id)
    );
    return this.sceneSelector.selectRandomFromScenes(
      scenes,
      this.state.gameState
    );
  }

  /**
   * 현재 챕터에서 랜덤하게 씬을 선택합니다. (챕터 스코프)
   * @returns 선택된 씬 또는 null
   */
  async selectRandomFromCurrentChapter(): Promise<Scene | null> {
    return await this.sceneSelector.selectRandomFromCurrentChapter(
      this.state.currentChapter,
      this.state.gameState
    );
  }

  /**
   * 주어진 씬 ID 목록에서 랜덤하게 씬을 선택하고 이동합니다. (현재 챕터 스코프)
   * @param sceneIds - 씬 ID 배열
   * @returns 선택된 씬 또는 null
   */
  moveToRandomScene(sceneIds: SceneId[]): Scene | null {
    if (!this.state.currentChapter) {
      Logger.error(
        '[SceneEngine]',
        '현재 챕터가 없어 랜덤 씬으로 이동할 수 없습니다.'
      );
      return null;
    }
    const scenes = this.state.currentChapter.scenes.filter(s =>
      sceneIds.includes(s.id)
    );
    const scene = this.sceneSelector.selectRandomFromScenes(
      scenes,
      this.state.gameState
    );
    if (scene) {
      this.setCurrentScene(scene, this.state.currentChapter.id);
    }
    return scene;
  }

  /**
   * 현재 챕터를 반환합니다.
   * @returns 현재 챕터 또는 null
   */
  getCurrentChapter(): Chapter | null {
    return this.state.currentChapter;
  }

  /**
   * 챕터 ID로 챕터를 가져옵니다.
   * @param chapterId - 챕터 ID
   * @returns 챕터 또는 null
   */
  getChapter(chapterId: string): Chapter | null {
    return this.chapterManager.getChapter(chapterId);
  }

  /**
   * 특정 챕터를 실행합니다.
   * 챕터가 등록되지 않은 경우 자동으로 로드하고, 랜덤 씬을 선택합니다.
   * @param chapterId - 실행할 챕터 ID
   * @returns 선택된 씬 또는 null
   */
  async executeChapter(chapterId: string): Promise<Scene | null> {
    Logger.info('[SceneEngine]', `씬 챕터 실행 시작: ${chapterId}`);

    // 해당 챕터가 등록되어 있지 않으면 동적 로드
    await this.ensureChapterLoaded(chapterId);

    // 챕터 전환 시 자동 초기화를 수행하지 않습니다. 휴식방에서 정리.

    const scene = await this.chapterManager.executeChapter(
      chapterId,
      this.state.gameState
    );
    if (scene) {
      this.setCurrentScene(scene, chapterId);
    }
    return scene;
  }

  /**
   * 게임오버 여부를 확인합니다.
   * @returns 게임오버 여부
   */
  isGameOver(): boolean {
    return this.gameOverHandler.isGameOver();
  }

  /**
   * 게임오버 씬으로 이동합니다. (챕터 지정 이동)
   * - 전역 탐색을 사용하지 않고, 설정된 챕터로 명시 이동합니다.
   * @returns 게임오버 씬 또는 null
   */
  async moveToGameOverScene(): Promise<Scene | null> {
    // 사망 횟수 증가 (체력/정신력 0으로 인한 게임오버 시)
    this.incrementDeathCountOnGameOver();

    // 게임오버 태그 제거
    this.resetGameOverState();

    // 게임오버 씬으로 이동 또는 다른 로직 처리
    const gameOverSceneId = GAME_CONFIG.game_over_scene_id;
    const gameOverChapterId = GAME_CONFIG.initial_chapter_id; // 최소한 초기 챕터를 폴백으로 사용
    if (gameOverSceneId) {
      return await this.moveToChapterScene(gameOverChapterId, gameOverSceneId);
    }

    Logger.error('[SceneEngine]', '게임오버 씬 ID가 설정되지 않았습니다.');
    return null;
  }

  /**
   * 게임오버 시 사망 횟수를 증가시킵니다.
   * force_gameover 플래그가 이미 설정된 경우에는 중복 증가를 방지합니다.
   */
  private incrementDeathCountOnGameOver(): void {
    // force_gameover 플래그가 이미 설정되어 있으면 이미 사망 횟수가 증가했으므로 스킵
    if (
      this.gameOverHandler.isGameOver() &&
      this.state.gameState.flags.includes(SYSTEM_FLAGS.FORCE_GAMEOVER)
    ) {
      Logger.info(
        '[SceneEngine]',
        '💀 force_gameover로 인한 사망은 이미 처리됨 (중복 방지)'
      );
      return;
    }

    // 체력/정신력 부족으로 인한 게임오버의 경우 사망 횟수 증가
    const gameOverReason = this.gameOverHandler.getGameOverReason();
    if (gameOverReason === '체력 부족' || gameOverReason === '정신력 부족') {
      Logger.info(
        '[SceneEngine]',
        `💀 ${gameOverReason}으로 인한 사망 처리 시작`
      );

      // dispatch를 통해 사망 횟수 증가
      if (this.state.dispatch) {
        this.state.dispatch({ type: 'INCREMENT_DEATH_COUNT' });

        const newDeathCount = this.state.gameState.death_count + 1;
        const currentFloorDeaths =
          (this.state.gameState.death_count_by_floor[
            this.state.gameState.current_floor
          ] || 0) + 1;

        Logger.info(
          '[SceneEngine]',
          `💀 사망 횟수 증가: 전체 ${newDeathCount}회, ${this.state.gameState.current_floor}층에서 ${currentFloorDeaths}회`
        );
      } else {
        Logger.warn(
          '[SceneEngine]',
          '💀 dispatch가 설정되지 않아 사망 횟수를 증가시킬 수 없습니다.'
        );
      }
    }
  }

  /**
   * 게임오버 상태를 초기화합니다.
   */
  resetGameOverState(): void {
    this.gameOverHandler.resetGameOverState();
  }

  /**
   * 디버그 정보를 출력합니다.
   */
  debugInfo(): void {
    Logger.debug('[SceneEngine]', '=== SceneEngine 디버그 정보 ===');
    Logger.debug(
      '[SceneEngine]',
      `현재 씬: ${this.state.currentScene?.id || '없음'}`
    );
    Logger.debug(
      '[SceneEngine]',
      `현재 챕터: ${this.state.currentChapter?.id || '없음'}`
    );
    Logger.debug('[SceneEngine]', `총 씬 수: ${this.state.allScenes.size}`);
    Logger.debug('[SceneEngine]', `총 챕터 수: ${this.state.chapters.size}`);

    // 각 모듈의 디버그 정보 출력
    this.chapterManager.debugInfo();
    this.sceneSelector.debugInfo();
    this.gameStateUpdater.debugInfo();
    this.gameOverHandler.debugInfo();

    Logger.debug('[SceneEngine]', '================================');
  }
}
