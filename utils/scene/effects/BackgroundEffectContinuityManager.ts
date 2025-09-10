import { useCallback, useEffect, useRef, useState } from 'react';
import { Scene } from '../../../types';
import { Logger } from '../../system/Logger';
import {
  BackgroundEffectInfo,
  BackgroundEffectManager,
  BackgroundEffectType,
} from './BackgroundEffectManager';

/**
 * 배경 효과 연속성 상태 인터페이스
 */
export interface EffectContinuityState {
  /** 현재 활성 효과 타입 */
  activeEffectType: BackgroundEffectType;
  /** 현재 효과 시작 시간 */
  effectStartTime: number;
  /** 연속성 상태 */
  isContinuous: boolean;
  /** 총 효과 지속 시간 */
  totalDuration: number;
  /** 효과 재시작 횟수 */
  restartCount: number;
}

/**
 * 배경 효과 성능 메트릭 인터페이스
 */
export interface EffectPerformanceMetrics {
  /** 현재 메모리 사용량 (MB) */
  memoryUsage: number;
  /** 평균 FPS */
  averageFps: number;
  /** 효과 렌더링 시간 (ms) */
  renderTime: number;
  /** 마지막 성능 측정 시간 */
  lastMeasured: number;
}

/**
 * 배경 효과 연속성 정보 인터페이스
 */
export interface BackgroundEffectContinuityInfo {
  /** 현재 효과 정보 */
  currentEffect: BackgroundEffectInfo;
  /** 연속성 상태 */
  continuityState: EffectContinuityState;
  /** 성능 메트릭 */
  performanceMetrics: EffectPerformanceMetrics;
  /** 디버그 정보 */
  debugInfo: string;
}

/**
 * 배경 효과 연속성을 관리하는 클래스
 * 씬 전환 시 효과의 끊김 없는 연속성과 성능 최적화를 담당합니다.
 */
