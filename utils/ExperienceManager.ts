import {
  AUTO_LEVELUP_TYPES,
  EXPERIENCE_CONFIGS,
  getExperienceConfig,
  isValidExperienceType,
  MANUAL_LEVELUP_TYPES,
} from '../constants/experienceConfig';
import { STAT_KEYS, STATS } from '../constants/gameConfig';
import { ExperienceEffects, GameState } from '../types';
import { Logger } from './system/Logger';

/**
 * 통합 경험치 관리 클래스
 * 모든 경험치 타입(능력치, 레벨, 랭크 등)을 통합적으로 관리
 */
export class ExperienceManager {
  /**
   * 경험치 효과를 게임 상태에 적용합니다.
   * @param gameState - 현재 게임 상태
   * @param effects - 적용할 경험치 효과 (양수: 추가, 음수: 감소)
   * @returns 경험치가 적용되고 자동 레벨업이 처리된 새로운 게임 상태
   */
  static applyExperience(
    gameState: GameState,
    effects: ExperienceEffects,
    options?: { silent?: boolean }
  ): GameState {
    const silent = options?.silent === true;
    let newState = {
      ...gameState,
      experience: { ...gameState.experience },
      levels: { ...gameState.levels },
    };

    const addEffects: { target: string; amount: number }[] = [];
    const subEffects: { target: string; amount: number }[] = [];

    // 효과를 추가/감소로 분류
    for (const [expType, amount] of Object.entries(effects)) {
      if (typeof amount === 'number' && amount !== 0) {
        if (amount > 0) {
          addEffects.push({ target: expType, amount });
        } else {
          subEffects.push({ target: expType, amount: Math.abs(amount) });
        }
      }
    }

    if (!silent) {
      Logger.debug(
        '[ExperienceManager]',
        `경험치 효과 적용: ${Object.keys(effects).length}개 타입 (추가: ${addEffects.length}, 감소: ${subEffects.length})`
      );
    }

    // 추가 효과 적용
    if (addEffects.length > 0) {
      newState = this.processExperienceChanges(
        newState,
        addEffects,
        true,
        silent
      );
    }

    // 감소 효과 적용
    if (subEffects.length > 0) {
      newState = this.processExperienceChanges(
        newState,
        subEffects,
        false,
        silent
      );
    }

    // 자동 레벨업 처리 (추가 효과가 있을 때만)
    if (addEffects.length > 0) {
      newState = this.checkAndProcessLevelUps(newState, undefined, silent);
    }

    return newState;
  }

  /**
   * 경험치 변화를 실제로 처리합니다.
   * @param gameState - 현재 게임 상태
   * @param effects - 적용할 경험치 효과 배열
   * @param isAddition - true: 추가, false: 감소
   * @returns 경험치가 변경된 새로운 게임 상태
   */
  private static processExperienceChanges(
    gameState: GameState,
    effects: { target: string; amount: number }[],
    isAddition: boolean,
    silent?: boolean
  ): GameState {
    let newState = {
      ...gameState,
      experience: { ...gameState.experience },
    };

    for (const effect of effects) {
      if (!isValidExperienceType(effect.target)) {
        if (!silent) {
          Logger.warn(
            '[ExperienceManager]',
            `알 수 없는 경험치 타입: ${effect.target}`
          );
        }
        continue;
      }

      const config = getExperienceConfig(effect.target)!;
      const currentExp = newState.experience[effect.target] || 0;
      const newExp = isAddition
        ? currentExp + effect.amount
        : currentExp - effect.amount;

      newState.experience[effect.target] = newExp;

      const changeType = isAddition ? '추가' : '감소';
      const changeSymbol = isAddition ? '+' : '-';
      if (!silent) {
        Logger.debug(
          '[ExperienceManager]',
          `${config.displayName} 경험치 ${changeType}: ${currentExp} → ${newExp} (${changeSymbol}${effect.amount})`
        );
      }

      // 경험치가 음수가 되었을 때 로그 (감소의 경우)
      if (!isAddition && newExp < 0 && !silent) {
        Logger.warn(
          '[ExperienceManager]',
          `${config.displayName} 경험치가 음수가 되었습니다: ${newExp} (레벨은 유지됨)`
        );
      }
    }

    return newState;
  }

