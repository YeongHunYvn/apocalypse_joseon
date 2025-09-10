import { GAME_PROGRESS, RESOURCES, STATS } from '../constants/gameConfig';
import {
  TransitionErrorInfo,
  TransitionState,
} from '../hooks/story/transition';

import { SpecialEffects as SpecialEffectsType } from '../constants/specialEffects';

/**
 * 텍스트 효과 타입 정의
 * 씬 텍스트와 선택지 텍스트에 적용할 수 있는 시각적 효과들
 */
export type TextEffectType =
  // 텍스트 스타일 효과
  | 'bold' // 굵은 글씨
  | 'italic' // 기울임 글씨
  | 'underline' // 밑줄
  | 'highlight' // 하이라이트
  // 색상 효과
  | 'red' // 붉은 색상
  | 'blue' // 파란 색상
  | 'green' // 초록 색상
  | 'yellow' // 노란 색상
  | 'positive' // 증가/획득 색상
  | 'negative' // 감소/상실 색상
  | 'neutral' // 중립/정보 색상
  // 애니메이션 효과
  | 'shake' // 떨림 효과
  | 'glow' // 빛나는 효과
  | 'fade' // 페이드 인
  | 'scale' // 확대/축소 효과
  | 'wave' // 웨이브 효과
  | 'pulse'; // 펄스 효과

/**
 * 텍스트 표시 모드 타입
 * 씬 텍스트와 선택지 텍스트를 구분하여 기본 효과를 다르게 적용
 */
export type TextDisplayMode = 'scene' | 'choice';

/**
 * 텍스트 효과 인터페이스
 * 파싱된 텍스트 효과의 정보를 담는 구조
 */
export interface TextEffect {
  /** 효과 타입 */
  type: TextEffectType;
  /** 효과가 적용될 텍스트의 시작 위치 (인덱스) */
  start: number;
  /** 효과가 적용될 텍스트의 끝 위치 (인덱스) */
  end: number;
  /** 효과 강도 (0~1 범위, 선택사항) */
  intensity?: number;
  /** 애니메이션 지속시간 (밀리초, 선택사항) */
  duration?: number;
  /** 커스텀 색상 값 (색상 효과에서 사용, 선택사항) */
  color?: string;
}

/**
 * 파싱된 텍스트 세그먼트 인터페이스
 * 텍스트를 효과별로 분할한 후의 구조
 */
export interface TextSegment {
  /** 세그먼트 텍스트 */
  text: string;
  /** 적용된 효과들 */
  effects: TextEffect[];
  /** 세그먼트가 원본 텍스트에서 차지하는 시작 위치 */
  startIndex: number;
  /** 세그먼트가 원본 텍스트에서 차지하는 끝 위치 */
  endIndex: number;
}

/**
 * 텍스트 파싱 결과 인터페이스
 * 텍스트 파서가 반환하는 결과 구조
 */
export interface TextParseResult {
  /** 원본 텍스트 */
  originalText: string;
  /** 파싱된 텍스트 세그먼트들 */
  segments: TextSegment[];
  /** 전체 텍스트에 적용된 효과들 */
  allEffects: TextEffect[];
  /** 파싱 에러가 있었는지 여부 */
  hasErrors: boolean;
  /** 파싱 에러 메시지들 */
  errors: string[];
}

/**
 * EffectText 컴포넌트 Props 인터페이스
 * 텍스트 효과를 적용하는 컴포넌트의 속성 정의
 */
export interface EffectTextProps {
  /** 원본 텍스트 (중괄호 태그 포함) */
  text: string;
  /** 텍스트 표시 모드 (씬 텍스트 또는 선택지 텍스트) */
  displayMode?: TextDisplayMode;
  /** 애니메이션 활성화 여부 (기본값: true) */
  enableAnimations?: boolean;
  /** 추가 스타일 */
  style?: any;
  /** 텍스트 정렬 방식 */
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  /** 텍스트 색상 */
  color?: string;
  /** 폰트 크기 */
  fontSize?: number;
  /** 폰트 굵기 */
  fontWeight?:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
  /** 줄 간격 */
  lineHeight?: number;
  /** 텍스트 선택 가능 여부 */
  selectable?: boolean;
  /** 텍스트 터치 이벤트 핸들러 */
  onPress?: () => void;
  /** 텍스트 길게 터치 이벤트 핸들러 */
  onLongPress?: () => void;
  /** 테스트 ID (테스트용) */
  testID?: string;
}

/**
 * 텍스트 효과 설정 인터페이스
 * 각 효과별 기본 설정값을 정의
 */
export interface TextEffectConfig {
  /** 효과별 기본 강도 (0~1 범위) */
  defaultIntensity: { [K in TextEffectType]: number };
  /** 효과별 기본 애니메이션 지속시간 (밀리초) */
  defaultDuration: { [K in TextEffectType]: number };
  /** 효과별 기본 색상 */
  defaultColors: { [K in TextEffectType]: string };
  /** 애니메이션 효과 활성화 여부 */
  animationEnabled: { [K in TextEffectType]: boolean };
}

/**
 * 기본 효과 적용 결과 인터페이스
 * 기본 효과가 적용된 텍스트 효과 정보를 담는 구조
 */
export interface DefaultEffectResult {
  /** 적용된 기본 효과들 */
  effects: TextEffect[];
  /** 기본 효과 적용 여부 */
  hasDefaultEffects: boolean;
  /** 기본 효과와 기존 효과의 충돌 여부 */
  hasConflicts: boolean;
  /** 충돌 해결된 효과들 */
  resolvedEffects: TextEffect[];
}

