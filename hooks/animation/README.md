# 애니메이션 훅 사용 가이드

## 📚 개요

애니메이션 관련 훅들이 통합되어 더욱 쉽고 일관되게 사용할 수 있습니다.

## 🎯 주요 훅들

### 1. `useAnimation` - 통합 애니메이션 훅

다양한 애니메이션 타입을 지원하는 통합 훅입니다.

```typescript
import { useAnimation } from '../hooks';

// 페이드 애니메이션
const fadeAnimation = useAnimation({
  type: 'fade',
  duration: 1000,
  intensity: 1,
});

// 스케일 애니메이션
const scaleAnimation = useAnimation({
  type: 'scale',
  duration: 500,
  intensity: 0.8,
  loop: true,
});

// 흔들기 애니메이션
const shakeAnimation = useAnimation({
  type: 'shake',
  intensity: 0.5,
});
```

#### 지원 애니메이션 타입
- `fade`: 투명도 애니메이션
- `scale`: 크기 조절 애니메이션  
- `shake`: 흔들기 애니메이션
- `glow`: 글로우 효과
- `pulse`: 펄스 효과
- `wave`: 물결 효과

#### 사용 예시

```typescript
function MyComponent() {
  const { animatedValue, startAnimation, stopAnimation } = useAnimation({
    type: 'pulse',
    duration: 1000,
    loop: true,
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: animatedValue }],
      }}
      onPress={startAnimation}
    >
      <Text>클릭하면 펄스 애니메이션!</Text>
    </Animated.View>
  );
}
```

### 2. `useContentFadeAnimation` - 콘텐츠 페이드 전용

기존 `useContentAnimation`의 개선된 버전입니다.

```typescript
import { useContentFadeAnimation } from '../hooks';

function ContentComponent() {
  const { contentOpacity, animateContent } = useContentFadeAnimation();

  const handleFadeOut = () => {
    animateContent(0, () => {
      console.log('페이드 아웃 완료!');
    });
  };

  return (
    <Animated.View style={{ opacity: contentOpacity }}>
      <Text>페이드 애니메이션 콘텐츠</Text>
    </Animated.View>
  );
}
```

### 3. `useCharAnimations` - 문자별 애니메이션

텍스트의 각 문자에 개별 애니메이션을 적용할 때 사용합니다.

```typescript
import { useCharAnimations } from '../hooks';

function CharacterAnimation({ text }: { text: string }) {
  const charAnimations = useCharAnimations(text.length);

  useEffect(() => {
    // 각 문자를 순차적으로 애니메이션
    text.split('').forEach((_, index) => {
      setTimeout(() => {
        charAnimations[index].value = withSpring(1);
      }, index * 100);
    });
  }, [text]);

  return (
    <View style={{ flexDirection: 'row' }}>
      {text.split('').map((char, index) => (
        <Animated.Text
          key={index}
          style={{
            opacity: charAnimations[index],
          }}
        >
          {char}
        </Animated.Text>
      ))}
    </View>
  );
}
```

## 🔄 마이그레이션 가이드

### 기존 `useContentAnimation`에서 마이그레이션

```typescript
// ❌ 기존 방식 (deprecated)
import { useContentAnimation } from '../hooks';
const { contentOpacity, animateContent } = useContentAnimation();

// ✅ 새로운 방식 1 - 호환성 유지
import { useContentFadeAnimation } from '../hooks';
const { contentOpacity, animateContent } = useContentFadeAnimation();

// ✅ 새로운 방식 2 - 더 유연한 사용
import { useAnimation } from '../hooks';
const { animatedValue: contentOpacity, animateTo } = useAnimation({ type: 'fade' });
```

## ⚠️ 주의사항

1. **`useCharAnimations`는 React Native Reanimated 사용**
   - 일반 애니메이션은 `useAnimation` 사용 권장

2. **네이티브 드라이버 지원**
   - 대부분의 애니메이션에서 네이티브 드라이버 기본 사용
   - `glow`, `pulse` 등 일부 효과는 자동으로 비활성화

3. **성능 고려사항**
   - `loop: true` 사용 시 메모리 누수 방지를 위해 컴포넌트 언마운트 시 `stopAnimation()` 호출 권장

## 🎨 스타일 가이드

애니메이션 값을 컴포넌트 스타일에 적용하는 방법:

```typescript
// 투명도
style={{ opacity: animatedValue }}

// 크기 조절
style={{ transform: [{ scale: animatedValue }] }}

// 위치 이동 (shake, wave)
style={{ transform: [{ translateX: animatedValue }] }}

// 회전
style={{ transform: [{ rotate: animatedValue.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg']
}) }] }}
``` 