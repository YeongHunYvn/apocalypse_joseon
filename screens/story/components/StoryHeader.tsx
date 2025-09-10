import { StyleSheet, View } from 'react-native';
import { SPACING } from '../../../constants/theme';

import ResourcesDisplay from '../../../components/ResourcesDisplay';
import StatsDisplay from '../../../components/StatsDisplay';
import { GameState } from '../../../types';

interface StoryHeaderProps {
  state: GameState;
}

/**
 * 스토리 화면의 헤더 영역을 렌더링하는 컴포넌트입니다.
 * 좌측에 자원, 우측에 능력치를 표시합니다.
 * @param state - 현재 게임 상태
 */
export default function StoryHeader({ state }: StoryHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.contentContainer}>
        {/* 좌측: 자원 표시 */}
        <View style={styles.leftSection}>
          <ResourcesDisplay state={state} />
        </View>

        {/* 우측: 능력치 표시 (2줄 레이아웃) */}
        <View style={styles.rightSection}>
          <StatsDisplay state={state} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: SPACING.md,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
});
