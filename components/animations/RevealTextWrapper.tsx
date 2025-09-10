import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { SCENE_ANIMATION_CONFIG } from '../../constants/animationConfig';
import { ImageParser } from '../../utils/scene/text/ImageParser';
import ImageLine from './ImageLine';
import OptimizedLineReveal from './OptimizedLineReveal';

export interface RevealTextWrapperRef {
  complete: () => void;
  isAnimating: () => boolean; // 애니메이션 진행 상태 확인
}

interface RevealTextWrapperProps {
  /** 표시할 텍스트 (이미지 태그 포함 가능) */
  text: string;
  /** 애니메이션 활성화 여부 (기본값: true) */
  enableAnimations?: boolean;
  /** 줄별 지연시간 (밀리초, 기본값: 100) */
  lineDelay?: number;
  /** 문자별 지연시간 (밀리초, 기본값: 50) */
  charDelay?: number;
  /** 문자별 지속시간 (밀리초, 기본값: SCENE_ANIMATION_CONFIG.DEFAULT_REVEAL_DURATION) */
  charDuration?: number;
  /** 애니메이션 강도 (0~1, 기본값: SCENE_ANIMATION_CONFIG.REVEAL_INTENSITY) */
  intensity?: number;
  /** 애니메이션 완료 시 콜백 함수 */
  onComplete?: () => void;
  /** 터치 완성 기능 활성화 여부 (기본값: true) */
  enableTouchComplete?: boolean;
  /** 추가 스타일 */
  style?: any;
  /** 텍스트 스타일 */
  textStyle?: any;
  /** 테스트 ID */
  testID?: string;
  /** 이미지 테두리 페이드 효과 활성화 여부 (기본값: true) */
  enableImageFadeEffect?: boolean;
  /** 이미지 페이드 거리 (픽셀 단위, 기본값: 20) */
  imageFadeDistance?: number;
  /** 즉시 전체 표시 여부 (기본값: false) - 텍스트 이력에 사용 */
  instantDisplay?: boolean;
  /** instantDisplay일 때도 onComplete를 호출할지 여부 (기본값: false) */
  triggerCompleteWhenInstant?: boolean;
}

/**
 * RevealTextWrapper 컴포넌트
 * 줄 단위로 순차적으로 등장하며, 각 줄 내에서는 왼쪽에서 오른쪽으로 문자별 페이드인
 * 이미지와 텍스트 혼합 콘텐츠를 지원하며, 현재 활성화된 줄만 렌더링하여 성능 최적화
 */
const RevealTextWrapper = forwardRef<
  RevealTextWrapperRef,
  RevealTextWrapperProps
