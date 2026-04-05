# 웹소설 티어 랭킹 앱 (Novel Tier Ranking)

Expo React Native (SDK 54) 기반 웹소설 티어 랭킹 앱.
ELO 매칭 시스템으로 작품 간 대전을 통해 자동으로 티어를 산출한다.

## 아키텍처

- **단일 파일 구조**: `App.jsx` (~41,000줄) 하나에 모든 로직이 들어있음
- **SQLite** (expo-sqlite, WAL 모드) — 30+ 테이블
- **다중 슬롯**: 최대 10개 독립 데이터셋, 슬롯별 별도 DB 파일

## 빌드/실행

```bash
npx expo start          # 개발 서버
eas build -p android --profile preview  # APK 빌드
```

## App.jsx 섹션 맵

> 줄 번호는 근사값. 정확한 위치는 섹션 마커 `═══`이나 함수명으로 검색할 것.
> **전체를 읽지 말고, 아래 맵을 참고하여 offset/limit으로 필요 섹션만 읽을 것.**

| 줄 범위 (약) | 섹션 | 검색 키워드 |
|---|---|---|
| 1-2388 | 헤더 문서 (버전 히스토리, 불변규칙, 버그 수정 기록) | `╔══`, `불변조건` |
| 2391-2420 | import 선언 | `import React` |
| 2420-2510 | 글로벌 변수/ErrorBoundary/슬롯 시스템 | `ErrorBoundary`, `slotSystem` |
| 2510-2730 | 슬롯 CRUD, DB 슬롯 전환, flush | `슬롯 생성`, `슬롯 전환` |
| 2730-2830 | DB 초기화 (openDb, initDb) | `데이터베이스 초기화`, `openDb` |
| 2830-3100 | 성능 모니터링 시스템 | `Performance Monitor`, `perfMonitor` |
| 3100-3400 | safeDbOperation + 매칭 큐 시스템 | `safeDbOperation`, `matchQueue` |
| 3400-3870 | DB 유틸리티 (exec, all, first, execBatch, 마이그레이션) | `ensureColumn`, `migration` |
| 3870-4470 | 취향 분석 시스템 (analyzePreferences, preference_patterns) | `analyzePreferences`, `preference_patterns` |
| 4470-4620 | 티어 시스템 상수 (TIER_ORDER, DEFAULT_TIER_SYSTEM_CONFIG, TIER_PRESETS) | `TIER_ORDER`, `TIER_PRESETS` |
| 4620-4730 | 티어 헬퍼 함수 (getTierColor, tierFromRating 등) | `getTierColor`, `tierFromRating` |
| 4730-4950 | 순수 유틸리티 (uuid, safeParseJSON, parsePlatforms 등) | `uuid()`, `safeParseJSON` |
| 4950-5090 | 장르/태그 파싱, 통계 헬퍼 | `getWinRate`, `wilsonConfidence` |
| 5090-5360 | 색상 상수(C), 플랫폼/상태 옵션, 대형 장르 상수 | `const C =`, `PLATFORM_OPTIONS` |
| 5360-5870 | 태그 상수 (MAJOR_GENRES, SUB_GENRES, ALL_GENERAL_TAGS) | `MAJOR_GENRES`, `SUB_GENRES` |
| 5870-6910 | 태그 관련 유틸리티 (WORK_IDENTIFIERS, TAG_ALIASES 등) | `WORK_IDENTIFIERS`, `TAG_ALIASES` |
| 6910-7510 | 스펙트럼/좌표계, ELO 계산 | `SPECTRUM_GROUPS`, `expected()`, `applyElo` |
| 7510-8460 | 백업/복원 시스템 (JSON v9) | `exportAllData`, `importBackup` |
| 8460-9500 | UI 기본 컴포넌트 (Chip, PrimaryButton, TierTag, GenreBadge 등) | `const Chip = memo`, `TierTag` |
| 9500-12200 | NovelCard + TagSelectModal | `const NovelCard = memo` |
| 12200-12890 | SearchTagModal, TagEditModal | `SearchTagModal`, `TagEditModal` |
| 12890-13700 | TagRelationModal, CoordinateGridView | `TagRelationModal`, `CoordinateGridView` |
| 13700-15160 | TagManagerModal | `TagManagerModal` |
| 15160-15220 | PlatformChips | `PlatformChips` |
| 15220-16960 | AwardsScreen | `AwardsScreen` |
| 16960-17080 | 차트 컴포넌트 (BarChart, RadarChart, PieChart, Heatmap) | `BarChart`, `RadarChartSimple` |
| 17080-20300 | TasteAnalysisScreen | `TasteAnalysisScreen` |
| 20300-41400 | App() 메인 컴포넌트 (useState ~200개, useEffect, 매칭 엔진, CRUD, 모든 탭 JSX) | `export default function App` |
| 41400-41427 | App() export | `export default` |

## 절대 준수 규칙 (App.jsx 11-42줄)

매칭 시스템 5대 불변조건 — **위반 시 크래시/데이터 오염 발생**:

1. **자동매칭 중 Alert.alert() 호출 금지** — `isAutoMatchingRef.current === true`일 때 Alert 금지
2. **매칭 큐 내부에서 React state 직접 참조 금지** — 스냅샷만 사용 (stale closure 방지)
3. **큐 외부 write 타이머는 flush 전 queue drain 대기** — `waitForMatchQueueDrain()` 호출 필수
4. **SQLITE_BUSY 시 resetDbConnection 금지** — 경합은 jitter 재시도만, 연결 오류와 분리
5. **자동매칭 루프는 모든 비동기 경로에 catch/finally 강제** — 누락 시 unhandled rejection 크래시

## 개발 지침

- 새 기능 추가 시 해당 섹션의 기존 패턴을 먼저 읽고 동일 패턴으로 작성
- DB 작업은 반드시 `safeDbOperation` 래퍼 사용
- 현재 단일 파일 구조 — 새 파일 생성 불필요, App.jsx 내에서 작업
- memo() 컴포넌트는 props 변경에만 리렌더링됨을 고려하여 설계
- App.jsx 수정 시 반드시 헤더 버전 히스토리 (1~290줄) 업데이트: 버전 번호 증가, 날짜 갱신, 변경 내역 추가
