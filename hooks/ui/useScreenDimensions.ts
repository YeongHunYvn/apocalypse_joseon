import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenDimensions {
  /** 화면 너비 */
  width: number;
  /** 화면 높이 */
  height: number;
  /** 안전 영역을 제외한 사용 가능한 높이 */
  availableHeight: number;
  /** 화면 방향 */
  isLandscape: boolean;
}

/**
 * 화면 크기와 안전 영역을 고려한 실제 사용 가능한 높이를 제공하는 훅
 * @returns 화면 크기 정보
 */
export function useScreenDimensions(): ScreenDimensions {
  const insets = useSafeAreaInsets();
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => {
    const { width, height } = Dimensions.get('window');
    return {
      width,
      height,
      availableHeight: height - insets.top - insets.bottom,
      isLandscape: width > height,
    };
  });

  useEffect(() => {
    /**
     * 화면 크기 변경 이벤트 핸들러
     */
    const handleDimensionsChange = ({ window }: { window: ScaledSize }) => {
      const { width, height } = window;
      setDimensions({
        width,
        height,
        availableHeight: height - insets.top - insets.bottom,
        isLandscape: width > height,
      });
    };

    // 이벤트 리스너 등록
    const subscription = Dimensions.addEventListener(
      'change',
      handleDimensionsChange
    );

    // 초기값 업데이트 (insets가 변경될 수 있음)
    const { width, height } = Dimensions.get('window');
    setDimensions({
      width,
      height,
      availableHeight: height - insets.top - insets.bottom,
      isLandscape: width > height,
    });

    // 클린업
    return () => {
      subscription?.remove();
    };
  }, [insets.top, insets.bottom]);

  return dimensions;
}
