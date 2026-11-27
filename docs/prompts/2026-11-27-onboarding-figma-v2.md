# 온보딩 화면을 Figma v2에 맞춤

- 작성일: 2026-11-27
- 관련 이슈 / PR: 미생성. 선행 https://github.com/SiotTUK/Siot-FE/pull/64 (시작·회원가입 v2, MascotTip), https://github.com/SiotTUK/Siot-FE/pull/66 (브랜드 색)

## 목적

Figma "웰컴시흥 · 주요 화면 UI"의 "온보딩" 묶음(F02 사용자 유형, F03 입국 날짜, F04 체류 목적, F05 거주 정보, F06 체류 만료일)에 맞춰 온보딩 다섯 화면의 디자인을 바꾼다.

## 핵심 요청

요약: 시작·회원가입 화면에 이어 사용자가 온보딩 디자인도 바꿔 달라고 했다. 색·헤더·마스코트는 앞선 결정(PR #64·#66)을 그대로 따른다.

## 반영

- 헤더: "‹ 화면 이름 · 건너뛰기"(나의 상황·입국 날짜·체류 목적·거주 정보·체류 만료일, 4개 언어 `onboarding.headers.*`). `n / 4` 진행 막대는 헤더에서 본문 맨 위로 옮겼다(새 공통 `StepProgress`). 그래서 `ScreenHeader`의 `progress`는 지웠다(온보딩만 썼다). 뒤로 버튼이 없는 첫 화면은 제목을 본문과 같은 줄에 맞췄다.
- 버튼: 화면 맨 아래 고정이 아니라 내용 바로 아래(Figma).
- F02: 토로 그림. Figma의 ‹는 돌아갈 화면이 없어(로그인한 회원이라 언어 선택으로 못 간다) 넣지 않았다.
- F03: 날짜 아래 안내 카드 대신 토로 안내("날짜를 모르면 건너뛰어도 돼요…").
- F05: 체크 항목을 흰 카드 하나에 묶은 목록(`ChoiceList grouped`) + 해로 안내.
- F06: 날짜 아래 작은 안내 글씨, 해로·토로가 기대 앉은 그림(`haero-toro-hug.png`, Figma 원본에서 빈 여백만 잘라 420px로 줄임), 해로 안내("다 왔어요!…").
- `AnswerInput`에 `onboarding` 옵션을 더했다. 내 정보에서 답을 고치는 화면(M10)은 기존 모양(안내 카드, 카드 목록)을 그대로 쓴다.
- 문구 4개 언어 추가: `onboarding.headers.*`, `onboarding.tips.*`.

## 검증

- `npm run check` 통과(Vitest 227개).
- 390×844 목업 화면에서 다섯 화면을 Figma와 나란히 비교했다.
- 목업에서 온보딩을 처음부터 끝까지 진행해 저장(onboarded, NEW·WORK·CAR)하고 홈으로 가는 것을 확인했다.
- 내 정보 → 입국일·거주 정보 고치기 화면이 바뀌지 않은 것(안내 카드 유지, 마스코트 없음)을 확인했다.
- 스크린샷: [F02](assets/2026-11-27-onboarding-figma-v2-f02-type.png), [F03](assets/2026-11-27-onboarding-figma-v2-f03-entry-date.png), [F04](assets/2026-11-27-onboarding-figma-v2-f04-purpose.png), [F05](assets/2026-11-27-onboarding-figma-v2-f05-residence.png), [F06](assets/2026-11-27-onboarding-figma-v2-f06-stay-expiry.png)

## 2026-11-27 후속: PR #75 셀프 리뷰 — 마스코트 이름을 공통 문구로

- 요약: 사용자가 PR #75 리뷰를 요청했다. 온보딩이 마스코트 이름을 로그인 기능 문구(`authTips.haero`·`authTips.toro`)에서 가져와, 그 키를 지우면 온보딩이 깨질 수 있다고 짚었고 사용자가 고치자고 했다.
- 반영: 이름을 공통 문구 `common.mascots.haero`·`common.mascots.toro`(4개 언어)로 옮기고, `MascotTip`이 이름을 직접 넣는다. 쓰는 쪽은 `mascot`만 넘긴다(회원가입·로그인·온보딩). `authTips.haero`·`authTips.toro`는 지웠다.
- 검증: `npm run check` 통과(Vitest 227개). 목업에서 회원가입(해로)·로그인(토로)·F03(토로)·F05(해로)·F06(해로) 이름이 맞게 나오는 것을 확인했다.

## 2026-11-27 후속: Figma 공통 컴포넌트와 비교해 공용 컴포넌트 정리

- 요약: 사용자가 Figma를 보고 만들 공용 컴포넌트가 있으면 만들어 달라고 했다. AI가 Figma "공통 컴포넌트"·"서비스 패턴"·"상태별 사용 예시"를 `src/shared/ui`와 비교했다. Button·Field·Checkbox·RadioGroup·ChoiceCard·Card·Badge(`Tag`)·Alert(`Notice`)·선택기(`LanguageSelect`)는 이미 있었다. 지금 코드에 같은 모양이 여러 곳에 흩어진 것만 공용으로 만들고, 아직 쓰는 화면이 없는 Tabs·첨부 파일 행·처리 상태 카드는 만들지 않았다(쓰는 화면을 만들 때 같이 만든다).
- 반영:
  - `SearchField`(Figma "기록 검색", 돋보기가 안에 있는 검색칸): 생활 수칙 검색에 쓰고, 기능 쪽 CSS를 지웠다.
  - `TextLink`(문장 전체가 브랜드 색 링크): 로그인·재설정 화면 링크와 언어 선택 화면의 "이미 회원이에요? 로그인"에 쓰고, 두 곳의 같은 CSS를 지웠다.
  - `MascotImage pose="duo" | "toro" | "hug"`: 언어 선택·F02·F06의 마스코트 그림. 크기와 장식용 처리(`alt=""`)를 한 곳에서 정한다.
- 검증: `npm run check` 통과(Vitest 227개). 목업에서 언어 선택·로그인·생활 수칙·F02·F06을 바꾸기 전후로 찍어 비교했고, 다섯 장 모두 픽셀까지 같았다(모양 변화 없음).
- 하지 않은 것: 관리자 회원 검색(다른 담당 영역)은 `SearchField`로 바꾸지 않았다. 홈 진행률(`<progress>`)·생활 수칙 FAQ(`<details>`)는 Figma의 Progress·Accordion과 모양이 달라 이번에 공용으로 합치지 않았다.
