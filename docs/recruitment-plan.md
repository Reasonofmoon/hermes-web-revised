# Phase 1 Tester Recruitment Plan

> **목표**: N=3 invitational testers 14일 안에 확보 → PRD §16 마지막 sign-off 항목 closure
> **마지막 코드/문서 의존성**: 없음. 이 plan 후 *사람 모집*만 남음.
> **마감일**: 2026-05-26 (2주 후) — 그때까지 응답 없으면 §8 fallback 진입.

이 plan 은 [`docs/tester-onboarding.md`](tester-onboarding.md) 와 [`docs/phase1-tracker.md`](phase1-tracker.md) 의 *공급* 단계를 담당합니다. 자료는 다 준비되었고, 이제 *사람* 만 필요합니다.

---

## 1. 모집 목표 (요약)

| 항목 | 값 |
|------|---|
| 인원 | N=3 |
| 기간 | 14일 (Day 0 → Day 14) |
| 1차 acceptance | 첫 PDCA loop 완수 (60분 가이드 통과) |
| 2차 acceptance | D7 follow-up 4 질문 응답 |
| 비용 | $0 (모집 자체) + maintainer 시간 ~5-10h |

---

## 2. 채널 매핑

| 채널 | 도달 가능 | 적합도 | 비용 | 첫 action |
|------|----------|-------|------|----------|
| **Twitter/X @reallygood83** | follower 의 개발/EdTech segment | ⭐⭐⭐⭐ | $0 | 짧은 모집 tweet + 후보 DM |
| **YouTube 배움의 달인 community** | EdTech 학습자 / 한국 콘텐츠 제작자 | ⭐⭐⭐⭐⭐ | $0 | community tab 1개 글 |
| **GitHub Discussions** | 기술 친화 OSS 사용자 | ⭐⭐⭐ | $0 | Discussions 카테고리 활성 + 첫 글 |
| **Korean dev community (OKKy / Inflearn / GeekNews)** | 한국 개발자 broad | ⭐⭐⭐ | $0 | 1개 community 선택 + 공지 |
| **1:1 DM / 이메일 (개인 네트워크)** | 직접 추천 후보 | ⭐⭐⭐⭐⭐ | $0 | 알고 있는 3명에게 직접 |

**추천 순서**: 1:1 DM → YouTube community → Twitter/X → GitHub Discussions → broad community (도달 효율 ↓ 순)

> 1:1 DM 이 가장 conversion 높음 (직접 신뢰 관계). Broad community 는 noise 많고 phase 1 의 *invitational* 톤과 안 맞음. 1:1 + 자기 채널 (YouTube/X) 만으로 충분할 가능성.

---

## 3. 채널별 메시지 Draft

### 3.1 Twitter/X (1-2 tweet)

```
Hermes for Web — 한국어 친화 Hermes Agent 웹 작업실 — invitational beta 시작합니다.

찾는 사람:
- macOS/Linux/WSL 사용 가능
- Hermes Agent 이미 쓰거나 24h 내 설치 OK
- 60분 첫 사용 + 1주일 후 짧은 피드백

관심 있으시면 DM 주세요. 3명 선착순.

🌸 https://github.com/Reasonofmoon/hermes-web-revised
```

(thread 두번째 tweet — 옵션)

```
무엇을 만들었나:
- 응답이 자동으로 산출물로 누적 (단어장, 영작 첨삭, 강의안 등 7유형)
- 칸반 보드로 작업 관리
- 한국어 cherry blossom 테마
- App-Factory audit 통과 (PRD + 13-카테고리 채점)
```

### 3.2 YouTube 배움의 달인 community post

