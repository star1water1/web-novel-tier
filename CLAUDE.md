# 웹소설 티어 랭킹 앱 (Novel Tier)

Expo SDK 54 · React Native 기반 Android 앱. 슬롯(최대 10개, 슬롯별 SQLite 파일)마다 웹소설/웹툰 모드와 티어 방식(ELO 매칭, hybrid, manual)을 갖는다.

## 개발 원칙

목표는 앱을 다시 만드는 것이 아니라, 기존 자산을 보존하면서 앞으로의 개발을 독립적으로 만드는 것이다.

- **기존 코드 보존:** `App.jsx`를 전면 리팩터링하거나 코드를 옮기기만 하는 분리를 하지 않는다. 기존 기능의 수정·보강은 `App.jsx` 안에서 기존 패턴대로 한다.
- **신규 기능 독립:** `src/features/<기능>/`에 만들고 `App.jsx`에는 import와 호출만 둔다. `App.jsx`를 import하지 않는다. DB 함수나 `isBlocked` 같은 의존성은 인자로 받는다 (`src/features/file-backup` 참고).
- **네이티브:** Expo API로 충분한지 먼저 보고, 부족한 부분만 `modules/`에 Kotlin으로 만든다. 파일 접근은 `src/features/file-access/README.md`를 따른다.
- **작은 단위:** 한 번에 하나씩 바꾸고 검증한다.
- **데이터 호환:** DB·백업·설정은 추가만 한다. 기존 항목의 의미를 바꾸거나 없애지 않고, 옛 백업과 옛 DB도 계속 읽혀야 한다. 파일 삭제·덮어쓰기는 슬롯 간 공유 파일을 확인하고 안전장치를 둔다.
- **제품:** 재미보다 정확성·신뢰성·편의성을 앞세운다. 등록·매칭·순위의 안정성이 최우선이고, 실험적 기능보다 기존 기능의 완성도를 중시한다. 의견이 갈리는 동작은 옵션으로 열되, 아무 설정 없이도 잘 돌아가는 기본값을 둔다.

## 절대 준수 규칙

매칭 시스템 5대 불변조건. **위반 시 크래시/데이터 오염이 발생한다.**

1. **자동매칭 중 `Alert.alert()` 호출 금지:** `isAutoMatchingRef.current === true`일 때. 새 모듈은 `isBlocked`를 받아 지킨다.
2. **매칭 큐 내부에서 React state 직접 참조 금지:** 스냅샷만 쓴다 (stale closure 방지).
3. **큐 외부 write 타이머는 flush 전 queue drain 대기:** `waitForMatchQueueDrain()` 호출.
4. **`SQLITE_BUSY` 시 `resetDbConnection` 금지:** 경합은 jitter 재시도만 하고 연결 오류와 분리한다.
5. **자동매칭 루프의 모든 비동기 경로에 catch/finally 강제:** 누락 시 unhandled rejection 크래시.

그 밖의 규칙:

- DB 작업은 `safeDbOperation`을 거친다. SQLite 파일을 직접 복사·이동하지 않는다.
- hybrid 모드의 시스템 경로(finalize의 `manual_order`/`manual_tier` UPDATE)는 검증 트리거를 걸지 않는다 (무한 루프 방지). 자세한 설계는 `docs/hybrid-verification.md`.
- `memo()` 컴포넌트는 props 변경에만 리렌더링됨을 고려한다.

## App.jsx 찾아보기

약 7만 줄이다. **전체를 읽지 말고** 이름으로 Grep한 뒤 offset/limit으로 읽는다. 줄번호를 문서에 적지 않는다.

