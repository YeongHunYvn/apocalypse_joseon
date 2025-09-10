import {
  ScreenShakeParams,
  VignetteOverlayParams,
  parseScreenShakeSetting,
  parseVignetteOverlaySetting,
} from '../../../constants/backgroundEffectConfig';
import { GameState, Scene } from '../../../types';
import {
  GameStateEffectInfo,
  GameStateEffectMonitor,
} from './GameStateEffectMonitor';

import React from 'react';
import ScreenShake from '../../../components/background/effects/ScreenShake';
import VignetteOverlay from '../../../components/background/effects/VignetteOverlay';

/**
 * 배경 효과 타입 정의 (씬 기반)
 */
export type BackgroundEffectType = 'screen_shake' | 'vignette' | 'none';

/**
 * 통합 배경 효과 타입 정의 (씬 기반 + 상태 기반)
 */
export type UnifiedBackgroundEffectType =
  | BackgroundEffectType
  | 'health_warning';

/**
 * 모든 배경 효과 매개변수의 유니온 타입
 */
export type BackgroundEffectParams = ScreenShakeParams | VignetteOverlayParams;

/**
 * 배경 효과 컴포넌트 Props 인터페이스
 */
export interface BackgroundEffectProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 효과 완료 시 콜백 */
  onComplete?: () => void;
}

/**
 * 배경 효과 정보 인터페이스 (단일 효과)
 */
export interface BackgroundEffectInfo {
  /** 효과 타입 */
  type: BackgroundEffectType;
  /** 효과 컴포넌트 */
  component: React.ComponentType<BackgroundEffectProps> | null;
  /** 효과 활성화 여부 */
  isActive: boolean;
  /** 효과 매개변수 */
  params?: BackgroundEffectParams;
}

/**
 * 통합 배경 효과 정보 인터페이스 (씬 기반 + 상태 기반)
 */
export interface UnifiedBackgroundEffectInfo {
  /** 씬 기반 효과들 */
  sceneEffects: BackgroundEffectInfo[];
  /** 상태 기반 효과 */
  gameStateEffect: GameStateEffectInfo | null;
  /** 통합 효과 활성화 여부 */
  isActive: boolean;
  /** 총 효과 개수 */
  totalEffectCount: number;
  /** 우선순위별 정렬된 효과들 */
  prioritizedEffects: Array<BackgroundEffectInfo | GameStateEffectInfo>;
}

/**
 * 다중 배경 효과 정보 인터페이스
 */
export interface MultipleBackgroundEffectInfo {
  /** 개별 효과들의 배열 */
  effects: BackgroundEffectInfo[];
  /** 전체 효과 활성화 여부 */
  isActive: boolean;
  /** 활성화된 효과의 개수 */
  layerCount: number;
  /** 효과들의 조합 식별자 (캐싱 및 최적화용) */
  combinationId: string;
}

/**
 * 다중 배경 효과 컴포넌트 Props
 */
export interface MultipleBackgroundEffectProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 적용할 효과들의 배열 */
  effects: BackgroundEffectInfo[];
  /** 모든 효과 완료 시 콜백 */
  onComplete?: () => void;
}

/**
 * 배경 효과를 관리하는 클래스
 * 씬의 background_effects 필드를 해석하고 적절한 효과 컴포넌트를 제공합니다.
 *
 * **4단계 업데이트**: 상태 기반 효과와 씬 기반 효과 통합 관리
 *
 * 지원하는 설정 형식:
 *
 * **ScreenShake:**
 * - "screen_shake" : 기본 설정 (무한 반복)
 * - "screen_shake:strong" : 프리셋 사용
 * - "screen_shake:light" : 가벼운 흔들림 프리셋
 * - "screen_shake:infinite_tremor" : 무한 떨림 프리셋
 *
 * **VignetteOverlay:**
 * - "vignette" : 기본 설정 (빨간색 비네트)
 * - "vignette:warning" : 빨간색 경고 프리셋
 * - "vignette:cold" : 푸른색 차가운 프리셋
 * - "vignette:poison" : 녹색 독기 프리셋
 * - "vignette:shadow" : 검은색 그림자 프리셋
 *
 * **상태 기반 효과 (자동):**
 * - HealthWarning : 체력 34% 미만 시 자동 활성화
 */
export class BackgroundEffectManager {
  private static gameStateMonitor = GameStateEffectMonitor.getInstance();

  // ==========================================
  // 🎯 씬 기반 효과 관리 (기존 기능)
  // ==========================================

