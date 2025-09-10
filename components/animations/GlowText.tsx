import React from 'react';
import { Text, TextStyle } from 'react-native';

interface GlowTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: number;
  style?: TextStyle;
  glowColor?: string;
}

/**
 * 빛나는 효과를 적용하는 텍스트 컴포넌트 (정적 글로우)
 * @param children 텍스트 내용
 * @param enabled 글로우 효과 활성화 여부
 * @param intensity 빛남 강도 (0~1)
 * @param style 추가 스타일
 * @param glowColor 빛나는 색상
 */
export const GlowText: React.FC<GlowTextProps> = React.memo(
  ({
    children,
    enabled = true,
    intensity = 1,
    style,
    glowColor = '#FFFF00',
  }) => {
    const glowStyle = enabled
      ? {
          textShadowColor: glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: intensity * 8, // 고정된 글로우 반경
        }
      : {};

    return <Text style={[style, glowStyle]}>{children}</Text>;
  }
);

export default GlowText;