/**
 * 기본 효과 적용 옵션 인터페이스
 * 기본 효과 적용 시 사용할 설정 옵션들
 */
export interface DefaultEffectOptions {
  /** 기본 효과 활성화 여부 (기본값: true) */
  enableDefaultEffects?: boolean;
  /** 기존 텍스트 효과와의 우선순위 (기본값: 'default') */
  priority?: 'default' | 'existing' | 'merge';
  /** 충돌 시 해결 방법 (기본값: 'skip') */
  conflictResolution?: 'skip' | 'override' | 'combine';
  /** 디버그 모드 활성화 여부 (기본값: false) */
  debug?: boolean;
}

/**
 * 아이템 고유 식별자 타입
 * @example "sword_001", "potion_heal"
 */
export type ItemId = string;

// ==========================================
// 🎯 JSON 데이터 타입 정의 (새로 추가)
// ==========================================

/**
 * JSON에서 로드되는 상태(버프) 데이터 인터페이스
 * 상태(버프)의 메타데이터를 포함
 */
export interface BuffData {
  /** 상태 고유 식별자 */
  id: string;
  /** 상태 표시 이름 */
  displayName: string;
  /** 상태 설명 */
  description: string;
  /** 임시성 여부 (휴식방에서 자동 제거) */
  temporary: boolean;
  /** 상태 카테고리 (positive, negative, neutral) */
  category: 'positive' | 'negative' | 'neutral';
}

/**
 * JSON에서 로드되는 플래그 데이터 인터페이스
 * 플래그의 메타데이터를 포함
 */
export interface FlagData {
  /** 플래그 고유 식별자 */
  id: string;
  /** 플래그 표시 이름 */
  displayName: string;
  /** 플래그 설명 */
  description: string;
  /** 플래그 카테고리 (item, progress, system) */
  category: 'progress' | 'choices' | 'state' | 'environment' | 'system';
}

/**
 * JSON에서 로드되는 아이템 데이터 인터페이스
 * 아이템의 메타데이터를 포함
 */
export interface ItemData {
  /** 아이템 고유 식별자 */
  id: string;
  /** 아이템 이름 */
  name: string;
  /** 아이템 설명 */
  description: string;
  /** 아이템 카테고리 */
  category: string;
  /** 지속성 여부 (챕터 전환 시 보존 여부) */
  persist: boolean;
}

/**
 * JSON에서 로드되는 스킬 데이터 인터페이스
 * 랭크별 요구 경험치에 따라 자동 레벨업되는 스킬 정의
 */
export interface SkillData {
  /** 스킬 고유 식별자 */
  id: string;
  /** 스킬 표시 이름 */
  displayName?: string;
  /** 챕터 간 유지 여부 (true면 유지, false면 챕터 이동 시 초기화) */
  persist?: boolean;
  /** 랭크 배열 (레벨 1부터 시작) */
  ranks: Array<{
    /** 랭크 이름 */
    name: string;
    /** 랭크 설명 (선택) */
    description?: string;
    /** 해당 랭크 도달에 필요한 경험치 (레벨 L→L+1의 분기 경험치) */
    exp: number;
  }>;
}

/**
 * JSON에서 로드되는 변수 데이터 인터페이스
 * 숫자 변수의 메타데이터를 포함
 */
export interface VariableData {
  /** 변수 고유 식별자 */
  id: string;
  /** 변수 설명 */
  description: string;
  /** 변수 카테고리 */
  category: string;
  /** 기본값 */
  defaultValue: number;
  /** 최소값 (선택적) */
  minValue?: number;
  /** 최대값 (선택적) */
  maxValue?: number;
  /**
   * 변수 지속성
   * - true: 휴식방에서도 유지 (예: 전체 점수, 명성)
   * - false: 휴식방에서 초기화 (예: 현재 층 임시 카운터)
   */
  persist: boolean;
}

/**
 * 씬 고유 식별자 타입
 * 'scn_' 접두어 사용 권장
 * @example "scn_rest_floor_1", "scn_story_floor_2_001"
 */
export type SceneId = string;

/**
 * 최소/최대 범위를 정의하는 인터페이스
 * @example { min: 5, max: 10 } - 5 이상 10 이하
 * @example { min: 3 } - 3 이상
 * @example { max: 7 } - 7 이하
 */
export interface MinMaxRange {
  min?: number;
  max?: number;
}

/**
 * 게임 상태 타입 정의
 * 플레이어의 모든 상태 정보를 포함
 *
 * @example
 * {
 *   // 능력치 (0-10 범위)
 *   strength: 5,
 *   agility: 3,
 *   wisdom: 7,
 *   charisma: 4,
 *
 *   // 자원 (0-최대값)
 *   health: 80,
 *   mind: 60,
 *
 *   // 상태 정보
 *   buffs: ['injured', 'blessed'],
 *   flags: ['has_key', 'met_merchant'],
 *   items: [{ id: 'sword_001', name: '철검', ... }],
 *
 *   // 통합 경험치 시스템 (신규)
 *   experience: { strength: 75, agility: 30, wisdom: 90, charisma: 45, level: 120 },
 *   levels: { strength: 3, agility: 2, wisdom: 4, charisma: 2, level: 1 },
 *
 *   // 게임 진행 상태
 *   current_floor: 2,
 *   death_count: 1,
 *   death_count_by_floor: { 1: 1, 2: 0 },
 *   completed_scenes: ['scn_rest_floor_1', 'scn_story_floor_1_001'],
 *   visited_scenes: ['scn_rest_floor_1', 'scn_story_floor_1_001', 'scn_story_floor_1_002']
 * }
 */
