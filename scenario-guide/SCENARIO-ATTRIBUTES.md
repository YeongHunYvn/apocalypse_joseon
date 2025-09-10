# 🎯 씬 속성 가이드

씬에서 사용할 수 있는 모든 속성들과 사용법을 설명합니다.

## 🏗️ 기본 구조

```json
{
  "id": "scn_씬_이름",                    // [필수] 씬 고유 식별자
  "text": "씬 본문 텍스트",                  // [필수] 메인 텍스트
  "type": "main",                         // [선택] 씬 타입
  "condition": { },                       // [선택] 등장 조건
  "priority_condition": { },              // [선택] 우선 출현 조건
  "choices": [ ],                         // [필수] 선택지 목록
  "effects": { },                         // [선택] 씬 도달 시 효과 (재방문)
  "initial_effects": { },                 // [선택] 최초 방문 시 효과 (effects 대체)
  "conditional_text": "",                 // [선택] 조건부 텍스트
  "background_effects": [ ],              // [선택] 배경 효과 목록
  "random_selectable": true,              // [선택] 랜덤 선택 가능 여부
  "repeatable": false                     // [선택] 반복 실행 가능 여부
}
```

## 🎯 조건 시스템 (condition)

씬이 언제 등장할지 결정하는 조건들입니다.
조건은 MongoDB 스타일의 논리 연산자 (`$and`, `$or`)를 사용합니다.

### 기본 논리 연산자

- **`$and`**: 모든 조건을 만족해야 함
- **`$or`**: 조건 중 하나만 만족하면 됨
- **복합 조건**: `$and`와 `$or`를 중첩하여 복잡한 조건 구성 가능

💡 **간편 팁**: `$and` 없이 객체에 직접 조건을 넣을 경우(기본 조건) AND 조건으로 처리합니다.

```json
// 이 두 방식은 동일합니다:
{
  "condition": {
    "strength": { "min": 5 },
    "health": { "min": 2 }
  }
}

{
  "condition": {
    "$and": [
      { "strength": { "min": 5 } },
      { "health": { "min": 2 } }
    ]
  }
}
```

```json
// AND 조건 예시
{
  "condition": {
    "$and": [
      { "strength": { "min": 5 } },
      { "health": { "min": 2 } }
    ]
  }
}

// OR 조건 예시
{
  "condition": {
    "$or": [
      { "strength": { "min": 8 } },
      { "wisdom": { "min": 5 } },
      { "items": [{ "id": "master_key" }] }
    ]
  }
}

// 복합 조건 예시
{
  "condition": {
    "$and": [
      { "health": { "min": 1 } },
      {
        "$or": [
          { "strength": { "min": 7 } },
          { "agility": { "min": 5 } }
        ]
      }
    ]
  }
}
```

### 1. 능력치 조건

```json
{
  "condition": {
    "$and": [
      { "strength": 5 },                   // 정확한 값
      { "agility": { "min": 3 } },         // 최솟값
      { "wisdom": { "max": 7 } },          // 최댓값
      { "charisma": { "min": 2, "max": 8 } } // 범위
    ]
  }
}
```

### 2. 자원 조건

```json
{
  "condition": {
    "$and": [
      { "health": { "min": 2 } },          // 체력 2 이상
      { "mind": 3 },                       // 정신력 정확히 3
      { "gold": { "max": 3 } }             // 재화 3 이하
    ]
  }
}
```

### 3. 상태 조건

#### 버프 조건 (in / not_in 지원)
```json
{
  "condition": {
    "$and": [
      { "buffs": { "in": ["blessed", "energized"] } } // blessed와 energized 상태 모두 보유
    ]
  }
}
```

추가 예시 (부재 조건 포함):
```json
{
  "condition": {
    "$and": [
      { "buffs": { "in": ["blessed"], "not_in": ["poisoned"] } }
    ]
  }
}
```

#### 플래그 조건 (in / not_in 지원)
```json
{
  "condition": {
    "$and": [
      { "flags": { "in": ["met_merchant", "has_key"] } } // 상인을 만났고 열쇠를 보유
    ]
  }
}
```

추가 예시 (부재 조건 포함):
```json
{
  "condition": {
    "$and": [
      { "flags": { "in": ["met_merchant"], "not_in": ["quest_failed"] } }
    ]
  }
}
```

