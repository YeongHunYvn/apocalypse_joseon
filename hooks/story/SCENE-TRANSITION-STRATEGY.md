# 씬 전환 로직 개선 전략

## 📊 현재 분석

### 기존 구조 (useSceneTransition 101줄)
```typescript
// 복잡한 의존성 체인
useContentFadeAnimation() → useAnimation() → React Native Animated

// 복잡한 상태 관리
- isTransitioning: boolean
- currentSceneRef: RefObject<Scene>  
- delayedScene: Scene | null
- contentOpacity: Animated.Value

// 복잡한 전환 로직
Promise.all([
  handleChoice(choiceIndex),
  setTimeout(resolve, calculatedDelay)
]) → requestAnimationFrame() → animateContent()
```

### 주요 문제점
1. **의존성 복잡도**: useContentFadeAnimation 거쳐서 useAnimation 사용
2. **상태 동기화**: 3개 상태가 복잡하게 얽혀있음
3. **에러 취약성**: handleChoice 실패 시 상태 복구 로직 없음
4. **코드 가독성**: Promise.all 내부 복잡한 타이밍 계산

## 🎯 개선 전략

### 1. 애니메이션 직접 관리
```typescript
// 기존 (간접적)
useContentFadeAnimation() → useAnimation()

// 개선 후 (직접적)
useAnimation({ type: 'fade' }) 직접 사용
```

### 2. 상태 머신 구조 도입
```typescript
// 전환 상태를 명확한 단계로 구분
type TransitionState = 
  | 'idle'           // 대기 상태
  | 'fadeOut'        // 페이드아웃 중
  | 'processing'     // 선택지 처리 중  
  | 'fadeIn'         // 페이드인 중
  | 'error'          // 에러 상태

// 각 상태별 명확한 진입/종료 조건
const transitionStateMachine = {
  idle: { next: ['fadeOut'] },
  fadeOut: { next: ['processing', 'error'] },
  processing: { next: ['fadeIn', 'error'] },
  fadeIn: { next: ['idle'] },
  error: { next: ['idle'] }
};
```

### 3. 에러 처리 및 복구 로직
```typescript
// 에러 상황 감지
- handleChoice 실패
- 애니메이션 타임아웃
- 상태 동기화 실패

// 복구 전략
- 상태 자동 리셋
- 사용자 알림
- 재시도 메커니즘
```

### 4. 타이밍 관리 개선  
```typescript
// 기존 (복잡한 계산)
Math.max(0, LOADING_TRANSITION - FADE_IN)

// 개선 후 (명확한 단계)
const TRANSITION_PHASES = {
  FADE_OUT: 300,
  PROCESSING: 500, 
  FADE_IN: 300
} as const;
```

## 📁 새로운 구조

### 개선된 useSceneTransition
```typescript
// 1. 직접 애니메이션 관리
const { animatedValue, animateTo } = useAnimation({ type: 'fade' });

// 2. 명확한 상태 머신
const [transitionState, setTransitionState] = useState<TransitionState>('idle');

// 3. 단계별 전환 함수
const executeTransition = async (choiceIndex: number) => {
  try {
    setTransitionState('fadeOut');
    await fadeOut();
    
    setTransitionState('processing');  
    await processChoice(choiceIndex);
    
    setTransitionState('fadeIn');
    await fadeIn();
    
    setTransitionState('idle');
  } catch (error) {
    setTransitionState('error');
    await handleError(error);
    setTransitionState('idle');
  }
};
```

### 새로운 파일 구조
```
/hooks/story/
├── useSceneTransition.ts        # 🎬 개선된 전환 관리
├── transition/                  # 🆕 전환 관련 유틸리티
│   ├── TransitionStateMachine.ts # 상태 머신 로직
│   ├── TransitionTimings.ts     # 타이밍 상수
│   └── ErrorRecovery.ts         # 에러 복구 로직
└── SCENE-TRANSITION-STRATEGY.md # 📚 개선 전략 문서
```

## 📈 예상 효과

### 코드 품질
- **가독성**: 명확한 단계별 전환 로직
- **유지보수성**: 각 단계별 독립적 수정 가능
- **테스트 용이성**: 상태별 단위 테스트 가능

### 사용자 경험
- **안정성**: 에러 상황에서 자동 복구
- **일관성**: 예측 가능한 전환 동작
- **성능**: 불필요한 계산 제거

### 개발자 경험
- **디버깅**: 명확한 상태 추적 가능
- **확장성**: 새로운 전환 효과 추가 용이  
- **문서화**: 각 단계별 명확한 설명 