import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SPACING,
} from '../../../constants/theme';

interface StoryErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * 스토리 화면의 에러 상태를 렌더링하는 컴포넌트입니다.
 * 에러 메시지와 재시도 버튼을 표시합니다.
 * @param message - 표시할 에러 메시지
 * @param onRetry - 재시도 버튼 클릭 핸들러
 */
export default function StoryError({
  message = '씬을 로드할 수 없습니다.',
  onRetry,
}: StoryErrorProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    ...FONT_SIZES.body,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    ...FONT_STYLES.regular,
    ...FONT_SIZES.body,
  },
});
