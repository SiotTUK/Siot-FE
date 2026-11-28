# 요청 중 비활성화되는 버튼의 키보드 포커스 유지 (NFR-04)

- 작성일: 2026-11-28
- 관련 이슈 / PR: #124 (참고 #74, PR #139) / PR 생성 전

## 목적

비동기 요청 중 네이티브 `disabled` 속성이 걸리는 버튼을 키보드로 눌렀을 때 포커스가 `document.body`로 빠져 키보드·화면 낭독기 사용자가 위치를 잃는 문제(#124)를 해결한다. 요청 중 중복 요청 차단 동작은 유지한다.

## 핵심 요청

- 이슈 #124에 열거된 20곳을 확인해 같은 자리에 남는 버튼과 다른 버튼 요청 중 잠기는 보조 요소·화면 전환 요소를 구분한다.
- 같은 자리에 남는 버튼은 요청 중에도 키보드 포커스를 유지하도록 공통 버튼 및 해당 화면에 `aria-disabled` + `aria-busy` + 중복 클릭 차단을 반영한다.
- 상태가 바뀌는 버튼(찜·알림 설정 등)의 상태 속성과 4개 언어·모바일 동작을 확인한다.

## 선택과 이유

| 검토한 방법                                                            | 선택 | 이유                                                                                                                                |
| ---------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `busyButtonProps`·`guardBusyClick` 공통 헬퍼 도입                      | 채택 | `Button`, `HeaderAction`, 네이티브 `<button>`(찜·미읽음 알림)에서 동일한 `aria-disabled`·`aria-busy`·중복 차단 규칙을 재사용한다.   |
| `Button`의 `loading` 시 네이티브 `disabled` 제거                       | 채택 | `loading={true}`인 모든 버튼에서 요청 중 포커스가 `BODY`로 빠지지 않으며, `onClick`의 `preventDefault()`로 폼 중복 제출까지 막는다. |
| 타 버튼 요청 중 잠기는 보조 취소 버튼·입력 필드는 기존 `disabled` 유지 | 채택 | 포커스가 제출/확인 버튼에 있어 포커스 손실 원인이 아니며, 제출/확인 버튼 자체는 `loading`으로 포커스를 유지한다.                    |

## 반영 내용

- `src/shared/ui/button-guard.ts`, `button-guard.test.ts`: `busyButtonProps`, `guardBusyClick` 추가 및 단위 테스트 5건 추가.
- `src/shared/ui/button.tsx`, `button.module.css`, `screen-header.tsx`: `loading` 시 `aria-disabled="true"`·`aria-busy="true"` 및 클릭/제출 차단 적용, `[aria-disabled='true']` 스타일 일치.
- `src/pages/events/event-pages.tsx`, `src/features/events/ui/event-heart.{tsx, module.css}`, `src/features/events/ui/event-alerts.tsx`: 행사 상세 찜 버튼, 행사 카드 ♥ 버튼, 알림 시점 `<SelectField>` 요청 중 포커스 유지 및 중복 요청 차단.
- `src/features/notifications/ui/notification-list.tsx`, `src/pages/me/me-page.tsx`, `src/features/admin/ui/rule-editor.tsx`, `src/features/onboarding/ui/question-screen.tsx`, `src/features/checklist/ui/task-row.tsx`: "모두 읽음", 경로 없는 미읽음 알림 버튼, 로그아웃, 알림 없이 저장, 건너뛰기, 체크리스트 완료 체크박스에 요청 중 포커스 유지 적용.

## 검증

| 확인 항목                            | 방법                                  | 결과                                                                                                  |
| ------------------------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 타입·린트·형식·단위/계약 테스트·빌드 | `npm run check`                       | 통과 (Vitest 60개 파일, 593개 테스트 통과)                                                            |
| 키보드 포커스 유지 및 4개 언어       | `npm run dev:mock` (390×844 브라우저) | 통과 (`/events/1` 하단 찜 버튼·`/events` 카드 ♥ 버튼 연속 `Enter` 토글 시 포커스 유지, 콘솔 오류 0건) |

미검증: 실제 스크린 리더(NVDA/VoiceOver) 음성 낭독 및 실제 BE 서버 연동.
