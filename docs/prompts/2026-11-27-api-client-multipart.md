# 공통 API 클라이언트 FormData(multipart) 지원 확인과 테스트 보강

- 작성일: 2026-11-27
- 관련 이슈 / PR: #44, 구현 PR #88(고지서 번역, `0e86eb7`)

## 목적

#44의 multipart 지원이 공통 API 클라이언트에 제대로 들어 있는지 확인하고, 빠진 공통 클라이언트 단위 테스트를 채운다.

## 핵심 요청

- #44를 가져와 처리한다.
- 확인해 보니 구현은 고지서 번역 PR #88에서 이미 main에 들어갔다. 그래서 코드는 바꾸지 않고, 이슈가 요구한 "클라이언트 단위 테스트"만 보강한다.

## 선택과 이유

| 검토한 방법                                  | 선택 | 이유                                                                                     |
| -------------------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| `client.ts` 다시 구현                        | 제외 | main에 이미 있다: `FormData`면 본문을 그대로 보내고 `Content-Type`을 지운다              |
| 공통 클라이언트 테스트에 multipart 계약 추가 | 채택 | 지금은 고지서 기능 테스트로만 확인된다. 관리자 문서 업로드(#41)도 같은 클라이언트를 쓴다 |
| MSW multipart 핸들러 새로 추가               | 제외 | 고지서 핸들러(`mocks/handlers/bills.ts`)가 이미 `formData()`를 읽고 413을 돌려준다       |

## 반영 내용

`src/shared/api/client.test.ts`에 테스트를 추가했다.

- `FormData`를 그대로 보내고, 호출한 쪽이 `Content-Type: application/json`을 넣어도 지워서 브라우저가 `multipart/form-data; boundary=`를 붙인다. `Accept`·`X-XSRF-TOKEN`·쿠키(`credentials: 'include'`)·파일 이름·형식·내용·일반 필드도 확인한다.
- 이미 취소된 `AbortSignal`이면 업로드를 보내지 않고 `AbortError`로 끝난다.
- 프록시가 HTML로 준 413도 `ApiError`(413, `HTTP_ERROR`)로 들어온다.
- 회귀 방지: JSON 본문은 계속 `application/json`으로 보낸다.

할 일과 확인 위치:

| #44 할 일                                 | 확인 위치                                                                        |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| `FormData` 그대로, `Content-Type` 안 넣음 | `client.test.ts`(이번 추가)                                                      |
| CSRF·쿠키·`CSRF_TOKEN_INVALID` 1회 재시도 | `bill-translation/api.test.ts`: 재시도 때 같은 `FormData`(필드·파일)를 다시 보냄 |
| 요청 취소(`AbortSignal`)                  | `client.test.ts`(보내기 전), `bill-translation/api.test.ts`(보내는 중)           |
| 413·파일 형식 오류 → `ApiError`           | `client.test.ts`(프록시 413), `bill-translation/api.test.ts`(BE 413·400)         |
| MSW multipart 핸들러 예시                 | `mocks/handlers/bills.ts`                                                        |

## 검증

| 확인 항목                  | 방법                                              | 결과                                 |
| -------------------------- | ------------------------------------------------- | ------------------------------------ |
| 타입·린트·형식·Vitest·빌드 | `npm run check`                                   | 통과(39파일, 330개 테스트)           |
| 새 테스트가 회귀를 잡는지  | `headers.delete('Content-Type')`를 잠시 빼고 실행 | boundary 테스트 실패, 되돌린 뒤 통과 |

미검증: 실제 BE·프록시를 거친 업로드(고지서 번역 PR #88에서 실제 BE로 확인한 범위는 그 PR 기록을 따른다).

## 남은 작업

- 관리자 근거 문서 업로드(#41)는 같은 `apiRequest`에 `FormData`를 넘겨 구현한다.