```
🌸 Hermes for Web — invitational beta 모집 (3명)

안녕하세요, 배움의 달인입니다.
제가 최근 만들고 있는 도구 Hermes for Web 의 첫 beta tester 3명을 모집합니다.

【무엇인가요?】
Hermes Agent 라는 AI 에이전트의 *한국어 친화 웹 작업실* 입니다.
ChatGPT 같은 채팅 UI 가 아니라, *결과물이 누적되는 작업 책상* 에 가깝습니다.

【무엇이 다른가?】
- 응답이 자동으로 산출물 (노트/단어장/영작 첨삭/강의안 등) 로 누적
- 칸반 보드로 작업 관리
- Setup Pack 으로 Obsidian + Telegram + ShareNote 원클릭 연결
- 한국어 cherry blossom 테마

【누구를 찾나요?】
- macOS / Linux / WSL 사용 가능
- Hermes Agent 이미 쓰고 계시거나, 24시간 안에 설치 OK
- 60분짜리 첫 사용 가이드를 따라 해 볼 시간
- 1주일 후 짧은 후속 피드백 (4질문)

【무엇을 받나요?】
- 도구 자체 (open source, BYO-key)
- maintainer 직접 지원
- 다음 sprint 우선순위에 의견 반영

관심 있으시면 댓글 또는 X DM (@reallygood83) 주세요.
3명 선착순 (한국 EdTech / 콘텐츠 제작자 우선).

GitHub: https://github.com/Reasonofmoon/hermes-web-revised
```

### 3.3 GitHub Discussions (Phase 1 모집 글)

```markdown
# 🌸 Phase 1 Invitational Beta — 테스터 3명 모집 / Recruiting 3 invitational testers

> Korean below / 한국어는 아래 ↓

## English

Hermes for Web is opening Phase 1 invitational beta (N=3 testers).

**What it is**: a Korean-first browser workshop for [Hermes Agent](https://github.com/NousResearch/hermes-agent) — artifact-first UI, kanban task board, one-click Setup Packs (Obsidian / Telegram / ShareNote / Memory Sync).

**Who we're looking for**:
- Comfortable with `git clone` + `./start.sh` (macOS / Linux / WSL)
- Already using Hermes Agent, OR ready to install in 24h
- Can spare 60 min for first PDCA loop + ~10 min for D7 follow-up

**Time commitment**: ~70 min total over 1 week.

**Compensation**: none (OSS, BYO-key) — but direct maintainer support + your feedback drives next sprint priorities.

**How to apply**: comment on this discussion or DM [@reallygood83](https://x.com/reallygood83). First 3 qualified responses.

## 한국어

Hermes for Web 의 Phase 1 invitational beta — 테스터 3명을 모집합니다.

**무엇인가**: [Hermes Agent](https://github.com/NousResearch/hermes-agent) 의 한국어 친화 브라우저 작업실. artifact-first UI · 칸반 작업 보드 · 원클릭 Setup Packs (Obsidian / Telegram / ShareNote / Memory Sync).

**찾는 사람**:
- `git clone` + `./start.sh` 가능한 기술 자급도 (macOS / Linux / WSL)
- Hermes Agent 이미 사용 중 또는 24h 내 설치 가능
- 60분 첫 PDCA loop + 10분 D7 후속 피드백 (총 ~70분)

**보상**: 없음 (OSS, BYO-key) — 다만 maintainer 직접 지원 + Phase 2 우선순위 반영

**지원 방법**: 이 discussion 에 댓글 또는 X DM ([@reallygood83](https://x.com/reallygood83)). 3명 선착순.

---

### Onboarding 자료 (선정 후)

- [Tester onboarding guide](../blob/main/docs/tester-onboarding.md) (60분 PDCA 가이드)
- [PRD](../blob/main/docs/PRD.md) (제품 전체 맥락)
- [SPEC](../blob/main/docs/SPEC.md) (기술 인덱스)
```

### 3.4 1:1 DM 템플릿 (짧고 친근)

```
안녕하세요 [이름]님,

요즘 만들고 있는 Hermes for Web 이라는 도구의 첫 beta tester 3명을 찾고 있어요.
[이름]님 같은 [EdTech 콘텐츠 / 개발 / Hermes 사용자] 시각이 가장 필요한 시점이라
직접 부탁드려보고 싶었습니다.

요청 사항:
- 60분 첫 사용 (가이드 따라가기, https://github.com/Reasonofmoon/hermes-web-revised/blob/main/docs/tester-onboarding.md)
- 1주일 후 짧은 후속 피드백 (4질문)

부담 없으시면 답장 주세요. 안 되시면 그것도 OK 입니다 🙇
```

