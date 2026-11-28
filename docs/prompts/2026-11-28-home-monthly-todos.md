# 맞춤 홈 이번 달 할 일 및 상단 보기 전환 (CAL-02·CHK-04)

- 작성일: 2026-11-28
- 관련 이슈 / PR: 관련 화면 작업 #31, #34 / PR 생성 전

## 목적

맞춤 홈에서 `NEW`와 `LIVING` 사용자 모두 정착 체크리스트부터 보이던 문제를 해결한다. 사용자 유형에 맞는 보기를 기본으로 열고, 홈 상단에서 정착 체크리스트와 이번 달 할 일을 양방향으로 전환할 수 있게 한다.

## 핵심 요청

- 홈에서 `GET /api/schedules/this-month?language=`를 호출해 `year`·`month`·`nextMonth`와 `items[].schedule`·`items[].dDay`를 사용하고, 회원 ID와 언어를 조회 키에 포함한다.
- `NEW`는 정착 체크리스트, `LIVING`은 이번 달 할 일을 기본으로 열고 홈 상단에서 전환할 수 있게 한다. 기존 체크리스트 완료·해제 기능은 그대로 유지한다.
- 오늘 마감(D-0) 포함, 다음 달 대체 시 응답 연·월 표시 및 연말 다음 해 전환 테스트, 두 달 모두 일정 없음·로딩·오류 및 재시도 상태와 4개 언어 문구를 반영한다.
- 세금·일정 상세 이동은 #34의 공통 경로(`/calendar/taxes/:id`, `/calendar/schedules/:id`)와 연결한다.

## 선택과 이유

| 검토한 방법                                                       | 선택 | 이유                                                                                                                         |
| ----------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------- |
| `HomeContent`에서 `ChecklistHomeView`·`MonthlyTodosHomeView` 분리 | 채택 | `LIVING` 사용자가 첫 진입 시 이번 달 할 일만 먼저 조회하고, 전환 시 각 보기의 상태와 H1/H2 순서를 독립적으로 유지할 수 있다. |
| `HomeContent`에 `key="${me.id}:${me.userType ?? ''}"` 지정        | 채택 | 계정 전환 또는 내 정보에서 사용자 유형(`NEW`↔`LIVING`) 변경 후 홈으로 돌아왔을 때 해당 유형의 기본 보기가 즉시 반영된다.     |
| `scheduleDetailLink` 공통 헬퍼 추출                               | 채택 | #34의 `taxScheduleId` 우선 규칙과 `scheduleId` 상세 경로를 재사용해 달력·홈 간 이동 규칙을 일관되게 유지한다.                |

## 반영 내용

- `src/features/calendar/api.ts`: `MonthlyTodoResponse`, `MonthlyTodoItemResponse`, `monthlyTodosQueryKey(memberId, language)`, `fetchMonthlyTodos` 추가.
- `src/features/calendar/taxes.ts`: `scheduleDetailLink` 공통 헬퍼 추가.
- `src/features/calendar/monthly-todos.ts`, `use-monthly-todos.ts`: `defaultHomeView`, `todoMonthIso`, `nextCalendarMonth`, `buildMonthlyTodos`, `useMonthlyTodos` 구현.
- `src/features/calendar/ui/monthly-todos-section.tsx` 및 CSS: 연·월 제목, 다음 달 대체 안내, 두 달 모두 빈 상태, D-day·개인/확인 필요 태그, 세금·일정 상세 링크 및 `QueryState` 기반 로딩·오류·재시도 UI 구현.
- `src/pages/home/home-page.tsx`, `home-page.module.css`, `messages.ts`: 상단 `ChipGroup` 보기 전환 추가 및 4개 언어(`ko`, `en`, `zh`, `vi`) 문구 반영.
- `src/mocks/handlers/schedules.ts`: `GET */api/schedules/this-month` MSW 핸들러 추가(`/:scheduleId` 앞).
- `src/features/calendar/monthly-todos.test.ts`: 유형별 기본 보기, 조회 키, D-0 포함 및 정렬, 다음 달 대체, 연말 다음 해 1월 전환, 두 달 모두 빈 상태, 상세 링크, MSW 계약 테스트 추가.

## 검증

| 확인 항목                            | 방법                                  | 결과                                                                     |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| 타입·린트·형식·단위/계약 테스트·빌드 | `npm run check`                       | 통과 (Vitest 48개 파일, 516개 테스트 통과)                               |
| 모바일 UI·전환·상세 이동             | `npm run dev:mock` (390×844 브라우저) | 통과 (`NEW`/`LIVING` 기본 진입·전환·체크·상세 이동 확인, 콘솔 오류 없음) |

미검증: 실제 BE 서버(`Siot-BE`)와의 실환경 API 연동 (MSW 목업 및 단위 테스트 기준으로 검증함).

## 남은 작업

- 실제 BE 서버 환경에서 `GET /api/schedules/this-month?language=` 응답 및 연말/빈 상태 최종 연동 확인.
