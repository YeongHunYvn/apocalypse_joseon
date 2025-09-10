import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  EXPERIENCE_CONFIGS,
  EXPERIENCE_TYPE_KEYS,
} from '../constants/experienceConfig';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SPACING,
} from '../constants/theme';
import { GameState, Scene } from '../types';
import { Logger } from '../utils/system/Logger';

import { memo, useContext, useState } from 'react';
import { STATS } from '../constants/gameConfig';
import { GameStateContext } from '../contexts/GameStateContext';
import { validateGameProgress } from '../utils/gameProgressUtils';
import { useBackgroundEffectContinuity } from '../utils/scene/effects/BackgroundEffectContinuityManager';
import { BackgroundEffectManager } from '../utils/scene/effects/BackgroundEffectManager';
import { GameStateEffectMonitor } from '../utils/scene/effects/GameStateEffectMonitor';
import { VisitedScenesManager } from '../utils/scene/VisitedScenesManager';
import { hardResetAndRestart } from '../utils/system/ResetManager';
import { Icon } from './icons/Icon';

interface DebugInfoDisplayProps {
  state: GameState;
  currentSceneId?: string;
  currentScene?: Scene | null;
}

/**
 * 디버깅용 상세 정보를 표시하는 컴포넌트입니다.
 * 게임 상태 검증, 조건 확인, 배경 효과 연속성, 상태 기반 효과에 필요한 모든 정보를 한 눈에 보여줍니다.
 * 성능 최적화: React.memo로 주요 변경 시에만 리렌더링 (디버깅용)
 * @param state - 현재 게임 상태
 * @param currentSceneId - 현재 씬 ID (선택사항)
 * @param currentScene - 현재 씬 데이터 (선택사항)
 */