export type GameState = {
  // 능력치 - 정의된 능력치만 사용 가능 (자동 확장)
  [K in StatKey]: number;
} & {
  // 자원 - 정의된 자원만 사용 가능 (자동 확장)
  [K in ResourceKey]: number;
} & {
  // 상태
  buffs: BuffKey[];
  flags: FlagKey[];
  items: Item[];

  // 숫자 변수
  variables: { [key: string]: number };

  // 통합 경험치 시스템
  /** 모든 경험치 타입의 현재 경험치 (strength, agility, wisdom, charisma, level, rank_combat 등) */
  experience: { [key: string]: number };

  /** 모든 경험치 타입의 현재 레벨 */
  levels: { [key: string]: number };
} & {
  // 게임 진행 상태 - 명확한 타입 정의
  current_floor: number;
  death_count: number;
  death_count_by_floor: { [floor: number]: number };
  completed_scenes: SceneId[];
  visited_scenes: SceneId[]; // 방문한 씬들의 ID 목록 (최초 방문 감지용)
  /** 전역 방문 누계 */
  scene_count: number;
};

/**
 * 아이템 인터페이스
 * 게임 내 획득 가능한 모든 아이템의 구조를 정의
 *
 * @example
 * {
 *   id: 'sword_001',
 *   name: '철검',
 *   description: '평범한 철검입니다.',
 *   persist: true,
 *   quantity: 1
 * }
 */
export interface Item {
  /** 아이템 고유 식별자 */
  id: ItemId;
  /** 아이템 표시 이름 */
  name: string;
  /** 아이템 설명 */
  description: string;
  /**
   * 아이템 지속성
   * - true: 전체 게임 동안 보존 (예: 무기, 방어구)
   * - false: 층 한정 보존 (예: 포션, 열쇠)
   */
  persist: boolean;
  /** 아이템 수량 (기본값: 1) */
  quantity?: number;
}

/**
 * 상태(버프) 인터페이스
 * 플레이어에게 적용되는 상태 효과를 정의
 *
 * @example
 * {
 *   id: 'injured',
 *   displayName: '부상',
 *   temporary: true
 * }
 */
export interface Buff {
  /** 상태 고유 식별자 */
  id: string;
  /** 상태 표시 이름 */
  displayName: string;
  /**
   * 상태 임시성
   * - true: 휴식방에서 자동 제거 (예: 부상, 축복)
   * - false: 수동으로만 제거 (예: 영구적 상태)
   */
  temporary: boolean;
}

// 정의된 key들의 타입
export type StatKey = keyof typeof STATS;
export type ResourceKey = keyof typeof RESOURCES;
export type GameProgressKey = keyof typeof GAME_PROGRESS;
// BuffKey, FlagKey, VariableKey는 JSON 데이터에서 동적으로 생성됨
export type BuffKey = string;
export type FlagKey = string;
export type VariableKey = string;

/**
 * 단일 조건 타입 정의 (원자적 조건들)
 * $and/$or 배열 내부에서 사용되는 개별 조건을 정의
 *
 * @example
 * {
 *   // 능력치 조건: 힘 5 이상
 *   strength: { min: 5 }
 * }
 *
 * @example
 * {
 *   // 상태 조건: 특정 상태 보유
 *   buffs: { in: ['injured'] }
 * }
 *
 * @example
 * {
 *   // 플래그 조건: 특정 플래그 설정
 *   flags: ['has_key']
 * }
 */
export type AtomicCondition = {
  // 능력치 조건 - 정의된 능력치만 사용 가능 (자동 확장)
  [K in StatKey]?: number | MinMaxRange;
} & {
  // 자원 조건 - 정의된 자원만 사용 가능 (자동 확장)
  [K in ResourceKey]?: number | MinMaxRange;
} & {
  // 상태 조건 - in / not_in 전용
  buffs?: { in?: BuffKey[]; not_in?: BuffKey[] };

  // 플래그 조건 - in / not_in 전용
  flags?: { in?: FlagKey[]; not_in?: FlagKey[] };

  // 아이템 조건 - 아이템ID -> 개수 조건 (키-값 구조)
  items?: { [itemId: string]: number | MinMaxRange };

  // 변수 조건 - 숫자 변수 값 조건 (변수ID -> 값 또는 범위)
  variables?: { [variableId: string]: number | MinMaxRange };
  // 스킬 레벨 조건 - 스킬ID -> 레벨 값 또는 범위
  skills?: { [skillId: string]: number | MinMaxRange };

  // 통합 경험치 시스템 조건 - 특정 경험치 타입의 레벨업 가능 여부
  can_level_up?: string;

  // 게임 진행 상태 조건 - 정의된 게임 진행 상태만 사용 가능 (자동 확장)
  current_floor?: number;
  death_count?: number | MinMaxRange;
  death_count_by_floor?: { [floor: number]: number | MinMaxRange };
  current_floor_death_count?: number | MinMaxRange;
  completed_scenes?: {
    in?: SceneId[]; // 완료되어야 하는 씬들
    not_in?: SceneId[]; // 완료되면 안 되는 씬들
  };

  // 챕터별 씬 카운트 조건 - 현재 챕터에서 경험한 씬 수
  scene_count?: number | MinMaxRange;
};

