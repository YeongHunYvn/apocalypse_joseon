import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import React, { useEffect, useState } from 'react';

import { TextStyle } from 'react-native';

interface TypewriterTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  speed?: number;
  style?: TextStyle;
}

/**
 * React 요소에서 텍스트를 추출하는 함수
 */
function extractTextFromReactNode(node: React.ReactNode): string {
  if (typeof node === 'string') {
    return node;
  }

  if (typeof node === 'number') {
    return node.toString();
  }

  if (React.isValidElement(node)) {
    // React 요소인 경우 children을 재귀적으로 처리
    const element = node as React.ReactElement;
    if (
      element.props &&
      typeof element.props === 'object' &&
      'children' in element.props
    ) {
      return extractTextFromReactNode(
        element.props.children as React.ReactNode
      );
    }
  }

  if (Array.isArray(node)) {
    // 배열인 경우 모든 요소의 텍스트를 합침
    return node.map(extractTextFromReactNode).join('');
  }

  return '';
}

/**
 * 타이프라이터 효과를 적용하는 텍스트 컴포넌트 (최적화됨)
 * react-native-reanimated를 사용하여 setInterval 없이 구현
 * @param children 텍스트 내용
 * @param enabled 애니메이션 활성화 여부
 * @param intensity 타이핑 강도 (0~1)
 * @param speed 타이핑 속도 (밀리초)
 * @param style 추가 스타일
 */
export const TypewriterText: React.FC<TypewriterTextProps> = React.memo(
  ({ children, enabled = true, intensity = 1, speed = 100, style }) => {
    const [displayText, setDisplayText] = useState('');
    const opacity = useSharedValue(0);
    const progress = useSharedValue(0);

    // React 요소에서 텍스트 추출
    const text = extractTextFromReactNode(children);

    useEffect(() => {
      if (enabled && text && text.length > 0) {
        // 초기화
        setDisplayText('');
        progress.value = 0;

        // 페이드 인 애니메이션
        opacity.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.ease),
        });

        // 타이핑 애니메이션 (하나의 애니메이션으로 통합)
        const totalDuration = text.length * (speed / intensity);

        progress.value = withTiming(
          1,
          {
            duration: totalDuration,
            easing: Easing.linear,
          },
          finished => {
            'worklet';
            if (finished) {
              // 애니메이션 완료시 전체 텍스트 표시
              runOnJS(setDisplayText)(text);
            }
          }
        );
      } else {
        // 즉시 전체 텍스트 표시
        setDisplayText(text);
        progress.value = 1;
        opacity.value = withTiming(1, { duration: 100 });
      }
    }, [enabled, text, speed, intensity]);

    // 진행률 변화에 따른 텍스트 업데이트 (useAnimatedReaction 사용)
    useAnimatedReaction(
      () => progress.value,
      progressValue => {
        if (text.length > 0) {
          const charIndex = Math.floor(progressValue * text.length);
          const newDisplayText = text.slice(
            0,
            Math.min(charIndex, text.length)
          );
          runOnJS(setDisplayText)(newDisplayText);
        }
      },
      [text]
    );

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    });

    return (
      <Animated.Text style={[style, animatedStyle]}>
        {displayText}
      </Animated.Text>
    );
  }
);

export default TypewriterText;
