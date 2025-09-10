# 📋 시나리오 타입 참조 가이드

프로젝트의 모든 타입 정의와 인터페이스를 제공합니다.

## 🏗️ 씬(Scene) 인터페이스

```typescript
interface Scene {
  id: SceneId;                              // 씬 고유 식별자 (scn_ 접두어 필수)
  text: string;                             // 씬 메인 텍스트
  type?: SceneType;                         // 씬 타입 ('main' | 'side' | 'event')
  conditional_text?: string | ConditionalText[];     // 조건부 텍스트
  condition?: Condition;                    // 씬 등장 조건
  priority_condition?: Condition;           // 우선 출현 조건
  choices: Choice[];                        // 선택지 목록
  effects?: SceneEffects;                   // 재방문 시 적용할 효과
  initial_effects?: SceneEffects;           // 최초 방문 시 적용할 효과 (effects 대체)
  random_selectable?: boolean;              // 랜덤 선택 가능 여부 (기본값: false)
  repeatable?: boolean;                     // 완료 후 재실행 가능 여부 (기본값: false)
}
```

## 🎯 조건(Condition) 타입

```typescript
// 원자적 조건 타입 (개별 조건들)
type AtomicCondition = {
  // 능력치 조건
  [K in StatKey]?: number | MinMaxRange;
} & {
  // 자원 조건
  [K in ResourceKey]?: number | MinMaxRange;
} & {
  buffs?: { in?: BuffKey[]; not_in?: BuffKey[] }; // 상태(버프) 포함/제외 조건
  flags?: { in?: FlagKey[]; not_in?: FlagKey[] }; // 플래그 포함/제외 조건
  items?: { [itemId: string]: number | MinMaxRange }; // 아이템 조건 (키-값 구조)
  variables?: { [key: string]: number | MinMaxRange };  // 변수 조건
  skills?: { [skillId: string]: number | MinMaxRange }; // 스킬 레벨 조건
  current_floor?: number;                   // 현재 층 조건
  death_count?: number | MinMaxRange;       // 총 사망 횟수 조건
  current_floor_death_count?: number | MinMaxRange;  // 현재 층 사망 횟수 조건
  completed_scenes?: {                     // 완료된 씬 조건
    in?: SceneId[];         // 완료되어야 하는 씬들
    not_in?: SceneId[];     // 완료되면 안 되는 씬들
  };
  scene_count?: number | MinMaxRange;       // 현재 챕터에서 경험한 씬 개수 조건
  can_level_up?: string;                    // 레벨업 가능 여부 조건
};

// 조건 타입
type Condition = AtomicCondition | {
  $and: (AtomicCondition | Condition)[];   // AND 연산자: 모든 조건 만족
} | {
  $or: (AtomicCondition | Condition)[];    // OR 연산자: 조건 중 하나만 만족
};

interface MinMaxRange {
  min?: number;  // 최소값 (이상)
  max?: number;  // 최대값 (이하)
}


```

## ⚡ 효과(SceneEffects) 타입

```typescript
type SceneEffects = {
  // 능력치 변화
  [K in StatKey]?: number;
} & {
  // 자원 변화
  [K in ResourceKey]?: number;
} & {
  add_buffs?: BuffKey[];                    // 추가할 상태(버프) 목록
  remove_buffs?: BuffKey[];                 // 제거할 상태(버프) 목록
  set_flags?: FlagKey[];                    // 설정할 플래그 목록
  unset_flags?: FlagKey[];                  // 해제할 플래그 목록
  items?: { [itemId: string]: number };     // 아이템 추가/제거 (키-값 방식)
  variables?: VariableEffect[];             // 변수 효과
  exp?: { [key: string]: number } & { skills?: { [skillId: string]: number } };
  manual_level_up?: string[];               // 수동 레벨업 대상 경험치 타입 목록
  current_floor?: number;                   // 현재 층 설정
  death_count?: number;                     // 총 사망 횟수 설정
  completed_scenes?: SceneId[];             // 완료된 씬 목록에 추가
};



interface VariableEffect {
  id: string;
  operator: 'add' | 'subtract' | 'set' | 'multiply';
  value: number;
}

type SpecialEffects = {
  force_gameover?: boolean;                 // 즉시 게임오버
  rest_room_cleanup?: boolean;              // 휴식방 정리
  reset_game?: boolean;                     // 게임 상태 전체 리셋
  reset_health?: boolean;                   // 체력 전체 회복
  reset_mind?: boolean;                     // 정신력 전체 회복
  complete_scene?: string;                  // 특정 씬을 완료 처리
  increment_death_count?: boolean;          // 사망 횟수 증가
  set_floor?: number;                       // 현재 층 설정
};
```

