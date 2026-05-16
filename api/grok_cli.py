"""
Grok Build CLI adapter for Hermes Web UI.

Runs the user's WSL-installed `grok` in headless mode and streams JSON text
events back into the WebUI's existing SSE pipeline.
"""
import json
import os
import re
import shlex
import subprocess
import tempfile
import time
from pathlib import Path

from api.models import title_from


GROK_MODEL_IDS = {'grok-build', 'grok/grok-build'}


def is_grok_model(model: str) -> bool:
    return (model or '').strip() in GROK_MODEL_IDS


def _wsl_path(path: Path) -> str:
    """Convert a Windows path to the WSL mount path understood by Ubuntu."""
    raw = str(path.expanduser().resolve())
    m = re.match(r'^([A-Za-z]):\\(.*)$', raw)
    if m:
        drive = m.group(1).lower()
        rest = m.group(2).replace('\\', '/')
        return f'/mnt/{drive}/{rest}'
    try:
        cp = subprocess.run(
            ['wsl.exe', '-d', _wsl_distro(), '--', 'wslpath', '-a', raw],
            text=True,
            encoding='utf-8',
            errors='replace',
            capture_output=True,
            timeout=10,
        )
        if cp.returncode == 0 and cp.stdout.strip():
            return cp.stdout.strip()
    except Exception:
        pass
    return raw.replace('\\', '/')


def _wsl_distro() -> str:
    return os.getenv('HERMES_GROK_WSL_DISTRO', 'Ubuntu')


def _grok_command() -> str:
    return os.getenv('HERMES_GROK_CLI', 'grok')


def _conversation_prompt(messages, msg_text: str, workspace: str) -> str:
    lines = [
        'You are being called from Hermes Web UI through Grok Build CLI.',
        f'Active workspace: {workspace}',
        'Use the active workspace for file operations and answer the newest user message.',
        '',
        'Conversation so far:',
    ]
    for m in (messages or [])[-30:]:
        role = m.get('role')
        if role not in ('user', 'assistant', 'system'):
            continue
        content = m.get('content', '')
        if isinstance(content, list):
            content = '\n'.join(
                str(p.get('text', '')) for p in content
                if isinstance(p, dict) and p.get('type') == 'text'
            )
        content = str(content).strip()
        if content:
            lines.append(f'{role.upper()}: {content}')
    lines.extend(['', f'USER: {msg_text}', '', 'ASSISTANT:'])
    return '\n'.join(lines)


def run_grok_cli_stream(session, msg_text: str, model: str, workspace: str,
                        put, cancel_event=None, attachments=None) -> dict:
    """Run `grok` once and return updated session payload fields."""
    workspace_path = Path(workspace).expanduser().resolve()
    prompt = _conversation_prompt(session.messages, msg_text, str(workspace_path))
    assistant_text = []
    prompt_file = None
    proc = None
    try:
        with tempfile.NamedTemporaryFile('w', encoding='utf-8', suffix='.txt', delete=False) as f:
            f.write(prompt)
            prompt_file = Path(f.name)

        wsl_cwd = _wsl_path(workspace_path)
        wsl_prompt = _wsl_path(prompt_file)
        cli = _grok_command()
        shell_cmd = (
            f'cd {shlex.quote(wsl_cwd)} && '
            f'{shlex.quote(cli)} --prompt-file {shlex.quote(wsl_prompt)} '
            f'--model grok-build --output-format streaming-json --no-alt-screen'
        )
        proc = subprocess.Popen(
            ['wsl.exe', '-d', _wsl_distro(), '--', 'bash', '-lc', shell_cmd],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding='utf-8',
            errors='replace',
            bufsize=1,
        )
        for line in proc.stdout or []:
            if cancel_event is not None and cancel_event.is_set():
                proc.terminate()
                return {'cancelled': True}
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                put('tool', {'name': 'grok-build', 'preview': line[:180], 'args': {}})
                continue
            typ = event.get('type')
            data = event.get('data', '')
            if typ == 'text' and data:
                assistant_text.append(str(data))
                put('token', {'text': str(data)})
            elif typ in ('tool', 'tool_use'):
                put('tool', {'name': event.get('name') or 'grok-build', 'preview': str(data)[:180], 'args': {}})
            elif typ == 'error':
                raise RuntimeError(str(data or event))

        rc = proc.wait(timeout=5)
        if rc != 0:
            raise RuntimeError(f'grok exited with code {rc}')

        now = int(time.time())
        final_text = ''.join(assistant_text).strip()
        user_msg = {'role': 'user', 'content': msg_text, 'timestamp': now}
        if attachments:
            user_msg['attachments'] = attachments
        session.messages.append(user_msg)
        session.messages.append({'role': 'assistant', 'content': final_text, 'timestamp': now})
        session.title = title_from(session.messages, session.title)
        session.save()
        return {
            'messages': session.messages,
            'final_response': final_text,
            'usage': {'input_tokens': 0, 'output_tokens': 0, 'estimated_cost': None},
            'tool_calls': [],
        }
    finally:
        if proc and proc.poll() is None:
            proc.terminate()
        if prompt_file:
            try:
                prompt_file.unlink(missing_ok=True)
            except Exception:
                pass
