# 스토리 훅 통합 전략

## ✅ 2024년 완료된 개선사항

### 구현 완료
1. **useStoryCore 생성** - 모든 스토리 상태의 단일 진실의 원천
2. **중복 상태 제거** - 로딩/에러 상태가 useStoryCore에서만 관리됨
3. **의존성 단순화** - 각 훅이 useStoryCore를 직접 사용
4. **책임 분리 명확화** - 각 훅이 단일 책임 원칙 준수

### 개선된 구조
```
hooks/story/
├── core/
│   ├── useStoryCore.ts      // ✅ 구현 완료
│   └── index.ts             // ✅ 구현 완료
├── useStoryState.ts         // ✅ useStoryCore wrapper로 변경
├── useStoryLogic.ts         // ✅ 순수 로직만 담당하도록 개선
├── useStoryUI.ts            // ✅ 순수 UI 계산만 담당하도록 개선
├── useSceneTransition.ts    // ✅ useStoryCore 사용하도록 개선
└── (기타 파일들)
```

## 📊 이전 문제점 (해결됨)

### 기존 구조 (3개 훅, 285줄)
- **useStoryLogic** (104줄): 비즈니스 로직 + 로딩 상태
- **useStoryUI** (79줄): UI 상태 계산 + 중복 로딩 상태  
- **useSceneTransition** (102줄): 씬 전환 + 외부 의존성

### 주요 문제점
1. **로딩 상태 중복**: `isLoading`이 두 훅에서 각각 관리
2. **의존성 복잡**: `useSceneTransition`이 `handleChoice`를 props로 받음
3. **책임 경계 모호**: UI와 비즈니스 로직의 구분 불명확
4. **테스트 어려움**: 훅들이 서로 의존적이어서 독립 테스트 어려움

## 🎯 통합 전략

### 1. 새로운 4개 훅 구조

#### 🔧 useStoryState - 공통 상태 관리
```typescript
- 모든 로딩/에러 상태 중앙 관리
- 게임 엔진 상태 추상화
- 상태 변화 감지 및 알림
```

#### 📋 useStoryLogic - 순수 비즈니스 로직
```typescript  
- 게임 초기화 로직
- 선택지 처리 로직
- 씬 관리 로직
- UI 상태 제거 (useStoryState로 이동)
```

#### 🎨 useStoryUI - UI 전용 계산
```typescript
- 씬 텍스트 가공
- 헤더 상태 정보
- UI 표시 조건 계산
- 로딩/에러 상태 제거 (useStoryState 사용)
```

#### 🎬 useStoryTransition - 통합 전환 관리
```typescript
- 씬 전환 애니메이션
- 선택지 처리와 애니메이션 통합
- 내부에서 useStoryLogic 사용 (props 의존성 제거)
```

### 2. 의존성 관계 개선

#### 기존 (복잡한 의존성)
```
StoryScreen
├── useStoryLogic() → 로딩 상태A
├── useStoryUI() → 로딩 상태B (중복)
└── useSceneTransition(handleChoice) → 외부 의존
```

#### 개선 후 (명확한 계층)
```
StoryScreen
├── useStoryState() → 공통 상태 관리
├── useStoryLogic() → 순수 비즈니스 로직
├── useStoryUI() → 순수 UI 계산
└── useStoryTransition() → 통합 전환 (내부에서 로직 사용)
```

### 3. 각 훅의 새로운 책임

#### 🔧 useStoryState (신규)
- **입력**: GameStateContext 
- **출력**: 공통 상태 (로딩, 에러, 엔진 준비 등)
- **책임**: 상태 중앙 관리, 중복 제거

#### 📋 useStoryLogic (개선)
- **입력**: useStoryState 결과
- **출력**: 비즈니스 함수들 (initializeGame, handleChoice 등)
- **책임**: 순수 로직만, UI 상태 제거

#### 🎨 useStoryUI (개선)  
- **입력**: useStoryState 결과
- **출력**: UI 렌더링 데이터
- **책임**: 계산된 값만, 상태 관리 제거

#### 🎬 useStoryTransition (개선)
- **입력**: 내부에서 useStoryLogic 사용
- **출력**: 전환 애니메이션 제어
- **책임**: 애니메이션 + 로직 통합

## 📁 최종 파일 구조

```
/hooks/story/
├── useStoryState.ts      # 🔧 공통 상태 관리 (신규)
├── useStoryLogic.ts      # 📋 순수 비즈니스 로직 (개선)  
├── useStoryUI.ts         # 🎨 순수 UI 계산 (개선)
├── useStoryTransition.ts # 🎬 통합 전환 관리 (개선)
├── STORY-HOOKS-STRUCTURE.md # 📚 통합 전략 문서
└── index.ts              # 📤 통합 export
```

## 🔄 마이그레이션 계획

### Phase 1: 공통 상태 분리
1. `useStoryState` 생성 - 모든 공통 상태 중앙화
2. 기존 훅들에서 중복 상태 제거

### Phase 2: 책임 분리 명확화
1. `useStoryLogic` 순수 로직화
2. `useStoryUI` 순수 계산화
3. `useStoryTransition` 통합화

### Phase 3: 사용처 업데이트
1. `StoryScreen.tsx` 새 구조 적용
2. Import 경로 정리
3. 테스트 및 검증

## 📈 예상 효과

### 코드 품질
- **중복 제거**: 로딩 상태 단일화
- **책임 분리**: 각 훅의 명확한 단일 책임
- **테스트 용이성**: 독립적인 훅별 테스트 가능

### 개발자 경험  
- **재사용성**: 필요한 기능만 선택적 사용
- **유지보수성**: 변경 영향 범위 최소화
- **확장성**: 새로운 스토리 기능 추가 용이 