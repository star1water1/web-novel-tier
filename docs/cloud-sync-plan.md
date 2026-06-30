# 클라우드 백업 · 멀티 기기 동기화 설계 (검토/설계 문서)

> 상태: **설계·타당성 검토** (미구현). 작성 2026-06-30, 기준 버전 v7.53.8.
> 목적: "단순 백업"을 넘어 "여러 기기를 옮겨다니며 같은 데이터로 사용". 가능하면 "실시간 연동급" 느낌.

---

## 0. 결론 먼저 (TL;DR)

- **가능하다.** 단, "여러 사람의 동시 협업"이 아니라 **"한 사용자가 자기 기기들을 번갈아 사용"**이라는 점이 핵심이다.
  이 구분이 난이도를 10배 가른다 → CRDT 다중 마스터가 **필요 없다**.
- 권장 경로: **Tier 1(클라우드 세이브: 슬롯 단위 스냅샷 + 자산 증분 업로드 + 단일 활성 기기 가드)** 를 먼저.
  "실시간 연동급" 느낌은 **Tier 2(새 버전 알림 → 자동 당겨오기)** 로 근사한다.
- **행 단위 실시간 양방향 동기화(Tier 3)는 비권장.** 이 앱의 매칭/ELO·하이브리드 상태가 순서에 민감해
  동시 다중 마스터 병합 시 **랭킹이 오염**될 수 있고, expo-sqlite 75k줄을 다른 엔진으로 이식해야 하는 위험이 크다.

---

## 1. 현재 구조에서 설계를 좌우하는 사실 (코드 실측)

| 사실 | 위치 | 동기화에 주는 영향 |
|---|---|---|
| 백업은 **slot 1개**(활성 슬롯)만 직렬화 (v13 JSON) | `buildUltraCompactBackup` 54125, `exportJSON` 54487 | 동기화 단위 = **슬롯**. 슬롯별로 클라우드 "세이브"가 1개 매핑돼야 함 |
| 슬롯 DB는 **파일 분리** (`novel_tiers.db`, `novel_tiers_slot{N}.db`) | `getSlotDbFilename` 8461 | 슬롯 = 깔끔한 동기화 경계. 슬롯 통째 스냅샷이 자연스러움 |
| 슬롯 메타는 **전역 파일** `slot_meta.json`(activeSlotId, slots[]) | 8458 | 슬롯 ID가 **기기별 로컬 순번(0~9)** → 기기 간 같은 슬롯을 못 알아봄. **슬롯 UUID 필요(신규)** |
| `app_meta`는 **슬롯 DB 내부**(설정·학습 상태 per-slot) | — | 설정도 슬롯 스냅샷에 포함됨(이미 백업 `S` 섹션). 좋음 |
| **로컬 표지 파일·갤러리 파일은 백업에서 제외** (URL 표지만 포함) | `collectCoverImageUrls` 54472, 갤러리 `GI`는 메타만 | **현재 백업만으론 기기 이전 시 이미지가 사라짐.** 자산 별도 처리 필수 |
| 명대사 이미지 **작품당 3장**만 base64 인라인 | 54279 | 스냅샷 비대화 요인. 자산은 분리 업로드가 유리 |
| API 키는 **전역 `ai_config.json`**(기기 전용, 백업 제외) | v7.47+ | 비밀은 동기화 대상에서 빼는 게 안전(권장 유지) |
| 인증/계정/클라우드 **전무**(OAuth·expo-auth-session 미사용) | — | 신규로 신원(로그인) 도입 필요 |
| 모든 쓰기는 `exec/all/execBatch → safeDbOperation` 단일 통로 | 9384/9477/9526 | 오플로그 계측이 *이론상* 가능(Tier 3에서 활용 여지) |
| 매칭 큐 별도 파이프라인 + 불변규칙 #1~#5 | 4215/9610/41153 | **#3 삭제 전 큐 drain**, **#4 BUSY는 리셋 금지**가 동기화 시점 설계를 제약 |
| 데이터 규모: 215 / 1,000+ / 10,000+ 작품 시나리오 | 헤더 | DB 스냅샷은 수KB~수MB. **자산(갤러리)이 용량 지배**(수십~수백 MB 가능) |

