# 체크리스트 상세 화면

- 작성일: 2026-11-27
- 관련 이슈 / PR: 미생성. 선행 작업 https://github.com/SiotTUK/Siot-FE/pull/8

## 목적

Figma M07a(체크리스트 상세) 화면을 추가하여 홈 및 생활 변화의 할 일 카드에서 상세 화면으로 진입할 수 있도록 하고, 기한·신청 장소·준비물·수수료·근거 법령·불이익·문의처 등 사실 목록과 링크, 안내 변경 배너, 완료 상태 토글, 질문하기, 공유, 정보 오류 신고 기능을 제공한다.

## 핵심 요청

요약: 홈 카드가 기본 정보만 노출하고 상세 화면으로 연결되지 않던 점을 보완해 Figma M07a 기준 상세 화면(`/home/checklist/:code`)을 구현한다. 기존 `GET /api/members/me/checklist` 응답의 미사용 필드를 활용해 상세 사실 목록을 표시하고, 값이 없는 항목은 숨긴다. 안내 변경 배너, 완료/취소 상태 저장, 공식 출처/전화/지도 검색 링크, 제목을 채운 챗봇 연동, Web Share/클립보드 복사 공유 기능, 4개 언어 지원 및 오류 신고를 구현한다.

## 선택과 이유

| 검토한 방법                                | 선택 | 이유                                                                                                                                                                                                        |
| ------------------------------------------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 단건 조회 API 별도 요청                    | 제외 | `GET /api/members/me/checklist` 목록 응답에 필요한 상세 필드가 이미 모두 포함되어 있고, 홈 화면에서 TanStack Query로 캐싱되므로 `code`로 클라이언트 탐색하는 것이 빠르고 추가 네트워크 비용이 없다(AI 판단) |
| `POST /api/reports` 연동 시 `guideId` 전달 | 채택 | BE `ChecklistItemResponse`에 `Long guideId`가 이미 구현되어 있고, BE `ContentReportRequest`도 `guideId`와 `guideCode`를 모두 수용하므로 안정적으로 오류 신고를 연동할 수 있다(AI 판단)                      |
| '찾아가는 길' 지도 검색 링크               | 채택 | 별도 위경도 좌표 API가 없으므로 `place` 기관/장소명을 카카오맵 검색 파라미터(`https://map.kakao.com/?q=...`)로 연결하고, 장소 정보가 없으면 링크를 숨긴다(AI 판단)                                          |
| '질문하기' 시 챗봇에 항목 제목 전달        | 채택 | `/chat?q=...` 및 라우트 state로 제목을 전달하고, 챗봇 화면 진입 시 `useChatConversation`의 초기 draft로 반영해 즉시 전송 또는 수정할 수 있게 한다(AI 판단)                                                  |
| Web Share API 및 클립보드 복사             | 채택 | `navigator.share`를 우선 사용하고 미지원 환경이나 거부 시 `navigator.clipboard.writeText` 복사 및 안내 토스트를 띄운다(AI 판단)                                                                             |

## 반영 내용

- `src/features/checklist/api.ts`: `ChecklistItemResponse`에 `guideId`, `category`, `warning` 등 최신 필드 정의 추가
- `src/features/checklist/use-checklist.ts`: `useChecklistItem` 단건 조회 훅 추가
- `src/features/checklist/checklist-report.ts`, `checklist-report.tsx`: 체크리스트 오류 신고 스키마 및 접수 컴포넌트 추가
- `src/features/checklist/ui/checklist-detail.tsx`, `checklist-detail.module.css`: Figma M07a 기준 상세 화면 구현 (헤더, 안내 변경 배너, 태그, 사실 목록, 링크, 오류 신고, 질문하기, 완료 토글, 공유)
- `src/pages/home/checklist-detail-page.tsx`: 할 일 상세 라우트 페이지 조립 및 404/로딩 처리
- `src/app/router.tsx`: `/home/checklist/:code` 경로 등록
- `src/features/checklist/ui/checklist-card.tsx`, `checklist.module.css`: 제목 링크 및 '기한과 준비물 보기 ›' 상세 링크 추가
- `src/features/chat/use-chat-conversation.ts`, `src/pages/chat/chat-pages.tsx`: 쿼리 스트링 또는 state를 통한 초기 질문 draft 수신 지원
- `src/features/checklist/messages.ts`: 4개 언어(ko, en, zh, vi) 상세 화면 문구 및 오류 신고 문구 등록
- `src/mocks/handlers/checklist.ts`: 모의 데이터에 상세 필드(`place`, `docs`, `fee`, `penalty`, `contact`, `sourceUrl`, `guideId` 등) 보강
- `src/features/checklist/checklist-report.test.ts`, `checklist.test.ts`: 오류 신고 유효성 검사/API 모의 테스트 및 상세 필드 테스트 추가

## 검증

| 확인 항목                  | 방법                       | 결과                                                                                             |
| -------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| 타입·린트·포맷·테스트·빌드 | `npm run check`            | 전체 통과 (TypeScript, ESLint, Prettier, Vitest 25개 스위트 / 185개 테스트 통과, 운영 빌드 완료) |
| 오류 신고 검증             | `checklist-report.test.ts` | 인용문구 필수·사유 선택 유효성 검사 및 `POST /api/reports` 접수 통과                             |
| 다국어 정합성              | TypeScript 빌드            | `defineMessages`를 통한 ko·en·zh·vi 4개 언어 키 일치 검증 통과                                   |

미검증: 실기기(모바일 디바이스) Web Share 동작 확인, 실제 운영 DB 가이드 데이터 연동 확인.

## 남은 작업

- PR 생성 및 사용자 확인
