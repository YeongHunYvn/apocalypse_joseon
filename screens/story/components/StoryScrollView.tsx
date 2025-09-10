import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface StoryScrollViewProps {
  children: React.ReactNode;
  onScreenTouch?: () => void;
}

export interface StoryScrollViewRef {
  scrollTo: (opts: { y: number; animated?: boolean }) => void;
}

/**
 * 간단한 스토리 스크롤 뷰
 * - 제스처/롱프레스/자동 스크롤 로직 제거
 * - 현재 씬 텍스트와 선택지만 담는 단순 컨테이너
 * - 텍스트 영역 터치로 애니메이션 완성 기능 지원
 */
const StoryScrollView = forwardRef<StoryScrollViewRef, StoryScrollViewProps>(
  ({ children, onScreenTouch }, ref) => {
    const scrollRef = useRef<ScrollView>(null);

    useImperativeHandle(ref, () => ({
      scrollTo: ({ y, animated = false }) => {
        scrollRef.current?.scrollTo({ y, animated });
      },
    }));

    return (
      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.contentInnerContainer}
          keyboardShouldPersistTaps='handled'
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode='never'
        >
          <TouchableWithoutFeedback onPress={onScreenTouch}>
            <View style={styles.touchableContent}>{children}</View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </View>
    );
  }
);

export default StoryScrollView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentInnerContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  touchableContent: {
    flex: 1,
  },
});