  /**
   * 씬에서 배경 효과 정보를 추출합니다.
   * @param scene - 현재 씬
   * @returns 배경 효과 정보
   */
  static getBackgroundEffectInfo(scene: Scene | null): BackgroundEffectInfo {
    if (
      !scene ||
      !scene.background_effects ||
      scene.background_effects.length === 0
    ) {
      return {
        type: 'none',
        component: null,
        isActive: false,
      };
    }

    // 첫 번째 효과를 기본 효과로 처리 (하위 호환성)
    const backgroundEffect = scene.background_effects[0];
    const effectType = this.parseBackgroundEffectType(backgroundEffect);
    const component = this.getEffectComponent(effectType);
    const params = this.parseEffectParams(backgroundEffect, effectType);

    return {
      type: effectType,
      component,
      isActive: true,
      params,
    };
  }

  // ==========================================
  // 🎯 상태 기반 효과 + 씬 기반 효과 통합 관리 (신규)
  // ==========================================

  /**
   * 씬과 게임 상태를 모두 고려한 통합 배경 효과 정보를 생성합니다.
   * @param scene - 현재 씬
   * @param gameState - 현재 게임 상태
   * @returns 통합 배경 효과 정보
   */
  static getUnifiedBackgroundEffectInfo(
    scene: Scene | null,
    gameState: GameState | null
  ): UnifiedBackgroundEffectInfo {
    // 씬 기반 효과 추출
    const sceneEffectInfo = this.getBackgroundEffectInfo(scene);
    const sceneEffects = sceneEffectInfo.isActive ? [sceneEffectInfo] : [];

    // 상태 기반 효과 추출
    let gameStateEffect: GameStateEffectInfo | null = null;
    if (gameState) {
      const monitoringResult = this.gameStateMonitor.updateGameState(gameState);
      gameStateEffect = monitoringResult.activeEffect.isActive
        ? monitoringResult.activeEffect
        : null;
    }

    // 우선순위별 정렬 (상태 기반 효과 > 씬 기반 효과)
    const prioritizedEffects: Array<
      BackgroundEffectInfo | GameStateEffectInfo
    > = [];

    if (gameStateEffect) {
      prioritizedEffects.push(gameStateEffect);
    }

    prioritizedEffects.push(...sceneEffects);

    return {
      sceneEffects,
      gameStateEffect,
      isActive: prioritizedEffects.length > 0,
      totalEffectCount: prioritizedEffects.length,
      prioritizedEffects,
    };
  }

  /**
   * 통합 배경 효과를 래핑하는 컴포넌트를 생성합니다.
   * @param scene - 현재 씬
   * @param gameState - 현재 게임 상태
   * @param children - 감쌀 자식 컴포넌트
   * @param onComplete - 효과 완료 시 콜백
   * @returns 통합 배경 효과가 적용된 컴포넌트 또는 원본 children
   */
  static wrapWithUnifiedBackgroundEffects(
    scene: Scene | null,
    gameState: GameState | null,
    children: React.ReactNode,
    onComplete?: () => void
  ): React.ReactNode {
    const unifiedInfo = this.getUnifiedBackgroundEffectInfo(scene, gameState);

    if (!unifiedInfo.isActive || unifiedInfo.prioritizedEffects.length === 0) {
      return children;
    }

    // 우선순위순으로 중첩 래핑 (높은 우선순위가 바깥쪽)
    return unifiedInfo.prioritizedEffects.reduceRight(
      (wrappedChildren, effect, index) => {
        // 첫 번째(최고 우선순위) 효과에서만 onComplete 콜백 전달
        const isFirstEffect = index === 0;

        if ('priority' in effect) {
          // 상태 기반 효과 (GameStateEffectInfo)
          return this.wrapWithGameStateEffect(
            effect,
            wrappedChildren,
            isFirstEffect ? onComplete : undefined
          );
        } else {
          // 씬 기반 효과 (BackgroundEffectInfo)
          return this.wrapWithSingleEffect(
            effect,
            wrappedChildren,
            isFirstEffect ? onComplete : undefined
          );
        }
      },
      children
    );
  }

  /**
   * 상태 기반 효과를 래핑합니다.
   * @param effectInfo - 상태 기반 효과 정보
   * @param children - 자식 컴포넌트
   * @param onComplete - 완료 콜백
   * @returns 래핑된 컴포넌트
   */
  private static wrapWithGameStateEffect(
    effectInfo: GameStateEffectInfo,
    children: React.ReactNode,
    onComplete?: () => void
  ): React.ReactNode {
    if (!effectInfo.component) {
      return children;
    }

    const EffectComponent = effectInfo.component;
    const props: any = {
      children,
      onComplete,
      ...effectInfo.params,
    };

    return React.createElement(EffectComponent, props);
  }

