# Hermes for Web — 종합 기술 스펙 (마스터 인덱스)

> **이 문서의 역할**: hermes-for-web 의 *모든 기술 사실을 한 곳에서* 찾을 수 있는 통합 인덱스. 더 깊은 내용은 각 섹션 끝의 출처 링크를 따라간다.
> **정합 기준일**: 2026-05-12 (자동 생성)
> **대상 버전**: v0.35.1
> **대상 청자**: 개발자, AI 에이전트 (fork·확장 작업자 포함)

---

## 0. 한 눈에 보기

| 항목 | 값 |
|------|---|
| 제품 정의 | Hermes Agent 를 위한 브라우저 작업실 (한국어 친화 UI + 워크플로우 + 메모리 개인화) |
| 코드 규모 | 총 17,199 줄 (백엔드 4,008 / 프런트엔드 5,594 / 문서 8,997 / 테스트 — 433개 테스트 케이스) |
| 백엔드 | Python 3.12+, `http.server.ThreadingHTTPServer`, 빌드 스텝·프레임워크 없음 |
| 프런트엔드 | Vanilla JS 7 모듈, 번들러 없음, 직접 디스크에서 서빙 |
| 통신 | REST (JSON) + **SSE 스트리밍** (취소 가능) |
| 의존성 | `pyyaml` (외에 모두 표준 라이브러리) + `hermes-agent` 모듈 |
| 인증 | 선택적 PBKDF2 비밀번호 + HMAC-서명 쿠키 (TTL 24h) |
| 상태 저장 | 파일 시스템 (`~/.hermes/webui/`), 데이터베이스 없음 |
| 기본 포트 | `127.0.0.1:8787` (loopback only) |
| 컨테이너 | Dockerfile (python:3.12-slim) + docker-compose, multi-arch (amd64+arm64) |
| CI/CD | GitHub Actions, 태그 푸시 시 자동 릴리스 + GHCR 퍼블리시 |
| 라이선스 | LICENSE 파일 참조 |
| 원본 fork | [reallygood83/hermes-for-web](https://github.com/reallygood83/hermes-for-web) |

---

## 1. 제품 개요

### 1.1 한 줄 정의
**Hermes for Web**은 Hermes Agent 의 *조종석*이다. 단순한 채팅 UI가 아니라 *작업을 만들고 점검하고 저장하고 이어서 공유하는 작업 공간*.

### 1.2 핵심 메타포 ([README.md](../README.md))
| Hermes CLI | Telegram 봇 | Obsidian | **Hermes for Web** |
|-----------|-----------|----------|---------------------|
| 엔진룸 | 무전기 | 책장 | 조종석 / 관제탑 / 책상 |

### 1.3 다른 AI UI 와의 차별점 5가지 ([HERMES.md](../HERMES.md))
1. **지속형 메모리** — 세션·부팅·모델 전환 간 자동 학습
2. **자율 스케줄링** — 사용자 부재 중 Cron 작업 실행
3. **다중 채널 접근** — 터미널·웹·메신저(10+ 플랫폼)
4. **자가 개선 스킬** — 문제 해결 시 자동으로 절차를 스킬로 저장
5. **공급자 중립성** — OpenAI / Anthropic / Google / DeepSeek 모두

### 1.4 사용자 페르소나
- 솔로 개발자 (스택 컨텍스트를 재설명하기 싫은)
- 팀 공유 서버 사용자 (개인 구독 회피)
- 자동화 집약형 워크플로우 사용자 (cron, 스케줄)
- 프라이버시 중심 자체 서버 사용자
- 다중 모델 사용자 (비용·성능 최적화)

---

## 2. 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│  Browser (Vanilla JS, 7 modules)                                 │
│  index.html ─ ui.js ─ messages.js ─ panels.js ─ sessions.js     │
│              workspace.js ─ commands.js ─ boot.js                │
└──────────────────────────┬───────────────────────────────────────┘
                  REST(JSON) │ + SSE (text/event-stream)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  server.py  (ThreadingHTTPServer, ~81 lines)                     │
│    • Handler.do_GET / do_POST → api.routes                       │
│    • auth middleware via api.auth.check_auth                     │
└──────────────────────────┬───────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  api/  (11 modules)                                              │
│    routes.py     ─ 70+ endpoints (GET + POST)                   │
│    config.py     ─ 환경변수, 모델 디스커버리, settings 캐시     │
│    models.py     ─ Session CRUD + 인덱스                        │
│    profiles.py   ─ 프로필(HERMES_HOME) 전환                     │
│    streaming.py  ─ SSE engine + cancel + run_agent              │
│    auth.py       ─ PBKDF2 password + HMAC cookie                │
│    workspace.py  ─ 파일 시스템 + git 정보                       │
│    upload.py     ─ multipart 파서                               │
│    helpers.py    ─ require/bad/j/safe_resolve/security_headers  │
│    state_sync.py ─ CLI SQLite 와 토큰/usage 동기화              │
└──────────────────────────┬───────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  hermes-agent (sibling repo)                                     │
│    run_agent.AIAgent  ─ LLM 호출, 도구 사용                     │
│    tools/*  ─ approval, skills, browser, terminal, memory…     │
│    cron/*   ─ jobs, scheduler                                   │
│    hermes_cli/* ─ profiles, runtime_provider                   │
└──────────────────────────────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  State (파일 시스템 only)                                        │
│    ~/.hermes/webui/sessions/{id}.json  + _index.json            │
│    ~/.hermes/webui/{settings,workspaces,projects}.json          │
│    ~/.hermes/profiles/{name}/  (프로필별 HERMES_HOME)           │
└──────────────────────────────────────────────────────────────────┘
```

설계 결정 핵심 (ADR — [ARCHITECTURE.md §13](../ARCHITECTURE.md#13-architecture-decision-records)):
- **ADR-001**: Single-file server (지금은 api/로 분리됨)
- **ADR-003**: ThreadingHTTPServer (asyncio 대신)
- **ADR-004**: SSE > WebSocket (단방향 스트리밍에 충분)
- **ADR-007**: 승인 상태는 환경변수 (`HERMES_EXEC_ASK`, `HERMES_SESSION_KEY`)

---

## 3. 파일 인벤토리

### 3.1 백엔드 ([api/](../api/))

| 파일 | 라인수 | 책임 |
|------|-------|------|
| `server.py` | 81 | Handler + 라우팅 위임 + auth 미들웨어 |
| `api/routes.py` | 1338 | 70+ endpoint 핸들러 (handle_get, handle_post + _handle_*) |
| `api/config.py` | 826 | 환경변수, 모델 디스커버리, settings, reload |
| `api/streaming.py` | 397 | `_run_agent_streaming`, SSE, cancel, HERMES_HOME save/restore |
| `api/models.py` | 368 | `Session` 데이터클래스, CRUD, `_index.json` 관리 |
| `api/profiles.py` | 366 | `get_active_hermes_home`, `switch_profile`, hermes_cli wrapper |
| `api/workspace.py` | 288 | `list_dir`, `read_file_content`, `git_info_for_workspace` |
| `api/auth.py` | 170 | PBKDF2 password, HMAC cookie, `check_auth` |
| `api/state_sync.py` | 101 | `sync_session_usage` (CLI state.db 동기화) |
| `api/upload.py` | 82 | multipart 파서, `handle_upload` |
| `api/helpers.py` | 71 | `j`, `bad`, `require`, `safe_resolve`, 보안 헤더 |
| `api/__init__.py` | 1 | (패키지 마커) |

### 3.2 프런트엔드 ([static/](../static/))

| 파일 | 라인수 | 책임 |
|------|-------|------|
| `static/index.html` | 662 | HTML 템플릿 (3-panel + 모달) |
| `static/style.css` | 670 | 전체 CSS, 모바일 반응형, **6개 테마** CSS 변수 |
| `static/panels.js` | 1369 | 사이드바 패널 (Cron, Skills, Memory, Workspaces, Profiles, Todos, Artifacts, Setup, Preflight) |
| `static/ui.js` | 1065 | 전역 상태 `S`, renderMd, 모델 드롭다운, 스크롤 핀, 토큰 사용량 |
| `static/boot.js` | 781 | 초기화, 모달, 파일 업로드, 음성 입력, 모바일 nav |
| `static/sessions.js` | 589 | 세션 CRUD, 목록 렌더, 검색, 아이콘 |
| `static/messages.js` | 382 | `send()`, SSE 이벤트 처리, 도구 카드, 트랜스크립트 |
| `static/workspace.js` | 249 | 파일 트리, 미리보기, 파일 ops |
| `static/commands.js` | 197 | 슬래시 명령 레지스트리, 파서, 자동완성 |

### 3.3 문서 ([./](../))

| 파일 | 라인수 | 역할 |
|------|-------|------|
| `ARCHITECTURE.md` | 1588 | **Canonical 기술 레퍼런스** — 이 SPEC.md 의 모태 |
| `TESTING.md` | 1715 | 수동 브라우저 테스트 플랜 + 자동화 커버리지 |
| `CHANGELOG.md` | 1252 | 스프린트별 변경 이력 |
| `SPRINTS.md` | 1161 | 스프린트 계획 (CLI + Claude 패리티 목표) |
| `README.md` / `README.ko.md` / `README.en.md` | 1225 | 사용자 안내 (한/영) |
| `HERMES.md` | 375 | Hermes 에이전트의 정체성·차별점 |
| `ROADMAP.md` | 341 | 제품 로드맵 |
| `THEMES.md` | 147 | 테마 시스템 가이드 |
| `AGENTS.md` | 53 | AI 에이전트가 이 디렉토리에서 작업할 때의 지침 |
| `BUGS.md` | 40 | 버그 백로그 (현재 미해결 0건) |

### 3.4 docs/ 보조 문서

| 파일 | 다루는 주제 |
|------|------------|
| [`full-install-from-web.md`](full-install-from-web.md) | 웹 UI만으로 Hermes 전체 설치 |
| [`install-with-hermes.md`](install-with-hermes.md) | Hermes CLI 와 함께 설치 |
| [`setup-packs.md`](setup-packs.md) | 원클릭 설정 팩 (Obsidian, ShareNote, Telegram) |
| [`research-packs.md`](research-packs.md) | 리서치 중심 워크플로우 패킹 |
| [`onboarding.md`](onboarding.md) | 첫 사용자 경험 (개인화 카드, 테마, Setup Packs) |
| [`private-beta-guide.md`](private-beta-guide.md) | 베타 테스터 안내 |
| [`final-release-checklist.md`](final-release-checklist.md) | 최종 릴리스 점검 |
| [`private-release-checklist.md`](private-release-checklist.md) | 비공개 릴리스 체크리스트 |
| [`launch-copy.md`](launch-copy.md) | 출시 발표·마케팅 문구 |
| [`promo-kit-ko.md`](promo-kit-ko.md) | 한국어 프로모션 키트 |
| [`voice-troubleshooting.md`](voice-troubleshooting.md) | 음성 입력 문제 해결 |
| [`plans/2026-04-06_hermes-webui-gucci-roadmap.md`](plans/2026-04-06_hermes-webui-gucci-roadmap.md) | 고급 워크플로우 UI 계획 |
| [`specs/2026-04-06-gucci-webui-spec.md`](specs/2026-04-06-gucci-webui-spec.md) | 구찌 스타일 UI 상세 스펙 |

---

## 4. 런타임 환경 + 환경변수

### 4.1 환경변수 전체 ([api/config.py](../api/config.py))

| 환경변수 | 기본값 | 제어 대상 |
|---------|--------|----------|
| `HERMES_WEBUI_HOST` | `127.0.0.1` | HTTP 바인드 주소 |
| `HERMES_WEBUI_PORT` | `8787` | HTTP 포트 |
| `HERMES_WEBUI_STATE_DIR` | `~/.hermes/webui` | 상태 디렉토리 (sessions/, settings.json) |
| `HERMES_WEBUI_AGENT_DIR` | (자동 디스커버리) | hermes-agent 체크아웃 경로 |
| `HERMES_WEBUI_PYTHON` | (자동) | 에이전트 실행 Python |
| `HERMES_WEBUI_DEFAULT_WORKSPACE` | `~/workspace` 또는 STATE_DIR/workspace | 신규 세션 기본 workspace |
| `HERMES_WEBUI_DEFAULT_MODEL` | `openai/gpt-5.5` | 신규 세션 기본 모델 |
| `HERMES_WEBUI_PASSWORD` | (없음) | 로그인 암호 (설정 시 인증 활성) |
| `HERMES_HOME` | `~/.hermes` | Hermes 에이전트 상태 디렉토리 (CLI 공유) |
| `HERMES_BASE_HOME` | (없음) | 기본 ~/.hermes 명시적 오버라이드 |
| `HERMES_CONFIG_PATH` | (활성 프로필 config.yaml) | config.yaml 경로 |
| `HERMES_MODEL` / `OPENAI_MODEL` / `LLM_MODEL` | (없음) | 모델 선택 오버라이드 |

### 4.2 요청 처리 중 임시 설정되는 환경변수 ([api/streaming.py](../api/streaming.py))

| 환경변수 | 시점 | 용도 |
|---------|------|------|
| `TERMINAL_CWD` | 요청 처리 직전 | terminal 도구의 기본 cwd |
| `HERMES_EXEC_ASK` | 요청 처리 직전 | 위험 명령 승인 게이트 활성 (=`1`) |
| `HERMES_SESSION_KEY` | 요청 처리 직전 | 세션별 승인 상태 키 |
| `HERMES_HOME` | 요청 처리 직전 | 활성 프로필의 HERMES_HOME (요청 후 복원) |

요청 후 원래 값으로 **반드시 복원**됨 (try/finally).

---

## 5. API 엔드포인트 — 전체 70+

> ✅ 인증 필요 / ❌ public (PUBLIC_PATHS)

### 5.1 GET

| Path | Handler | Query | Response | Auth |
|------|---------|-------|----------|:----:|
| `/` | handle_get | — | HTML (index.html) | ✅ |
| `/login` | handle_get | — | 로그인 페이지 HTML | ❌ |
| `/health` | handle_get | — | `{status, sessions, active_streams, uptime_seconds}` | ❌ |
| `/favicon.ico` | handle_get | — | 204 No Content | ❌ |
| `/static/*` | _serve_static | — | 정적 파일 | ✅ |
| `/api/auth/status` | handle_get | — | `{auth_enabled, logged_in}` | ❌ |
| `/api/models` | handle_get | — | `{active_provider, default_model, groups[]}` | ✅ |
| `/api/settings` | handle_get | — | settings dict (password_hash 제외) | ✅ |
| `/api/session` | handle_get | `session_id` | `{session: {…, messages[]}}` | ✅ |
| `/api/sessions` | handle_get | — | `{sessions[], cli_count}` | ✅ |
| `/api/sessions/search` | _handle_sessions_search | `q, content, depth` | `{sessions[], query, count}` | ✅ |
| `/api/session/export` | _handle_session_export | `session_id` | JSON 다운로드 | ✅ |
| `/api/projects` | handle_get | — | `{projects[]}` | ✅ |
| `/api/workspaces` | handle_get | — | `{workspaces[], last}` | ✅ |
| `/api/list` | _handle_list_dir | `session_id, path` | `{entries[], path}` | ✅ |
| `/api/git-info` | handle_get | `session_id` | `{git: {branch, dirty, modified[], ahead, behind}}` | ✅ |
| `/api/file` | _handle_file_read | `session_id, path` | `{path, content, size, lines}` | ✅ |
| `/api/file/raw` | _handle_file_raw | `session_id, path, download` | 바이너리 | ✅ |
| `/api/chat/stream` | _handle_sse_stream | `stream_id` | text/event-stream | ✅ |
| `/api/chat/stream/status` | handle_get | `stream_id` | `{active, stream_id}` | ✅ |
| `/api/chat/cancel` | handle_get | `stream_id` | `{ok, cancelled, stream_id}` | ✅ |
| `/api/approval/pending` | _handle_approval_pending | `session_id` | `{pending: {…}}` | ✅ |
| `/api/approval/inject_test` | _handle_approval_inject | `session_id, pattern_key, command` | `{ok}` | ❌ (loopback only) |
| `/api/crons` | handle_get | — | `{jobs[]}` | ✅ |
| `/api/crons/output` | _handle_cron_output | `job_id, limit` | `{job_id, outputs[]}` | ✅ |
| `/api/crons/recent` | _handle_cron_recent | `since` | `{completions[], since}` | ✅ |
| `/api/skills` | handle_get | — | `{skills[]}` | ✅ |
| `/api/skills/content` | handle_get | `name, file` | `{…, linked_files[]}` | ✅ |
| `/api/memory` | _handle_memory_read | — | `{memory, user, memory_path, user_path, mtime}` | ✅ |
| `/api/profiles` | handle_get | — | `{profiles[], active}` | ✅ |
| `/api/profile/active` | handle_get | — | `{name, path}` | ✅ |

### 5.2 POST

| Path | Handler | Body | Response | Auth |
|------|---------|------|----------|:----:|
| `/api/auth/login` | handle_post | `password` | `{ok}` + Set-Cookie | ❌ |
| `/api/auth/logout` | handle_post | — | `{ok}` + Clear-Cookie | ✅ |
| `/api/settings` | handle_post | settings dict (`_set_password`, `_clear_password` 포함) | settings dict | ✅ |
| `/api/session/new` | handle_post | `workspace, model` | `{session}` | ✅ |
| `/api/session/rename` | handle_post | `session_id, title` | `{session}` | ✅ |
| `/api/session/update` | handle_post | `session_id, workspace, model` | `{session}` | ✅ |
| `/api/session/delete` | handle_post | `session_id` | `{ok}` | ✅ |
| `/api/session/clear` | handle_post | `session_id` | `{ok, session}` | ✅ |
| `/api/session/truncate` | handle_post | `session_id, keep_count` | `{ok, session}` | ✅ |
| `/api/session/pin` | handle_post | `session_id, pinned` | `{ok, session}` | ✅ |
| `/api/session/archive` | handle_post | `session_id, archived` | `{ok, session}` | ✅ |
| `/api/session/move` | handle_post | `session_id, project_id` | `{ok, session}` | ✅ |
| `/api/session/import` | _handle_session_import | `messages[], title, workspace, model, tool_calls, pinned` | `{ok, session}` | ✅ |
| `/api/session/import_cli` | _handle_session_import_cli | `session_id` | `{session, imported}` | ✅ |
| `/api/sessions/cleanup` | _handle_sessions_cleanup | — | `{ok, cleaned}` | ✅ |
| `/api/sessions/cleanup_zero_message` | _handle_sessions_cleanup | — | `{ok, cleaned}` | ✅ |
| `/api/chat` | _handle_chat_sync | `session_id, message, workspace, model` | `{answer, status, session, result}` | ✅ |
| `/api/chat/start` | _handle_chat_start | `session_id, message, attachments[], workspace, model` | `{stream_id, session_id}` | ✅ |
| `/api/upload` | handle_upload | multipart: file, session_id | `{filename, path, size}` | ✅ |
| `/api/projects/create` | handle_post | `name, color` | `{ok, project}` | ✅ |
| `/api/projects/rename` | handle_post | `project_id, name, color` | `{ok, project}` | ✅ |
| `/api/projects/delete` | handle_post | `project_id` | `{ok}` | ✅ |
| `/api/workspaces/add` | _handle_workspace_add | `path, name` | `{ok, workspaces[]}` | ✅ |
| `/api/workspaces/remove` | _handle_workspace_remove | `path` | `{ok, workspaces[]}` | ✅ |
| `/api/workspaces/rename` | _handle_workspace_rename | `path, name` | `{ok, workspaces[]}` | ✅ |
| `/api/file/save` | _handle_file_save | `session_id, path, content` | `{ok, path, size}` | ✅ |
| `/api/file/create` | _handle_file_create | `session_id, path, content` | `{ok, path}` | ✅ |
| `/api/file/delete` | _handle_file_delete | `session_id, path` | `{ok, path}` | ✅ |
| `/api/file/rename` | _handle_file_rename | `session_id, path, new_name` | `{ok, old_path, new_path}` | ✅ |
| `/api/file/create-dir` | _handle_create_dir | `session_id, path` | `{ok, path}` | ✅ |
| `/api/approval/respond` | _handle_approval_respond | `session_id, choice` (`once`/`session`/`always`/`deny`) | `{ok, choice}` | ✅ |
| `/api/crons/create` | _handle_cron_create | `prompt, schedule, name, deliver, skills, model` | `{ok, job}` | ✅ |
| `/api/crons/update` | _handle_cron_update | `job_id, …` | `{ok, job}` | ✅ |
| `/api/crons/delete` | _handle_cron_delete | `job_id` | `{ok, job_id}` | ✅ |
| `/api/crons/run` | _handle_cron_run | `job_id` | `{ok, job_id, status}` | ✅ |
| `/api/crons/pause` | _handle_cron_pause | `job_id, reason` | `{ok, job}` | ✅ |
| `/api/crons/resume` | _handle_cron_resume | `job_id` | `{ok, job}` | ✅ |
| `/api/skills/save` | _handle_skill_save | `name, content, category` | `{ok, name, path}` | ✅ |
| `/api/skills/delete` | _handle_skill_delete | `name` | `{ok, name}` | ✅ |
| `/api/memory/write` | _handle_memory_write | `section` (`memory`/`user`), `content` | `{ok, section, path}` | ✅ |
| `/api/profile/switch` | handle_post | `name` | `{profiles, active, default_model, default_workspace}` | ✅ |
| `/api/profile/create` | handle_post | `name, clone_from, clone_config` | `{ok, profile}` | ✅ |
| `/api/profile/delete` | handle_post | `name` | `{ok, name}` | ✅ |

---

## 6. 데이터 모델

### 6.1 Session ([api/models.py](../api/models.py))

```python
{
  "session_id":     str,    # 12-char hex, 자동 생성
  "title":          str,    # 기본 'Untitled', 최대 80자
  "workspace":      str,    # 절대 경로
  "model":          str,    # 예: 'openai/gpt-5.5' 또는 'gpt-5.5'
  "messages":       [
    {
      "role":        "user" | "assistant" | "tool",
      "content":     str | [parts],
      "timestamp":   int,
      "attachments": [filename]
    }
  ],
  "tool_calls": [
    {
      "name":              str,
      "snippet":           str,  # 응답 미리보기, 최대 200자
      "tid":               str,  # tool_call_id
      "assistant_msg_idx": int,
      "args":              dict  # 절단된 인자
    }
  ],
  "created_at":       float,
  "updated_at":       float,
  "pinned":           bool,
  "archived":         bool,
  "project_id":       str | None,
  "profile":          str | None,  # 'default' 또는 프로필명
  "input_tokens":     int,         # 누적
  "output_tokens":    int,         # 누적
  "estimated_cost":   float | None # 달러
}
```

### 6.2 Workspace 항목 (workspaces.json 안의 한 entry)
```python
{"path": "<절대경로>", "name": "<표시명>"}
```

### 6.3 Project (projects.json)
```python
{
  "project_id": str,         # 12-char hex
  "name":       str,         # 최대 128자
  "color":     str | None,   # #RRGGBB 또는 #RGB
  "created_at": float
}
```

### 6.4 Settings (settings.json)
```python
{
  "default_model":     str,
  "default_workspace": str,
  "send_key":         "enter" | "ctrl+enter",
  "show_token_usage":  bool,
  "show_cli_sessions": bool,
  "sync_to_insights":  bool,
  "theme":             str,         # 'dark'|'light'|'slate'|'solarized'|'monokai'|'nord'|'cherry-blossom'
  "bot_name":          str,
  "password_hash":     str | None   # PBKDF2-SHA256, 600k iterations
}
```

### 6.5 Profile (~/.hermes/profiles/{name}/)
디렉토리 자체가 단위. 안에:
- `config.yaml`, `.env`, `SOUL.md`
- `memories/`, `sessions/`, `skills/`, `skins/`, `logs/`, `plans/`, `workspace/`, `cron/`
- `webui_state/workspaces.json`, `webui_state/last_workspace.txt`

이름 규칙: `^[a-z0-9][a-z0-9_-]{0,63}$`

---

## 7. SSE Streaming Engine

### 7.1 흐름
1. `POST /api/chat/start` → `stream_id` 발급, 백그라운드 스레드 시작
2. `GET /api/chat/stream?stream_id=…` → SSE 연결, 이벤트 수신
3. (옵션) `GET /api/chat/cancel?stream_id=…` → 취소

### 7.2 이벤트 타입

| 이벤트 | 페이로드 | 의미 |
|--------|---------|------|
| `token` | `{text}` | 스트림된 텍스트 토큰 |
| `tool` | `{name, preview, args}` | 도구 호출 시작 |
| `approval` | `{…pending}` | 위험 도구 승인 대기 |
| `compressed` | `{message}` | 컨텍스트 자동 압축 발생 |
| `done` | `{session, usage}` | 정상 종료 |
| `apperror` | `{message, type, hint}` | rate-limit 또는 일반 오류 |
| `cancel` | `{message}` | 사용자 취소 |
| `error` | `{message}` | 치명적 오류 |

### 7.3 Cancel 메커니즘
- 스레드별 `threading.Event` 가 `CANCEL_FLAGS[stream_id]`에 저장
- `cancel_stream(stream_id)` → `.set()` 호출
- 에이전트가 `run_conversation` 내부에서 주기적으로 플래그 확인
- 취소 시 `cancel` 이벤트 송신 후 조기 반환

---

## 8. 인증 / 보안

### 8.1 인증 모델 ([api/auth.py](../api/auth.py))

| 항목 | 값 |
|------|---|
| 활성화 조건 | `settings.json` 에 `password_hash` 존재 시 (또는 `HERMES_WEBUI_PASSWORD` env 설정 시 자동 해시) |
| 해싱 | PBKDF2-SHA256, salt=`.signing_key`, **600,000 iterations** |
| 쿠키 이름 | `hermes_session` |
| 쿠키 값 | `{token}.{signature}` — token 32-byte hex, signature 16-char HMAC-SHA256 |
| 쿠키 TTL | 86,400초 (24h) |
| 쿠키 속성 | `httponly=True`, `samesite=Lax`, `path=/` |
| 서명 키 | `STATE_DIR/.signing_key` (32 bytes random) — 부재 시 자동 생성 |
| 비밀번호 비교 | `hmac.compare_digest` (timing-safe) |

### 8.2 PUBLIC_PATHS (인증 없이 허용)
```
{'/login', '/health', '/favicon.ico', '/api/auth/login', '/api/auth/status'}
```

### 8.3 보안 헤더 ([api/helpers.py](../api/helpers.py))
모든 응답에 자동 부착:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`

### 8.4 경로 순회 방지
- `safe_resolve(root, requested)` — 모든 파일 경로 입력은 이를 통해서만 처리
- `safe_resolve_ws()` — workspace 범위 내 강제
- 위반 시 `ValueError` → 400 Bad Request

### 8.5 바인드
- 기본 `127.0.0.1` (loopback only)
- 외부 노출 시 명시적으로 `HERMES_WEBUI_HOST=0.0.0.0` 설정 필요
- 원격 접근 권장 방법: SSH 터널 `ssh -N -L 8787:127.0.0.1:8787 user@server`

---

## 9. State 저장

### 9.1 디렉토리 구조 (STATE_DIR = `~/.hermes/webui`)

```
webui/
├── sessions/
│   ├── {session_id}.json     ← 세션 1개 = 파일 1개
│   └── _index.json           ← O(1) 전체 조회용 압축 인덱스
├── workspaces.json           ← 사용자 workspace 목록 (글로벌)
├── last_workspace.txt        ← 마지막 사용한 workspace 경로
├── settings.json             ← 사용자 설정
├── projects.json             ← 세션 프로젝트 그룹
└── .signing_key              ← 인증 서명용 32바이트 키 (자동 생성)
```

### 9.2 프로필별 상태 분리
**활성 프로필이 default가 아니면** 다음 파일은 프로필 디렉토리 안에 별도로 둠:
- `~/.hermes/profiles/{name}/webui_state/workspaces.json`
- `~/.hermes/profiles/{name}/webui_state/last_workspace.txt`

세션과 settings 는 STATE_DIR 에 글로벌.

### 9.3 갱신 규칙
| 메서드 | 효과 |
|--------|------|
| `Session.save()` | `{id}.json` + `_index.json` 갱신 |
| `save_workspaces(list)` | `workspaces.json` 전체 재작성 |
| `set_last_workspace(path)` | `last_workspace.txt` 한 줄 |
| `save_settings(dict)` | `settings.json` 병합 (알려진 키만) |
| `_write_session_index()` | `_index.json` 재구성 |

---

## 10. 프로필 시스템 ([api/profiles.py](../api/profiles.py))

### 10.1 개념
프로필 = 독립된 `HERMES_HOME`. 각각 자기만의 config.yaml / .env / 스킬 / 메모리 / 크론. WebUI 는 활성 프로필의 상태를 읽고 쓰면 CLI 와 자동 동기화.

### 10.2 활성 프로필
- `~/.hermes/active_profile` 텍스트 파일에 이름 저장 (지속성)
- 서버 시작 시 `init_profile_state()` 가 읽음
- `get_active_hermes_home()`:
  - `default` → `~/.hermes`
  - 그외 → `~/.hermes/profiles/{name}/`

### 10.3 프로필 전환 (`POST /api/profile/switch`)
1. `STREAMS` 가 비어있는지 확인 (활성 스트림 있으면 차단)
2. `os.environ['HERMES_HOME']` 갱신
3. `tools.skills_tool`, `cron/jobs` 모듈 캐시 패치
4. `.env` 재로드 (os.environ 병합)
5. `config.yaml` 재로드 (`api.config._cfg_cache` 갱신)

### 10.4 프로필 생성 (`POST /api/profile/create`)
- 이름 검증 + 디렉토리 부트스트랩
- `clone_from` 옵션: 기존 프로필의 config.yaml / .env / SOUL.md 복사

---

## 11. 프런트엔드 모듈 매트릭스

| 모듈 | 책임 | 노출 함수 (요약) | 다루는 DOM |
|------|------|------|----------|
| `boot.js` | 초기화·모달·업로드·음성·모바일 | `cancelStream`, `toggleMobileSidebar`, `mobileSwitchPanel` | `#composerWrap`, `#fileInput`, `#btnMic`, `.sidebar`, `.rightpanel` |
| `ui.js` | 전역 상태 `S`, renderMd, 모델 드롭다운, 스크롤 핀 | `renderMd`, `getModelLabel`, `scrollIfPinned`, `populateModelDropdown` | `#messages`, `#modelChip`, `#ctxIndicator` |
| `commands.js` | 슬래시 명령 레지스트리 + 자동완성 | `executeCommand`, `parseCommand`, `getMatchingCommands` | `#cmdDropdown`, `#msg` |
| `messages.js` | 메시지 송신, SSE, 도구 카드 | `send`, `renderMessages`, `appendLiveToolCard` | `#msg`, `#messages`, `#liveToolCards` |
| `panels.js` | 사이드바 패널 전환 + Cron/Skill/Memory CRUD | `switchPanel`, `loadCrons`, `loadSkills`, `loadMemory` | `#panelChat/Tasks/Skills/Memory/…` |
| `sessions.js` | 세션 CRUD·목록·검색 | `newSession`, `loadSession`, `renderSessionList`, `filterSessions` | `#sessionList`, `#profileChip` |
| `workspace.js` | 파일 브라우저·미리보기·트리·ops | `loadDir`, `renderFileTree`, `previewFile`, `saveFile` | `#fileTree`, `#previewArea`, `#breadcrumbBar` |

---

## 12. UI 구조

### 12.1 레이아웃 ([static/index.html](../static/index.html))

```
.layout (3-panel grid)
├── .sidebar  (좌측 ~400px)
│   ├── .sidebar-header
│   ├── .sidebar-nav   ← 10개 탭: Chat · Tasks · Skills · Memory · Workspaces · Profiles · Todos · Artifacts · Setup · Checks
│   ├── .panel-view    ← 활성 탭 내용
│   └── .sidebar-bottom (모델 select, ws display, 액션 버튼)
├── .main   (중앙)
│   ├── .topbar           (제목 · profile chip · model chip · ⚙)
│   ├── .artifact-bar     (아티팩트 빠른 실행 + 원클릭 워크플로우)
│   ├── .artifact-shelf   (아티팩트 목록 · Setup Packs · Preflight)
│   ├── #messages         (대화 메시지)
│   ├── .reconnect-banner
│   ├── .approval-card    (위험 명령 승인)
│   ├── #activityBar      (도구 진행)
│   └── .composer-wrap    (메시지 입력)
└── .rightpanel  (우측 파일 브라우저)
    ├── .panel-header
    ├── .breadcrumb-bar
    ├── #fileTree
    └── #previewArea
```

### 12.2 모달 / 오버레이
- `#onboardingOverlay` — 첫 실행 가이드
- `#artifactModalOverlay` — 아티팩트 생성 폼
- `#settingsOverlay` — 설정 패널
- `.mobile-overlay` — 모바일 사이드바 배경

---

## 13. 슬래시 명령 ([static/commands.js](../static/commands.js))

| 명령 | 설명 |
|------|------|
| `/help` | 사용 가능한 명령 보기 |
| `/clear` | 현재 대화의 메시지 지우기 |
| `/compact` | 컨텍스트 압축 (에이전트에 요청) |
| `/model <name>` | 모델 전환 (퍼지 매칭) |
| `/workspace <name>` | 작업공간 전환 |
| `/new` | 새 세션 |
| `/usage` | 토큰 사용량 표시 토글 |
| `/theme <name>` | 테마 전환 (6개 중) |

---

## 14. 글로벌 상태 (`window.S`)

| 필드 | 의미 |
|------|------|
| `session` | 현재 세션 객체 |
| `messages` | 현재 세션 메시지 배열 (`session.messages` 별칭) |
| `entries` | 현재 디렉토리 파일 목록 |
| `busy` | 에이전트 실행 중 플래그 |
| `pendingFiles` | 업로드 대기 파일 |
| `toolCalls` | 도구 호출 배열 |
| `activeStreamId` | 현재 SSE stream_id |
| `currentDir` | 워크스페이스 내 현재 경로 |
| `activeProfile` | 활성 프로필 이름 |
| `_expandedDirs` | Set — 트리에서 펼친 디렉토리 |
| `_dirCache` | 디렉토리 내용 캐시 |
| `_pendingProfileModel` | 프로필 전환 직후 적용할 모델 (1회용) |

---

## 15. Setup Packs + 원클릭 워크플로우

### 15.1 Setup Packs ([docs/setup-packs.md](setup-packs.md))

| ID | 설명 |
|----|------|
| `obsidian-starter` | Obsidian 기본 워크플로우 검증·설정 |
| `obsidian-power` | Obsidian + 포스팅 + ShareNote + Telegram 전체 |
| `sharenote-telegram` | ShareNote + Telegram 통합 흐름 |
| `memory-sync` | 메모리 저장소 동기화 |
| `telegram-onboarding` | 텔레그램 봇 초기 설정 |
| `hermes-full-install` | 전체 Hermes 환경 설치 (CLI + WebUI) |
| `webui-only-install` | WebUI만 설치 |
| `last30days` | 최근 30일 기록 분석 |
| `autoresearch` | 자동 리서치 워크플로우 |

### 15.2 아티팩트 빠른 실행 / 원클릭 워크플로우

| 종류 | ID | 표시명 |
|------|----|------|
| 아티팩트 | `obsidian-note` | 📝 옵시디언 노트 초안 |
| 아티팩트 | `share-note` | 🔗 ShareNote 포함 노트 |
| 아티팩트 | `schedule-followup` | ⏱️ 후속 작업 예약 |
| 워크플로우 | `generate-note` | ⚡ 노트 생성 |
| 워크플로우 | `generate-posting` | ⚡ 포스팅 브리프 생성 |
| 워크플로우 | `save-memory` | 🧠 기억에 저장 |
| 워크플로우 | `telegram-handoff` | 📣 텔레그램 핸드오프 |

---

## 16. 외부 통합

### 16.1 hermes-agent 의존성 (sys.path 주입)

```python
from run_agent import AIAgent
from hermes_cli.runtime_provider import resolve_runtime_provider
from hermes_cli.profiles import list_profiles, create_profile, delete_profile
from tools.approval import (
    has_pending, pop_pending, submit_pending, approve_session,
    approve_permanent, save_permanent_allowlist, is_approved
)
from tools.skills_tool import skills_list, skill_view, SKILLS_DIR
from cron.jobs import (
    create_job, update_job, remove_job, list_jobs, get_job,
    pause_job, resume_job, OUTPUT_DIR, JOBS_FILE
)
from cron.scheduler import run_job
from api.state_sync import sync_session_usage  # 자체 모듈, CLI state.db 동기화
```

### 16.2 외부 서비스 연동
- **Obsidian** — 파일시스템 직접 (vault 경로 워크스페이스로 등록)
- **ShareNote** — Setup Pack 통해 노트 공유
- **Telegram** — Hermes Agent 의 telegram_bot 도구 (별도 토큰 설정)
- **Voice 입력** — Web Speech API (브라우저 native)

---

## 17. 테스트 스위트

### 17.1 격리 환경 ([tests/conftest.py](../tests/conftest.py))
- 테스트 전용 서버 port `8788`
- 별도 STATE_DIR `~/.hermes/webui-mvp-test` (각 세션 전후 wipe)
- 운영 서버(`8787`)와 완전 격리

### 17.2 테스트 파일 (총 433 케이스, 26 스프린트)
- `test_sprint{1..20b}.py` — 스프린트별 기능 테스트
- `test_regressions.py` — 영구 회귀 게이트 (23 케이스)

자세한 매트릭스 → [TESTING.md](../TESTING.md)

### 17.3 실행 (WSL Python 권장)

```bash
# 전체
wsl -e bash -lc 'cd /mnt/f/dev/hermes-for-web && \
  /mnt/f/dev/hermes-agent/venv/bin/python -m pytest -n auto'

# 특정 파일
... -m pytest tests/test_sprint1.py -v

# 수집만
... -m pytest --collect-only -q
```

---

## 18. 테마 시스템 ([THEMES.md](../THEMES.md))

| 테마 | ID | 비고 |
|------|----|----|
| Dark (기본) | `dark` | 기본 다크 |
| Light | `light` | Sprint 34.3 폴리시 완료 |
| Slate | `slate` | |
| Solarized | `solarized` | |
| Monokai | `monokai` | |
| Nord | `nord` | |
| Cherry Blossom | `cherry-blossom` | edutech 프로필 기본 |

CSS 변수 40+개: `--bg`, `--text`, `--muted`, `--accent`, `--strong`, `--em`, `--code-text`, …

---

## 19. 로드맵 / 마일스톤 ([ROADMAP.md](../ROADMAP.md), [SPRINTS.md](../SPRINTS.md))

### 19.1 최근 완료
- ✅ **Sprint 23** — Agentic Transparency (토큰 사용량, 서브에이전트 카드, 스킬 픽커, Preflight)
- ✅ **v0.35** — Security Hardening (ENV 경합, 서명 키, Path Traversal, PBKDF2 600k iters)
- ✅ **v0.35.1** — 모델 드롭다운 폴리시 (커스텀 프로바이더 표시, 기본 모델 포함)

### 19.2 다음 3 마일스톤
1. **Sprint 24** — Web Polish + Bug Fix Pass (안정화)
2. **Sprint 25** — macOS 네이티브 앱 (WKWebView + Swift, .dmg 배포)
3. **Beyond** — Windows/Linux 래퍼, 앱 스토어 제출

### 19.3 미해결 버그 ([BUGS.md](../BUGS.md))
**현재 미해결: 0건**

---

## 20. 변경 이력 (최근 5)

| 버전 | 변경 |
|------|------|
| v0.35.1 | 모델 드롭다운 — 커스텀 프로바이더 표시, 기본 모델 포함 |
| v0.35 | 보안 강화 — ENV 경합 / 서명 키 / Path Traversal / PBKDF2 |
| v0.34.3 | Light 테마 최종 폴리시 (46개 셀렉터 오버라이드) |
| v0.34.2 | 테마 텍스트 색상 (--strong, --em, --code-text) |
| v0.34.1 | 테마 변수 폴리시 (7개 새 CSS 변수) |

상세 → [CHANGELOG.md](../CHANGELOG.md)

---

## 21. 확장 포인트 — fork·개발자 가이드

### 21.1 새 API 엔드포인트 추가
1. `api/routes.py` 에 `_handle_<name>(handler, parsed, body)` 함수 작성
2. `handle_get` 또는 `handle_post` 의 dispatch 표에 `path → 함수` 추가
3. 응답은 `j(handler, payload)` 또는 `bad(handler, msg, status)` 로
4. 입력 검증은 `require(body, 'field1', 'field2')` 로 강제
5. 파일 경로 입력이라면 반드시 `safe_resolve()` 통과
6. 테스트는 `tests/test_sprint{새번호}.py` 에 추가, conftest 픽스처 재사용
7. 문서: [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-how-to-add-a-new-api-endpoint), [§18](../ARCHITECTURE.md#18-endpoint-reference-current) 두 곳 모두 업데이트

### 21.2 새 슬래시 명령
- `static/commands.js` 의 `COMMANDS` 배열에 `{name, desc, exec}` 추가
- exec 콜백 안에서 필요한 동작 (예: `S.session.model = …; save();`)

### 21.3 새 사이드바 패널
1. `static/index.html` 의 `.sidebar-nav` 에 탭 버튼 추가
2. `.panel-view` 에 해당 ID 의 div 추가
3. `static/panels.js` 의 `switchPanel(name)` 분기 추가
4. 패널 내용 채우는 `load<Name>()` 함수 작성

### 21.4 새 Setup Pack
- `panels.js` 의 Setup Packs 정의 배열에 `{id, label, run: async () => {…}}` 추가
- run 콜백은 보통 `/api/chat` 으로 미리 정의된 프롬프트 전송

### 21.5 새 테마
- `static/style.css` 의 `:root[data-theme="<name>"] { … }` 블록 추가
- 40+개 CSS 변수 정의 (`--bg`, `--text`, `--accent` 등)
- `commands.js` 의 `/theme` 명령 옵션에 추가

### 21.6 새 환경변수
- `api/config.py` 상단에서 `os.getenv()` 로 읽기
- 반드시 기본값 제공
- `print_startup_config()` 에 노출
- 본 SPEC.md §4 와 [ARCHITECTURE.md §3](../ARCHITECTURE.md#3-runtime-environment) 양쪽 업데이트

---

## 22. 자주 쓰는 디버깅 명령

```bash
# 서버 띄우기 (WSL)
wsl -e bash -lc 'cd /mnt/f/dev/hermes-for-web && bash ./start.sh 8787'

# Health check
curl -s http://127.0.0.1:8787/health

# API 모델 목록
curl -s http://127.0.0.1:8787/api/models | python3 -m json.tool

# 세션 목록
curl -s -b "hermes_session=…" http://127.0.0.1:8787/api/sessions

# 로그 보기
wsl -e bash -lc 'tail -f /tmp/hermes-webui-8787.log'

# 인덱스 다시 만들기
rm ~/.hermes/webui/sessions/_index.json
# 다음 GET /api/sessions 호출 시 자동 재생성
```

자세히 → [ARCHITECTURE.md §12](../ARCHITECTURE.md#12-common-debugging-commands)

---

## 23. 더 깊이 읽을 곳 (cross-reference)

| 알고 싶은 것 | 권장 출처 |
|------------|----------|
| 디자인 결정의 배경 (왜 그렇게 만들었나) | [ARCHITECTURE.md §13 ADRs](../ARCHITECTURE.md#13-architecture-decision-records) |
| 각 스프린트가 무엇을 추가했나 | [ARCHITECTURE.md §15 Sprint Log](../ARCHITECTURE.md#15-sprint-log), [CHANGELOG.md](../CHANGELOG.md) |
| 새 기능 추가 절차 (실전) | [ARCHITECTURE.md §11](../ARCHITECTURE.md#11-how-to-add-a-new-api-endpoint), [§17](../ARCHITECTURE.md#17-working-conventions-for-agent-contributors) |
| 수동 브라우저 테스트 시나리오 | [TESTING.md](../TESTING.md) |
| 제품 메타포·차별점·페르소나 | [HERMES.md](../HERMES.md), [README.ko.md](../README.ko.md) |
| 설치 가이드 (사용자용) | [docs/full-install-from-web.md](full-install-from-web.md), [docs/install-with-hermes.md](install-with-hermes.md) |
| 마케팅·런치 카피 | [docs/launch-copy.md](launch-copy.md), [docs/promo-kit-ko.md](promo-kit-ko.md) |
| Gucci 스타일 UI 미래 계획 | [docs/plans/2026-04-06_hermes-webui-gucci-roadmap.md](plans/2026-04-06_hermes-webui-gucci-roadmap.md), [docs/specs/2026-04-06-gucci-webui-spec.md](specs/2026-04-06-gucci-webui-spec.md) |
| AI 에이전트 작업 규칙 | [AGENTS.md](../AGENTS.md), [ARCHITECTURE.md §17](../ARCHITECTURE.md#17-working-conventions-for-agent-contributors) |

---

## 부록 A. Hermes for Web 의 *에이전트* 가치 (개발 컨텍스트)

이 fork 의 발전 방향을 결정할 때 참고할 본질적 가치 3가지:

1. **시간차 작업 (asynchronous agency)** — Cron 작업, Morning Brief, 자율 스케줄
2. **산출물 누적 (artifact-first)** — 채팅 로그가 아니라 결과물이 1차
3. **사용할수록 진화 (personalization)** — 메모리·프로필·스킬이 누적

이 세 축에 매핑되는 발전 방향과 prototype 우선순위는
글로벌 스킬 [output-first-onboarding](file:///C:/Users/moon/.claude/skills/output-first-onboarding/SKILL.md) 와
세션 작업물에 정리됨.

---

*문서 생성: 2026-05-12 / 마지막 검증 기준 코드: 17,199 줄 / api/routes.py 1338 줄*
