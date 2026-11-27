# 앱 전체 브랜드 색을 #018EDA로

- 작성일: 2026-11-27
- 관련 이슈 / PR: 미생성. 관련 PR https://github.com/SiotTUK/Siot-FE/pull/64 (시작·회원가입 화면 Figma v2)

## 목적

팀이 정한 브랜드 색 `#018EDA`를 앱 전체에 쓴다.

## 핵심 요청

요약: PR #64 리뷰에서 Figma 파란색의 글자 대비를 짚자, 사용자가 Color/Brand를 `#018EDA`로 통일하자고 정했다. 먼저 시작·회원가입 화면에 적용한 뒤 앱 전체도 바꿔 달라고 했다.

## 반영

- `src/styles.css`: `--primary` `#1769dc` → `#018eda`, `--primary-hover` `#1554af` → `#0172ae`. 이 두 토큰 말고 옛 파란색을 직접 쓴 곳은 없었다.
- PR #64의 `auth-theme.module.css`도 `--primary`를 같은 값으로 덮어쓴다. 둘 다 merge되면 그 줄은 지워도 된다.

## 검증

- `npm run check` 통과(Vitest 227개).
- 390×844 목업 화면(홈·생활 달력·내 정보)에서 버튼·탭·진행률·링크 색 확인.
- 글자 대비: `#018eda`는 흰 버튼 글자 3.57, 회색 배경(`#f2f4f6`) 위 링크 약 3.3으로 WCAG AA(4.5:1)에 못 미친다. 이전 `#1769dc`는 5.13·4.66이었다. 팀 결정으로 바꿨고 사용자에게 알렸다.
- 스크린샷(목업, 390×844): [홈](assets/2026-11-27-brand-color-home.png), [생활 달력](assets/2026-11-27-brand-color-calendar.png), [내 정보](assets/2026-11-27-brand-color-me.png)
