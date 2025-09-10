import {
  Canvas,
  Group,
  LinearGradient,
  Rect,
  Image as SkiaImage,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Logger } from '../../utils/system/Logger';

interface SkiaImageWithFadeProps {
  /** 이미지 소스 */
  source: any;
  /** 이미지 너비 */
  width: number;
  /** 이미지 높이 */
  height: number;
  /** 페이드 거리 (픽셀 단위, 기본값: 20) */
  fadeDistance?: number;
  /** 테두리 radius */
  borderRadius?: number;
  /** 이미지 로드 완료 콜백 */
  onLoad?: () => void;
  /** 이미지 로드 오류 콜백 */
  onError?: () => void;
}

/**
 * Skia를 사용해 테두리에 그라데이션 투명도 효과를 적용한 이미지 컴포넌트
 * 이미지 위에 투명도 그라데이션 오버레이를 적용하여 가장자리 페이드 효과를 구현
 */
const SkiaImageWithFade: React.FC<SkiaImageWithFadeProps> = ({
  source,
  width,
  height,
  fadeDistance = 20,
  borderRadius = 8,
  onLoad,
  onError,
}) => {
  const fade = Math.min(fadeDistance, Math.min(width, height) / 3);

  // useImage 훅은 onError 콜백을 지원합니다.
  const image = useImage(source, err => {
    Logger.error('[SkiaImageWithFade]', '이미지 로드 실패:', err as Error);
    onError?.();
  });

  // Skia 이미지가 로드되면 onLoad 콜백 호출
  useEffect(() => {
    if (image) {
      onLoad?.();
    }
  }, [image, onLoad]);

  // 로딩 중이거나 오류 발생 시, 상위 컴포넌트의 placeholder가 보이도록 null 반환
  if (!image) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { width, height, borderRadius, overflow: 'hidden' },
      ]}
    >
      <Canvas style={{ width, height }}>
        <Group>
          {/* 베이스 이미지 */}
          <SkiaImage
            image={image}
            x={0}
            y={0}
            width={width}
            height={height}
            fit='cover'
          />

          {/* 상단 페이드 오버레이 */}
          <Rect x={0} y={0} width={width} height={fade}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(0, fade)}
              colors={['rgba(16,17,26,1)', 'rgba(16,17,26,0)']}
            />
          </Rect>

          {/* 하단 페이드 오버레이 */}
          <Rect x={0} y={height - fade} width={width} height={fade}>
            <LinearGradient
              start={vec(0, height)}
              end={vec(0, height - fade)}
              colors={['rgba(16,17,26,1)', 'rgba(16,17,26,0)']}
            />
          </Rect>

          {/* 좌측 페이드 오버레이 */}
          <Rect x={0} y={0} width={fade} height={height}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(fade, 0)}
              colors={['rgba(16,17,26,1)', 'rgba(16,17,26,0)']}
            />
          </Rect>

          {/* 우측 페이드 오버레이 */}
          <Rect x={width - fade} y={0} width={fade} height={height}>
            <LinearGradient
              start={vec(width, 0)}
              end={vec(width - fade, 0)}
              colors={['rgba(16,17,26,1)', 'rgba(16,17,26,0)']}
            />
          </Rect>
        </Group>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // `position: 'absolute'` 속성을 제거하여 재사용성을 높입니다.
    // 이 컴포넌트를 사용하는 곳에서 필요에 따라 위치를 지정하도록 합니다.
  },
});

export default SkiaImageWithFade;