/**
 * 조건 타입 정의
 * $and, $or 연산자를 사용하거나 직접 AtomicCondition 사용 가능
 *
 * @example
 * {
 *   // 기본 방식: 객체 안에 여러 조건 (암묵적 AND)
 *   "strength": { "min": 5 },
 *   "health": 2,
 *   "flags": { "in": ["has_key"] }
 * }
 *
 * @example
 * {
 *   // MongoDB 스타일 AND 조건
 *   "$and": [
 *     { "health": { "min": 2 } },
 *     { "strength": 5 },
 *     { "flags": { "in": ["has_key"] } }
 *   ]
 * }
 *
 * @example
 * {
 *   // MongoDB 스타일 OR 조건
 *   "$or": [
 *     { "strength": { "min": 8 } },
 *     { "wisdom": { "min": 5 } },
 *     { "flags": { "in": ["has_master_key"] } }
 *   ]
 * }
 *
 * @example
 * {
 *   // 복합 조건: AND와 OR을 중첩하여 사용
 *   "$and": [
 *     { "health": { "min": 1 } },
 *     {
 *       "$or": [
 *         { "strength": { "min": 5 } },
 *         { "agility": { "min": 3 } },
 *         { "wisdom": { "min": 4 } }
 *       ]
 *     }
 *   ]
 * }
 */
export type Condition =
  | AtomicCondition
  | {
      /** AND 연산자: 배열의 모든 조건이 참이어야 함 */
      $and: (AtomicCondition | Condition)[];
    }
  | {
      /** OR 연산자: 배열의 조건 중 하나라도 참이면 됨 */
      $or: (AtomicCondition | Condition)[];
    };

/**
 * 다음 이동 대상 타입 정의
 * 씬 간 이동을 위한 목적지 정보
 *
 * @example
 * { chapter_id: 'rest_floor_1', scene_id: 'scn_rest_floor_1' }
 * { scene_id: 'scn_story_floor_2_001' } // 현재 챕터 내 이동
 */
export type Next = {
  /** 이동할 챕터 ID (생략 시 현재 챕터) */
  chapter_id?: string;
  /** 이동할 씬 ID */
  scene_id?: string;
};

/**
 * 확률 수정자 인터페이스
 * 각 요소당 확률 변화량과 최대 확률 제한을 정의
 */
export interface ProbabilityModifier {
  /** 1개당 확률 변화량 (0~1 범위) */
  per_unit: number;
  /** 최대 확률 변화량 (선택적, 0~1 범위) */
  max?: number;
}

/**
 * 확률 분기 수정자 타입 정의
 * 다양한 게임 요소들이 확률에 미치는 영향을 정의
 */
export interface ProbabilityModifiers {
  /** 능력치별 확률 수정자 */
  stats?: { [K in StatKey]?: ProbabilityModifier };
  /** 상태(버프)별 확률 수정자 */
  buffs?: { [K in BuffKey]?: ProbabilityModifier };
  /** 플래그별 확률 수정자 */
  flags?: { [K in FlagKey]?: ProbabilityModifier };
  /** 아이템별 확률 수정자 */
  items?: { [K in ItemId]?: ProbabilityModifier };
  /** 변수별 확률 수정자 */
  variables?: { [K in VariableKey]?: ProbabilityModifier };
  /** 스킬 레벨 기반 확률 수정자 */
  skills?: { [skillId: string]: ProbabilityModifier };
}

/**
 * 확률 분기 타입 정의
 * 선택지의 성공/실패 확률과 결과를 정의
 *
 * @example
 * {
 *   base_rate: 0.7, // 기본 70% 성공 확률
 *   max_rate: 0.9,  // 최대 90% 성공 확률
 *   modifier: {
 *     stats: { strength: { per_unit: 0.05, max: 0.3 } }, // 힘 1당 5%, 최대 30%
 *     buffs: { blessed: { per_unit: 0.1 } }, // blessed 상태 시 10%
 *     items: { health_potion: { per_unit: 0.02, max: 0.1 } } // 포션 1개당 2%, 최대 10%
 *   },
 *   success_next: { scene_id: 'scn_success' },
 *   failure_next: { scene_id: 'scn_failure' }
 * }
 */
export interface Probability {
  /** 기본 성공 확률 (0~1 범위) */
  base_rate: number;
  /** 최대 성공 확률 (선택적, 0~1 범위) */
  max_rate?: number;
  /** 확률 수정자들 */
  modifier?: ProbabilityModifiers;
  /** 성공 시 이동할 곳 */
  success_next: Next;
  /** 실패 시 이동할 곳 */
  failure_next: Next;
}

/**
 * 선택지 인터페이스
 * 씬에서 플레이어가 선택할 수 있는 옵션을 정의
 *
 * @example
 * {
 *   text: "전투를 시작한다",
 *   condition: { strength: 5 }, // 힘 5 이상일 때만 표시
 *   probability: {
 *     base_rate: 0.8,
 *     modifier: { strength: 0.05 },
 *     success_next: { scene_id: 'scn_victory' },
 *     failure_next: { scene_id: 'scn_defeat' }
 *   }
 * }
 */
