# 🎨 고급 시나리오 기법

텍스트 효과, 이미지 활용, 동적 콘텐츠 등 고급 시나리오 작성 기법을 설명합니다.

## 🎨 텍스트 효과 시스템

### 기본 사용법

```json
{
  "text": "{{bold}}굵은 글씨{{bold}}와 {{red}}붉은 글씨{{red}}를 사용할 수 있습니다!"
}
```

### 강도 조절

```json
{
  "text": "{{shake:2}}강한 떨림{{shake}}와 {{glow:1.5}}밝은 빛남{{glow}}"
}
```

### 지원하는 효과

#### 텍스트 스타일
- `{{bold}}` - 굵은 글씨
- `{{italic}}` - 기울임 글씨
- `{{underline}}` - 밑줄
- `{{highlight}}` - 하이라이트

#### 색상 효과
- `{{red}}` - 붉은 색상
- `{{blue}}` - 파란 색상
- `{{green}}` - 초록 색상
- `{{yellow}}` - 노란 색상
- `{{purple}}` - 보라 색상
- `{{positive}}` - 증가/획득 색상 (시스템용 색상)
- `{{negative}}` - 감소/상실 색상 (시스템용 색상)
- `{{neutral}}` - 중립/정보 색상 (시스템용 색상)

#### 애니메이션 효과
- `{{shake}}` - 떨림 효과
- `{{glow}}` - 빛나는 효과
- `{{fade}}` - 페이드 인
- `{{scale}}` - 확대/축소
- `{{wave}}` - 웨이브 효과
- `{{pulse}}` - 펄스 효과

### 고급 활용

#### 효과 중첩
```json
{
  "text": "{{bold}}{{red}}{{shake:2}}매우 위험한 상황입니다!{{shake}}{{red}}{{bold}}"
}
```

#### 조건부 텍스트와 연동
```json
{
  "text": "체력 상태를 확인합니다.",
  "conditional_text": [
    {
      "text": "{{red:1.5}}{{shake}}체력이 매우 위험합니다!{{shake}}{{red}}",
      "condition": { "health": { "max": 1 } }
    },
    {
      "text": "{{green}}{{glow}}체력이 완벽합니다!{{glow}}{{green}}",
      "condition": { "health": 3 }
    }
  ]
}
```

## 🖼️ 이미지 시스템

### 기본 사용법

```json
{
  "text": "신비로운 존재를 만났습니다.\n\n[[muheob]]\n\n무엇을 할까요?"
}
```

### 크기 지정

```json
{
  "text": "작은 아이콘: [[icon:sm]]\n중간 이미지: [[scene:md]]\n큰 이미지: [[boss:lg]]"
}
```

### 지원하는 이미지 크기

| 크기 | 태그 | 최대 크기 | 용도 |
|------|------|-----------|------|
| 소형 | `:sm` | 200px | 아이콘, 작은 오브젝트 |
| 중형 | `:md` | 300px | 일반 장면, 캐릭터 (기본값) |
| 대형 | `:lg` | 400px | 임팩트 있는 장면, 보스 |

### 상태 기반 동적 이미지

```json
{
  "text": "거울 앞에서 자신의 모습을 확인합니다.",
  "conditional_text": [
    {
      "text": "\n\n[[character_healthy:md]]\n\n{{green}}건강한 모습입니다.{{green}}",
      "condition": { "health": { "min": 3 } }
    },
    {
      "text": "\n\n[[character_wounded:md]]\n\n{{red}}상처투성이 모습입니다.{{red}}",
      "condition": { "health": { "max": 1 } }
    }
  ]
}
```

## 📊 텍스트 변수 시스템

### 기본 사용법

```json
{
  "text": "현재 상태:\n- 힘: ${stats:strength}\n- 체력: ${resources:health}\n- 점수: ${vars:score}"
}
```

### 지원하는 변수 카테고리

#### 능력치 변수 (`stats:`)
```json
{
  "text": "능력치: 힘 ${stats:strength} | 민첩 ${stats:agility} | 지혜 ${stats:wisdom} | 매력 ${stats:charisma}"
}
```

#### 자원 변수 (`resources:`)
```json
{
  "text": "자원: 체력 ${resources:health} | 정신력 ${resources:mind}"
}
```

#### 게임 진행 변수 (`progress:`)
```json
{
  "text": "진행: 현재 층 ${progress:current_floor} | 사망 횟수 ${progress:death_count}"
}
```

#### 경험치 변수 (`exps:`, `levels:`)
```json
{
  "text": "경험치: 힘 경험치 ${exps:strength} | 힘 레벨 ${levels:strength}"
}
```

#### 사용자 정의 변수 (`vars:`)
```json
{
  "text": "변수: 점수 ${vars:score} | 평판 ${vars:reputation} | 운 ${vars:luck}"
}
```

#### 상태/플래그/아이템 변수
```json
{
  "text": "상태: 축복 ${buffs:blessed} | 완료 ${flags:quest_complete} | 검 ${items:sword}"
}
```

### 조건부 변수 표시

```json
{
  "text": "상태 확인:",
  "conditional_text": [
    {
      "text": "\n{{red}}체력이 위험합니다! (${resources:health}/3){{red}}",
      "condition": { "health": { "max": 1 } }
    },
    {
      "text": "\n{{green}}체력이 안전합니다. (${resources:health}/3){{green}}",
      "condition": { "health": { "min": 2 } }
    }
  ]
}
```

## 🎲 고급 확률 시스템

### 복합 확률 계산

