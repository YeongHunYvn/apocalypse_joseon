import { memo, useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Choice, GameState } from '../../../types';
import GlowDivider from './GlowDivider';

import { SPACING } from '@/constants/theme';
import { StyleSheet } from 'react-native';
import ChoiceButton from '../../../components/ChoiceButton';
import { CHOICE_ANIMATION_CONFIG } from '../../../constants/animationConfig';

interface StoryChoicesProps {
  choices: Choice[];
  gameState: GameState;
  onChoicePress: (choiceIndex: number) => void;
  disabled?: boolean;
  visible?: boolean;
}

/**
 * 스토리 화면의 선택지 영역을 렌더링하는 컴포넌트입니다.
 * 사용 가능한 선택지들을 표시합니다.
 * @param choices - 사용 가능한 선택지 배열
 * @param gameState - 현재 게임 상태
 * @param onChoicePress - 선택지 클릭 핸들러
 * @param disabled - 선택지 비활성화 여부
 * @param visible - 선택지 표시 여부
 */
const StoryChoices = memo(
  ({
    choices,
    gameState,
    onChoicePress,
    disabled = false,
    visible = true,
  }: StoryChoicesProps) => {
    const opacity = useSharedValue(visible ? 1 : 0);

    useEffect(() => {
      if (visible) {
        opacity.value = withTiming(1, {
          duration: CHOICE_ANIMATION_CONFIG.DEFAULT_FADE_DURATION,
          easing: Easing.out(Easing.ease),
        });
      } else {
        // 즉시 사라지도록 애니메이션 없이 값 설정
        opacity.value = 0;
      }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: opacity.value,
      };
    });

    return (
      <Animated.View
        style={[styles.choicesContainer, animatedStyle]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <GlowDivider height={SPACING.xs} />
        {choices.map((choice, index) => (
          <ChoiceButton
            key={index}
            choice={choice}
            gameState={gameState}
            onPress={() => onChoicePress(index)}
            disabled={disabled}
          />
        ))}
      </Animated.View>
    );
  }
);
export default StoryChoices;

const styles = StyleSheet.create({
  choicesContainer: {
    paddingTop: SPACING.md,
  },
});
