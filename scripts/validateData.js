#!/usr/bin/env node

/**
 * 데이터 검증 스크립트
 *
 * 이 스크립트는 다음을 검증합니다:
 * 1. JSON 데이터 파일의 구조와 내용
 * 2. 더미 씬 파일의 유효성
 * 3. ID 중복 및 참조 무결성
 *
 * 사용법:
 *   node scripts/validateData.js
 *   npm run validate-data
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// 🎯 설정 및 상수
// ==========================================

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const PATHS = {
  dataDir: path.join(__dirname, '..', 'assets'),
  dummyDir: path.join(__dirname, '..', 'assets', 'dummy'),
  buffs: path.join(__dirname, '..', 'assets', 'config', 'buffs.json'),
  flags: path.join(__dirname, '..', 'assets', 'config', 'flags.json'),
  items: path.join(__dirname, '..', 'assets', 'config', 'items.json'),
};

let errors = [];
let warnings = [];
let info = [];

// ==========================================
// 🔧 유틸리티 함수
// ==========================================

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function addError(message) {
  errors.push(message);
  log(`❌ ${message}`, 'red');
}

function addWarning(message) {
  warnings.push(message);
  log(`⚠️  ${message}`, 'yellow');
}

function addInfo(message) {
  info.push(message);
  log(`ℹ️  ${message}`, 'blue');
}

function loadJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      addError(`파일이 존재하지 않습니다: ${filePath}`);
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    addError(`JSON 파싱 오류 (${filePath}): ${error.message}`);
    return null;
  }
}

function validateJsonStructure(data, expectedKeys, fileName) {
  if (!data || typeof data !== 'object') {
    addError(`${fileName}: 올바른 JSON 객체가 아닙니다.`);
    return false;
  }

  let isValid = true;

  for (const [id, item] of Object.entries(data)) {
    // ID 형식 검증
    if (!id || typeof id !== 'string' || id.trim() === '') {
      addError(`${fileName}: 잘못된 ID '${id}'`);
      isValid = false;
      continue;
    }

    // 필수 키 검증
    for (const key of expectedKeys) {
      if (!(key in item)) {
        addError(`${fileName}: ID '${id}'에 필수 키 '${key}'가 없습니다.`);
        isValid = false;
      }
    }
  }

  return isValid;
}

// ==========================================
// 📋 데이터 검증 함수들
// ==========================================

/**
 * 상태(버프) 데이터 검증
 */
function validateBuffsData() {
  log('=== 상태 데이터 검증 ===', 'cyan');

  const buffsData = loadJsonFile(PATHS.buffs);
  if (!buffsData) return false;

  const expectedKeys = [
    'id',
    'displayName',
    'description',
    'temporary',
    'category',
  ];
  let isValid = validateJsonStructure(buffsData, expectedKeys, 'buffs.json');

  // temporary 속성 검증
  for (const [id, buff] of Object.entries(buffsData)) {
    if (typeof buff.temporary !== 'boolean') {
      addError(`buffs.json: ID '${id}'의 temporary 속성이 boolean이 아닙니다.`);
      isValid = false;
    }
  }

  // 통계 출력
  const totalBuffs = Object.keys(buffsData).length;
  const temporaryBuffs = Object.values(buffsData).filter(
    buff => buff.temporary
  ).length;
  const permanentBuffs = totalBuffs - temporaryBuffs;

  addInfo(
    `상태 총 ${totalBuffs}개 (임시: ${temporaryBuffs}개, 영구: ${permanentBuffs}개)`
  );

  return isValid;
}

/**
 * 플래그 데이터 검증
 */
function validateFlagsData() {
  log('=== 플래그 데이터 검증 ===', 'cyan');

  const flagsData = loadJsonFile(PATHS.flags);
  if (!flagsData) return false;

  const expectedKeys = ['id', 'displayName', 'description', 'category'];
  let isValid = validateJsonStructure(flagsData, expectedKeys, 'flags.json');

  // 카테고리별 통계
  const totalFlags = Object.keys(flagsData).length;
  const categories = {};

  for (const flag of Object.values(flagsData)) {
    const category = flag.category || 'unknown';
    categories[category] = (categories[category] || 0) + 1;
  }

  const categoryText = Object.entries(categories)
    .map(([cat, count]) => `${cat}: ${count}개`)
    .join(', ');

  addInfo(`플래그 총 ${totalFlags}개 (${categoryText})`);

  return isValid;
}

/**
 * 아이템 데이터 검증
 */
function validateItemsData() {
  log('=== 아이템 데이터 검증 ===', 'cyan');

  const itemsData = loadJsonFile(PATHS.items);
  if (!itemsData) return false;

  const expectedKeys = ['id', 'name', 'description', 'persist'];
  let isValid = validateJsonStructure(itemsData, expectedKeys, 'items.json');

  // 지속성 통계
  const totalItems = Object.keys(itemsData).length;
  const persistentItems = Object.values(itemsData).filter(
    item => item.persist
  ).length;
  const temporaryItems = totalItems - persistentItems;

  addInfo(
    `아이템 총 ${totalItems}개 (영구: ${persistentItems}개, 임시: ${temporaryItems}개)`
  );

  return isValid;
}