function DebugInfoDisplay({
  state,
  currentSceneId,
  currentScene,
}: DebugInfoDisplayProps) {
  // 기본값: 닫힌 상태로 시작 (개발 모드/설정과 무관)
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const validation = validateGameProgress(state);
  const { continuityInfo } = useBackgroundEffectContinuity();
  const gameStateMonitor = GameStateEffectMonitor.getInstance();
  const [activeTab, setActiveTab] = useState<'scene' | 'user'>('scene');
  const gameCtx = useContext(GameStateContext);

  /**
   * 전체 초기화: 모든 저장소 삭제 후 게임 상태 초기화 및 재시작
   */
  const handleHardReset = async () => {
    try {
      if (!gameCtx) return;
      await hardResetAndRestart({
        dispatch: gameCtx.dispatch,
        executeChapter: gameCtx.executeChapter,
      });
      setShowPanel(false);
    } catch (e) {
      Logger.warn('[DebugInfoDisplay]', '전체 초기화 중 오류:', e);
    }
  };

  // 배경 효과 디버그 정보 생성
  const backgroundEffectDebugInfo = currentScene
    ? BackgroundEffectManager.getDebugInfo(currentScene)
    : '씬 없음';

  // 통합 배경 효과 디버그 정보 생성
  const unifiedEffectDebugInfo = currentScene
    ? BackgroundEffectManager.getUnifiedDebugInfo(currentScene, state)
    : '씬 또는 상태 없음';

  // 상태 기반 효과 디버그 정보 생성
  const _gameStateEffectDebugInfo = gameStateMonitor.getDebugInfo();

  return (
    <View style={{ alignItems: 'flex-end' }}>
      {showPanel && (
        <View style={[styles.debugContainer, { marginBottom: 8 }]}>
          <Text style={styles.debugTitle}>🔍 디버깅 정보</Text>

          {/* 탭 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('scene')}
              style={[
                styles.tabButton,
                activeTab === 'scene' && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'scene' && styles.tabTextActive,
                ]}
              >
                씬
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('user')}
              style={[
                styles.tabButton,
                activeTab === 'user' && styles.tabButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'user' && styles.tabTextActive,
                ]}
              >
                유저
              </Text>
            </TouchableOpacity>
          </View>

          {/* 씬 탭: 상단에 전체 초기화 버튼 */}
          {activeTab === 'scene' && (
            <View style={{ marginBottom: SPACING.sm }}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleHardReset}
              >
                <Text style={styles.resetButtonText}>전체 초기화</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView
            style={styles.debugContent}
            showsVerticalScrollIndicator={true}
          >
            {activeTab === 'scene' && (
              <>
                {currentSceneId && (
                  <View style={styles.debugSection}>
                    <Text style={styles.sectionTitle}>현재 씬</Text>
                    <Text style={styles.sectionValue}>{currentSceneId}</Text>
                  </View>
                )}

                <View style={styles.debugSection}>
                  <Text style={styles.sectionTitle}>씬 기반 배경 효과</Text>
                  <Text style={styles.sectionValue}>
                    {backgroundEffectDebugInfo}
                  </Text>
                </View>

                <View style={styles.debugSection}>
                  <Text style={styles.sectionTitle}>통합 배경 효과</Text>
                  <Text style={styles.sectionValue}>
                    {unifiedEffectDebugInfo}
                  </Text>
                </View>

                {continuityInfo.currentEffect.isActive && (
                  <View style={styles.debugSection}>
                    <Text style={styles.sectionTitle}>효과 연속성</Text>
                    <View style={styles.effectGrid}>
                      <View style={styles.effectItem}>
                        <Text style={styles.effectLabel}>연속성</Text>
                        <Text
                          style={[
                            styles.effectValue,
                            {
                              color: continuityInfo.continuityState.isContinuous
                                ? COLORS.success
                                : COLORS.warning,
                            },
                          ]}
                        >
                          {continuityInfo.continuityState.isContinuous
                            ? '유지됨'
                            : '새 시작'}
                        </Text>
                      </View>
                      <View style={styles.effectItem}>
                        <Text style={styles.effectLabel}>지속 시간</Text>
                        <Text style={styles.effectValue}>
                          {Math.round(
                            (continuityInfo.continuityState.totalDuration ||
                              Date.now() -
                                continuityInfo.continuityState
                                  .effectStartTime) / 1000
                          )}
                          초
                        </Text>
                      </View>
                      <View style={styles.effectItem}>
                        <Text style={styles.effectLabel}>재시작</Text>
                        <Text style={styles.effectValue}>
                          {continuityInfo.continuityState.restartCount}회
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.debugSection}>
                  <Text style={styles.sectionTitle}>성능 메트릭</Text>
                  <View style={styles.performanceGrid}>
                    <View style={styles.performanceItem}>
                      <Text style={styles.performanceLabel}>메모리</Text>
                      <Text
                        style={[
                          styles.performanceValue,
                          {
                            color:
                              continuityInfo.performanceMetrics.memoryUsage > 30
                                ? COLORS.error
                                : COLORS.success,
                          },
                        ]}
                      >
                        {continuityInfo.performanceMetrics.memoryUsage}MB
                      </Text>
                    </View>
                    <View style={styles.performanceItem}>
                      <Text style={styles.performanceLabel}>FPS</Text>
                      <Text
                        style={[
                          styles.performanceValue,
                          {
                            color:
                              continuityInfo.performanceMetrics.averageFps < 30
                                ? COLORS.error
                                : continuityInfo.performanceMetrics.averageFps <
                                    50
                                  ? COLORS.warning
                                  : COLORS.success,
                          },
                        ]}
                      >
                        {continuityInfo.performanceMetrics.averageFps}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {activeTab === 'user' && (
              <>
                <View style={styles.debugSection}>
                  <Text style={styles.sectionTitle}>스탯 & 레벨</Text>
                  <View style={styles.expGrid}>
                    {EXPERIENCE_TYPE_KEYS.filter(
                      key =>
                        EXPERIENCE_CONFIGS[key].category === 'stat' ||
                        EXPERIENCE_CONFIGS[key].category === 'level'
                    ).map(expType => {
                      const expConfig = EXPERIENCE_CONFIGS[expType];
                      const currentExp = state.experience[expType] || 0;
                      const currentLevel = state.levels[expType] || 0;
                      const expToNextLevel = expConfig.expToLevel(currentLevel);
                      const progressPercent =
                        (currentExp / expToNextLevel) * 100;
                      const color =
                        STATS[expType as keyof typeof STATS]?.color ||
                        expConfig.color ||
                        COLORS.primary;

                      return (
                        <View key={expType} style={styles.expItem}>
                          <Text style={[styles.expLabel, { color }]}>
                            {expConfig.displayName}
                          </Text>
                          <Text style={styles.levelText}>
                            Lv. {currentLevel}
                          </Text>
                          <Text style={styles.expValue}>
                            {currentExp}/{expToNextLevel}
                          </Text>
                          <View style={styles.expBar}>
                            <View
                              style={[
                                styles.expProgress,
                                {
                                  width: `${Math.min(progressPercent, 100)}%`,
                                  backgroundColor: color,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.autoLevelText}>
                            {expConfig.autoLevelUp ? '(자동)' : '(수동)'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {EXPERIENCE_TYPE_KEYS.some(
                  key => EXPERIENCE_CONFIGS[key].category === 'skill'
                ) && (
                  <View style={styles.debugSection}>
                    <Text style={styles.sectionTitle}>스킬</Text>
                    <View style={styles.expGrid}>
                      {EXPERIENCE_TYPE_KEYS.filter(
                        key => EXPERIENCE_CONFIGS[key].category === 'skill'
                      ).map(expType => {
                        const expConfig = EXPERIENCE_CONFIGS[expType];
                        const currentExp = state.experience[expType] || 0;
                        const currentLevel = state.levels[expType] || 0;
                        const expToNextLevel =
                          expConfig.expToLevel(currentLevel);
                        const progressPercent =
                          (currentExp / expToNextLevel) * 100;
                        const color = expConfig.color || COLORS.primary;

                        return (
                          <View key={expType} style={styles.expItem}>
                            <Text style={[styles.expLabel, { color }]}>
                              {expConfig.displayName}
                            </Text>
                            <Text style={styles.levelText}>
                              Lv. {currentLevel}
                            </Text>
                            <Text style={styles.expValue}>
                              {currentExp}/{expToNextLevel}
                            </Text>
                            <View style={styles.expBar}>
                              <View
                                style={[
                                  styles.expProgress,
                                  {
                                    width: `${Math.min(progressPercent, 100)}%`,
                                    backgroundColor: color,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={styles.autoLevelText}>
                              {expConfig.autoLevelUp ? '(자동)' : '(수동)'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={styles.debugSection}>
                  <Text style={styles.sectionTitle}>상태 검증</Text>
                  <Text
                    style={[
                      styles.sectionValue,
                      {
                        color: validation.isValid
                          ? COLORS.success
                          : COLORS.error,
                      },
                    ]}
                  >
                    {validation.isValid ? '✅ 정상' : '❌ 오류 발견'}
                  </Text>
                  {validation.errors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      {error}
                    </Text>
                  ))}
                </View>

                <View style={styles.debugSection}>
                  <Text style={styles.sectionTitle}>조건 확인 핵심 값</Text>
                  <View style={styles.valueGrid}>
                    <View style={styles.valueItem}>
                      <Text style={styles.valueLabel}>능력치 합</Text>
                      <Text style={styles.valueValue}>
                        {state.strength +
                          state.agility +
                          state.wisdom +
                          state.charisma}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text style={styles.valueLabel}>자원 합</Text>
                      <Text style={styles.valueValue}>
                        {state.health + state.mind}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text style={styles.valueLabel}>상태 수</Text>
                      <Text style={styles.valueValue}>
                        {state.buffs.length}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text style={styles.valueLabel}>플래그 수</Text>
                      <Text style={styles.valueValue}>
                        {state.flags.length}
                      </Text>
                    </View>
                    <View style={styles.valueItem}>
                      <Text style={styles.valueLabel}>아이템 수</Text>
                      <Text style={styles.valueValue}>
                        {state.items.length}
                      </Text>
                    </View>
                  </View>
                </View>

                {state.flags.length > 0 && (
                  <View style={styles.debugSection}>
                    <Text style={styles.sectionTitle}>활성 플래그</Text>
                    <Text style={styles.arrayValue}>
                      {state.flags.join(', ')}
                    </Text>
                  </View>
                )}

                {state.buffs.length > 0 && (
                  <View style={styles.debugSection}>
                    <Text style={styles.sectionTitle}>활성 상태</Text>
                    <Text style={styles.arrayValue}>
                      {state.buffs.join(', ')}
                    </Text>
                  </View>
                )}

                {state.completed_scenes.length > 0 && (
                  <View style={styles.debugSection}>
                    <Text style={styles.sectionTitle}>최근 완료 씬</Text>
                    <Text style={styles.arrayValue}>
                      {state.completed_scenes.slice(-5).join(', ')}
                      {state.completed_scenes.length > 5 &&
                        ` (외 ${state.completed_scenes.length - 5}개)`}
                    </Text>
                  </View>
                )}

                {(() => {
                  const visitStats = VisitedScenesManager.getVisitStats(state);
                  return (
                    <View style={styles.debugSection}>
                      <Text style={styles.sectionTitle}>방문 이력</Text>
                      <View style={styles.effectGrid}>
                        <View style={styles.effectItem}>
                          <Text style={styles.effectLabel}>총 방문</Text>
                          <Text style={styles.effectValue}>
                            {visitStats.totalVisited}개
                          </Text>
                        </View>
                        <View style={styles.effectItem}>
                          <Text style={styles.effectLabel}>마지막 방문</Text>
                          <Text style={styles.effectValue}>
                            {visitStats.lastVisited || '없음'}
                          </Text>
                        </View>
                      </View>
                      {visitStats.visitedScenes.length > 0 && (
                        <Text style={styles.arrayValue}>
                          최근: {visitStats.visitedScenes.slice(-5).join(', ')}
                          {visitStats.visitedScenes.length > 5 &&
                            ` (외 ${visitStats.visitedScenes.length - 5}개)`}
                        </Text>
                      )}
                    </View>
                  );
                })()}

                {currentSceneId && (
                  <View style={styles.debugSection}>
                    <Text style={styles.sectionTitle}>현재 씬 방문 상태</Text>
                    <Text
                      style={[
                        styles.sectionValue,
                        {
                          color: VisitedScenesManager.isFirstVisit(
                            currentSceneId,
                            state
                          )
                            ? COLORS.success
                            : COLORS.warning,
                        },
                      ]}
                    >
                      {VisitedScenesManager.isFirstVisit(currentSceneId, state)
                        ? '🌟 최초 방문'
                        : '🔄 재방문'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* 토글 버튼 (항상 하단) */}
      <TouchableOpacity
        onPress={() => setShowPanel(prev => !prev)}
        style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          paddingVertical: 6,
          paddingHorizontal: 8,
          borderRadius: 18,
          alignItems: 'center',
        }}
      >
        <Icon
          name='debug'
          size={24}
          color={showPanel ? COLORS.warning : COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

/**
 * React.memo 적용: 디버깅 정보 변경 시에만 리렌더링
 * 성능 최적화를 위해 주요 필드들만 비교 (디버깅용)
 */
export default memo(DebugInfoDisplay, (prevProps, nextProps) => {
  // 현재 씬 ID 변경 체크
  if (prevProps.currentSceneId !== nextProps.currentSceneId) {
    return false;
  }

  // 현재 씬 변경 체크 (배경 효과 정보 포함)
  if (
    prevProps.currentScene?.id !== nextProps.currentScene?.id ||
    JSON.stringify(prevProps.currentScene?.background_effects) !==
      JSON.stringify(nextProps.currentScene?.background_effects)
  ) {
    return false;
  }

  const prevState = prevProps.state;
  const nextState = nextProps.state;

  // 경험치 객체 비교
  const experienceChanged = EXPERIENCE_TYPE_KEYS.some(
    expType =>
      (prevState.experience[expType] || 0) !==
      (nextState.experience[expType] || 0)
  );

  // 레벨 객체 비교
  const levelsChanged = EXPERIENCE_TYPE_KEYS.some(
    expType =>
      (prevState.levels[expType] || 0) !== (nextState.levels[expType] || 0)
  );

  // 주요 게임 상태 필드들만 비교 (디버깅용이므로 필수적인 것들만)
  return (
    // 경험치 및 레벨 변경 체크
    !experienceChanged &&
    !levelsChanged &&
    // 능력치
    prevState.strength === nextState.strength &&
    prevState.agility === nextState.agility &&
    prevState.wisdom === nextState.wisdom &&
    prevState.charisma === nextState.charisma &&
    // 자원 (중요: 체력 변화도 감지)
    prevState.health === nextState.health &&
    prevState.mind === nextState.mind &&
    // 진행 상태
    prevState.current_floor === nextState.current_floor &&
    prevState.death_count === nextState.death_count &&
    // 배열 길이만 비교 (성능 고려)
    prevState.buffs.length === nextState.buffs.length &&
    prevState.flags.length === nextState.flags.length &&
    prevState.items.length === nextState.items.length &&
    prevState.completed_scenes.length === nextState.completed_scenes.length &&
    // 방문 이력 비교 추가
    (prevState.visited_scenes?.length || 0) ===
      (nextState.visited_scenes?.length || 0)
  );
});

const styles = StyleSheet.create({
  debugContainer: {
    backgroundColor: COLORS.background + 'CC', // 80% 불투명도
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    height: 440, // 높이 증가
    width: 360,
  },
  resetButton: {
    backgroundColor: COLORS.error + '99',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-end',
  },
  resetButtonText: {
    ...FONT_STYLES.bold,
    color: '#fff',
    ...FONT_SIZES.xs,
  },
  debugTitle: {
    ...FONT_STYLES.bold,
    color: COLORS.warning,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    ...FONT_SIZES.sm,
  },
  debugContent: {
    flex: 1,
    maxHeight: 380, // 높이 증가
  },
  tabContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  tabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface + '20',
  },
  tabButtonActive: {
    backgroundColor: COLORS.warning + '55',
  },
  tabText: {
    ...FONT_STYLES.regular,
    ...FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    ...FONT_STYLES.bold,
    color: COLORS.text,
  },
  debugSection: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border + '40',
  },
  sectionTitle: {
    ...FONT_STYLES.regular,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    ...FONT_SIZES.xs,
  },
  sectionValue: {
    ...FONT_STYLES.regular,
    color: COLORS.text,
    ...FONT_SIZES.sm,
  },
  arrayValue: {
    color: COLORS.textSecondary,
    ...FONT_SIZES.xs,
  },
  errorText: {
    color: COLORS.error,
    marginTop: SPACING.xs,
    ...FONT_SIZES.xs,
  },
  valueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  valueItem: {
    backgroundColor: COLORS.surface + '20',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  valueLabel: {
    color: COLORS.textSecondary,
    marginBottom: 2,
    ...FONT_SIZES.xs,
  },
  valueValue: {
    ...FONT_STYLES.regular,
    color: COLORS.text,
    ...FONT_SIZES.sm,
  },
  // 경험치 관련 스타일 추가
  expGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  expItem: {
    backgroundColor: COLORS.background + '60', // 60% 투명도
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  expLabel: {
    ...FONT_STYLES.regular,
    marginBottom: SPACING.xs,
    ...FONT_SIZES.xs,
  },
  levelText: {
    ...FONT_STYLES.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    ...FONT_SIZES.xs,
  },
  expValue: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    ...FONT_SIZES.xs,
  },
  expBar: {
    width: '100%',
    height: 3,
    backgroundColor: COLORS.background,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  expProgress: {
    height: '100%',
    borderRadius: 2,
  },
  autoLevelText: {
    fontSize: FONT_SIZES.xs.fontSize - 2,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  // 배경 효과 관련 스타일 추가
  effectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  effectItem: {
    backgroundColor: COLORS.surface + '30',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 70,
    alignItems: 'center',
  },
  effectLabel: {
    color: COLORS.textSecondary,
    marginBottom: 2,
    ...FONT_SIZES.xs,
  },
  effectValue: {
    ...FONT_STYLES.regular,
    color: COLORS.text,
    ...FONT_SIZES.sm,
  },
  // 성능 메트릭 관련 스타일 추가
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  performanceItem: {
    backgroundColor: COLORS.surface + '25',
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  performanceLabel: {
    color: COLORS.textSecondary,
    marginBottom: 2,
    ...FONT_SIZES.xs,
  },
  performanceValue: {
    ...FONT_STYLES.bold,
    ...FONT_SIZES.sm,
  },
});
