import React from 'react';
import { TEXT_EFFECTS_CONFIG } from '../../../constants/sceneConfig';
import { TextEffect } from '../../../types';

// 애니메이션 컴포넌트들 import
import FadeText from '../../../components/animations/FadeText';
import GlowText from '../../../components/animations/GlowText';
import PulseText from '../../../components/animations/PulseText';
import ScaleText from '../../../components/animations/ScaleText';
import ShakeText from '../../../components/animations/ShakeText';
import WaveText from '../../../components/animations/WaveText';

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

/**
 * 텍스트 콘텐츠에 애니메이션 효과를 중첩 래핑하는 함수
 * @param content 래핑할 텍스트 콘텐츠
 * @param effects 적용할 애니메이션 효과들
 * @param enableAnimations 애니메이션 활성화 여부
 * @returns 효과가 적용된 React 노드
 */
export function wrapWithEffects(
  content: React.ReactNode,
  effects: TextEffect[],
  enableAnimations: boolean = true
): React.ReactNode {
  // 애니메이션 효과만 필터링
  const animationEffects = effects.filter(effect =>
    ANIMATION_TYPES.includes(effect.type as any)
  );

  // 애니메이션이 비활성화되었거나 효과가 없으면 원본 콘텐츠 반환
  if (!enableAnimations || animationEffects.length === 0) {
    return content;
  }

  // 동시 실행 가능한 애니메이션 수 제한
  const limitedEffects = animationEffects.slice(
    0,
    TEXT_EFFECTS_CONFIG.global.maxConcurrentAnimations
  );

  // 효과를 역순으로 적용 (안쪽부터 래핑)
  return limitedEffects.reduceRight((acc, effect) => {
    const commonProps = {
      enabled: enableAnimations,
      intensity: getClampedIntensity(effect.type, effect.intensity),
      style: {},
    };

    switch (effect.type) {
      case 'shake':
        if (TEXT_EFFECTS_CONFIG.effects.shake.enabled) {
          return <ShakeText {...commonProps}>{acc}</ShakeText>;
        }
        break;

      case 'glow':
        if (TEXT_EFFECTS_CONFIG.effects.glow.enabled) {
          return (
            <GlowText {...commonProps} glowColor={effect.color}>
              {acc}
            </GlowText>
          );
        }
        break;

      case 'pulse':
        if (TEXT_EFFECTS_CONFIG.effects.pulse.enabled) {
          return (
            <PulseText
              {...commonProps}
              {...(effect.duration && effect.duration > 0
                ? { duration: effect.duration }
                : {
                    duration: 1000, // 기본 펄스 지속시간
                  })}
            >
              {acc}
            </PulseText>
          );
        }
        break;

      case 'fade':
        if (TEXT_EFFECTS_CONFIG.effects.fade.enabled) {
          return (
            <FadeText
              {...commonProps}
              {...(effect.duration && effect.duration > 0
                ? { duration: effect.duration }
                : {
                    duration: TEXT_EFFECTS_CONFIG.effects.fade.defaultDuration,
                  })}
            >
              {acc}
            </FadeText>
          );
        }
        break;

      case 'scale':
        if (TEXT_EFFECTS_CONFIG.effects.scale.enabled) {
          return <ScaleText {...commonProps}>{acc}</ScaleText>;
        }
        break;

      case 'wave':
        if (TEXT_EFFECTS_CONFIG.effects.wave.enabled) {
          return <WaveText {...commonProps}>{acc}</WaveText>;
        }
        break;

      default:
        break;
    }

    return acc;
  }, content);
}