>(
  (
    {
      text,
      enableAnimations = true,
      lineDelay = SCENE_ANIMATION_CONFIG.DEFAULT_REVEAL_DELAY,
      charDelay = SCENE_ANIMATION_CONFIG.DEFAULT_CHAR_DELAY,
      charDuration = SCENE_ANIMATION_CONFIG.DEFAULT_REVEAL_DURATION,
      intensity: _intensity = SCENE_ANIMATION_CONFIG.REVEAL_INTENSITY,
      onComplete,
      enableTouchComplete = true,
      style,
      textStyle,
      testID,
      enableImageFadeEffect = true,
      imageFadeDistance = 20,
      instantDisplay = false,
      triggerCompleteWhenInstant = false,
    },
    ref
  ) => {
    const [visibleLines, setVisibleLines] = useState(
      instantDisplay ? 999999 : 1
    ); // 즉시 표시 모드면 모든 줄 표시
    const completedRef = useRef(instantDisplay);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete; // onComplete 콜백이 변경되어도 effect가 재실행되지 않도록 ref에 저장

    // 텍스트와 이미지를 혼합 라인으로 분할
    const contentLines = useMemo(() => {
      const textLines = text.split('\n');
      const mixedLines: Array<{
        type: 'text' | 'image';
        content: string;
        imageInfo?: any;
        originalLineIndex: number;
        isEmpty?: boolean;
      }> = [];

      textLines.forEach((line, lineIndex) => {
        // 빈 줄도 보존하여 여러 줄바꿈 표시
        if (line.trim() === '') {
          mixedLines.push({
            type: 'text',
            content: ' ', // 빈 줄을 공백으로 표시하여 높이 확보
            originalLineIndex: lineIndex,
            isEmpty: true,
          });
        } else {
          const splitResult = ImageParser.splitTextWithImages(line);
          splitResult.forEach(segment => {
            mixedLines.push({
              ...segment,
              originalLineIndex: lineIndex,
            });
          });
        }
      });

      return mixedLines;
    }, [text]);

    /**
     * 빈 줄은 대기 없이 즉시 건너뛰기
     * 현재 가리키는 라인이 빈 줄이면 다음 비-빈 줄까지 연속 스킵
     */
    useEffect(() => {
      if (completedRef.current) return;

      let nextVisible = visibleLines;
      while (nextVisible <= contentLines.length) {
        const idx = nextVisible - 1;
        const line = contentLines[idx];
        if (!line) break;
        const isEmptyLine =
          line.type === 'text' && (line as any).isEmpty === true;
        if (isEmptyLine) {
          nextVisible += 1;
          continue;
        }
        break;
      }

      if (nextVisible !== visibleLines) {
        setVisibleLines(nextVisible);
      }
    }, [visibleLines, contentLines]);

    /**
     * 전체 애니메이션 완료 체크
     */
    useEffect(() => {
      if (visibleLines > contentLines.length && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current?.();
      }
    }, [visibleLines, contentLines.length]);

    // instantDisplay 모드에서도 완료 콜백을 트리거할 옵션
    useEffect(() => {
      if (instantDisplay && triggerCompleteWhenInstant) {
        requestAnimationFrame(() => {
          onCompleteRef.current?.();
        });
      }
    }, [instantDisplay, triggerCompleteWhenInstant]);

    /**
     * 줄 완료 처리 함수
     */
    const handleLineComplete = () => {
      if (completedRef.current) return;

      if (visibleLines <= contentLines.length) {
        setVisibleLines(prev => prev + 1);
      }
    };

    /**
     * 터치 완성 처리 함수
     */
    const handleTouchComplete = () => {
      if (!enableTouchComplete || completedRef.current) return;

      completedRef.current = true;
      // 먼저 모든 라인을 표시하고, 다음 프레임에 onComplete 콜백 호출
      setVisibleLines(contentLines.length + 1);
      requestAnimationFrame(() => {
        onCompleteRef.current?.();
      });
    };

    useImperativeHandle(ref, () => ({
      complete: handleTouchComplete,
      isAnimating: () =>
        !completedRef.current && visibleLines <= contentLines.length,
    }));

    return (
      <View style={[styles.container, style]} testID={testID}>
        {contentLines.slice(0, visibleLines).map((contentLine, lineIndex) => {
          const isCurrentLine = lineIndex === visibleLines - 1;
          const isEmptyLine =
            contentLine.type === 'text' &&
            (contentLine as any).isEmpty === true;
          const commonProps = {
            // 첫 번째 줄도 약간의 지연시간을 가지도록 수정
            lineDelay: instantDisplay ? 0 : Math.max(50, lineIndex * lineDelay),
            enableAnimations: instantDisplay ? false : enableAnimations,
            onLineComplete: isCurrentLine ? handleLineComplete : undefined,
            forceComplete: instantDisplay || completedRef.current,
            active: true,
          };

          // 빈 줄은 애니메이션 없이 즉시 표시 (동시 애니메이션 방지)
          if (isEmptyLine) {
            return (
              <OptimizedLineReveal
                key={`empty-${lineIndex}`}
                {...commonProps}
                line={' '}
                charDelay={0}
                charDuration={0}
                textStyle={textStyle}
                enableAnimations={false}
                forceComplete={true}
                // 빈 줄에서는 완료 콜백을 호출하지 않음
                onLineComplete={undefined}
              />
            );
          }

          if (contentLine.type === 'image') {
            return (
              <ImageLine
                key={`image-${lineIndex}`}
                lineIndex={lineIndex}
                {...commonProps}
                imageInfo={contentLine.imageInfo!}
                enableFadeEffect={enableImageFadeEffect}
                fadeDistance={imageFadeDistance}
              />
            );
          }

          return (
            <OptimizedLineReveal
              key={`text-${lineIndex}`}
              {...commonProps}
              line={contentLine.content}
              charDelay={charDelay}
              charDuration={charDuration}
              textStyle={textStyle}
            />
          );
        })}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default RevealTextWrapper;
