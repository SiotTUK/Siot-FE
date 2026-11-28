# 생활수칙 '안내 변경' 표시와 관리자 저장 문구 정정 (NTF-07)

- 작성일: 2026-11-28
- 관련 이슈 / PR: [#133](https://github.com/SiotTUK/Siot-FE/issues/133) / PR 미생성. BE 문서 정정: [SiotTUK/Siot-BE#43](https://github.com/SiotTUK/Siot-BE/issues/43)·[SiotTUK/Siot-BE#44](https://github.com/SiotTUK/Siot-BE/pull/44)

## 목적

관리자 생활수칙 저장 화면은 "회원에게 안내 변경 알림을 보낼까요?"라고 묻는다. 그러나 BE는 생활수칙 변경 알림을 보내지 않고(`NotificationService.noticeTargets` 가 `RULE` 이면 빈 목록), `noticeChanged=true` 는 `notice_changed_at` 만 기록한다. 회원 생활수칙 상세는 이 값을 보여 주지 않아 관리자가 어느 쪽을 골라도 회원 화면에 차이가 없었다. 회원 상세에 '안내 변경'을 표시하고 관리자 문구를 실제 동작에 맞춘다.

## 핵심 요청

- #133의 할 일을 구현한다. 회원 상세 표시, 관리자 질문·버튼 문구, 4개 언어, MSW 목업, 테스트가 범위다.
- 이슈의 'BE 확인 필요' 중 표시 기준은 사용자가 정했다. BE 변경 없이 `noticeChangedAt` 날짜만 표시한다(14일 제한 없음).
- 생활수칙도 변경 알림을 보낼지는 정책 결정이라 이번 범위가 아니다.

## 선택과 이유

| 검토한 방법                                              | 선택 | 이유                                                                                                                                             |
| -------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 날짜만 표시 (`noticeChangedAt` 있으면 계속 표시)         | 채택 | 사용자 결정. 지금 BE 응답으로 바로 연동되고 FE가 기간을 판정하지 않는다                                                                          |
| BE에 `RuleResponse.hasNoticeChanged`(14일) 추가          | 보류 | 체크리스트와 기준을 맞추려면 필요하다. BE 작업이 따로 필요해 이번에는 하지 않았다                                                                |
| FE가 14일 계산                                           | 제외 | 이슈가 피하려던 방식이다. 체크리스트(BE 판정)와 기준이 갈릴 수 있다                                                                              |
| 날짜를 문자열 앞 10자리로 자름 (체크리스트 상세 방식)    | 제외 | BE가 쓰는 오프셋이나 보는 사람의 시간대에 따라 날짜가 달라질 수 있다. 한국 날짜로 바꾸는 `koreaDateOf` 를 두었다 (AI 제안)                       |
| 상세 머리의 태그로 표시                                  | 채택 | '번역 준비 중'·'과태료·범칙금 있음' 태그와 같은 줄이라 레이아웃을 바꾸지 않는다. 체크리스트 목록의 '안내 변경' 태그와 같은 색(warning) (AI 제안) |
| 관리자 버튼 `안내 변경 표시하고 저장` / `표시 없이 저장` | 채택 | 이슈 예시(`변경됨 표시하고 저장`)를 회원 화면에 실제로 보이는 말('안내 변경')로 맞췄다 (AI 제안)                                                 |

## 반영 내용

- `src/features/rules/api.ts`: `RuleResponse.noticeChangedAt` 추가(BE에 이미 있는 필드).
- `src/features/rules/rules.ts`: `Rule.noticeChangedOn`(한국 날짜 YYYY-MM-DD)과 `koreaDateOf` 추가. 시각이 없거나 읽을 수 없으면 null.
- `src/features/rules/ui/rule-detail.tsx`: 날짜가 있으면 머리 태그 줄에 '안내 변경 11. 27.'을 보인다(언어별 월·일 형식).
- `src/features/rules/messages.ts`: `rules.noticeChanged` 4개 언어(ko '안내 변경', en 'Updated', zh '指南已于…更新', vi 'Đã cập nhật').
- `src/features/admin/messages.ts`·`ui/rule-editor.tsx`: 질문 '회원 상세 화면에 "안내 변경"을 표시할까요?', 버튼 `안내 변경 표시하고 저장`/`표시 없이 저장`. 도움말에 알림을 보내지 않는 점, 표시 없이 저장해도 이전 날짜가 남는 점(BE `Guide.recordEdit` 는 true일 때만 기록)을 적었다. 관리자 화면은 한국어 전용이다.
- `src/mocks/handlers/rules.ts`: `waste-food` 에 `noticeChangedAt` 을 넣어 목업에서 표시를 볼 수 있게 했다. 나머지는 null.
- 테스트: `rules.test.ts`(변환·한국 날짜·잘못된 값), `rule-content.test.ts`(목업 응답).

## 검증

| 확인 항목          | 방법                                                                         | 결과                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 전체 검사          | `npm run check`                                                              | 타입·린트·형식·Vitest 59개 파일 588개·빌드 통과                                                       |
| 회원 상세 4개 언어 | 목업, Chrome, 390×844 iframe, `/rules/waste-food`, 내 정보에서 언어 변경     | ko '안내 변경 11. 27.', en 'Updated 11/27', zh '指南已于11/27更新', vi 'Đã cập nhật 27/11'            |
| 표시 없는 항목     | 같은 조건, `/rules/waste-general`                                            | '안내 변경' 태그 없음                                                                                 |
| 관리자 저장        | 목업 관리자, `/admin/rules/waste-food` 에서 저장 → `안내 변경 표시하고 저장` | 새 질문·도움말·버튼 표시, '저장했어요', 코드 줄에 '안내 변경 2026. 11. 28. 오후 6:58'. 콘솔 오류 없음 |

화면(목업, 390×844): [회원 상세 ko](assets/2026-11-28-rule-notice-changed-ko.png) · [en](assets/2026-11-28-rule-notice-changed-en.png) · [zh](assets/2026-11-28-rule-notice-changed-zh.png) · [vi](assets/2026-11-28-rule-notice-changed-vi.png) · [관리자 저장 질문](assets/2026-11-28-rule-notice-changed-admin.png)

미검증: 실제 BE 연동(BE `RuleResponse.noticeChangedAt` 은 코드와 `docs/api-admin.md` 예시로만 확인). 창 크기 조절이 되지 않아 같은 출처 iframe(390×844)으로 모바일 폭을 재현했다. 목업의 회원 생활수칙은 고정 사본이라 관리자 저장 결과가 회원 화면에 반영되지 않는다(기존 목업 설계).

## 남은 작업

- 체크리스트처럼 최근 14일만 표시하려면 BE `RuleResponse.hasNoticeChanged` 가 필요하다. 이슈·PR 미생성.
- 생활수칙 변경 알림 발송 여부는 정책 결정이 남아 있다. 보내기로 하면 BE 작업이 따로 필요하다.
- 번역 저장의 '실제 안내 내용이 바뀌었어요 (상세 화면에 "변경됨" 표시)' 문구(`admin.noticeChanged`)는 체크리스트 문구 편집과 같이 써서 이번에 바꾸지 않았다.
