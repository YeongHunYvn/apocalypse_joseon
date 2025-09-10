# Hooks 폴더 관심사 분리 검토 및 개선사항

## 📋 현재 구조 분석

### 1. 전체 폴더 구조
```
hooks/
├── animation/    # ✅ 애니메이션 관련 훅들
├── game/         # ⚠️  게임 상태 관련 훅들 (일부 중복)
├── story/        # ⚠️  스토리 관련 훅들 (복잡한 의존성)
├── ui/           # ✅ UI 관련 훅들
├── index.ts      # ✅ 통합 export
└── useSafeArea.ts # ❌ 빈 파일 (중복)
```

## 🔍 발견된 문제점

### 1. **중복 파일 문제**
- `hooks/useSafeArea.ts` - 빈 파일 (1B)
- `hooks/ui/useSafeArea.ts` - 실제 구현체 (526B)
- 메인 index.ts는 ui/useSafeArea를 export하고 있음

### 2. **Story 훅들의 복잡한 의존성**
현재 구조의 문제점:
- `useStoryState`가 다른 훅들에 의존
- `useStoryLogic`과 `useStoryUI`가 모두 로딩 상태를 관리 (중복)
- `useSceneTransition`이 외부에서 handleChoice를 받음 (props 의존성)
- 책임 경계가 모호하여 테스트와 유지보수가 어려움

### 3. **Game 훅들의 애매한 분리** ✅ 해결됨
- ~~`useGameProgressStats` - 진행 상태 통계 (읽기)~~
- ~~`useGameProgressActions` - 진행 상태 변경 (쓰기)~~
- ✅ `useGameProgress`로 통합됨 - 진행 상태의 읽기/쓰기 모두 제공
- 도메인별 명확한 분리 달성

### 4. **네이밍 일관성 부족** ✅ 해결됨
- ~~`useGameProgressStats` (이전 useGameProgress에서 변경)~~
- ✅ 모든 Game 훅이 도메인별로 일관되게 분리됨:
  - `useGameState` - 핵심 상태
  - `useGameProgress` - 진행 상태
  - `useGameStats` - 능력치
  - `useGameInventory` - 인벤토리
  - `useGameLifecycle` - 생명주기

## ✅ 잘 구성된 부분

### 1. **Animation 훅들**
- `useAnimation` - 통합 애니메이션 관리
- `useCharAnimations` - 캐릭터별 애니메이션
- 명확한 책임 분리와 재사용성

### 2. **UI 훅들**
- `useSafeArea` - 안전 영역 관리
- `useScreenDimensions` - 화면 크기 관리
- `useLongPressVibration` - 햅틱 피드백
- 각각 독립적이고 단일 책임 원칙 준수

## ✅ 완료된 개선사항

### Story 훅 재구조화 완료
1. **useStoryCore 생성**
   - 모든 스토리 관련 상태의 단일 진실의 원천
   - 중복된 로딩/에러 상태 통합
   - 명확한 상태 관리 인터페이스

2. **각 훅의 책임 명확화**
   - `useStoryState`: useStoryCore의 wrapper (하위 호환성)
   - `useStoryLogic`: 순수 비즈니스 로직만 담당
   - `useStoryUI`: 순수 UI 계산만 담당
   - `useSceneTransition`: 전환 애니메이션 관리

3. **의존성 구조 개선**
   ```
   이전: StoryScreen → useStoryUI → useStoryState → useGameState
   현재: StoryScreen → useStoryCore → useGameState
         ↓                ↓
         useStoryUI    useStoryLogic
   ```

### Game 훅 재구조화 완료
1. **useGameProgress 통합**
   - 기존의 읽기 전용(`useGameProgressStats`)과 쓰기 전용(`useGameProgressActions`) 분리 제거
   - 하나의 훅에서 도메인 관련 모든 기능 제공
   - 일관된 인터페이스로 개발 경험 향상

2. **도메인별 명확한 분리**
   - 각 훅이 하나의 도메인만 담당
   - 책임 경계가 명확해짐
   - 테스트와 유지보수 용이

## 🚀 개선 방안

