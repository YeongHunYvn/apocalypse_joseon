import {
  BuffKey,
  ExperienceEffects,
  FlagKey,
  GameAction,
  Item,
  ResourceKey,
  Scene,
  StatKey,
} from '../types';

/**
 * 능력치 변경 액션을 생성합니다.
 * @param stat - 변경할 능력치
 * @param value - 변경할 값
 * @returns 능력치 변경 액션
 */
export const changeStat = (stat: StatKey, value: number): GameAction => ({
  type: 'CHANGE_STAT',
  stat,
  value,
});

/**
 * 자원 변경 액션을 생성합니다.
 * @param resource - 변경할 자원
 * @param value - 변경할 값
 * @returns 자원 변경 액션
 */
export const changeResource = (
  resource: ResourceKey,
  value: number
): GameAction => ({
  type: 'CHANGE_RESOURCE',
  resource,
  value,
});

/**
 * 상태 추가 액션을 생성합니다.
 * @param buff - 추가할 상태
 * @returns 상태 추가 액션
 */
export const addBuff = (buff: BuffKey): GameAction => ({
  type: 'ADD_BUFF',
  buff,
});

/**
 * 상태 제거 액션을 생성합니다.
 * @param buff - 제거할 상태
 * @returns 상태 제거 액션
 */
export const removeBuff = (buff: BuffKey): GameAction => ({
  type: 'REMOVE_BUFF',
  buff,
});

/**
 * 플래그 설정 액션을 생성합니다.
 * @param flag - 설정할 플래그
 * @returns 플래그 설정 액션
 */
export const setFlag = (flag: FlagKey): GameAction => ({
  type: 'SET_FLAG',
  flag,
});

/**
 * 플래그 해제 액션을 생성합니다.
 * @param flag - 해제할 플래그
 * @returns 플래그 해제 액션
 */
export const unsetFlag = (flag: FlagKey): GameAction => ({
  type: 'UNSET_FLAG',
  flag,
});

/**
 * 아이템 추가 액션을 생성합니다.
 * @param item - 추가할 아이템
 * @returns 아이템 추가 액션
 */
export const addItem = (item: Item): GameAction => ({
  type: 'ADD_ITEM',
  item,
});

/**
 * 아이템 제거 액션을 생성합니다.
 * @param itemId - 제거할 아이템 ID
 * @returns 아이템 제거 액션
 */
export const removeItem = (itemId: string): GameAction => ({
  type: 'REMOVE_ITEM',
  itemId,
});

/**
 * 통합 경험치 시스템으로 경험치를 적용하는 액션을 생성합니다.
 * @param effects - 적용할 경험치 효과 (양수: 추가, 음수: 감소)
 * @returns 경험치 적용 액션
 */
export const applyExperience = (effects: ExperienceEffects): GameAction => ({
  type: 'APPLY_EXPERIENCE',
  effects,
});

/**
 * 수동 레벨업 액션을 생성합니다.
 * @param experienceTypes - 레벨업할 경험치 타입 목록
 * @returns 수동 레벨업 액션
 */
export const manualLevelUp = (experienceTypes: string[]): GameAction => ({
  type: 'MANUAL_LEVEL_UP',
  experienceTypes,
});

/**
 * 층 설정 액션을 생성합니다.
 * @param floor - 설정할 층
 * @returns 층 설정 액션
 */
export const setFloor = (floor: number): GameAction => ({
  type: 'SET_FLOOR',
  floor,
});

/**
 * 사망 횟수 증가 액션을 생성합니다.
 * @returns 사망 횟수 증가 액션
 */
export const incrementDeathCount = (): GameAction => ({
  type: 'INCREMENT_DEATH_COUNT',
});

/**
 * 특정 층 사망 횟수 증가 액션을 생성합니다.
 * @param floor - 사망한 층
 * @returns 층별 사망 횟수 증가 액션
 */
export const incrementFloorDeathCount = (floor: number): GameAction => ({
  type: 'INCREMENT_FLOOR_DEATH_COUNT',
  floor,
});

/**
 * 완료된 씬 추가 액션을 생성합니다.
 * @param sceneId - 완료된 씬 ID
 * @returns 완료된 씬 추가 액션
 */
export const addCompletedScene = (sceneId: string): GameAction => ({
  type: 'ADD_COMPLETED_SCENE',
  sceneId,
});

/**
 * 씬을 완료 처리합니다.
 * @param sceneId - 완료할 씬 ID
 */
export const completeScene = (sceneId: string): GameAction => ({
  type: 'ADD_COMPLETED_SCENE',
  sceneId,
});

/**
 * 챕터 전환 시 완료된 씬 목록을 초기화합니다.
 * 새로운 챕터에서 랜덤 씬 선택이 제대로 작동하도록 합니다.
 */
export const resetChapterCompletedScenes = (): GameAction => ({
  type: 'RESET_CHAPTER_COMPLETED_SCENES',
});

/**
 * 실패 후 리셋 액션을 생성합니다.
 * @returns 실패 후 리셋 액션
 */
export const resetAfterFailure = (): GameAction => ({
  type: 'RESET_AFTER_FAILURE',
});

/**
 * 씬 로드 액션을 생성합니다.
 * @param scene - 로드할 씬
 * @returns 씬 로드 액션
 */
export const loadScene = (scene: Scene): GameAction => ({
  type: 'LOAD_SCENE',
  scene,
});
