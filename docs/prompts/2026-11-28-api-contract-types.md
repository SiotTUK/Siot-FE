# BE API와 다른 FE 타입·오류 문구 맞춤

- 작성일: 2026-11-28
- 관련 이슈 / PR: SiotTUK/Siot-FE#51

## 목적

BE API(main `d08db7c`)와 FE 타입·오류 문구가 다른 곳을 맞춘다. 값이 타입 밖으로 들어오거나 en·zh·vi 화면에 한국어 서버 메시지가 나오는 문제를 없앤다.

## 핵심 요청

- 이슈 #51과 이슈 댓글의 BE 반영 현황을 기준으로 수정한다.
- 화면 표시(출처 쪽수·관리자 문구 편집)는 각 담당 이슈에서 다루고, 이번에는 타입·문구·목업·테스트만 맞춘다.

## 선택과 이유

| 검토한 방법                                        | 선택 | 이유                                                                                           |
| -------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------- |
| `thumbnailUrl` 이름 유지, optional 제거            | 채택 | BE가 같은 이름으로 늘 보내고 값이 없으면 `null`(BE #28·#19)                                    |
| 목업 행사에 사진 URL 채우기                        | 제외 | 목업용 사진 자산이 없다. 실제 응답처럼 `null`을 준다                                           |
| 공통 오류 문구를 shared, 생활 변화 오류는 기능에   | 채택 | 기존 구성과 같다. shared는 features를 가져오지 않으므로 생활 변화 오류 테스트는 기능 쪽에 둔다 |
| 관리자 문구 목업 저장 시 쪽수 유지·`reviewed` 계산 | 채택 | 쪽수는 문서 적재에서 오고, ko 외 언어를 관리자가 저장하면 `reviewed: true`(BE #23 설명)        |

## 반영 내용

- `Referral.contacts[].topic`에 `TAX`·`LABOR`·`WORK_INJURY` 추가
- `EventSummary.thumbnailUrl`을 `string | null`(필수)로 변경, 목업 행사에 `thumbnailUrl: null`
- 공통 오류 `NOT_FOUND`·`METHOD_NOT_ALLOWED`·`UNSUPPORTED_MEDIA_TYPE`, 생활 변화 오류 `LIFE_CHANGE_DATE_INVALID` 4개 언어 문구 추가
- `ChecklistItemResponse`에 `pageStart`·`pageEnd` 추가(`sourcePages`는 기존)
- `GuideTranslationResponse`에 `pageStart`·`pageEnd`·`sourcePages`·`points`·`when`·`contact`·`reviewed` 추가, 관리자 목업·테스트 갱신
- 챗봇 목업에 해고·임금 체불 질문의 `LABOR` 상담 안내(☎1350, BE `Referral` 문구) 추가
- 테스트: 공통 오류 코드 4개 언어 번역, `LIFE_CHANGE_DATE_INVALID` 번역

## 검증

| 확인 항목                   | 방법              | 결과                      |
| --------------------------- | ----------------- | ------------------------- |
| 타입·린트·형식·Vitest·빌드  | `npm run check`   | 통과(테스트 47파일 503개) |
| BE 응답 필드·오류 코드 대조 | BE main 소스 확인 | DTO·`ErrorCode`와 일치    |

미검증: 실제 BE 연동 화면 확인(화면 표시 변경 없음, 목업·타입 검사만 수행)

## 남은 작업

- 출처 쪽수 표시: 체크리스트 상세 #30, 관리자 문구 편집
- 관리자 문구 저장 요청의 `points`·`when`·`contact` 입력은 관리자 생활수칙 편집에서 다룬다
