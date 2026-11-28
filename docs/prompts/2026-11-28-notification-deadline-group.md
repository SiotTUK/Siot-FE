# 알림 종류 '생활 마감' 묶음 수정

- 작성일: 2026-11-28
- 관련 이슈 / PR: SiotTUK/Siot-FE#52

## 목적

알림 목록 종류 배지(Figma M09)에서 BE가 실제로 저장하는 마감 알림 종류 `REGISTRATION`·`RESIDENCE_REPORT`·`BILL_DUE`가 '생활 마감'이 아니라 '알림'으로 나오는 문제를 고친다.

## 핵심 요청

- 이슈 #52를 기준으로 수정한다. PR #25는 이미 병합돼 새 브랜치에서 고친다.

## 선택과 이유

| 검토한 방법                                 | 선택 | 이유                                                                                                  |
| ------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------- |
| 알림 묶음에서 `CHECKLIST_DEADLINE` 제외     | 채택 | BE `NotificationResponse.kind` 설명·`NotificationScheduler`에서 알림 종류로 저장하지 않는 설정 종류다 |
| 설정 묶음(`preferenceGroups`)은 그대로 유지 | 채택 | BE 설정 종류는 여전히 `STAY_EXPIRY`·`CHECKLIST_DEADLINE`·`TAX`·`EVENT`·`NOTICE_CHANGED`다             |

## 반영 내용

- `notificationGroup`의 생활 마감: `STAY_EXPIRY`·`REGISTRATION`·`RESIDENCE_REPORT`·`TAX`·`BILL_DUE`
- `NotificationItem.kind` 설명을 BE 알림 종류로 갱신
- MSW 알림 목업에 `REGISTRATION`(CL-01)·`RESIDENCE_REPORT`(LC-01-1)·`BILL_DUE`(고지서 번역) 읽은 알림 추가
- 단위 테스트(종류별 묶음)·계약 테스트(목업 목록의 마감 종류 묶음) 추가

## 검증

| 확인 항목                  | 방법              | 결과                                                     |
| -------------------------- | ----------------- | -------------------------------------------------------- |
| 타입·린트·형식·Vitest·빌드 | `npm run check`   | 통과                                                     |
| 알림 목록 배지             | 목업 화면 촬영    | 외국인등록·체류지 변경·고지서 납부 알림이 생활 마감 배지 |
| BE 알림 종류 대조          | BE main 소스 확인 | `NotificationResponse`·스케줄러·`BillDueNotifier`와 일치 |

미검증: 실제 BE 알림으로 화면 확인(목업·테스트만 수행)

스크린샷: [알림 목록 생활 마감 배지](assets/2026-11-28-notification-deadline-group-deadline.png) — 390×844, MSW 목업(`npm run dev:mock`), 목업 계정으로 로그인. Playwright 스크립트는 저장소 밖 임시 폴더에 두고 커밋하지 않는다.
