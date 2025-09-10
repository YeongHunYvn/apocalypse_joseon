import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { RevealTextWrapperRef } from '../components/animations/RevealTextWrapper';
import { useSafeArea, useStoryCore } from '../hooks';
import { GameStateComparator } from '../utils/gameStateComparator';
import { getSceneText } from '../utils/scene';
import {
  CurrentSceneSection,
  HistoryList,
  StoryError,
  StoryFooter,
  StoryHeader,
  StoryLoading,
  StoryScrollView,
} from './story/components';
import type { StoryScrollViewRef } from './story/components/StoryScrollView';

import BackgroundEffectHost from '../components/background/BackgroundEffectHost';
import RadialBackground from '../components/background/RadialBackground';
import DebugInfoDisplay from '../components/DebugInfoDisplay';
import { DEBUG_CONFIG } from '../constants/debug';

import { useAnchorScroll } from '../hooks/story/useAnchorScroll';
import { useAvailableChoices } from '../hooks/story/useAvailableChoices';
import { useRevealBackupTimer } from '../hooks/story/useRevealBackupTimer';
import { useSceneHistory } from '../hooks/story/useSceneHistory';
import { useSceneTransition } from '../hooks/story/useSceneTransition';

interface _StoryScreenProps {}

/**
 * 스토리 화면의 메인 컴포넌트입니다.
 * 씬 로딩 → 텍스트 표시 → 선택지 표시의 기본 흐름만 담당합니다.
 */