#### 아이템 조건
```json
{
  "condition": {
    "$and": [
      { "items": {
          "health_potion": 1,                                          // 정확히 1개
          "gold_coin": 50,                                             // 정확히 50개
          "magic_scroll": { "min": 5 },                                // 최소 5개
          "arrow": { "min": 10, "max": 50 },                           // 10~50개 범위
          "cursed_item": 0                                             // 정확히 0개 (보유하지 않음)
        }
      }
    ]
  }
}
```

### 4. 변수 조건

```json
{
  "condition": {
    "$and": [
      { "variables": {
          "score": 1000,                       // 정확한 값
          "reputation": { "min": 40, "max": 80 } // 범위
        }
      }
    ]
  }
}
```

### 5. 스킬 조건

```json
{
  "condition": {
    "$and": [
      { "skills": { "swordsmanship": { "min": 2 } } },  // 스킬 레벨 2 이상
      { "skills": { "fireball": 1 } }                    // 스킬 레벨 정확히 1
    ]
  }
}
```

스킬 보유 여부는 레벨 1 이상으로 간주됩니다(`levels[skillId] >= 1`).

### 6. 게임 진행 조건

```json
{
  "condition": {
    "$and": [
      { "current_floor": 2 },                    // 현재 층이 2
      { "death_count": { "min": 1, "max": 5 } }, // 총 사망 횟수 1~5회
      { "current_floor_death_count": { "max": 2 } },  // 현재 층 사망 횟수 2회 이하
      { "completed_scenes": { // 완료된 씬 조건
          "in": ["scn_quest_1", "scn_tutorial"],       // 완료되어야 하는 씬들
          "not_in": ["scn_bad_ending", "scn_game_over"] // 완료되면 안 되는 씬들
        }
      },
      { "scene_count": { "min": 3, "max": 8 } }   // 완료한 씬 개수가 3~8개
    ]
  }
}
```

### 7. 우선순위 조건 (priority_condition)

랜덤 씬 선택 시 해당 씬을 최우선으로 선택하도록 하는 특별한 조건입니다.

```json
{
  "condition": {
    "$and": [
      { "health": { "min": 1 } }             // 기본 등장 조건
    ]
  },
  "priority_condition": {
    "$and": [
      { "health": { "max": 1 } }             // 체력이 1 이하일 때 우선 선택
    ]
  }
}
```

#### 동작 규칙

- 우선순위 선택에서는 다음 규칙을 따릅니다:
  - 일반 `condition`은 평가하지 않습니다. 오직 `priority_condition`만 평가합니다.
  - `random_selectable` 값은 무시합니다. `random_selectable: false`여도 `priority_condition`을 만족하면 우선 선택 대상이 됩니다.
  - 단, 이미 완료된 씬이며 `repeatable !== true`인 경우는 제외됩니다(중복 실행 방지).
  - 우선순위 후보가 여러 개면 그중 랜덤으로 1개를 선택합니다.

이 규칙으로, 특정 상황에서만 강제로 등장해야 하는 씬을 보다 안정적으로 제어할 수 있습니다.

## ⚡ 효과 시스템 (effects & initial_effects)

씬에 도달했을 때 적용되는 효과들입니다.

### 🔄 최초 방문 효과 vs 일반 효과 시스템

- **`effects`**: 기본적으로 적용되는 효과 (최초 방문, 재방문 모두)
- **`initial_effects`**: 최초 방문 시에만 `effects` 대신 적용되는 특별한 효과

```json
{
  "effects": {
    "health": 1,
    "special_effects": { "glow": "green" } // 특수 효과는 effects 내부에 위치
  },
  "initial_effects": {
    "health": 3,
    "special_effects": { "glow": "green" } // 최초 방문 전용 특수 효과는 initial_effects 내부에 위치
  }
}
```

**동작 방식**:
- **최초 방문 + `initial_effects` 있음**: `initial_effects` 적용
- **최초 방문 + `initial_effects` 없음**: `effects` 적용
- **재방문**: 항상 `effects` 적용

### 1. 능력치/자원 변화

```json
{
  "effects": {
    "strength": 1,                         // 힘 +1
    "agility": -1,                         // 민첩 -1
    "health": 2,                           // 체력 +2
    "mind": -1                             // 정신력 -1
  }
}
```