### 3.5 Korean dev community (OKKy / Inflearn / GeekNews) — 필요 시

위 GitHub Discussions 글의 *한국어 부분만* 가져와서 community 톤에 맞게 살짝 수정. 공지글이 노이즈로 받아들여질 가능성 있어 *2주차에도 응답 0명* 일 때만 사용.

---

## 4. 선정 기준 (PRD §3 primary persona 매핑)

### 4.1 적합 (선정 우선)

- ✅ Korean / EdTech 또는 콘텐츠 워크플로우 경험
- ✅ Hermes Agent 이미 사용 중 또는 24h 내 설치 가능
- ✅ macOS / Linux / WSL 환경
- ✅ git clone + ./start.sh 가능
- ✅ 1주일 시간 투자 의지

### 4.2 부적합 (제외 또는 Phase 2 대기)

- ❌ Hermes 자체를 처음으로 *배우는* 사람 (학습 곡선 + 도구 검증 동시 진행 어려움)
- ❌ Windows-only without WSL (start.sh 가 bash 의존)
- ❌ AI API 키 없고 로컬 모델도 설치 안 한 사람 (응답 자체가 안 됨)
- ❌ "내 회사에서 쓰려고" — 회사 정책 / 컴플라이언스 / SaaS 요구는 비스코프 (PRD §2.2 N2)

### 4.3 가산점

- ➕ Obsidian / Telegram / ShareNote 워크플로우 사용 중 → Setup Pack 검증 핵심
- ➕ 영어 학습 콘텐츠 제작자 → correction / wordcard / qa / slides 렌더러 깊은 검증
- ➕ 개발자 + 콘텐츠 양쪽 (배움의 달인 audience 일치)

---

## 5. 모집 일정 (2주 timeline)

| Day | 활동 | 결과물 |
|-----|------|-------|
| 0 | 이 plan PR merge | 모집 자료 ready |
| 1 | 1:1 DM 3명 + YouTube community post | 도달 시작 |
| 2 | Twitter/X 모집 tweet | 보조 채널 활성 |
| 3 | GitHub Discussions 카테고리 활성 + 글 | OSS 채널 ready |
| 3-5 | 응답 수집 + 1차 정리 | phase1-tracker §1 명단 업데이트 |
| 5-7 | Tester #1 선정 + onboarding.md 공유 | #1 시작 |
| 7-10 | Tester #2, #3 선정 + 시작 | 3명 모두 진입 |
| 7-14 | 각자 60분 PDCA loop 진행 (개별 시간 분산) | KPI 측정 시작 |
| 14 | 1주 완료 시점 → D7 follow-up 시작 | retention 측정 |
| 21 | D7 결과 종합 + Phase 1 → 2 gate 검토 | 결정 로그 |

---

## 6. 응답 관리

### 6.1 후보가 응답하면

1. **phase1-tracker.md §1** 의 후보 슬롯에 이름/별명/환경/도메인/연락 채널 기록
2. 24시간 안에 답장 (acknowledgement)
3. 자격 확인 질문 (시간 가능한지, 환경 OK 한지)
4. 통과하면 `docs/tester-onboarding.md` 공유 + 시작 시점 합의

### 6.2 진행 중 막힘 발생

1. 어디서 막혔는지 받아 적기 → **phase1-tracker.md §4 피드백 큐**
2. 24시간 안에 응답 (해결 또는 "확인 중" 라벨)
3. 동일 막힘이 2명 이상에서 발생하면 → 즉시 fix 우선순위 ↑ (다음 sprint backlog)

### 6.3 D7 follow-up

`tester-onboarding.md §8` 의 4 질문을 메시지로 보냄:
1. 한 번 이상 다시 사용했나?
2. 산출물이 몇 개 누적되었나?
3. 어떤 워크플로우가 *기대보다 자주* 사용되었나?
4. 무엇을 *기대했는데 안 썼나*?

