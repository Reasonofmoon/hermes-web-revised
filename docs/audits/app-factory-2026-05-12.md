# Hermes for Web — App-Factory Audit Report

> **요약 한 줄**: README-grade 문서로서는 좋으나 PRD-grade spec 으로는 평균 **6.1/10 (B)**, T2 임계값 8.5 미달. **5 major gap + 12 minor gap** 식별. 가장 큰 결손은 *측정 가능한 성과 / 북극성 메트릭 / 위험·경쟁·팀·예산* 5 영역.

## 1. 실행 메타

| 항목 | 값 |
|------|---|
| 분석 도구 | [app-factory CLI](https://github.com/Reasonofmoon/app-factory) (Reasonofmoon/app-factory) |
| 입력 spec | `README.md` (11,507 chars, 한국어) |
| 명령 1 | `app-factory audit-spec --spec README.md --tier T2 --no-personas --compact` |
| 명령 2 | `app-factory critique --persona sal-khan --spec README.md --summary-chars 800` |
| 모델 | `claude-sonnet-4-20250514` (Claude Code OAuth fallback — ANTHROPIC_API_KEY 미설정) |
| 루브릭 | L9-quality/spec-audit, 13 카테고리, A+ T2 기준 (8.5) |
| 처리 시간 | audit 115s · critique 64s · 합산 ≈ 3분 |
| 토큰·비용 | audit 6,430 in / 4,677 out = **$0.0894** · critique 별도 |
| 출력 envelope | [`README.audit-2026-05-12_13-02-13.json`](./README.audit-2026-05-12_13-02-13.json) |
| Sal Khan JSON | [`critique-sal-khan.json`](./critique-sal-khan.json) |

> **방법론 한계**: `audit-spec` 은 *PRD/Spec* 평가 도구. 입력으로 사용한 `README.md` 는 사용자 안내·마케팅 톤이라 일부 카테고리(team_budget, north_star, risk_register 등) 가 *부적합 평가*를 받음. 이는 문서 유형의 차이지 결함이 아니다. 보고서 §5에서 *어떤 항목이 README에 추가될 만한가 / 별도 PRD로 분리해야 할까*를 권장.

## 2. 종합 평가 (Audit Overall)

```
tier:                T2
tier_threshold:      8.5
avg_score:           6.1 / 10
letter_grade:        B
aplus_threshold:     FAILED ✗
blocker_gap_count:   0
has_blocking_gaps:   false
personas_enabled:    false
```

**평가자 코멘트** *(app-factory audit, 원문 인용)*:
> README-grade doc, not PRD-grade spec. Strong on product narrative (analogies, integration vision, PDCA mapping). Weak on team/budget, competitive depth, North Star, risks, measurable outcomes — categories most readers expect from a spec. No blockers since no false claims or unsourced revenue projections. Lifts to A by adding §Team/§Risks/§Metrics/§Competitors as compact tables; deeper qualitative gaps remain at B-level.

## 3. 13-카테고리 채점

| ID | 카테고리 | 점수 | 등급 | 비고 |
|----|----------|:----:|:----:|------|
| R01 | timeline_realism | 6.5 | B | Phase 헤딩·주차 단위 추정 부재 |
| R02 | assumption_evidence | 6.5 | B | "초보자도 바로 쓰기 쉬운" 등 검증 없음 |
| R03 | **team_budget_clarity** | **4.0** | **C** | solo·team·budget 키워드 0건 |
| R04 | **competitive_depth** | **4.5** | **C** | Open WebUI/LibreChat/Cursor 등 경쟁자 명명 없음 |
| R05 | cli_flag_validity | **9.5** | **A+** | CLI 플래그 위조 없음 (start.sh positional only) |
| R06 | stage_fit | 7.5 | B+ | "private repo ready" 라벨 OK, 공개 게이트만 모호 |
| R07 | **north_star_quality** | **4.5** | **C** | North Star 메트릭 정의 없음 |
| R08 | pricing_evidence | 7.0 | B+ | BYO-key 묵시 — 명시화 권장 |
| R09 | **risk_completeness** | **4.0** | **C** | §Risks / 위험표 부재 |
| R10 | dependency_clarity | 6.5 | B | 외부 deps 명명 OK, 버전·설치시간 부재 |
| R11 | **measurable_outcomes** | **4.0** | **C** | 정성 목표만, 정량 임계값 0건 |
| R12 | rollback_plan | 7.0 | n/a | greenfield pre-public, 정당한 n/a |
| R13 | scope_discipline | 7.5 | B+ | bkit 섹션이 의도된 통합으로 인정됨 |

**최저 (C)** 5 개 → `team_budget` `competitive_depth` `north_star` `risk` `measurable_outcomes`
**최고 (A+)** 1 개 → `cli_flag_validity` (CLI 거짓 플래그 없음)

## 4. 식별된 Gaps (5 major + 12 minor)

### 4.1 Major (5)

| ID | 출처 | Finding | Mitigation |
|----|:----:|---------|------------|
| **G1** | R03 | 팀 규모·예산 미언급. LLM API/호스팅 비용 미주소. | "Who builds / who pays" 한 줄: *solo maintainer + BYO-key + self-host*. Per-pack cost note. |
| **G2** | R04 | 경쟁자 명명 없음 (Open WebUI, LibreChat, AnythingLLM, Cursor 부재). moat 주장만 있고 defensibility 없음. | §Competitive Landscape: 3개 경쟁자 × (overlap / cloneable / not cloneable). 명시 moat = memory 통합 깊이 + Setup Packs + Korean-first. |
| **G3** | R07 | North Star 메트릭 없음. 워크플로우 도구 주장에 측정 proxy 없음. | 설정 권장: **주간 활성 워크스페이스 사용자 × ≥1 Artifact 생성** (volume × retention proxy). |
| **G4** | R09 | §Risks 부재. 미주소 위험 4개: upstream `/api/memory` 스키마 변경, GPT 쿼터 고갈, Setup Pack 중간 실패, 테마 호불호. | 위험표 ≥4 행 × (trigger, mitigation, owner). |
| **G5** | R11 | 정량 성과 지표 0건. "Good product needs less explanation" 측정 불가. | ≥3 정성 목표 → KPI 전환 (예: N=5 testers가 README 도움 없이 Setup Pack 완수, week-1 cohort ≥1 Artifact/세션). |

### 4.2 Minor (12)

| ID | 출처 | Finding | Mitigation |
|----|:----:|---------|------------|
| G6 | R01 | 로드맵 부재 | 4–6 주 버킷 × pillar (Setup Packs, Artifacts, Preflight) |
| G7 | R02 | 정성 주장 미검증 | Assumptions-to-verify 표 + N=5 user-test plan |
| G8 | R03 | Setup Pack 비용 미명시 | 패키지별 비용 (Darwin 무료 / GPT ~$X/월) |
| G9 | R04 | memory 의존이 moat 이자 lock-in 위험 | upstream API 안정성 + fallback path |
| G10 | R06 | "공개 전환 검토" gate 모호 | Phase 0 gate: N=3 testers full PDCA loop 무보조 완수 |
| G11 | R08 | 수익 모델 묵시 | 1 줄 라이선스/포지셔닝: *open-source / BYO-key / no commercial tier* |
| G12 | R09 | 사전 출시 체크리스트에 실패 처리 부재 | 항목별 block-vs-proceed 명시 |
| G13 | R10 | 외부 deps 설치 시간 미명시 | 패키지별 'Requires X plugin, Y minutes to bootstrap' |
| G14 | R10 | Hermes Agent 버전 호환성 미명시 | 최소 Hermes 버전 + `/api/memory` 스키마 버전 핀 |
| G15 | R11 | PDCA EdTech 예시 Report 단계에 측정 부재 | "Report: 5차시 template-usage 일관성 ≥90%" 추가 |
| G16 | R12 | 공개 후 테마/레이아웃 변경 rollback 부재 | 사전 출시: 테마 + 사이드바 + 설정 reset feature-flag |
| G17 | R13 | §Non-goals 명시 없음 | 3–5 bullet: CLI 대체 안 함 / 결제 안 함 / SaaS 안 함 |

## 5. Top 5 Fix Priorities (영향도 순)

각 fix가 평균 점수에 미치는 leverage 순으로 정렬. 5개를 모두 닫으면 **6.1 → 7.4** (B → B+).

| 순위 | Gap | 영향 | 이유 |
|:---:|:---:|------|------|
| 1 | **G5** | R11 4.0 → 7.5 (+0.27) | 워크플로우 도구 주장 operationalize, downstream metric work (G3) 차단 해제 |
| 2 | **G3** | R07 4.5 → 8.0 (+0.27) | North Star 가 모든 측정 작업의 앵커 — spec coherence leverage 큼 |
| 3 | **G4** | R09 4.0 → 7.5 (+0.27) | 위험표는 mechanical 작성 가능, spec 성숙도 인식 즉시 상승 |
| 4 | **G2** | R04 4.5 → 7.5 (+0.23) | 경쟁 섹션이 moat 명확화 강제 — KB 당 정성적 lift 최대 |
| 5 | **G1** | R03 4.0 → 7.5 (+0.27) | "solo + BYO-key + self-host" 한 줄로 카테고리 전체 해결 |

**결합 효과**: G1 + G2 + G3 + G4 + G5 → 평균 **6.1 → 7.4** (B → B+). T2 (8.5) 도달은 추가 패스 필요.

## 6. Sal Khan (Khan Academy) EdTech 비평

`app-factory critique --persona sal-khan` 의 응답 핵심 발췌. *원문은* [`critique-sal-khan.json`](./critique-sal-khan.json).

### 첫인상: "이건 교사용 도구인가, 학습자용 도구인가?"

> Hermes for Web 은 *개인화된 작업실*을 만들겠다는 야망이 있고, 그 방향성 자체는 내가 수십 년간 주장해온 것과 맞닿아 있습니다. 2012 TED 강연에서 "모든 학생이 개인 교사를 가질 수 있다면 어떻게 될까?" — Benjamin Bloom 의 *2-sigma 효과* 는 AI 가 해결할 수 있는 가장 중요한 교육 문제입니다.

### 1) Personalization from Hermes memory = 1:1 튜터 철학의 구현

> "단골 손님을 알아보는 카페처럼 사용자의 기억을 바탕으로 더 자연스럽게 시작" — 이게 바로 내가 말하는 *1:1 튜터의 핵심*입니다. 누군가가 당신의 이전 작업을 기억하고, 당신의 맥락에서 시작한다는 것.

### 2) Preflight Validator = 완전학습(Mastery Learning) UI

> 진도 기반 커리큘럼보다 *완전학습 기반 커리큘럼*이 장기 성취도가 높다는 것을 Khan Academy 수천만 명의 데이터로 확인했습니다. "이전 개념을 완전히 이해하지 못한 채 다음으로 넘어가는 것"이 학습 실패의 가장 큰 원인입니다.

### Sal Khan 권장 (보고서 요약)
- 메타: README 가 *학습자 중심* 인지 *교사 중심* 인지 명확하지 않음 — 두 페르소나 분기 필요.
- North Star 후보: *학습자가 도구 없이 완수한 mastery loop 횟수* (Khan Academy 의 mastery 메트릭 차용).
- 위험: AI 응답이 *Bloom 2-sigma* 의 인간 튜터 깊이를 흉내내지만 진단력이 부족할 수 있음 — Preflight 가 그 갭을 메우도록 강화.

## 7. 권장 다음 행동 (bkit Next Best Move)

### 단기 (이번 주 — README B → B+ 등급 상승)

- **G5 + G3 동시 해결** → §"성공 지표" 섹션 추가 (~30분, ~+0.54 평균 점수):
  - North Star: Weekly Active Workspace Users × ≥1 Artifact 생성
  - 활성화 KPI: N=5 testers · Setup Pack 무보조 완수율
  - PDCA Report 단계 정량 게이트: "5차시 template-usage 일관성 ≥90%"
- **G4 해결** → §Risks 표 (~20분, ~+0.27):
  - 4 위험 × (trigger, mitigation, owner)
- **G1 해결** → "Who builds / who pays" 한 줄 (~5분, ~+0.27)

### 중기 (이번 달 — A 게이트 도전)

- **PRD.md 별도 작성** — README 는 사용자 안내, PRD 는 spec. 분리하면 audit-spec 평가가 적합한 입력을 받음.
- **G2 해결** → §Competitive Landscape (~1시간):
  - Open WebUI / LibreChat / AnythingLLM / Cursor 명명 + overlap·cloneable·moat
- **G6-G17 묶음** → 별도 PR로 minor polish

### 장기 (분기 — 사용자 검증 루프)

- Sal Khan 권장 *학습자 vs 교사 페르소나 분기*
- *Mastery loop completion* 메트릭 측정 인프라
- AI 진단력 강화 (Preflight v2)

## 8. App-Factory 도구 자체에 대한 메모

이 audit 을 실행하면서 발견한 점:

- ✅ **Claude Code OAuth fallback 작동** — `ANTHROPIC_API_KEY` 없어도 Claude Code CLI 가 설치되어 있으면 자동 fallback. SDK 미설치 환경에서도 가능.
- ⚠️ **Windows `spawnSync claude ENAMETOOLONG`** — spec 32KB+ 일 때 명령행 인자 길이 제한 초과. README (11KB) 는 OK, SPEC.md (32KB) 는 실패. → 분할 입력 또는 stdin 전달 옵션이 필요.
- ✅ **--compact 모드** — Matt Pocock /caveman skill 차용. 토큰 30–50% 절감 효과 확인.
- ✅ **캐시** — 동일 input 재실행 시 0.1s 응답. cache_hit 명시 표시 좋음.
- 💡 **개선 제안 (upstream 에 제출 가치)**: Windows `spawnSync` 에 대해 prompt 를 stdin 으로 파이프하는 fallback. ENAMETOOLONG 회피.

## 9. 자료 (Provenance)

| 자료 | 위치 |
|------|------|
| Audit envelope (JSON) | `README.audit-2026-05-12_13-02-13.json` (repo root) |
| Sal Khan critique (JSON) | `critique-sal-khan.json` (repo root) |
| 평가 받은 README | `README.md` (커밋 `69160e6` 시점) |
| App-Factory 레포 | https://github.com/Reasonofmoon/app-factory |
| 사용 모듈 / persona | L9-quality/spec-audit · sal-khan |
| 이 보고서 | `docs/audits/app-factory-2026-05-12.md` |

---

```text
Next best move: G5 + G3 한 묶음 — README 에 §"성공 지표" 추가
Reason: 단일 변경이 R07 (4.5→8.0) + R11 (4.0→7.5) 두 카테고리를 동시 lift,
        평균 6.1 → ~6.6, 30분 작업 분량.
Gate: docs
Automation: semi_auto
Risk: low
```

*Generated 2026-05-12 via app-factory CLI + Claude Code OAuth.*
