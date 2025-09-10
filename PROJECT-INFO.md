# 📘 PROJECT-INFO.md

이 문서는 텍스트 로그라이크 게임 MVP 프로젝트의 전반적인 구조, 설계 원칙, 상태 및 흐름 제어 방식에 대한 기준을 담고 있습니다.

---

## 🗂️ 용어 정리 (Glossary)

### 핵심 용어 정의

- **씬(Scene)**: 게임 내 하나의 상황, 이벤트 또는 선택지 묶음. JSON 파일로 관리되며 고유 ID(`scn_` 접두어) 보유.
- **시나리오(Scenario)**: `next`로 연결된 스토리 흐름상의 씬 묶음. 하나의 완결된 스토리 아크.
- **챕터(Chapter)**: 게임 구조상의 큰 단위로, 여러 씬을 묶어 관리하는 단위. 각 층의 휴식방, 스토리 등으로 구분.

### 용어 사용 가이드

| 상황 | 사용 용어 | 예시 |
|------|-----------|------|
| 개별 상황/이벤트 | **씬** | "이 씬에서 플레이어는 선택을 해야 한다" |
| 스토리 흐름상의 연속된 묶음 | **시나리오** | "이 시나리오는 3개의 씬으로 구성되어 있다" |
| 게임 구조상의 큰 단위 | **챕터** | "1층 휴식방 챕터에서 여러 씬이 랜덤으로 등장한다" |

---

## 🔧 전역 설정 및 설계 방침

* **개발 플랫폼**: React Native
* **데이터 형식**: JSON 기반 씬
* **게임 구조**: 탑 등반형, 층별 구성
* **게임 진행 방식**: 조건부 씬 등장 + 선택지 기반 분기 + 상태 변화
* **MVP 목표**: 1층 단위 완성 + 조건부 씬 진행 + 상태 관리 + 조건 분기 + 게임 오버

## ⚙️ 능력치 및 자원 시스템

### 🔹 능력치 (4종)
* `strength` (힘), `agility` (민첩), `wisdom` (지혜), `charisma` (카리스마)

### 🔹 자원 (2종)
* `health` (체력), `mind` (정신력)
* 둘 중 하나라도 0이 되면 게임 오버

### 🔹 통합 경험치 시스템
* **경험치 타입**: 능력치별 경험치 + 전체 레벨 경험치 + 미래 확장 가능 (랭크, 스킬 등)
* **자동/수동 레벨업**: 
  * 능력치: 수동 레벨업 (플레이어가 직접 선택)
  * 레벨: 자동 레벨업 (경험치 충족 시 즉시 상승)
  * **경험치 효과**:
    * `exp`: 경험치 효과 (양수: 추가, 음수: 감소)
    * `manual_level_up`: 특정 경험치 타입들을 수동으로 레벨업

### 🔹 기타 상태
* `tags`: 상태를 나타내는 키워드 (**JSON 기반 관리**: `/assets/config/tags.json`)
* `flags`: boolean 상태 추적용 (**JSON 기반 관리**: `/assets/config/flags.json`)
* `items`: 아이템 보유 목록 (**JSON 기반 관리**: `/assets/config/items.json`)
* `experience`: 모든 경험치 타입의 현재 경험치 (통합 경험치 시스템)
* `levels`: 모든 경험치 타입의 현재 레벨
* `current_floor`: 현재 층
* `death_count`: 전체 사망 횟수
* `completed_scenes`: 완료된 씬 목록

## 🧠 상태 관리 구조

* `GameStateContext`로 전역 상태 관리
* 상태는 `useReducer`로 조작 (직접 변경 금지)
* 상수 정의 (`/constants/gameConfig.ts`, `/constants/theme.ts` 등)

## 📁 폴더 구조

```
/assets         씬, 더미, 상태 관련 json
/components   UI 요소 (버튼, 선택지, 텍스트 등)
/contexts     게임 상태 관리
/constants    상수 정의 (게임 설정, 테마 등)
/screens      페이지 단위 구성
/utils        조건 판별, 확률 계산 등
/types        타입 정의 (Scene, Choice 등)
```

## 🧩 씬 구조

