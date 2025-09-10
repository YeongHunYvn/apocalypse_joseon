import React, { useMemo } from 'react';
import { Text, TextStyle, View } from 'react-native';
import { TEXT_EFFECTS_CONFIG } from '../constants/sceneConfig';
import { COLORS, FONT_SIZES, FONT_STYLES } from '../constants/theme';
import { EffectTextProps, TextEffect } from '../types';
import { TextEffectParser } from '../utils/scene/text/TextEffectParser';
import { getSegmentStyle } from '../utils/scene/text/TextStyleUtils';

// 애니메이션 컴포넌트들 import
import FadeText from './animations/FadeText';
import GlowText from './animations/GlowText';
import PulseText from './animations/PulseText';
import ScaleText from './animations/ScaleText';
import ShakeText from './animations/ShakeText';
import WaveText from './animations/WaveText';

// 애니메이션 효과 타입 목록
const ANIMATION_TYPES = [
  'shake',
  'glow',
  'fade',
  'scale',
  'wave',
  'pulse',
] as const;

/**
 * 텍스트 효과를 적용하는 컴포넌트
 * 중괄호 태그(`{{bold}}굵게{{bold}}`, `{{red}}색상{{red}}` 등)를 파싱하여 시각적 효과를 적용
 */
export const EffectText: React.FC<EffectTextProps> = React.memo(
  ({
    text,
    enableAnimations = true,
    style,
    textAlign = 'auto',
    color = COLORS.text,
    fontSize = FONT_SIZES.body.fontSize,
    fontWeight = FONT_STYLES.regular.fontWeight,
    lineHeight,
    selectable = false,
    onPress,
    onLongPress,
    testID,
  }) => {
    // 전역 애니메이션 설정 적용
    const finalEnableAnimations = useMemo(() => {
      return enableAnimations && TEXT_EFFECTS_CONFIG.global.enableAnimations;
    }, [enableAnimations]);

    // 텍스트 파싱 결과를 메모이제이션
    const parseResult = useMemo(() => {
      return TextEffectParser.parse(text);
    }, [text]);

    // 기본 텍스트 스타일을 메모이제이션
    const baseTextStyle = useMemo(
      (): TextStyle => ({
        color,
        fontSize,
        fontWeight,
        fontFamily: FONT_STYLES.regular.fontFamily,
        textAlign,
        lineHeight,
      }),
      [color, fontSize, fontWeight, textAlign, lineHeight]
    );

    // 효과가 없는 경우 일반 텍스트로 렌더링
    if (
      parseResult.segments.length === 1 &&
      parseResult.segments[0].effects.length === 0
    ) {
      const TextComponent = onPress || onLongPress ? View : Text;
      const textProps = onPress || onLongPress ? { onPress, onLongPress } : {};

      return (
        <TextComponent
          style={[baseTextStyle, style]}
          selectable={selectable}
          testID={testID}
          {...textProps}
        >
          {parseResult.segments[0].text}
        </TextComponent>
      );
    }

    // 효과가 있는 경우 세그먼트별로 렌더링 (View로 인라인 배치)
    return (
      <View style={{ flexDirection: 'column' }}>
        {parseResult.segments.map((segment, index) => {
          // \n을 기준으로 텍스트를 분할
          const textParts = segment.text.split('\n');

          return textParts.map((part, partIndex) => (
            <View
              key={`${segment.startIndex}-${segment.endIndex}-${index}-${partIndex}`}
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
                // 첫 번째 부분이 아니면 새 줄로 처리
                ...(partIndex > 0 && { marginTop: 0 }),
              }}
            >
              <TextSegment
                segment={{ ...segment, text: part }}
                baseStyle={baseTextStyle}
                enableAnimations={finalEnableAnimations}
              />
            </View>
          ));
        })}
      </View>
    );
  }
);

/**
 * 개별 텍스트 세그먼트를 렌더링하는 컴포넌트
 * 여러 애니메이션 효과를 중첩 래퍼로 적용
 */
