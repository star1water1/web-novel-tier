# Novel Tier

웹소설과 웹툰의 티어 순위를 관리하는 Android 앱입니다. 작품끼리 대전시켜 ELO 점수로 티어를 산출하거나, 직접 정한 순위를 앱이 점검하게 할 수 있습니다. Expo(SDK 54)와 React Native로 만들었고, 데이터는 기기의 SQLite에 저장합니다.

## 실행과 빌드

```bash
npm install
npx expo start
```

APK는 `build.bat`을 더블클릭해 빌드합니다. 자세한 내용과 주의사항은 [CLAUDE.md](CLAUDE.md)에 있습니다.

## 구조

| 위치 | 내용 |
|---|---|
| `App.jsx` | 기존 기능 전체 |
| `src/features/` | v7.59.20 이후의 신규 기능 |
| `modules/` | Kotlin 네이티브 모듈 |
| `docs/` | 로드맵과 설계 메모 |
| `scripts/` | 서명 APK 빌드 스크립트 |

## 문서

- [CLAUDE.md](CLAUDE.md): 개발 규칙과 불변조건
- [docs/hollow-fix-roadmap.md](docs/hollow-fix-roadmap.md): 남은 작업
- [docs/hybrid-verification.md](docs/hybrid-verification.md): 하이브리드 모드 설계
- [docs/scraper-plan.md](docs/scraper-plan.md): 플랫폼 스크래퍼 메모
- [docs/cloud-sync-plan.md](docs/cloud-sync-plan.md): 클라우드 동기화 설계
- [src/features/file-access/README.md](src/features/file-access/README.md): 파일 접근 모듈 사용법
