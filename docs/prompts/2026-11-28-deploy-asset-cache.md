# 배포 중 asset 캐시 오염으로 생활 안내 화면 스타일이 빠지는 문제

- 작성일: 2026-11-28
- 관련 이슈 / PR: 미생성 / 미생성 (Siot-BE 짝 PR 미생성)

## 목적

운영(`https://34-22-97-3.sslip.io/rules`)에서 생활 안내 화면의 스타일이 통째로 빠져 기본 링크 목록처럼 보였다. 원인을 찾아 재발을 막는다.

## 핵심 요청

- 생활 안내 화면이 깨져 보이니 확인하고 조치한다. 로컬 목업에서는 정상이고 운영 주소에서만 깨졌다.

## 원인

- 브라우저 캐시에 `/assets/rule-pages-BufkLb4V.css` 가 CSS 가 아니라 `index.html`(871바이트, `text/html`)로, `Cache-Control: public, max-age=31536000, immutable` 과 함께 저장돼 있었다. 그래서 스타일시트 규칙이 0개였다. 같은 주소를 캐시 없이 받으면 정상 CSS(7121바이트, `text/css`)가 온다.
- 운영 Caddy(Siot-BE `docker-compose.yml`)가 없는 `/assets/*` 에도 `try_files {path} /index.html` 로 `index.html` 을 200 으로 주고, `/assets/*` 용 1년 `immutable` 헤더를 붙였다. 운영에서 없는 asset(`/assets/does-not-exist-123.css`)을 요청하면 지금도 200 `text/html` + `immutable` 이다.
- FE 배포(`frontend-ci.yml`)는 배포 폴더를 비운 뒤(`find -delete`) 새 파일을 복사했다. 그 사이나, 배포 전에 열어 둔 탭이 예전 해시의 화면 묶음(생활 안내는 지연 로드)을 요청하면 위 응답이 1년 동안 캐시된다.

## 선택과 이유

| 검토한 방법                                                                   | 선택 | 이유                                                                                                      |
| ----------------------------------------------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------- |
| Caddy: 있는 asset 만 1년 캐시, 없는 asset 은 `no-store` 404                   | 채택 | HTML 이 CSS·JS 자리에 캐시되는 것을 막는 직접 원인 수정 (Siot-BE)                                         |
| FE 배포: 새 assets 먼저 → 나머지 → `index.html` 마지막, 예전 assets 14일 보관 | 채택 | 배포 중 빈 폴더 구간을 없애고, 열어 둔 탭이 예전 묶음을 계속 받을 수 있다                                 |
| 지연 로드 실패 시 자동 새로고침(`vite:preloadError`)                          | 보류 | 이번 원인과 별개. 404 가 되면 효과가 있지만 요청받지 않은 동작 변경이다                                   |
| 모든 asset 파일 이름을 한 번 바꿔 이미 오염된 캐시를 무력화                   | 보류 | 오염은 배포 순간에 요청한 브라우저에만 남는다. 강력 새로고침으로 풀리며, 전체 무력화는 팀 판단이 필요하다 |

## 반영 내용

- `.github/workflows/frontend-ci.yml` 의 VM 교체 단계 순서 변경: 백업 → 새 `assets/` 추가(예전 파일 유지) → `assets`·`index.html` 외 항목 교체 → `index.html` 을 임시 이름으로 복사 후 `mv` → 14일 지난 assets 삭제.
- Siot-BE(별도 PR): Caddy 설정과 `docs/deployment.md` 수동 배포 절차를 같은 순서로 수정.

## 검증

| 확인 항목            | 방법                                                                                             | 결과                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| 운영 원인            | Chrome 에서 운영 `/rules` 의 스타일시트·캐시 응답 확인                                           | 위 '원인' 내용 확인                                                                                                 |
| 배포 단계 순서       | workflow 의 VM 명령을 로컬 bash 로 실행(`gcloud`·`sudo` 대체, 임시 폴더)                         | 새 assets 추가, 예전 asset 유지, 같은 이름 갱신, 30일 된 asset 삭제, 빠진 파일 삭제, `index.html` 교체, `.old` 백업 |
| Caddy 설정 (Siot-BE) | compose 에서 만든 Caddyfile 을 `caddy:2.10.2-alpine`(Google 미러) 로 `validate` 후 실행해 `curl` | 있는 asset 200 + 1년 캐시, 없는 asset 404 + `no-store`, 화면 경로 `index.html` + `no-cache`                         |

미검증: 실제 VM 배포와 GitHub Actions 실행(병합 후 확인). 이미 오염된 브라우저는 서버를 고쳐도 강력 새로고침(Ctrl+Shift+R)이나 사이트 데이터 삭제가 필요하다.

## 남은 작업

- Siot-BE PR 병합 후 VM 에서 `sudo docker compose up -d --no-build` 로 Caddy 설정 반영(Caddyfile 은 compose `configs` 에 있다).
- 오염된 브라우저 안내 또는 asset 이름 일괄 변경 여부 결정.