답변 → **phase1-tracker.md §3** KPI 표 채움 + §4 피드백 큐.

---

## 7. 모집 후 step (Phase 1 진입 후)

1. **Sprint S25**: 측정 instrumentation 구현 (counters + TTV 자동)
2. **Sprint S28**: 1주차 피드백 합성 — top-3 friction 식별
3. **Sprint S29**: top-3 fix shipped
4. **Day 21**: Phase 1 → Phase 2 gate 검토 ([phase1-tracker §7](phase1-tracker.md#7-phase-1-→-phase-2-gate-체크리스트))

---

## 8. Fallback (모집 안 되는 경우)

### 8.1 Day 7 까지 응답 0명

- 채널 1-2개 추가: Inflearn 커뮤니티 또는 GeekNews
- 1:1 DM 후보 3명 추가 (네트워크 2단계로 확장)

### 8.2 Day 14 까지 응답 < 3명

옵션 A — 선정 기준 완화:
- "Hermes Agent 미사용자도 OK" 로 완화
- 다만 onboarding 가이드의 §0-§1 (사전 점검 + 설치) 에 *추가 지원* 제공

옵션 B — *internal Phase 1* 로 시작:
- maintainer 본인이 *외부 환경* (clean macOS / WSL VM) 에서 self-test
- 그 결과를 *Tester #0* 로 phase1-tracker §2 채움
- Phase 1 → Phase 2 gate 의 N=3 기준을 N=1 internal + N=2 external 로 *임시 조정* (PRD §16 명시적으로 표시)

### 8.3 Day 21 까지 응답 < 3명 + internal 도 불완전

- Phase 1 *재정의*: 외부 검증 어렵다면 Phase 1 의 acceptance criteria 자체 수정 (PRD §5.1 revision)
- 또는 모집 채널 확장 (Korean AI/EdTech 카카오톡 오픈챗, Discord 등)

---

## 9. 모집 메시지 사용 시 체크리스트

### 9.1 Tweet 보내기 전

- [ ] 링크 URL 실제 작동 확인 (`https://github.com/Reasonofmoon/hermes-web-revised`)
- [ ] 280자 (Korean 한도 더 짧음) 안에 핵심 정보
- [ ] 이미지 첨부 (로고 또는 패널 스크린샷) — engagement ↑

### 9.2 YouTube community post 전

- [ ] 채널의 다른 콘텐츠 톤과 일치
- [ ] 첫 줄에 *모집* 명시 (스크롤 후 못 읽음)
- [ ] 댓글 응답 시간 (24h 이내 답장) 사전 확보

### 9.3 GitHub Discussions 전

- [ ] Discussions 카테고리 활성 ("General" / "Announcements" 등)
- [ ] 핀 (pin) 가능 — 24시간 동안 보여줌
- [ ] Korean 부분 / English 부분 둘 다

### 9.4 1:1 DM 전

- [ ] 받는 사람과 *이전 상호작용 1회 이상* 있는 사람만 (cold DM 회피)
- [ ] 길이 ≤200자 (긴 DM 은 무시됨)
- [ ] 거절도 OK 를 명시 (압박감 ↓)

---

## 10. 비용 / 시간 추정

| 항목 | 시간 | 비용 |
|------|------|------|
| 메시지 송신 (3 채널 × 30분) | 1.5h | $0 |
| 응답 관리 (3명 × 평균 2h 지원) | 6h | $0 |
| D7 follow-up | 1h | $0 |
| 피드백 synthesis | 2h | $0 |
| 합계 | **~10h** | **$0** |

maintainer 의 5-10h/week 시간 예산 (PRD §10) 내에서 2 주 분산 가능.

---

```text
Next best move: Day 1 — 1:1 DM 3명 + YouTube community post 송신
Reason: 채널 우선순위 ⭐ 점수 가장 높음 (conversion 효율).
        Twitter/X 와 Discussions 는 보조로 활성화.
Gate: scope (실행 단계)
Automation: manual (메시지 송신은 사람 작업)
Risk: low (거절/무응답이 가장 큰 risk, fallback §8 ready)
```
