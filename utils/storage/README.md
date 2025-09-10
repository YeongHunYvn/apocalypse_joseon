# 저장소 유틸리티 사용 가이드

React Native/Expo 환경에 최적화된 저장소 유틸리티입니다. 보안 필요성에 따라 자동으로 적절한 저장소를 선택합니다.

## 📦 설치된 패키지
- `@react-native-async-storage/async-storage` - 일반 데이터 저장
- `expo-secure-store` - 보안이 필요한 데이터 저장

## 🚀 기본 사용법

### 1. 자동 저장소 선택 (권장)
```typescript
import { store, retrieve, remove, exists } from '../utils/storage';

// 자동으로 적절한 저장소 선택
await store('game_progress', { level: 5, score: 1000 });
const progress = await retrieve('game_progress');

// 보안이 필요한 데이터는 자동으로 SecureStore 사용
await store('user_token', 'abc123'); // SecureStore에 저장됨
const token = await retrieve('user_token');

// 데이터 제거
await remove('game_progress');

// 존재 여부 확인
const hasToken = await exists('user_token');
```

### 2. 명시적 저장소 선택

#### AsyncStorage (일반 데이터)
```typescript
import { setItem, getItem, removeItem } from '../utils/storage';

// 게임 설정 저장
await setItem('settings', {
  soundEnabled: true,
  difficulty: 'normal'
});

// 게임 설정 로드
const settings = await getItem('settings', { soundEnabled: true, difficulty: 'easy' });

// 캐시 데이터 저장 (문자열)
await setItem('cached_data', JSON.stringify(data));
const cachedData = JSON.parse(await getItem('cached_data', '{}'));
```

#### SecureStore (보안 데이터)
```typescript
import { 
  setSecureItem, 
  getSecureItem, 
  setUserToken, 
  getUserToken 
} from '../utils/storage';

// 일반 보안 데이터
await setSecureItem('api_key', 'secret_key_123');
const apiKey = await getSecureItem('api_key');

// 사용자 토큰 (생체 인증 필요)
await setUserToken('jwt_token_here');
const token = await getUserToken(); // 생체 인증 요구됨

// 사용자 인증 정보
await setUserCredentials({
  username: 'john_doe',
  refreshToken: 'refresh_123'
});
const credentials = await getUserCredentials();
```

### 3. 게임 데이터 전용 함수

```typescript
import { GameStorage } from '../utils/storage';

// 게임 진행 상황
await GameStorage.saveProgress({
  currentLevel: 10,
  unlockedAchievements: ['first_kill', 'level_5']
});
const progress = await GameStorage.loadProgress();

// 게임 설정
await GameStorage.saveSettings({
  volume: 0.8,
  graphics: 'high'
});
const settings = await GameStorage.loadSettings();

// 방문한 씬 이력
await GameStorage.saveVisitedScenes(['scene_1', 'scene_2']);
const visitedScenes = await GameStorage.loadVisitedScenes();

// 모든 게임 데이터 삭제 (앱 초기화)
await GameStorage.clearAllGameData();
```

## 🔐 보안 데이터 자동 감지

다음 키워드가 포함된 키는 자동으로 SecureStore를 사용합니다:

- `user_token`, `auth_token`, `refresh_token`
- `api_key`, `password`, `private_key`
- `session_id`, `user_credentials`
- `secure_` 접두사
- `_secure` 접미사

```typescript
// 자동으로 SecureStore 사용
await store('user_token', 'abc123');
await store('secure_data', 'sensitive');
await store('api_key_secure', 'key123');

// 자동으로 AsyncStorage 사용  
await store('game_settings', { volume: 0.5 });
await store('cache_data', 'normal data');
```

## 📱 플랫폼별 동작

### iOS
- **AsyncStorage**: NSUserDefaults
- **SecureStore**: Keychain Services

### Android  
- **AsyncStorage**: SharedPreferences
- **SecureStore**: EncryptedSharedPreferences + Keystore

### 웹 (Expo Web)
- **AsyncStorage**: localStorage
- **SecureStore**: 사용 불가 (AsyncStorage로 폴백)

## 🎮 게임에서의 실제 사용 예시

### VisitedScenesManager 업데이트
```typescript
// 기존 코드
class VisitedScenesManager {
  static async syncWithStorage(gameState: GameState): Promise<SceneId[]> {
    const storedScenes = await GameStorage.loadVisitedScenes();
    // ... 병합 로직
    await GameStorage.saveVisitedScenes(gameState.visited_scenes);
    return gameState.visited_scenes;
  }
}
```

### GameStateReducer 업데이트  
```typescript
// contexts/GameStateReducer.ts
case 'SYNC_VISITED_SCENES_WITH_STORAGE':
  return {
    ...state,
    visited_scenes: await VisitedScenesManager.syncWithStorage(state)
  };
```

## 🛠️ 유틸리티 함수들

### 일반 함수
- `setItem(key, value)` - 데이터 저장
- `getItem(key, defaultValue?)` - 데이터 로드  
- `removeItem(key)` - 데이터 삭제
- `hasItem(key)` - 존재 여부 확인
- `clear()` - 전체 삭제
- `getAllKeys()` - 모든 키 조회

### 보안 함수
- `setSecureItem(key, value, options?)` - 보안 데이터 저장
- `getSecureItem(key, defaultValue?, options?)` - 보안 데이터 로드
- `removeSecureItem(key, options?)` - 보안 데이터 삭제
- `clearAllSecureData()` - 모든 보안 데이터 삭제

### 전용 함수
- `setUserToken(token)` - 토큰 저장 (생체 인증 필요)
- `getUserToken()` - 토큰 로드 (생체 인증 필요)
- `setUserCredentials(credentials)` - 인증 정보 저장
- `getUserCredentials()` - 인증 정보 로드

## ⚠️ 주의사항

1. **Async 함수**: 모든 저장소 함수는 비동기입니다. `await` 사용 필수
2. **타입 안전성**: 제네릭을 사용하여 타입 안전성 확보
3. **에러 처리**: 저장/로드 실패 시 자동으로 기본값 반환
4. **플랫폼 호환성**: 웹에서 SecureStore는 AsyncStorage로 폴백
5. **생체 인증**: `setUserToken`/`getUserToken`은 생체 인증이 필요할 수 있음

## 🔄 마이그레이션 가이드

### localStorage에서 마이그레이션
```typescript
// 기존 코드
localStorage.setItem('key', JSON.stringify(data));
const data = JSON.parse(localStorage.getItem('key') || '{}');

// 새로운 코드
await setItem('key', data);
const data = await getItem('key', {});
```

### 메모리 저장소에서 마이그레이션
```typescript
// 기존 코드  
const memoryStorage = new Map();
memoryStorage.set('key', JSON.stringify(data));

// 새로운 코드
await setItem('key', data);
```