### 2. 상태(버프) 관리

```json
{
  "effects": {
    "add_buffs": ["blessed", "energized"],      // 상태 추가
    "remove_buffs": ["poisoned", "cursed"]      // 상태 제거
  }
}
```

### 3. 플래그 관리

```json
{
  "effects": {
    "set_flags": ["met_merchant", "quest_active"],     // 플래그 설정
    "unset_flags": ["first_visit", "tutorial_mode"]    // 플래그 해제
  }
}
```

### 4. 아이템 관리

```json
{
  "effects": {
    "items": {
      "health_potion": 3,     // 포션 3개 추가
      "bread": -2,            // 빵 2개 제거
      "ancient_key": 1,       // 열쇠 1개 추가
      "gold_coin": -50        // 골드 50개 제거
    }
  }
}
```

### 5. 변수 효과

변수를 조작하는 다양한 연산을 수행할 수 있습니다.

```json
{
  "effects": {
    "variables": [
      { "id": "score", "operator": "add", "value": 100 },        // 점수 +100
      { "id": "reputation", "operator": "subtract", "value": 10 }, // 평판 -10
      { "id": "luck", "operator": "set", "value": 75 },          // 운을 75로 설정
      { "id": "corruption", "operator": "multiply", "value": 1.5 } // 타락도 1.5배
    ]
  }
}
```

### 6. 경험치 시스템

```json
{
  "effects": {
    "exp": {
      "strength": 10,    // 힘 경험치 +10
      "wisdom": 5,       // 지혜 경험치 +5
      "level": -3,       // 레벨 경험치 -3 (패널티)
      "skills": {        // 스킬 경험치 추가 (자동 레벨업)
        "swordsmanship": 25,
        "fireball": 10
      }
    },
    "manual_level_up": ["strength", "agility"]  // 수동 레벨업
  }
}
```

참고: 스킬은 자동 레벨업만 지원합니다. `manual_level_up` 대상으로 스킬을 지정하지 않습니다.

### 7. 특수 효과

```json
{
  "effects": {
    "special_effects": {
      "force_gameover": true,              // 즉시 게임오버
      "rest_room_cleanup": true,           // 휴식방 정리
      "reset_health": true,                // 체력 전체 회복
      "reset_mind": true,                  // 정신력 전체 회복
      "complete_scene": "scn_quest_1",     // 특정 씬 완료 처리
      "increment_death_count": true,       // 사망 횟수 증가
      "set_floor": 3                       // 층 설정
    }
  }
}
```

## 🎲 선택지 시스템 (choices)

플레이어가 선택할 수 있는 옵션들입니다.

### 1. 기본 선택지

```json
{
  "choices": [
    {
      "text": "앞으로 나아간다",
      "next": { "scene_id": "scn_next_scene" }
    }
  ]
}
```

### 2. 조건부 선택지

```json
{
  "choices": [
    {
      "text": "힘으로 문을 연다",
      "condition": {
        "$and": [
          { "strength": { "min": 5 } }
        ]
      },
      "next": { "scene_id": "scn_door_opened" }
    },
    {
      "text": "힘으로 문을 연다 (힘 5 필요)",
      "condition": {
        "$and": [
          { "strength": { "min": 5 } }
        ]
      },
      "visible_if_failed_condition": true,    // 조건 실패해도 회색으로 표시
      "next": { "scene_id": "scn_door_opened" }
    }
  ]
}
```

### 3. 확률 분기 선택지

