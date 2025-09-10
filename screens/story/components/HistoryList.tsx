import { View } from 'react-native';
import type { HistoryEntry } from '../../../hooks/story/useSceneHistory';
import type { GameState, Scene } from '../../../types';
import StoryContent from './StoryContent';

interface HistoryListProps {
  items: HistoryEntry[];
  onItemLayout: (id: string, height: number) => void;
  state: GameState;
  currentScene: Scene | null;
}

/**
 * 히스토리 항목 목록 렌더러: 각 항목의 높이를 측정하여 부모 훅에 보고
 */
export default function HistoryList({
  items,
  onItemLayout,
  state,
  currentScene,
}: HistoryListProps) {
  return (
    <>
      {items.map(h => (
        <View
          key={h.id}
          onLayout={e => onItemLayout(h.id, e.nativeEvent.layout.height)}
        >
          <StoryContent
            scene={currentScene!}
            state={state}
            instantDisplay
            triggerCompleteWhenInstant
            resolvedText={h.resolvedText}
          />
          {h.chosenText ? (
            <View style={{ marginTop: 4 }}>
              <StoryContent
                scene={currentScene!}
                state={state}
                instantDisplay
                triggerCompleteWhenInstant
                resolvedText={`» ${h.chosenText}`}
              />
            </View>
          ) : null}
        </View>
      ))}
    </>
  );
}