/**
 * 더미 씬 데이터 검증
 */
function validateDummyScenes() {
  log('=== 더미 씬 데이터 검증 ===', 'cyan');

  if (!fs.existsSync(PATHS.dummyDir)) {
    addWarning('더미 씬 디렉토리가 존재하지 않습니다.');
    return true; // 더미 파일은 선택사항이므로 경고만 출력
  }

  // TODO: 더미 씬 검증 로직 구현
  addInfo('더미 씬 검증은 아직 구현되지 않았습니다.');
  return true;
}

/**
 * ID 참조 무결성 검증 (챕터 내 유일성 전제)
 */
function validateReferentialIntegrity() {
  log('=== ID 참조 무결성 검증 ===', 'cyan');

  const buffsData = loadJsonFile(PATHS.buffs);
  const flagsData = loadJsonFile(PATHS.flags);
  const itemsData = loadJsonFile(PATHS.items);

  if (!buffsData || !flagsData || !itemsData) {
    addError(
      '기본 데이터 파일을 로드할 수 없어 참조 무결성 검증을 건너뜁니다.'
    );
    return false;
  }

  // 유효한 ID 세트 생성 (기본 데이터)
  const validBuffIds = new Set(Object.keys(buffsData));
  const validFlagIds = new Set(Object.keys(flagsData));
  const validItemIds = new Set(Object.keys(itemsData));

  addInfo(
    `참조 가능한 ID: 상태 ${validBuffIds.size}개, 플래그 ${validFlagIds.size}개, 아이템 ${validItemIds.size}개`
  );

  // 씬/챕터 데이터: 에셋에서 챕터 JSON을 읽어 각 챕터 내 scene_id 유일성 확인
  try {
    const chaptersDir = path.join(PATHS.dataDir, 'chapters');
    if (fs.existsSync(chaptersDir)) {
      const files = fs
        .readdirSync(chaptersDir)
        .filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const chapterPath = path.join(chaptersDir, file);
        const chapter = loadJsonFile(chapterPath);
        if (!chapter || !Array.isArray(chapter.scenes)) return;

        const seenIds = new Set();
        chapter.scenes.forEach(scene => {
          if (!scene || typeof scene.id !== 'string') return;
          if (seenIds.has(scene.id)) {
            addError(`${file}: 챕터 내 중복된 scene_id 발견 → '${scene.id}'`);
          } else {
            seenIds.add(scene.id);
          }
        });
      });
      addInfo('챕터 내 scene_id 유일성 검증 완료');
    } else {
      addWarning(
        'chapters 디렉토리를 찾지 못했습니다. 씬 유일성 검증을 건너뜁니다.'
      );
    }
  } catch (e) {
    addWarning(`씬 유일성 검증 중 오류: ${e.message}`);
  }

  // TODO: next 참조 무결성(같은 챕터 내 scene_id 또는 chapter_id+scene_id) 추가 검증 가능

  return true;
}

// ==========================================
// 🚀 메인 실행 함수
// ==========================================

function main() {
  log('🔍 텍스트 게임 데이터 검증 시작', 'green');
  log('===============================', 'green');
  console.log();

  const validationResults = [
    validateBuffsData(),
    validateFlagsData(),
    validateItemsData(),
    validateDummyScenes(),
    validateReferentialIntegrity(),
  ];

  console.log();
  log('==================================================', 'magenta');
  log('📊 검증 결과 요약', 'magenta');
  log('==================================================', 'magenta');

  const allValid = validationResults.every(result => result);

  if (allValid) {
    log('✅ 모든 검증을 통과했습니다!', 'green');
    process.exit(0);
  } else {
    if (errors.length > 0) {
      log(`❌ 오류 ${errors.length}개 발견`, 'red');
    }
    if (warnings.length > 0) {
      log(`⚠️  경고 ${warnings.length}개`, 'yellow');
    }
    if (info.length > 0) {
      log(`ℹ️  정보 ${info.length}개`, 'blue');
    }

    console.log();

    if (errors.length > 0) {
      log('🚨 오류 목록:', 'red');
      errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error}`, 'red');
      });
      console.log();
    }

    if (warnings.length > 0) {
      log('⚠️  경고 목록:', 'yellow');
      warnings.forEach((warning, index) => {
        log(`  ${index + 1}. ${warning}`, 'yellow');
      });
    }

    log('종료 코드: 1', 'red');
    process.exit(1);
  }
}

// 스크립트 시작
if (require.main === module) {
  main();
}

// 테스트용 내보내기
module.exports = {
  validateBuffsData,
  validateFlagsData,
  validateItemsData,
  validateDummyScenes,
  validateReferentialIntegrity,
};
