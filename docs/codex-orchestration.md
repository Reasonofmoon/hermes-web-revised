# Codex Orchestration

This project can be driven by Codex as a supervising orchestrator while Hermes
Web and Grok Build CLI act as delegated execution agents.

## Roles

- Codex: plans, delegates, verifies, and decides next steps.
- Hermes Web: creates profile-aware sessions, stores history, and exposes cron.
- Grok Build CLI: executes delegated work through the `grok-build` model.

## Profiles

- `codex-orchestrator`: generic execution delegate for Codex-controlled tasks.
- `edtech-developer`: integrated edtech builder.
- `edtech-product-designer`: learner, teacher, and admin UX.
- `curriculum-architect`: course, objective, assessment, and rubric design.
- `teacher-tools-builder`: teacher operations, grading, feedback, and classroom workflows.

## Local Wrapper

Use `scripts/hermes_orchestrator.py` from the repository root.
By default, delegated runs inject the local LLM Wiki pages
`overview`, `orchestration`, `profiles`, and `guardrails`.

List profiles:

```powershell
python scripts\hermes_orchestrator.py profiles
```

Run a delegated task:

```powershell
python scripts\hermes_orchestrator.py run `
  --profile orchestrator `
  --mode build `
  --expected-outputs "Changed files and verification summary." `
  "Implement the requested scoped change."
```

Create a cron job:

```powershell
python scripts\hermes_orchestrator.py cron `
  --profile integrated `
  --name "Weekly edtech review" `
  --schedule "0 9 * * 1" `
  "Review recent workspace changes and summarize risks."
```

Show recent delegated task records:

```powershell
python scripts\hermes_orchestrator.py status
```

Task records are stored under:

```text
~/.hermes/webui/orchestrator/tasks/
```

## LLM Wiki

The WebUI exposes an `LLM Wiki` panel and the same content is stored as
Markdown files under:

```text
~/.hermes/webui/llm_wiki/
```

Use it as the operating handbook for Codex-controlled Hermes/Grok work. The
orchestrator wrapper injects the default pages automatically. To override the
page set:

```powershell
python scripts\hermes_orchestrator.py run `
  --wiki-page overview `
  --wiki-page cron `
  "Plan a recurring report workflow."
```

Use `--no-wiki` when a task needs a minimal prompt.

## Guardrails

Delegated agents must not perform destructive filesystem operations, public
publishing, credential handling, paid actions, or sensitive data transmission
without explicit user approval. Codex remains the final verifier.
