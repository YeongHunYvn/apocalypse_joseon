import { GAME_CONFIG, RESOURCES } from '../constants/gameConfig';
import { GameAction, GameState } from '../types';
import { Logger } from '../utils/system/Logger';

import { getTemporaryBuffs } from '../utils/dataLoader';
import { ExperienceManager } from '../utils/ExperienceManager';
import { removeGameOverFlags } from '../utils/gameOverUtils';
import { EffectApplier } from '../utils/scene/effects/EffectApplier';
import { VisitedScenesManager } from '../utils/scene/VisitedScenesManager';

// 상수 정의
const STAT_MAX_VALUE = 10;
const RESOURCE_MAX_VALUES = Object.fromEntries(
  Object.entries(RESOURCES).map(([key, resource]) => [key, resource.maxValue])
) as Record<keyof typeof RESOURCES, number>;

/**
 * 씬 완료 상태를 처리합니다.
 * @param state - 현재 게임 상태
 * @param sceneId - 씬 ID
 * @returns 업데이트된 게임 상태
 */
function handleSceneCompletion(state: GameState, sceneId: string): GameState {
  const isAlreadyCompleted = state.completed_scenes.includes(sceneId);

  if (!isAlreadyCompleted) {
    return {
      ...state,
      completed_scenes: [...state.completed_scenes, sceneId],
    };
  }

  return state;
}

/**
 * 방문 이력을 처리합니다.
 * @param state - 현재 게임 상태
 * @param sceneId - 씬 ID
 * @returns 업데이트된 게임 상태
 */
function handleVisitedScenes(state: GameState, sceneId: string): GameState {
  const updatedVisitedScenes = VisitedScenesManager.markAsVisited(
    sceneId,
    state
  );
  return {
    ...state,
    visited_scenes: updatedVisitedScenes,
  };
}

/**
 * 최초 방문 여부에 따라 씬 효과를 적용합니다.
 * 최초 방문: initial_effects가 있으면 effects 대체, 없으면 effects 사용
 * 재방문: 항상 effects + special_effects
 * @param state - 현재 게임 상태
 * @param scene - 씬 데이터
 * @param isFirstVisit - 최초 방문 여부
 * @returns 효과가 적용된 게임 상태
 */
function applySceneEffects(
  state: GameState,
  scene: any,
  isFirstVisit: boolean
): GameState {
  // 1단계: 어떤 메인 효과를 사용할지 결정
  const mainEffects =
    isFirstVisit && scene.initial_effects
      ? scene.initial_effects
      : scene.effects;

  // 2단계: special_effects는 effects/initial_effects 내부에만 배치 (루트 지원 제거)
  const combinedEffects = {
    ...(mainEffects || {}),
  };

  // 3단계: 적용할 효과가 있는지 확인하고 적용
  const visitType = isFirstVisit ? '최초 방문' : '재방문';
  const visitIcon = isFirstVisit ? '🌟' : '🔄';

  if (mainEffects) {
    const effectType =
      isFirstVisit && scene.initial_effects ? 'initial_effects' : 'effects';
    Logger.debug(
      '[Reducer]',
      `${visitIcon} 씬 ${visitType}: ${scene.id} - ${effectType} 적용`
    );
    return EffectApplier.applyEffects(combinedEffects, state);
  } else {
    Logger.debug(
      '[Reducer]',
      `${visitIcon} 씬 ${visitType}: ${scene.id} - 적용할 효과 없음`
    );
    return state;
  }
}