```json
{
  "choices": [
    {
      "text": "{{bold}}전략적으로 접근한다{{bold}}",
      "probability": {
        "base_rate": 0.5,
        "max_rate": 0.9,
        "modifier": {
          "stats": {
            "strength": { "per_unit": 0.03 },
            "agility": { "per_unit": 0.02 },
            "wisdom": { "per_unit": 0.04, "max": 0.4 }
          },
          "skills": {
            "swordsmanship": { "per_unit": 0.05, "max": 0.3 }
          }
        },
        "success_next": { "scene_id": "scn_strategy_success" },
        "failure_next": { "scene_id": "scn_strategy_failure" }
      }
    }
  ]
}
```

### 확률 결과 시각화

```json
{
  "id": "scn_success_visual",
  "text": "{{glow:2}}{{scale:1.5}}대성공!{{scale}}{{glow}}\n\n[[triumph:lg]]\n\n{{green}}{{bold}}놀라운 성과를 이뤄냈습니다!{{bold}}{{green}}",
  "effects": {
    "exp": { "strength": 30, "level": 50 }
  }
}
```

## 📊 진행도 기반 동적 스토리텔링

### 씬 카운트 기반 복합 조건

```json
{
  "text": "앞길을 막는 장애물을 발견했습니다.",
  "choices": [
    {
      "text": "{{yellow}}신중하게 접근한다 (초보자용){{yellow}}",
      "condition": { "scene_count": { "max": 3 } },
      "next": { "scene_id": "scn_cautious_approach" }
    },
    {
      "text": "{{blue}}경험을 활용하여 돌파한다{{blue}}",
      "condition": {
        "scene_count": { "min": 4 },
        "wisdom": { "min": 3 }
      },
      "next": { "scene_id": "scn_experienced_solution" }
    },
    {
      "text": "{{purple}}{{glow}}마스터급 기술로 해결한다{{glow}}{{purple}}",
      "condition": {
        "scene_count": { "min": 8 },
        "strength": { "min": 6 },
        "agility": { "min": 5 }
      },
      "next": { "scene_id": "scn_master_technique" }
    }
  ]
}
```

## 🎯 경험치 시스템 고급 패턴

### 경험치 기반 동적 텍스트

```json
{
  "text": "수련의 대가를 만났습니다.\n\n[[training_master:md]]",
  "conditional_text": [
    {
      "text": "\n\n'{{yellow}}아직 준비가 되지 않았군.{{yellow}}'",
      "condition": { "can_level_up": { "not": "strength" } }
    },
    {
      "text": "\n\n{{glow}}'{{green}}드디어 때가 왔구나! 새로운 경지로 인도해주겠다.{{green}}'{{glow}}",
      "condition": { "can_level_up": "strength" }
    }
  ]
}
```

### 수동 레벨업 시스템

```json
{
  "text": "특별한 훈련 기회가 생겼습니다.\n\n[[training_ground:md]]\n\n어떤 능력을 집중 성장시킬까요?",
  "choices": [
    {
      "text": "{{red}}{{bold}}힘 집중 훈련{{bold}}{{red}}",
      "condition": { "can_level_up": "strength" },
      "next": { "scene_id": "scn_strength_focused" }
    },
    {
      "text": "{{blue}}{{bold}}민첩성 집중 훈련{{bold}}{{blue}}",
      "condition": { "can_level_up": "agility" },
      "next": { "scene_id": "scn_agility_focused" }
    }
  ],
  "effects": {
    "manual_level_up": ["strength", "agility"]
  }
}
```

## 🔗 복합 조건 활용

### 다층 조건 시스템

```json
{
  "text": "특별한 도전을 받습니다.\n\n[[special_challenge:lg]]",
  "condition": {
    "strength": { "min": 4 },
    "agility": { "min": 3 },
    "buffs": { "in": ["blessed", "energized"] },
    "flags": { "in": ["special_training_complete"] },
    "scene_count": { "min": 5 },
    "can_level_up": "wisdom"
  }
}
```

## 🎭 특수 연출 기법

### 임팩트 있는 게임오버

```json
{
  "text": "{{shake:3}}{{red:2}}{{scale:1.5}}모든 것이 끝났습니다...{{scale}}{{red}}{{shake}}\n\n[[game_over:lg]]\n\n{{fade}}어둠이 모든 것을 삼켰습니다.{{fade}}",
  "effects": {
    "special_effects": {
      "force_gameover": true,
      "increment_death_count": true
    }
  }
}
```

### 성취 순간 연출

```json
{
  "text": "{{glow:3}}{{pulse:2}}{{scale:1.8}}전설의 무기 획득!{{scale}}{{pulse}}{{glow}}\n\n[[legendary_weapon:lg]]\n\n{{wave:1.5}}신비로운 힘이 온몸을 감쌉니다...{{wave}}",
  "effects": {
    "items": { "excalibur": 1 },
    "add_buffs": ["legend_awakened"]
  }
}
```

## 💡 고급 기법 활용 팁

### 텍스트 효과 활용
- **강도 조절**: 상황의 심각도에 따라 효과 강도 조절
- **색상 일관성**: 같은 종류의 정보는 같은 색상 사용
- **과도한 사용 주의**: 너무 많은 효과는 가독성 저해

### 이미지 활용
- **크기 선택**: 상황의 중요도에 따른 적절한 크기 선택
- **배치 고려**: 텍스트와 이미지의 자연스러운 배치
- **로딩 최적화**: 중요한 장면에만 대형 이미지 사용

### 동적 콘텐츠
- **변수 활용**: 실시간 정보 표시로 몰입도 향상
- **조건부 분기**: 플레이어 상태에 따른 다양한 경험 제공
- **진행도 추적**: 씬 카운트로 적응형 난이도 조절

### 성능 고려사항
- **애니메이션 최적화**: 과도한 애니메이션 효과 지양
- **조건 복잡도**: 너무 복잡한 조건은 성능에 영향
- **이미지 최적화**: 적절한 해상도와 압축 활용 