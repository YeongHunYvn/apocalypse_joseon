import { StyleSheet, Text, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SPACING,
} from '../constants/theme';
import { getBuffById, getFlagById } from '../utils/dataLoader';

import { memo } from 'react';
import { GameState } from '../types';

interface StatusDisplayProps {
  state: GameState;
}

/**
 * 두 배열이 동일한지 비교하는 유틸리티 함수
 * 성능 최적화를 위해 얕은 비교 사용
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * 플레이어의 현재 상태(버프, 플래그)를 표시하는 컴포넌트입니다.
 * 활성화된 상태와 플래그를 시각적으로 나타내어 게임 상태를 확인할 수 있게 합니다.
 * 성능 최적화: React.memo로 상태/플래그 변경 시에만 리렌더링
 * @param state - 현재 게임 상태
 */
function StatusDisplay({ state }: StatusDisplayProps) {
  return (
    <View style={styles.statusContainer}>
      {state.buffs.length > 0 && (
        <View style={styles.buffsContainer}>
          <Text style={styles.statusTitle}>상태</Text>
          <View style={styles.buffsList}>
            {state.buffs.map(buff => (
              <View key={buff} style={styles.buffItem}>
                <Text style={styles.buffText}>
                  {getBuffById(buff)?.displayName || buff}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {state.flags.length > 0 && (
        <View style={styles.flagsContainer}>
          <Text style={styles.statusTitle}>플래그</Text>
          <View style={styles.flagsList}>
            {state.flags.map(flag => (
              <View key={flag} style={styles.flagItem}>
                <Text style={styles.flagText}>
                  {getFlagById(flag)?.displayName || flag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * React.memo 적용: 상태나 플래그가 변경되었을 때만 리렌더링
 * 성능 최적화를 위해 배열 내용 비교
 */
export default memo(StatusDisplay, (prevProps, nextProps) => {
  return (
    arraysEqual(prevProps.state.buffs, nextProps.state.buffs) &&
    arraysEqual(prevProps.state.flags, nextProps.state.flags)
  );
});

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buffsContainer: {
    flex: 1,
  },
  flagsContainer: {
    flex: 1,
  },
  statusTitle: {
    ...FONT_STYLES.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    ...FONT_SIZES.xs,
  },
  buffsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  buffItem: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  buffText: {
    ...FONT_STYLES.regular,
    color: COLORS.primary,
    ...FONT_SIZES.xs,
  },
  flagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  flagItem: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  flagText: {
    ...FONT_STYLES.regular,
    color: COLORS.success,
    ...FONT_SIZES.xs,
  },
  experienceItem: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  experienceText: {
    ...FONT_STYLES.regular,
    color: COLORS.warning,
    ...FONT_SIZES.xs,
  },
});