export default function StoryScreen() {
  const { top, bottom } = useSafeArea();

  // ===== 핵심 훅들 =====
  const storyCore = useStoryCore();
  const { state, currentScene, isLoading, hasError, isUIReady } = storyCore;

  const { choices: availableChoices } = useAvailableChoices(
    currentScene,
    state
  );
  const {
    isTransitioning: isTransitioningLocal,
    lastError,
    handleChoicePress,
    resetTransition,
  } = useSceneTransition();

  // ===== 선택지 표시 상태 =====
  const [showChoices, setShowChoices] = useState(false);
  const [lastSceneId, setLastSceneId] = useState<string | null>(null);
  const storyContentRef = useRef<RevealTextWrapperRef>(null);
  const scrollRef = useRef<StoryScrollViewRef>(null);

  const hasChoices = Boolean(currentScene?.choices?.length);

  // ===== 레이아웃/뷰포트 =====
  const viewportHeight = Dimensions.get('window').height;

  // ===== 씬 이력 훅 =====
  const {
    history,
    setPendingSnapshot,
    appendChoiceToPending,
    onItemLayoutMeasure,
  } = useSceneHistory(currentScene ?? null, viewportHeight);

  // ===== 앵커 스크롤 훅 =====
  const { setAnchorY, markCurrentSceneReady, scheduleAnchorScroll } =
    useAnchorScroll(currentScene ?? null, (y, animated) => {
      scrollRef.current?.scrollTo({ y, animated });
    });

  // 씬 변경 시 선택지 숨기기 및 앵커 스크롤 예약
  useEffect(() => {
    if (currentScene && currentScene.id !== lastSceneId) {
      setShowChoices(false);
      setLastSceneId(currentScene.id);
      scheduleAnchorScroll();
    }
  }, [currentScene, lastSceneId, scheduleAnchorScroll]);

  // 지능적인 백업 타이머 훅 적용
  useRevealBackupTimer({
    currentSceneExists: Boolean(currentScene),
    hasChoices,
    showChoices,
    isAnimating: () => storyContentRef.current?.isAnimating(),
    onForceShowChoices: () => setShowChoices(true),
  });

  /**
   * 씬 텍스트 완료 시 선택지 표시
   */
  const handleSceneComplete = useCallback(() => {
    // 현재 씬의 최종 텍스트 스냅샷을 보류 상태로 저장(전환 시 히스토리에 추가)
    if (currentScene) {
      const baseText = getSceneText(currentScene, state);
      const changesText = currentScene.effects
        ? GameStateComparator.formatChangesAsText(currentScene.effects, state)
        : '';
      const resolvedText = baseText + changesText;
      setPendingSnapshot({ sceneId: currentScene.id, resolvedText });
    }
    setShowChoices(true);
  }, [currentScene, state]);

  /**
   * 화면 터치로 텍스트 애니메이션 즉시 완성
   */
  const handleScreenTouch = useCallback(() => {
    // 애니메이션이 진행 중이고 선택지가 아직 표시되지 않았을 때만 작동
    if (
      storyContentRef.current?.isAnimating() &&
      !showChoices &&
      !isTransitioningLocal
    ) {
      storyContentRef.current?.complete();
    }
  }, [showChoices, isTransitioningLocal]);

  /**
   * 선택지 클릭 시 선택지 숨기기 후 처리
   */
  const handleChoicePressWithCallbacks = useCallback(
    async (choiceIndex: number) => {
      setShowChoices(false);
      const choice = availableChoices[choiceIndex];
      if (choice) {
        appendChoiceToPending(choice.text);
      }
      await handleChoicePress(choiceIndex);
    },
    [handleChoicePress, availableChoices, appendChoiceToPending]
  );

  /**
   * 에러 재시도 처리
   */
  const handleErrorRetry = useCallback(() => {
    resetTransition();
  }, [resetTransition]);

  // 앵커 스크롤은 useAnchorScroll 훅에서 처리됨

  // 로딩 상태
  if (isLoading) {
    return <StoryLoading message='로딩 중...' />;
  }

  // 에러 상태
  if (hasError || lastError) {
    const errorMessage = lastError
      ? `오류가 발생했습니다.\n\n${lastError.message}`
      : '게임을 로드할 수 없습니다.';

    return <StoryError onRetry={handleErrorRetry} message={errorMessage} />;
  }

  // UI가 준비되지 않은 경우
  if (!isUIReady) {
    return <StoryLoading message='게임을 준비하는 중...' />;
  }

  return (
    <View style={styles.container}>
      {/* 배경 그라데이션 */}
      <RadialBackground />

      {/* 배경 효과 호스트 */}
      <BackgroundEffectHost scene={currentScene} gameState={state}>
        {/* 메인 콘텐츠 */}
        <View style={{ flex: 1, paddingTop: top }}>
          {/* 헤더 영역 */}
          <StoryHeader state={state} />

          {/* 콘텐츠 영역 */}
          <View style={styles.contentContainer}>
            <StoryScrollView ref={scrollRef} onScreenTouch={handleScreenTouch}>
              {/* 이력 렌더 */}
              <HistoryList
                items={history}
                onItemLayout={onItemLayoutMeasure}
                state={state}
                currentScene={currentScene || null}
              />

              {/* 구분선 */}
              <View style={{ height: 12 }} />

              {/* 앵커 마커 */}
              <View onLayout={e => setAnchorY(e.nativeEvent.layout.y)} />

              {/* 현재 씬 섹션 */}
              <CurrentSceneSection
                scene={currentScene || null}
                state={state}
                hasChoices={hasChoices}
                showChoices={showChoices}
                viewportHeight={viewportHeight}
                onSceneComplete={handleSceneComplete}
                onChoicePress={handleChoicePressWithCallbacks}
                onLayoutReady={markCurrentSceneReady}
                storyContentRef={storyContentRef}
                isTransitioning={isTransitioningLocal}
              />
            </StoryScrollView>
          </View>

          {/* 푸터 영역 */}
          <StoryFooter
            state={state}
            currentSceneId={currentScene?.id}
            currentScene={currentScene || undefined}
            bottomInset={bottom}
          />
        </View>
      </BackgroundEffectHost>

      {/* 디버그 패널 */}
      {(DEBUG_CONFIG.showDebugPanel || __DEV__) && (
        <View
          style={{
            position: 'absolute',
            right: 15,
            bottom: bottom + 55,
          }}
        >
          <DebugInfoDisplay
            state={state}
            currentSceneId={currentScene?.id}
            currentScene={currentScene}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
