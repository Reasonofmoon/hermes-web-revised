# Contributing to Hermes for Web (Revised Fork)

> **현재 stage**: Public beta (2026-05-13 공개 전환)
> **Repo visibility**: public — 누구나 clone / fork / issue 가능
> **Write access**: maintainer 가 승인한 collaborator 만 (Phase 1 PDCA 검증 단계)

이 문서는 *Phase 1 tester* (피드백 제공자) 와 *Write 권한 collaborator* (코드 기여자) 의 워크플로우를 모두 다룹니다. 누구나 issue 와 PR 을 보낼 수 있지만, merge 는 maintainer review 후 진행됩니다.

---

## 1. Quickstart

```bash
# 1. 로컬 clone (public repo — 초대 불필요)
git clone https://github.com/Reasonofmoon/hermes-web-revised.git hermes-for-web
cd hermes-for-web

# 2. Hermes Agent 가 sibling 위치에 있어야 함
#    ../hermes-agent/run_agent.py 확인
ls ../hermes-agent/run_agent.py

# 3. 서버 띄우기
./start.sh 8787

# 4. 브라우저 http://localhost:8787
```

막히면 [`docs/tester-onboarding.md`](docs/tester-onboarding.md) 의 §0-§1 참조.

---

## 2. 권한 정책

Public repo 이므로 read / clone / fork / issue 는 누구나 가능. Write 권한 (직접 push) 은 maintainer 가 승인한 collaborator 만.

| 역할 | 권한 | 대상 |
|------|------|------|
| **Anonymous** | clone + fork + issue 등록 + PR 제출 | 누구나 (GitHub 계정만 있으면) |
| **Triage** | + issue/PR label · close | maintainer 위임 시 |
| **Write** | + push to feature branches + merge own PR | maintainer 가 승인한 정기 contributor |
| **Admin** | + repo 설정 | maintainer (Reasonofmoon) 만 |

**기본**: 외부 contributor 는 fork → PR 흐름. 가치 있는 PR 을 여러 번 보낸 분에게는 maintainer 가 Write 권한 부여.

---

## 3. Phase 1 tester workflow (코드 변경 안 함)

피드백만 주실 분 (Phase 1 PDCA 검증):

1. [`docs/tester-onboarding.md`](docs/tester-onboarding.md) 60분 가이드 따라가기
2. 막히는 단계 발견 → GitHub Issue 만들기 (템플릿 §4)
3. 1주일 후 D7 follow-up 4 질문에 답하기
4. 끝.

코드 직접 수정 X. 막힘 보고만 가치 있음 — maintainer 가 그 보고로 다음 sprint 우선순위 정합니다.

> 💡 PRD §11.3 의 public-launch gate (N=3 PDCA + D7≥30% + 0 blocker) 는 아직 미충족 상태에서 public 으로 전환했습니다. Phase 1 tester 검증이 진행 중이며, 피드백이 그 게이트를 메우는 핵심 자료입니다.

---

## 4. Issue 작성 가이드

[`docs/tester-onboarding.md` §5](docs/tester-onboarding.md#5-피드백-가이드) 에 issue 템플릿 있음. 핵심:

```markdown
# [Phase 1 Tester #N] §X 단계에서 막힘

**환경**: macOS / Linux / Windows-WSL
**Hermes Agent 위치**: (예: ~/.hermes/hermes-agent)
**모델**: GPT-5.5 / Darwin / Sonnet 4.6

## 막힌 단계
docs/tester-onboarding.md §[몇 번] 의 [어떤 동작] 에서

## 일어난 것
...

## 기대한 것
...

## 콘솔 로그 (있으면)
```

심각도는 *보고자가 판단 안 해도 OK* — maintainer 가 분류 ([phase1-tracker §4](docs/phase1-tracker.md#4-피드백-큐-수집된-피드백)).

---

## 5. 외부 contributor / Write collaborator workflow

> 외부 contributor: fork → 본인 fork 에서 작업 → upstream 에 PR.
> Write collaborator: 직접 branch push 가능.

### 5.1 작업 흐름

```bash
# 1. 최신 main pull
git checkout main
git pull origin main

# 2. feature branch
git checkout -b feat/your-feature-name
# 또는 fix/, docs/, chore/, style/

# 3. 작업 + 자주 commit
# Conventional Commits 권장: feat:, fix:, docs:, refactor:, chore:, style:, test:

# 4. push
git push -u origin feat/your-feature-name

# 5. PR 만들기 (GitHub UI 또는 gh CLI)
gh pr create --title "..." --body "..."
```

### 5.2 코드 변경 규칙 (PRD §12.1 매핑)

- ✅ Frontend-only diff 우선 (backend 변경은 maintainer 협의)
- ✅ CSS 변수 사용 (하드코딩 색상 X)
- ✅ SVG 아이콘 `window.icon()` helper (새 이모지 X)
- ✅ UI 한국어 (영어는 README.en.md 동기화)
- ✅ PR description 에 test plan ≥5 항목
- ✅ 새 외부 CDN 의존성은 사전 승인
- ✅ Conventional Commits (feat:, fix:, etc.)
- ✅ Squash and merge 권장

### 5.3 PR review 기준

| 항목 | 통과 기준 |
|------|---------|
| 회귀 X | 기존 기능 영향 없음 (test plan 으로 확인) |
| 시각 일관성 | SVG 아이콘 + 테마 변수 사용 |
| 데이터 안전 | localStorage 변경은 backward compat 보장 |
| 문서 동기 | UI 변경 시 README/SPEC.md 도 업데이트 |
| PR body 충실 | 본문 + test plan + next best move footer |

---

## 6. bkit / PDCA 적용

PR description 마지막에 다음 footer 권장 (이미 본 fork의 컨벤션):

```text
Next best move: <one concrete action>
Reason: <why this is highest-leverage>
Gate: <scope|quality|security|docs|release>
Automation: <manual|guided|semi_auto|auto>
Risk: <low|medium|high>
```

자세히는 [README.md §bkit/PDCA Workflow 지원](README.md#bkit--pdca-workflow-지원) 또는 [docs/skill-packages/app-factory-bkit.zip](docs/skill-packages/app-factory-bkit.zip) 참조.

---

## 7. Maintainer 응답 시간

| 활동 | SLA |
|------|-----|
| Issue acknowledgement | ≤24h |
| PR review (소규모) | ≤48h |
| Bug fix (blocker) | ≤7일 |
| 다른 모든 것 | 다음 sprint backlog |

Solo maintainer 라 더 빠른 응답 보장 어려움. 양해 부탁드립니다.

---

## 8. License

[MIT](LICENSE) — Hermes Agent upstream 과 호환되는 라이선스.

본인 코드는 commit 시점에 MIT로 기여하는 것에 동의하는 것으로 간주됩니다.

---

## 9. 직접 연락

- GitHub Issue: 가장 빠름
- Twitter/X: [@reallygood83](https://x.com/reallygood83)
- YouTube: [배움의 달인](https://www.youtube.com/@%EB%B0%B0%EC%9B%80%EC%9D%98%EB%8B%AC%EC%9D%B8-p5v)

---

```text
Next best move (collaborator 입장): tester-onboarding.md 60분 가이드 통과 후 막힘 1개 보고
Reason: Phase 1 의 핵심 acceptance — 보고가 maintainer 의 가장 가치 있는 입력.
Gate: scope (Phase 1 진입)
Automation: manual (사용자 실행)
Risk: low
```
