import {
  TEXT_VARIABLES,
  TEXT_VARIABLE_REGEX,
  TextVariableCategory,
  TextVariableDefinition,
} from '../../../constants/textVariables';
import { GameState } from '../../../types';

/**
 * 텍스트 변수 파싱 결과 인터페이스
 */
export interface TextVariableParseResult {
  /** 치환된 텍스트 */
  text: string;
  /** 발견된 변수들 */
  variables: Array<{
    category: TextVariableCategory;
    key: string;
    originalValue: string;
    replacedValue: string;
    definition: TextVariableDefinition;
  }>;
  /** 오류 목록 */
  errors: string[];
  /** 변수가 있었는지 여부 */
  hasVariables: boolean;
}

/**
 * 텍스트 변수 파서 클래스
 * 새로운 ${category:key} 형태의 변수 문법을 파싱하여 게임 상태 값으로 치환합니다.
 */
export class TextVariableParser {
  /**
   * 텍스트에서 변수를 파싱하고 게임 상태 값으로 치환합니다.
   * @param text 파싱할 텍스트
   * @param gameState 게임 상태
   * @returns 파싱 결과
   */
  static parse(text: string, gameState: GameState): TextVariableParseResult {
    const variables: TextVariableParseResult['variables'] = [];
    const errors: string[] = [];
    let hasVariables = false;

    // 변수 치환 처리 - 새로운 ${category:key} 형태
    const replacedText = text.replace(
      TEXT_VARIABLE_REGEX,
      (match, category, key) => {
        hasVariables = true;
        const fullKey = `${category}:${key}`;
        const definition = TEXT_VARIABLES[fullKey];

        if (!definition) {
          errors.push(`정의되지 않은 변수: ${fullKey}`);
          return match; // 치환하지 않고 원본 그대로 반환
        }

        try {
          const value = TextVariableParser.extractValue(gameState, definition);
          const formattedValue = definition.formatter
            ? definition.formatter(value)
            : String(value);

          variables.push({
            category: definition.category,
            key: definition.key,
            originalValue: match,
            replacedValue: formattedValue,
            definition,
          });

          return formattedValue;
        } catch (error) {
          const errorMessage = `변수 '${fullKey}' 처리 실패: ${
            error instanceof Error ? error.message : String(error)
          }`;
          errors.push(errorMessage);
          return definition.defaultValue; // 기본값으로 대체
        }
      }
    );

    return {
      text: replacedText,
      variables,
      errors,
      hasVariables,
    };
  }

  /**
   * 게임 상태에서 변수 값을 추출합니다.
   * @param gameState 게임 상태
   * @param definition 변수 정의
   * @returns 추출된 값
   */
  private static extractValue(
    gameState: GameState,
    definition: TextVariableDefinition
  ): any {
    const path = definition.statePath;

    // 중첩된 경로 처리 (예: "experience.strength", "levels.level")
    if (path.includes('.')) {
      const pathParts = path.split('.');
      let value: any = gameState;

      for (const part of pathParts) {
        if (value === undefined || value === null) {
          return definition.defaultValue;
        }
        value = value[part];
      }

      return value !== undefined && value !== null
        ? value
        : definition.defaultValue;
    }

    // 단순 경로 처리 (예: "strength", "health")
    const value = (gameState as any)[path];
    return value !== undefined && value !== null
      ? value
      : definition.defaultValue;
  }

  /**
   * 텍스트에 변수가 포함되어 있는지 확인합니다.
   * @param text 검사할 텍스트
   * @returns 변수 포함 여부
   */
  static hasVariables(text: string): boolean {
    return TEXT_VARIABLE_REGEX.test(text);
  }

  /**
   * 텍스트에서 모든 변수 키를 추출합니다.
   * @param text 텍스트
   * @returns 변수 키 배열 (category:key 형태)
   */
  static extractVariableKeys(text: string): string[] {
    const keys: string[] = [];
    let match;

    // 정규식 재설정
    TEXT_VARIABLE_REGEX.lastIndex = 0;

    while ((match = TEXT_VARIABLE_REGEX.exec(text)) !== null) {
      const fullKey = `${match[1]}:${match[2]}`;
      keys.push(fullKey);
    }

    return keys;
  }

  /**
   * 카테고리별로 변수 키를 추출합니다.
   * @param text 텍스트
   * @param category 필터링할 카테고리
   * @returns 해당 카테고리의 변수 키 배열
   */
  static extractVariableKeysByCategory(
    text: string,
    category: TextVariableCategory
  ): string[] {
    const allKeys = TextVariableParser.extractVariableKeys(text);
    return allKeys.filter(key => key.startsWith(`${category}:`));
  }

  /**
   * 지원되는 변수 카테고리 목록을 반환합니다.
   * @returns 카테고리 배열
   */
  static getSupportedCategories(): TextVariableCategory[] {
    return [
      'stats',
      'resources',
      'progress',
      'exps',
      'levels',
      'vars',
      'buffs',
      'flags',
      'items',
    ];
  }

  /**
   * 특정 카테고리의 사용 가능한 변수 키 목록을 반환합니다.
   * @param category 카테고리
   * @returns 사용 가능한 키 배열
   */
  static getAvailableKeys(category: TextVariableCategory): string[] {
    const keys: string[] = [];

    Object.keys(TEXT_VARIABLES).forEach(fullKey => {
      if (fullKey.startsWith(`${category}:`)) {
        const key = fullKey.split(':')[1];
        keys.push(key);
      }
    });

    return keys;
  }
}
