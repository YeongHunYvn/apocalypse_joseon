import * as Haptics from 'expo-haptics';
import { memo, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { COLORS, SPACING } from '../../../constants/theme';
import { useFooterData } from '../../../hooks/story/ui/useFooterData';
import { useFooterExpansion } from '../../../hooks/story/ui/useFooterExpansion';
import { useHaptics } from '../../../hooks/ui/useHaptics';
import { GameState, Scene } from '../../../types';
import FooterGridPanel from './FooterGridPanel';
import StoryFooterSections, { FooterSectionId } from './StoryFooterSections';

interface StoryFooterProps {
  /** 현재 게임 상태 */
  state: GameState;
  /** 현재 씬 ID */
  currentSceneId?: string;
  /** 현재 씬 정보 */
  currentScene?: Scene | null;
  /** 하단 안전 영역 인셋 */
  bottomInset?: number;
}

type ActivePanel = FooterSectionId | null;

function StoryFooter({ bottomInset = 0, state }: StoryFooterProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // 확장 애니메이션 훅
  const { expandedStyle, expand, collapse } = useFooterExpansion();

  // 햅틱 훅 (간단 선택 피드백)
  const { impact } = useHaptics();

  // 데이터 매핑 훅
  const { buffItems, itemItems, skillItems } = useFooterData(state);

  // 공통 패널 정의 및 선택
  const PANEL_DEFS = useMemo(
    () => [
      {
        id: 'items' as const,
        title: '아이템',
        data: itemItems,
        emptyText: '보유한 아이템이 없습니다',
      },
      {
        id: 'skills' as const,
        title: '스킬',
        data: skillItems,
        emptyText: '보유한 스킬이 없습니다',
      },
      {
        id: 'buffs' as const,
        title: '상태',
        data: buffItems,
        emptyText: '표시할 상태가 없습니다',
      },
    ],
    [itemItems, skillItems, buffItems]
  );

  const currentPanel = useMemo(() => {
    if (!PANEL_DEFS.length || !activePanel) return null;
    return PANEL_DEFS.find(p => p.id === activePanel) || null;
  }, [PANEL_DEFS, activePanel]);

  const handleSectionPressIn = (panel: ActivePanel) => {
    // 패널이 실제로 바뀔 때만 매우 약한 임팩트 햅틱
    if (panel !== activePanel) {
      impact(Haptics.ImpactFeedbackStyle.Light);
    }
    setActivePanel(panel);
    expand();
  };

  const handleSectionPressOut = () => {
    setActivePanel(null);
    collapse();
  };

  return (
    <View style={[styles.footerContainer, { paddingBottom: bottomInset }]}>
      {/* 위로 펼쳐질 확장 영역: 3xN 그리드 (패널 데이터에 따라 변경) */}
      <Animated.View style={[styles.expandedArea, expandedStyle]}>
        <View style={styles.expandedInner}>
          {currentPanel ? (
            <FooterGridPanel
              data={currentPanel.data}
              emptyText={currentPanel.emptyText}
            />
          ) : null}
        </View>
      </Animated.View>

      {/* 하단 고정 3분할 영역 */}
      <StoryFooterSections
        sections={PANEL_DEFS.map(p => ({ id: p.id, title: p.title }))}
        active={activePanel}
        onPressIn={handleSectionPressIn}
        onPressOut={handleSectionPressOut}
      />
    </View>
  );
}

export default memo(
  StoryFooter,
  (prevProps: StoryFooterProps, nextProps: StoryFooterProps) => {
    return (
      prevProps.currentSceneId === nextProps.currentSceneId &&
      prevProps.state === nextProps.state &&
      prevProps.bottomInset === nextProps.bottomInset
    );
  }
);

const styles = StyleSheet.create({
  footerContainer: {
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    // iOS 상단 섀도우
    shadowColor: COLORS.gradientLight,
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.15,
    shadowRadius: Platform.OS === 'ios' ? 12 : 8,
    shadowOffset: { width: 0, height: Platform.OS === 'ios' ? -2 : -1 },
    elevation: 6,
    zIndex: 10,
    borderTopRightRadius: SPACING.lg,
    borderTopLeftRadius: SPACING.lg,
  },
  expandedArea: {
    overflow: 'hidden',
    borderTopLeftRadius: SPACING.lg,
    borderTopRightRadius: SPACING.lg,
  },
  expandedInner: {
    flex: 1,
    borderTopLeftRadius: SPACING.lg,
    borderTopRightRadius: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  // 섹션 스타일은 StoryFooterSections로 이동
});
