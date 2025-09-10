import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, FONT_STYLES, SPACING } from '../constants/theme';

import { memo } from 'react';
import { RESOURCE_KEYS, RESOURCES } from '../constants/gameConfig';
import { GameState } from '../types';
import { Icon } from './icons/Icon';

interface ResourcesDisplayProps {
  state: GameState;
}

/**
 * 플레이어의 리소스(체력, 정신력, 재화 등)를 아이콘으로 표시하는 컴포넌트입니다.
 * 한 줄에 3등분하여 각 자원을 배치합니다.
 * 성능 최적화: React.memo로 자원 변경 시에만 리렌더링
 * @param state - 현재 게임 상태
 */
function ResourcesDisplay({ state }: ResourcesDisplayProps) {
  return (
    <View style={styles.resourcesContainer}>
      {RESOURCE_KEYS.map(resourceKey => {
        const currentValue = state[resourceKey];
        const resource = RESOURCES[resourceKey];
        const maxValue = resource.maxValue;
        const icons = [];

        // 최대값만큼 아이콘 생성 (현재값은 기본 색상, 나머지는 투명도 50%)
        for (let i = 0; i < maxValue; i++) {
          const isActive = i < currentValue;
          icons.push(
            <Icon
              key={`${resourceKey}-${i}`}
              name={resourceKey}
              size={resourceKey === 'gold' ? 21 : 24}
              style={[
                !isActive ? { opacity: 0.2 } : null,
                i > 0 ? { marginLeft: -7 } : null,
              ]}
            />
          );
        }

        return (
          <View key={resourceKey} style={styles.resourceSection}>
            <Text style={styles.resourceLabel}>{resource.displayName}</Text>
            <View style={styles.iconsContainer}>{icons}</View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * React.memo 적용: 모든 자원이 변경되었을 때만 리렌더링
 * 성능 최적화를 위해 개별 자원만 비교
 */
export default memo(ResourcesDisplay, (prevProps, nextProps) => {
  return RESOURCE_KEYS.every(
    resourceKey => prevProps.state[resourceKey] === nextProps.state[resourceKey]
  );
});

const styles = StyleSheet.create({
  resourcesContainer: {
    flex: 1, // 부모 높이를 꽉 채움
    flexDirection: 'row', // 가로로 배치
    justifyContent: 'space-between', // 3등분 배치
    alignItems: 'stretch', // 자식 요소들이 부모 높이에 맞춤
    marginRight: SPACING.md,
  },
  resourceSection: {
    flex: 1,
    alignItems: 'center', // 가로 중앙 정렬
    justifyContent: 'center', // 세로 중앙 정렬
  },
  resourceLabel: {
    flex: 1,
    color: COLORS.text,
    ...FONT_STYLES.semiBold,
    ...FONT_SIZES.xs,
  },
  iconsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // 아이콘들 중앙 정렬
    gap: 0, // 겹치기를 위해 간격 제거
  },
});
