import React from 'react';
import HealthWarning, {
  HealthWarningProps,
} from '../../../components/background/effects/HealthWarning';
import { RESOURCES } from '../../../constants/gameConfig';
import {
  determineGameStateEffect,
  GAMESTATE_EFFECT_PRIORITY,
  GameStateEffectType,
  getHealthWarningConfig,
  HEALTH_THRESHOLDS,
} from '../../../constants/gameStateEffectConfig';
import { GameState } from '../../../types';

/**
 * 게임 상태 기반 효과 정보 인터페이스
 */
export interface GameStateEffectInfo {
  /** 효과 타입 */
  type: GameStateEffectType;
  /** 효과 컴포넌트 */
  component: React.ComponentType<any> | null;
  /** 효과 활성화 여부 */
  isActive: boolean;
  /** 효과 매개변수 */
  params?: any;
  /** 효과 우선순위 */
  priority: number;
  /** 효과 이유 (디버깅용) */
  reason?: string;
}

/**
 * 상태 모니터링 결과 인터페이스
 */
export interface StateMonitoringResult {
  /** 현재 활성화된 효과 */
  activeEffect: GameStateEffectInfo;
  /** 체력 상태 정보 */
  healthStatus: {
    percentage: number;
    level: 'normal' | 'warning' | 'critical' | 'extreme';
    thresholdPassed: keyof typeof HEALTH_THRESHOLDS | null;
  };
  /** 모니터링 시간 */
  timestamp: number;
}

/**
 * 게임 상태 기반 배경 효과를 모니터링하고 관리하는 클래스
 * 게임 상태 변화에 따라 자동으로 적절한 배경 효과를 활성화/비활성화합니다.
 */
export class GameStateEffectMonitor {
  private static instance: GameStateEffectMonitor | null = null;
  private currentState: GameState | null = null;
  private lastMonitoringResult: StateMonitoringResult | null = null;
  private stateChangeCallbacks: Array<(result: StateMonitoringResult) => void> =
    [];

  private constructor() {}

  /**
   * 싱글톤 인스턴스를 반환합니다.
   */
  static getInstance(): GameStateEffectMonitor {
    if (!this.instance) {
      this.instance = new GameStateEffectMonitor();
    }
    return this.instance;
  }

  /**
   * 게임 상태를 업데이트하고 효과를 분석합니다.
   * @param gameState - 새로운 게임 상태
   * @returns 상태 모니터링 결과
   */
  updateGameState(gameState: GameState): StateMonitoringResult {
    this.currentState = gameState;
    const result = this.analyzeGameState(gameState);

    // 상태 변화가 있으면 콜백 호출
    if (this.hasSignificantChange(result)) {
      this.lastMonitoringResult = result;
      this.notifyStateChange(result);
    }

    return result;
  }

  /**
   * 게임 상태를 분석하여 적절한 효과를 결정합니다.
   * @param gameState - 분석할 게임 상태
   * @returns 상태 모니터링 결과
   */
  private analyzeGameState(gameState: GameState): StateMonitoringResult {
    const maxHealth = RESOURCES.health.maxValue;
    const healthPercentage = gameState.health / maxHealth;

    // 체력 상태 분석
    const healthStatus = this.analyzeHealthStatus(healthPercentage);

    // 적절한 효과 결정
    const effectType = determineGameStateEffect(
      gameState.health,
      maxHealth,
      gameState.mind,
      RESOURCES.mind.maxValue
    );

    const activeEffect = this.createEffectInfo(effectType, gameState);

    return {
      activeEffect,
      healthStatus,
      timestamp: Date.now(),
    };
  }

  /**
   * 체력 상태를 분석합니다.
   * @param healthPercentage - 체력 비율 (0~1)
   * @returns 체력 상태 정보
   */
  private analyzeHealthStatus(healthPercentage: number) {
    let level: 'normal' | 'warning' | 'critical' | 'extreme' = 'normal';
    let thresholdPassed: keyof typeof HEALTH_THRESHOLDS | null = null;

    if (healthPercentage < HEALTH_THRESHOLDS.EXTREME_THRESHOLD) {
      level = 'extreme';
      thresholdPassed = 'EXTREME_THRESHOLD';
    } else if (healthPercentage < HEALTH_THRESHOLDS.CRITICAL_THRESHOLD) {
      level = 'critical';
      thresholdPassed = 'CRITICAL_THRESHOLD';
    } else if (healthPercentage < HEALTH_THRESHOLDS.WARNING_THRESHOLD) {
      level = 'warning';
      thresholdPassed = 'WARNING_THRESHOLD';
    }

    return {
      percentage: healthPercentage,
      level,
      thresholdPassed,
    };
  }

