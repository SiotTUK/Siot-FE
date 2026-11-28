# 회원 생활수칙 동적 카테고리 및 카테고리 이름 번역 표시 (RUL-12·13)

- 작성일: 2026-11-28
- 관련 이슈 / PR: #132 (관련 #43) / PR 생성 전

## 목적

회원 생활수칙 화면이 6개 고정 카테고리(`ruleCategories`)와 FE 고정 문구(`rules.categories.*`)만 사용해, 관리자가 추가한 카테고리(`key: null`)와 수정한 카테고리 이름·번역이 회원 화면에 보이지 않던 문제(#132, RUL-12·13)를 해결한다.

## 핵심 요청

- `GET /api/rules/categories?language=`에서 카테고리 목록·순서(`sortOrder`)·이름(`name`)·번역 여부(`translated`)를 받아 표시한다.
- 아이콘·색상은 `key`가 있으면 기존 6개 스타일을 유지하고, `key: null`이면 기본 아이콘·색상을 쓴다.
- "분야별 안내"와 카테고리 칩·화면(`/rules/category/:category`)에 `key: null` 카테고리도 포함하고, 상세 화면 태그는 `RuleResponse.categoryName`을 사용한다.
- `translated: false`이면 기존과 같은 `"번역 준비 중"` 태그를 표시하고, 4개 언어·MSW(관리자 추가 카테고리 1개 포함)·테스트를 반영한다.

## 선택과 이유

| 검토한 방법                                                            | 선택 | 이유                                                                                                                      |
| ---------------------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------- |
| 카테고리 경로: `key` 있으면 `key`, `null`이면 한국어 `category`        | 채택 | 기존 6개 기본 카테고리의 URL(`/rules/category/waste` 등)을 깨뜨리지 않으면서, 관리자 추가 카테고리도 안정적으로 연결한다. |
| `groupByCategory(rules, categories?)` 선택 인자 확장                   | 채택 | 기존 테스트·호출부와 하위 호환을 유지하면서 서버 `sortOrder` 기준 그룹핑(관리자 추가 카테고리 포함)을 지원한다.           |
| MSW 목업에 관리자 추가 카테고리 1개(`반려동물`, `zh`/`vi` 미번역) 추가 | 채택 | 관리자 추가 카테고리 표시·상세 태그·`translated: false` "번역 준비 중" 흐름을 목업 환경에서 모두 검증할 수 있다.          |

## 반영 내용

- `src/features/rules/api.ts`, `use-rules.ts`: `RuleCategoryResponse`, `fetchRuleCategories`, `useRuleCategories` 추가 및 `RuleResponse`에 `category`·`categoryName` 추가.
- `src/features/rules/rules.ts`: `Rule.categoryRaw`·`categoryName`, `isRuleCategory`, `categorySlug`, `categoryPath`, `findRuleCategory`, `ruleBelongsToCategory`, `groupByCategory(rules, categories)` 구현.
- `src/features/rules/ui/category-icon.tsx`, `rules.module.css`: `key: null` 카테고리용 기본 문서 아이콘 및 기본 색상 fallback 추가.
- `src/features/rules/ui/rule-category-grid.tsx`, `rule-category-view.tsx`, `rule-detail.tsx`, `src/pages/rules/rule-pages.tsx`: 서버 카테고리 목록·순서·이름 반영, `categoryName` 상세 태그 및 `translated: false` 시 `"번역 준비 중"` 태그 표시.
- `src/mocks/handlers/rules.ts`, `src/features/rules/rules.test.ts`: `GET */api/rules/categories` 목업 핸들러·관리자 추가 카테고리(`반려동물`) 및 수칙(`pet-registration`) 추가, 단위·MSW 계약 테스트 추가.

## 검증

| 확인 항목                            | 방법                                  | 결과                                                                                                                                        |
| ------------------------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 타입·린트·형식·단위/계약 테스트·빌드 | `npm run check`                       | 통과 (Vitest 61개 파일, 601개 테스트 통과)                                                                                                  |
| 모바일 UI·관리자 카테고리·4개 언어   | `npm run dev:mock` (390×844 브라우저) | 통과 (`/rules` 7개 타일, `/rules/category/반려동물` 칩·목록, `/rules/pet-registration` 태그, `en: Pets`, `vi: 번역 준비 중`, 콘솔 오류 0건) |

미검증: 실제 BE 서버(`Siot-BE`)에서 관리자가 카테고리를 추가·수정한 직후의 실환경 연동.
