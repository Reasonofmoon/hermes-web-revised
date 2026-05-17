"""Grok Imagine adapter for Hermes Web UI.

The user's xAI OAuth login lives in WSL with Hermes Agent.  This adapter keeps
that boundary intact: WebUI sends a generation request to the WSL-side Hermes
Agent plugin and receives only the generated media reference back.
"""
from __future__ import annotations

import json
import os
import subprocess
import textwrap
import time
from pathlib import Path

from api.models import title_from


IMAGE_MODEL_IDS = {"grok-imagine-image", "grok-imagine-image-quality"}
VIDEO_MODEL_IDS = {"grok-imagine-video"}
IMAGINE_MODEL_IDS = IMAGE_MODEL_IDS | VIDEO_MODEL_IDS


def is_grok_imagine_model(model: str) -> bool:
    return (model or "").strip() in IMAGINE_MODEL_IDS


def _wsl_distro() -> str:
    return os.getenv("HERMES_GROK_WSL_DISTRO", "Ubuntu")


_RUNNER = r"""
import json
import os
import sys

payload = json.load(sys.stdin)
kind = payload.get("kind")
model = payload.get("model")
prompt = (payload.get("prompt") or "").strip()

os.environ.setdefault("HERMES_HOME", os.path.expanduser("~/.hermes"))
sys.path.insert(0, os.path.expanduser("~/.hermes/hermes-agent"))

if kind == "image":
    if model:
        os.environ["XAI_IMAGE_MODEL"] = model
    from plugins.image_gen.xai import XAIImageGenProvider
    provider = XAIImageGenProvider()
    result = provider.generate(
        prompt,
        aspect_ratio=payload.get("aspect_ratio") or "landscape",
    )
elif kind == "video":
    from plugins.video_gen.xai import XAIVideoGenProvider
    provider = XAIVideoGenProvider()
    result = provider.generate(
        prompt,
        model=model or "grok-imagine-video",
        duration=int(payload.get("duration") or 8),
        aspect_ratio=payload.get("aspect_ratio") or "16:9",
        resolution=payload.get("resolution") or "720p",
        image_url=payload.get("image_url") or None,
    )
else:
    result = {
        "success": False,
        "error": f"Unknown Grok Imagine kind: {kind}",
        "error_type": "bad_request",
    }

print(json.dumps(result, ensure_ascii=False))
"""


def _run_wsl_imagine(payload: dict, *, timeout: int) -> dict:
    shell = (
        "cat > /tmp/hermes_web_grok_imagine.py <<'PY'\n"
        + _RUNNER
        + "\nPY\n"
        + "cd ~/.hermes/hermes-agent && .venv/bin/python /tmp/hermes_web_grok_imagine.py"
    )
    cp = subprocess.run(
        ["wsl.exe", "-d", _wsl_distro(), "--", "bash", "-lc", shell],
        input=json.dumps(payload, ensure_ascii=False),
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        timeout=timeout,
    )
    if cp.returncode != 0:
        detail = (cp.stderr or cp.stdout or "").strip()
        raise RuntimeError(detail or f"WSL Grok Imagine runner exited with code {cp.returncode}")
    raw = (cp.stdout or "").strip().splitlines()
    if not raw:
        raise RuntimeError("WSL Grok Imagine runner returned no output")
    try:
        return json.loads(raw[-1])
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid Grok Imagine JSON: {raw[-1][:500]}") from exc


def _kind_for_model(model: str) -> str:
    if model in VIDEO_MODEL_IDS:
        return "video"
    return "image"


def _markdown_for_result(result: dict, *, model: str, elapsed: float) -> str:
    if not result.get("success"):
        error = result.get("error") or "Unknown Grok Imagine error"
        return f"**Grok Imagine failed**\n\nModel: `{model}`\n\nError: {error}"

    prompt = result.get("prompt") or ""
    provider = result.get("provider") or "xai"
    if result.get("image"):
        image = str(result["image"])
        media = f"![Grok Imagine image]({image})" if image.startswith("http") else f"`{image}`"
        return textwrap.dedent(f"""\
        **Grok Imagine image generated**

        Model: `{result.get("model") or model}`
        Provider: `{provider}`
        Elapsed: `{elapsed:.1f}s`

        {media}

        Prompt:
        > {prompt}
        """).strip()
    if result.get("video"):
        video = str(result["video"])
        return textwrap.dedent(f"""\
        **Grok Imagine video generated**

        Model: `{result.get("model") or model}`
        Provider: `{provider}`
        Elapsed: `{elapsed:.1f}s`
        Duration: `{result.get("duration") or ""}s`

        !video[Grok Imagine video]({video})

        [Open generated video]({video})

        Prompt:
        > {prompt}
        """).strip()
    return f"**Grok Imagine completed, but no media URL was returned.**\n\n`{json.dumps(result, ensure_ascii=False)}`"


def run_grok_imagine(session, msg_text: str, model: str, workspace: str, put, attachments=None) -> dict:
    """Generate an image/video and persist it as a normal assistant message."""
    started = time.time()
    kind = _kind_for_model(model)
    prompt = (msg_text or "").strip()
    if not prompt:
        raise RuntimeError("Prompt is required for Grok Imagine generation")

    put("tool", {"name": "grok-imagine", "preview": f"Generating {kind} with {model}", "args": {}})
    payload = {
        "kind": kind,
        "model": model,
        "prompt": prompt,
    }
    if kind == "video":
        payload.update({"duration": 8, "aspect_ratio": "16:9", "resolution": "720p"})
    else:
        payload.update({"aspect_ratio": "landscape"})

    result = _run_wsl_imagine(payload, timeout=360 if kind == "video" else 150)
    final_text = _markdown_for_result(result, model=model, elapsed=time.time() - started)

    now = int(time.time())
    user_msg = {"role": "user", "content": msg_text, "timestamp": now}
    if attachments:
        user_msg["attachments"] = attachments
    session.messages.append(user_msg)
    session.messages.append({"role": "assistant", "content": final_text, "timestamp": now})
    session.title = title_from(session.messages, session.title)
    session.save()
    put("token", {"text": final_text})
    return {
        "messages": session.messages,
        "final_response": final_text,
        "usage": {"input_tokens": 0, "output_tokens": 0, "estimated_cost": None},
        "tool_calls": [],
        "imagine": {k: v for k, v in result.items() if k not in {"error"}},
    }