  /**
   * 통합 배경 효과 디버그 정보를 생성합니다.
   * @param scene - 현재 씬
   * @param gameState - 현재 게임 상태
   * @returns 통합 디버그 정보
   */
  static getUnifiedDebugInfo(
    scene: Scene | null,
    gameState: GameState | null
  ): string {
    const unifiedInfo = this.getUnifiedBackgroundEffectInfo(scene, gameState);

    if (!unifiedInfo.isActive) {
      return '효과 없음';
    }

    const effectDescriptions: string[] = [];

    // 상태 기반 효과 정보
    if (unifiedInfo.gameStateEffect) {
      const effect = unifiedInfo.gameStateEffect;
      effectDescriptions.push(
        `[상태] ${effect.type} (우선순위: ${effect.priority})`
      );
    }

    // 씬 기반 효과 정보
    unifiedInfo.sceneEffects.forEach(effect => {
      effectDescriptions.push(`[씬] ${effect.type}`);
    });

    return `통합효과 (${unifiedInfo.totalEffectCount}개):\n${effectDescriptions.join('\n')}`;
  }

  // ==========================================
  // 🔧 기존 함수들 (호환성 유지)
  // ==========================================

  /**
   * 문자열로 된 배경 효과 타입을 파싱합니다.
   * @param effectString - 씬의 background_effects 필드 값
   * @returns 파싱된 배경 효과 타입
   */
  private static parseBackgroundEffectType(
    effectString: string
  ): BackgroundEffectType {
    const baseType = effectString.split(':')[0].toLowerCase();

    switch (baseType) {
      case 'screen_shake':
        return 'screen_shake';
      case 'vignette':
        return 'vignette';
      default:
        // Logger.warn('[BackgroundEffectManager]', `알 수 없는 배경 효과 타입: ${baseType}`);
        return 'none';
    }
  }

  /**
   * 효과 문자열에서 매개변수를 추출합니다.
   * @param effectString - 효과 문자열 (예: "screen_shake:strong")
   * @param effectType - 효과 타입
   * @returns 파싱된 매개변수 객체
   */
  private static parseEffectParams(
    effectString: string,
    effectType: BackgroundEffectType
  ): BackgroundEffectParams | undefined {
    switch (effectType) {
      case 'screen_shake':
        return parseScreenShakeSetting(effectString);
      case 'vignette':
        return parseVignetteOverlaySetting(effectString);
      default:
        return undefined;
    }
  }

  /**
   * 배경 효과 타입에 따른 컴포넌트를 반환합니다.
   * @param type - 배경 효과 타입
   * @returns 배경 효과 컴포넌트 또는 null
   */
  private static getEffectComponent(
    type: BackgroundEffectType
  ): React.ComponentType<BackgroundEffectProps> | null {
    switch (type) {
      case 'screen_shake':
        return ScreenShake;
      case 'vignette':
        return VignetteOverlay;
      case 'none':
      default:
        return null;
    }
  }

  /**
   * 배경 효과가 있는지 확인합니다.
   * @param scene - 확인할 씬
   * @returns 배경 효과 존재 여부
   */
  static hasBackgroundEffect(scene: Scene | null): boolean {
    return !!(
      scene?.background_effects &&
      scene.background_effects.length > 0 &&
      scene.background_effects[0] !== 'none'
    );
  }

  /**
   * 배경 효과를 래핑하는 컴포넌트를 생성합니다.
   * @param scene - 현재 씬
   * @param children - 감쌀 자식 컴포넌트
   * @param onComplete - 효과 완료 시 콜백
   * @returns 배경 효과가 적용된 컴포넌트 또는 원본 children
   */
  static wrapWithBackgroundEffect(
    scene: Scene | null,
    children: React.ReactNode,
    onComplete?: () => void
  ): React.ReactNode {
    const effectInfo = this.getBackgroundEffectInfo(scene);

    if (!effectInfo.isActive || !effectInfo.component) {
      return children;
    }

    const EffectComponent = effectInfo.component;
    const props: any = { onComplete, children };

    // 효과별 특정 매개변수 추가
    if (effectInfo.params) {
      switch (effectInfo.type) {
        case 'screen_shake':
          const shakeParams = effectInfo.params as ScreenShakeParams;
          props.intensity = shakeParams.intensity;
          props.duration = shakeParams.duration;
          props.frequency = shakeParams.frequency;
          break;

        case 'vignette':
          const vignetteParams = effectInfo.params as VignetteOverlayParams;
          props.color = vignetteParams.color;
          props.duration = vignetteParams.duration;
          props.maxOpacity = vignetteParams.maxOpacity;
          props.intensity = vignetteParams.intensity;
          props.fadeRange = vignetteParams.fadeRange;
          break;
      }
    }

    return React.createElement(EffectComponent, props);
  }

