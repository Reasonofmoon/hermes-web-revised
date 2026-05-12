# Phase 1 Tester Onboarding

> **누구를 위해**: Hermes for Web 의 invitational beta (N=3) 첫 사용자
> **걸리는 시간**: 설치 ~30분, 첫 산출물까지 ~10분, 전체 1차 검증 ~60분
> **준비물**: macOS / Linux / Windows-WSL 1개, GitHub 계정, Anthropic 또는 OpenAI API 키 (선택, 로컬 Darwin 모델 사용 시 불필요)

이 문서는 *PRD §5 Phase 1* 의 acceptance criteria 인 **"N=3 testers complete full PDCA loop unaided"** 의 확인을 돕는 가이드입니다. 막힐 때마다 *어디서 막혔는지* 짧게 적어주시면 그게 가장 가치 있는 피드백입니다.

---

## 0. 사전 점검 (5분)

다음 3개를 한 번 확인해 주세요. 안 되면 *바로* 알려주세요 — Phase 1 의 절반은 *설치 마찰* 측정입니다.

- [ ] **Hermes Agent 가 이미 설치되어 있는가?**
  - 아니라면: 본 fork 의 `docs/skill-packages/app-factory-bkit.zip` 안 `references/hermes-adaptation.md` 의 가이드, 또는 hermes-agent README 따라 설치
  - 확인: 터미널에서 `which hermes` 또는 `~/.hermes/` 디렉토리 존재
- [ ] **Python 3.10+ 가 있는가?**
  - 확인: `python3 --version` → `3.10.x` 이상
- [ ] **(선택) GPT/Anthropic API 키가 있는가?**
  - 없어도 됨 — 로컬 Darwin 모델로 시작 가능
  - 있으면: 환경변수 `ANTHROPIC_API_KEY` 또는 `OPENAI_API_KEY` 로 등록

> **막히면**: 이 단계에서 막힌 사용자 비율이 PRD 의 "Setup Pack 무보조 완수율 ≥60%" KPI 에 직접 들어갑니다. *어디서* 막혔는지가 가장 중요한 데이터.

---

## 1. 설치 (10분)

```bash
git clone https://github.com/reallygood83/hermes-for-web.git
cd hermes-for-web
./start.sh 8787
```

성공하면 터미널에 다음과 같이 나옵니다:

```
[ok] Hermes agent: /Users/you/.hermes/hermes-agent
[ok] Python: .../venv/bin/python  (Python 3.11.x)
[ok] Dependencies satisfied.
[ok] Server is healthy.

  Hermes Web UI is running
  Open: http://localhost:8787
```

