# Hermes for Web

[![Public Beta](https://img.shields.io/badge/release-public%20beta-7bc47f?style=for-the-badge)](https://github.com/Reasonofmoon/hermes-web-revised)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![기본 테마](https://img.shields.io/badge/theme-%EB%B2%9A%EA%BD%83-ffb7d5?style=for-the-badge)](#테마--개인화)
[![Setup Packs](https://img.shields.io/badge/workflows-setup%20packs-9ec5ff?style=for-the-badge)](#setup-packs)
[![YouTube](https://img.shields.io/badge/YouTube-배움의%20달인-ff4b5c?style=for-the-badge&logo=youtube)](https://www.youtube.com/@%EB%B0%B0%EC%9B%80%EC%9D%98%EB%8B%AC%EC%9D%B8-p5v)
[![X](https://img.shields.io/badge/X-@reallygood83-111111?style=for-the-badge&logo=x)](https://x.com/reallygood83)

영문 안내: [README.en.md](README.en.md)

Hermes for Web 은 Hermes Agent 를 위한 브라우저 작업실입니다.

쉽게 비유하면:
- Hermes CLI 가 엔진룸이라면, Hermes for Web 은 조종석입니다.
- 텔레그램 구찌가 무전기라면, Hermes for Web 은 관제탑입니다.
- Obsidian 이 책장이라면, Hermes for Web 은 책상입니다.

즉, 그냥 “AI와 대화하는 웹페이지”가 아니라,
작업을 만들고, 점검하고, 저장하고, 이어서 공유하는 작업 공간에 가깝습니다.

이 포크의 핵심 방향은 다음과 같습니다.
- 한국어 친화 UI
- 초보자도 바로 쓰기 쉬운 워크플로우 버튼
- 각 사용자 Hermes memory 를 읽는 개인화 시작 화면
- Darwin 같은 로컬 모델과 GPT 계열 원격 모델의 공존
- WebUI 안에서 아티팩트 생성/관리
- Obsidian / ShareNote / Telegram 흐름을 빠르게 붙일 수 있는 Setup Packs

==================================================

## 이 프로젝트가 지향하는 것

보통 AI 웹 UI 는 채팅창 + 모델 선택기 정도에서 끝나는 경우가 많습니다.
Hermes for Web 은 그보다 한 걸음 더 나아가려고 합니다.

이 UI 로 하고 싶은 것:
- Hermes 와 대화하기
- 노트/브리프/메모 같은 결과물 만들기
- 자주 쓰는 환경을 원클릭으로 세팅하기
- 실행 전에 품질을 간단 점검하기
- 사용자의 기억을 읽어 점점 자기화된 작업실로 만들기

한 문장으로 말하면:
이건 “질문하고 답받는 UI”보다,
“내 작업 방식을 점점 배워가는 AI 작업실”에 더 가깝습니다.

==================================================

## 누가 쓰면 좋은가

이런 분들께 특히 잘 맞습니다.
- Hermes CLI 를 이미 쓰는데 더 보기 쉬운 웹 UI 가 필요한 사람
- Obsidian 중심으로 일하는 사람
- 텔레그램/CLI/WebUI 를 오가며 같은 AI를 쓰고 싶은 사람
- 리서치, 글쓰기, 노트 작성, 자동화까지 한곳에서 하고 싶은 사람
- 로컬 모델(Darwin 등)과 원격 모델(GPT 계열)을 함께 쓰고 싶은 사람

==================================================

## 핵심 개념 5가지

### 1. Personalization from Hermes memory

이 포크는 사용자의 Hermes memory 와 user profile 을 읽어서 시작 화면을 조금씩 개인화합니다.

비유하면:
- 일반 챗봇 UI 는 카페에서 처음 보는 손님을 대하듯 모두에게 똑같이 반응합니다.
- Hermes for Web 은 단골 손님을 알아보는 카페처럼, 사용자의 기억을 바탕으로 더 자연스럽게 시작하려고 합니다.

현재 방향:
- `/api/memory` 를 읽음
- 홈 화면에 개인화 카드 표시
- 사용자 기억이 있으면 그 내용을 바탕으로 “이 작업실은 당신에 맞게 커질 수 있다”는 경험 제공

즉, 특정 한 사람 전용 UI 가 아니라,
각 사용자의 Hermes memory 를 읽어 각자에게 맞게 반응하는 범용 UI 를 지향합니다.

### 2. Cherry Blossom 기본 테마

이 포크의 기본 테마는 벚꽃(Cherry Blossom)입니다.

왜냐하면 첫 화면의 인상은 제품의 악수와 같기 때문입니다.
처음 열었을 때 차갑고 딱딱한 느낌보다,
부드럽고 기억에 남는 감성을 주는 편이 좋다고 판단했습니다.

현재 포함된 테마:
- Cherry Blossom (기본값)
- Neo Brutalism
- Gucci style

추가 요소:
- 벚꽃 꽃잎 애니메이션
- 헤더/사이드바 주변 sakura 장식 이미지

### 3. Setup Packs

Setup Pack 은 “설치/설정 레시피 카드”입니다.

보통은 사용자가 이렇게 해야 합니다:
- 이 도구 설치하고
- 저 설정 확인하고
- 이 플러그인 켜고
- 이 명령어 기억해두고
- 최종적으로 어떤 흐름으로 쓰는지 익혀야 함

Setup Pack 은 이걸 줄여줍니다.
즉,
“무슨 걸 설치해야 하지?”를 줄이고,
“이 버튼 누르면 Hermes 가 환경을 점검하고 세팅을 도와주는” 방향으로 갑니다.

현재 포함된 팩:
- Obsidian Starter Pack
- ShareNote + Telegram Pack
- Obsidian Power Workflow
- Memory Sync Pack

### 4. Artifacts

Artifacts 는 결과물입니다.

쉽게 말해:
채팅이 말이라면,
artifact 는 남는 작업물입니다.

예:
- note
- posting brief
- brief
- memo
- research brief

이 UI 에서는 아티팩트를:
- 만들고
- 열고
- 삭제하고
- Share / Telegram / Memory 액션과 연결할 수 있습니다.

즉 “대화”를 “파일”과 “결과물”로 바꾸는 층입니다.

### 5. Preflight Validator

Preflight 는 비행기 이륙 전 체크리스트 같은 기능입니다.

작업을 실행하기 전에,
“이 상태로 하면 너무 허술하지 않은가?”를 가볍게 점검합니다.

현재 점검 대상:
- note
- posting
- cron

이건 아직 가벼운 MVP 이지만,
사용자 입장에선 “실행해보고 망하는 것”보다,
“실행 전에 한번 점검받는 것”이 훨씬 편합니다.

==================================================

## 주요 기능 요약

### 채팅 + 모델 오케스트레이션
- Darwin 같은 로컬 모델 사용 가능
- GPT-5.4 / GPT-5.4 Mini / Codex 계열 사용 가능
- 세션 단위 모델 전환
- 로컬 모델과 원격 모델을 함께 쓰는 구조

### Workspace 패널
- 현재 세션의 작업 파일 탐색
- markdown / code / image 미리보기
- 파일/폴더 생성
- 결과물을 실제 파일처럼 다루기

### Artifact 워크플로우
- artifact shelf
- 아티팩트 생성 모달
- 생성 / 열기 / 삭제
- AI 후속 보조
- 아티팩트에서 바로:
  - Share
  - Telegram
  - Memory
로 연결 가능

### Setup Packs
- 자주 쓰는 workflow 를 원클릭 bootstrap
- 실행 이력 표시
- 재실행 / 상태 변경 가능

### Preflight Validator
- note check
- posting check
- cron check
- 실행 전 간단한 readiness 점검

### UX / 브랜딩
- 한국어 중심 UI
- 벚꽃 기본 테마
- 벚꽃 장식 / 꽃잎 애니메이션
- 파비콘
- 사이드바 중심 tool organization

==================================================

## 화면을 한 줄씩 이해하기

- 메인 채팅: Hermes 와 생각을 정리하는 공간
- 사이드바 도구 패널: 기능을 관리하는 서랍장
- Workspace: 실제 파일과 결과물을 보는 작업대
- Artifact shelf: 대화를 결과물로 바꾸는 선반
- Setup Packs: 설치/설정을 쉽게 시작하는 레시피 카드
- Preflight: 실행 전 “한 번 보고 가자” 체크리스트

==================================================

## 빠른 시작

### 전제조건
먼저 Hermes Agent 가 설치되어 있어야 합니다.

### 로컬에서 바로 실행

```bash
# 원본 (reallygood83)
git clone https://github.com/reallygood83/hermes-for-web.git

# 또는 이 fork (Reasonofmoon, 본 README 의 기능이 추가된 버전 — public beta,
# 누구나 clone 가능. 코드 기여는 [CONTRIBUTING.md](CONTRIBUTING.md) 참조)
git clone https://github.com/Reasonofmoon/hermes-web-revised.git hermes-for-web

cd hermes-for-web
./start.sh 8788
```

> 본 fork의 추가 기능 (Artifact-First, Agent Desk, UI overhaul 등) 을 쓰려면
> 두 번째 URL 을 사용하세요. **Public beta — 2026-05-13 부터 공개**.
> 막힘 보고는 GitHub Issue, 코드 기여는 PR 환영 ([CONTRIBUTING.md](CONTRIBUTING.md)).
> Phase 1 tester 가이드: [`docs/tester-onboarding.md`](docs/tester-onboarding.md).

그 다음 브라우저에서:

```text
http://localhost:8788
```

### 설치 철학
이 프로젝트는 사용자를 “설명서와 씨름하게” 만들기보다,
“이미 준비된 작업실에 들어가게” 만들고 싶습니다.

그래서 기본 원칙은:
- 가능한 자동 탐지
- 기존 Hermes memory / config 재사용
- 조용히 시스템을 바꾸기보다 guided flow 제공
- Setup Pack 으로 환경 부팅 보조

즉 “부품 상자”보다 “정리된 책상”에 가깝게 만드는 것이 목표입니다.

==================================================

## Setup Packs 설명

### Obsidian Starter Pack
Obsidian 중심으로 시작하고 싶은 사람용입니다.

주요 목표:
- vault 확인
- note 작성 흐름 점검
- Obsidian 친화 markdown workflow 확인

### ShareNote + Telegram Pack
노트를 만들고,
공유 링크를 만들고,
텔레그램까지 이어지는 흐름을 점검하고 싶은 사람용입니다.

주요 목표:
- ShareNote 플러그인/흐름 확인
- 공유 링크 생성 흐름 점검
- Telegram handoff 흐름 정리

### Obsidian Power Workflow
다음을 한 번에 엮고 싶은 사람용입니다.
- note
- posting
- ShareNote
- Telegram handoff

### Memory Sync Pack
CLI / WebUI / Telegram 간의 감각적인 연결을 강화하고 싶은 사람용입니다.

==================================================

## Artifacts 사용법

Artifacts 는 채팅을 작업물로 바꾸는 기능입니다.

### 생성
아티팩트 모달에서 만들 수 있는 유형:
- Note
- Posting Brief
- Brief
- Memo
- Research Brief

### AI 보조
“AI 도움 프롬프트도 함께 준비”를 체크하면,
파일 생성 직후 Hermes 가 그 아티팩트를 더 다듬을 수 있도록 입력창에 적절한 프롬프트를 넣어줍니다.

### 관리
생성된 아티팩트는:
- 열기
- 삭제
- Share
- Telegram
- Memory
액션으로 이어집니다.

즉 아티팩트는 단순 파일이 아니라,
다음 workflow 로 연결되는 발판입니다.

==================================================

## Preflight Validator 설명

Preflight 는 “하기 전에 한번 보는 기능”입니다.

예를 들면:
- note 만들기 전에 note 구조가 괜찮은지
- posting 전에 핵심 메시지가 있는지
- cron 전에 schedule 과 prompt 가 너무 비어있지 않은지

이건 아직 가벼운 버전이지만,
사용자가 실수하기 전에 경고해주는 안전장치 역할을 합니다.

==================================================

## 사이드바 구조를 왜 바꿨나

초기에는 메인 화면에 카드가 너무 많이 쌓여서 복잡해졌습니다.
그건 마치 작업 책상 위에 모든 도구를 한꺼번에 늘어놓은 것과 비슷합니다.

그래서 지금은
- 아티팩트
- 설치팩
- 점검
같은 관리 기능을 사이드바 중심으로 옮겼습니다.

덕분에:
- 메인 화면은 더 깔끔해지고
- 필요한 도구는 왼쪽에서 바로 꺼내 쓰는 구조가 됐습니다.

==================================================

## 소셜 링크

이 포크를 만든 사람의 작업 맥락을 보고 싶다면:
- YouTube: https://www.youtube.com/@%EB%B0%B0%EC%9B%80%EC%9D%98%EB%8B%AC%EC%9D%B8-p5v
- X: https://x.com/reallygood83

README 상단 배지에도 같은 링크가 있습니다.

==================================================

## Private repo 업로드 전 체크 포인트

추천 저장소:
- https://github.com/reallygood83/hermes-for-web

처음엔 private 으로 올리고,
그 다음 깨끗한 머신에서 검증 후 공개 여부를 결정하는 게 좋습니다.

검증 추천 항목:
- Darwin 이 WebUI 에서 정상 응답하는지
- GPT 계열 모델도 정상 응답하는지
- Cherry Blossom 이 기본값인지
- memory 가 있을 때 personalization 카드가 잘 뜨는지
- memory 가 없어도 UI 가 깨지지 않는지
- Setup Packs 가 실행되는지
- Artifact 생성/열기/삭제가 되는지
- 사이드바 패널이 자연스럽게 렌더링되는지

이건 “내 컴퓨터에서는 되는데 남한테는 안 되는” 상황을 줄이기 위한 과정입니다.

==================================================

## 성공 지표

이 fork 가 "잘 되고 있다" 를 어떻게 알 것인가. [App-Factory audit (2026-05-12)](docs/audits/app-factory-2026-05-12.md) 권장에 따라 정량 가이드라인을 명시합니다.

### North Star

> **Weekly Active Workspace Users × ≥1 Artifact 생성**

- *Volume*: 주간 활성 워크스페이스(주 1회 이상 세션 시작) 수
- *Quality multiplier*: 그 중 *≥1 산출물(아티팩트) 생성한 비율*
- 단순 채팅 횟수 대신 **실제 작업 결과물**을 측정

### 활성화 KPI

| KPI | 목표 | 측정 방법 |
|-----|------|----------|
| Setup Pack 무보조 완수율 | ≥60% | N=5 testers · README 도움 없이 Obsidian Starter 완수 |
| 첫 산출물까지 시간 (TTV) | ≤90 초 | 새 세션 시작 → 첫 자동 추출 산출물 누적까지 |
| Week-1 retention | ≥30% | 첫 사용 후 7 일 내 재방문율 |
| 평균 산출물 / 세션 | ≥1 | 세션당 누적되는 산출물 수 |

### PDCA 워크플로우 정량 게이트

위의 [bkit / PDCA 섹션](#bkit--pdca-workflow-지원) EdTech 예시에 측정 게이트 추가:

| Phase | 측정 | 합격 임계값 |
|-------|------|-----------|
| Plan | Setup Pack 완수 시간 | ≤ 5 분 |
| Do | 응답 + 산출물 자동 추출 성공률 | ≥ 80% |
| Check | Preflight 통과율 | 100% |
| Act | revision 생성 vs 새 산출물 비율 | ≥ 1 : 1 (편집 활성도) |
| **Report** | 5차시 강의안 template 일관성 | **≥ 90% same-template usage** |

### 위험 (Risk Register, 간이판)

| 위험 | Trigger | Mitigation | Owner |
|------|---------|-----------|-------|
| Upstream Hermes `/api/memory` 스키마 변경 | hermes-agent main 의 memory route 변경 commit | 본 fork 의 `/api/memory` 호출에 schema 버전 핀 + fallback (memory 없이도 UI 동작) | maintainer |
| GPT API 쿼터 고갈 | 사용자 BYO-key 한도 도달 | 응답에서 rate-limit 감지 시 명확한 fallback 안내 + Darwin 로컬 전환 안내 | maintainer |
| Setup Pack 중간 실패 | 외부 도구(Obsidian/Telegram) 미설치 | Preflight 가 사전 차단, 실패 시 부분 진행 상태 보존 + 사용자 알림 | maintainer |
| 테마 호불호 (Cherry Blossom 기본) | 사용자 피드백 / 분기 fork | 첫 실행 시 테마 선택 모달 (UI Phase C 후속) | maintainer |

### 솔로 + BYO-Key + Self-Host (팀·예산 모델)

- **빌더**: solo maintainer
- **인프라**: BYO-key (사용자가 직접 GPT/Anthropic 키 등록, 본인 API 비용 부담)
- **호스팅**: self-host (`./start.sh`), SaaS 없음
- **Setup Pack 비용**: 로컬(Darwin) = 무료, 원격(GPT/Anthropic) = 사용자 키 한도

### 측정 인프라 (TODO)

현재 fork 에 사용량 측정 인프라가 없습니다. 위 지표를 측정하려면 *최소 3 가지 instrumentation* 이 필요:

1. 세션 시작 / 산출물 생성 / Setup Pack 실행 카운터 (localStorage 또는 backend)
2. TTV 측정 (세션 시작 timestamp ↔ 첫 산출물 timestamp)
3. 외부 분석 도구 *없이* 익명 집계 (사용자 프라이버시 보호)

이는 향후 작업 항목 — 현재 README 의 지표는 **지향 목표**로 받아주세요.

> *이 섹션은 App-Factory `audit-spec` 의 G5 + G3 + G4 + G1 권장 (Top fix priorities)을 반영한 것입니다. 전체 audit 결과는 [docs/audits/app-factory-2026-05-12.md](docs/audits/app-factory-2026-05-12.md) 참고.*

==================================================

## bkit / PDCA Workflow 지원

Hermes for Web 은 **App Factory + bkit** 의 *PDCA 사이클* 과 *Next Best Move* 패턴을 자연스럽게 지원하도록 설계되어 있습니다. 즉, "아이디어 → 실행 → 점검 → 다음 한 걸음" 의 루프를 UI 위에서 그대로 따라갈 수 있습니다.

이 섹션은 *왜 hermes-for-web 이 단순 챗 UI 보다 워크플로우 도구에 가까운가* 를 한눈에 보여 줍니다.

### PDCA 사이클 매핑

bkit 의 5 단계 사이클이 Hermes for Web 의 어느 기능에 대응되는지:

| bkit Phase | 의미 | Hermes for Web 에서 |
|-----------|------|---------------------|
| **Plan** | 스펙 · 범위 · acceptance criteria 정의 | Setup Packs · Preflight Validator · 새 세션 (workspace 결정) |
| **Do** | 가장 작은 유용한 변경 또는 결과물 | 원클릭 워크플로우 버튼 · Hermes 응답 스트림 · 아티팩트 자동 생성 |
| **Check** | 검증 · 테스트 · 리뷰 | Preflight 점검 · 워크스페이스 git status · 사용자 직접 검토 |
| **Act** | 통합 · 문서 갱신 · 다음 슬라이스 선택 | 아티팩트 편집/revision · 메모리 저장 · 텔레그램 핸드오프 |
| **Report** | 결과 + 다음 best move 요약 | Hermes 응답 footer · 세션 export · ShareNote 공유 |

### Next Best Move 패턴

bkit 의 핵심은 *모든 응답이 다음 한 걸음을 제안하는 것* 입니다:

```text
Next best move: <one concrete action>
Reason: <왜 이게 가장 high-leverage 인가>
Gate: <scope|quality|security|docs|release>
Automation: <manual|guided|semi_auto|auto>
Risk: <low|medium|high>
```

Hermes 응답에 이 footer 를 요청하면 자동으로 만들어집니다.

예시 프롬프트:
> "지금부터 모든 응답 마지막에 bkit 형식의 Next best move 를 붙여줘."

### 자동화 레벨

| 레벨 | 의미 | hermes-for-web 어디서 |
|------|------|---------------------|
| `manual` | 모든 동작 승인 필요 | 위험 명령 (terminal 도구의 approval gate) |
| `guided` | 읽기 · 검토 자유, 쓰기 전 승인 | 파일 작업 · git operation |
| `semi_auto` | 비파괴 + 범위 한정 편집 자동 | 아티팩트 추출 · 메모리 갱신 · 모델 응답 |
| `auto` | 사전 승인된 워크플로우 | Cron 작업 · Setup Pack 실행 |

기본값: 일반 채팅은 `semi_auto`, 파일 변경 / git 푸시 / 외부 발송은 `guided` 로 동작합니다.

### Quality Gates

변경이 어느 게이트를 통과했는지 명시 (응답에 포함 또는 PR 본문에):

- `scope` — 영향 범위 + acceptance criteria 이해
- `quality` — 검증 완료 또는 그게 다음 action
- `security` — 위험 · 시크릿 · 외부 효과 검토
- `docs` — 문서 · 플랜 · 구현 동기화
- `release` — 발행 전 광범위 검증

### bkit 스킬 설치

이 레포에 포함된 스킬 패키지를 풀어서 글로벌 사용:

```bash
# Claude Code (Windows)
Expand-Archive docs/skill-packages/app-factory-bkit.zip -DestinationPath $env:USERPROFILE/.claude/skills/

# Claude Code (macOS/Linux)
unzip docs/skill-packages/app-factory-bkit.zip -d ~/.claude/skills/

# Codex
unzip docs/skill-packages/app-factory-bkit.zip -d ~/.codex/skills/

# Hermes CLI
unzip docs/skill-packages/app-factory-bkit.zip -d ~/.hermes/skills/
```

설치 후 "PDCA", "next best move", "quality gate" 같은 자연어 트리거로 자동 활성화. Claude Code 에서는 `/app-factory-bkit` 슬래시 명령으로도 호출 가능.

### 더 깊이 알기

| 문서 | 내용 |
|------|------|
| [`docs/skill-packages/app-factory-bkit.zip`](docs/skill-packages/app-factory-bkit.zip) | 스킬 패키지 (SKILL.md + 3개 reference) |
| `SKILL.md` (zip 안) | 5 단계 PDCA · Next Best Move 스키마 · 자동화 가이드 |
| `references/bkit.md` | PDCA · automation levels · quality gates · hooks · agent teams |
| `references/app-factory.md` | module manifest · envelope · catalog · provenance |
| `references/hermes-adaptation.md` | Hermes 매핑 (tool schema → manifest, session DB → envelope 등) |

### EdTech 워크플로우 예시 (영어 학습 콘텐츠 제작 기준)

```text
[Plan]   Setup Pack "Obsidian Starter" 실행 → vault 경로 확정
[Do]     원클릭 워크플로우 "노트 생성" → Hermes 가 5차시 강의안 초안 작성
[Check]  아티팩트 패널에서 slides 렌더로 페이지별 확인 + Preflight 점검
[Act]    인라인 편집으로 1차시 수정 → revision 저장 → 메모리에 학습자 프로필 업데이트
[Report] ShareNote 노트 생성 → 텔레그램 핸드오프로 학생에게 공유

Next best move: 2차시 워크북 만들기 ("아티팩트 빠른 실행" → "포스팅 브리프 생성")
Reason: 강의안 차시별 출력 일관성 확보가 다음 quality gate
Gate: scope
Automation: semi_auto
Risk: low
```

이런 흐름이 *AI 채팅 UI* 보다 *작업실* 에 가까운 이유입니다.

==================================================

## 추천 다음 단계

private repo 올린 뒤에는 이렇게 가는 걸 추천합니다.

1. private repo push
2. 다른 Hermes 사용자 1명 이상에게 테스트 받아보기
3. Setup Packs / Artifact / Preflight 중 어디가 헷갈렸는지 확인
4. README 와 첫 화면 copy 를 더 쉽게 다듬기
5. 그 다음 공개 전환 검토

좋은 제품은 설명을 덜 필요로 합니다.
훌륭한 제품은 사용자가 “원래 이랬어야 하는데?”라고 느끼게 만듭니다.
이 포크는 그 방향을 목표로 합니다.

==================================================

## 라이선스 / 업스트림 메모

이 저장소는 Hermes WebUI 기반의 workflow-focused fork 입니다.
나중에 public 으로 열 경우,
업스트림 크레딧과 포크에서 추가한 기능을 명확히 적는 것을 권장합니다.
