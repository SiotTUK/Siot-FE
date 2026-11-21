# 프론트엔드 운영 배포·CI/CD

- 작성일: 2026-11-21
- 관련 이슈 / PR: 미생성

## 목적

FE를 BE와 같은 GCP VM·같은 주소(HTTPS)로 배포하고, `main` 푸시 시 자동 배포되게 한다.

## 핵심 요청

> 프론트엔드랑 백엔드 합쳐서 배포해줘

> 프론트도 자동 CI/CD를 붙이셈

요약: 도메인은 무료 sslip.io 주소, 배포 방식은 VM + Caddy를 사용자가 선택했다.

## 선택과 이유

| 검토한 방법                                      | 선택 | 이유                                                                                                                   |
| ------------------------------------------------ | ---- | ---------------------------------------------------------------------------------------------------------------------- |
| Vercel 호스팅 + rewrites로 BE 연결               | 제외 | AI가 VM + Caddy를 추천하고 사용자가 선택. 다른 주소면 세션 쿠키·CSRF 쿠키가 동작하지 않고, rewrite 구간도 HTTPS가 필요 |
| BE VM에 Caddy를 두고 같은 주소에서 FE·`/api`     | 채택 | `apiRequest`가 상대 경로 `/api`를 쓰므로 코드 변경 없이 쿠키·CSRF가 동작. 인증서 자동 발급                             |
| 도메인: sslip.io(`34-22-97-3.sslip.io`)          | 채택 | 사용자 선택. 도메인 구매 없이 HTTPS 인증서 발급, 나중에 실제 도메인으로 교체 가능                                      |
| 배포 인증: BE의 `github-deployer` 재사용         | 제외 | BE 이미지 push 권한까지 FE 저장소에 생김                                                                               |
| 배포 인증: 별도 `github-fe-deployer` + `siot-fe` | 채택 | VM SSH만 허용. `SiotTUK/Siot-FE`의 `main`에서만 토큰 발급                                                              |
| VM 폴더를 `mv`로 바꿔치기                        | 제외 | Caddy bind mount가 원래 폴더를 계속 가리켜 예전 파일이 나감. 폴더 안의 내용만 교체                                     |

## 반영 내용

- `.github/workflows/frontend-ci.yml`
  - `main` 푸시면 `check`가 만든 `dist/`를 artifact로 넘기고 `deploy` job이 VM `/opt/siot/frontend`에 반영한다. 직전 버전은 `/opt/siot/frontend.old`에 남긴다.
  - 배포 후 운영 주소의 `index.html`이 새 빌드의 JS 파일을 가리키고 그 파일이 열리는지 확인한다.
  - `main` 실행은 취소하지 않는다(배포 도중 끊김 방지). PR은 기존처럼 이전 실행을 취소한다.
- README: 운영 주소·배포 흐름·GCP 인증 방식을 적었다.
- GCP(저장소 밖): 서비스 계정 `github-fe-deployer`(프로젝트 Compute 읽기, VM 1대 관리자 SSH, VM 기본 서비스 계정 사용), WIF provider `github/siot-fe`(`SiotTUK/Siot-FE`·`refs/heads/main`만 허용)를 만들었다.
- BE(Siot-BE `e822df4`): compose에 `caddy` 서비스(web 프로필)와 Caddyfile을 추가했다. 첫 FE 빌드는 로컬에서 만들어 VM에 직접 올렸다.

## 검증

| 확인 항목              | 방법                                              | 결과 |
| ---------------------- | ------------------------------------------------- | ---- |
| 전체 검사              | `npm run check` (타입·린트·형식·Vitest 72개·빌드) | 통과 |
| Caddyfile·compose 문법 | VM에서 `docker compose config`, `caddy validate`  | 통과 |

미검증: 배포 job은 `main` 병합 후 처음 실행된다. 병합 후 Actions 결과와 운영 주소를 확인한다.

## 남은 작업

- 실제 도메인을 쓰게 되면 BE VM `.env`의 `SITE_ADDRESS`·`FRONTEND_BASE_URL`과 이 워크플로의 `SITE_URL`을 바꾼다.
