### 스킬 시스템 설계 (EXP/자동 레벨/랭크명·랭크 설명·퍼시스턴스)

본 문서는 기존 통합 경험치 시스템 위에 “스킬(skill)”을 추가하기 위한 설계/구현 계획이다. 스킬은 JSON(@config)로 정의되며, 각 스킬은 “랭크별 요구 경험치” 기반 자동 레벨업 구조를 갖는다. 랭크 이름과 랭크별 설명을 제공하며, 랭크 개수가 곧 최대 레벨이 된다. 시나리오 DSL(조건/효과/확률 수정자)은 최소 변경으로 스킬을 자연스럽게 활용하도록 확장한다.

---

## 목표
- 스킬을 JSON에서 선언적으로 정의하고 앱 구동 시 로드
- 각 스킬은 경험치-레벨 구조를 가지며 최대 레벨 제한, 레벨별 랭크명 제공
- 기존 통합 경험치 시스템(ExperienceManager/EXPERIENCE_CONFIGS)과 호환
- 씬 조건/효과/확률 수정자에서 스킬 레벨/랭크/경험치를 활용 가능
- 기존 시나리오 및 시스템에 대한 하위 호환성 유지

---

## 용어 정리
- 씬(scene): 텍스트+선택지의 단일 단위
- 시나리오(scenario): 여러 씬이 next_id로 연결된 묶음
- 챕터(chapter): 여러 시나리오의 묶음
- 스킬(skill): 플레이어가 보유/성장시키는 능력 단위(경험치→레벨/랭크)
- 랭크(rank): 스킬의 각 레벨에서 표시되는 고유 이름(예: 초급/중급/고급)

---

## 데이터 스키마 (@assets/config/skills.json)
아래 스키마로 새 파일을 추가한다. 각 스킬은 랭크 배열을 가지며, 각 랭크는 이름/설명/도달에 필요한 경험치를 명시한다. 또한 `persist`로 챕터 간 유지 여부를 제어한다(기본: false).

```json
{
  "swordsmanship": {
    "id": "swordsmanship",
    "persist": false,
    "ranks": [
      { "name": "초심자", "description": "기초 동작을 배운다", "exp": 100 },
      { "name": "견습",   "description": "연속 동작을 익힌다", "exp": 150 },
      { "name": "숙련",   "description": "실전 응용이 가능하다", "exp": 200 }
    ]
  },
  "fireball": {
    "id": "fireball",
    "persist": false,
    "ranks": [
      { "name": "점화", "description": "작은 불씨를 만든다", "exp": 80 },
      { "name": "화염", "description": "안정된 화염구를 만든다", "exp": 120 }
    ]
  }
}
```

설명
- 랭크 배열의 길이 = 최대 레벨. 초기 상태는 레벨 0(미보유)이며, 첫 랭크(exp)가 충족되면 자동으로 레벨 1 달성(보유 시작)
- 각 랭크의 `exp`는 해당 랭크에 도달하기 위해 새로 필요로 하는 경험치(레벨 L→L+1에 필요한 분기 경험치)
- `persist`: true면 챕터 전환 시에도 해당 스킬의 레벨/경험치를 유지. 기본값은 false(챕터 이동 시 초기화)

---

## 로딩/타입 정의 추가
파일: `utils/dataLoader.ts` / `types/index.ts`

- SkillData 타입 추가
  - id, persist, ranks: Array<{ name: string; description: string; exp: number }>
- 데이터 캐시/로더에 `skills` 추가 및 유틸 제공
  - loadSkills(), getSkillById(id), getAllSkillIds(), getAllSkillsAsArray()
  - 타입 가드: isSkillKey(skillId: string): boolean

---

## 통합 경험치 시스템 연동
파일: `constants/experienceConfig.ts`

- 앱 구동 시 skills.json을 읽어 각 스킬에 대한 ExperienceConfig를 동적 생성
  - category: 'skill'
  - autoLevelUp: true (요구 사항)
  - maxLevel: ranks.length
  - expToLevel: 현재 레벨 L에서 L+1로 가기 위한 필요 경험치 = ranks[L].exp (0-index, L>=ranks.length면 Infinity)

GameState는 이미 `experience`/`levels` 사전 구조로 임의 키 확장을 지원하므로 추가 필드 없이 스킬 레벨/경험치가 저장된다. 스킬 보유 여부는 `levels[skillId] >= 1`로 판정한다.

---

## 시나리오 DSL 확장 (조건/효과/확률)
파일: `scenario-guide/SCENARIO-ATTRIBUTES.md` 갱신 필요(가이드 반영)

1) 조건(Conditions)
- 스킬 레벨 조건: `skills` (항상 레벨 기준)
```json
{
  "condition": {
    "$and": [
      { "skills": { "swordsmanship": { "min": 3 } } },
      { "skills": { "fireball": 1 } }
    ]
  }
}
```

2) 효과(Effects)
- 경험치 추가는 기존 `exp` 내부의 `skills`에 분리하여 사용(타 경험치와 충돌 방지)
```json
{
  "effects": { "exp": { "skills": { "swordsmanship": 25, "fireball": 10 } } }
}
```

수동 레벨업과 스킬 레벨 직접 설정은 사용하지 않는다(자동 레벨업만 지원).

3) 확률 수정자(Probability.modifier)
- 스킬 기반 수정자 추가: `skills`
```json
{
  "choices": [
    {
      "text": "정밀 베기",
      "probability": {
        "base_rate": 0.4,
        "max_rate": 0.9,
        "modifier": {
          "skills": { "swordsmanship": { "per_unit": 0.05, "max": 0.3 } }
        },
        "success_next": { "scene_id": "scn_slash_success" },
        "failure_next": { "scene_id": "scn_slash_fail" }
      }
    }
  ]
}
```

