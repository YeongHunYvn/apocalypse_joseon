import { StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SPACING,
} from '../constants/theme';

import { GameState } from '../types';

interface ItemsDisplayProps {
  state: GameState;
}

/**
 * 플레이어가 보유한 아이템들을 카드 형태로 표시하는 컴포넌트입니다.
 * 아이템의 이름, 설명, 수량, 지속성(영구/일시) 정보를 제공합니다.
 * 아이템이 없는 경우 아무것도 렌더링하지 않습니다.
 * @param state - 현재 게임 상태
 */
export default function ItemsDisplay({ state }: ItemsDisplayProps) {
  // 아이템이 없으면 표시하지 않음
  if (state.items.length === 0) {
    return null;
  }

  return (
    <View style={styles.itemsContainer}>
      <Text style={styles.itemsTitle}>아이템</Text>
      <View style={styles.itemsList}>
        {state.items.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              {item.quantity && item.quantity > 1 && (
                <View style={styles.quantityBadge}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
              )}
            </View>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <View style={styles.itemMeta}>
              <View
                style={[
                  styles.persistBadge,
                  {
                    backgroundColor: item.persist
                      ? COLORS.success
                      : COLORS.warning,
                  },
                ]}
              >
                <Text style={styles.persistText}>
                  {item.persist ? '영구' : '일시'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemsContainer: {
    marginBottom: SPACING.md,
  },
  itemsTitle: {
    ...FONT_STYLES.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    ...FONT_SIZES.sm,
  },
  itemsList: {
    gap: SPACING.sm,
  },
  itemCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  itemName: {
    ...FONT_STYLES.semiBold,
    color: COLORS.text,
    flex: 1,
    ...FONT_SIZES.body,
  },
  quantityBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  quantityText: {
    ...FONT_STYLES.bold,
    color: COLORS.white,
    ...FONT_SIZES.xs,
  },
  itemDescription: {
    ...FONT_STYLES.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    ...FONT_SIZES.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  persistBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  persistText: {
    ...FONT_STYLES.regular,
    color: COLORS.white,
    ...FONT_SIZES.xs,
  },
});
