// /utils/scene/effects/handlers/RestRoomEffectHandler.ts

import { GameState, Item } from '../../../../types';
import {
  getAllSkillsAsArray,
  getAllVariableIds,
  getBuffById,
  getVariableById,
} from '../../../dataLoader';
import { Logger } from '../../../system/Logger';

/**
 * 'rest_room_cleanup' 특수 효과를 처리합니다.
 * 휴식방에 도착했을 때, 일시적인 상태들을 정리합니다.
 * - `temporary: true`인 상태 제거
 * - `persist: false`인 아이템 제거
 * - `persist: false`인 변수를 기본값으로 초기화
 *
 * @param gameState - 현재 게임 상태
 * @returns 정리 작업이 완료된 새로운 게임 상태
 */
export function handleRestRoomCleanup(gameState: GameState): GameState {
  Logger.info('[EffectHandler]', '특수 효과 처리: rest_room_cleanup');

  // temporary: true 인 상태 필터링
  const newBuffs = gameState.buffs.filter(buffKey => {
    const buffInfo = getBuffById(buffKey);
    return buffInfo && !buffInfo.temporary;
  });

  // persist: false 인 아이템 필터링
  const newItems = gameState.items.filter((item: Item) => item.persist);

  // persist: false 인 변수를 기본값으로 초기화
  const newVariables = { ...gameState.variables };
  const allVariableIds = getAllVariableIds();

  let resetCount = 0;
  for (const variableId of allVariableIds) {
    const variableData = getVariableById(variableId);
    if (variableData && !variableData.persist) {
      const oldValue = newVariables[variableId] ?? variableData.defaultValue;
      newVariables[variableId] = variableData.defaultValue;

      if (oldValue !== variableData.defaultValue) {
        Logger.info(
          '[EffectHandler]',
          `변수 초기화: ${variableId} ${oldValue} → ${variableData.defaultValue}`
        );
        resetCount++;
      }
    }
  }

  // persist: false 인 스킬의 레벨/경험치 초기화
  const newLevels = { ...(gameState.levels || {}) };
  const newExperience = { ...(gameState.experience || {}) };
  try {
    const skills = getAllSkillsAsArray();
    let skillResetCount = 0;
    skills.forEach(skill => {
      if (skill.persist) return; // 유지 스킬은 건너뜀
      if (
        (newLevels[skill.id] || 0) !== 0 ||
        (newExperience[skill.id] || 0) !== 0
      ) {
        newLevels[skill.id] = 0;
        newExperience[skill.id] = 0;
        skillResetCount++;
      }
    });
    if (skillResetCount > 0) {
      Logger.info(
        '[EffectHandler]',
        `🔄 휴식방에서 ${skillResetCount}개 스킬이 초기화되었습니다.`
      );
    }
  } catch (e) {
    Logger.warn('[EffectHandler]', '스킬 초기화 중 오류(휴식방):', e);
  }

  if (resetCount > 0) {
    Logger.info(
      '[EffectHandler]',
      `🔄 휴식방에서 ${resetCount}개 변수가 초기화되었습니다.`
    );
  }

  return {
    ...gameState,
    buffs: newBuffs,
    items: newItems,
    variables: newVariables,
    // 휴식방 정리에서는 완료된 씬도 초기화하여 새 챕터/씬 흐름에서 랜덤 선택이 제대로 동작하도록 함
    completed_scenes: [],
    // 방문 누계 초기화 (휴식방에서 리셋)
    scene_count: 0,
    levels: newLevels,
    experience: newExperience,
  };
}