/**
 * 게임 상태 리듀서입니다.
 * 모든 게임 상태 변경 로직을 처리합니다.
 * @param state - 현재 게임 상태
 * @param action - 수행할 액션
 * @returns 새로운 게임 상태
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'CHANGE_STAT':
      return {
        ...state,
        [action.stat]: Math.max(
          0,
          Math.min(STAT_MAX_VALUE, state[action.stat] + action.value)
        ),
      };

    case 'CHANGE_RESOURCE':
      const maxValue = RESOURCE_MAX_VALUES[action.resource];
      return {
        ...state,
        [action.resource]: Math.max(
          0,
          Math.min(maxValue, state[action.resource] + action.value)
        ),
      };

    case 'ADD_BUFF':
      return {
        ...state,
        buffs: (state.buffs ?? []).includes(action.buff)
          ? (state.buffs ?? [])
          : [...(state.buffs ?? []), action.buff],
      };

    case 'REMOVE_BUFF':
      return {
        ...state,
        buffs: (state.buffs ?? []).filter(buff => buff !== action.buff),
      };

    case 'SET_FLAG':
      return {
        ...state,
        flags: (state.flags ?? []).includes(action.flag)
          ? (state.flags ?? [])
          : [...(state.flags ?? []), action.flag],
      };

    case 'UNSET_FLAG':
      return {
        ...state,
        flags: (state.flags ?? []).filter(flag => flag !== action.flag),
      };

    case 'ADD_ITEM':
      const safeItems = state.items ?? [];
      const existingItem = safeItems.find(item => item.id === action.item.id);
      if (existingItem && action.item.quantity) {
        return {
          ...state,
          items: safeItems.map(item =>
            item.id === action.item.id
              ? {
                  ...item,
                  quantity: (item.quantity || 1) + action.item.quantity!,
                }
              : item
          ),
        };
      } else {
        return {
          ...state,
          items: [
            ...safeItems,
            { ...action.item, quantity: action.item.quantity || 1 },
          ],
        };
      }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: (state.items ?? []).filter(item => item.id !== action.itemId),
      };

    case 'APPLY_EXPERIENCE':
      return ExperienceManager.applyExperience(state, action.effects);

    case 'MANUAL_LEVEL_UP':
      return ExperienceManager.processManualLevelUps(
        state,
        action.experienceTypes
      );

    case 'SET_FLOOR':
      return {
        ...state,
        current_floor: action.floor,
      };

    case 'INCREMENT_DEATH_COUNT':
      return {
        ...state,
        death_count: state.death_count + 1,
        death_count_by_floor: {
          ...state.death_count_by_floor,
          [state.current_floor]:
            (state.death_count_by_floor[state.current_floor] || 0) + 1,
        },
      };

    case 'INCREMENT_FLOOR_DEATH_COUNT':
      return {
        ...state,
        death_count_by_floor: {
          ...state.death_count_by_floor,
          [action.floor]: (state.death_count_by_floor[action.floor] || 0) + 1,
        },
      };

    case 'ADD_COMPLETED_SCENE':
      return {
        ...state,
        completed_scenes: (state.completed_scenes ?? []).includes(
          action.sceneId
        )
          ? (state.completed_scenes ?? [])
          : [...(state.completed_scenes ?? []), action.sceneId],
      };

    case 'RESET_CHAPTER_COMPLETED_SCENES':
      return {
        ...state,
        completed_scenes: [], // 챕터 전환 시 완료된 씬 목록 초기화
      };

    case 'RESET_AFTER_FAILURE':
      // 체력과 정신력을 초기값으로 회복
      // 층 한정 아이템 제거 (persist: false인 아이템들)
      // 일시적 상태들 제거
      // 게임오버 플래그들도 제거 (중요!)
      return {
        ...state,
        health: GAME_CONFIG.initial_health,
        mind: GAME_CONFIG.initial_mind,
        items: (state.items ?? []).filter(item => item.persist),
        buffs: (state.buffs ?? []).filter(
          buff => !getTemporaryBuffs().includes(buff)
        ),
        flags: removeGameOverFlags(state.flags ?? []), // 게임오버 플래그 제거 추가
      };

    case 'LOAD_SCENE':
      // 씬 정보 추출
      const sceneId = action.scene.id;

      // 🌟 최초 방문 여부 확인 (visited_scenes 추가 전에 확인)
      const isFirstVisit = VisitedScenesManager.isFirstVisit(sceneId, state);

      // 씬 완료 상태 처리
      let newState = handleSceneCompletion(state, sceneId);

      // 방문 이력 처리
      newState = handleVisitedScenes(newState, sceneId);

      // 방문 누계 증가 (복원 제외)
      newState = {
        ...newState,
        scene_count: (newState.scene_count || 0) + 1,
      };

      // 효과 적용
      return applySceneEffects(newState, action.scene, isFirstVisit);

    case 'RESTORE_SCENE':
      // 복원 시에는 효과를 적용하지 않음 (이미 저장된 상태에 효과가 포함됨)
      // 방문 이력과 씬 완료 상태만 업데이트
      const restoreSceneId = action.scene.id;

      Logger.info(
        '[Reducer]',
        `🔄 씬 복원 (효과 적용 안함): ${restoreSceneId}`
      );

      // 씬 완료 상태 처리
      let restoreNewState = handleSceneCompletion(state, restoreSceneId);

      // 방문 이력 처리 (이미 방문한 씬이므로 중복 방지 필요)
      if (!restoreNewState.visited_scenes?.includes(restoreSceneId)) {
        restoreNewState = handleVisitedScenes(restoreNewState, restoreSceneId);
      }

      // 방문 누계는 복원 시 증가하지 않음
      return restoreNewState;

    case 'SYNC_VISITED_SCENES_WITH_STORAGE':
      // 주의: async 함수는 reducer에서 직접 호출할 수 없음
      // GameStateContext에서 비동기적으로 처리됨
      return state;

    case 'UPDATE_VISITED_SCENES':
      return {
        ...state,
        visited_scenes: action.visitedScenes,
      };

    case 'CLEAR_VISITED_SCENES':
      const newStateWithClearedVisited = { ...state };
      VisitedScenesManager.clearVisitedScenes(
        newStateWithClearedVisited,
        action.clearStorage || false
      );
      return newStateWithClearedVisited;

    case 'LOAD_SAVED_PROGRESS':
      // 저장된 게임 진행 상황을 현재 상태에 병합
      return {
        ...state,
        ...action.savedProgress,
        // 저장된 completed_scenes를 그대로 적용 (게임 진행 상황 복원)
      };

    default:
      return state;
  }
}