```typescript
{
  id: SceneId,             // "scn_" 접두어 필수
  text: string,           // 본문 텍스트
  conditional_text?: string | ConditionalText[],   // 조건부 텍스트
  condition?: Condition,  // 등장 조건 (AND 조건)
  choices: Choice[],      // 선택지 배열
  effects?: SceneEffects, // 도달 시 상태 변화
  type?: SceneType,       // 씬 타입 (main, side, event)
  random_selectable?: boolean // 랜덤 선택 가능 여부
}

Choice = {
  text: string,
  condition?: Condition,
  probability?: Probability,
  next?: Next
}

Next = {
  chapter_id?: string,    // 이동할 챕터 ID (생략 시 현재 챕터)
  scene_id?: string       // 이동할 씬 ID
}
```

* **씬 조건은 랜덤 선택 시에만 사용되며, `next`를 통한 직접 이동은 조건을 무시하고 강제 이동됩니다**

### 🎮 통합 경험치 시스템 효과 (SceneEffects)
```typescript
// 경험치 관련 효과 예시
effects: {
  // 통합 경험치 효과 (양수: 추가, 음수: 감소)
exp: {
  strength: 25,      // 힘 경험치 +25
  wisdom: 15,        // 지혜 경험치 +15  
  level: -5          // 레벨 경험치 -5 (패널티)
},
  
  // 경험치 감소 (음수 허용, 레벨은 절대 내려가지 않음)
  sub_exp: [
    { target: "strength", amount: 10 }
  ],
  
  // 수동 레벨업 (NEW!)
  manual_level_up: ["strength", "agility"]
}

// 레벨업 조건 예시 
condition: {
  can_level_up: "strength"  // 힘 레벨업 가능할 때만 표시
}
```

### 🔍 조건 시스템 상세
```typescript
condition: {
  // 능력치 조건
  strength: 5,                    // strength === 5 (정확히 5)
  agility: { min: 3, max: 8 },   // 3 <= agility <= 8
  
  // 자원 조건
  health: { min: 1 },            // health >= 1
  
  // 태그/플래그/아이템 조건
  tags: ['fatigue'],             // 해당 태그가 있어야 함
  flags: ['has_key'],            // 해당 플래그가 있어야 함
  items: [{ id: 'sword_001' }],  // 해당 아이템을 보유해야 함
  
  // 게임 진행 상태 조건
  death_count: { min: 1 },       // 1번 이상 죽었을 때
  current_floor: 2,              // 현재 2층일 때
  
  // 완료된 씬 조건
  completed_scenes: {
    in: ['scn_quest_1', 'scn_tutorial'],     // 완료되어야 하는 씬들
    not_in: ['scn_side_boss', 'scn_secret']  // 완료되면 안 되는 씬들
  }
}
```

## 🎯 게임 오버 처리

* 체력 또는 정신력 0이 되면 `checkGameOver()` 함수 실행
* **특수 효과**: 게임 로직과 직접 연결된 효과들은 `special_effects` 객체로 분리하여 관리
  * `force_gameover`: 강제 게임오버
  * `rest_room_cleanup`: 휴식방 정리 (일시적 태그/아이템 제거)
  * `reset_health` / `reset_mind`: 자원 전체 회복
  * `increment_death_count`: 사망 횟수 증가
  * `complete_scene`: 특정 씬 완료 처리

## 🧭 씬 흐름 및 엔진

### 🎯 씬 엔진의 역할
* **씬 엔진**은 **씬 챕터**를 실행하는 시스템
* 각 챕터에서 **실행 가능한 씬을 랜덤 선택**하여 실행
* 더 이상 실행 가능한 씬이 없으면 **종료 씬** 실행

### 🔄 기본 게임 흐름
```
게임 시작 → 1층 휴식방 묶음 실행 → 1층 스토리 묶음 실행 → 결과에 따라:
  ├─ 성공 → 2층 휴식방 묶음 실행 → 2층 스토리 묶음 실행 → ...
  └─ 실패/게임오버 → 1층 휴식방 묶음 실행 (복귀)
```

### 🔄 챕터 전환 시 completed_scenes 초기화
* **챕터 전환 시점**: 새로운 챕터로 이동할 때마다 완료된 씬 목록이 초기화됨
* **목적**: 같은 챕터에 반복적으로 들어올 때 랜덤 씬 선택이 제대로 작동하도록 함
* **전역 진행 추적**: 다른 챕터 방문 여부는 `tags`나 `flags`를 통해 관리

### 🎒 인벤토리 및 상태 유지 방식