  /**
   * 배경 효과 디버그 정보를 생성합니다.
   * @param scene - 현재 씬
   * @returns 디버그 정보 문자열
   */
  static getDebugInfo(scene: Scene | null): string {
    const effectInfo = this.getBackgroundEffectInfo(scene);

    if (!effectInfo.isActive) {
      return '효과 없음';
    }

    const typeInfo = `타입: ${effectInfo.type}`;
    const paramsInfo = effectInfo.params
      ? `매개변수: ${JSON.stringify(effectInfo.params, null, 1)}`
      : '매개변수: 기본값';

    return `${typeInfo}\n${paramsInfo}`;
  }

  // ==========================================
  // 🎯 다중 효과 시스템 (Multiple Effects) - 기존 기능 유지
  // ==========================================

  /**
   * 씬에서 다중 배경 효과 정보를 추출합니다.
   * background_effects 필드를 처리하여 다중 효과를 지원합니다.
   * @param scene - 현재 씬
   * @returns 다중 배경 효과 정보
   */
  static getMultipleBackgroundEffectInfo(
    scene: Scene | null
  ): MultipleBackgroundEffectInfo {
    if (!scene) {
      return {
        effects: [],
        isActive: false,
        layerCount: 0,
        combinationId: 'none',
      };
    }

    // 다중 효과 필드 처리
    let effectStrings: string[] = [];

    if (scene.background_effects && scene.background_effects.length > 0) {
      effectStrings = scene.background_effects;
    }

    if (effectStrings.length === 0) {
      return {
        effects: [],
        isActive: false,
        layerCount: 0,
        combinationId: 'none',
      };
    }

    // 각 효과 문자열을 BackgroundEffectInfo로 변환
    const effects: BackgroundEffectInfo[] = effectStrings
      .map(effectString => this.parseEffectString(effectString))
      .filter(effect => effect.isActive); // 활성화된 효과만 필터링

    // 효과 충돌 해결 및 최적화
    const optimizedEffects = this.resolveEffectConflicts(effects);

    // 조합 식별자 생성 (캐싱 및 연속성 관리용)
    const combinationId = this.generateCombinationId(optimizedEffects);

    return {
      effects: optimizedEffects,
      isActive: optimizedEffects.length > 0,
      layerCount: optimizedEffects.length,
      combinationId,
    };
  }

  /**
   * 효과 문자열을 BackgroundEffectInfo로 파싱합니다.
   * @param effectString - 효과 문자열 (예: "screen_shake:strong")
   * @returns 파싱된 효과 정보
   */
  private static parseEffectString(effectString: string): BackgroundEffectInfo {
    const effectType = this.parseBackgroundEffectType(effectString);
    const component = this.getEffectComponent(effectType);
    const params = this.parseEffectParams(effectString, effectType);

    return {
      type: effectType,
      component,
      isActive: effectType !== 'none',
      params,
    };
  }

  /**
   * 다중 배경 효과를 래핑하는 컴포넌트를 생성합니다.
   * @param scene - 현재 씬
   * @param children - 감쌀 자식 컴포넌트
   * @param onComplete - 모든 효과 완료 시 콜백
   * @returns 다중 배경 효과가 적용된 컴포넌트 또는 원본 children
   */
  static wrapWithMultipleBackgroundEffects(
    scene: Scene | null,
    children: React.ReactNode,
    onComplete?: () => void
  ): React.ReactNode {
    const multiEffectInfo = this.getMultipleBackgroundEffectInfo(scene);

    if (!multiEffectInfo.isActive || multiEffectInfo.effects.length === 0) {
      return children;
    }

    // 단일 효과인 경우 기존 로직 사용
    if (multiEffectInfo.effects.length === 1) {
      return this.wrapWithSingleEffect(
        multiEffectInfo.effects[0],
        children,
        onComplete
      );
    }

    // 다중 효과인 경우 중첩 래핑
    return this.wrapWithNestedEffects(
      multiEffectInfo.effects,
      children,
      onComplete
    );
  }