export interface Choice {
  /** 선택지 텍스트 */
  text: string;
  /** 선택지 표시 조건 (생략 시 항상 표시) */
  condition?: Condition;
  /**
   * 조건 실패 시에도 표시할지 여부
   * - true: 조건을 만족하지 않아도 표시 (회색 처리)
   * - false: 조건을 만족하지 않으면 숨김
   */
  visible_if_failed_condition?: boolean;
  /** 확률 분기 설정 (생략 시 일반 선택지) */
  probability?: Probability;
  /** 다음 이동 대상 (확률 분기가 아닌 경우) */
  next?: Next;
}

/**
 * 씬 효과 타입 정의
 * 씬에 도달했을 때 적용되는 모든 효과를 정의
 *
 * @example
 * {
 *   // 능력치 변화
 *   strength: 1, // 힘 +1
 *   wisdom: -2,  // 지혜 -2
 *
 *   // 자원 변화
 *   health: 20,  // 체력 +20
 *   mind: -10,   // 정신력 -10
 *
 *   // 상태 관리
 *   add_buffs: ['injured', 'blessed'],
 *   remove_buffs: ['cursed'],
 *
 *   // 플래그 관리
 *   set_flags: ['has_key', 'met_merchant'],
 *   unset_flags: ['lost_way'],
 *
 *   // 아이템 관리
 *   items: [
 *     { id: 'health_potion', quantity: 3 },   // 포션 3개 추가
 *     { id: 'bread', quantity: -2 },          // 빵 2개 제거
 *     { id: 'ancient_key' }                   // 열쇠 1개 추가 (기본값)
 *   ],
 *
 *   // 변수 조작
 *   variables: [
 *     { id: 'score', operator: 'add', value: 10 },
 *     { id: 'sanity', operator: 'subtract', value: 5 },
 *     { id: 'reputation', operator: 'set', value: 50 },
 *     { id: 'luck', operator: 'multiply', value: 1.5 }
 *   ],
 *
 *   // 경험치 효과 - 양수: 추가, 음수: 감소
 *   exp: {
 *     strength: 25,      // 힘 경험치 +25
 *     wisdom: 15,        // 지혜 경험치 +15
 *     level: -5          // 레벨 경험치 -5 (패널티)
 *   },
 *
 *   // 게임 진행 상태 업데이트
 *   current_floor: 3,
 *   death_count: 2,
 *   completed_scenes: ['scn_current'],
 *
 *   // 특수 효과
 *   force_gameover: true,
 *   rest_room_cleanup: true
 * }
 */
export type SceneEffects = {
  // 능력치 변화 - 정의된 능력치만 사용 가능 (자동 확장)
  [K in StatKey]?: number;
} & {
  // 자원 변화 - 정의된 자원만 사용 가능 (자동 확장)
  [K in ResourceKey]?: number;
} & {
  // 상태 추가/제거 - 정의된 상태만 사용 가능
  add_buffs?: BuffKey[];
  remove_buffs?: BuffKey[];

  // 플래그 설정/해제 - 정의된 플래그만 사용 가능
  set_flags?: FlagKey[];
  unset_flags?: FlagKey[];

  // 아이템 추가/제거 - 키-값 방식 (키: 아이템ID, 값: 개수 변화량)
  items?: { [itemId: string]: number };

  // 경험치 효과 - 양수: 추가, 음수: 감소
  exp?: { [key: string]: number } & { skills?: { [skillId: string]: number } };

  // 수동 레벨업 - 특정 경험치 타입들을 수동으로 레벨업
  manual_level_up?: string[];

  // 변수 조작 효과
  variables?: VariableEffect[];
} & {
  // 게임 진행 상태 업데이트 - 정의된 게임 진행 상태만 사용 가능 (자동 확장)
  current_floor?: number;
  death_count?: number;
  death_count_by_floor?: { [floor: number]: number };
  completed_scenes?: SceneId[];
} & {
  // 특수 효과
  special_effects?: SpecialEffects;
};

/**
 * 조건부 텍스트 인터페이스
 * 효과 적용 후 조건에 따라 다른 텍스트를 표시하기 위한 구조
 *
 * @example
 * {
 *   text: "체력이 회복되어 기분이 좋아졌습니다.",
 *   condition: { health: { min: 80 } }
 * }
 */
export interface ConditionalText {
  /** 표시할 텍스트 */
  text: string;
  /** 텍스트 표시 조건 */
  condition: Condition;
}

/**
 * 씬 타입 정의
 * 씬의 역할과 동작을 구분하는 타입
 * - main: 메인 스토리 (완료 시 선택 불가)
 * - side: 사이드 스토리 (완료 시 선택 불가)
 * - event: 이벤트 (완료되어도 반복 가능)
 */
export type SceneType = 'main' | 'side' | 'event';

/**
 * 씬 인터페이스
 * 게임의 기본 단위인 씬의 구조를 정의
 *
 * @example
 * {
 *   id: 'scn_story_floor_1_001',
 *   text: '어두운 복도에서 이상한 소리가 들립니다...',
 *   type: 'main',
 *   condition: { strength: 3 },
 *   background_effects: ['screen_shake'],
 *   choices: [
 *     { text: '조사한다', next: { scene_id: 'scn_investigate' } },
 *     { text: '도망간다', next: { scene_id: 'scn_run_away' } }
 *   ],
 *   effects: { health: -10, add_buffs: ['scared'] },
 *   repeatable: true
 * }
 */

