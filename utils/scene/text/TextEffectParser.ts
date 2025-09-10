import {
  getDefaultColor,
  getDefaultDuration,
  getDefaultIntensity,
} from '../../../constants/animationConfig';
import { TEXT_EFFECTS_CONFIG } from '../../../constants/sceneConfig';
import {
  TextEffect,
  TextEffectType,
  TextParseResult,
  TextSegment,
} from '../../../types';

/**
 * 텍스트 파싱 결과 캐시 인터페이스
 */
interface ParsingCacheEntry {
  result: TextParseResult;
  timestamp: number;
}

/**
 * 텍스트 파싱 결과 캐시
 */
class ParsingCache {
  private cache = new Map<string, ParsingCacheEntry>();
  private readonly maxSize: number;
  private readonly expiryTime: number;

  constructor() {
    this.maxSize = TEXT_EFFECTS_CONFIG.caching.maxCacheSize;
    this.expiryTime = TEXT_EFFECTS_CONFIG.caching.cacheExpiryTime;
  }

  /**
   * 캐시에서 파싱 결과를 가져옵니다.
   */
  get(text: string): TextParseResult | null {
    if (!TEXT_EFFECTS_CONFIG.caching.enableParsingCache) {
      return null;
    }

    const entry = this.cache.get(text);
    if (!entry) {
      return null;
    }

    // 만료 시간 확인
    if (Date.now() - entry.timestamp > this.expiryTime) {
      this.cache.delete(text);
      return null;
    }

    return entry.result;
  }

  /**
   * 파싱 결과를 캐시에 저장합니다.
   */
  set(text: string, result: TextParseResult): void {
    if (!TEXT_EFFECTS_CONFIG.caching.enableParsingCache) {
      return;
    }

    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(text, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * 만료된 캐시 항목들을 정리합니다.
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.expiryTime) {
        expiredKeys.push(key);
      }
    }

    // 만료된 항목들 제거
    expiredKeys.forEach(key => this.cache.delete(key));