### 1. **즉시 처리 필요 (Priority: High)**

#### 1.1 중복 파일 제거
```bash
# hooks/useSafeArea.ts 파일 삭제
```

#### 1.2 Story 훅들 재구조화
```typescript
// 새로운 구조 제안
hooks/story/
├── core/
│   ├── useStoryCore.ts      // 핵심 상태 관리 (단일 진실의 원천)
│   └── useStoryContext.ts   // Context Provider
├── features/
│   ├── useStoryNavigation.ts // 씬 이동 로직
│   ├── useStoryAnimation.ts  // 전환 애니메이션
│   └── useStoryDisplay.ts    // UI 표시 로직
└── index.ts
```

### 2. **중기 개선사항 (Priority: Medium)**

#### 2.1 Game 훅들 재구성 ✅ 완료
```typescript
// 도메인별 분리로 통합 (완료됨)
hooks/game/
├── useGameState.ts         // 핵심 게임 상태
├── useGameProgress.ts      // ✅ 진행 관련 (읽기/쓰기 통합됨)
├── useGameInventory.ts     // 인벤토리 관련
├── useGameStats.ts         // 능력치 관련
└── useGameLifecycle.ts     // 생명주기 관련
```

#### 2.2 공통 유틸리티 분리
```typescript
hooks/
├── common/
│   ├── useLoadingState.ts  // 공통 로딩 상태 관리
│   ├── useErrorBoundary.ts // 공통 에러 처리
│   └── useDebounce.ts      // 공통 디바운스
```

### 3. **장기 개선사항 (Priority: Low)**

#### 3.1 타입 안정성 강화
- 각 훅의 반환 타입을 더 엄격하게 정의
- 제네릭을 활용한 재사용성 향상

#### 3.2 테스트 구조 개선
- 각 훅별 독립적인 테스트 작성
- Mock Provider 구현

## 📝 실행 계획

### Phase 1: 즉시 수정 (1일)
- [x] hooks/useSafeArea.ts 삭제 ✅
- [x] Story 훅들의 순환 의존성 제거 ✅
- [x] 중복 로딩 상태 통합 ✅

### Phase 2: Story 훅 재구조화 (3일)
- [x] useStoryCore 구현 (단일 상태 관리) ✅
- [x] 기능별 훅 분리 ✅
- [ ] StoryScreen.tsx 업데이트

### Phase 3: Game 훅 재구성 (2일) ✅ 완료
- [x] Progress 관련 훅 통합 ✅
  - useGameProgressStats + useGameProgressActions → useGameProgress
- [x] 도메인별 명확한 분리 ✅
  - 진행 상태: useGameProgress (읽기/쓰기 통합)
  - 능력치: useGameStats
  - 인벤토리: useGameInventory
  - 생명주기: useGameLifecycle
- [x] 네이밍 일관성 확보 ✅
- [x] Deprecated 훅들 완전 제거 ✅
  - useGameProgressActions.ts 삭제
  - useGameProgressStats.ts 삭제
  - 관련 타입 정의 및 export 정리

### Phase 4: 문서화 및 테스트 (2일)
- [ ] 각 훅별 사용 가이드 작성
- [ ] 단위 테스트 추가
- [ ] 통합 테스트 구현

## 🎯 기대 효과

1. **유지보수성 향상**
   - 명확한 책임 분리로 변경 영향 범위 최소화
   - 순환 의존성 제거로 디버깅 용이

2. **개발 경험 개선**
   - 일관된 네이밍과 구조로 예측 가능한 코드
   - 재사용 가능한 작은 단위의 훅들

3. **성능 최적화**
   - 중복 상태 제거로 불필요한 리렌더링 방지
   - 메모이제이션 효율성 향상

4. **테스트 용이성**
   - 독립적인 훅들로 단위 테스트 작성 용이
   - Mock 구현 간소화

## 📌 참고사항

- 기존 STORY-HOOKS-STRUCTURE.md 문서와 연계하여 진행
- 점진적 마이그레이션으로 안정성 확보
- 각 단계별 PR 분리로 리뷰 부담 감소