## 🎲 선택지(Choice) 인터페이스

```typescript
interface Choice {
  text: string;                             // 선택지 텍스트
  condition?: Condition;                    // 선택지 표시 조건
  visible_if_failed_condition?: boolean;    // 조건 실패 시에도 표시할지 여부
  probability?: Probability;                // 확률 분기 설정
  next?: Next;                              // 다음 이동 대상
}

interface ProbabilityModifier { per_unit: number; max?: number }
interface ProbabilityModifiers {
  stats?: { [K in StatKey]?: ProbabilityModifier };
  buffs?: { [K in BuffKey]?: ProbabilityModifier };
  flags?: { [K in FlagKey]?: ProbabilityModifier };
  items?: { [K in ItemId]?: ProbabilityModifier };
  variables?: { [K in string]?: ProbabilityModifier };
  skills?: { [skillId: string]: ProbabilityModifier };
}
interface Probability {
  base_rate: number;                        // 기본 성공 확률 (0~1 범위)
  max_rate?: number;                        // 최대 성공 확률 (선택)
  modifier?: ProbabilityModifiers;          // 확률 수정자들
  success_next: Next;                       // 성공 시 이동할 곳
  failure_next: Next;                       // 실패 시 이동할 곳
}

type Next = {
  chapter_id?: string;                      // 이동할 챕터 ID
  scene_id?: string;                        // 이동할 씬 ID
};
```

## 📚 챕터(Chapter) 인터페이스

```typescript
interface Chapter {
  id: string;                               // 챕터 고유 식별자
  name: string;                             // 챕터 표시 이름
  type: ChapterType;                        // 챕터 타입 ('rest' | 'story')
  floor: number;                            // 챕터가 속한 층
  next_chapter_id?: string;                 // 다음 챕터 ID
  scenes: Scene[];                          // 챕터에 포함된 씬 목록
}
```

## 🏷️ 조건부 텍스트(ConditionalText) 인터페이스

```typescript
interface ConditionalText {
  text: string;                             // 표시할 텍스트
  condition: Condition;                     // 텍스트 표시 조건
}
```

## 📦 아이템(Item) 인터페이스

```typescript
interface Item {
  id: ItemId;                               // 아이템 고유 식별자
  name: string;                             // 아이템 표시 이름
  description: string;                      // 아이템 설명
  persist: boolean;                         // 챕터 전환 시 보존 여부
  quantity?: number;                        // 아이템 수량 (기본값: 1)
}
```

## 🎮 게임 상태(GameState) 타입

```typescript
type GameState = {
  // 능력치
  [K in StatKey]: number;
} & {
  // 자원
  [K in ResourceKey]: number;
} & {
  buffs: BuffKey[];                         // 보유 상태(버프) 목록
  flags: FlagKey[];                         // 설정된 플래그 목록
  items: Item[];                            // 보유 아이템 목록
  variables: { [key: string]: number };     // 숫자 변수
  experience: { [key: string]: number };    // 통합 경험치 시스템 - 현재 경험치
  levels: { [key: string]: number };        // 통합 경험치 시스템 - 현재 레벨
  current_floor: number;                    // 현재 층
  death_count: number;                      // 총 사망 횟수
  death_count_by_floor: { [floor: number]: number };  // 층별 사망 횟수
  completed_scenes: SceneId[];              // 완료된 씬 목록
};
```

## 🎯 경험치 시스템 타입

### 경험치 설정(ExperienceConfig) 인터페이스

