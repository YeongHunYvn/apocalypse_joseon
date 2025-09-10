import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, TextStyle, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { getPunctuationDelay } from '../../constants/animationConfig';
import { COLORS, FONT_SIZES, FONT_STYLES } from '../../constants/theme';
import { TextEffectParser } from '../../utils/scene/text/TextEffectParser';
import { wrapWithEffects } from '../../utils/scene/text/TextEffectWrapper';
import { getSegmentStyle } from '../../utils/scene/text/TextStyleUtils';

interface OptimizedLineRevealProps {
  /** 표시할 텍스트 줄 */
  line: string;
  /** 줄별 지연시간 */
  lineDelay: number;
  /** 문자별 지연시간 */
  charDelay: number;
  /** 문자별 지속시간 */
  charDuration: number;
  /** 애니메이션 활성화 여부 */
  enableAnimations: boolean;
  /** 텍스트 스타일 */
  textStyle?: TextStyle;
  /** 줄 완료 시 콜백 */
  onLineComplete?: () => void;
  /** 강제 완료 여부 */
  forceComplete?: boolean;
  /** 줄 활성화 여부 */
  active?: boolean;
}

/**
 * 개별 문자 컴포넌트 (AnimatedChar 대신)
 */
interface CharProps {
  char: string;
  style: TextStyle | TextStyle[];
  time: Animated.SharedValue<number>; // 0..1
  startT: number; // 0..1
  endT: number; // 0..1
}

const AnimatedCharacter: React.FC<CharProps> = ({
  char,
  style,
  time,
  startT,
  endT,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      time.value,
      [startT, endT],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return <Animated.Text style={[style, animatedStyle]}>{char}</Animated.Text>;
};

/**
 * 최적화된 줄별 문자 애니메이션 컴포넌트
 * 왼쪽에서 오른쪽으로 문자별로 순차 페이드인 애니메이션
 * 기존 기능 유지하면서 불필요한 복잡성 제거
 */
const OptimizedLineReveal: React.FC<OptimizedLineRevealProps> = ({
  line,
  lineDelay,
  charDelay,
  charDuration,
  enableAnimations,
  textStyle,
  onLineComplete,
  forceComplete = false,
  active = false,
}) => {
  const isCompletedRef = useRef(false);

  const parseResult = useMemo(() => TextEffectParser.parse(line), [line]);
  const totalCharacters = useMemo(
    () => parseResult.segments.reduce((sum, s) => sum + s.text.length, 0),
    [parseResult]
  );

  // 단일 타임라인 공유 값 (0..1)
  const time = useSharedValue(0);

  const handleAnimationEnd = () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    onLineComplete?.();
  };

  useEffect(() => {
    // 상태 초기화
    isCompletedRef.current = false;
    time.value = 0;

    if (!active) return;

    // 표시할 문자가 없는 경우 즉시 완료
    if (totalCharacters === 0) {
      handleAnimationEnd();
      return;
    }

    // 즉시 완료 또는 애니메이션 실행
    if (forceComplete || !enableAnimations) {
      time.value = 1;
      handleAnimationEnd();
      return;
    }

    // 문자별 지연 스케줄 계산
    const allCharacters: string[] = [];
    parseResult.segments.forEach(segment => {
      allCharacters.push(...segment.text.split(''));
    });

    let accumulatedMs = 0;
    const startsMs: number[] = new Array(totalCharacters).fill(0);
    for (let index = 0; index < totalCharacters; index++) {
      startsMs[index] = accumulatedMs;
      const char = allCharacters[index] || '';
      accumulatedMs += charDelay;
      accumulatedMs += getPunctuationDelay(char);
    }
    const totalMs = Math.max(
      charDuration + (startsMs[totalCharacters - 1] || 0),
      1
    );

    // 타임라인 애니메이션 (lineDelay 이후 시작)
    time.value = withDelay(
      lineDelay,
      withTiming(1, { duration: totalMs }, finished => {
        'worklet';
        if (finished) {
          runOnJS(handleAnimationEnd)();
        }
      })
    );
  }, [
    active,
    forceComplete,
    line,
    enableAnimations,
    charDelay,
    charDuration,
    lineDelay,
    totalCharacters,
    parseResult,
  ]);

  return (
    <View style={styles.lineContainer}>
      {parseResult.segments.map((segment, segIdx) => {
        const characters = segment.text.split('');
        let runningCharIndex = 0;

        // 이전 세그먼트들의 문자 수 계산
        for (let i = 0; i < segIdx; i++) {
          runningCharIndex += parseResult.segments[i].text.length;
        }

        return characters.map((char, charIdx) => {
          const globalCharIndex = runningCharIndex + charIdx;
          // 시작/종료 시점 계산
          const allCharsBefore = parseResult.segments
            .slice(0, segIdx)
            .reduce((s, sgm) => s + sgm.text.length, 0);
          const indexInLine = allCharsBefore + charIdx;
          // 위 useEffect에서 계산된 startsMs와 totalMs를 재계산 (동일한 로직)
          // 성능 상 큰 문제가 없고 각 캐릭터에서 단순 연산
          let accum = 0;
          for (let i = 0; i < indexInLine; i++) {
            const prevChar =
              parseResult.segments.flatMap(s => s.text.split(''))[i] || '';
            accum += charDelay + getPunctuationDelay(prevChar);
          }
          const totalChars = parseResult.segments.reduce(
            (s, sgm) => s + sgm.text.length,
            0
          );
          let accumForTotal = 0;
          for (let i = 0; i < totalChars - 1; i++) {
            const c =
              parseResult.segments.flatMap(s => s.text.split(''))[i] || '';
            accumForTotal += charDelay + getPunctuationDelay(c);
          }
          const totalMs = Math.max(charDuration + accumForTotal, 1);
          const startT = totalMs > 0 ? accum / totalMs : 0;
          const endT =
            totalMs > 0 ? Math.min(1, (accum + charDuration) / totalMs) : 1;

          // 세그먼트 스타일 적용
          const segmentStyle = getSegmentStyle(
            segment.effects,
            textStyle || {}
          );

          // 애니메이션 문자 컴포넌트 (단일 time 공유)
          const charElement = (
            <AnimatedCharacter
              key={`char-${globalCharIndex}`}
              char={char}
              time={time}
              startT={startT}
              endT={endT}
              style={[styles.char, segmentStyle]}
            />
          );

          // 애니메이션 효과 래핑
          const wrappedElement = wrapWithEffects(
            charElement,
            segment.effects,
            enableAnimations
          );

          return React.cloneElement(wrappedElement as React.ReactElement, {
            key: `wrapped-${globalCharIndex}`,
          });
        });
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  lineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  char: {
    ...FONT_STYLES.regular,
    ...FONT_SIZES.text,
    color: COLORS.text,
  },
});

export default OptimizedLineReveal;
