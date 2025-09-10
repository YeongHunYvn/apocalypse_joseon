# 텍스트 로그라이크 게임 프로젝트

## 빌드 및 실행 방법

### 1. 의존성 설치

    npm install

### 2. Expo 개발 서버 시작

    npm start
    # 또는
    expo start

### 3. Expo Go 앱으로 실행

1. **iOS**: App Store에서 "Expo Go" 앱 설치
2. **Android**: Google Play에서 "Expo Go" 앱 설치
3. 터미널에 표시되는 QR 코드를 스캔하거나 링크를 클릭

### 4. 시뮬레이터/에뮬레이터 실행

    # iOS 시뮬레이터 (Mac에서만)
    npm run ios
    
    # Android 에뮬레이터
    npm run android
    
    # 웹 브라우저
    npm run web

### 5. 테스트 실행

    # 모든 테스트 실행
    npm test
    
    # 테스트 감시 모드
    npm run test:watch
    
    # 커버리지 리포트와 함께 테스트 실행
    npm run test:coverage
    
    # 단위 테스트만 실행
    npm run test:unit
    
    # 통합 테스트만 실행
    npm run test:integration

### 6. 코드 품질 관리

    # 린트 검사
    npm run lint
    
    # 린트 자동 수정
    npm run lint:fix
    
    # 코드 포맷팅
    npm run format
    
    # 타입 체크
    npm run type-check

### 7. 환경변수 설정

.env 파일을 참고하여 환경변수를 설정하세요.

---

## 주요 폴더 구조

- constants/  : 게임 상수 및 설정
- assets/       : 게임 데이터 (config/, chapters/, images/, docs/)
- screens/    : 화면 컴포넌트
- contexts/   : 상태 관리
- utils/      : 유틸리티 함수
- types/      : 타입 정의
- tests/      : 테스트 파일
  - unit/     : 단위 테스트
  - integration/ : 통합 테스트
  - fixtures/ : 테스트 데이터

---

## 개발 체크리스트

DEV-CHECKLIST.md 참고

---

## 🤝 기여하기

### 협업 규칙

프로젝트에 기여하기 전에 다음 문서들을 확인해주세요:

- **[기여자 가이드](./CONTRIBUTOR-GUIDE.md)** - 작업 플로우 및 코드 작성 규칙
- **[커밋 메시지 컨벤션](./COMMIT-CONVENTION.md)** - 커밋 메시지 작성 규칙
- **[PR 템플릿](./.github/pull_request_template.md)** - Pull Request 작성 가이드

### 개발 환경 설정

1. **필수 도구 설치**
   - Node.js (v18 이상)
   - React Native CLI
   - VS Code (권장)

2. **VS Code 확장 프로그램**
   - ESLint, Prettier, TypeScript Importer
   - React Native Tools
   - GitLens

3. **프로젝트 설정**
   ```bash
   git clone [repository-url]
   cd project-tg
   npm install
   ```

### 코드 품질 관리

- **ESLint**: 코드 품질 검사 및 자동 수정
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 안전성 보장
- **Jest**: 테스트 프레임워크

### 브랜치 전략

- `main`: 안정적인 메인 브랜치
- `feature/*`: 새로운 기능 개발
- `fix/*`: 버그 수정
- `refactor/*`: 코드 리팩토링

### 커밋 규칙

커밋 메시지는 다음 형식을 따릅니다:
```
<type>(<scope>): <subject>

<body>

<footer>
```

예시:
```
feat(scene): 씬 엔진에 확률 분기 기능 추가

- 확률 기반 선택지 처리 로직 구현
- 성공/실패에 따른 분기 처리

Closes #123
``` 

## 📋 시스템 플래그 관리

### 시스템 플래그 상수 (`/constants/systemFlags.ts`)

게임 로직에서 직접 참조하는 중요한 플래그들의 ID를 상수로 관리합니다. JSON 파일에서 플래그 ID가 변경되어도 이 파일만 수정하면 됩니다.

```typescript
import { SYSTEM_FLAGS } from './constants/systemFlags';

// ✅ 좋은 예: 상수 사용
if (gameState.flags.includes(SYSTEM_FLAGS.FORCE_GAMEOVER)) {
  // 게임오버 처리
}

// ❌ 나쁜 예: 하드코딩
if (gameState.flags.includes('force_gameover')) {
  // 게임오버 처리  
}
```

### 지원되는 시스템 플래그

- `SYSTEM_FLAGS.FORCE_GAMEOVER`: 강제 게임오버
- `SYSTEM_FLAGS.FIRST_VISIT`: 첫 방문
- `SYSTEM_FLAGS.CHAPTER_COMPLETE`: 챕터 완료
- `SYSTEM_FLAGS.FLOOR_COMPLETE`: 층 완료
- `SYSTEM_FLAGS.READY_TO_EXPLORE`: 탐험 준비 완료 
