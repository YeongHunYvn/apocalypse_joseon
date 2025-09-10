import * as SecureStore from 'expo-secure-store';
import { Logger } from '../system/Logger';

// 저장 성공 로그 과다 방지를 위한 간단한 스로틀
const SECURE_SUCCESS_LOG_THROTTLE_MS = 2000;
const lastSecureSuccessLogAt: Map<string, number> = new Map();

function logSecureSaveSuccessThrottled(key: string): void {
  const now = Date.now();
  const previous = lastSecureSuccessLogAt.get(key) ?? 0;
  if (now - previous > SECURE_SUCCESS_LOG_THROTTLE_MS) {
    Logger.debug('[SecureStore]', `보안 저장 성공: ${key}`);
    lastSecureSuccessLogAt.set(key, now);
  }
}

/**
 * 보안이 필요한 데이터 저장을 위한 SecureStore 유틸리티
 * 민감한 데이터 (토큰, 비밀번호, 개인정보 등)에 사용
 * iOS: Keychain, Android: EncryptedSharedPreferences 사용
 */

/**
 * 보안 저장소에 데이터를 저장합니다
 * @param key - 저장할 키
 * @param value - 저장할 값 (객체는 자동으로 JSON.stringify 됩니다)
 * @param options - SecureStore 옵션
 * @returns 성공 여부
 */
export async function setSecureItem<T = any>(
  key: string,
  value: T,
  options?: SecureStore.SecureStoreOptions
): Promise<boolean> {
  try {
    const stringValue =
      typeof value === 'string' ? value : JSON.stringify(value);
    await SecureStore.setItemAsync(key, stringValue, options);
    logSecureSaveSuccessThrottled(key);
    return true;
  } catch (error) {
    Logger.error('[SecureStore]', `보안 저장 실패: ${key}`, error as Error);
    return false;
  }
}

/**
 * 보안 저장소에서 데이터를 가져옵니다
 * @param key - 가져올 키
 * @param defaultValue - 값이 없을 때 반환할 기본값
 * @param options - SecureStore 옵션
 * @returns 저장된 값 또는 기본값
 */
export async function getSecureItem<T = any>(
  key: string,
  defaultValue?: T,
  options?: SecureStore.SecureStoreOptions
): Promise<T | undefined> {
  try {
    const value = await SecureStore.getItemAsync(key, options);
    if (value === null) {
      Logger.debug('[SecureStore]', `보안 값 없음: ${key} -> 기본값 사용`);
      return defaultValue ?? undefined;
    }

    // JSON 파싱 시도, 실패하면 문자열 그대로 반환
    try {
      const parsedValue = JSON.parse(value);
      Logger.debug('[SecureStore]', `보안 로드 성공: ${key}`);
      return parsedValue;
    } catch {
      // JSON이 아닌 문자열인 경우
      Logger.debug('[SecureStore]', `보안 문자열 로드: ${key}`);
      return value as T;
    }
  } catch (error) {
    Logger.error('[SecureStore]', `보안 로드 실패: ${key}`, error as Error);
    return defaultValue ?? undefined;
  }
}

/**
 * 보안 저장소에서 데이터를 제거합니다
 * @param key - 제거할 키
 * @param options - SecureStore 옵션
 * @returns 성공 여부
 */
export async function removeSecureItem(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(key, options);
    Logger.debug('[SecureStore]', `보안 삭제 성공: ${key}`);
    return true;
  } catch (error) {
    Logger.error('[SecureStore]', `보안 삭제 실패: ${key}`, error as Error);
    return false;
  }
}

/**
 * 여러 키를 한 번에 제거합니다
 * @param keys - 제거할 키 배열
 * @param options - SecureStore 옵션
 * @returns 성공 여부
 */
export async function removeMultipleSecure(
  keys: string[],
  options?: SecureStore.SecureStoreOptions
): Promise<boolean> {
  try {
    await Promise.all(
      keys.map(key => SecureStore.deleteItemAsync(key, options))
    );
    Logger.debug('[SecureStore]', `보안 다중 삭제 성공: ${keys.join(', ')}`);
    return true;
  } catch (error) {
    Logger.error(
      '[SecureStore]',
      '보안 다중 삭제 실패:',
      keys as any,
      error as Error
    );
    return false;
  }
}

/**
 * 특정 키가 보안 저장소에 존재하는지 확인합니다
 * @param key - 확인할 키
 * @param options - SecureStore 옵션
 * @returns 존재 여부
 */
export async function hasSecureItem(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<boolean> {
  try {
    const value = await SecureStore.getItemAsync(key, options);
    return value !== null;
  } catch (error) {
    Logger.error(
      '[SecureStore]',
      `보안 존재 확인 실패: ${key}`,
      error as Error
    );
    return false;
  }
}

/**
 * 보안이 필요한 사용자 토큰을 저장합니다
 * @param token - 저장할 토큰
 * @returns 성공 여부
 */
export async function setUserToken(token: string): Promise<boolean> {
  return setSecureItem('user_token', token, {
    requireAuthentication: true, // 생체 인증 또는 패스코드 필요
  });
}

/**
 * 저장된 사용자 토큰을 가져옵니다
 * @returns 토큰 또는 null
 */
export async function getUserToken(): Promise<string | undefined> {
  return getSecureItem<string>('user_token', undefined, {
    requireAuthentication: true,
  });
}

/**
 * 사용자 토큰을 제거합니다
 * @returns 성공 여부
 */
export async function removeUserToken(): Promise<boolean> {
  return removeSecureItem('user_token');
}

/**
 * 보안이 필요한 사용자 인증 정보를 저장합니다
 * @param credentials - 인증 정보 객체
 * @returns 성공 여부
 */
export async function setUserCredentials(credentials: {
  username?: string;
  refreshToken?: string;
  [key: string]: any;
}): Promise<boolean> {
  return setSecureItem('user_credentials', credentials, {
    requireAuthentication: false, // 앱 시작 시에도 접근 가능
  });
}

/**
 * 저장된 사용자 인증 정보를 가져옵니다
 * @returns 인증 정보 또는 null
 */
export async function getUserCredentials(): Promise<
  | {
      username?: string;
      refreshToken?: string;
      [key: string]: any;
    }
  | undefined
> {
  return getSecureItem('user_credentials', undefined, {
    requireAuthentication: false,
  });
}

/**
 * 사용자 인증 정보를 제거합니다
 * @returns 성공 여부
 */
export async function removeUserCredentials(): Promise<boolean> {
  return removeSecureItem('user_credentials');
}

/**
 * 모든 보안 데이터를 제거합니다 (로그아웃 시 사용)
 * @returns 성공 여부
 */
export async function clearAllSecureData(): Promise<boolean> {
  const secureKeys = [
    'user_token',
    'user_credentials',
    // 필요에 따라 다른 보안 키들 추가
  ];

  return removeMultipleSecure(secureKeys);
}

/**
 * SecureStore가 현재 플랫폼에서 사용 가능한지 확인합니다
 * @returns 사용 가능 여부
 */
export async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    Logger.error('[SecureStore]', '사용 가능 여부 확인 실패:', error as Error);
    return false;
  }
}
