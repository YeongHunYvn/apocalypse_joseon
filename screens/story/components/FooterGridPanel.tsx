import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SPACING,
} from '../../../constants/theme';

export interface FooterGridItem {
  id: string;
  label: string;
  badge?: number | string;
}

interface FooterGridPanelProps {
  /** 표시할 데이터 */
  data: FooterGridItem[];
  /** 데이터가 없을 때 표시할 문구 */
  emptyText: string;
}

export default function FooterGridPanel({
  data,
  emptyText,
}: FooterGridPanelProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={
        isEmpty ? styles.emptyGridContainer : styles.gridContainer
      }
    >
      {isEmpty ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        data.map(item => (
          <View key={item.id} style={styles.cell}>
            <Text style={styles.cellText} numberOfLines={1}>
              {item.label}
            </Text>
            {item.badge !== undefined && item.badge !== null && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{String(item.badge)}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    alignSelf: 'stretch',
  },
  gridContainer: {
    flexGrow: 1,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  emptyGridContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  emptyText: {
    color: COLORS.textSecondary,
    ...FONT_STYLES.regular,
    ...FONT_SIZES.xs,
    textAlign: 'center',
  },
  cell: {
    width: '33.3333%',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
  },
  cellText: {
    color: COLORS.text,
    ...FONT_STYLES.regular,
    ...FONT_SIZES.sm,
    textAlign: 'center',
  },
  badge: {
    marginTop: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  badgeText: {
    color: COLORS.textSecondary,
    ...FONT_STYLES.regular,
    ...FONT_SIZES.xs,
    textAlign: 'center',
  },
});
