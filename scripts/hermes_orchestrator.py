#!/usr/bin/env python3
"""
Codex -> Hermes Web orchestrator.

Small CLI wrapper around the local Hermes Web API so Codex can delegate work to
Hermes/Grok Build sessions, collect results, and create cron jobs.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

DEFAULT_BASE_URL = "http://127.0.0.1:8787"
DEFAULT_WORKSPACE = Path(__file__).resolve().parents[1]
TASKS_DIR = Path.home() / ".hermes" / "webui" / "orchestrator" / "tasks"
LLM_WIKI_DIR = Path.home() / ".hermes" / "webui" / "llm_wiki"
DEFAULT_WIKI_PAGES = ("overview", "orchestration", "profiles", "guardrails")


PROFILE_PRESETS = {
    "orchestrator": "codex-orchestrator",
    "integrated": "edtech-developer",
    "developer": "edtech-developer",
    "designer": "edtech-product-designer",
    "curriculum": "curriculum-architect",
    "teacher": "teacher-tools-builder",
}


DELEGATION_CONTRACT = """You are a Hermes/Grok Build sub-agent delegated by Codex.

Follow this contract:
1. Restate the goal briefly.
2. Name the files or artifacts you plan to create or change.
3. Work in the active workspace and keep changes scoped.
4. If assumptions are needed, state them and proceed.
5. Finish with changed files, verification steps, and remaining risks.
6. Do not perform destructive, public publishing, credential, payment, or bulk-delete actions without explicit user approval.
"""


def api(method: str, path: str, payload: dict | None = None, *,
        base_url: str = DEFAULT_BASE_URL, timeout: int = 30) -> dict:
    url = urllib.parse.urljoin(base_url.rstrip("/") + "/", path.lstrip("/"))
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            raw = res.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(raw)
        except Exception:
            detail = {"error": raw or str(e)}
        raise RuntimeError(f"{method} {path} failed ({e.code}): {detail.get('error') or detail}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Cannot reach Hermes Web at {base_url}: {e.reason}") from e


def sse_events(stream_id: str, *, base_url: str, timeout: int):
    query = urllib.parse.urlencode({"stream_id": stream_id})
    url = f"{base_url.rstrip('/')}/api/chat/stream?{query}"
    req = urllib.request.Request(url, headers={"Accept": "text/event-stream"})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        event = None
        data_lines: list[str] = []
        for raw in res:
            line = raw.decode("utf-8", errors="replace").rstrip("\n")
            if not line:
                if event and data_lines:
                    payload = "\n".join(data_lines)
                    try:
                        data = json.loads(payload)
                    except Exception:
                        data = {"raw": payload}
                    yield event, data
                event = None
                data_lines = []
                continue
            if line.startswith(":"):
                continue
            if line.startswith("event:"):
                event = line.split(":", 1)[1].strip()
            elif line.startswith("data:"):
                data_lines.append(line.split(":", 1)[1].strip())


def profile_id(profile: str) -> str:
    return PROFILE_PRESETS.get(profile, profile)


def switch_profile(profile: str, *, base_url: str) -> dict:
    return api("POST", "/api/profile/switch", {"name": profile_id(profile)}, base_url=base_url)


def create_session(*, profile: str | None, workspace: str, model: str,
                   base_url: str) -> dict:
    if profile:
        switch_profile(profile, base_url=base_url)
    return api("POST", "/api/session/new", {
        "workspace": workspace,
        "model": model,
    }, base_url=base_url)["session"]


def read_llm_wiki_context(pages: list[str] | tuple[str, ...] | None) -> str:
    if not pages:
        return ""
    chunks: list[str] = []
    for slug in pages:
        safe_slug = "".join(ch for ch in slug.strip().lower() if ch.isalnum() or ch in ("-", "_"))
        if not safe_slug:
            continue
        path = LLM_WIKI_DIR / f"{safe_slug}.md"
        if not path.exists():
            continue
        content = path.read_text(encoding="utf-8").strip()
        if content:
            chunks.append(f"## {safe_slug}\n{content}")
    return "\n\n".join(chunks)


def build_prompt(task: str, *, mode: str, expected_outputs: str | None,
                 wiki_context: str = "") -> str:
    parts = [DELEGATION_CONTRACT]
    if wiki_context:
        parts.extend([
            "",
            "LLM Wiki context for this delegated run:",
            wiki_context.strip(),
        ])
    parts.extend([f"Mode: {mode}", "", "Task:", task.strip()])
    if expected_outputs:
        parts.extend(["", "Expected outputs:", expected_outputs.strip()])
    return "\n".join(parts).strip()


def persist_task(record: dict) -> Path:
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    task_id = record["task_id"]
    path = TASKS_DIR / f"{task_id}.json"
    path.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def run_task(args) -> int:
    workspace = str(Path(args.workspace).expanduser().resolve()) if args.workspace else str(DEFAULT_WORKSPACE)
    profile = profile_id(args.profile)
    original_profile = None
    if not args.keep_profile:
        try:
            original_profile = api("GET", "/api/profile/active", base_url=args.base_url).get("name")
        except Exception:
            original_profile = None
    try:
        session = create_session(
            profile=profile,
            workspace=workspace,
            model=args.model,
            base_url=args.base_url,
        )
        wiki_context = "" if args.no_wiki else read_llm_wiki_context(args.wiki_page or DEFAULT_WIKI_PAGES)
        prompt = build_prompt(
            args.task,
            mode=args.mode,
            expected_outputs=args.expected_outputs,
            wiki_context=wiki_context,
        )
        started = api("POST", "/api/chat/start", {
            "session_id": session["session_id"],
            "message": prompt,
            "model": args.model,
            "workspace": workspace,
        }, base_url=args.base_url)

        assistant_chunks: list[str] = []
        final_session = None
        status = "running"
        usage = {}
        print(json.dumps({
            "event": "started",
            "profile": profile,
            "session_id": started["session_id"],
            "stream_id": started["stream_id"],
            "workspace": workspace,
        }, ensure_ascii=False), flush=True)

        for event, data in sse_events(started["stream_id"], base_url=args.base_url, timeout=args.timeout):
            if event == "token":
                text = data.get("text", "")
                assistant_chunks.append(text)
                if args.stream:
                    print(text, end="", flush=True)
            elif event == "tool":
                print(json.dumps({"event": "tool", **data}, ensure_ascii=False), flush=True)
            elif event in ("apperror", "error"):
                status = "error"
                print(json.dumps({"event": event, **data}, ensure_ascii=False), flush=True)
                break
            elif event == "cancel":
                status = "cancelled"
                break
            elif event == "done":
                status = "done"
                final_session = data.get("session")
                usage = data.get("usage") or {}
                break

        if args.stream:
            print()
        task_id = f"{int(time.time())}-{session['session_id']}"
        record = {
            "task_id": task_id,
            "status": status,
            "profile": profile,
            "model": args.model,
            "workspace": workspace,
            "session_id": session["session_id"],
            "stream_id": started["stream_id"],
            "mode": args.mode,
            "task": args.task,
            "expected_outputs": args.expected_outputs,
            "wiki_pages": [] if args.no_wiki else list(args.wiki_page or DEFAULT_WIKI_PAGES),
            "assistant_text": "".join(assistant_chunks).strip(),
            "usage": usage,
            "created_at": time.time(),
        }
        if final_session:
            record["session"] = final_session
        record_path = persist_task(record)
        print(json.dumps({
            "event": "finished",
            "status": status,
            "task_id": task_id,
            "session_id": session["session_id"],
            "record_path": str(record_path),
        }, ensure_ascii=False, indent=2), flush=True)
        return 0 if status == "done" else 1
    finally:
        if original_profile and original_profile != profile:
            try:
                switch_profile(original_profile, base_url=args.base_url)
            except Exception as exc:
                print(f"warning: failed to restore profile {original_profile}: {exc}", file=sys.stderr)


def create_cron(args) -> int:
    profile = profile_id(args.profile)
    wiki_context = "" if args.no_wiki else read_llm_wiki_context(args.wiki_page or DEFAULT_WIKI_PAGES)
    prompt = build_prompt(
        args.prompt,
        mode="cron",
        expected_outputs=args.expected_outputs,
        wiki_context=wiki_context,
    )
    prompt = f"Profile context: {profile}\nWorkspace: {args.workspace or DEFAULT_WORKSPACE}\n\n{prompt}"
    result = api("POST", "/api/crons/create", {
        "name": args.name,
        "prompt": prompt,
        "schedule": args.schedule,
        "model": args.model,
        "skills": args.skills or [],
    }, base_url=args.base_url)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def show_status(args) -> int:
    if args.task_id:
        path = TASKS_DIR / f"{args.task_id}.json"
        if not path.exists():
            raise RuntimeError(f"Task record not found: {path}")
        print(path.read_text(encoding="utf-8"))
        return 0
    tasks = []
    if TASKS_DIR.exists():
        for path in sorted(TASKS_DIR.glob("*.json"), reverse=True)[: args.limit]:
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                tasks.append({
                    "task_id": data.get("task_id"),
                    "status": data.get("status"),
                    "profile": data.get("profile"),
                    "session_id": data.get("session_id"),
                    "task": (data.get("task") or "")[:100],
                    "record_path": str(path),
                })
            except Exception:
                pass
    print(json.dumps({"tasks": tasks}, ensure_ascii=False, indent=2))
    return 0


def list_profiles(args) -> int:
    print(json.dumps(api("GET", "/api/profiles", base_url=args.base_url), ensure_ascii=False, indent=2))
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Codex orchestration wrapper for Hermes Web")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="Run a delegated Hermes/Grok task")
    run.add_argument("--profile", default="integrated")
    run.add_argument("--model", default="grok-build")
    run.add_argument("--workspace", default=str(DEFAULT_WORKSPACE))
    run.add_argument("--mode", default="build", choices=["build", "design", "research", "data", "review", "cron"])
    run.add_argument("--expected-outputs")
    run.add_argument("--timeout", type=int, default=1800)
    run.add_argument("--stream", action="store_true")
    run.add_argument("--keep-profile", action="store_true", help="Leave Hermes Web on the delegated profile after the run")
    run.add_argument("--no-wiki", action="store_true", help="Do not inject local LLM Wiki context")
    run.add_argument("--wiki-page", action="append", help="Wiki page slug to inject; can be repeated")
    run.add_argument("task")
    run.set_defaults(func=run_task)

    cron = sub.add_parser("cron", help="Create a Hermes cron job")
    cron.add_argument("--profile", default="integrated")
    cron.add_argument("--model", default="grok-build")
    cron.add_argument("--workspace", default=str(DEFAULT_WORKSPACE))
    cron.add_argument("--name", required=True)
    cron.add_argument("--schedule", required=True, help='Cron expression or supported natural schedule, e.g. "0 9 * * *"')
    cron.add_argument("--expected-outputs")
    cron.add_argument("--skills", nargs="*", default=[])
    cron.add_argument("--no-wiki", action="store_true", help="Do not inject local LLM Wiki context")
    cron.add_argument("--wiki-page", action="append", help="Wiki page slug to inject; can be repeated")
    cron.add_argument("prompt")
    cron.set_defaults(func=create_cron)

    status = sub.add_parser("status", help="Show orchestrator task records")
    status.add_argument("--task-id")
    status.add_argument("--limit", type=int, default=10)
    status.set_defaults(func=show_status)

    profiles = sub.add_parser("profiles", help="List Hermes profiles")
    profiles.set_defaults(func=list_profiles)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise SystemExit(130)
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
