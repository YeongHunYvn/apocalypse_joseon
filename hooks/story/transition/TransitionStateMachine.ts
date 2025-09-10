/**
 * 씬 전환 상태 머신 정의
 * 전환 과정의 각 단계를 명확하게 관리합니다.
 */

/**
 * 전환 상태 타입 정의
 */
export type TransitionState =
  | 'idle' // 대기 상태 - 전환 없음
  | 'fadeOut' // 페이드아웃 중 - 현재 씬 숨기기
  | 'processing' // 선택지 처리 중 - 새 씬 로드
  | 'fadeIn' // 페이드인 중 - 새 씬 표시
  | 'error'; // 에러 상태 - 복구 대기

/**
 * 각 상태에서 가능한 다음 상태들
 * 페이드 애니메이션 제거로 인한 직접 전환 방식 지원
 */
const TRANSITION_STATE_MACHINE: Record<TransitionState, TransitionState[]> = {
  idle: ['processing', 'fadeOut'], // 대기 → 직접 처리 또는 페이드아웃
  fadeOut: ['processing', 'error'], // 페이드아웃 → 처리 또는 에러
  processing: ['idle', 'fadeIn', 'error'], // 처리 → 완료, 페이드인 또는 에러
  fadeIn: ['idle', 'error'], // 페이드인 → 완료 또는 에러
  error: ['idle'], // 에러 → 복구 후 대기
};

/**
 * 상태 전환 유효성 검사
 */
export function isValidTransition(
  currentState: TransitionState,
  nextState: TransitionState
): boolean {
  return TRANSITION_STATE_MACHINE[currentState].includes(nextState);
}

/**
 * 상태 전환 로그 생성
 */
export function logTransition(
  from: TransitionState,
  to: TransitionState,
  context?: string
): void {
  const isValid = isValidTransition(from, to);
  const prefix = isValid ? '✅' : '❌';
  const _message = `${prefix} [Transition] ${from} → ${to}`;

  if (context) {
    // Logger.debug('[Transition]', `${message} (${context})`);
  } else {
    // Logger.debug('[Transition]', message);
  }

  if (!isValid) {
    // Logger.warn('[Transition]', `Invalid state transition: ${from} → ${to}`);
  }
}

/**
 * 에러 상태 판별
 */
export function isErrorState(state: TransitionState): boolean {
  return state === 'error';
}

/**
 * 전환 진행 중인지 판별
 */
export function isTransitioning(state: TransitionState): boolean {
  return state !== 'idle' && state !== 'error';
}

/**
 * 다음 가능한 상태들 반환
 */
export function getNextStates(
  currentState: TransitionState
): TransitionState[] {
  return TRANSITION_STATE_MACHINE[currentState];
}

/**
 * 상태별 설명 메시지
 */
export const TRANSITION_STATE_DESCRIPTIONS: Record<TransitionState, string> = {
  idle: '대기 중 - 사용자 입력 가능',
  fadeOut: '페이드아웃 중 - 현재 씬 숨기는 중',
  processing: '처리 중 - 선택지 적용 및 새 씬 로드 중',
  fadeIn: '페이드인 중 - 새 씬 표시 중',
  error: '오류 발생 - 복구 시도 중',
};