export interface Scene {
  /** 씬 고유 식별자 */
  id: SceneId;
  /** 씬 메인 텍스트 */
  text: string;
  /** 씬 타입 (생략 시 기본 동작 적용) */
  type?: SceneType;
  /** 다중 배경 효과 타입 (배열 기반 다중 효과 지원) - 우선순위 높음 */
  background_effects?: string[];
  /**
   * 조건부 텍스트
   * - string: 조건 없는 텍스트
   * - ConditionalText[]: 조건부 텍스트 배열
   */
  conditional_text?: string | ConditionalText[];
  /** 씬 등장 조건 (생략 시 항상 등장) */
  condition?: Condition;
  /**
   * 우선 출현 조건 (랜덤 선택 시 우선순위 부여)
   * - 조건을 만족하는 씬이 있으면 일반 씬보다 먼저 선택됨
   * - random_selectable이 true인 씬에만 적용됨
   */
  priority_condition?: Condition;
  /** 선택지 목록 */
  choices: Choice[];
  /** 씬 도달 시 적용할 효과 */
  effects?: SceneEffects;
  /**
   * 최초 방문 시 적용할 대체 효과
   * - 최초 방문 시에만 적용되며, effects 대신 실행됨
   * - 재방문 시에는 effects가 실행됨 (완전 분리)
   */
  initial_effects?: SceneEffects;
  // 특수 효과는 effects 또는 initial_effects 내부의 special_effects로만 지원됩니다.
  /**
   * 랜덤 선택 가능 여부 (명시적 제어)
   * - true: 명시적으로 랜덤 선택 가능
   * - false: 명시적으로 랜덤 선택 불가
   * - undefined: 기본값 false (모든 타입에서 랜덤 선택 불가)
   */
  random_selectable?: boolean;
  /**
   * 완료 후 재실행 가능 여부
   * - true: 완료되어도 다시 실행 가능 (반복 가능한 씬)
   * - false 또는 undefined: 완료되면 다시 실행 불가 (기본값)
   */
  repeatable?: boolean;
}

/**
 * 챕터 타입 정의
 * 챕터의 역할을 구분하는 타입
 * - rest: 휴식방 (상태 회복, 아이템 정리)
 * - story: 스토리 (메인 게임 진행)
 */
export type ChapterType = 'rest' | 'story';

/**
 * 챕터 인터페이스
 * 여러 씬을 묶어서 관리하는 단위
 *
 * @example
 * {
 *   id: 'story_floor_1',
 *   name: '1층 스토리',
 *   type: 'story',
 *   floor: 1,
 *   next_chapter_id: 'rest_floor_2',
 *   scenes: [scene1, scene2, scene3]
 * }
 */
export interface Chapter {
  /** 챕터 고유 식별자 */
  id: string;
  /** 챕터 표시 이름 */
  name: string;
  /** 챕터 타입 */
  type: ChapterType;
  /** 챕터가 속한 층 */
  floor: number;
  /** 다음 챕터 ID (생략 시 게임 종료) */
  next_chapter_id?: string;
  /** 챕터에 포함된 씬 목록 */
  scenes: Scene[];
}

// 게임 액션 타입
export type GameAction =
  | { type: 'CHANGE_STAT'; stat: StatKey; value: number }
  | { type: 'CHANGE_RESOURCE'; resource: ResourceKey; value: number }
  | { type: 'ADD_BUFF'; buff: BuffKey }
  | { type: 'REMOVE_BUFF'; buff: BuffKey }
  | { type: 'SET_FLAG'; flag: FlagKey }
  | { type: 'UNSET_FLAG'; flag: FlagKey }
  | { type: 'ADD_ITEM'; item: Item }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'APPLY_EXPERIENCE'; effects: ExperienceEffects } // 통합 경험치 시스템용
  | { type: 'MANUAL_LEVEL_UP'; experienceTypes: string[] } // 수동 레벨업용
  | { type: 'SET_FLOOR'; floor: number }
  | { type: 'INCREMENT_DEATH_COUNT' }
  | { type: 'INCREMENT_FLOOR_DEATH_COUNT'; floor: number }
  | { type: 'ADD_COMPLETED_SCENE'; sceneId: string }
  | { type: 'RESET_CHAPTER_COMPLETED_SCENES' }
  | { type: 'RESET_AFTER_FAILURE' }
  | { type: 'LOAD_SCENE'; scene: Scene }
  | { type: 'RESTORE_SCENE'; scene: Scene } // 복원 시 씬 로드 (효과 적용 안함)
  | { type: 'SYNC_VISITED_SCENES_WITH_STORAGE' } // 방문 이력 동기화
  | { type: 'UPDATE_VISITED_SCENES'; visitedScenes: string[] } // 방문 이력 업데이트
  | { type: 'CLEAR_VISITED_SCENES'; clearStorage?: boolean } // 방문 이력 초기화
  | { type: 'LOAD_SAVED_PROGRESS'; savedProgress: Partial<GameState> }; // 저장된 게임 진행 상황 로드

export type SpecialEffects = SpecialEffectsType;

/**
 * 경험치 효과 타입
 * 간단한 객체 형태로 여러 경험치 타입에 동시에 경험치를 추가/감소할 수 있음
 *
 * @example
 * exp: {
 *   strength: 25,    // 힘 경험치 +25
 *   agility: 15,     // 민첩 경험치 +15
 *   level: -10       // 레벨 경험치 -10
 * }
 */
export type ExperienceEffects = { [key: string]: number };

