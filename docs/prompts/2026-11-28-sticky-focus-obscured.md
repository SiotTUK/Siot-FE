# Tab 이동 시 고정 상단 바·하단 메뉴 가림 방지 (NFR-04)

- 작성일: 2026-11-28
- 관련 이슈 / PR: #126 (참고 #74, PR #139) / PR 생성 전

## 목적

`Tab` 키로 이동한 포커스 요소가 `position: sticky` 상단 바·하단 메뉴(`BottomNav`)·상세 하단 고정 바(`BottomArea`, `RuleDetail.bottomBar`) 뒤에 가려지는 문제(WCAG 2.4.11, #126)를 해결한다.

## 핵심 요청

- 하단 메뉴가 있는 화면에 `scroll-padding-bottom`, 상단 고정 바가 있는 화면에 `scroll-padding-top`을 적용해 포커스 가림을 방지한다.
- 하단 고정 버튼이 있는 상세 화면(행사 상세 등)도 같은 기준으로 확인한다.
- 모바일 390 폭과 PC 1440 폭에서 홈·행사·알림·생활 안내·상세 화면을 `Tab`으로 순회해 가림이 없는지 확인한다.

## 선택과 이유

| 검토한 방법                                               | 선택 | 이유                                                                                                                       |
| --------------------------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------- |
| `html:has([data-sticky-top / bottom])` + `scroll-padding` | 채택 | 별도 JS 스크롤 조작 없이 W3C 표준 `scroll-padding`으로 고정 바가 있는 화면에만 자동 적용되고, 포커스 링 여백까지 확보된다. |

## 반영 내용

- `src/styles.css`: `html:has([data-sticky-top]) { scroll-padding-top: 76px; }`, `html:has([data-sticky-bottom]) { scroll-padding-bottom: calc(108px + env(safe-area-inset-bottom)); }` 추가.
- `src/shared/ui/top-bar.tsx`: `<header data-sticky-top="">` 추가.
- `src/shared/ui/bottom-nav.tsx`, `src/shared/ui/page.tsx` (`BottomArea`), `src/features/rules/ui/rule-detail.tsx` (`.bottomBar`): `data-sticky-bottom=""` 추가.

## 검증

| 확인 항목                            | 방법                                         | 결과                                                                                                             |
| ------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 타입·린트·형식·단위/계약 테스트·빌드 | `npm run check`                              | 통과 (Vitest 61개 파일, 599개 테스트 통과)                                                                       |
| 모바일 390×844 `Tab` / `Shift+Tab`   | `npm run dev:mock` 브라우저 boundingBox 측정 | 통과 (`/home`·`/events`·`/notifications`·`/rules`·`/events/1` 가림 0건, 최소 상단 16px·하단 32px, 콘솔 오류 0건) |
| PC 1440×700 `Tab` / `Shift+Tab`      | `npm run dev:mock` 브라우저 boundingBox 측정 | 통과 (`/home`·`/events` 가림 0건, 최소 상단 18px·하단 49px, 콘솔 오류 0건)                                       |

미검증: iOS Safari 실기기(`env(safe-area-inset-bottom)` > 0) 환경.
