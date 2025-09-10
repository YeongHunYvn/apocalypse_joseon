import { ImageParseResult } from '../../../constants/imageConfig';
import { GameState, Scene, SceneEffects } from '../../../types';

import { Logger } from '../../system/Logger';
import { ConditionChecker } from '../conditions/ConditionChecker';
import { EffectApplier } from '../effects/EffectApplier';
import { ImageParser } from './ImageParser';
import { TextVariableParser } from './TextVariableParser';

/**
 * 텍스트 처리 결과 인터페이스
 */
export interface TextProcessResult {
  /** 처리된 텍스트 (이미지 태그 제거됨) */
  text: string;
  /** 이미지 파싱 결과 */
  imageResult: ImageParseResult;
  /** 처리 오류 */
  errors: string[];
}

/**
 * 텍스트 처리기
 * 씬 텍스트 처리, 조건부 텍스트 로직, 변수 치환, 이미지 파싱을 담당합니다.
 */
export class TextProcessor {
  /**
   * 씬의 동적 텍스트를 계산합니다.
   * @param scene - 텍스트를 계산할 씬
   * @param gameState - 게임 상태
   * @returns 조건에 맞는 텍스트 또는 기본 텍스트
   */
  static getSceneText(scene: Scene, gameState: GameState): string {
    return TextProcessor.getSceneTextInternal(scene, gameState);
  }

  /**
   * 텍스트에 변수를 적용하고 처리합니다.
   * 변수 치환 → 이미지 파싱 → 텍스트 효과 파싱 순서로 처리합니다.
   * @param text - 처리할 텍스트
   * @param gameState - 게임 상태
   * @returns 변수가 치환되고 이미지가 제거된 텍스트
   */
  static processTextWithVariables(text: string, gameState: GameState): string {
    const result = TextProcessor.processTextWithImages(text, gameState);
    return result.text;
  }

  /**
   * 변수만 치환하고 이미지 태그는 유지합니다.
   * RevealTextWrapper에서 이미지 처리를 하기 위해 사용됩니다.
   * @param text - 처리할 텍스트
   * @param gameState - 게임 상태
   * @returns 변수가 치환되고 이미지 태그가 유지된 텍스트
   */
  static processTextVariablesOnly(text: string, gameState: GameState): string {
    // 변수 치환만 수행하고 이미지 태그는 유지
    const variableResult = TextVariableParser.parse(text, gameState);

    if (variableResult.errors.length > 0) {
      Logger.warn('[TextProcessor]', '변수 파싱 오류:', variableResult.errors);
    }

    return variableResult.text;
  }

  /**
   * 텍스트를 완전히 처리하여 이미지 정보도 함께 반환합니다.
   * 변수 치환 → 이미지 파싱 순서로 처리합니다.
   * @param text - 처리할 텍스트
   * @param gameState - 게임 상태
   * @returns 텍스트 처리 결과 (이미지 정보 포함)
   */
  static processTextWithImages(
    text: string,
    gameState: GameState
  ): TextProcessResult {
    const errors: string[] = [];

    // 1단계: 변수 치환
    const variableResult = TextVariableParser.parse(text, gameState);

    if (variableResult.errors.length > 0) {
      Logger.warn('[TextProcessor]', '변수 파싱 오류:', variableResult.errors);
      errors.push(...variableResult.errors);
    }

    // 2단계: 이미지 파싱
    const imageResult = ImageParser.parse(variableResult.text);

    if (imageResult.errors.length > 0) {
      Logger.warn('[TextProcessor]', '이미지 파싱 오류:', imageResult.errors);
      errors.push(...imageResult.errors);
    }

    // 3단계: 결과 반환 (텍스트 효과 파싱은 EffectText에서 처리)
    return {
      text: imageResult.text, // 이미지 태그가 제거된 텍스트
      imageResult,
      errors,
    };
  }

  /**
   * 씬의 동적 텍스트를 계산하는 내부 구현 함수
   * @param scene - 텍스트를 계산할 씬
   * @param gameState - 효과가 이미 적용된 게임 상태
   * @returns 조건에 맞는 텍스트 또는 기본 텍스트
   */
  private static getSceneTextInternal(
    scene: Scene,
    gameState: GameState
  ): string {
    let resultText = scene.text;

    // conditional_text가 있으면 처리
    if (scene.conditional_text) {
      // 배열인 경우 (조건부 텍스트)
      if (Array.isArray(scene.conditional_text)) {
        // 효과가 이미 적용된 상태를 기준으로 조건 확인
        for (const conditionalText of scene.conditional_text) {
          if (
            ConditionChecker.checkCondition(
              conditionalText.condition,
              gameState
            )
          ) {
            resultText = conditionalText.text;
            break;
          }
        }
      } else {
        // 문자열인 경우 (기존 방식)
        resultText = scene.conditional_text;
      }
    }

    // 변수 치환만 적용 (이미지 태그 유지)
    return TextProcessor.processTextVariablesOnly(resultText, gameState);
  }

  /**
   * 디버깅용: 효과를 임시로 적용하여 텍스트를 계산합니다.
   * 개발 및 테스트 목적으로만 사용하세요.
   *
   * @param scene - 텍스트를 계산할 씬
   * @param gameState - 원본 게임 상태
   * @param effects - 적용할 효과
   * @returns 효과 적용 후 텍스트
   */
  static getSceneTextWithEffects(
    scene: Scene,
    gameState: GameState,
    effects: SceneEffects
  ): string {
    const stateWithEffects = EffectApplier.applyEffects(effects, gameState);
    return TextProcessor.getSceneTextInternal(scene, stateWithEffects);
  }

  /**
   * 조건부 텍스트를 처리합니다.
   * @param conditionalTexts - 조건부 텍스트 배열
   * @param gameState - 게임 상태
   * @param defaultText - 기본 텍스트
   * @returns 조건에 맞는 텍스트 또는 기본 텍스트
   */
  static processConditionalText(
    conditionalTexts: Array<{ condition: any; text: string }>,
    gameState: GameState,
    defaultText: string
  ): string {
    for (const conditionalText of conditionalTexts) {
      if (
        ConditionChecker.checkCondition(conditionalText.condition, gameState)
      ) {
        return TextProcessor.processTextWithVariables(
          conditionalText.text,
          gameState
        );
      }
    }
    return TextProcessor.processTextWithVariables(defaultText, gameState);
  }
}
