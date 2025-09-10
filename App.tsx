import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useMaruBuriFonts } from './assets/fonts';
import { GameStateProvider } from './contexts';
import StoryScreen from './screens/StoryScreen';
import StoryLoading from './screens/story/components/StoryLoading';

/**
 * 애플리케이션의 루트 컴포넌트입니다.
 * 게임 상태 관리와 안전 영역 설정을 제공하고 메인 스토리 화면을 렌더링합니다.
 */
export default function App() {
  // MaruBuri 폰트 로딩
  const [fontsLoaded, fontError] = useMaruBuriFonts();

  // 폰트 로딩 중이거나 에러가 있는 경우
  if (!fontsLoaded || fontError) {
    return (
      <StoryLoading
        message={fontError ? '폰트 로딩 실패' : '폰트 로딩 중...'}
      />
    );
  }

  return (
    <GameStateProvider>
      <SafeAreaProvider>
        <StatusBar style='auto' />
        <StoryScreen />
      </SafeAreaProvider>
    </GameStateProvider>
  );
}