* 상태 및 아이템은 다음과 같이 구분하여 유지
  * **층 한정 보존**: 현재 층에서만 유지, 휴식방 복귀 시 초기화됨
  * **전체 게임 지속**: 휴식방을 넘어 다음 층으로도 유지됨

* 아이템 구조: `items` 배열 내에서 `persist` 속성으로 구분
* 태그 구조: **JSON 기반 관리** (`/assets/config/tags.json`)

## 🧱 ID 및 이름 규칙

### 📝 씬 ID 규칙
* 씬 ID는 모두 `scn_` 접두어 사용
* 특수 씬: 시작(`scn_start`), 게임 오버(`scn_gameover`), 휴식방(`scn_rest_floor_X`)

### 🏷️ 데이터 정의 및 사용 규칙 (**JSON 기반**)

* **능력치**: `/constants/gameConfig.ts`의 `STATS` 객체에 정의 (기존 방식 유지)
* **태그**: `/assets/config/tags.json` 파일에서 JSON 형태로 정의
* **플래그**: `/assets/config/flags.json` 파일에서 JSON 형태로 정의
* **아이템**: `/assets/config/items.json` 파일에서 JSON 형태로 정의
* **씬 조건에서 사용 시**: JSON 파일에 정의된 ID만 사용 가능

## ✅ 개발 시 유의사항

* 상태 변화는 항상 reducer 통해 수행
* 씬 조건 필터링 시 조건 불만족 씬은 제외되므로, 조건 없는 fallback 씬 필수
* 필드명은 전부 영어로 작성, UI 노출은 번역/매핑으로 처리
* 씬 ID 중복 금지
* 게임 상태 변화(effects)는 씬 단위에서만 정의 (선택지에는 직접 넣지 않음)
* **JSON 기반 데이터**: 태그/플래그/아이템은 JSON 파일에 정의된 ID만 사용 가능

## 📋 데이터 관리 시스템

### 📁 파일 구조 (**JSON 기반 데이터 관리**)
```
/assets/               # 게임 데이터 파일들
├─ config/           # 게임 설정 데이터 (tags, flags, items)
├─ chapters/         # 챕터 파일들
├─ images/           # 텍스트 이미지 파일들
└─ docs/             # 챕터 관련 문서들



/constants/          # 게임 설정 상수들
├── gameConfig.ts    # 게임 설정, 능력치, 자원 정의
├── theme.ts         # 색상, 폰트, 여백 등 UI 테마
└── experienceConfig.ts # 통합 경험치 시스템 설정

/utils/
└── dataLoader.ts    # JSON 데이터 로더 (캐싱, 에러 처리, 접근 유틸리티)
```

### 🗃️ JSON 데이터 파일 구조
```json
// /assets/config/tags.json
{
  "fatigue": {
    "id": "fatigue",
    "displayName": "피로",
    "description": "체력과 정신력 회복이 어려워짐",
    "temporary": false,
    "category": "negative"
  }
}

// /assets/config/flags.json
{
  "has_key": {
    "id": "has_key",
    "displayName": "열쇠 보유",
    "description": "특별한 문을 열 수 있는 열쇠를 보유하고 있음",
    "category": "item"
  }
}

// /assets/config/items.json
{
  "health_potion": {
    "id": "health_potion",
    "name": "체력 물약",
    "description": "체력을 1 회복시키는 물약",
    "persist": false
  }
}
```

### 🔧 gameConfig.ts 구조 (JSON 연동)
```typescript
// 능력치 정의 (기존 방식 유지)
export const STATS = {
  strength: { id: 'strength', displayName: '힘', maxValue: 10 },
  agility: { id: 'agility', displayName: '민첩', maxValue: 10 },
  wisdom: { id: 'wisdom', displayName: '지혜', maxValue: 10 },
  charisma: { id: 'charisma', displayName: '카리스마', maxValue: 10 }
}

// 자원 정의 (기존 방식 유지)
export const RESOURCES = {
  health: { id: 'health', displayName: '체력', maxValue: 3 },
  mind: { id: 'mind', displayName: '정신력', maxValue: 3 }
}
```

### 🔄 데이터 접근 방법
```typescript
import { getTagById, getFlagById, getItemById } from '../utils/dataLoader';

// 태그 정보 조회
const fatigueTag = getTagById('fatigue');
console.log(fatigueTag?.displayName); // "피로"

// 플래그 정보 조회  
const keyFlag = getFlagById('has_key');

// 아이템 정보 조회
const potion = getItemById('health_potion');
```