```json
{
  "choices": [
    {
      "text": "마법 의식을 시도한다",
      "probability": {
        "base_rate": 0.4,                    // 기본 성공률 40%
        "max_rate": 0.85,                    // 최대 성공률 85%
        "modifier": {
          "stats": {
            "wisdom": { "per_unit": 0.08, "max": 0.4 },     // 지혜 1당 +8%, 최대 +40%
            "charisma": { "per_unit": 0.05 }                 // 카리스마 1당 +5% (제한 없음)
          },
          "buffs": {
            "blessed": { "per_unit": 0.15 },                // 축복 상태 시 +15%
            "energized": { "per_unit": 0.1, "max": 0.1 }    // 활력 상태 시 +10%
          },
          "flags": {
            "met_wizard": { "per_unit": 0.2 },              // 마법사를 만났으면 +20%
            "studied_magic": { "per_unit": 0.15, "max": 0.15 } // 마법 공부했으면 +15%
          },
          "items": {
            "magic_scroll": { "per_unit": 0.1, "max": 0.3 }, // 마법 두루마리 1개당 +10%, 최대 +30%
            "mana_potion": { "per_unit": 0.05, "max": 0.2 }  // 마나 포션 1개당 +5%, 최대 +20%
          },
          "variables": {
            "magic_knowledge": { "per_unit": 0.01, "max": 0.25 }, // 마법 지식 1당 +1%, 최대 +25%
            "reputation": { "per_unit": 0.002, "max": 0.1 }       // 평판 1당 +0.2%, 최대 +10%
          },
          "skills": {
            "magic": { "per_unit": 0.12, "max": 0.36 },           // 마법 스킬 1레벨당 +12%, 최대 +36%
            "ritual": { "per_unit": 0.08 },                       // 의식 스킬 1레벨당 +8% (제한 없음)
            "alchemy": { "per_unit": 0.05, "max": 0.15 }          // 연금술 스킬 1레벨당 +5%, 최대 +15%
          }
        },
        "success_next": { "scene_id": "scn_magic_success" },
        "failure_next": { "scene_id": "scn_magic_failure" }
      }
    }
  ]
}
```

**지원하는 수정자 유형**:
- `stats`: 능력치 (strength, agility, wisdom, charisma)
- `buffs`: 상태/버프 (blessed, energized, poisoned 등)
- `flags`: 플래그 (met_merchant, has_key 등)
- `items`: 아이템 (health_potion, gold_coin 등)
- `variables`: 변수 (score, reputation, magic_knowledge 등)
- `skills`: 스킬 레벨 기반 (예: `swordsmanship`)

### 4. 챕터 이동 선택지

```json
{
  "choices": [
    {
      "text": "2층으로 올라간다",
      "next": { "chapter_id": "story_floor_2" }
    },
    {
      "text": "휴식방으로 돌아간다",
      "next": { 
        "chapter_id": "rest_floor_1",
        "scene_id": "scn_rest_main"
      }
    }
  ]
}
```

## 📝 조건부 텍스트 (conditional_text)

효과가 적용된 후에 표시되는 조건부 텍스트입니다. 조건이 성립하면 기본 텍스트를 대체해서 표시됩니다.

```json
{
  "text": "체력 상태를 확인합니다.",
  "conditional_text": [
    {
      "text": "체력 상태를 확인합니다. 체력이 위험합니다!",
      "condition": {
        "$and": [
          { "health": { "max": 1 } }
        ]
      }
    },
    {
      "text": "체력 상태를 확인합니다. 체력이 충분합니다.",
      "condition": {
        "$and": [
          { "health": { "min": 2 } }
        ]
      }
    }
  ]
}
```

## 🌟 배경 효과 (background_effects)

씬에 시각적 몰입감을 더하는 배경 효과들입니다.

### 기본 사용법

```json
{
  "background_effects": ["screen_shake"]
}
```

### 프리셋 사용

```json
{
  "background_effects": ["screen_shake:strong", "vignette:warning"]
}
```

### 지원하는 효과

#### 화면 흔들림 (screen_shake)
- `screen_shake:light` - 가벼운 흔들림
- `screen_shake:normal` - 기본 흔들림
- `screen_shake:strong` - 강한 흔들림
- `screen_shake:infinite_tremor` - 무한 떨림
- `screen_shake:infinite_vibration` - 무한 진동

#### 비네트 효과 (vignette)
- `vignette:warning` - 빨간 경고
- `vignette:cold` - 파란 차가움
- `vignette:poison` - 초록 독성
- `vignette:shadow` - 검은 그림자

### 고급 활용

#### 다중 효과
```json
{
  "background_effects": ["screen_shake:normal", "vignette:warning"]
}
```

## 🎮 씬 타입 및 동작 제어

### 씬 타입
- `"type": "main"` - 메인 스토리 씬
- `"type": "side"` - 사이드 퀘스트 씬  
- `"type": "event"` - 이벤트 씬

### 동작 제어
- `"random_selectable": true` - 랜덤 선택 가능
- `"repeatable": true` - 완료 후에도 다시 실행 가능 