# 최소 매칭 (quick-rank)

풀매칭 대신 적은 횟수로 순위를 만드는 도구다. 새 티어 모드가 아니며 직접 배정과 혼합 모드에서만 진입한다.

| 파일 | 내용 |
|---|---|
| `scoring.js` | 시작 점수, 기록으로 점수 추정(Plackett-Luce), 다음 후보, 최종 티어와 순서. DB와 화면을 모른다 |
| `store.js` | 새 표 읽기·쓰기, 적용과 되돌리기, 백업 항목 `QR` |
| `QuickRankScreen.js` | 칸 → 5개 중 1개 → 미리보기와 적용 화면 |

## 지키는 것

- `matches`, `choice_logs`, `rating`, 승패를 건드리지 않는다.
- 점수의 원본은 칸과 `quick_rank_log`다. `loadState`가 읽을 때 다시 계산하므로 `quick_rank_item`의 `score`, `rd`는 믿지 않는다. 미리보기와 적용은 `fitScores`로 같은 값을 쓴다.
- 적용과 되돌리기는 시스템 경로라 `enqueueVerification`을 부르지 않는다. 진행 중인 검증 세션은 `App.jsx`의 콜백이 멈춘다.
- 적용은 전후 값을 `quick_rank_apply_item`에 쓴 뒤 `UPDATE` 한 문장으로 한다. `execBatch`가 50개씩 쪼개도 일부만 적용되지 않는다.
- 작품을 지워도 행을 남겨 삭제 되돌리기에 대비한다. `loadState`가 읽을 때 현재 작품과 맞춘다.
- 매칭 제외 작품은 묻지 않고 티어와 칸 안 자리를 유지한다.
- 새 표는 `doClearAll`, 전체 초기화, 선택 초기화, `IMPORT_SNAP_TABLES`에 함께 등록한다. 표를 추가하면 `QUICK_RANK_TABLES`에 넣는다.

필요한 횟수와 정확도는 가상 계산 값이다. 실제 효과처럼 안내하지 않는다.