**핵심 함의 3가지**
1. **동기화 단위는 "슬롯 통째 스냅샷"이 정답** — 행 단위가 아니라. (순서 민감 ELO/하이브리드 오염 회피 + 기존 백업/복원·원자 롤백 재사용)
2. **자산(로컬 표지·갤러리)은 스냅샷과 분리해 증분 업로드** — 현재 백업의 최대 공백.
3. **슬롯에 UUID를 부여**해야 기기 간 같은 슬롯을 동일 클라우드 세이브에 매핑.

---

## 2. 사용 시나리오와 충돌 모델

이 앱은 **단일 사용자**가 폰↔태블릿↔새 폰을 **번갈아** 쓴다(동시 편집 드묾). 그래서:

- 필요한 것: **"마지막으로 쓴 기기의 전체 상태가 정답"** + **실수로 더 새 상태를 덮어쓰지 않게 막는 가드**.
- 필요 없는 것: 행 단위 CRDT, 동시 다중 마스터 병합, 필드별 충돌 해소.
- 진짜 충돌(두 기기가 같은 슬롯을 각자 편집)은 **드물지만 가능** → "양쪽 중 어느 걸 쓸지" 사용자 1회 선택 + 직전 리비전 보관으로 복구 가능하게.

> ELO/하이브리드가 왜 행 병합과 상극인가: 두 기기에서 각각 매칭을 돌리면 `wins/losses/rating/manual_order`가
> 서로 다른 경로로 진화한다. 행 LWW로 섞으면 "A기기의 승수 + B기기의 레이팅"처럼 **비정합 상태**가 만들어져
> 티어 산출이 깨진다. 슬롯 통째 스냅샷은 이 문제가 원천적으로 없다(한쪽 전체가 이김).

---

## 3. 단계별 설계 (Tier 0 → 3)

### Tier 0 — 현재 (이미 있음)
수동 JSON 내보내기/공유(`exportJSON` → expo-sharing). 이미지 불완전, 전부 수동. → 기기 이전엔 부적합.

### ✅ Tier 1 — 클라우드 세이브 (1순위 권장, 백엔드 불필요)

**한 줄 요약:** 슬롯을 "클라우드 세이브 파일"처럼. 변경되면 자동 업로드, 다른 기기에서 열면 최신본을 당겨와 복원.

**구성요소**
1. **신원(로그인):** Google 로그인.
   - `expo-auth-session`의 Google 프로바이더(웹 OAuth) → **네이티브 SDK 없이** 토큰 획득 가능(친화적).
   - 스코프: `drive.appdata` (앱 전용 폴더 — 사용자 Drive UI엔 안 보이고, 앱만 접근, 무료, 사용자 소유).
2. **저장 위치:** Google Drive **appDataFolder** (REST API를 `fetch`로 호출 — 네이티브 의존성 0).
   - 구조: `appDataFolder/slot-<uuid>/`
     - `manifest.json` — `{ rev, deviceId, updatedAt, dbHash, assets:[{path, hash, size}], appVersion, schemaV }`
     - `snapshot.json` — 기존 `buildExtendedBackup` 산출물(슬롯 DB + 설정 통째)
     - `assets/<hash>.bin` — 로컬 표지·갤러리 파일(해시 파일명 → **변경분만 업로드/중복 제거**)
