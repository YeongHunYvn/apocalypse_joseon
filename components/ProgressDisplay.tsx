import { StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SPACING,
} from '../constants/theme';

import { memo } from 'react';
import { GameState } from '../types';
import { getGameProgressStats } from '../utils/gameProgressUtils';

interface ProgressDisplayProps {
  state: GameState;
}

/**
 * 게임 진행 상태를 표시하는 컴포넌트입니다.
 * 현재 층, 사망 횟수, 완료 씬 등 게임 진행 정보를 표시합니다.
 * 성능 최적화: React.memo로 진행 상태 변경 시에만 리렌더링
 * @param state - 현재 게임 상태
 */
function ProgressDisplay({ state }: ProgressDisplayProps) {
  const _progressStats = getGameProgressStats(state);

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressTitle}>진행 상태</Text>
      <View style={styles.progressGrid}>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>현재 층</Text>
          <Text style={styles.progressValue}>{state.current_floor}</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>총 사망</Text>
          <Text style={styles.progressValue}>{state.death_count}</Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>층 사망</Text>
          <Text style={styles.progressValue}>
            {state.death_count_by_floor[state.current_floor] || 0}
          </Text>
        </View>
        <View style={styles.progressItem}>
          <Text style={styles.progressLabel}>완료 씬</Text>
          <Text style={styles.progressValue}>
            {state.completed_scenes.length}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * React.memo 적용: 진행 상태가 변경되었을 때만 리렌더링
 * 성능 최적화를 위해 진행 관련 필드들만 비교
 */
export default memo(ProgressDisplay, (prevProps, nextProps) => {
  const prevState = prevProps.state;
  const nextState = nextProps.state;

  return (
    prevState.current_floor === nextState.current_floor &&
    prevState.death_count === nextState.death_count &&
    prevState.death_count_by_floor[prevState.current_floor] ===
      nextState.death_count_by_floor[nextState.current_floor] &&
    prevState.completed_scenes.length === nextState.completed_scenes.length
  );
});

const styles = StyleSheet.create({
  progressContainer: {
    marginBottom: SPACING.md,
  },
  progressTitle: {
    color: COLORS.text,
    marginBottom: SPACING.sm,
    ...FONT_STYLES.semiBold,
    ...FONT_SIZES.sm,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  progressItem: {
    backgroundColor: COLORS.background + '80', // 80% 투명도
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  progressLabel: {
    color: COLORS.textSecondary,
    ...FONT_STYLES.light,
    ...FONT_SIZES.xs,
  },
  progressValue: {
    color: COLORS.text,
    ...FONT_STYLES.regular,
    ...FONT_SIZES.body,
  },
});
