import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONT_STYLES, SPACING } from '../constants/theme';

import { memo } from 'react';
import { GameState } from '../types';
import { Icon } from './icons';

interface StatsDisplayProps {
  state: GameState;
}

/**
 * 플레이어의 능력치(힘, 민첩, 지혜, 카리스마)를 2줄로 표시하는 컴포넌트입니다.
 * 첫 번째 줄: 힘+지혜, 두 번째 줄: 민첩+매력
 * 성능 최적화: React.memo로 능력치 변경 시에만 리렌더링
 * @param state - 현재 게임 상태
 */
function StatsDisplay({ state }: StatsDisplayProps) {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statItemInline}>
          <Icon name='strength' size={20} />
          <Text style={styles.statValueInline}>{state.strength}</Text>
        </View>
        <View style={styles.statItemInline}>
          <Icon name='wisdom' size={20} />
          <Text style={styles.statValueInline}>{state.wisdom}</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItemInline}>
          <Icon name='agility' size={20} />
          <Text style={styles.statValueInline}>{state.agility}</Text>
        </View>
        <View style={styles.statItemInline}>
          <Icon name='charisma' size={20} />
          <Text style={styles.statValueInline}>{state.charisma}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * React.memo 적용: 능력치가 변경되었을 때만 리렌더링
 * 성능 최적화를 위해 개별 능력치만 비교
 */
export default memo(StatsDisplay, (prevProps, nextProps) => {
  return (
    prevProps.state.strength === nextProps.state.strength &&
    prevProps.state.agility === nextProps.state.agility &&
    prevProps.state.wisdom === nextProps.state.wisdom &&
    prevProps.state.charisma === nextProps.state.charisma
  );
});

const styles = StyleSheet.create({
  statsContainer: {
    gap: SPACING.sm, // 두 줄 사이의 세로 간격
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: SPACING.md + SPACING.xs, // 각 줄 내의 가로 간격
  },
  statItemInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValueInline: {
    color: COLORS.text,
    ...FONT_STYLES.bold,
    ...FONT_SIZES.body,
    minWidth: 30,
    textAlign: 'right',
  },
});