interface TextSegmentProps {
  segment: {
    text: string;
    effects: TextEffect[];
  };
  baseStyle: TextStyle;
  enableAnimations: boolean;
}

const TextSegment: React.FC<TextSegmentProps> = React.memo(
  ({ segment, baseStyle: _baseStyle, enableAnimations }) => {
    const { text, effects } = segment;

    // 애니메이션 효과와 정적 효과 분리를 메모이제이션
    const { animationEffects, staticEffects } = useMemo(() => {
      const animationEffects = effects.filter(effect =>
        ANIMATION_TYPES.includes(effect.type as any)
      );
      const staticEffects = effects.filter(
        effect => !ANIMATION_TYPES.includes(effect.type as any)
      );
      return { animationEffects, staticEffects };
    }, [effects]);

    // 정적 스타일을 메모이제이션
    const staticStyle = useMemo(() => {
      return getSegmentStyle(staticEffects, _baseStyle);
    }, [staticEffects, _baseStyle]);

    // 애니메이션 래퍼 생성을 메모이제이션
    const animatedContent = useMemo(() => {
      // 기본 텍스트 노드
      let content: React.ReactNode = <Text style={staticStyle}>{text}</Text>;

      // 애니메이션 효과가 있다면 래퍼로 중첩 적용
      if (enableAnimations && animationEffects.length > 0) {
        // 동시 실행 가능한 애니메이션 수 제한
        const limitedEffects = animationEffects.slice(
          0,
          TEXT_EFFECTS_CONFIG.global.maxConcurrentAnimations
        );

        for (const effect of limitedEffects.slice().reverse()) {
          const commonProps = {
            enabled: enableAnimations,
            intensity: getClampedIntensity(effect.type, effect.intensity),
            style: {},
          };

          switch (effect.type) {
            case 'shake':
              if (TEXT_EFFECTS_CONFIG.effects.shake.enabled) {
                content = <ShakeText {...commonProps}>{content}</ShakeText>;
              }
              break;
            case 'glow':
              if (TEXT_EFFECTS_CONFIG.effects.glow.enabled) {
                content = (
                  <GlowText {...commonProps} glowColor={effect.color}>
                    {content}
                  </GlowText>
                );
              }
              break;
            case 'pulse':
              if (TEXT_EFFECTS_CONFIG.effects.pulse.enabled) {
                content = (
                  <PulseText
                    {...commonProps}
                    {...(effect.duration && effect.duration > 0
                      ? { duration: effect.duration }
                      : {
                          duration: 1000, // 기본 펄스 지속시간
                        })}
                  >
                    {content}
                  </PulseText>
                );
              }
              break;
            case 'fade':
              if (TEXT_EFFECTS_CONFIG.effects.fade.enabled) {
                content = (
                  <FadeText
                    {...commonProps}
                    {...(effect.duration && effect.duration > 0
                      ? { duration: effect.duration }
                      : {
                          duration:
                            TEXT_EFFECTS_CONFIG.effects.fade.defaultDuration,
                        })}
                  >
                    {content}
                  </FadeText>
                );
              }
              break;
            case 'scale':
              if (TEXT_EFFECTS_CONFIG.effects.scale.enabled) {
                content = <ScaleText {...commonProps}>{content}</ScaleText>;
              }
              break;
            case 'wave':
              if (TEXT_EFFECTS_CONFIG.effects.wave.enabled) {
                content = <WaveText {...commonProps}>{content}</WaveText>;
              }
              break;
            default:
              break;
          }
        }
      }

      return content;
    }, [text, staticStyle, enableAnimations, animationEffects]);

    return animatedContent;
  }
);

/**
 * 효과 강도를 설정된 범위 내로 제한합니다.
 */
function getClampedIntensity(effectType: string, intensity?: number): number {
  const config =
    TEXT_EFFECTS_CONFIG.effects[
      effectType as keyof typeof TEXT_EFFECTS_CONFIG.effects
    ];
  if (!config) {
    return intensity || 1.0;
  }

  const value = intensity || config.defaultIntensity;
  return Math.min(Math.max(value, 0), config.maxIntensity);
}


export default EffectText;