/**
 * 변수 효과 인터페이스
 * 변수 조작 효과를 정의하는 구조
 *
 * @example
 * variables: [
 *   { id: "score", operator: "add", value: 10 },
 *   { id: "reputation", operator: "subtract", value: 5 },
 *   { id: "luck", operator: "multiply", value: 2.0 },
 *   { id: "sanity", operator: "set", value: 100 }
 * ]
 */
export interface VariableEffect {
  /** 조작할 변수 ID */
  id: string;

  /** 연산자 타입 */
  operator: 'add' | 'subtract' | 'set' | 'multiply';

  /** 효과 값 */
  value: number;
}

// ==========================================
// 🎯 게임 훅 반환 타입 정의 (타입 안전성 강화)
// ==========================================

/**
 * useGameStats 훅의 반환 타입
 * 능력치 관련 액션 함수들
 */
export interface UseGameStatsReturn {
  /** 능력치를 업데이트합니다 */
  updateStat: (stat: StatKey, value: number) => void;
  /** 능력치에 경험치를 추가합니다 */
  addExp: (stat: StatKey, value: number) => void;
}

/**
 * useGameInventory 훅의 반환 타입
 * 자원 및 아이템 관련 액션 함수들
 */
export interface UseGameInventoryReturn {
  /** 자원(체력, 정신력 등)을 업데이트합니다 */
  updateResource: (resource: ResourceKey, value: number) => void;
  /** 아이템을 인벤토리에 추가합니다 */
  addItem: (item: Item) => void;
  /** 아이템을 인벤토리에서 제거합니다 */
  removeItem: (itemId: string) => void;
}

/**
 * useGameLifecycle 훅의 반환 타입
 * 게임 생명주기 관련 액션 함수들
 */
export interface UseGameLifecycleReturn {
  /** 전체 사망 횟수를 증가시킵니다 */
  incrementGameDeathCount: () => void;
  /** 특정 층의 사망 횟수를 증가시킵니다 */
  incrementGameFloorDeathCount: (floor: number) => void;
  /** 실패 후 게임 상태를 초기화합니다 */
  resetGameAfterFailure: () => void;
  /** 씬을 로드하고 효과를 적용합니다 */
  loadGameScene: (scene: Scene) => void;
  /** 게임 세션을 시작합니다 */
  startGameSession: () => Promise<Scene | null>;
}

/**
 * useGameProgress 훅의 반환 타입 (통합)
 * 진행 상태의 읽기와 쓰기 기능을 모두 제공
 */
export interface UseGameProgressReturn {
  // === 읽기: 상태 정보 ===
  /** 게임이 시작 가능한 상태인지 여부 */
  canStartGame: boolean;
  /** 선택지를 선택할 수 있는 상태인지 여부 */
  canSelectChoice: boolean;
  /** 현재 씬에 선택지가 있는지 여부 */
  hasChoices: boolean;
  /** 게임이 일시정지 상태인지 여부 */
  isPaused: boolean;

  // === 읽기: 진행 정보 ===
  /** 현재 층 정보 */
  currentFloorInfo: {
    floor: number;
    deathCount: number;
    totalDeathCount: number;
  };
  /** 게임 통계 정보 */
  gameStats: {
    completedScenes: number;
    totalDeathCount: number;
    currentFloor: number;
    progressPercentage: number;
  };
  /** 전체 진행률 (0-100) */
  progressPercentage: number;
  /** 현재 층의 사망 횟수 */
  currentFloorDeathCount: number;

  // === 쓰기: 액션 함수들 ===
  /** 상태를 추가합니다 */
  addBuff: (buff: BuffKey) => void;
  /** 상태를 제거합니다 */
  removeBuff: (buff: BuffKey) => void;
  /** 플래그를 설정합니다 */
  updateFlag: (flag: FlagKey) => void;
  /** 플래그를 해제합니다 */
  removeFlag: (flag: FlagKey) => void;
  /** 현재 층을 설정합니다 */
  updateFloor: (floor: number) => void;
  /** 완료된 씬을 목록에 추가합니다 */
  addCompletedScene: (sceneId: string) => void;
}

// ==========================================
// 🎯 스토리 훅 반환 타입 정의 (타입 안전성 강화)
// ==========================================

/**
 * useStoryCore 훅의 반환 타입
 * 스토리 관련 모든 상태의 단일 진실의 원천
 */
export interface UseStoryCoreReturn {
  // ===== 게임 상태 (읽기 전용) =====
  /** 게임 상태 */
  state: GameState;
  /** 현재 씬 */
  currentScene: Scene | null;
  /** 엔진 준비 상태 */
  isEngineReady: boolean;
  /** 게임 오버 상태 */
  isGameOver: boolean;

  // ===== 계산된 상태 (단일 소스) =====
  /** 전체 로딩 상태 */
  isLoading: boolean;
  /** 에러 상태 */
  hasError: boolean;
  /** UI 준비 상태 */
  isUIReady: boolean;
  /** 초기화 중 */
  isInitializing: boolean;
  /** 게임 시작됨 */
  hasGameStarted: boolean;
  /** 초기화 에러 */
  initializationError: string | null;

  // ===== 상태 설정 함수 =====
  /** 초기화 상태 설정 */
  setIsInitializing: (value: boolean) => void;
  /** 초기화 에러 설정 */
  setInitializationError: (error: string | null) => void;