| 영역 | 검색어 |
|---|---|
| DB·슬롯 | `safeDbOperation`, `ensureColumn`, `getSlotDbFilename`, `applySlotMode`, `MODE_PROFILES` |
| 티어·매칭 | `TIER_PRESETS`, `applyElo`, `enqueueMatchTask`, `waitForMatchQueueDrain` |
| hybrid 검증 | `HybridVerificationView`, `enqueueVerification`, `finalizeVerificationSession` |
| 태그 | `MAJOR_GENRES`, `TagManagerModal`, `updateTagRegistryFn` |
| 백업·클라우드 | `exportJSON`, `importJSON`, `buildUltraCompactBackup`, `buildExtendedBackup`, `cloudIsConfigured` |
| 스크래퍼·추천 | `fetchNovelMeta`, `searchNovels`, `fetchWebRecommendations`, `refreshDailyRecommendation` |
| 화면 | `AwardsScreen`, `TasteAnalysisScreen`, `NovelCard`, `screen ===` |

## 검증

```bash
npx --yes esbuild App.jsx --loader:.jsx=jsx --jsx=automatic --outfile=/dev/null
node docs/scraper-test.mjs
```

구문과 스크래퍼 회귀만 확인된다. 화면과 기기 동작은 폰에서 확인해야 하므로, 확인하지 못했으면 그렇게 보고한다.

## 기록

`App.jsx`의 동작을 바꾸면 `APP_VERSION`을 올리고 `docs/history.md`의 "최신 기록" 맨 위에 항목을 추가한다. `App.jsx` 헤더에는 이력을 쓰지 않는다.

## 빌드

```bash
npx expo start
```

APK는 `build.bat`을 더블클릭한다 (`scripts\build-signed.ps1 -Auto` 실행). 실제 키로 서명해 `dist/noveltier-v<버전>-<커밋>.apk`로 저장하고, 폰 1대가 연결돼 있으면 `adb install -r`로 설치한다.

- **기존 앱을 지우지 않는다.** 앱 데이터가 함께 삭제된다. Gradle로 바로 만든 APK는 디버그 키 서명이라 덮어쓸 수 없다.
- **비밀 정보:** 서명 키는 저장소 밖(`~\.keys\noveltier\keystore.jks`)에 둔다. 키, 비밀번호, `credentials.json`은 커밋하지 않고 채팅에도 붙여넣지 않는다.
- **비밀번호 저장:** 키 옆의 `signing-passwords.dat`에 DPAPI로 암호화된다. 지우려면 `-ForgetPasswords`.
- **`build-signed.ps1`은 UTF-8 BOM을 유지한다.** 없으면 PowerShell 5.1에서 한글이 깨진다.
- **`android/`는 생성물이다.** 직접 고치지 않는다. `expo prebuild --clean`은 사용자 승인 없이 쓰지 않는다.
- **prebuild 후 `git restore package.json`:** prebuild가 스크립트·`name`·`version`을 바꾼다.
- **Kotlin 변경은 APK를 다시 빌드해야 반영된다.**
- **에뮬레이터는 `adb shell reboot -p`로 끈다.** 설치 직후 `adb emu kill`로 끄면 APK가 잘려 앱이 사라진다.

수동 빌드와 릴리스 변형의 메모리 옵션은 `scripts/build-signed.ps1`을 참고한다.

## Git

- 커밋과 푸시는 작업 브랜치에 한다.
- **`main` 병합은 사용자가 "병합해"라고 할 때만 한다.** 그때 PR을 만들어(base `main`) GitHub에서 병합한다. 로컬에서 병합해 `main`에 직접 push하지 않는다.
- `main` 병합은 EAS 빌드를 돌리지 않는다. `.github/workflows/build.yml`은 수동 실행 전용이다.

## 진행 중인 작업

사용자가 **"다음 작업 진행해줘"**(또는 유사 문구)라고 하면 `docs/hollow-fix-roadmap.md`를 열고 그 문서의 세션 프로토콜을 따른다.

## 문서

| 문서 | 내용 |
|---|---|
| `docs/hollow-fix-roadmap.md` | 남은 작업과 절차 |
| `docs/history.md` | 변경 이력 (크니 Grep으로) |
| `docs/hybrid-verification.md` | 하이브리드 자리 탐색 설계와 검증 예산 |
| `docs/scraper-plan.md` | 스크래퍼 설계 이유와 플랫폼별 실측 사실 |
| `docs/cloud-sync-plan.md` | 클라우드 동기화 설계 |
| `src/features/*/README.md` | 신규 기능 모듈별 사용법 |