export class BackgroundEffectContinuityManager {
  private static instance: BackgroundEffectContinuityManager | null = null;
  private currentEffect: BackgroundEffectInfo | null = null;
  private continuityState: EffectContinuityState | null = null;
  private performanceMetrics: EffectPerformanceMetrics;
  private performanceTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.performanceMetrics = {
      memoryUsage: 0,
      averageFps: 60,
      renderTime: 0,
      lastMeasured: Date.now(),
    };
    this.startPerformanceMonitoring();
  }

  /**
   * 싱글톤 인스턴스를 반환합니다.
   */
  static getInstance(): BackgroundEffectContinuityManager {
    if (!this.instance) {
      this.instance = new BackgroundEffectContinuityManager();
    }
    return this.instance;
  }

  /**
   * 성능 모니터링을 시작합니다.
   */
  private startPerformanceMonitoring(): void {
    this.performanceTimer = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000); // 1초마다 업데이트
  }

  /**
   * 성능 메트릭을 업데이트합니다.
   */
  private updatePerformanceMetrics(): void {
    // 메모리 사용량 추정 (React Native 환경에서는 간단한 추정값 사용)
    try {
      // 웹 환경에서만 실제 메모리 정보 사용
      if (
        typeof window !== 'undefined' &&
        (window as any).performance &&
        (window as any).performance.memory
      ) {
        const memory = (window as any).performance.memory;
        this.performanceMetrics.memoryUsage =
          Math.round((memory.usedJSHeapSize / 1024 / 1024) * 100) / 100;
      } else {
        // React Native나 메모리 API가 없는 환경에서는 추정값 사용
        const estimatedMemory = this.currentEffect?.isActive
          ? Math.random() * 10 + 15 // 15-25MB 추정
          : Math.random() * 5 + 8; // 8-13MB 추정
        this.performanceMetrics.memoryUsage =
          Math.round(estimatedMemory * 100) / 100;
      }
    } catch (_error) {
      // 오류 발생 시 기본값 사용
      this.performanceMetrics.memoryUsage = this.currentEffect?.isActive
        ? 20
        : 10;
    }

    // FPS 추정 (실제 구현에서는 requestAnimationFrame 사용)
    this.performanceMetrics.averageFps = Math.max(
      30,
      Math.min(60, 60 - (this.currentEffect?.isActive ? 5 : 0))
    );

    this.performanceMetrics.lastMeasured = Date.now();
  }

  /**
   * 씬 전환 시 효과 연속성을 처리합니다.
   * @param newScene - 새로운 씬
   * @param onTransition - 전환 완료 콜백
   * @returns 연속성 정보
   */
  processEffectTransition(
    newScene: Scene | null,
    onTransition?: (continuousEffect: boolean, isActive: boolean) => void
  ): BackgroundEffectContinuityInfo {
    const newEffectInfo =
      BackgroundEffectManager.getBackgroundEffectInfo(newScene);
    Logger.debug(
      '[ContinuityManager]',
      `processEffectTransition: newEffect={ type=${newEffectInfo.type}, active=${newEffectInfo.isActive} }`
    );
    const isContinuous = this.shouldMaintainEffect(newEffectInfo);

    // 연속성 상태 업데이트
    if (isContinuous && this.continuityState) {
      // 같은 효과 유지 - 연속성 정보만 업데이트
      this.continuityState.isContinuous = true;
      this.continuityState.totalDuration =
        Date.now() - this.continuityState.effectStartTime;

      Logger.debug(
        '[ContinuityManager]',
        `🔄 효과 연속성 유지: ${newEffectInfo.type}`
      );
    } else {
      // 새로운 효과 시작 또는 효과 종료
      if (newEffectInfo.isActive) {
        this.continuityState = {
          activeEffectType: newEffectInfo.type,
          effectStartTime: Date.now(),
          isContinuous: false,
          totalDuration: 0,
          restartCount: this.getRestartCount(newEffectInfo.type),
        };

        Logger.debug(
          '[ContinuityManager]',
          `🆕 새로운 효과 시작: ${newEffectInfo.type}`
        );
      } else {
        this.continuityState = null;
        Logger.debug('[ContinuityManager]', '⏹️ 효과 종료');
      }
    }

    this.currentEffect = newEffectInfo;

    // 전환 완료 콜백 호출
    if (onTransition) {
      onTransition(isContinuous, newEffectInfo.isActive);
    }

    return this.getContinuityInfo();
  }

  /**
   * 현재 효과를 유지해야 하는지 판단합니다.
   * @param newEffectInfo - 새로운 효과 정보
   * @returns 연속성 유지 여부
   */
  private shouldMaintainEffect(newEffectInfo: BackgroundEffectInfo): boolean {
    if (!this.currentEffect || !this.continuityState) {
      return false;
    }

    // 효과가 비활성화되면 연속성 중단
    if (!newEffectInfo.isActive) {
      return false;
    }

    // 효과 타입이 다르면 연속성 중단
    if (this.currentEffect.type !== newEffectInfo.type) {
      return false;
    }

    // 매개변수가 크게 다르면 연속성 중단
    if (
      !this.areParamsSimilar(this.currentEffect.params, newEffectInfo.params)
    ) {
      return false;
    }

    return true;
  }

  /**
   * 효과 매개변수가 유사한지 확인합니다.
   * @param currentParams - 현재 매개변수
   * @param newParams - 새로운 매개변수
   * @returns 유사성 여부
   */
  private areParamsSimilar(currentParams: any, newParams: any): boolean {
    if (!currentParams || !newParams) {
      return currentParams === newParams;
    }

    // 강도 차이가 50% 이상이면 다른 효과로 간주
    if (currentParams.intensity && newParams.intensity) {
      const intensityDiff = Math.abs(
        currentParams.intensity - newParams.intensity
      );
      const avgIntensity = (currentParams.intensity + newParams.intensity) / 2;
      if (intensityDiff / avgIntensity > 0.5) {
        return false;
      }
    }

    // 색상이 다르면 다른 효과로 간주
    if (currentParams.color && newParams.color) {
      if (currentParams.color !== newParams.color) {
        return false;
      }
    }

    return true;
  }

  /**
   * 특정 효과 타입의 재시작 횟수를 반환합니다.
   * @param effectType - 효과 타입
   * @returns 재시작 횟수
   */
  private getRestartCount(effectType: BackgroundEffectType): number {
    if (!this.continuityState) {
      return 0;
    }

    if (this.continuityState.activeEffectType === effectType) {
      return this.continuityState.restartCount + 1;
    }

    return 0;
  }

  /**
   * 현재 연속성 정보를 반환합니다.
   */
  getContinuityInfo(): BackgroundEffectContinuityInfo {
    const currentEffect = this.currentEffect || {
      type: 'none' as BackgroundEffectType,
      component: null,
      isActive: false,
    };

    const continuityState = this.continuityState || {
      activeEffectType: 'none' as BackgroundEffectType,
      effectStartTime: Date.now(),
      isContinuous: false,
      totalDuration: 0,
      restartCount: 0,
    };

    const debugInfo = this.generateDebugInfo();

    return {
      currentEffect,
      continuityState,
      performanceMetrics: { ...this.performanceMetrics },
      debugInfo,
    };
  }

  /**
   * 디버그 정보를 생성합니다.
   */
  private generateDebugInfo(): string {
    if (!this.currentEffect?.isActive) {
      return '배경 효과 없음';
    }

    const lines = [`활성 효과: ${this.currentEffect.type}`];

    if (this.continuityState) {
      const duration =
        this.continuityState.totalDuration ||
        Date.now() - this.continuityState.effectStartTime;

      lines.push(`지속 시간: ${Math.round(duration / 1000)}초`);
      lines.push(
        `연속성: ${this.continuityState.isContinuous ? '유지됨' : '새 시작'}`
      );
      lines.push(`재시작 횟수: ${this.continuityState.restartCount}`);
    }

    lines.push(`메모리: ${this.performanceMetrics.memoryUsage}MB`);
    lines.push(`FPS: ${this.performanceMetrics.averageFps}`);

    return lines.join('\n');
  }

  /**
   * 효과를 강제로 중단합니다.
   */
  forceStopEffect(): void {
    Logger.warn('[ContinuityManager]', '🛑 효과 강제 중단');
    this.currentEffect = null;
    this.continuityState = null;
  }

  /**
   * 연속성 매니저를 정리합니다.
   */
  dispose(): void {
    if (this.performanceTimer) {
      clearInterval(this.performanceTimer);
      this.performanceTimer = null;
    }
    this.forceStopEffect();
    BackgroundEffectContinuityManager.instance = null;
  }
}

