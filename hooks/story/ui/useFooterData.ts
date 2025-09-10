import { useMemo } from 'react';
import { GameState } from '../../../types';
import {
  getAllSkillsAsArray,
  getBuffById,
  getItemById,
} from '../../../utils/dataLoader';

export interface FooterGridLikeItem {
  id: string;
  label: string;
  badge?: number | string;
}

/**
 * 푸터 패널에 표시할 데이터 어댑터 훅
 * - GameState를 받아 아이템/스킬/상태 목록을 3열 그리드에 맞는 형태로 변환합니다.
 */
export function useFooterData(state: GameState | undefined | null) {
  /** 상태(버프) 목록 변환 */
  const buffItems: FooterGridLikeItem[] = useMemo(() => {
    const buffIds = state?.buffs ?? [];
    return buffIds.map(id => ({
      id,
      label: getBuffById(id)?.displayName || id,
    }));
  }, [state?.buffs]);

  /** 아이템 목록 변환 */
  const itemItems: FooterGridLikeItem[] = useMemo(() => {
    const items = state?.items ?? [];
    return items.map(it => {
      const meta = getItemById(it.id);
      return {
        id: it.id,
        label: meta?.name || it.id,
        badge: typeof it.quantity === 'number' ? it.quantity : undefined,
      } as FooterGridLikeItem;
    });
  }, [state?.items]);

  /** 스킬 목록 변환 (레벨>0인 스킬의 현재 랭크 이름 표기) */
  const skillItems: FooterGridLikeItem[] = useMemo(() => {
    const skillsMeta = getAllSkillsAsArray();
    const skillIdSet = new Set(skillsMeta.map(s => s.id));
    const entries = Object.entries(state?.levels || {});

    return entries
      .filter(
        ([key, level]) =>
          skillIdSet.has(key) && typeof level === 'number' && level > 0
      )
      .map(([key, level]) => {
        const meta = skillsMeta.find(s => s.id === key);
        const rankIndex = Math.max(
          0,
          Math.min((meta?.ranks?.length || 1) - 1, (level as number) - 1)
        );
        const rankName =
          meta?.ranks?.[rankIndex]?.name || meta?.displayName || key;
        return { id: key, label: rankName } as FooterGridLikeItem;
      });
  }, [state?.levels]);

  return { buffItems, itemItems, skillItems };
}
