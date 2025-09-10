import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { GameState, Scene } from '../../types';
import { BackgroundEffectManager } from '../../utils/scene/effects/BackgroundEffectManager';
import HealthWarning from './effects/HealthWarning';
import VignetteOverlay from './effects/VignetteOverlay';

interface BackgroundEffectHostProps {
  /** 현재 씬 */
  scene: Scene | null;
  /** 현재 게임 상태 */
  gameState: GameState | null;
  /** 자식 콘텐츠 (씬 UI 전체) */
  children: React.ReactNode;
  /** 최상위 효과 완료 콜백 (옵션) */
  onEffectComplete?: () => void;
}

/**
 * 화면 효과(비네트/스크린셰이크/상태기반) 적용을 위한 고정 호스트 컨테이너
 * - 항상 동일한 부모/계층 구조를 유지하여 깜빡임(리마운트)을 방지합니다.
 * - 스크린셰이크는 내부 Animated.View 변환으로 처리합니다.
 * - 비네트/헬스워닝은 절대 위치 오버레이로 얹습니다.
 */
export default function BackgroundEffectHost({
  scene,
  gameState,
  children,
  onEffectComplete,
}: BackgroundEffectHostProps) {
  // 통합 효과 정보 계산 (씬 + 상태)
  const unifiedInfo = useMemo(() => {
    return BackgroundEffectManager.getUnifiedBackgroundEffectInfo(
      scene,
      gameState
    );
  }, [scene, gameState]);

  // ===== 스크린 셰이크 파라미터 추출 =====
  const shakeParams = useMemo(() => {
    // 우선순위 배열에서 scene 기반 screen_shake 검색
    for (const eff of unifiedInfo.prioritizedEffects) {
      if (!('priority' in eff) && eff.type === 'screen_shake' && eff.isActive) {
        return eff.params as {
          intensity: number;
          duration?: number;
          frequency: number;
        };
      }
    }
    return null;
  }, [unifiedInfo]);

  // ===== 비네트 파라미터 추출 =====
  const vignetteParams = useMemo(() => {
    for (const eff of unifiedInfo.prioritizedEffects) {
      if (!('priority' in eff) && eff.type === 'vignette' && eff.isActive) {
        return eff.params as {
          color: string;
          duration?: number;
          maxOpacity: number;
          intensity: number;
          fadeRange: number;
        };
      }
    }
    return null;
  }, [unifiedInfo]);

  // ===== 상태 기반(헬스 워닝) 파라미터 추출 =====
  const healthWarningParams = useMemo(() => {
    if (
      unifiedInfo.gameStateEffect &&
      unifiedInfo.gameStateEffect.isActive &&
      unifiedInfo.gameStateEffect.type === 'health_warning'
    ) {
      return unifiedInfo.gameStateEffect.params as any;
    }
    return null;
  }, [unifiedInfo]);

  // ===== 스크린 셰이크 애니메이션 구현 (항상 동일 컨테이너 유지) =====
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;
  const currentAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const isUnmountedRef = useRef(false);

  const stopShake = () => {
    if (currentAnimRef.current) {
      currentAnimRef.current.stop();
      currentAnimRef.current = null;
    }
    shakeX.stopAnimation();
    shakeY.stopAnimation();
    shakeX.setValue(0);
    shakeY.setValue(0);
  };

  const startShake = (
    intensity: number,
    frequency: number,
    duration?: number
  ) => {
    // 방어: 비활성 또는 언마운트 시 중단
    if (isUnmountedRef.current || intensity <= 0 || frequency <= 0) {
      stopShake();
      return;
    }

    const createCycle = (
      cycleDuration: number
    ): Animated.CompositeAnimation => {
      const count = Math.max(1, Math.floor(cycleDuration / frequency));
      const seq: Animated.CompositeAnimation[] = [];
      for (let i = 0; i < count; i++) {
        const randX = (Math.random() - 0.5) * 2 * intensity;
        const randY = (Math.random() - 0.5) * 2 * intensity;
        seq.push(
          Animated.parallel([
            Animated.timing(shakeX, {
              toValue: randX,
              duration: frequency / 2,
              useNativeDriver: true,
            }),
            Animated.timing(shakeY, {
              toValue: randY,
              duration: frequency / 2,
              useNativeDriver: true,
            }),
          ])
        );
        seq.push(
          Animated.parallel([
            Animated.timing(shakeX, {
              toValue: 0,
              duration: frequency / 2,
              useNativeDriver: true,
            }),
            Animated.timing(shakeY, {
              toValue: 0,
              duration: frequency / 2,
              useNativeDriver: true,
            }),
          ])
        );
      }
      return Animated.sequence(seq);
    };

    if (!duration || duration === 0) {
      // 무한 반복: 내부에서 일정 길이 사이클을 반복
      const cycleDuration = 10000;
      const loop = () => {
        if (isUnmountedRef.current) return;
        currentAnimRef.current = createCycle(cycleDuration);
        currentAnimRef.current.start(({ finished }) => {
          if (finished && !isUnmountedRef.current) loop();
        });
      };
      loop();
    } else {
      currentAnimRef.current = createCycle(duration);
      currentAnimRef.current.start(({ finished }) => {
        if (finished && !isUnmountedRef.current) {
          stopShake();
          // 최상위 효과 완료 콜백 (옵션)
          onEffectComplete?.();
        }
      });
    }
  };

  useEffect(() => {
    isUnmountedRef.current = false;
    // 파라미터 변경 시 셰이크 재구동
    stopShake();
    if (shakeParams) {
      startShake(
        shakeParams.intensity,
        shakeParams.frequency,
        shakeParams.duration
      );
    }
    return () => {
      isUnmountedRef.current = true;
      stopShake();
    };
  }, [shakeParams?.intensity, shakeParams?.frequency, shakeParams?.duration]);

  return (
    <View style={styles.container}>
      {/* 스크린셰이크 적용 컨테이너 (항상 존재) */}
      <Animated.View
        style={[
          styles.shakeContainer,
          { transform: [{ translateX: shakeX }, { translateY: shakeY }] },
        ]}
      >
        {children}
      </Animated.View>

      {/* 상태 기반 오버레이 (예: 체력 경고) - 부모 유지, 오버레이만 토글 */}
      {healthWarningParams ? (
        <HealthWarning {...healthWarningParams} children={null} />
      ) : null}

      {/* 비네트 오버레이 - 부모 유지, 오버레이만 토글 */}
      {vignetteParams ? (
        <VignetteOverlay
          {...vignetteParams}
          onComplete={onEffectComplete}
          children={null}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shakeContainer: {
    flex: 1,
  },
});