/**
 * 배경 효과 연속성을 관리하는 React Hook
 * @returns 연속성 관리 관련 함수들과 상태
 */
export function useBackgroundEffectContinuity() {
  const manager = useRef(BackgroundEffectContinuityManager.getInstance());
  const [continuityInfo, setContinuityInfo] =
    useState<BackgroundEffectContinuityInfo>(
      manager.current.getContinuityInfo()
    );

  /**
   * 씬 전환 시 효과 연속성을 처리합니다.
   */
  const processTransition = useCallback(
    (
      newScene: Scene | null,
      onTransition?: (continuousEffect: boolean, isActive: boolean) => void
    ) => {
      const info = manager.current.processEffectTransition(
        newScene,
        onTransition
      );
      setContinuityInfo(info);
      return info;
    },
    []
  );

  /**
   * 현재 연속성 정보를 업데이트합니다.
   */
  const updateContinuityInfo = useCallback(() => {
    const info = manager.current.getContinuityInfo();
    setContinuityInfo(info);
  }, []);

  /**
   * 효과를 강제로 중단합니다.
   */
  const forceStopEffect = useCallback(() => {
    manager.current.forceStopEffect();
    updateContinuityInfo();
  }, [updateContinuityInfo]);

  // 정기적으로 연속성 정보 업데이트
  useEffect(() => {
    const interval = setInterval(updateContinuityInfo, 2000); // 2초마다
    return () => clearInterval(interval);
  }, [updateContinuityInfo]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 마지막 컴포넌트가 언마운트될 때만 정리
      // 실제로는 앱 종료 시에만 호출되어야 함
    };
  }, []);

  return {
    continuityInfo,
    processTransition,
    updateContinuityInfo,
    forceStopEffect,
  };
}

export default BackgroundEffectContinuityManager;
