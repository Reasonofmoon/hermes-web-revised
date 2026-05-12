# Phase 1 Tester Progress Tracker

> **목적**: PRD §16 Phase 0 → Phase 1 gate 의 "N=3 testers complete full PDCA loop unaided" 검증 추적
> **방법**: 수동 (지금은 측정 인프라 미구현 — Sprint 25 예정)
> **주기**: 새 테스터 가입 시 + 주간 점검

---

## 1. 테스터 명단

> *3 자리 + α 후보*. 모집 시 명단 채움.

| # | 이름/별명 | 환경 | 도메인 | 가입일 | 연락 채널 | 진척 (PDCA) | 비고 |
|---|----------|------|--------|-------|----------|-----------|------|
| 1 | TBD | macOS / Linux / WSL | EdTech / 개발 | YYYY-MM-DD | GitHub / email | □ Plan □ Do □ Check □ Act □ Report | |
| 2 | TBD | | | | | | |
| 3 | TBD | | | | | | |

후보 (선정 대기):
- @___ (Hermes Agent CLI 사용자)
- @___ (Korean EdTech blogger)
- @___ (개발 + Obsidian 사용자)

선정 기준 (PRD §3 primary persona 매핑):
- ✅ Korean / EdTech 또는 콘텐츠 워크플로우 경험
- ✅ `git clone` + `./start.sh` 가능한 기술 자급도
- ✅ Hermes Agent 이미 사용 중이거나 24시간 내 설치 가능
- ❌ 처음으로 *Hermes 자체*를 배우는 사람은 Phase 2 까지 대기

---

## 2. 5-Phase PDCA 완수 체크 (per tester)

PRD §4.4 에서 정의한 PDCA 정량 게이트 기준.

### Tester #1 — TBD

| Phase | 활동 | 합격 임계값 | 결과 | 코멘트 |
|-------|------|-----------|------|--------|
| Plan | Setup Pack 완수 시간 | ≤5 분 | __ 분 | |
| Do | 응답 + 산출물 자동 추출 성공률 | ≥80% | __ % | |
| Check | Preflight 통과율 | 100% | __ % | |
| Act | revision 생성 vs 새 산출물 비율 | ≥1:1 | __ : __ | |
| Report | 5차시 강의안 template 일관성 | ≥90% | __ % | |

종합: □ Full PDCA loop *unaided* 완수 / □ 부분 / □ 막힘

### Tester #2 / #3
(동일 표 복제)

---

## 3. 활성화 KPI 실측 (PRD §4.2)

| KPI | 목표 | T#1 | T#2 | T#3 | 평균 | 기준 충족? |
|-----|------|:---:|:---:|:---:|:----:|:--------:|
| Setup Pack 무보조 완수율 | ≥60% | □ | □ | □ | 0/3 | ❌ |
| 첫 산출물까지 시간 (TTV) | ≤90 초 | __ s | __ s | __ s | __ s | □ |
| Week-1 retention (D7 재방문) | ≥30% | □ | □ | □ | 0/3 | ❌ |
| 평균 산출물 / 세션 | ≥1 | __ | __ | __ | __ | □ |

> Phase 1 → Phase 2 gate: 4 KPI 중 **≥3 충족** 시 진행. 부족하면 1-2 친화성 친화성 친화성 sprint 후 재측정.

---

## 4. 피드백 큐 (수집된 피드백)

| ID | 출처 | 날짜 | 영역 | 내용 (요약) | 심각도 | 대응 상태 |
|----|------|------|------|-----------|:------:|:--------:|
| F1 | T#? | YYYY-MM-DD | onboarding / setup / chat / desk / artifact / ... | ... | blocker / major / minor / note | 대기 / 진행 / 완료 / 보류 |
| F2 | | | | | | |

심각도 분류 (audit-spec rubric 차용):
- **blocker**: 사용자가 *진행 불가* (예: `start.sh` 실패, 설치 거부)
- **major**: 핵심 워크플로우 우회 불가 (예: 자동 추출 안 됨)
- **minor**: 우회 가능하지만 거슬림 (예: 디자인 불일치)
- **note**: 의견 / 미래 아이디어

---

## 5. 결정 사항 (Phase 1 중 maintainer 가 내린 판단)

| ID | 날짜 | 결정 | 근거 | 영향 |
|----|------|------|------|------|
| D1 | YYYY-MM-DD | (예: T#1 의 F? 를 fix 우선순위 1 로) | (예: 3 명 중 2 명 동일 보고) | (예: Sprint 25 backlog 추가) |

---

## 6. Sprint 일정 (PRD §5.3)

| Sprint | 활동 | 시작 | 종료 | 상태 |
|--------|------|------|------|------|
| S25 | Phase Desk-2 + Phase 1 beta 시작 | 2026-05 | TBD | 진행 중 |
| S26 | Desk-3 (cron + artifact 카드 연결) | TBD | TBD | 예정 |
| S27 | 측정 instrumentation (counters + TTV 자동) | TBD | TBD | 예정 |
| S28 | 테스터 1주차 피드백 합성 | TBD | TBD | 예정 |
| S29 | 상위 3 friction fix | TBD | TBD | 예정 |

---

## 7. Phase 1 → Phase 2 gate 체크리스트

PRD §16 sign-off:

- [ ] N=3 testers identified (현재: 0)
- [ ] tester-onboarding 스크립트 작성 ([`docs/tester-onboarding.md`](tester-onboarding.md)) ✅
- [ ] 진척 추적 시트 (이 문서) ✅
- [ ] N=3 testers complete PDCA loop unaided (현재: 0/3)
- [ ] D7 retention ≥30%
- [ ] Critical issues open = 0
- [ ] Top-3 friction fix shipped

위 7 항목 모두 ✅ 일 때 Phase 2 (invitational beta 확장) 진입.

---

## 8. 비고

- 본 문서는 *수동 추적용* — 측정 인프라 자동화 (Sprint 25) 전까지 단순 markdown
- 테스터별 개별 정보는 *PR/issue 안에는 적지 않음* — privacy. 이 문서는 maintainer 로컬 메모용
- Phase 1 종료 후 *익명화된 합성 결과* 만 README / docs 에 반영
- 비용 추정 (Phase 1 전체): API 비용은 BYO-key 모델이라 maintainer 부담 0. maintainer 시간 ~10시간 (모집 + onboarding 지원 + 피드백 synthesis)

---

```text
Next best move: 후보 3명 명단 채우기 (행 1-3) + 가입일 / 연락 채널 기재 → 첫 테스터 invitational
Reason: 추적 시트는 ready. 사람만 모이면 Phase 1 진입.
Gate: scope (테스터 모집)
Automation: manual (소셜 채널 활용)
Risk: low
```