  // ===== 핵심 액션 =====
  /** 게임 시작 */
  startGame: () => Promise<Scene | null>;
  /** 선택지 선택 */
  selectChoice: (choiceIndex: number) => Promise<Scene | null>;
  /** 모든 상태 초기화 */
  clearAllState: () => void;

  // ===== 엔진 참조 =====
  /** 씬 엔진 인스턴스 */
  sceneEngine: any;
}

/**
 * useStoryLogic 훅의 반환 타입
 * 순수 비즈니스 로직 함수들
 */
export interface UseStoryLogicReturn {
  // 비즈니스 로직 함수들
  /** 게임 초기화 */
  initializeGame: () => Promise<Scene | null>;
  /** 선택지 처리 */
  handleChoice: (choiceIndex: number) => Promise<Scene | null>;
  /** 게임 재시작 */
  restartGame: () => Promise<Scene | null>;
}

/**
 * useStoryUI 훅의 반환 타입
 * UI 표시용 계산된 값들
 */
export interface UseStoryUIReturn {
  // 씬 표시 정보
  /** 가공된 씬 텍스트 */
  sceneText: string;
  /** 씬 표시 정보 */
  sceneInfo: {
    id: string;
    text: string;
    type: string;
  } | null;

  // 게임 상태 표시 정보
  /** 능력치 표시 정보 */
  statsInfo: {
    strength: number;
    agility: number;
    wisdom: number;
    charisma: number;
  };
  /** 자원 표시 정보 */
  resourcesInfo: {
    health: number;
    mind: number;
  };
  /** 진행 상태 정보 */
  progressInfo: {
    floor: number;
    deathCount: number;
    floorDeaths: number;
    currentFloor: number;
    totalDeaths: number;
    currentFloorDeaths: number;
    completedScenesCount: number;
  };

  // UI 표시 조건
  /** 표시 조건들 */
  displayConditions: {
    showLoading: boolean;
    showError: boolean;
    showContent: boolean;
    showHeader: boolean;
    showStats: boolean;
    showResources: boolean;
    showProgress: boolean;
    showChoices: boolean;
  };
  /** 표시 메시지 */
  displayMessage: string | null;

  // 상태 정보 (투명하게 전달)
  /** 로딩 상태 */
  isLoading: boolean;
  /** 에러 상태 */
  hasError: boolean;
  /** UI 준비 상태 */
  isUIReady: boolean;
}

/**
 * useSceneTransition 훅의 반환 타입
 * 씬 전환 및 애니메이션 관리
 */
export interface UseSceneTransitionReturn {
  // 전환 상태
  /** 전환 중 여부 */
  isTransitioning: boolean;
  /** 현재 전환 상태 */
  transitionState: TransitionState;

  // 전환 함수들
  /** 선택지 클릭 처리 */
  handleChoicePress: (choiceIndex: number) => Promise<void>;
  /** 전환 상태 리셋 */
  resetTransition: () => void;

  // 디버깅 및 모니터링
  /** 전환 정보 조회 */
  getTransitionInfo: () => {
    state: TransitionState;
    isTransitioning: boolean;
    lastError: TransitionErrorInfo | null;
  };
  /** 마지막 에러 정보 */
  lastError: TransitionErrorInfo | null;
}

// ==========================================
// 🎯 애니메이션 훅 반환 타입 정의
// ==========================================

/**
 * useAnimation 훅의 반환 타입
 * 통합 애니메이션 관리
 */
export interface UseAnimationReturn {
  /** 애니메이션 값 */
  animatedValue: any; // Animated.Value - any로 임시 처리
  /** 애니메이션 시작 함수 */
  startAnimation: (callback?: () => void) => void;
  /** 애니메이션 정지 함수 */
  stopAnimation: () => void;
  /** 애니메이션 리셋 함수 */
  resetAnimation: () => void;
  /** 페이드 전용 - 특정 값으로 애니메이션 */
  animateTo?: (toValue: number, callback?: () => void) => void;
}

// ==========================================
// 🎯 UI 훅 반환 타입 정의
// ==========================================

/**
 * useSafeArea 훅의 반환 타입
 * 디바이스 안전 영역 정보
 */
export interface UseSafeAreaReturn {
  /** 상단 안전 영역 */
  top: number;
  /** 하단 안전 영역 */
  bottom: number;
  /** 좌측 안전 영역 */
  left: number;
  /** 우측 안전 영역 */
  right: number;
}

/**
 * useGameState 훅의 반환 타입
 * 게임 상태 Context 접근
 */
export interface UseGameStateReturn {
  /** 게임 상태 */
  state: GameState;
  /** 액션 디스패처 */
  dispatch: React.Dispatch<GameAction>;
  /** 씬 로드 함수 */
  loadScene: (scene: Scene) => void;
  /** 실패 후 리셋 함수 */
  resetAfterFailure: () => void;
  /** 씬 엔진 인스턴스 */
  sceneEngine: any; // SceneEngine 타입 - any로 임시 처리
  /** 현재 씬 */
  currentScene: Scene | null;
  /** 엔진 준비 상태 */
  isEngineReady: boolean;
  /** 게임 오버 상태 */
  isGameOver: boolean;
  /** 게임 시작 함수 */
  startGame: () => Promise<Scene | null>;
  /** 선택지 선택 함수 */
  selectChoice: (choiceIndex: number) => Promise<Scene | null>;
  /** 챕터 실행 함수 */
  executeChapter: (chapterId: string) => Promise<Scene | null>;
}
