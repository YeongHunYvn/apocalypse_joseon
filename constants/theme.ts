import { RESOURCE_COLORS, STAT_COLORS } from './gameConfig';

// 색상 정의
export const COLORS = {
  // 기본 색상
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  error: '#FF3B30', // danger와 동일
  white: '#FFFFFF',
  black: '#000000',

  // 직관적인 색상 (기본 색상과 매핑)
  red: '#FF3B30', // danger와 동일
  blue: '#007AFF', // primary와 동일
  green: '#34C759', // success와 동일
  yellow: '#FF9500', // warning과 동일

  // 배경 색상
  background: '#10111A', // 어두운 하단 색상
  gradientLight: '#313966', // 밝은 상단 색상
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // 텍스트 색상
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  // 테두리 색상
  border: '#C6C6C8',
  separator: '#C6C6C8',

  // 능력치 색상 (gameConfig.ts에서 참조)
  strength: STAT_COLORS.strength,
  agility: STAT_COLORS.agility,
  wisdom: STAT_COLORS.wisdom,
  charisma: STAT_COLORS.charisma,

  // 자원 색상 (gameConfig.ts에서 참조)
  health: RESOURCE_COLORS.health,
  mind: RESOURCE_COLORS.mind,
  gold: RESOURCE_COLORS.gold,

  // GameState 변화 표시 색상
  stateChange: {
    positive: '#34C759', // 증가/획득 - 초록색
    negative: '#FF3B30', // 감소/상실 - 빨간색
    neutral: '#8E8E93', // 중립/정보 - 회색
  },
} as const;

// 여백 정의
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// 폰트 패밀리 정의 (fonts/index.ts와 일관성 유지)
export const FONT_FAMILY = {
  primary: 'MaruBuri-Regular',
  extraLight: 'MaruBuri-ExtraLight',
  light: 'MaruBuri-Light',
  regular: 'MaruBuri-Regular',
  semiBold: 'MaruBuri-SemiBold',
  bold: 'MaruBuri-Bold',
} as const;

// 폰트 크기 및 행간 정의 (한글에 최적화된 lineHeight 적용)
export const FONT_SIZES = {
  xs: { fontSize: 12, lineHeight: 18 }, // 1.5배
  sm: { fontSize: 14, lineHeight: 20 }, // 1.43배
  body: { fontSize: 16, lineHeight: 24 }, // 1.5배
  title: { fontSize: 18, lineHeight: 26 }, // 1.44배
  large: { fontSize: 20, lineHeight: 28 }, // 1.4배
  xl: { fontSize: 24, lineHeight: 34 }, // 1.42배
  xxl: { fontSize: 28, lineHeight: 40 }, // 1.43배

  text: { fontSize: 15, lineHeight: 27 },
} as const;

// 폰트 굵기 정의 (MaruBuri 폰트와 매핑)
export const FONT_WEIGHTS = {
  extraLight: '200',
  light: '300',
  regular: '400',
  semibold: '600',
  bold: '700',
} as const;

// 폰트 스타일 정의 (폰트 패밀리와 가중치 조합)
export const FONT_STYLES = {
  extraLight: {
    fontFamily: FONT_FAMILY.extraLight,
  },
  light: {
    fontFamily: FONT_FAMILY.light,
  },
  regular: {
    fontWeight: FONT_WEIGHTS.regular,
    fontFamily: FONT_FAMILY.regular,
  },
  semiBold: {
    fontFamily: FONT_FAMILY.semiBold,
  },
  bold: {
    fontFamily: FONT_FAMILY.bold,
  },
} as const;

// 테두리 반경 정의
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
} as const;

// 그림자 정의
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;
