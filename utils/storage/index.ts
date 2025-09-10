/**
 * 통합 저장소 유틸리티
 * 보안 필요성에 따라 자동으로 적절한 저장소를 선택합니다
 */

// AsyncStorage 유틸리티 (일반 데이터)
export {
  clear,
  getAllKeys,
  getItem,
  getStorageInfo,
  hasItem,
  removeItem,
  removeMultiple,
  setItem,
} from './asyncStorage';

// SecureStore 유틸리티 (보안 데이터)
export {
  clearAllSecureData,
  getSecureItem,
  getUserCredentials,
  getUserToken,
  hasSecureItem,
  isSecureStoreAvailable,
  removeMultipleSecure,
  removeSecureItem,
  removeUserCredentials,
  removeUserToken,
  setSecureItem,
  setUserCredentials,
  setUserToken,
} from './secureStorage';

/**
 * 데이터 타입에 따라 적절한 저장소를 자동 선택하는 통합 인터페이스
 */

// 보안이 필요한 데이터 키 목록
const SECURE_KEYS = [
  'user_token',
  'user_credentials',
  'auth_token',
  'refresh_token',
  'api_key',
  'password',
  'private_key',
  'session_id',
];

/**
 * 키가 보안 저장소를 필요로 하는지 확인합니다
 * @param key - 확인할 키
 * @returns 보안 저장소 필요 여부
 */
function isSecureKey(key: string): boolean {
  return SECURE_KEYS.some(
    secureKey =>
      key.includes(secureKey) ||
      key.startsWith('secure_') ||
      key.endsWith('_secure')
  );
}

/**
 * 데이터를 적절한 저장소에 저장합니다 (자동 선택)
 * @param key - 저장할 키
 * @param value - 저장할 값
 * @returns 성공 여부
 */
export async function store<T = any>(key: string, value: T): Promise<boolean> {
  if (isSecureKey(key)) {
    const { setSecureItem } = await import('./secureStorage');
    return setSecureItem(key, value);
  } else {
    const { setItem } = await import('./asyncStorage');
    return setItem(key, value);
  }
}

/**
 * 적절한 저장소에서 데이터를 가져옵니다 (자동 선택)
 * @param key - 가져올 키
 * @param defaultValue - 기본값
 * @returns 저장된 값 또는 기본값
 */
export async function retrieve<T = any>(
  key: string,
  defaultValue?: T
): Promise<T | undefined> {
  if (isSecureKey(key)) {
    const { getSecureItem } = await import('./secureStorage');
    return getSecureItem<T>(key, defaultValue);
  } else {
    const { getItem } = await import('./asyncStorage');
    return getItem<T>(key, defaultValue);
  }
}

/**
 * 적절한 저장소에서 데이터를 제거합니다 (자동 선택)
 * @param key - 제거할 키
 * @returns 성공 여부
 */
export async function remove(key: string): Promise<boolean> {
  if (isSecureKey(key)) {
    const { removeSecureItem } = await import('./secureStorage');
    return removeSecureItem(key);
  } else {
    const { removeItem } = await import('./asyncStorage');
    return removeItem(key);
  }
}

/**
 * 키가 적절한 저장소에 존재하는지 확인합니다 (자동 선택)
 * @param key - 확인할 키
 * @returns 존재 여부
 */
export async function exists(key: string): Promise<boolean> {
  if (isSecureKey(key)) {
    const { hasSecureItem } = await import('./secureStorage');
    return hasSecureItem(key);
  } else {
    const { hasItem } = await import('./asyncStorage');
    return hasItem(key);
  }
}

/**
 * 게임 데이터 전용 저장 함수들
 */
export const GameStorage = {
  /**
   * 게임 진행 상황을 저장합니다
   * @param keyOrData - 저장할 키 또는 데이터
   * @param data - 저장할 데이터 (키가 제공된 경우)
   */
  async saveProgress(keyOrData: string | any, data?: any): Promise<boolean> {
    if (typeof keyOrData === 'string' && data !== undefined) {
      // saveProgress(key, data) 형태
      return store(keyOrData, data);
    } else {
      // saveProgress(data) 형태 (기존 호환성)
      return store('game_progress', keyOrData);
    }
  },

  /**
   * 게임 진행 상황을 로드합니다
   * @param key - 로드할 키 (기본값: 'game_progress')
   */
  async loadProgress<T = any>(key?: string): Promise<T | undefined> {
    return retrieve<T>(key || 'game_progress');
  },

  /**
   * 게임 진행 상황을 제거합니다
   * @param key - 제거할 키
   */
  async removeProgress(key: string): Promise<boolean> {
    return remove(key);
  },

  /**
   * 게임 설정을 저장합니다
   */
  async saveSettings(settings: any): Promise<boolean> {
    return store('game_settings', settings);
  },

  /**
   * 게임 설정을 로드합니다
   */
  async loadSettings<T = any>(): Promise<T | undefined> {
    return retrieve<T>('game_settings');
  },

  /**
   * 방문한 씬 이력을 저장합니다
   */
  async saveVisitedScenes(sceneIds: string[]): Promise<boolean> {
    return store('visited_scenes', sceneIds);
  },

  /**
   * 방문한 씬 이력을 로드합니다
   */
  async loadVisitedScenes(): Promise<string[]> {
    const scenes = await retrieve<string[]>('visited_scenes', []);
    return scenes || [];
  },

  /**
   * 모든 게임 데이터를 삭제합니다
   */
  async clearAllGameData(): Promise<boolean> {
    const gameKeys = [
      'game_progress',
      'game_settings',
      'visited_scenes',
      'game_stats',
      'achievements',
      'auto_save_game_state', // 자동 저장 데이터
    ];

    const { removeMultiple } = await import('./asyncStorage');
    return removeMultiple(gameKeys);
  },
};