브라우저에서 [http://localhost:8787](http://localhost:8787) 열기.

> **막히면**: `start.sh` 의 에러 메시지 전체를 그대로 복사해 주세요. WSL 사용자는 `wsl -e bash -lc './start.sh 8787'` 로도 됩니다.

---

## 2. 첫 5분 — 첫 응답까지 (5분)

페이지 열면:
- 좌상단에 **분홍 H 로고**
- 좌측에 사이드바 (탭 10개)
- 가운데 채팅 영역
- 우측에 파일 탐색 패널

### 체크리스트
- [ ] 사이드바 상단의 **벚꽃 테마**가 보임 (분홍/크림 톤)
- [ ] 빈 채팅에 "새 대화를 시작해보세요" 표시
- [ ] 모델 칩이 **GPT-5.5** 또는 **Darwin** 같은 활성 모델 이름

### 첫 메시지

채팅창에 다음 중 하나를 입력하고 Enter:

```
한국어 단어 5개 + 영어 뜻을 학습 카드 형식으로 만들어줘. **단어** — 뜻 형식.
```

응답이 끝나면 *자동으로* topbar 의 📦 산출물 칩에 `1` 카운트가 떠야 합니다.

> **확인 포인트**: 응답이 30초 이상 걸리면 모델 선택 / API 키 / 네트워크 문제. 우리 KPI 의 **TTV ≤90초** 검증.

---

## 3. 첫 산출물 만들기 (10분)

### 자동 추출 확인
- [ ] 📦 **산출물** 칩 클릭 → 우측에서 패널 슬라이드
- [ ] 방금 응답의 **단어장** 카드가 패널에 보임
- [ ] 카드 클릭 → 미리보기 모달 → **단어카드 플립 인터페이스** (앞면: 단어 / 뒷면: 뜻)
- [ ] ←/→ 키로 단어 이동, Space 로 뒤집기

### 수동 저장 확인
- [ ] 채팅 메시지의 응답 옆에 💾 버튼 클릭
- [ ] "산출물에 저장됨" 토스트 표시
- [ ] 패널에서 새 카드 확인

### 편집 + revision
- [ ] 미리보기 모달에서 ✎ **편집** → textarea 로 전환
- [ ] 내용 한 줄 수정 → ✓ **저장**
- [ ] 모달 헤더에 "버전:" 드롭다운 등장 (revision 생성됨)
- [ ] 이전 버전 선택 → 노란 배너 → "되돌리기" 동작

### Export 확인
- [ ] **↓ 내보내기 ▾** 드롭다운 → .md / .html / .txt / PDF 4 포맷 모두 다운로드
- [ ] 다운로드된 파일이 의도한 내용

> **여기까지 성공하면 *Setup Pack 무보조 완수율*의 절반 성공**. 나머지 절반은 다음 단계.

---

## 4. 데스크 + Setup Pack 시도 (10분)

### Agent Desk 첫 사용
- [ ] 사이드바에서 **데스크** 탭 클릭
- [ ] 자동으로 *이전 세션* 이 카드로 보임 (위 §3 에서 만든 세션 포함)
- [ ] 카드 클릭 → 그 세션 로드 + 채팅 탭 전환
- [ ] `+ 새 작업` 클릭 → 제목 입력 → Enter → "예정" 컬럼에 등장
- [ ] 카드 클릭 → `→ 진행 중` → 컬럼 이동

### Setup Pack 1개 실행
사이드바의 **설치팩** 탭에서 *Obsidian Starter* 또는 *Memory Sync Pack* 1개 실행해 보기.

- [ ] 설치팩 카드 클릭 → 가이드 흐름 시작
- [ ] 막히는 단계를 *그대로* 알려주기

> **이 단계가 PRD 의 핵심 KPI 측정 지점**. 60% 가 무보조로 완수하면 Phase 1 success criterion 충족.

---

## 5. 피드백 가이드

### 우리가 가장 듣고 싶은 것

1. **어디서 막혔나** — 정확한 단계 ("§3 의 자동 추출 확인 단계에서 카드가 안 나타남")
2. **얼마나 걸렸나** — 각 단계 대략 시간 (분 단위 정확하지 않아도 OK)
3. **무엇을 기대했는데 다르게 동작했나** — 직관과 실제 차이
4. **첫인상에서 거슬렸던 것** — 디자인/문구/속도 어떤 것이든

### 어떻게 보고하면 되는가

**가장 빠른 경로**:
- GitHub Issue: https://github.com/Reasonofmoon/hermes-web-revised/issues/new
- 또는 짧은 메시지로 maintainer 에게 직접

**Issue 템플릿** (복사해서 사용):

```markdown
# [Phase 1 Tester #N] 단계 §X 에서 막힘 / 의견

**환경**: macOS / Linux / Windows-WSL
**Hermes 버전**: (start.sh 출력의 "agent dir" 라인)
**모델**: GPT-5.5 / Darwin / Sonnet 4.6 / ...

## 막힌 단계
§2 의 첫 메시지 단계에서 ...

## 무엇이 일어났는가
...

## 무엇을 기대했나
...

## 콘솔 로그 (있으면)
\`\`\`
...
\`\`\`
```

### 어떤 피드백은 *보낼 필요 없는가*

- 글자 색깔 같은 미적 디테일 (Phase 1 은 *기능 검증* 단계)
- "더 빠르게 만들어 주세요" (정량 데이터 없으면 행동으로 옮기기 어려움)
- "이런 기능도 있으면" (Phase 1 종료 후 Phase 2 에서 수집)

---

## 6. 자주 발생하는 문제

| 증상 | 해결 |
|------|------|
| `start.sh` 가 "Hermes agent not found" | `~/.hermes/hermes-agent` 디렉토리 위치 확인 + `export HERMES_WEBUI_AGENT_DIR=/path/to/hermes-agent` 환경변수 |
| 첫 응답이 안 돌아옴 | 모델 칩이 정확한지 확인 → 콘솔 (브라우저 DevTools) 의 `/api/chat` 응답 코드 확인 |
| 산출물 자동 추출 안 됨 | 응답이 너무 짧으면 (200자 미만 markdown) 추출 안 됨. 더 긴 요청 시도 |
| Setup Pack 이 외부 도구 못 찾음 | Obsidian / Telegram bot 토큰 등 prerequisite 확인 |
| 페이지가 캐시된 옛 UI 표시 | Ctrl+Shift+R (Windows) / Cmd+Shift+R (macOS) 강제 새로고침 |

---

## 7. 알려진 한계 (Phase 1 stage)

이미 알고 있으므로 *보고할 필요 없음*:

- 한국어 외 다른 언어 UI 없음 (`README.en.md` 는 있지만 UI 자체는 한국어)
- 모바일 반응형은 700px 이상에서 검증됨, 그 이하는 알려진 미흡 부분 있음
- 측정 인프라 (TTV 자동 측정, KPI 카운터) 미구현 — Phase 1 후 sprint 25 예정
- Pretendard 폰트 시스템에 없으면 fallback 사용 (의도)
- Cherry Blossom 기본 테마는 의도 (UI Phase Ⓒ 후속에서 첫 실행 시 선택 모달 검토 중)

---

## 8. 마지막 — 1주일 후 확인

설치 후 1주일 뒤 짧은 후속 확인 부탁드립니다:

- [ ] 한 번 이상 다시 사용했나? (D7 retention KPI)
- [ ] 산출물이 몇 개 누적되었나?
- [ ] 어떤 워크플로우가 *기대보다 자주* 사용되었나?
- [ ] 무엇을 *기대했는데 안 썼나*

이 4개 답이 Phase 2 (invitational beta 확장) 의 입력이 됩니다.

---

## 9. 감사

이 fork 는 solo maintainer 가 운영합니다. *피드백 1개 = 다음 sprint 1 항목*. 시간 내주신 만큼 가치 있게 반영하겠습니다.

문의: GitHub Issue 또는 @Reasonofmoon 직접 메시지.

---

```text
Next best move (tester 입장): 위 §1-§4 순서대로 60분 안에 통과해 보고, 막힌 단계 1개 이상 보고.
Reason: §3-§4 가 KPI 측정 지점 (Setup Pack 무보조 완수율, TTV, 첫 산출물).
Gate: scope (개별 테스터 검증)
Automation: manual (사용자 실행)
Risk: low (read-only — 설치된 환경에 영향 없음)
```
