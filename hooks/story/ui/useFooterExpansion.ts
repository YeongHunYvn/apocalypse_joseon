import { useWindowDimensions } from 'react-native';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * 스토리 푸터 확장/축소 애니메이션 훅
 */
export function useFooterExpansion() {
  const { height: windowHeight } = useWindowDimensions();
  const expandedHeight = useSharedValue(0);
  const targetExpandedHeight = Math.max(0, Math.round(windowHeight * 0.5));

  const expandedStyle = useAnimatedStyle(() => ({
    height: expandedHeight.value,
  }));

  const expand = () => {
    expandedHeight.value = withTiming(targetExpandedHeight, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  };

  const collapse = () => {
    expandedHeight.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  };

  return { expandedStyle, expand, collapse, targetExpandedHeight } as const;
}