  /**
   * 효과 타입에 따른 효과 정보를 생성합니다.
   * @param effectType - 효과 타입
   * @param gameState - 게임 상태
   * @returns 효과 정보
   */
  private createEffectInfo(
    effectType: GameStateEffectType,
    gameState: GameState
  ): GameStateEffectInfo {
    switch (effectType) {
      case 'health_warning':
        return this.createHealthWarningInfo(gameState);

      case 'mind_distortion':
        // 미래 확장용
        return {
          type: 'mind_distortion',
          component: null,
          isActive: false,
          priority: GAMESTATE_EFFECT_PRIORITY.mind_distortion,
          reason: '미래 확장용 - 아직 구현되지 않음',
        };

      case 'none':
      default:
        return {
          type: 'none',
          component: null,
          isActive: false,
          priority: GAMESTATE_EFFECT_PRIORITY.none,
          reason: '상태 기반 효과 불필요',
        };
    }
  }

  /**
   * HealthWarning 효과 정보를 생성합니다.
   * @param gameState - 게임 상태
   * @returns HealthWarning 효과 정보
   */
  private createHealthWarningInfo(gameState: GameState): GameStateEffectInfo {
    const healthPercentage = gameState.health / RESOURCES.health.maxValue;
    const warningConfig = getHealthWarningConfig(healthPercentage);

    if (!warningConfig) {
      return {
        type: 'health_warning',
        component: null,
        isActive: false,
        priority: GAMESTATE_EFFECT_PRIORITY.health_warning,
        reason: '체력이 충분함',
      };
    }

    const params: Partial<HealthWarningProps> = {
      color: warningConfig.color,
      pulseInterval: warningConfig.pulseInterval,
      maxOpacity: warningConfig.maxOpacity,
      minOpacity: warningConfig.minOpacity,
      borderWidth: warningConfig.borderWidth,
    };

    return {
      type: 'health_warning',
      component: HealthWarning,
      isActive: true,
      params,
      priority: GAMESTATE_EFFECT_PRIORITY.health_warning,
      reason: `체력 ${Math.round(healthPercentage * 100)}% (임계값: ${Math.round(HEALTH_THRESHOLDS.WARNING_THRESHOLD * 100)}%)`,
    };
  }

  /**
   * 이전 결과와 비교하여 유의미한 변화가 있는지 확인합니다.
   * @param newResult - 새로운 모니터링 결과
   * @returns 유의미한 변화 여부
   */
  private hasSignificantChange(newResult: StateMonitoringResult): boolean {
    if (!this.lastMonitoringResult) {
      return true; // 첫 번째 결과는 항상 유의미함
    }

    const oldResult = this.lastMonitoringResult;

    // 효과 타입 변화
    if (oldResult.activeEffect.type !== newResult.activeEffect.type) {
      return true;
    }

    // 효과 활성화 상태 변화
    if (oldResult.activeEffect.isActive !== newResult.activeEffect.isActive) {
      return true;
    }

    // 체력 레벨 변화
    if (oldResult.healthStatus.level !== newResult.healthStatus.level) {
      return true;
    }

    return false;
  }

  /**
   * 상태 변화 콜백을 등록합니다.
   * @param callback - 상태 변화 시 호출할 콜백
   */
  onStateChange(callback: (result: StateMonitoringResult) => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * 상태 변화 콜백을 제거합니다.
   * @param callback - 제거할 콜백
   */
  offStateChange(callback: (result: StateMonitoringResult) => void): void {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * 등록된 모든 콜백에 상태 변화를 알립니다.
   * @param result - 상태 모니터링 결과
   */
  private notifyStateChange(result: StateMonitoringResult): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (_error) {
        // Logger.error('[GameStateEffectMonitor]', '게임 상태 변화 콜백 실행 중 오류:', error);
      }
    });
  }

  /**
   * 현재 모니터링 결과를 반환합니다.
   * @returns 현재 상태 모니터링 결과 또는 null
   */
  getCurrentResult(): StateMonitoringResult | null {
    return this.lastMonitoringResult;
  }

  /**
   * 상태 기반 효과를 래핑하는 컴포넌트를 생성합니다.
   * @param children - 감쌀 자식 컴포넌트
   * @param onComplete - 효과 완료 시 콜백
   * @returns 상태 기반 효과가 적용된 컴포넌트 또는 원본 children
   */
  wrapWithGameStateEffect(
    children: React.ReactNode,
    onComplete?: () => void
  ): React.ReactNode {
    if (
      !this.lastMonitoringResult ||
      !this.lastMonitoringResult.activeEffect.isActive
    ) {
      return children;
    }

    const effectInfo = this.lastMonitoringResult.activeEffect;

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
   * 디버그 정보를 생성합니다.
   * @returns 디버그 정보 문자열
   */
  getDebugInfo(): string {
    if (!this.lastMonitoringResult) {
      return '모니터링 결과 없음';
    }

    const result = this.lastMonitoringResult;
    const healthPercent = Math.round(result.healthStatus.percentage * 100);
    const effectActive = result.activeEffect.isActive ? '활성' : '비활성';

    return (
      `상태효과: ${result.activeEffect.type} (${effectActive})\n` +
      `체력: ${healthPercent}% (${result.healthStatus.level})\n` +
      `사유: ${result.activeEffect.reason || '없음'}`
    );
  }

  /**
   * 모니터를 초기화합니다.
   */
  reset(): void {
    this.currentState = null;
    this.lastMonitoringResult = null;
    this.stateChangeCallbacks = [];
  }
}
