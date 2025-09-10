import { Image } from 'expo-image';
import { ImageStyle, StyleProp } from 'react-native';
import { ICON_REGISTRY, IconKey } from '../../constants/iconRegistry';
import { Logger } from '../../utils/system/Logger';

interface IconProps {
  /** 아이콘 키 */
  name: IconKey;
  /** 아이콘 크기 (기본값: 24) */
  size?: number;
  /** 아이콘 색상 (미지정시 기본 색상 사용) */
  color?: string;
  /** 추가 스타일 */
  style?: StyleProp<ImageStyle>;
}

/**
 * 통합 아이콘 컴포넌트입니다.
 * 아이콘 레지스트리에서 키로 아이콘을 선택하고, 실제 SVG 파일을 사용하며 기본 색상이 자동으로 적용됩니다.
 *
 * @param name - 아이콘 키 (iconRegistry에서 정의된 키)
 * @param size - 아이콘 크기 (기본값: 24)
 * @param color - 아이콘 색상 (미지정시 해당 아이콘의 기본 색상 사용)
 * @param style - 추가 스타일
 *
 * @example
 * // 기본 색상으로 체력 아이콘 표시
 * <Icon name="health" size={32} />
 *
 * // 커스텀 색상으로 골드 아이콘 표시
 * <Icon name="gold" size={24} color="#FFD700" />
 */
export function Icon({ name, size = 24, color, style, ...props }: IconProps) {
  const iconConfig = ICON_REGISTRY[name];

  if (!iconConfig) {
    Logger.warn('[Icon]', `Icon "${name}" not found in registry`);
    return null;
  }

  // 이미지(WebP 등) 아이콘 렌더링: 색상 칠하기 미적용, 원본 사용
  if (iconConfig.type === 'image') {
    return (
      <Image
        source={iconConfig.source}
        style={[{ width: size, height: size }, style]}
      />
    );
  }

  // SVG 아이콘 렌더링: 기본/커스텀 색상 적용
  const SvgComponent = iconConfig.component;
  const finalColor = color || iconConfig.defaultColor;

  return (
    <SvgComponent
      width={size}
      height={size}
      fill={finalColor}
      color={finalColor}
      style={style}
      {...props}
    />
  );
}
