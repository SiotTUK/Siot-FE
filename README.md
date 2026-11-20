# Siot-FE: 웰컴시흥

시흥시 외국인을 위한 다국어 행정/생활 안내 서비스의 프론트엔드.
React/TypeScript/Vite를 사용하며 한국어/영어/중국어/베트남어를 지원한다.

[Figma](https://www.figma.com/design/Vmv4427fMsMvSde21EiSsy?node-id=38-142)
[백엔드 저장소](https://github.com/SiotTUK/Siot-BE)

## 빠른 시작

Node 버전은 [.node-version](.node-version), Node·npm 허용 범위는 [package.json](package.json)을 따른다.
아래 명령은 `Siot-FE` 루트에서 실행한다.

1. `.env.example`을 `.env.local`로 복사한다. 기존 파일이 있으면 유지한다.
2. 의존성을 설치하고 개발 서버를 실행한다.

```sh
npm ci
npm run dev
```

개발 주소는 [http://localhost:5173](http://localhost:5173)이다. 포트가 사용 중이면 자동으로 다른 포트로 전환하지 않는다.
백엔드 없이 개발할 때는 `npm run dev:mock`을 사용한다.

### 백엔드 연결

- `/api` 요청은 기본적으로 `http://localhost:8080`으로 전달한다.
- 주소를 바꾸려면 `.env.local`의 `API_PROXY_TARGET`을 수정하고 개발 서버를 재시작한다.
- BE/DB/Redis 실행은 [백엔드 README](https://github.com/SiotTUK/Siot-BE#빠른-시작)를 따른다.

`VITE_*` 값은 브라우저에 공개된다. 비밀 키·비밀번호를 넣지 않는다.

## 주요 명령

| 명령               | 용도                                  |
| ------------------ | ------------------------------------- |
| `npm run dev`      | BE 연동 개발 서버                     |
| `npm run dev:mock` | MSW 목업 개발 서버                    |
| `npm run check`    | 타입·린트·형식·테스트·운영 빌드 검사  |
| `npm test`         | Vitest 실행                           |
| `npm run audit`    | 전체 의존성 보안 진단                 |
| `npm run build`    | 운영 빌드, 결과는 `dist/`             |
| `npm run preview`  | 빌드 결과 확인, BE 프록시는 별도 구성 |

개별 검사·형식 수정 명령은 [package.json](package.json)의 `scripts`를 참고한다.
`npm run format`은 전체 파일을 수정하므로 형식 수정은 변경한 파일에 한정한다.

## 디렉터리 구조

```text
src/
  app/          # 라우터·레이아웃·Query Client·문구 등록
  pages/        # 라우트별 화면 조립 (auth, onboarding, home, me, chat, admin)
  features/     # 기능별 API·상태·검증·UI·문구 (auth, onboarding, chat, admin)
  shared/
    api/        # 공통 API 클라이언트·응답 타입
    i18n/       # 다국어 설정·공통 문구·오류 문구 변환
    ui/         # 공통 UI 컴포넌트 (필드·버튼·헤더·확인 패널·목록 상태)
  mocks/        # MSW 상태(db.ts)·기능별 핸들러(handlers/)
  test/         # 공통 테스트 설정
  main.tsx      # 앱 진입점
  styles.css    # 디자인 토큰·전역 스타일
docs/prompts/   # 작업 판단·검증 기록
```

기능 구현 시 `src/features/{기능}`에 해당 기능의 API·상태·검증·UI를 모은다.
빈 디렉터리를 미리 만들지 않고, 기능 규모에 따라 `api`·`model`·`ui`로 나눈다.

- 화면 문구는 기능·화면마다 `messages.ts`(ko·en·zh·vi)에 두고 `app/messages.ts`에서 등록한다. 언어별 키가 다르면 타입 검사에서 실패한다. 내부용 관리자 화면 문구는 한국어만 둔다.
- 색·간격은 `styles.css`의 토큰을, 화면 요소는 `shared/ui` 컴포넌트를 쓴다. 디자인 변경은 토큰과 공통 컴포넌트에서 한다.

- 의존 방향: `app/pages → features → shared`. `shared`는 상위 계층을 참조하지 않는다.
- 상태: 서버 데이터는 TanStack Query, 로컬 UI는 `useState`, 공유 초안은 기능 범위 Context.
- 폼/문구: React Hook Form·Zod, react-i18next.
- 이름: 컴포넌트는 PascalCase, 파일·디렉터리는 kebab-case. `@/`는 `src` 별칭.
- 스타일/테스트: 전용 스타일은 `*.module.css`, 로직 테스트는 대상 파일 옆 `*.test.ts`.

`prototypes/`는 참고 자료이며 운영 빌드에 포함하지 않는다. 화면 흐름은 상단의 Figma를 기준으로 한다.

## API 연동

[Swagger API 문서](http://34.22.97.3:8080/swagger-ui/index.html#/)에서 엔드포인트와 요청·응답을 확인한다.
공개 HTTP 주소이므로 실제 비밀번호·토큰을 입력하지 않는다.

계약은 BE의 [인증 명세](https://github.com/SiotTUK/Siot-BE/blob/main/docs/api-auth.md)와 [공통 규칙](https://github.com/SiotTUK/Siot-BE/blob/main/docs/conventions.md)을 기준으로 한다.
인증은 이메일과 세션 쿠키를 사용한다. API 변경 시 명세·FE 타입·목업·테스트를 함께 확인한다.

- 공통 요청은 `src/shared/api/client.ts`의 `apiRequest`를 사용한다.
- 세션 쿠키를 전송하고, 상태 변경 요청에는 CSRF 토큰을 포함한다. 인증 전환 시 `refreshCsrf`로 갱신한다.
- 목업은 개발·테스트에만 사용하며 실제 연동 검증과 구분한다. 목업 범위는 `src/mocks/handlers.ts`에서 확인한다.
- 운영 배포 시 SPA fallback·`/api` 프록시·HTTPS를 구성한다. [BE 통합 안내](https://github.com/SiotTUK/Siot-BE/blob/main/docs/compose-integration.md)를 참고한다.

## 협업 규칙

### 브랜치와 병합

```text
main → 작업 브랜치 → PR·CI → main
```

- 상시 브랜치는 `main`만 사용한다. 작업 브랜치는 최신 `main`에서 만들고 PR 대상도 `main`으로 지정한다.
- 브랜치 이름은 `feature/{기능}/{작업}`, `fix/{작업}`, `docs/{작업}`, `chore/{작업}`을 사용한다.
- `main`에 직접 커밋하거나 force push하지 않는다.
- 리뷰는 필요할 때 서로 요청하며 승인 필수 조건은 두지 않는다. CI 통과 후 작성자가 직접 병합할 수 있다.
- 작업 PR은 squash merge하고 병합된 작업 브랜치는 삭제한다.
- 커밋·PR 제목은 `type: 내용` 형식이다. `feat`·`fix`·`refactor`·`test`·`docs`·`chore`·`style`을 사용한다.

GitHub의 `main` 보호 규칙은 PR·`check` 통과를 요구하고, force push와 브랜치 삭제를 금지하도록 설정한다. 리뷰 승인은 필수가 아니다.
CI는 `main` 대상 PR과 `main` 푸시에서 `npm ci` → `npm run audit` → `npm run check`를 실행한다.

### PR과 AI 협업 기록

- [PR 템플릿](.github/pull_request_template.md)에 변경 목적·내용·관련 이슈/PR·검증 결과를 작성한다. 화면 변경에는 스크린샷을 첨부한다.
- [AI 협업 기록 템플릿](docs/prompts/TEMPLATE.md)을 바탕으로 `docs/prompts/YYYY-MM-DD-주제.md`를 작성하고 PR에 GitHub 전체 URL을 연결한다. 가능하면 커밋 SHA 영구 링크를 사용한다.
- 단순 오탈자·색상 수정은 PR에 ‘해당 없음’과 이유를 적어 별도 기록을 생략할 수 있다.
- 같은 작업의 기록은 판단을 보존하며 갱신한다. 병합 후 후속 작업은 새 기록에서 이전 기록·PR을 연결한다.
- 목업 확인·실제 API 연동·미검증 항목을 구분하고 남은 작업과 BE 선행 작업을 적는다.
- AI 작업은 [CLAUDE.md](CLAUDE.md)를 따른다. AI로 작성한 코드도 작성자가 확인하고 동일한 검사를 수행한다.