  /**
   * 지정된 경험치 타입들을 확인하고 레벨업을 처리합니다.
   * @param gameState - 현재 게임 상태
   * @param experienceTypes - 레벨업을 검사할 경험치 타입 배열 (생략 시 자동 레벨업 타입들만 검사)
   * @returns 레벨업이 처리된 새로운 게임 상태
   */
  static checkAndProcessLevelUps(
    gameState: GameState,
    experienceTypes?: string[],
    silent?: boolean
  ): GameState {
    let newState = {
      ...gameState,
      experience: { ...gameState.experience },
      levels: { ...gameState.levels },
    };

    // 검사할 타입들 결정: 지정되지 않으면 자동 레벨업 타입들 사용
    const typesToCheck = experienceTypes || AUTO_LEVELUP_TYPES;
    const isAutoLevelUp = !experienceTypes; // 자동 레벨업인지 구분

    if (!silent) {
      Logger.debug(
        '[ExperienceManager]',
        `레벨업 검사 시작: ${typesToCheck.length}개 타입 (${isAutoLevelUp ? '자동' : '수동'})`
      );
    }

    for (const experienceType of typesToCheck) {
      if (!isValidExperienceType(experienceType)) {
        if (!silent) {
          Logger.warn(
            '[ExperienceManager]',
            `알 수 없는 경험치 타입: ${experienceType}`
          );
        }
        continue;
      }

      const config = getExperienceConfig(experienceType)!;

      // 수동 레벨업 요청인데 자동 레벨업 타입인 경우 경고
      if (!isAutoLevelUp && config.autoLevelUp) {
        if (!silent) {
          Logger.warn(
            '[ExperienceManager]',
            `${config.displayName}은 자동 레벨업 타입입니다. 수동 레벨업을 건너뜁니다.`
          );
        }
        continue;
      }

      let levelUpCount = 0;
      let wasLeveledUp = false;

      // 연쇄 레벨업 처리 (한 번에 여러 레벨 상승 가능)
      do {
        const canLevel = this.canLevelUp(experienceType, newState);
        if (canLevel) {
          newState = this.processLevelUp(experienceType, newState, { silent });
          levelUpCount++;
          wasLeveledUp = true;
        } else {
          break;
        }
      } while (true);

      if (wasLeveledUp) {
        const levelUpType = isAutoLevelUp ? '자동' : '수동';
        if (!silent) {
          if (levelUpCount === 1) {
            Logger.info(
              '[ExperienceManager]',
              `${config.displayName} ${levelUpType} 레벨업 완료: Lv.${newState.levels[experienceType]}`
            );
          } else {
            Logger.info(
              '[ExperienceManager]',
              `${config.displayName} ${levelUpType} 연쇄 레벨업 완료: ${levelUpCount}회 상승 → Lv.${newState.levels[experienceType]}`
            );
          }
        }
      } else if (!isAutoLevelUp) {
        // 수동 레벨업에서만 실패 로그 표시
        if (!silent) {
          Logger.warn(
            '[ExperienceManager]',
            `${config.displayName} 레벨업 불가능: 경험치 부족 또는 최대 레벨`
          );
        }
      }
    }

    return newState;
  }

  /**
   * 특정 경험치 타입이 레벨업 가능한지 확인합니다.
   * @param experienceType - 확인할 경험치 타입
   * @param gameState - 현재 게임 상태
   * @returns 레벨업 가능 여부
   */
  static canLevelUp(experienceType: string, gameState: GameState): boolean {
    const config = getExperienceConfig(experienceType);
    if (!config) {
      Logger.warn(
        '[ExperienceManager]',
        `알 수 없는 경험치 타입: ${experienceType}`
      );
      return false;
    }

    const currentLevel = gameState.levels[experienceType] || 0;
    const currentExp = gameState.experience[experienceType] || 0;

    // 최대 레벨 확인
    if (config.maxLevel && currentLevel >= config.maxLevel) {
      return false;
    }

    // 레벨업에 필요한 경험치 확인
    const expToLevel = this.getExpToLevel(experienceType, currentLevel);
    return currentExp >= expToLevel;
  }

  /**
   * 특정 경험치 타입의 레벨업을 처리합니다.
   * @param experienceType - 레벨업할 경험치 타입
   * @param gameState - 현재 게임 상태
   * @returns 레벨업이 처리된 새로운 게임 상태
   */
  static processLevelUp(
    experienceType: string,
    gameState: GameState,
    options?: { silent?: boolean }
  ): GameState {
    const silent = options?.silent === true;
    const config = getExperienceConfig(experienceType);
    if (!config) {
      Logger.warn(
        '[ExperienceManager]',
        `알 수 없는 경험치 타입: ${experienceType}`
      );
      return gameState;
    }

    const currentLevel = gameState.levels[experienceType] || 0;
    const currentExp = gameState.experience[experienceType] || 0;
    const expToLevel = this.getExpToLevel(experienceType, currentLevel);

    if (currentExp < expToLevel) {
      Logger.warn(
        '[ExperienceManager]',
        `레벨업 조건 미충족: ${experienceType}`
      );
      return gameState;
    }

    const newLevel = currentLevel + 1;
    let newState = {
      ...gameState,
      experience: { ...gameState.experience },
      levels: { ...gameState.levels },
    };

    // 레벨 상승 및 경험치 차감
    newState.levels[experienceType] = newLevel;
    newState.experience[experienceType] = currentExp - expToLevel;

    // 능력치 타입인 경우 실제 능력치도 상승
    if (STAT_KEYS.includes(experienceType as any)) {
      const statKey = experienceType as keyof typeof STATS;
      newState[statKey] = Math.min(10, newState[statKey] + 1); // 최대값 10 제한
      if (!silent) {
        Logger.info(
          '[ExperienceManager]',
          `${config.displayName} 능력치 상승: ${gameState[statKey]} → ${newState[statKey]}`
        );
      }
    }

    // 레벨업 시 추가 효과 실행
    if (config.onLevelUp) {
      newState = config.onLevelUp(newState, newLevel, experienceType);
    }

    if (!silent) {
      Logger.info(
        '[ExperienceManager]',
        `${config.displayName} 레벨업: Lv.${currentLevel} → Lv.${newLevel}`
      );
    }

    return newState;
  }

