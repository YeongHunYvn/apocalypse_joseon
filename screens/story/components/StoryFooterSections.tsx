import { memo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  COLORS,
  FONT_SIZES,
  FONT_STYLES,
  SPACING,
} from '../../../constants/theme';
// 로그 제거됨

export type FooterSectionId = 'items' | 'skills' | 'buffs';

interface SectionDef {
  id: FooterSectionId;
  title: string;
}

interface StoryFooterSectionsProps {
  sections: SectionDef[];
  active: FooterSectionId | null;
  onPressIn: (id: FooterSectionId) => void;
  onPressOut: () => void;
}

function StoryFooterSections({
  sections,
  active,
  onPressIn,
  onPressOut,
}: StoryFooterSectionsProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<View | null>(null);
  const containerLeftRef = useRef(0);

  const pickFromEvent = (e: any) => {
    if (!sections.length) return null;
    const pageX: number | undefined = e?.nativeEvent?.pageX;
    const locX: number | undefined = e?.nativeEvent?.locationX;
    let localX = 0;
    if (typeof pageX === 'number' && containerLeftRef.current > 0) {
      localX = pageX - containerLeftRef.current;
    } else if (typeof locX === 'number') {
      localX = locX;
    }
    if (localX < 0) localX = 0;
    if (localX > containerWidth) localX = containerWidth;
    const cellWidth = containerWidth > 0 ? containerWidth / sections.length : 0;
    const idx =
      cellWidth > 0
        ? Math.max(
            0,
            Math.min(sections.length - 1, Math.floor(localX / cellWidth))
          )
        : 0;
    const id = sections[idx]?.id ?? null;
    return id;
  };

  return (
    <View
      ref={node => {
        containerRef.current = node;
      }}
      style={styles.footerContent}
      onLayout={e => {
        setContainerWidth(e.nativeEvent.layout.width);
        if (containerRef.current && 'measureInWindow' in containerRef.current) {
          (containerRef.current as any).measureInWindow((x: number) => {
            containerLeftRef.current = x;
          });
        }
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={e => {
        const id = pickFromEvent(e);
        if (id && id !== active) onPressIn(id);
        else if (active) onPressIn(active);
      }}
      onResponderMove={e => {
        const id = pickFromEvent(e);
        if (id && id !== active) onPressIn(id);
      }}
      onResponderRelease={() => {
        // 경계에서 자식 레이아웃 갱신과 충돌 방지용 짧은 지연
        setTimeout(onPressOut, 80);
      }}
      onResponderTerminate={() => {
        setTimeout(onPressOut, 80);
      }}
    >
      {sections.map(panel => (
        <View key={panel.id} style={styles.section}>
          <Text
            style={[
              styles.titleText,
              active && active === panel.id && styles.activeTitle,
            ]}
          >
            {panel.title}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default memo(StoryFooterSections);

const styles = StyleSheet.create({
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  titleText: {
    color: COLORS.textSecondary,
    ...FONT_STYLES.regular,
    ...FONT_SIZES.sm,
  },
  activeTitle: {
    color: COLORS.text,
    ...FONT_STYLES.semiBold,
  },
});
