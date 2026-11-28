# 불러오기 실패 화면 마지막으로 불러온 시각 표시 및 keepContentOnError 정리 (M13)

- 작성일: 2026-11-28
- 관련 이슈 / PR: #36 / PR 생성 전

## 목적

공통 `QueryState` 오류 화면(M13)에 이전에 불러온 데이터가 있을 때 TanStack Query의 `dataUpdatedAt`을 한국 시간·4개 언어 형식으로 표시하고, 재조회 실패 시 기존 내용을 유지할 화면(`keepContentOnError`)을 정리한다.

## 핵심 요청

- `QueryState`의 v2 오류 문구·마스코트 및 없는 페이지 화면(`NotFoundPage`)은 `main`에 이미 구현되어 있음을 확인한다.
- 전에 받은 데이터가 있으면(`dataUpdatedAt > 0`) 한국 시간(`Asia/Seoul`) 기준 4개 언어(`ko`·`en`·`zh`·`vi`) 형식으로 마지막으로 불러온 시각을 표시한다.
- 기존 데이터가 있을 때 오류 시 이전 내용을 유지할지(`keepContentOnError`) 화면별로 정리하고 테스트를 추가한다.

## 선택과 이유

| 검토한 방법                                                                | 선택 | 이유                                                                                                                      |
| -------------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| `formatKoreaUpdatedAt`에 `hourCycle: 'h23'`, `timeZone: 'Asia/Seoul'` 지정 | 채택 | 사용자 기기 시간대와 무관하게 한국 시간으로 고정하고, 자정이 `24:00`으로 표기되는 로케일 차이를 방지한다.                 |
| `lastUpdatedText`를 `query-state-meta.ts`로 분리                           | 채택 | 컴포넌트 파일(`query-state.tsx`)의 `react-refresh/only-export-components` 규칙을 지키면서 순수 함수로 테스트한다.         |
| 읽기 목록·상세 화면에만 `keepContentOnError` 적용                          | 채택 | 알림·행사·체크리스트·생활 수칙·채팅은 재조회 실패 시 기존 내용을 유지하고, 인증 가드·편집 폼은 오동작 방지를 위해 숨긴다. |

## 반영 내용

- `src/shared/i18n/format.ts`: `formatKoreaUpdatedAt(timestamp, language)` 추가.
- `src/shared/i18n/messages.ts`: 4개 언어(`ko`·`en`·`zh`·`vi`)에 `common.lastUpdated` 추가.
- `src/shared/ui/status-card.tsx`, `status-card.module.css`: `StatusCard`에 보조 시각 표시용 `meta?: string` prop 및 스타일 추가.
- `src/shared/ui/query-state-meta.ts`, `query-state.tsx`: `QueryLike`에 `dataUpdatedAt?: number` 추가, 오류 시 `lastUpdatedText` 전달, `InfiniteList`에 `keepContentOnError={items.length > 0}` 적용.
- `src/features/checklist/ui/home-checklist.tsx`, `src/features/life-changes/ui/life-change-tasks.tsx`, `src/features/rules/ui/{rule-groups.tsx, rule-category-view.tsx, rule-detail.tsx}`, `src/pages/chat/chat-pages.tsx`: 기존 데이터가 있을 때 `keepContentOnError` 적용.
- `src/shared/ui/query-state-meta.test.ts`: UTC→KST 변환(날짜 넘김·자정 `00:00`), 4개 언어 포맷·문구, `dataUpdatedAt === 0` 생략 테스트 5건 추가.

## 검증

| 확인 항목                            | 방법                                  | 결과                                                        |
| ------------------------------------ | ------------------------------------- | ----------------------------------------------------------- |
| 타입·린트·형식·단위/계약 테스트·빌드 | `npm run check`                       | 통과 (Vitest 54개 파일, 558개 테스트 통과)                  |
| 모바일 정상 로드 및 404 화면         | `npm run dev:mock` (390×844 브라우저) | 통과 (`/home`, `/does-not-exist` → `/home`, 콘솔 오류 없음) |

미검증: 내장 브라우저 샌드박스 제한으로 `fetch` 강제 실패를 통한 재조회 오류 카드·마지막으로 불러온 시각 렌더링은 브라우저에서 직접 재현하지 못했다.

## 남은 작업

- 브라우저 DevTools 오프라인 모드 또는 실환경 네트워크 차단 상태에서 재조회 실패 시 오류 카드의 마지막으로 불러온 시각 및 `keepContentOnError` 동작 최종 확인.