---

## 엔진 변경 포인트
- `types/index.ts`
  - SkillData, DSL 타입(AtomicCondition/SceneEffects/ProbabilityModifiers)에 `skills`(조건), `modifier.skills`(확률) 추가

- `utils/dataLoader.ts`
  - skills 로더/캐시/유틸 및 `isSkillKey` 제공

- `constants/experienceConfig.ts`
  - skills.json 기반 동적 ExperienceConfig 생성, category='skill'
  - ranks 기반 expToLevel 구현 (L→L+1: ranks[L].exp)

- `utils/ExperienceManager.ts`
  - 기존 로직 그대로 활용(스킬 ID가 EXPERIENCE_CONFIGS에 있으면 자동 처리)

- `utils/scene/conditions/ConditionChecker.ts`
  - `skills` 처리: state.levels[skillId]로 수치 비교

- `utils/scene/effects/EffectApplier.ts`
  - `effects.exp.skills`를 평탄화하여 ExperienceManager로 전달
  - 스킬에 대해서는 수동 레벨업/직접 설정 사용 안 함

- `utils/scene/probability/ProbabilityCalculator.ts`
  - `modifier.skills` 지원: 레벨 값(levels[skillId])을 per_unit에 곱해 가산, max 캡 적용

- `utils/scene/ChapterTransitionManager.ts`
  - 챕터 전환 시 “비지속(persist=false)” 스킬의 레벨/경험치 초기화 로직 추가
    - skills.json을 참조하여 persist=false인 스킬들의 `levels[skillId]=0`, `experience[skillId]=0`으로 리셋
    - persist=true인 스킬은 유지
  - 또는 `contexts/GameStateReducer.ts`에 `RESET_NON_PERSISTENT_SKILLS` 액션을 추가하고 전환 시점에 디스패치

- `scripts/validateData.js`
  - skills.json 스키마 검증(필드 존재/타입, ranks 배열 유효성, exp>0 등)

---

## 유틸리티
- `getSkillRankName(skillId: string, level: number): string`
  - ranks[level-1].name 사용, 범위를 벗어나면 `'Lv.' + level` 반환
- `getSkillRankDescription(skillId: string, level: number): string | null`
  - ranks[level-1].description 반환(없으면 null)

---

## 예시: 시나리오에서 스킬 사용

```json
{
  "id": "scn_sword_lesson",
  "text": "검술 수련을 이어간다.",
  "choices": [
    {
      "text": "기초 자세 반복",
      "next": { "scene_id": "scn_sword_next" }
    },
    {
      "text": "고급 동작 연습 (검술 Lv.3 이상)",
      "condition": { "skill_levels": { "swordsmanship": { "min": 3 } } },
      "next": { "scene_id": "scn_sword_advanced" }
    }
  ],
  "effects": {
    "exp": { "swordsmanship": 20 },
    "special_effects": { "vignette": "shadow" }
  }
}
```

---

## 구현 단계 체크리스트
1) 데이터/타입/로더
- [ ] `assets/config/skills.json` 생성(샘플 2~3개 포함)
- [ ] `types/index.ts`에 `SkillData`/DSL 확장 타입 추가
- [ ] `utils/dataLoader.ts`에 skills 로더/유틸/타입가드 추가

2) 경험치 설정 연동
- [ ] `constants/experienceConfig.ts`에서 skills.json을 읽어 `EXPERIENCE_CONFIGS`에 병합(category='skill', autoLevelUp=true)
- [ ] ranks 기반 expToLevel 구현 및 maxLevel=ranks.length 적용

3) 조건/효과/확률 엔진
- [ ] `ConditionChecker`에 `skill_levels`/`skill_ranks` 처리 추가
- [ ] `EffectApplier`에 `set_skill_levels`(선택) 처리 추가
- [ ] `ProbabilityCalculator`에 `modifier.skills` 처리 추가

4) 가이드/검증/예시
- [ ] `scenario-guide/SCENARIO-ATTRIBUTES.md`에 스킬 DSL 문서 반영
- [ ] `scripts/validateData.js`에 skills 스키마 검증 추가(ranks·persist)
- [ ] 샘플 씬에 스킬 조건/효과/확률 예시 추가

5) UI(선택)
- [ ] `StatsDisplay` 또는 신규 `SkillsDisplay`에서 스킬 레벨/랭크/경험치 바 표시
- [ ] 효과 텍스트에 스킬 레벨업 로그 표시(옵션)

6) 챕터 전환 정리
- [ ] `ChapterTransitionManager` 또는 Reducer에 비지속 스킬 초기화 로직 추가
- [ ] E2E: 챕터 이동 시 persist=false 스킬이 초기화되고 persist=true 스킬은 유지되는지 확인

---

## 호환성/이관
- 기존 시스템 변경 없이 스킬만 추가되므로 하위 호환
- 스킬 잠금/개방은 레벨 0↔1 기준. 필요시 `set_skill_levels`로 개방 처리 가능

---

## 확장 포인트
- 랭크별 패시브 보너스: 각 레벨 획득 시 자동 버프/아이템 지급을 `onLevelUp`에서 구현
- 스킬 시너지: 확률 수정자에서 `skills`+`stats`/`buffs` 복합 조합 규칙 추가 가능

---

## 완료 정의(DoD)
- skills.json 정의/검증 및 로더
- EXPERIENCE_CONFIGS에 스킬 반영(자동 레벨업) 및 레벨업/경험치 동작 확인
- 챕터 전환 시 persist=false 스킬 초기화가 정상 동작
- 조건/효과/확률에서 스킬 동작 e2e 시나리오 1개 통과
- 문서/가이드 반영 및 샘플 데이터/씬 제공