```typescript
interface ExperienceConfig {
  id: string;                               // 경험치 타입 고유 식별자
  displayName: string;                      // 표시용 이름
  autoLevelUp: boolean;                     // 자동 레벨업 여부 (true: 자동, false: 수동)
  expToLevel: (currentLevel: number) => number;  // 레벨업에 필요한 경험치 계산 함수
  maxLevel?: number;                        // 최대 레벨 (선택적)
  onLevelUp?: (gameState: GameState, newLevel: number, experienceType: string) => GameState;  // 레벨업 시 추가 효과
  color?: string;                           // UI 표시 색상 (선택적)
  category?: 'stat' | 'level' | 'rank' | 'skill';  // 카테고리 (UI 그룹핑용)
}
```

### 경험치 효과(ExperienceEffects) 타입

```typescript
type ExperienceEffects = { [key: string]: number };  // 경험치 타입별 추가/감소 값
```

## 🎨 텍스트 효과 시스템 상세 타입

### 텍스트 효과(TextEffect) 인터페이스

```typescript
interface TextEffect {
  type: TextEffectType;                     // 효과 타입
  start: number;                            // 효과 시작 위치 (인덱스)
  end: number;                              // 효과 끝 위치 (인덱스)
  intensity?: number;                       // 효과 강도 (0~1 범위, 선택사항)
  duration?: number;                        // 애니메이션 지속시간 (밀리초, 선택사항)
  color?: string;                           // 커스텀 색상 값 (선택사항)
}
```

### 텍스트 세그먼트(TextSegment) 인터페이스

```typescript
interface TextSegment {
  text: string;                             // 세그먼트 텍스트
  effects: TextEffect[];                    // 적용된 효과들
  startIndex: number;                       // 원본 텍스트에서의 시작 위치
  endIndex: number;                         // 원본 텍스트에서의 끝 위치
}
```

### 텍스트 파싱 결과(TextParseResult) 인터페이스

```typescript
interface TextParseResult {
  originalText: string;                     // 원본 텍스트
  segments: TextSegment[];                  // 파싱된 텍스트 세그먼트들
  allEffects: TextEffect[];                 // 전체 텍스트에 적용된 효과들
  hasErrors: boolean;                       // 파싱 에러가 있었는지 여부
  errors: string[];                         // 파싱 에러 메시지들
}
```

### 텍스트 표시 모드(TextDisplayMode) 타입

```typescript
type TextDisplayMode = 'scene' | 'choice';  // 씬 텍스트 또는 선택지 텍스트
```

## 🖼️ 이미지 시스템 상세 타입

### 이미지 크기 설정(ImageSizeConfig) 인터페이스

```typescript
interface ImageSizeConfig {
  width: number;                            // 고정 너비 (픽셀)
  height: number;                           // 고정 높이 (픽셀)
  description: string;                      // 설명
}
```

### 이미지 정보(ImageInfo) 인터페이스

```typescript
interface ImageInfo {
  filename: string;                         // 이미지 파일명 (확장자 제외)
  size: ImageSizePreset;                    // 이미지 크기 프리셋
  originalTag: string;                      // 원본 태그 문자열
  position: number;                         // 텍스트에서의 위치
  imageSource: ImageSourcePropType | null; // React Native 이미지 소스
  isValid: boolean;                         // 유효한 이미지인지 여부
}
```

### 이미지 파싱 결과(ImageParseResult) 인터페이스

```typescript
interface ImageParseResult {
  images: ImageInfo[];                      // 파싱된 이미지 정보
  text: string;                             // 이미지 태그가 제거된 순수 텍스트
  errors: string[];                         // 파싱 오류
  hasImages: boolean;                       // 이미지 포함 여부
}
```

## 🔧 정의된 상수들

### 능력치 상수 - `/constants/gameConfig.ts`
```typescript
export const STATS = {
  strength: { id: 'strength', displayName: '힘', maxValue: 100, color: '#FF3B30' },
  agility: { id: 'agility', displayName: '민첩', maxValue: 100, color: '#34C759' },
  wisdom: { id: 'wisdom', displayName: '지혜', maxValue: 100, color: '#007AFF' },
  charisma: { id: 'charisma', displayName: '카리스마', maxValue: 100, color: '#FF9500' }
} as const;

type StatKey = keyof typeof STATS;
```

