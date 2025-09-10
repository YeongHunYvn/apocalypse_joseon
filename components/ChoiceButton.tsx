import { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconKey } from '../constants/iconRegistry';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SHADOWS,
  SPACING,
} from '../constants/theme';
import { Choice, GameState } from '../types';
import {
  getProbabilityDisplayInfo,
  isChoiceAvailable,
} from '../utils/choiceUtils';
import EffectText from './EffectText';
import { Icon } from './icons/Icon';

interface ChoiceButtonProps {
  choice: Choice;
  gameState: GameState;
  onPress: (choice: Choice) => void;
  disabled?: boolean;
}

/**
 * 두 배열이 동일한지 비교하는 유틸리티 함수
 * 성능 최적화를 위해 얕은 비교 사용
 */
function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * 선택지 버튼 컴포넌트
 * 조건에 맞지 않는 선택지는 렌더링하지 않고,
 * 확률이 있는 선택지는 우측에 확률 정보를 표시합니다.
 */
function ChoiceButton({
  choice,
  gameState,
  onPress,
  disabled,
}: ChoiceButtonProps) {
  // 조건 체크 및 확률 정보를 한 번에 계산
  const choiceInfo = useMemo(() => {
    const isAvailable = isChoiceAvailable(choice, gameState);

    if (!isAvailable) {
      return { isAvailable: false };
    }

    // 확률이 있는 경우에만 계산
    if (!choice.probability) {
      return { isAvailable: true, showProbability: false };
    }

    const probabilityInfo = getProbabilityDisplayInfo(
      choice.probability,
      gameState
    );
    // 확률 객체가 존재하는 경우에는 항상 표시
    return {
      isAvailable: true,
      showProbability: true,
      probabilityInfo,
    };
  }, [choice, gameState]);

  // 조건에 해당하지 않는 선택지는 렌더링하지 않음
  if (!choiceInfo.isAvailable) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[styles.choiceButton, disabled && styles.choiceButtonDisabled]}
      onPress={() => onPress(choice)}
      disabled={disabled}
    >
      <View style={styles.choiceContainer}>
        <View style={styles.choiceTextContainer}>
          <EffectText
            text={choice.text}
            style={styles.choiceText}
            enableAnimations={true}
          />
        </View>

        {choiceInfo.showProbability && choiceInfo.probabilityInfo && (
          <View style={styles.probabilityContainer}>
            {/* 상단: 다른 수정자들 (버프, 플래그 등) */}
            {choiceInfo.probabilityInfo.otherModifiers &&
              choiceInfo.probabilityInfo.otherModifiers.length > 0 && (
                <View style={styles.otherModifiersContainer}>
                  {choiceInfo.probabilityInfo.otherModifiers.map(
                    (modifier, index) => (
                      <Text key={index} style={styles.modifierText}>
                        {modifier}
                      </Text>
                    )
                  )}
                </View>
              )}

            {/* 하단: 확률 퍼센트와 스탯 아이콘들 */}
            <View style={styles.bottomProbabilityRow}>
              {/* 좌측: 스탯 아이콘들 */}
              {choiceInfo.probabilityInfo.statIcons &&
                choiceInfo.probabilityInfo.statIcons.length > 0 && (
                  <View style={styles.statIconsContainer}>
                    {choiceInfo.probabilityInfo.statIcons.map(
                      (statKey, index) => (
                        <Icon
                          key={index}
                          name={statKey as IconKey}
                          size={16}
                          style={styles.statIcon}
                        />
                      )
                    )}
                  </View>
                )}

              {/* 우측: 총 확률 (100%도 표시) */}
              <Text style={styles.probabilityText}>
                {choiceInfo.probabilityInfo.percentage}%
              </Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * React.memo 적용: 선택지나 관련 게임 상태가 변경되었을 때만 리렌더링
 * 성능 최적화를 위해 조건 검사에 필요한 필드들만 비교
 */
export default memo(ChoiceButton, (prevProps, nextProps) => {
  // Choice 객체 비교 (텍스트와 조건 비교)
  if (prevProps.choice !== nextProps.choice) {
    return false;
  }

  // disabled 비교
  if (prevProps.disabled !== nextProps.disabled) {
    return false;
  }

  // onPress 함수 비교 (참조 비교)
  if (prevProps.onPress !== nextProps.onPress) {
    return false;
  }

  // 게임 상태 비교 (조건 검사에 필요한 필드들만)
  const prevState = prevProps.gameState;
  const nextState = nextProps.gameState;

  return (
    // 능력치
    prevState.strength === nextState.strength &&
    prevState.agility === nextState.agility &&
    prevState.wisdom === nextState.wisdom &&
    prevState.charisma === nextState.charisma &&
    // 자원
    prevState.health === nextState.health &&
    prevState.mind === nextState.mind &&
    // 진행 상태
    prevState.current_floor === nextState.current_floor &&
    prevState.death_count === nextState.death_count &&
    // 배열들 (얕은 비교)
    arraysEqual(prevState.buffs, nextState.buffs) &&
    arraysEqual(prevState.flags, nextState.flags) &&
    arraysEqual(prevState.completed_scenes, nextState.completed_scenes) &&
    // 아이템 배열은 길이만 비교 (성능 고려)
    prevState.items.length === nextState.items.length
  );
});

const styles = StyleSheet.create({
  choiceButton: {
    paddingVertical: SPACING.md - 2,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  choiceButtonDisabled: {
    opacity: 0.6,
  },
  choiceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceTextContainer: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  choiceText: {
    color: COLORS.text,
    textAlign: 'left',
    ...FONT_STYLES.regular,
    fontSize: FONT_SIZES.text.fontSize,
    lineHeight: FONT_SIZES.body.lineHeight,
  },
  probabilityContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 60,
  },
  otherModifiersContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bottomProbabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  statIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statIcon: {
    marginLeft: 2,
  },
  modifierText: {
    opacity: 0.7,
    textAlign: 'right',
    ...FONT_STYLES.semiBold,
    fontSize: FONT_SIZES.sm.fontSize,
    lineHeight: FONT_SIZES.sm.lineHeight,
    color: COLORS.text,
  },
  probabilityText: {
    opacity: 0.7,
    textAlign: 'right',
    ...FONT_STYLES.semiBold,
    fontSize: FONT_SIZES.sm.fontSize,
    lineHeight: FONT_SIZES.sm.lineHeight,
    color: COLORS.text,
  },
  debugInfoText: {
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xs,
    fontFamily: 'monospace',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    ...FONT_SIZES.xs,
  },
});
