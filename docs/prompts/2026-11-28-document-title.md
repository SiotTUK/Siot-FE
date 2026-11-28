# 화면별 문서 제목(document.title) 및 경로 전환 낭독 안내 적용 (NFR-04)

- 작성일: 2026-11-28
- 관련 이슈 / PR: #125 (참고 #74, PR #139) / PR 생성 전

## 목적

모든 화면의 문서 제목(`document.title`)이 '웰컴시흥'으로 고정되어 탭 제목·방문 기록·화면 낭독기로 현재 화면을 구분할 수 없던 문제(WCAG 2.4.2, #125)를 해결한다.

## 핵심 요청

- 화면별 문서 제목 규칙(`화면 이름 · 브랜드`, 상세는 `항목 이름 · 화면 이름 · 브랜드`)을 정하고 라우트·상세 화면 단위로 적용한다.
- 4개 언어(`ko`·`en`·`zh`·`vi`)를 반영하고, 언어를 바꾸면 문서 제목도 즉시 갱신되게 한다.
- 상세 화면은 불러오기 전·실패·성공 상태에서 제목이 어긋나지 않게 하고, 화면 전환 시 스크린 리더 낭독 안내를 함께 제공한다.

## 선택과 이유

| 검토한 방법                                                           | 선택 | 이유                                                                                                               |
| --------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------ |
| 라우트 `handle.titleKey` + `RootLayout`의 `RouteTitleSync`            | 채택 | 인증·온보딩·회원·관리자·404 전체 라우트에 누락 없이 기본 제목을 적용하고, 기존 4개 언어 화면 제목 키를 재사용한다. |
| `RouteTitleSync`(`useLayoutEffect`) + `useDocumentTitle`(`useEffect`) | 채택 | React effect 실행 순서를 이용해 상세 화면의 항목 제목이 부모의 기본 라우트 제목에 덮어씌워지는 문제를 방지한다.    |
| `aria-live="polite"` 숨김 영역으로 경로 변경 시에만 화면 이름 낭독    | 채택 | 초기 진입 시 브라우저의 기본 제목 낭독과 중복되지 않으면서 SPA 화면 전환을 스크린 리더에 안내한다.                 |

## 반영 내용

- `src/shared/lib/document-title.ts`, `document-title.test.ts`: `formatDocumentTitle`, `routeTitleKey`, `useDocumentTitle` 구현 및 단위 테스트 4건 추가.
- `src/app/layouts.tsx`: `RootLayout`에 `RouteTitleSync` 추가(`document.title` 동기화 및 경로 전환 `aria-live="polite"` 안내).
- `src/app/router.tsx`: 전체 라우트에 `handle: { titleKey }` 연결.
- `src/pages/events/event-pages.tsx`, `src/pages/home/checklist-detail-page.tsx`, `src/pages/calendar/tax-detail-page.tsx`, `src/features/bill-translation/ui/bill-result.tsx`, `src/features/rules/ui/{rule-detail.tsx, rule-category-view.tsx}`, `src/features/onboarding/ui/question-screen.tsx`: 상세·동적 화면에서 항목 이름 또는 단계 이름을 `useDocumentTitle`로 반영(로딩 전·실패 시 화면 기본 제목 유지).

## 검증

| 확인 항목                             | 방법                                  | 결과                                                                                                                                                  |
| ------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 타입·린트·형식·단위/계약 테스트·빌드  | `npm run check`                       | 통과 (Vitest 61개 파일, 597개 테스트 통과)                                                                                                            |
| 화면별·상세·4개 언어 `document.title` | `npm run dev:mock` (390×844 브라우저) | 통과 (`/login`, `/home`, `/calendar`, `/events`, `/events/1`, `/events/99999`, `/notifications`, `/chat`, `/me`, 404 및 4개 언어 전환, 콘솔 오류 0건) |

미검증: 실제 스크린 리더(NVDA/VoiceOver)의 `aria-live="polite"` 음성 낭독 및 관리자 계정 `/admin/*` 실브라우저 이동.