### 자원 상수 - `/constants/gameConfig.ts`
```typescript
export const RESOURCES = {
  health: { id: 'health', displayName: '체력', maxValue: 3, color: '#FF3B30' },
  mind: { id: 'mind', displayName: '정신력', maxValue: 3, color: '#5856D6' },
  gold: { id: 'gold', displayName: '재화', maxValue: 4, color: '#FFD700' }
} as const;

type ResourceKey = keyof typeof RESOURCES;
```

### 기타 타입
```typescript
type SceneType = 'main' | 'side' | 'event';
type SceneId = string; // scn_ 접두어 필수
type BuffKey = string; // buffs.json에 정의된 ID만 사용 가능
type FlagKey = string; // flags.json에 정의된 ID만 사용 가능
type ItemId = string; // items.json에 정의된 ID만 사용 가능
```

## 📄 JSON 기반 데이터 관리

### 상태(버프) 데이터 - `/assets/config/buffs.json`
```typescript
interface BuffData {
  id: string;
  displayName: string;
  description: string;
  temporary: boolean;                       // 휴식방에서 자동 제거 여부
  category: 'positive' | 'negative' | 'neutral';
}
```

### 플래그 데이터 - `/assets/config/flags.json`
```typescript
interface FlagData {
  id: string;
  displayName: string;
  description: string;
  category: 'item' | 'progress' | 'system';
}
```

### 아이템 데이터 - `/assets/config/items.json`
```typescript
interface ItemData {
  id: string;
  name: string;
  description: string;
  category: string;                         // 아이템 카테고리 (자유 형식)
  persist: boolean;                         // 챕터 전환 시 보존 여부
}
```

### 변수 데이터 - `/assets/config/variables.json`
```typescript
interface VariableData {
  id: string;
  description: string;
  category: string;                         // 변수 카테고리 (자유 형식)
  defaultValue: number;
  minValue?: number;                        // 최소값 (선택적)
  maxValue?: number;                        // 최대값 (선택적)
  persist: boolean;                         // 휴식방에서 초기화 여부
}
```

## 🎨 텍스트 효과 시스템 기본 타입

```typescript
type TextEffectType =
  // 텍스트 스타일
  | 'bold' | 'italic' | 'underline' | 'highlight'
  // 색상 효과
  | 'red' | 'blue' | 'green' | 'yellow'
  | 'positive' | 'negative' | 'neutral'    // 게임 상태 기반 색상
  // 애니메이션 효과
  | 'shake' | 'glow' | 'fade' | 'scale' | 'wave' | 'pulse';
```

## 🖼️ 이미지 시스템 타입

```typescript
type ImageSizePreset = 'lg' | 'md' | 'sm';

const IMAGE_SIZE_PRESETS: Record<ImageSizePreset, ImageSizeConfig> = {
  lg: { width: 300, height: 300, description: '대형 이미지' },
  md: { width: 300, height: 200, description: '중형 이미지 (기본값)' },
  sm: { width: 200, height: 150, description: '소형 이미지' }
};
```

## ⚠️ 타입 안전성 규칙

1. **씬 ID**: `scn_` 접두어 필수, 프로젝트 내 고유
2. **능력치**: `STATS`에 정의된 키만 사용 가능
3. **자원**: `RESOURCES`에 정의된 키만 사용 가능
4. **상태(버프)**: `/assets/config/buffs.json`에 정의된 ID만 사용
5. **플래그**: `/assets/config/flags.json`에 정의된 ID만 사용
6. **아이템**: `/assets/config/items.json`에 정의된 ID만 사용
7. **조건**: 모든 조건은 AND 관계로 처리
8. **효과**: 씬 레벨에서만 정의, 선택지에 직접 넣지 않음
9. **챕터 전환**: `completed_scenes` 자동 초기화, `persist: true` 아이템만 보존 