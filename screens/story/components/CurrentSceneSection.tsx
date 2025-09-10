import { View } from 'react-native';
import type { GameState, Scene } from '../../../types';
import StoryChoices from './StoryChoices';
import StoryContent from './StoryContent';

interface CurrentSceneSectionProps {
  scene: Scene | null;
  state: GameState;
  hasChoices: boolean;
  showChoices: boolean;
  viewportHeight: number;
  onSceneComplete: () => void;
  onChoicePress: (index: number) => void;
  onLayoutReady: () => void;
  storyContentRef: any;
  isTransitioning: boolean;
}

/**
 * 현재 씬과 선택지를 표시하는 섹션. 레이아웃 완료 시 부모에 신호 전달.
 */
export default function CurrentSceneSection({
  scene,
  state,
  hasChoices,
  showChoices,
  viewportHeight,
  onSceneComplete,
  onChoicePress,
  onLayoutReady,
  storyContentRef,
  isTransitioning,
}: CurrentSceneSectionProps) {
  return (
    <View style={{ minHeight: viewportHeight }} onLayout={onLayoutReady}>
      {scene ? (
        <StoryContent
          ref={storyContentRef}
          key={scene.id}
          scene={scene}
          state={state}
          onSceneComplete={onSceneComplete}
        />
      ) : null}

      {hasChoices && (
        <StoryChoices
          visible={showChoices && !isTransitioning}
          choices={showChoices ? (scene?.choices ?? []) : []}
          gameState={state}
          onChoicePress={onChoicePress}
          disabled={isTransitioning}
        />
      )}
    </View>
  );
}
