import { Alert } from 'react-native';
import { Logger } from '../../../utils/system/Logger';
import { TransitionState } from './TransitionStateMachine';
import { TRANSITION_PHASES } from './TransitionTimings';

/**
 * 전환 에러 타입 정의
 */
export type TransitionError =
  | 'choice_processing_failed' // 선택지 처리 실패
  | 'animation_timeout' // 애니메이션 타임아웃
  | 'state_sync_failed' // 상태 동기화 실패
  | 'scene_loading_failed' // 씬 로딩 실패
  | 'unknown_error'; // 알 수 없는 에러

/**
 * 에러 정보 인터페이스
 */
export interface TransitionErrorInfo {
  type: TransitionError;
  message: string;
  timestamp: number;
  phase: TransitionState;
  originalError?: Error;
}

/**
 * 에러 복구 옵션
 */
export interface ErrorRecoveryOptions {
  /** 자동 재시도 여부 */
  autoRetry?: boolean;
  /** 재시도 횟수 */
  maxRetries?: number;
  /** 사용자 알림 여부 */
  showUserAlert?: boolean;
  /** 복구 지연 시간 (ms) */
  recoveryDelay?: number;
}

/**
 * 기본 복구 옵션
 */
const DEFAULT_RECOVERY_OPTIONS: Required<ErrorRecoveryOptions> = {
  autoRetry: false,
  maxRetries: 1,
  showUserAlert: true,
  recoveryDelay: TRANSITION_PHASES.ERROR_RECOVERY_DELAY,
};

/**
 * 에러 생성 헬퍼 함수
 */
export function createTransitionError(
  type: TransitionError,
  message: string,
  phase: TransitionState,
  originalError?: Error
): TransitionErrorInfo {
  return {
    type,
    message,
    timestamp: Date.now(),
    phase,
    originalError,
  };
}

/**
 * 에러 타입별 메시지 매핑
 */
const ERROR_MESSAGES: Record<TransitionError, string> = {
  choice_processing_failed: '선택지 처리 중 오류가 발생했습니다.',
  animation_timeout: '화면 전환 중 시간이 초과되었습니다.',
  state_sync_failed: '게임 상태 동기화에 실패했습니다.',
  scene_loading_failed: '다음 씬을 불러오는데 실패했습니다.',
  unknown_error: '알 수 없는 오류가 발생했습니다.',
};

/**
 * 에러 심각도 평가
 */
export function getErrorSeverity(
  errorType: TransitionError
): 'low' | 'medium' | 'high' {
  switch (errorType) {
    case 'animation_timeout':
      return 'low';
    case 'state_sync_failed':
    case 'choice_processing_failed':
      return 'medium';
    case 'scene_loading_failed':
    case 'unknown_error':
      return 'high';
    default:
      return 'medium';
  }
}

/**
 * 에러 복구 전략 실행
 */
export async function executeErrorRecovery(
  error: TransitionErrorInfo,
  options: ErrorRecoveryOptions = {}
): Promise<boolean> {
  const opts = { ...DEFAULT_RECOVERY_OPTIONS, ...options };

  Logger.error('[TransitionError]', {
    type: error.type,
    message: error.message,
    phase: error.phase,
    timestamp: new Date(error.timestamp).toISOString(),
  });

  // 사용자 알림
  if (opts.showUserAlert) {
    const userMessage = ERROR_MESSAGES[error.type] || error.message;
    Alert.alert(
      '화면 전환 오류',
      userMessage + '\n\n게임을 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel', onPress: () => {} },
        { text: '계속하기', style: 'default', onPress: () => {} },
      ]
    );
  }

  // 복구 지연
  if (opts.recoveryDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, opts.recoveryDelay));
  }

  return true; // 복구 성공으로 간주
}

/**
 * 애니메이션 타임아웃 헬퍼
 */
export function createAnimationTimeout(
  timeoutMs: number,
  phase: TransitionState
): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        createTransitionError(
          'animation_timeout',
          `애니메이션이 ${timeoutMs}ms 내에 완료되지 않았습니다`,
          phase
        )
      );
    }, timeoutMs);
  });
}

/**
 * Promise 레이스로 타임아웃 추가
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  phase: TransitionState
): Promise<T> {
  return Promise.race([promise, createAnimationTimeout(timeoutMs, phase)]);
}
