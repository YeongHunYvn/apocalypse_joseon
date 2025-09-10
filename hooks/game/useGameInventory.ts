import {
  addItem as addItemAction,
  changeResource,
  removeItem as removeItemAction,
} from '../../contexts/GameStateActions';
import { Item, ResourceKey, UseGameInventoryReturn } from '../../types';

import { useCallback } from 'react';
import { useGameState } from './useGameState';

/**
 * 게임 자원 및 아이템 관리를 담당하는 Hook입니다.
 * 자원(골드, 체력 등)과 인벤토리 아이템 관련 액션을 제공합니다.
 * @returns 자원 및 아이템 관련 액션 함수들
 */
export function useGameInventory(): UseGameInventoryReturn {
  const { dispatch } = useGameState();

  /**
   * 자원(체력, 정신력 등)을 업데이트합니다.
   * @param resource 업데이트할 자원 타입
   * @param value 설정할 값
   */
  const updateResource = useCallback(
    (resource: ResourceKey, value: number) => {
      dispatch(changeResource(resource, value));
    },
    [dispatch]
  );

  /**
   * 아이템을 인벤토리에 추가합니다.
   * @param item 추가할 아이템
   */
  const addItem = useCallback(
    (item: Item) => {
      dispatch(addItemAction(item));
    },
    [dispatch]
  );

  /**
   * 아이템을 인벤토리에서 제거합니다.
   * @param itemId 제거할 아이템 ID
   */
  const removeItem = useCallback(
    (itemId: string) => {
      dispatch(removeItemAction(itemId));
    },
    [dispatch]
  );

  return {
    updateResource,
    addItem,
    removeItem,
  };
}
