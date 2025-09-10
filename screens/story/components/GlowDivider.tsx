import { Image } from 'expo-image';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Divide from '../../../assets/images/ui/divide.webp';
import { SPACING } from '../../../constants/theme';

interface GlowDividerProps {
  /** 하단 간격 (기본: SPACING.sm) */
  marginBottom?: number;
  /** 추가 컨테이너 스타일 */
  style?: ViewStyle;
  /** (옵션) 커스텀 이미지 소스, 기본 divide.webp */
  source?: number;
  /** 이미지 높이(px), 기본 12 */
  height?: number;
}

export default function GlowDivider({
  marginBottom = SPACING.sm,
  style,
  source,
  height = 12,
}: GlowDividerProps) {
  return (
    <View style={[{ marginBottom }, style]} pointerEvents='none'>
      <Image
        source={source ?? Divide}
        style={[styles.image, { height }]}
        contentFit='fill'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
  },
});