  /**
   * 단일 효과를 래핑합니다.
   * @param effectInfo - 효과 정보
   * @param children - 자식 컴포넌트
   * @param onComplete - 완료 콜백
   * @returns 래핑된 컴포넌트
   */
  private static wrapWithSingleEffect(
    effectInfo: BackgroundEffectInfo,
    children: React.ReactNode,
    onComplete?: () => void
  ): React.ReactNode {
    if (!effectInfo.component) {
      return children;
    }

    const EffectComponent = effectInfo.component;
    const props: any = { onComplete, children };

    // 효과별 매개변수 설정
    this.applyEffectParams(props, effectInfo);

    return React.createElement(EffectComponent, props);
  }

  /**
   * 여러 효과를 중첩으로 래핑합니다.
   * @param effects - 효과들의 배열
   * @param children - 자식 컴포넌트
   * @param onComplete - 모든 효과 완료 시 콜백
   * @returns 중첩 래핑된 컴포넌트
   */
  private static wrapWithNestedEffects(
    effects: BackgroundEffectInfo[],
    children: React.ReactNode,
    onComplete?: () => void
  ): React.ReactNode {
    // 역순으로 중첩 래핑 (가장 안쪽부터)
    return effects.reduceRight((wrappedChildren, effect, index) => {
      // 마지막 효과(첫 번째)에서만 onComplete 콜백 전달
      const isLastEffect = index === 0;
      return this.wrapWithSingleEffect(
        effect,
        wrappedChildren,
        isLastEffect ? onComplete : undefined
      );
    }, children);
  }

  /**
   * 효과별 매개변수를 props에 적용합니다.
   * @param props - 적용할 props 객체
   * @param effectInfo - 효과 정보
   */
  private static applyEffectParams(
    props: any,
    effectInfo: BackgroundEffectInfo
  ): void {
    if (!effectInfo.params) return;

    switch (effectInfo.type) {
      case 'screen_shake':
        const shakeParams = effectInfo.params as ScreenShakeParams;
        props.intensity = shakeParams.intensity;
        props.duration = shakeParams.duration;
        props.frequency = shakeParams.frequency;
        break;

      case 'vignette':
        const vignetteParams = effectInfo.params as VignetteOverlayParams;
        props.color = vignetteParams.color;
        props.duration = vignetteParams.duration;
        props.maxOpacity = vignetteParams.maxOpacity;
        props.intensity = vignetteParams.intensity;
        props.fadeRange = vignetteParams.fadeRange;
        break;
    }
  }

  /**
   * 효과 간 충돌을 해결하고 최적화합니다.
   * @param effects - 원본 효과들
   * @returns 최적화된 효과들
   */
  private static resolveEffectConflicts(
    effects: BackgroundEffectInfo[]
  ): BackgroundEffectInfo[] {
    if (effects.length <= 1) return effects;

    // 효과 구체적 식별자로 중복 제거 (타입 + 매개변수 조합)
    const effectMap = new Map<string, BackgroundEffectInfo>();

    effects.forEach(effect => {
      // 효과의 고유 식별자 생성 (타입 + 매개변수)
      const effectId = this.generateEffectId(effect);
      effectMap.set(effectId, effect);
    });

    // 중복 제거된 효과들
    const uniqueEffects = Array.from(effectMap.values());

    // 성능 임계값 검사 (최대 5개 효과까지만 허용)
    if (uniqueEffects.length > 5) {
      // Logger.warn('[BackgroundEffectManager]', '너무 많은 효과가 감지되었습니다. 처음 5개만 적용합니다.');
      return uniqueEffects.slice(0, 5);
    }

    return uniqueEffects;
  }

  /**
   * 효과의 고유 식별자를 생성합니다.
   * 타입과 매개변수를 조합하여 구체적인 효과를 구분합니다.
   * @param effect - 효과 정보
   * @returns 고유 식별자
   */
  private static generateEffectId(effect: BackgroundEffectInfo): string {
    const baseId = effect.type;

    if (!effect.params) {
      return baseId;
    }

    // 매개변수를 정렬하여 일관된 ID 생성
    const paramsString = JSON.stringify(
      effect.params,
      Object.keys(effect.params).sort()
    );
    return `${baseId}:${paramsString}`;
  }

  /**
   * 조합 식별자를 생성합니다.
   * 여러 효과의 조합을 나타내는 고유한 식별자입니다.
   * @param effects - 효과들의 배열
   * @returns 조합 식별자
   */
  private static generateCombinationId(
    effects: BackgroundEffectInfo[]
  ): string {
    if (effects.length === 0) return 'none';

    const effectIds = effects.map(effect => this.generateEffectId(effect));
    return effectIds.sort().join('+');
  }
}

export default BackgroundEffectManager;
