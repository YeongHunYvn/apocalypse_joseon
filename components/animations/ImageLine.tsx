import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Logger } from '../../utils/system/Logger';

import {
  IMAGE_CONFIG,
  IMAGE_SIZE_PRESETS,
  ImageInfo,
  ImageSizePreset,
} from '../../constants/imageConfig';
import { COLORS, FONT_SIZES, FONT_STYLES } from '../../constants/theme';
import SkiaImageWithFade from './SkiaImageWithFade';

interface ImageLineProps {
  /** 이미지 정보 */
  imageInfo: ImageInfo;
  /** 줄 인덱스 */
  lineIndex: number;
  /** 줄별 지연시간 */
  lineDelay: number;
  /** 애니메이션 활성화 여부 */
  enableAnimations: boolean;
  /** 줄 완료 시 콜백 */
  onLineComplete?: () => void;
  /** 강제 완료 여부 */
  forceComplete?: boolean;
  /** 줄 활성화 여부 */
  active?: boolean;
  /** 테두리 페이드 효과 활성화 여부 (기본값: true) */
  enableFadeEffect?: boolean;
  /** 페이드 거리 (픽셀 단위, 기본값: 20) */
  fadeDistance?: number;
}

/**
 * 이미지 크기를 계산하는 함수
 * @param sizePreset 이미지 크기 프리셋
 * @returns 계산된 이미지 스타일
 */
function calculateImageSize(sizePreset: ImageSizePreset) {
  const sizeConfig = IMAGE_SIZE_PRESETS[sizePreset];

  return {
    width: sizeConfig.width,
    height: sizeConfig.height,
  };
}

/**
 * 이미지 애니메이션 컴포넌트
 * 이미지를 페이드인 효과와 함께 표시합니다.
 * 동기적으로 이미지 크기를 계산하여 레이아웃 쉬프트를 방지합니다.
 */
const ImageLine: React.FC<ImageLineProps> = React.memo(
  ({
    imageInfo,
    lineIndex: _lineIndex,
    lineDelay,
    enableAnimations,
    onLineComplete,
    forceComplete = false,
    active = false,
    enableFadeEffect = true,
    fadeDistance = 20,
  }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const isCompletedRef = useRef(false);
    const opacity = useSharedValue(0);
    const _screenWidth = Dimensions.get('window').width;

    /**
     * 고정된 이미지 크기를 사용하여 레이아웃 쉬프트를 방지합니다.
     */
    const resolvedImageStyle = useMemo(() => {
      const stylePreset = calculateImageSize(imageInfo.size);

      return {
        width: stylePreset.width,
        height: stylePreset.height,
      };
    }, [imageInfo.size]);

    const handleAnimationEnd = () => {
      if (isCompletedRef.current) return;
      isCompletedRef.current = true;
      onLineComplete?.();
    };

    const handleImageLoad = () => {
      setIsLoaded(true);

      // 이미지 로드 후 애니메이션 처리를 통합
      if (!isCompletedRef.current) {
        if (active && enableAnimations && !forceComplete) {
          // 페이드인 애니메이션 시작
          opacity.value = withDelay(
            lineDelay,
            withTiming(
              1,
              {
                duration: IMAGE_CONFIG.fadeInDuration,
                easing: Easing.out(Easing.ease),
              },
              finished => {
                'worklet';
                if (finished) {
                  runOnJS(handleAnimationEnd)();
                }
              }
            )
          );
        } else {
          // 즉시 표시 (강제 완료 또는 애니메이션 비활성화)
          opacity.value = 1;
          handleAnimationEnd();
        }
      }
    };

    const handleImageError = () => {
      Logger.warn('[ImageLine]', `이미지 로드 실패: ${imageInfo.filename}`);
      setHasError(true);
      setIsLoaded(true);
      // 오류 발생 시에도 애니메이션 완료 처리
      if (!isCompletedRef.current) {
        handleAnimationEnd();
      }
    };

    useEffect(() => {
      isCompletedRef.current = false;
      opacity.value = 0;
      setIsLoaded(false); // 상태 초기화

      if (!active) {
        return;
      }

      if (!imageInfo.imageSource) {
        handleImageError();
        return;
      }

      if (forceComplete || !enableAnimations) {
        opacity.value = 1;
        setIsLoaded(true);
        handleAnimationEnd();
        return;
      }

      // 일반적인 경우: 이미지 로드 대기 후 애니메이션
      // 실제 애니메이션은 handleImageLoad에서 처리
    }, [active, forceComplete, enableAnimations, imageInfo.imageSource]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    if (hasError || !imageInfo.imageSource) {
      return (
        <View style={styles.errorContainer}>
          <Animated.Text style={[styles.errorText, animatedStyle]}>
            {IMAGE_CONFIG.fallbackText}
          </Animated.Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Animated.View style={[animatedStyle, resolvedImageStyle]}>
          {/* Placeholder: 로드 전까지 정확한 크기로 공간 차지 */}
          {!isLoaded && (
            <View style={[styles.placeholder, StyleSheet.absoluteFill]} />
          )}

          {enableFadeEffect ? (
            <SkiaImageWithFade
              source={imageInfo.imageSource}
              width={resolvedImageStyle.width}
              height={resolvedImageStyle.height}
              fadeDistance={fadeDistance}
              borderRadius={8}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          ) : (
            <Image
              source={imageInfo.imageSource}
              style={styles.image}
              resizeMode='contain'
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </Animated.View>
      </View>
    );
  }
);

ImageLine.displayName = 'ImageLine';

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  placeholder: {
    // 투명한 placeholder로 레이아웃만 유지
    borderRadius: 8,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  errorText: {
    color: COLORS.textSecondary,
    ...FONT_STYLES.regular,
    ...FONT_SIZES.sm,
    fontStyle: 'italic',
  },
});

export default ImageLine;