  /**
   * 특정 경험치 타입의 레벨업에 필요한 경험치를 계산합니다.
   * @param experienceType - 경험치 타입
   * @param currentLevel - 현재 레벨 (기본값: 0)
   * @returns 레벨업에 필요한 경험치
   */
  static getExpToLevel(
    experienceType: string,
    currentLevel: number = 0
  ): number {
    const config = getExperienceConfig(experienceType);
    if (!config) {
      Logger.warn(
        '[ExperienceManager]',
        `알 수 없는 경험치 타입: ${experienceType}`
      );
      return Infinity;
    }

    return config.expToLevel(currentLevel);
  }

  /**
   * 수동 레벨업 가능한 경험치 타입들을 조회합니다.
   * @param gameState - 현재 게임 상태
   * @returns 레벨업 가능한 경험치 타입 배열
   */
  static getAvailableLevelUps(gameState: GameState): string[] {
    return MANUAL_LEVELUP_TYPES.filter(experienceType =>
      this.canLevelUp(experienceType, gameState)
    );
  }

  /**
   * 특정 경험치 타입의 레벨업 진행률을 계산합니다.
   * 음수 경험치의 경우 0%로 표시합니다.
   * @param experienceType - 경험치 타입
   * @param gameState - 현재 게임 상태
   * @returns 0-1 사이의 진행률 (1 = 레벨업 가능, 0 = 경험치 부족 또는 음수)
   */
  static getLevelUpProgress(
    experienceType: string,
    gameState: GameState
  ): number {
    const config = getExperienceConfig(experienceType);
    if (!config) return 0;

    const currentLevel = gameState.levels[experienceType] || 0;
    const currentExp = gameState.experience[experienceType] || 0;
    const expToLevel = this.getExpToLevel(experienceType, currentLevel);

    // 경험치가 음수인 경우 0% 진행률
    if (currentExp < 0) return 0;

    if (expToLevel === 0) return 1;
    return Math.min(1, Math.max(0, currentExp / expToLevel));
  }

  /**
   * 특정 경험치 타입들을 수동으로 레벨업 처리합니다.
   * 공통 레벨업 로직을 사용하여 일관성을 보장합니다.
   * @param gameState - 현재 게임 상태
   * @param experienceTypes - 레벨업할 경험치 타입 배열
   * @returns 수동 레벨업이 처리된 새로운 게임 상태
   */
  static processManualLevelUps(
    gameState: GameState,
    experienceTypes: string[]
  ): GameState {
    // 공통 레벨업 로직 사용
    return this.checkAndProcessLevelUps(gameState, experienceTypes);
  }

  /**
   * 경험치 시스템 디버그 정보를 출력합니다.
   * @param gameState - 현재 게임 상태
   */
  static debugExperienceState(gameState: GameState): void {
    Logger.debug('[ExperienceManager]', '경험치 시스템 현황:');

    Object.keys(EXPERIENCE_CONFIGS).forEach(experienceType => {
      const config = EXPERIENCE_CONFIGS[experienceType];
      const currentLevel = gameState.levels[experienceType] || 0;
      const currentExp = gameState.experience[experienceType] || 0;
      const expToLevel = this.getExpToLevel(experienceType, currentLevel);
      const progress = this.getLevelUpProgress(experienceType, gameState);
      const canLevel = this.canLevelUp(experienceType, gameState);

      Logger.debug(
        '[ExperienceManager]',
        `  ${config.displayName}: Lv.${currentLevel} | ${currentExp}/${expToLevel} (${Math.round(progress * 100)}%) | 레벨업 가능: ${canLevel ? '✅' : '❌'}`
      );
    });
  }
}
