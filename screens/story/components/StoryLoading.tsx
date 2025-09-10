import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../../constants/theme';

interface StoryLoadingProps {
  message?: string;
}

/**
 * 스토리 화면의 로딩 상태를 렌더링하는 컴포넌트입니다.
 * 로딩 인디케이터와 메시지를 표시합니다.
 * @param message - 표시할 로딩 메시지
 */
export default function StoryLoading({
  message = '로딩 중...',
}: StoryLoadingProps) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size='large' color={COLORS.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.md,
    ...FONT_SIZES.body,
  },
});
