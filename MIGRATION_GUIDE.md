# 웹소설 티어 앱 모듈화 마이그레이션 가이드

## 📊 최종 모듈화 완료

**분리 통계:**
- **총 줄 수**: 30,139줄 (원본 대비 100.6%)
- **원본**: 29,954줄
- **파일 수**: 96개

**디렉토리별 통계:**
| 디렉토리 | 파일 수 | 줄 수 | 역할 |
|----------|---------|-------|------|
| constants | 6 | 1,573 | 상수 정의 |
| utils | 2 | 574 | 유틸리티 함수 |
| database | 4 | 736 | SQLite 레이어 |
| contexts | 5 | 1,476 | React Context |
| components | 30 | 8,301 | UI 컴포넌트 |
| services | 7 | 3,453 | 비즈니스 서비스 |
| screens | 15 | 8,942 | 화면 컴포넌트 |
| hooks | 13 | 1,833 | 커스텀 훅 |
| handlers | 12 | 2,735 | 핸들러 |
| App.jsx | 1 | 444 | 메인 앱 |
| index.js | 1 | 72 | 진입점 |
| **합계** | **96** | **30,139** | |

---

## 📁 전체 디렉토리 구조

```
src/ (30,139줄, 96파일)
├── App.jsx           444줄 - 메인 앱 컴포넌트
├── index.js           72줄 - 진입점
│
├── constants/      1,573줄 (6 files)
│   ├── theme.js          - 테마 상수
│   ├── tiers.js          - 티어 정의
│   ├── tags.js           - 태그 상수
│   ├── awards.js         - 수상 상수
│   ├── options.js        - 옵션 상수
│   └── index.js
│
├── utils/            574줄 (2 files)
│   ├── helpers.js        - 유틸리티 함수
│   └── index.js
│
├── database/         736줄 (4 files)
│   ├── connection.js     - DB 연결
│   ├── matchQueue.js     - 매칭 큐
│   ├── tagMigration.js   - 태그 마이그레이션
│   └── index.js
│
├── contexts/       1,476줄 (5 files)
│   ├── ThemeContext.js   - 테마 컨텍스트
│   ├── AppContext.js     - 앱 컨텍스트
│   ├── NovelContext.js   - 작품 컨텍스트
│   ├── SettingsContext.js - 설정 컨텍스트
│   └── index.js
│
├── components/     8,301줄 (30 files)
│   ├── common/       1,110줄 (3 files)
│   │   ├── buttons.js
│   │   ├── indicators.js
│   │   └── index.js
│   ├── novel/        1,000줄 (4 files)
│   │   ├── CoverImage.js
│   │   ├── AwardsRow.js
│   │   ├── NovelCard.js
│   │   └── index.js
│   ├── modals/       6,969줄 (18 files)
│   │   ├── EditNovelModal.js
│   │   ├── LogModal.js
│   │   ├── ImportModal.js
│   │   ├── ExportModal.js
│   │   ├── TagSelectModal.js
│   │   ├── TagManagerModal.js
│   │   ├── TagEditModal.js
│   │   ├── TagRelationModal.js
│   │   ├── SearchTagModal.js
│   │   ├── PlannedEditModal.js
│   │   ├── SupplementSettingsModal.js
│   │   ├── CoordManageModal.js
│   │   ├── CoverSelectModal.js
│   │   ├── CompareModal.js
│   │   ├── UrlModal.js
│   │   ├── CoordinateGridView.js
│   │   ├── TagItem.js
│   │   └── index.js
│   ├── navigation/     180줄 (3 files)
│   │   ├── Nav.js
│   │   ├── LoadingOverlay.js
│   │   └── index.js
│   └── charts/          42줄 (1 file)
│       └── index.js
│
├── services/       3,453줄 (7 files)
│   ├── eloService.js           - Elo 계산
│   ├── analysisService.js      - 분석 서비스
│   ├── backupService.js        - 백업/복원
│   ├── coverService.js         - 표지 서비스
│   ├── patternLearningService.js - 패턴 학습
│   ├── matchInsightsService.js - 매칭 인사이트
│   └── index.js
│
├── screens/        8,942줄 (15 files)
│   ├── HomeScreen.js
│   ├── RankScreen.js
│   ├── MatchScreen.js
│   ├── RecoScreen.js
│   ├── BulkScreen.js
│   ├── AnalysisScreen.js
│   ├── TasteAnalysisScreen.js
│   ├── AwardsScreen.js
│   ├── SettingsScreen.js
│   ├── PlannedScreen.js
│   ├── RecentScreen.js
│   ├── ReviewScreen.js
│   ├── SupplementScreen.js
│   ├── CoversScreen.js
│   └── index.js
│
├── hooks/          1,833줄 (13 files)
│   ├── useAppState.js        - 앱 전역 상태
│   ├── useNovelFormState.js  - 작품 등록 폼
│   ├── useEditFormState.js   - 편집 폼
│   ├── useFilterState.js     - 필터 상태
│   ├── useMatchState.js      - 매칭 상태
│   ├── useTagState.js        - 태그 상태
│   ├── useModalState.js      - 모달 상태
│   ├── usePlannedState.js    - 예정 작품
│   ├── usePatternLearning.js - 패턴 학습
│   ├── useAnalysis.js        - 분석
│   ├── useComputed.js        - 계산된 값
│   ├── useInitialization.js  - 초기화
│   └── index.js
│
└── handlers/       2,735줄 (12 files)
    ├── novelHandlers.js        - 작품 CRUD (323줄)
    ├── tagHandlers.js          - 태그 관리 (366줄)
    ├── tagEditHandlers.js      - 태그 편집 (250줄)
    ├── tagRelationHandlers.js  - 태그 관계 (247줄)
    ├── matchAnalysisHandlers.js - 매칭 분석 (244줄)
    ├── matchHandlers.js        - 매칭 (222줄)
    ├── utilHandlers.js         - 유틸리티 (227줄)
    ├── coverHandlers.js        - 표지 (202줄)
    ├── plannedHandlers.js      - 예정 작품 (184줄)
    ├── insightHandlers.js      - 인사이트 (161줄)
    ├── recoHandlers.js         - 추천 (129줄)
    └── index.js                - (180줄)
```

---

## 🚀 사용법

```javascript
// App.jsx 사용
import { App } from './src';

// 또는 개별 모듈 사용
import {
  // 테마
  LightTheme, DarkTheme,
  
  // 화면
  HomeScreen, MatchScreen, RankScreen,
  
  // 모달
  EditNovelModal, ImportModal, TagSelectModal,
  
  // 컴포넌트
  Nav, LoadingOverlay, CoverImage,
  
  // 훅
  useAppState, useNovelFormState, useMatchState,
  
  // 핸들러
  addNovel, removeNovel, decideMatch,
  refreshDailyRecommendation, loadCoverLibrary,
  
  // 서비스
  rebuildAllFromMatches, buildUltraCompactBackup,
  
} from './src';
```

---

## 📦 패키지 정보

- **버전**: v5.0 (모듈화 완료)
- **파일 수**: 96개
- **총 줄 수**: 30,139줄
- **원본 대비**: 100.6%