3. **슬롯 UUID(신규 마이그레이션):** `slot_meta.json`의 각 슬롯에 `uuid` 추가(없으면 생성). 클라우드 세이브 키.
4. **업로드 트리거(디바운스):**
   - 쓰기 안정화 후(기존 `deferSetAppMeta` flush 패턴 + `waitForMatchQueueDrain` 재사용) N초 디바운스.
   - 앱 백그라운드 진입(AppState) 시 1회 flush.
   - 매칭 큐가 비고(불변규칙 #3) 위험 구간 밖일 때만(네트워크 I/O를 큐 안에서 절대 안 함 — 불변규칙 #1 안전).
5. **다운로드/복원 트리거:**
   - 앱 포그라운드 복귀 / 슬롯 열기 시 원격 `manifest.rev`와 로컬 `cloud_rev` 비교.
     - 원격이 더 최신 → "다른 기기에서 업데이트됨 — 가져올까요?" → 다운로드 후 **기존 `importJSON`의 원자 스냅샷 롤백 그대로 재사용**(실패 시 원본 복구 이미 구현됨, v7.49.18).
     - 로컬이 더 최신 → 업로드.
     - **양쪽 분기(충돌)** → "이 기기 / 클라우드(기기 X, n분 전) 중 무엇을 쓸까요?" 1회 선택. 직전 3개 리비전은 Drive에 보관(복구용).
6. **단일 활성 기기 가드(소프트 리스):** `manifest`에 `activeDevice` + `leaseUntil`. 편집 시작 시 갱신.
   다른 기기가 열면 "기기 X가 n분 전 사용 중 — 가져오면 그쪽 변경을 덮어쓸 수 있어요" 경고(강제 잠금 아님, 권고).

**재사용 자산(이미 있음)**
- `buildExtendedBackup`/`importJSON`(직렬화·복원) — 거의 그대로.
- `importJSON`의 **원자 스냅샷+롤백**(`IMPORT_SNAP_TABLES`) — 클라우드 복원의 안전망으로 즉시 활용.
- 슬롯 전환/flush/`waitForMatchQueueDrain` — 동기화 타이밍 가드.

**신규 작업(대략)**
- OAuth(Google) + Drive REST 클라이언트(`fetch` 기반, ~300줄)
- 자산 매니페스트·해시 diff·증분 업/다운로드(~400줄)
- 슬롯 UUID 마이그레이션 + 리비전/리스 비교 로직(~300줄)
- 설정 UI(🔌 연결 또는 신규 "☁️ 클라우드" 서브탭): 로그인·동기화 상태·수동 동기화·충돌 선택·리비전 복구(~600줄)
- **합계 ~1,500–2,000줄, 엔진 변경 없음.**

**난이도/리스크:** 중 / 낮음~중. 최악의 경우도 "직전 리비전에서 복구"로 회수 가능.

**비용/프라이버시:** 무료(사용자 본인 Drive). 데이터는 사용자 소유, 개발자 서버 없음. 선택적으로 업로드 전 **클라이언트 암호화**(비밀번호 기반) 가능.

### Tier 2 — "실시간 연동급" 느낌 (선택, Tier 1 위에 얹기)

목표: 기기 A에서 바꾸면 기기 B가 **거의 즉시** 안다.

- **옵션 2a (백엔드 최소):** Drive 유지 + 포그라운드 복귀 시 매니페스트 폴링. 기기 전환은 대개 "앱 열 때" 일어나므로
  실사용상 "거의 실시간"으로 충분. **추가 인프라 0.** (가장 현실적)
- **옵션 2b (진짜 푸시):** Supabase 도입 — `slots` 테이블(rev/device/updatedAt) + **Realtime 구독** + 스냅샷은
  Supabase Storage. 기기 A 업로드 → 기기 B에 Realtime 이벤트 → "새 버전, 가져오기"(유휴+클린이면 자동 당김).
  스냅샷 기반이라 **행 충돌 지옥 없음**.
  - 비용: Supabase 무료 티어(DB 500MB·스토리지 1GB·MAU 50k)면 개인/소규모 충분.
  - 트레이드오프: **개발자가 백엔드 운영 + 사용자 데이터가 개발자 인프라에**(취향 이력 = 민감). 완화: 클라이언트 암호화.
- **푸시 알림(앱 꺼져 있을 때):** iOS 백그라운드 동기화 보장 없음. Expo BackgroundTask는 best-effort.
  현실적으로 **포그라운드 당김 + 백그라운드 진입 밀어내기**로 "기기 전환" 시나리오는 매끄럽게 커버됨.

### Tier 3 — 진짜 행 단위 실시간 양방향 (비권장, 참고용)

가능은 하나 이 앱엔 **과한 위험/노력**.

- **3a. expo-sqlite + libSQL/Turso 임베디드 리플리카 + `syncLibSQL()`**
  - 장점: **엔진 유지**(SQL/expo-sqlite API 그대로). `useLibSQL` config 플러그인 + `libSQLOptions{url,authToken}` + `syncLibSQL()`.
  - 단점: **Turso 양방향 오프라인 동기화는 베타**(프로덕션 비권장·베타 내구성 보장 없음, 2026 기준).
    `useLibSQL`은 **엔진을 전역 전환** → WAL/PRAGMA/트랜잭션을 75k줄에서 회귀 검증 필요. 슬롯=별도 Turso DB 운영.
    동시 다중 마스터 충돌(ELO/하이브리드) 해소는 여전히 앱이 떠안아야 함.
- **3b. 자체 오플로그 동기화**(exec/execBatch 단일 통로에 `_oplog` + 테이블별 머지 + 툼스톤)
  - 단일 쓰기 통로 덕에 계측은 *가능*하나, 매칭/ELO가 파생·순서 민감 → 위험 테이블은 결국 단일 작성자로 되돌려야 함 → 목적 상실.
- **3c. PowerSync / WatermelonDB**: 성숙하지만 **op-sqlite 등 자체 엔진**으로 DB 레이어 전면 재작성 → 단일 파일 75k줄에 최고 위험.

**판정:** "번갈아 사용"엔 Tier 1/2로 충분. **동시 공동 편집이 실제로 필요해질 때** + **Turso 동기화가 정식(GA) 되면** 재검토.

---

## 4. 권장 로드맵

1. **Phase 1 — Tier 1 (클라우드 세이브)**: Google Drive appDataFolder, 슬롯 UUID, 슬롯 단위 스냅샷 + 자산 증분, 포그라운드 비교/복원, 소프트 리스, 리비전 보관. → "여러 기기 옮겨다니며 사용" 달성, 저위험, 백엔드 0.
2. **Phase 2 — Tier 2a**: 포그라운드 폴링으로 "거의 실시간". (여전히 백엔드 0)
3. **Phase 2.5 — Tier 2b(선택)**: 진짜 푸시가 필요하면 Supabase Realtime 도입.
4. **Tier 3**: 동시 공동 편집 필요 + Turso 동기화 GA 시에만.

## 5. 미해결/결정 필요 사항
- **저장 백엔드:** Google Drive(BYO·무료·프라이버시) vs Supabase(관리형·실시간 푸시·개발자 운영). → Phase 1은 Drive 권장.
- **자산 범위:** 풀(로컬 표지+갤러리 포함 = 진짜 이전, 용량↑) vs DB만(가벼움, 로컬 이미지 미이전). → 풀 + 증분 권장.
- **암호화:** 업로드 전 클라이언트 암호화 여부(취향 이력 민감도).
- **다중 슬롯:** 전 슬롯 자동 동기화 vs 사용자가 고른 슬롯만.
- **API 키 동기화:** 기기 전용 유지(권장) vs 선택적 암호화 동기화.

## 6. 불변규칙 준수 체크(동기화 시)
- #1: 네트워크/Alert를 매칭 큐 내부에서 호출 금지 — 동기화는 큐 외부에서만.
- #3: 복원(대량 DELETE/INSERT) 전 `waitForMatchQueueDrain` — 기존 `importJSON` 경로 재사용으로 자동 충족.
- #4: 동기화 중 SQLITE_BUSY는 jitter 재시도, 연결 리셋 금지.
- 슬롯 가드: 동기화 쓰기 시 `_slotGeneration` 확인(전환 중 오슬롯 오염 방지) — 기존 패턴 재사용.

---

## 7. 구현 진행 상황

### ✅ Increment 1 (완료, v7.54.0 토대) — 기존 동작 무영향(호출부 없음)
- **deps**: `expo-auth-session`, `expo-web-browser`, `expo-crypto` (package.json). app.json `scheme:"noveltier"`는 기존재.
- **슬롯 UUID**: `loadSlotMeta`/`createSlot`에 `uuid` 백필·부여(기기 간 동일 슬롯 식별 키).
- **클라우드 토대 모듈**(App.jsx, 모듈 레벨, 자기완결):
  - 전역 토큰 저장 `cloud_auth.json`(`loadCloudAuth`/`saveCloudAuth`/`clearCloudAuthTokens`), `getCloudDeviceId`.
  - Google OAuth(PKCE): `cloudSignIn`/`cloudSignOut`/`cloudIsSignedIn`/`cloudGetAccessToken`(자동 refresh).
  - Drive REST: `driveFind`/`driveEnsureFolder`/`driveUploadContent`/`driveUploadText`(UTF-8 안전)/`driveUploadLocalFile`/`driveGetText`/`driveDownloadToFile`/`driveList`/`driveDelete`.
  - 동기화 보조: `cloudEnsureSlotFolder`/`cloudReadRemoteManifest`/`buildAssetManifestFromPaths`.
- 검증: esbuild 파싱 통과. **온디바이스 미검증**(이 환경에선 빌드/실행 불가).

### ⏳ 사용자 사전 준비 (필수)
1. **Google Cloud Console** → 프로젝트 → "API 및 서비스" → **OAuth 동의 화면** 구성(외부, 테스트 사용자에 본인 이메일 추가).
2. **사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성.** 앱 유형: Android/iOS(권장) 또는 웹.
   - 앱이 콘솔에 요청하는 **리디렉션 URI**는 실행 시 `cloudRedirectUri()`가 반환하는 값과 **정확히 일치**해야 함.
     온디바이스에서 한 번 로그인 시도해 로그로 확인하거나, `console.log(cloudRedirectUri())`로 출력해 콘솔에 등록.
   - **Google Drive API**를 프로젝트에서 "사용 설정".
3. **App.jsx**의 `GOOGLE_OAUTH_CLIENT_ID`에 발급받은 클라이언트 ID 입력.
4. 작업 브랜치에서 `npx expo install expo-auth-session expo-web-browser expo-crypto` 실행해 **SDK 54 정확 버전 핀**(package.json 임시 버전 교정) 후 EAS preview 빌드.

### ✅ Increment 2 (완료, v7.54.1 — 코드/esbuild 검증, **온디바이스 미검증**)
구현됨: `exportJSON(opts.returnJson/silent)`·`importJSON(directText, onSuccess)` 동작보존 리팩터(인자 없는 기존
호출 100% 동일), push/pull 오케스트레이터(`cloudPushCurrentSlot`/`cloudPullCurrentSlot` — 스냅샷 + 자산 증분 +
매니페스트 rev/lease), 포그라운드 리비전 비교·제안(`cloudCheckAndPrompt`), AppState 배선(백그라운드 push·복귀
확인, 최신 클로저 ref로 stale 방지), 설정 🔌 연결에 ☁️ 클라우드 섹션(로그인/백업/복원/자동 토글/상태). 복원은
기존 importJSON 확인 다이얼로그 + 원자 스냅샷·롤백 재사용. 자산은 복원 전 다운로드 후 기기 간 경로 재작성
(`gallery/`·`covers/` prefix) — best-effort, 데이터 무위험. **실기기 스모크 테스트 필수**(아래 체크리스트).

> ⚠️ 데이터 손실 위험이 있는 백업/복원 경로를 건드리므로, 신뢰 전 **실기기 스모크 테스트** 필수.
> 알려진 v1 한계: ① 같은 슬롯 동시 편집 시 스냅샷 LWW(번갈아 사용 권장) ② 대용량 자산은 base64 업로드(메모리)
> — resumable 업로드는 후속 ③ cover_library 테이블 자체는 백업 비포함(표지 표시는 novels.cover_image 경로 재작성으로 동작).

### (참고) 원래 Increment 2 배선 스펙

1. **`exportJSON` 리팩터(동작 보존):** payload 빌드부를 내부 함수 `buildFullBackupPayload()`로 추출 →
   `exportJSON`은 그대로 공유, 클라우드 push는 같은 함수로 payload 객체 획득(전 섹션 PP/PC/AW/TM/TR/PR/FD/NF/GI/RS/VL/VQ/PL/CE 포함 = 완전 백업).
2. **`importJSON` 리팩터(동작 보존):** 선택적 인자 `importJSON(directText)` 추가 — 클라우드 다운로드 텍스트를 직접 복원
   (기존 원자 스냅샷+롤백 `IMPORT_SNAP_TABLES` 그대로 재사용). 인자 없으면 현행 `importText`/`importValidation` 경로.
3. **자산 경로 수집(컴포넌트):** 현재 슬롯의 `cover_library.file_path` + `gallery_images.file_path` + 명대사 이미지 URI 중
   `file:` 로컬 파일만 모아 `buildAssetManifestFromPaths()`에 전달.
4. **push 오케스트레이터** `cloudPushCurrentSlot()`:
   - `waitForMatchQueueDrain()`(불변 #3) → 큐 외부에서만(불변 #1).
   - `folderId=cloudEnsureSlotFolder(slot.uuid)`; `snapshot.json=driveUploadText(buildFullBackupPayload())`;
   - 자산 diff(remote manifest의 `{name,size,mtime}` vs 로컬) → 변경분만 `driveUploadLocalFile` → `assets/<name>`;
   - `manifest.json` 갱신(`rev=원격rev+1`, `deviceId`, `updatedAt`, `assets[]`, `appVersion`, `schemaV`, `leaseUntil`).
5. **pull 오케스트레이터** `cloudPullCurrentSlot()`:
   - `cloudReadRemoteManifest` → `snapshot.json` 다운로드 → 매니페스트의 자산 중 로컬에 없거나 size/mtime 다른 것
     `driveDownloadToFile`로 `covers/`·`gallery/`에 배치(파일명 보존) → `importJSON(downloadedText)`.
6. **리비전/리스 판단** `cloudCheckOnForeground()`: 원격 `rev` vs 로컬 `cloud_rev`(슬롯 app_meta 저장) 비교 →
   원격 최신=가져오기 제안 / 로컬 최신=업로드 / 양쪽 변경=선택 모달. `activeDevice`+`leaseUntil`로 "다른 기기 사용 중" 경고.
7. **자동 트리거:** 쓰기 안정화 후 디바운스 push(기존 `deferSetAppMeta` flush 패턴) + AppState `background` 진입 시 flush;
   AppState `active` 복귀 시 `cloudCheckOnForeground`.
8. **설정 UI:** 🔌 연결 탭에 신규 섹션(또는 ☁️ 서브탭): 로그인/로그아웃·상태(계정·마지막 동기화·rev)·"지금 백업"·"클라우드에서 복원"·자동 동기화 토글·충돌 선택·리비전 복구. `GOOGLE_OAUTH_CLIENT_ID` 미설정 시 "설정 필요" 안내.

### 🧪 온디바이스 테스트 체크리스트(Increment 2 후)
- [ ] 로그인/로그아웃, refresh(1시간 후 자동 재발급) 동작.
- [ ] 신규 작품/매칭 후 자동 push → Drive appDataFolder에 `slot-<uuid>/snapshot.json` 생성 확인.
- [ ] 표지/갤러리 이미지가 `assets/`에 업로드되고, 다른 기기 복원 시 이미지가 보임(풀 이전).
- [ ] 변경 없는 자산은 재업로드 안 됨(증분).
- [ ] 두 기기 번갈아: A 편집→push, B 포그라운드→"가져오기" 제안→복원 정상.
- [ ] 충돌(양쪽 변경) 선택 모달 + 직전 리비전 복구.
- [ ] **복원 실패/중단 시 원본 자동 롤백**(기존 안전망) 정상 — 데이터 무손상.
- [ ] 매칭 자동 진행 중 동기화가 큐를 방해하지 않음(불변 #1/#3).
- [ ] 대용량(갤러리 많은) 슬롯에서 메모리/시간 허용 범위(필요 시 resumable 업로드로 개선).