    // 여전히 크기가 크면 가장 오래된 항목들 제거
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = entries.slice(0, Math.floor(this.maxSize / 2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * 캐시를 완전히 비웁니다.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 캐시 통계를 반환합니다.
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// 전역 캐시 인스턴스
const parsingCache = new ParsingCache();

/**
 * 텍스트 효과 파서 클래스
 * 중괄호 태그(`{{tag}}텍스트{{tag}}`)를 파싱하여 텍스트 효과를 추출
 */
export class TextEffectParser {
  /**
   * 지원하는 텍스트 효과 타입들
   */
  private static readonly SUPPORTED_EFFECTS: TextEffectType[] = [
    // 텍스트 스타일 효과
    'bold',
    'italic',
    'underline',
    'highlight',
    // 색상 효과
    'red',
    'blue',
    'green',
    'yellow',
    'positive',
    'negative',
    'neutral',
    // 애니메이션 효과
    'shake',
    'glow',
    'fade',
    'scale',
    'wave',
    'pulse',
  ];

  /**
   * 텍스트를 파싱하여 텍스트 효과를 추출
   * @param text 파싱할 텍스트
   * @returns 파싱 결과
   */
  public static parse(text: string): TextParseResult {
    // 캐시에서 결과 확인
    const cachedResult = parsingCache.get(text);
    if (cachedResult) {
      return cachedResult;
    }

    const errors: string[] = [];
    const allEffects: TextEffect[] = [];
    const segments: TextSegment[] = [];

    try {
      // 빈 텍스트 처리
      if (!text || text.trim() === '') {
        const result = {
          originalText: text,
          segments: [
            { text, effects: [], startIndex: 0, endIndex: text.length },
          ],
          allEffects: [],
          hasErrors: false,
          errors: [],
        };

        // 캐시에 저장
        parsingCache.set(text, result);
        return result;
      }

      // 태그 쌍 매칭 및 효과 추출
      const effects = this.parseTagPairs(text, errors);
      allEffects.push(...effects);

      // 텍스트 세그먼트 생성
      const textSegments = this.createTextSegments(
        text,
        effects,
        errors.length > 0
      );
      segments.push(...textSegments);
    } catch (error) {
      errors.push(
        `파싱 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    const result = {
      originalText: text,
      segments,
      allEffects,
      hasErrors: errors.length > 0,
      errors,
    };

    // 캐시에 저장
    parsingCache.set(text, result);
    return result;
  }

  /**
   * 태그 쌍을 파싱하여 텍스트 효과를 생성
   * @param text 원본 텍스트
   * @param errors 에러 수집 배열
   * @returns 텍스트 효과 배열
   */
  private static parseTagPairs(text: string, errors: string[]): TextEffect[] {
    const effects: TextEffect[] = [];
    const stack: Array<{
      tag: string;
      startIndex: number;
      intensity?: number;
    }> = [];

    // 태그 매칭을 위한 정규식 ({{effect:value}} 형태 지원)
    const tagRegex = /\{\{([^}:]+)(?::([^}]+))?\}\}/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      const tag = match[1].toLowerCase();
      const intensityValue = match[2]; // intensity 값 (예: "2", "0.5")
      const index = match.index;

      // 지원하는 효과인지 확인
      if (!this.SUPPORTED_EFFECTS.includes(tag as TextEffectType)) {
        errors.push(`지원하지 않는 효과: ${tag} (위치: ${index})`);
        continue;
      }

      // intensity 값 파싱 (여는 태그에서만)
      let intensity: number | undefined;
      if (intensityValue) {
        const parsed = parseFloat(intensityValue);
        if (!isNaN(parsed) && parsed >= 0) {
          intensity = parsed;
        } else {
          errors.push(
            `잘못된 intensity 값: ${intensityValue} (위치: ${index})`
          );
          continue;
        }
      }

      // 스택의 맨 위 태그와 같은 태그인지 확인 (닫는 태그)
      if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
        const openingTag = stack.pop()!;

        // 효과 생성 (태그를 제외한 실제 텍스트 범위)
        const effect: TextEffect = {
          type: tag as TextEffectType,
          start:
            openingTag.startIndex +
            (openingTag.intensity ? match[0].length : tag.length + 4), // intensity가 있으면 전체 태그 길이, 없으면 기본 태그 길이
          end: index,
          intensity:
            openingTag.intensity ?? getDefaultIntensity(tag as TextEffectType),
          duration: getDefaultDuration(tag as TextEffectType),
          color: getDefaultColor(tag as TextEffectType),
        };

        effects.push(effect);
      } else {
        // 여는 태그로 스택에 추가
        stack.push({
          tag,
          startIndex: index,
          intensity,
        });
      }
    }

    // 매칭되지 않은 태그들 처리
    stack.forEach(unmatched => {
      errors.push(
        `매칭되지 않은 여는 태그: {{${unmatched.tag}}} (위치: ${unmatched.startIndex})`
      );
    });

    return effects;
  }

  /**
   * 텍스트 효과를 기반으로 텍스트 세그먼트를 생성
   * @param text 원본 텍스트
   * @param effects 텍스트 효과 배열
   * @returns 텍스트 세그먼트 배열
   */
  private static createTextSegments(
    text: string,
    effects: TextEffect[],
    hasErrors?: boolean
  ): TextSegment[] {
    // 1. 효과가 없거나 파싱 에러가 있으면 원본 텍스트 전체를 하나의 세그먼트로 반환
    if (effects.length === 0 || hasErrors) {
      return [
        {
          text,
          effects: [],
          startIndex: 0,
          endIndex: text.length,
        },
      ];
    }

    // 2. 원본 인덱스 → 정제된 텍스트 인덱스 매핑 테이블 생성
    const originToClean: number[] = [];
    let cleanText = '';
    let cleanIdx = 0;
    let i = 0;
    while (i < text.length) {
      if (text[i] === '{' && text[i + 1] === '{') {
        // 태그 시작
        let tagEnd = text.indexOf('}}', i);
        if (tagEnd === -1) break; // 잘못된 태그는 무시
        // 태그 구간의 모든 원본 인덱스에 대해 매핑을 현재 cleanIdx로 채움
        for (let j = i; j < tagEnd + 2; j++) {
          originToClean[j] = cleanIdx;
        }
        i = tagEnd + 2;
        continue;
      }
      originToClean[i] = cleanIdx;
      cleanText += text[i];
      cleanIdx++;
      i++;
    }
    originToClean[text.length] = cleanIdx;

    // 3. 효과의 start, end(원본 기준)를 정제된 텍스트 인덱스로 변환
    const mappedEffects = effects.map(effect => ({
      ...effect,
      start: originToClean[effect.start] ?? 0,
      end: originToClean[effect.end] ?? 0,
    }));

    // 4. 각 인덱스별로 적용되는 효과 목록을 만듦
    const effectStack: TextEffect[][] = Array.from(
      { length: cleanText.length + 1 },
      () => []
    );
    for (const effect of mappedEffects) {
      for (let idx = effect.start; idx < effect.end; idx++) {
        effectStack[idx].push(effect);
      }
    }
    // 5. 효과가 바뀔 때마다 세그먼트로 분할
    const segments: TextSegment[] = [];
    let segStart = 0;
    let prevKey = JSON.stringify(effectStack[0]);

    // idx=0부터 cleanText.length까지 순회
    for (let idx = 1; idx <= cleanText.length; idx++) {
      const currKey = JSON.stringify(effectStack[idx]);
      if (currKey !== prevKey) {
        segments.push({
          text: cleanText.slice(segStart, idx),
          effects: effectStack[segStart],
          startIndex: segStart,
          endIndex: idx,
        });
        segStart = idx;
        prevKey = currKey;
      }
    }
    // 마지막 세그먼트(누락 방지)
    if (segStart < cleanText.length) {
      segments.push({
        text: cleanText.slice(segStart),
        effects: effectStack[segStart],
        startIndex: segStart,
        endIndex: cleanText.length,
      });
    }
    // 빈 텍스트 세그먼트는 제외
    return segments.filter(seg => seg.text.length > 0);
  }

  /**
   * 텍스트에서 모든 태그를 제거하고 순수 텍스트만 반환
   * @param text 태그가 포함된 텍스트
   * @returns 태그가 제거된 순수 텍스트
   */
  public static removeTags(text: string): string {
    return text.replace(/\{\{[^}]+\}\}/g, '');
  }

  /**
   * 텍스트에 특정 효과가 포함되어 있는지 확인
   * @param text 검사할 텍스트
   * @param effectType 확인할 효과 타입
   * @returns 효과 포함 여부
   */
  public static hasEffect(text: string, effectType: TextEffectType): boolean {
    const tagRegex = new RegExp(`\\{\\{${effectType}(?::[^}]+)?\\}\\}`, 'i');
    return tagRegex.test(text);
  }

  /**
   * 텍스트에 포함된 모든 효과 타입을 반환
   * @param text 검사할 텍스트
   * @returns 포함된 효과 타입 배열
   */
  public static getEffectTypes(text: string): TextEffectType[] {
    const foundEffects: TextEffectType[] = [];

    for (const effectType of this.SUPPORTED_EFFECTS) {
      if (this.hasEffect(text, effectType)) {
        foundEffects.push(effectType);
      }
    }

    return foundEffects;
  }

  /**
   * 지원하는 효과 타입 목록 반환
   * @returns 지원하는 효과 타입 배열
   */
  public static getSupportedEffects(): TextEffectType[] {
    return [...this.SUPPORTED_EFFECTS];
  }
}
