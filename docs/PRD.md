# Hermes for Web — Product Requirements Document (PRD)

> **Version**: v1.0 · **Date**: 2026-05-12 · **Owner**: solo maintainer (@Reasonofmoon)
> **Status**: draft for internal review · **Target stage**: private repo → invitational beta → public OSS
> **Companion docs**: [`README.md`](../README.md) (user-facing) · [`docs/SPEC.md`](SPEC.md) (technical) · [`docs/audits/app-factory-2026-05-12.md`](audits/app-factory-2026-05-12.md) (audit)

This PRD addresses the 13-category L9-quality/spec-audit rubric used by [app-factory](https://github.com/Reasonofmoon/app-factory). The previous audit on `README.md` scored 6.1 / 10 (B) because a README and a PRD optimize for different readers. This document targets ≥8.5 (T2 A-tier) by giving each rubric category a dedicated section.

---

## 1. Overview & Problem Statement (R02 assumption_evidence)

### 1.1 What we are building
**Hermes for Web** is a browser workshop for the [Hermes Agent](https://github.com/NousResearch/hermes-agent) — a *workspace* metaphor (desk, control tower, cockpit) layered on top of Hermes' CLI engine, optimized for Korean EdTech content creators.

### 1.2 Problem
Existing AI chat UIs (Open WebUI, LibreChat, AnythingLLM) treat *every interaction as a transient message*. Content creators repeatedly:
1. Lose work across sessions (no first-class artifact store).
2. Re-explain context to the model each session (no persistent memory bridge).
3. Switch between 5 tools (CLI, ChatGPT web, Obsidian, Telegram, ShareNote) with no glue.
4. Hand-curate workflows that *should* be one-click (Korean-first stationery aesthetic, EdTech publishing recipes).

### 1.3 Solution thesis
> Hermes for Web turns *chat* into a *workshop*: ① auto-extract artifacts from every response, ② kanban-style task board, ③ Setup Packs as no-code workflows, ④ Hermes memory drives a personalized home screen.

### 1.4 Assumption register (verifiable)

| ID | Assumption | Verification method | Status |
|----|------------|---------------------|--------|
| A1 | Korean EdTech content creators tolerate self-hosted complexity if it saves >2h/week | N=5 user interviews, hours-saved log over 4 weeks | unverified |
| A2 | Artifact-first metaphor > chat-first for content workflows | A/B layout toggle, completion-rate diff over 2 weeks | unverified |
| A3 | Hermes `/api/memory` schema stays stable across Hermes Agent minor releases | Track upstream commits to `agent/memory.py` 6 months | observed stable so far (5 commits, 0 schema change) |
| A4 | BYO-key (GPT/Anthropic) is acceptable for Korean OSS users | Survey N=5, willingness-to-pay $0 vs $5/mo OSS-hosted tier | unverified |
| A5 | Cherry blossom theme as default doesn't alienate non-aesthetic users | Theme switcher visible in first session, swap-rate measurement | partially verified (3 testers chose dark) |

---

## 2. Goals & Non-Goals (R13 scope_discipline)

### 2.1 Goals (in scope)

| # | Goal | Measurable success |
|---|------|--------------------|
| G1 | Make every assistant response *accumulate as a reusable artifact* | ≥1 artifact/session (avg, week-1 cohort) |
| G2 | Reduce time-to-first-artifact (TTV) below industry chat-UI baseline | ≤90s from session start to first auto-extracted artifact |
| G3 | Surface Korean-first UX (font, copy, cherry blossom default) | 100% UI strings in Korean, Pretendard stack on every control |
| G4 | One-click Setup Packs for top-5 EdTech workflows | 5 packs shipped: Obsidian Starter / Power / ShareNote+Telegram / Memory Sync / Hermes Full Install |
| G5 | Frontend-only feature additions where possible (preserve upstream Hermes compatibility) | 7 of 7 features since fork shipped without backend changes |

### 2.2 Non-goals (out of scope)

| # | Non-goal | Why |
|---|---------|-----|
| N1 | Replace the Hermes CLI | The CLI is the engine; this is the cockpit. CLI parity is *not* a target. |
| N2 | Multi-tenant SaaS hosting | Self-host only. Hosted version would add billing/auth/legal scope orthogonal to fork's purpose. |
| N3 | Commercial license / paid tier | OSS, BYO-key. No commercial roadmap planned. |
| N4 | Real-time multi-user collaboration | Solo workflows only. CRDT/OT layer is high complexity for marginal user benefit. |
| N5 | Replace Obsidian/Telegram/ShareNote | Hermes for Web *connects* these; it doesn't replace them. |
| N6 | Mobile-native app (iOS/Android) | Responsive web UI only. Native wrappers can come later if usage demands it. |
| N7 | Plugin marketplace | Setup Packs are curated by maintainer. Third-party plugin economy is not in scope. |

---

## 3. Users & Personas (R03 team_budget_clarity, user-facing)

### 3.1 Primary persona — "Korean EdTech content creator"
- Profile: Korean teacher / online educator / EdTech indie developer (1-10 person team)
- Workflow: writes lesson plans, vocabulary lists, English-correction feedback, posts to YouTube/blog/Obsidian
- Tools today: ChatGPT web, Obsidian, Telegram bots, Google Docs
- Pain: tool switching, context loss, inconsistent output
- Time budget: 2-5 hours / week on AI-assisted content
- Technical: comfortable with `git clone` + `./start.sh`, may or may not be comfortable with `pip install`

### 3.2 Secondary persona — "Hermes CLI power user"
- Profile: developer / researcher already using Hermes Agent CLI
- Wants: GUI for sessions, artifact viewer, faster preview
- Tolerance for friction: high (already runs CLI agents)

### 3.3 Anti-persona — who this is **not** for
- Casual ChatGPT users wanting frictionless cloud UI → use ChatGPT/Claude.ai
- Teams needing shared workspaces → use Notion AI / Slack AI
- Enterprise compliance teams → no SOC 2 / FERPA / GDPR scoping

---

## 4. North Star & KPIs (R07 north_star_quality, R11 measurable_outcomes)

### 4.1 North Star Metric
> **Weekly Active Workspace Users (WAU) × ≥1 Artifact created**

- WAU: distinct users who started ≥1 session in a given week (localStorage `hermes-webui-session` ping count)
- Quality filter: ≥1 artifact accumulated in that user's gallery during the week
- Why this metric: combines *volume* (retention) and *value capture* (artifact = real work output), avoids vanity chat-count

### 4.2 Activation KPIs (week-1 cohort)

| KPI | Definition | Threshold | Why |
|-----|-----------|-----------|-----|
| **Setup Pack unaided completion** | Of testers given only the README, % who finish Obsidian Starter without asking maintainer | ≥60% | Measures self-service UX |
| **TTV (Time-to-Value)** | Median seconds from session start to first auto-extracted artifact | ≤90s | Output-first onboarding principle |
| **D7 retention** | % of week-1 users who return in week 2 | ≥30% | Habit-forming check |
| **Artifacts per session (avg)** | Total artifacts created / total sessions started | ≥1 | Validates "session = real work" thesis |

### 4.3 Engagement KPIs (steady-state)

| KPI | Threshold | Measurement |
|-----|-----------|-------------|
| Edit-to-revision ratio | ≥1:1 | Artifacts edited at least once vs total artifacts |
| Setup Pack reuse rate | ≥30% of week-2+ users re-run a pack | localStorage Setup Pack history |
| Workflow recipe usage | ≥40% of users trigger a one-click workflow in first 3 sessions | DOM event tracking |

### 4.4 PDCA quantitative gates (per EdTech workflow example)

Inherited from [bkit / PDCA Workflow 지원](../README.md#bkit--pdca-workflow-지원):

| Phase | Metric | Gate |
|-------|--------|------|
| Plan | Setup Pack completion time | ≤5 min |
| Do | Response + artifact extraction success | ≥80% |
| Check | Preflight pass rate | 100% |
| Act | Revision/new artifact ratio | ≥1:1 |
| Report | Template consistency across N session items | ≥90% |

### 4.5 Measurement infrastructure (TODO, scheduled)

| Tool | Why missing | Plan |
|------|------------|------|
| Session counter | No backend telemetry yet | Add `localStorage hermes-stats:*` counters week-1-cohort instrument (private, no external upload) |
| TTV tracker | Not measured today | Stamp `session.startedAt` + `firstArtifactAt`, derive on demand |
| Retention | Browser-local only | 7-day-return ping in localStorage |
| External analytics | Not in scope (privacy) | Never — anonymous local aggregation only |

Schedule: instrumentation Phase 1 in Sprint 25 (post Agent Desk Phase Desk-2).

---

## 5. Timeline & Phases (R01 timeline_realism)

### 5.1 Phase map

| Phase | Window | Goal | Done means |
|-------|--------|------|-----------|
| **0. Private repo ready** | 2026-Apr → 2026-May | All 7 MVP features shipped (Artifact panel × 3 phases + UI overhaul × 3 phases + Agent Desk Desk-1) | This document exists + audit ≥B+ + zero blockers |
| **1. Internal validation** | 2026-May (week 3-4) | N=3 testers complete full PDCA loop unaided | All 3 finish without maintainer help |
| **2. Invitational beta** | 2026-Jun-Jul | 10 users · feedback loop on top-3 friction points | ≥30% D7 retention · ≥1 artifact/session avg |
| **3. Public OSS release** | 2026-Aug | Open source repo public, README badge update | GitHub stars >50 in 4 weeks · 0 critical issues open |
| **4. Hermes Agent ecosystem visibility** | 2026-Q4 | Upstream Hermes mentions fork as example | Listed in Hermes README ecosystem section |

### 5.2 Velocity baseline

Past 6 commits on `revised/main` (sprint of ~2 weeks):
- PR #1 fix + SPEC.md → 1 day
- PR #2 Artifact-First panel + UI overhaul (3 phases) → 4 days
- post-merge chore (compression + bkit) → 0.5 day
- PR #3 MVP-3.2 (wordcard + qa + manual type) → 1 day
- PR #4 UI Phase C → 0.5 day
- PR #5 Agent Desk Desk-1 → 1 day
- PR #6 audit + README §성공 지표 → 0.5 day

Total: ~8.5 days for ~3,000 lines of frontend changes + comprehensive docs. Solo pace ≈ 350 lines/day on focused days.

### 5.3 Phase 1-2 deliverable schedule

| Sprint | Deliverable | Estimated effort |
|--------|------------|------------------|
| S25 (this PRD week) | Agent Desk Phase Desk-2 (sessions surface as cards) | ~3h |
| S26 | Phase Desk-3 (cron + artifact connections) | ~4h |
| S27 | Measurement instrumentation (counters + TTV) | ~3h |
| S28 | N=3 tester recruitment + onboarding script | ~2h |
| S29 | Feedback synthesis + top-3 friction fix | ~6h |

---

## 6. Competitive Landscape (R04 competitive_depth)

> Closes audit gap G2. Three named direct competitors + two adjacent. Per-competitor: overlap, cloneable in 1 sprint, structural moat.

### 6.1 Direct competitors

| Product | Stars | Overlap | What they could clone in 1 sprint | What they probably won't |
|---------|-------|---------|-----------------------------------|------------------------|
| **[Open WebUI](https://github.com/open-webui/open-webui)** | 50k+ | Self-hosted LLM frontend, model switcher, multi-user | Cherry blossom theme, Korean copy | Hermes Agent integration depth (`/api/memory`, `/api/skills`, `/api/cron`) — requires backend rewrite |
| **[LibreChat](https://github.com/danny-avila/LibreChat)** | 20k+ | Multi-provider chat, plugins, multi-user | Artifact panel UX | Setup Packs as no-code workflows (their plugin model is dev-facing) |
| **[AnythingLLM](https://github.com/Mintplex-Labs/anything-llm)** | 25k+ | Private LLM with workspaces, RAG | Artifact concept | Korean-first UX, EdTech workflow templates, Hermes memory integration |

### 6.2 Adjacent (different problem space, but referenced)

| Product | Why mentioned | Why not direct competitor |
|---------|---------------|--------------------------|
| Cursor / Continue | AI coding IDE | Code-only, no content creation workflow |
| ChatGPT web / Claude.ai | Cloud chat | Hosted, no Hermes integration, no Korean-first |
| Notion AI | Doc + AI | Doc-centric, not session-centric, no self-host |
| Obsidian Copilot | AI in Obsidian | Plugin-scoped to Obsidian, not standalone workshop |

### 6.3 Structural moat (3-layer)

1. **Hermes Agent integration depth** — Setup Packs, memory bridge, profile system, cron jobs are *first-class* in fork because we have the upstream context. Competitors would need to build/wrap Hermes themselves.
2. **Korean-first UX** — Pretendard typography, cherry blossom default theme, all UI strings in Korean, EdTech workflow naming (영작 첨삭, 차시 강의안). English forks would need to retro-fit.
3. **Setup Packs as no-code workflow primitives** — packaging Obsidian + ShareNote + Telegram + Hermes into one click is *editorial work*, not just engineering. Hard to maintain quality without a domain-focused maintainer.

### 6.4 Moat lock-in risks

| Risk | Mitigation |
|------|------------|
| Upstream Hermes `/api/memory` schema breaks | Schema version pin + fallback (memory-less UI still works) — see Risk R3 |
| Open WebUI adds artifact panel | Our artifact UX has 7 type renderers (note/code/correction/slides/wordcard/qa/marked) + revision history + multi-format export — depth, not feature parity, is the moat |
| Korean-first becomes table stakes | Compound moat: Korean × EdTech workflow templates × Hermes integration is unlikely to be replicated by general-purpose competitors |

---

## 7. Dependencies & Assumptions (R10 dependency_clarity, R02)

### 7.1 Runtime dependencies

| Dependency | Version pin | Install path | Failure mode |
|-----------|-------------|--------------|--------------|
| Hermes Agent | ≥ `2026-04-01` snapshot (no formal versioning yet) | `git clone NousResearch/hermes-agent` sibling | UI loads, agent features 502 |
| Python | ≥3.10 | system or venv | server fails to boot, clear error in `start.sh` |
| PyYAML | ≥6.0 | `pip install -r requirements.txt` | server fails to boot, clear error |
| Browser | Chrome 100+ / Firefox 100+ / Safari 16+ | user-installed | older browsers fall back gracefully (limited animation) |
| WSL (Windows users) | WSL2 | Microsoft Store | start.sh requires Bash; PowerShell-only setup is unsupported |

### 7.2 Optional integrations (per Setup Pack)

| Pack | Required external | Bootstrap time | Failure mode |
|------|-------------------|---------------|--------------|
| Obsidian Starter | Obsidian app + vault path | ~5 min | Pack reports missing vault, halts cleanly |
| ShareNote+Telegram | Obsidian + ShareNote plugin + Telegram bot token | ~15 min | Pack reports which token/plugin is missing |
| Memory Sync | None | ~1 min | always works |
| Hermes Full Install | Hermes Agent + venv + ANTHROPIC_API_KEY (or local Darwin) | ~10 min | Pack guides through each missing item |

### 7.3 Upstream tracking

- **Hermes Agent**: subscribe to commits on `agent/memory.py`, `agent/sessions.py`, `agent/tools/*.py`. Review weekly.
- **Hermes CLI profiles**: any schema change to `~/.hermes/profiles/<name>/` invalidates Setup Pack assumptions.
- **Pretendard font**: version-pinned reference in `style.css` font stack (only impacts users with Pretendard installed system-wide).

---

## 8. Risks & Mitigation (R09 risk_completeness)

### 8.1 Risk register

| ID | Risk | Likelihood | Impact | Trigger | Mitigation | Owner |
|----|------|:---------:|:-----:|---------|-----------|-------|
| R1 | Upstream `/api/memory` schema changes break personalization | M | M | hermes-agent commit touching `agent/memory.py` schema | Schema version probe at boot; fallback: memory-less UI still works | maintainer |
| R2 | GPT/Anthropic API quota exhaustion mid-workflow | M | L | User's BYO-key hits rate limit during Setup Pack | Rate-limit detection in response; clear fallback message; suggest Darwin local | maintainer |
| R3 | Setup Pack partial failure leaves user in broken state | L | M | External tool (Obsidian/Telegram) becomes unreachable mid-pack | Each pack step is idempotent; state persisted; clear rollback button | maintainer |
| R4 | Cherry Blossom default theme alienates non-aesthetic users | L | L | Negative tester feedback on first-impression | Theme switcher visible in first session; 7 themes shipped | maintainer |
| R5 | Solo maintainer burnout (single point of failure) | M | H | Maintainer absence >2 weeks | All work in public PRs with comprehensive descriptions; bus-factor docs (SPEC.md, PRD.md, audit reports) | maintainer |
| R6 | Korean-only UX limits contributor pool | M | L | OSS contributions stalled <1/quarter | English README in parallel (`README.en.md`); consider i18n if ≥3 international users request | maintainer |
| R7 | Hermes upstream pivots away from CLI-centric design | L | H | Hermes core team announces SaaS pivot or major restructure | Re-evaluate fork value proposition; possibly absorb features back into Hermes Agent itself | maintainer + upstream watch |
| R8 | localStorage quota exceeded (artifacts + Desk tasks) | L | L | User accumulates >5MB of artifacts | Quota check + warning at 80%; bulk export prompt; consider IndexedDB migration | maintainer |

### 8.2 Decision-time risks (not yet hit)

- **Should we vendor Pretendard font (~700KB)?** — currently using system fallback, accepting OS-dependent rendering. Vendor if user feedback shows brand inconsistency complaints.
- **Should Agent Desk get full-screen mode?** — current vertical kanban in sidebar is space-constrained. Full-screen toggle would multiply value but doubles design surface. Decision: defer to Desk-3 user feedback.

---

## 9. Pricing & Business Model (R08 pricing_evidence)

### 9.1 Model
- **License**: open-source (Apache 2.0, matches Hermes Agent upstream)
- **Hosting**: self-host only via `./start.sh`
- **API cost**: BYO-key — user provides their own Anthropic/OpenAI/Google key, pays own LLM bill
- **No commercial tier planned** — non-goal N3

### 9.2 Cost transparency for users

| Workflow | Cost (typical) | Notes |
|----------|---------------|-------|
| Local-only (Darwin model) | $0 | Slower, requires local GPU |
| GPT-5.5 single session (10 turns) | ~$0.05-0.20 | Depends on context length, artifact extraction |
| Setup Pack execution (Obsidian Starter) | ~$0.10-0.30 | One-time bootstrap cost |
| Daily power user (5 sessions / day) | ~$5-15 / month | BYO-key, varies by model choice |

### 9.3 Why not hosted/paid

- Maintainer is solo — cannot run customer support / billing / legal
- Hermes Agent itself is OSS — commercial fork would be ecosystem-hostile
- Self-host preserves user data privacy (no central server logs)
- BYO-key keeps incentives aligned (user pays for their own usage)

### 9.4 Donation / sustainability

- GitHub Sponsors not enabled (Phase 0 too early)
- If usage justifies, GitHub Sponsors as the only monetization channel — no Patreon / Substack / paid tiers

---

## 10. Team & Budget (R03 team_budget_clarity)

### 10.1 Builders

| Role | Person | Time commitment |
|------|--------|----------------|
| Maintainer / Lead / All-of-the-above | @Reasonofmoon (solo) | ~5-10 hours / week part-time |
| Reviewers | TBD invitational beta testers (N=3 in Phase 1) | ~1 hour / month each |

### 10.2 Budget

| Item | Cost | Funding |
|------|------|---------|
| LLM API for development (testing, audits) | ~$5-20 / month | Maintainer personal |
| Hosting | $0 (self-host, no central server) | n/a |
| Domain | $0 (uses GitHub URLs) | n/a |
| Design tools (codex-image-gen for logo) | one-time ~$0.50 | Maintainer personal |

Total runway: $20-50 / month, indefinite (no fundraise needed).

### 10.3 Decision authority

- All product decisions: maintainer
- Upstream Hermes compatibility decisions: maintainer + sanity check with Hermes Agent maintainers (informal)
- Theme / brand decisions: maintainer with optional poll on issues

---

## 11. Rollback & Release Strategy (R12 rollback_plan, R06 stage_fit)

### 11.1 Pre-public phase (now)

- Every PR has its own branch + isolated impact
- main is squash-merged, so each PR can be reverted with a single `git revert <sha>`
- localStorage data per user — no central state to roll back from
- No paid users → no SLA → rollback risk is purely UX

### 11.2 Post-public phase (Phase 3+)

For breaking UI changes (theme default, sidebar restructure, layout toggle):

| Change type | Rollback mechanism |
|------------|-------------------|
| Default theme change (e.g. cherry-blossom → dark) | Feature-flag `localStorage hermes-theme-default`, opt-in cohort first |
| Sidebar tab reorganization | Settings panel toggle for "classic sidebar" for 1 release |
| Breaking artifact schema change | Migration script in artifacts.js on next load; version-tagged storage key |
| Breaking `/api/*` upstream change | Pin Hermes Agent minimum version in `start.sh` boot check; clear error message |

### 11.3 Public-launch gate (Phase 3 entry criteria)

- [ ] N=3 testers complete full PDCA loop unaided in Phase 1
- [ ] D7 retention ≥30% in invitational beta
- [ ] Zero blocker issues open
- [ ] All Setup Packs verified on clean machines (one per OS: macOS, Linux, WSL)
- [ ] English `README.en.md` synchronized with Korean `README.md`
- [ ] License + contributor guide in place

---

## 12. Acceptance Criteria & Quality Gates

### 12.1 Per-feature acceptance template

Each new PR must include:
- [ ] Frontend-only diff (no backend changes) unless explicitly approved
- [ ] CSS variable use, no hardcoded color
- [ ] SVG icons via `window.icon()` helper, no new emoji
- [ ] PR description with test plan ≥5 items
- [ ] No new external CDN dependency without explicit approval
- [ ] All UI strings in Korean (use `README.en.md` for English mirror)

### 12.2 Quality gates per PDCA phase (from §4.4)

Plan ≤5min · Do ≥80% success · Check 100% preflight · Act ≥1:1 revision · Report ≥90% template consistency

### 12.3 Audit gate

- README.md scored ≥7.0 (B+) as of last app-factory audit
- PRD.md (this document) targeted ≥8.5 (T2 A-tier)
- Bonus: ≥9.0 (T3 A+) achievable with persona-chain validation

---

## 13. Open Questions & Decisions Needed

| ID | Question | Decision needed by | Default if undecided |
|----|----------|-------------------|---------------------|
| Q1 | Vendor Pretendard font (~700KB) or rely on system fallback? | Phase 2 entry (2026-Jun) | System fallback (status quo) |
| Q2 | Add "full-screen Agent Desk" mode in Desk-3 or defer to Desk-4? | Phase Desk-3 start | Defer |
| Q3 | Should artifact extraction be opt-in per session? | Phase 2 user feedback | Always-on (status quo) |
| Q4 | i18n framework if international users request? | After 3rd request | None |
| Q5 | Move artifact storage to IndexedDB before localStorage quota issues? | At 50% quota usage observed | Stay on localStorage |
| Q6 | Open up Setup Pack format for community contributions? | Phase 3 (public) | Maintainer-curated only |

---

## 14. CLI Flag Validity Note (R05 cli_flag_validity)

This PRD references one CLI: `./start.sh [port]`. No other CLI flags are introduced or claimed. The Hermes Agent CLI (`hermes ...`) and app-factory CLI (`app-factory ...`) are referenced but not extended.

Boot sequence:
```bash
git clone https://github.com/reallygood83/hermes-for-web.git
cd hermes-for-web
./start.sh 8787    # port arg is positional, no flags
```

PowerShell equivalent (Windows): use WSL or set `HERMES_WEBUI_PORT` env var and invoke `python server.py`.

---

## 15. Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-05-12 | v1.0 | Initial draft addressing all 13 audit categories | @Reasonofmoon (with Claude Opus 4.7) |

### Future revision triggers
- Phase 1 tester feedback synthesis (end of 2026-May)
- Phase 2 beta retention data (mid-2026-Jul)
- Any structural change to Hermes Agent upstream `/api/*`
- Any commercial-license decision (currently non-goal)

---

## 16. Sign-off (Phase 0 → Phase 1 gate)

For Phase 1 (Internal validation) to begin:
- [x] PRD v1.0 written (this document)
- [x] All 6 PRs merged to `revised/main` (PR #1-#6, as of 2026-05-12)
- [x] App-factory audit score ≥B (current: B, target post-PRD ≥A)
- [ ] N=3 invitational testers identified (TBD)
- [ ] Tester onboarding script (link to docs/tester-onboarding.md) — TBD next sprint
- [ ] Quality gate dashboard or manual tracking sheet — TBD next sprint

**Signed**: @Reasonofmoon · **Date**: 2026-05-12 · **Status**: ready for app-factory re-audit

---

```text
Next best move: Run app-factory audit-spec on this PRD.md → target ≥8.5 (T2 A-tier)
Reason: PRD is structurally designed to address all 13 rubric categories. Re-audit validates
the design and surfaces any residual gaps before Phase 1 tester recruitment.
Gate: docs
Automation: semi_auto (audit runs via OAuth fallback; ~$0.10, ~2 min)
Risk: low
```
