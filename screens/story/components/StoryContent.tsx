import { forwardRef, memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import RevealTextWrapper, {
  RevealTextWrapperRef,
} from '../../../components/animations/RevealTextWrapper';
import { COLORS, FONT_SIZES, SPACING } from '../../../constants/theme';
import { GameState, Scene } from '../../../types';

import { GameStateComparator } from '../../../utils/gameStateComparator';
import { getSceneText } from '../../../utils/scene';

interface StoryContentProps {
  scene: Scene;
  state: GameState;
  /** 씬 텍스트 완료 시 콜백 함수 */
  onSceneComplete?: () => void;
  /** 즉시 전체 표시 여부 - 텍스트 이력에 사용 */
  instantDisplay?: boolean;
  /** 이력 렌더에서 사용할 사전 해석된 텍스트 (존재 시 우선 사용) */
  resolvedText?: string;
  /** instantDisplay일 때도 완료 콜백 트리거 여부 */
  triggerCompleteWhenInstant?: boolean;
}

/**
 * 스토리 화면의 씬 텍스트 영역을 렌더링하는 컴포넌트입니다.
 * 현재 씬의 텍스트를 표시하며, Reveal 애니메이션과 텍스트 효과를 지원합니다.
 * @param scene - 현재 씬
 * @param state - 현재 게임 상태
 * @param onSceneComplete - 씬 텍스트 완료 시 호출될 콜백 함수
 * @param instantDisplay - 즉시 전체 표시 여부
 */
const StoryContent = memo(
  forwardRef<RevealTextWrapperRef, StoryContentProps>(
    (
      {
        scene,
        state,
        onSceneComplete,
        instantDisplay = false,
        resolvedText,
        triggerCompleteWhenInstant = false,
      },
      ref
    ) => {
      // 씬 텍스트에 변화 내용을 추가 (스냅샷 텍스트가 있으면 우선 사용)
      const enhancedSceneText = useMemo(() => {
        if (resolvedText != null) return resolvedText;

        const baseText = getSceneText(scene, state);

        if (scene.effects) {
          const changesText = GameStateComparator.formatChangesAsText(
            scene.effects,
            state
          );
          return baseText + changesText;
        }

        return baseText;
      }, [scene, state, resolvedText]);

      return (
        <RevealTextWrapper
          ref={ref}
          text={enhancedSceneText}
          textStyle={styles.storyText}
          enableAnimations={!instantDisplay} // 즉시 표시 모드면 애니메이션 비활성화
          onComplete={onSceneComplete}
          enableTouchComplete={!instantDisplay} // 즉시 표시 모드면 터치 완성 비활성화
          instantDisplay={instantDisplay}
          triggerCompleteWhenInstant={triggerCompleteWhenInstant}
        />
      );
    }
  ),
  // props 비교 함수 - 실제로 변경된 경우에만 재렌더링
  (prevProps, nextProps) => {
    // 씬 ID 비교
    if (prevProps.scene.id !== nextProps.scene.id) return false;

    // instantDisplay가 달라지면 재렌더링
    if (prevProps.instantDisplay !== nextProps.instantDisplay) return false;

    // 씬 효과가 변경되었는지 확인 (깊은 비교)
    const prevEffects = JSON.stringify(prevProps.scene.effects ?? {});
    const nextEffects = JSON.stringify(nextProps.scene.effects ?? {});
    if (prevEffects !== nextEffects) return false;

    // 베이스 텍스트가 변경되었는지 확인 (state 의존)
    const prevBaseText = getSceneText(prevProps.scene, prevProps.state);
    const nextBaseText = getSceneText(nextProps.scene, nextProps.state);
    if (prevBaseText !== nextBaseText) return false;

    // instantDisplay=false일 때만 콜백 참조 변경 고려
    if (!nextProps.instantDisplay) {
      if (prevProps.onSceneComplete !== nextProps.onSceneComplete) return false;
    }

    return true; // 재렌더링 불필요
  }
);

StoryContent.displayName = 'StoryContent';

export default StoryContent;

const styles = StyleSheet.create({
  storyText: {
    color: COLORS.text,
    textAlign: 'left',
    marginBottom: SPACING.md,
    ...FONT_SIZES.body,
  },
});
