"""
Grok Imagine API helpers for Hermes Web.

Uses Hermes Agent's xai-oauth runtime provider, so no XAI_API_KEY is required.
Generated media is persisted under the active session workspace.
"""
import base64
import json
import time
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from api.config import get_config
from api.helpers import safe_resolve
from api.models import get_session, title_from

DEFAULT_BASE_URL = 'https://api.x.ai/v1'
OUTPUT_DIR_NAME = 'Hermes-Imagine'


def _json_request(method, url, payload, token, timeout=120):
    data = None if payload is None else json.dumps(payload).encode('utf-8')
    req = Request(
        url,
        data=data,
        method=method,
        headers={
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json',
            'User-Agent': 'hermes-web/grok-imagine',
        },
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode('utf-8', errors='replace')
            return json.loads(raw or '{}')
    except HTTPError as exc:
        detail = exc.read().decode('utf-8', errors='replace')[:1200]
        raise RuntimeError(f'xAI API failed ({exc.code}): {detail}') from exc
    except URLError as exc:
        raise RuntimeError(f'xAI API connection failed: {exc.reason}') from exc


def _download(url, token=None, timeout=120):
    headers = {'User-Agent': 'hermes-web/grok-imagine'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = Request(url, headers=headers)
    with urlopen(req, timeout=timeout) as resp:
        content_type = resp.headers.get('Content-Type', 'application/octet-stream')
        return resp.read(), content_type


def _resolve_xai_credentials():
    try:
        from hermes_cli.runtime_provider import resolve_runtime_provider

        creds = resolve_runtime_provider(requested='xai-oauth') or {}
    except Exception as exc:
        raise RuntimeError(f'Could not resolve xai-oauth credentials: {exc}') from exc

    token = str(creds.get('api_key') or '').strip()
    if not token:
        raise RuntimeError('xai-oauth is not logged in. Run `hermes auth add xai-oauth` first.')
    base_url = str(creds.get('base_url') or DEFAULT_BASE_URL).strip().rstrip('/')
    return token, base_url


def _imagine_config():
    cfg = get_config()
    section = cfg.get('imagine') if isinstance(cfg, dict) else None
    return section if isinstance(section, dict) else {}


def _output_dir(source, cfg):
    value = str(source.get('output_dir') or cfg.get('output_dir') or OUTPUT_DIR_NAME).strip()
    if value == 'Hermes Imagine':
        return OUTPUT_DIR_NAME
    return value or OUTPUT_DIR_NAME


def _workspace_output(session, rel_dir):
    root = Path(session.workspace).expanduser().resolve()
    out_dir = safe_resolve(root, rel_dir or OUTPUT_DIR_NAME)
    out_dir.mkdir(parents=True, exist_ok=True)
    return root, out_dir


def _direct_output(workspace, rel_dir):
    root = Path(workspace or '.').expanduser().resolve()
    out_dir = safe_resolve(root, rel_dir or OUTPUT_DIR_NAME)
    out_dir.mkdir(parents=True, exist_ok=True)
    return root, out_dir


def _extension_from_content_type(content_type, fallback):
    ct = (content_type or '').split(';', 1)[0].lower()
    if ct == 'image/png':
        return '.png'
    if ct in ('image/jpeg', 'image/jpg'):
        return '.jpg'
    if ct == 'image/webp':
        return '.webp'
    if ct == 'video/mp4':
        return '.mp4'
    return fallback


def _raw_url(session_id, rel_path):
    return f'/api/file/raw?session_id={quote(session_id)}&path={quote(rel_path.as_posix())}'


def _rel_path(root, target):
    return target.resolve().relative_to(root).as_posix()


def _append_messages(session, prompt, assistant_text, tool_name, tool_payload):
    now = int(time.time())
    session.messages.append({'role': 'user', 'content': prompt, 'timestamp': now})
    session.messages.append({
        'role': 'tool',
        'name': tool_name,
        'content': json.dumps(tool_payload, ensure_ascii=False),
        'tool_call_id': f'imagine-{uuid.uuid4().hex[:10]}',
        'timestamp': now,
    })
    session.messages.append({'role': 'assistant', 'content': assistant_text, 'timestamp': now})
    session.title = title_from(session.messages, session.title)
    session.save()


def _image_payload(source, cfg):
    default_image = cfg.get('default_image') if isinstance(cfg.get('default_image'), dict) else {}
    return {
        'model': str(source.get('model') or cfg.get('image_model') or 'grok-imagine-image-quality'),
        'prompt': str(source.get('prompt') or '').strip(),
        'aspect_ratio': str(source.get('aspect_ratio') or default_image.get('aspect_ratio') or '1:1'),
        'resolution': str(source.get('resolution') or default_image.get('resolution') or '1k'),
        'n': int(source.get('count') or source.get('n') or default_image.get('count') or 1),
        'response_format': str(source.get('response_format') or 'b64_json'),
    }


def _save_image_result(data, out_dir, token):
    first = data[0] or {}
    stem = f'image-{time.strftime("%Y%m%d-%H%M%S")}-{uuid.uuid4().hex[:8]}'
    raw_url = first.get('url')
    if first.get('b64_json'):
        blob = base64.b64decode(first['b64_json'])
        target = out_dir / f'{stem}.png'
    elif raw_url:
        blob, content_type = _download(raw_url, token=None, timeout=180)
        ext = _extension_from_content_type(content_type, Path(raw_url.split('?', 1)[0]).suffix or '.jpg')
        target = out_dir / f'{stem}{ext}'
    else:
        raise RuntimeError('xAI response contained neither b64_json nor url')

    target.write_bytes(blob)
    return target, raw_url


def generate_image(body, workspace=None, **options):
    if not isinstance(body, dict):
        direct_body = {'prompt': str(body or '').strip(), **options}
        return _generate_image_direct(direct_body, workspace)

    session_id = str(body.get('session_id') or '').strip()
    if not session_id:
        raise ValueError('session_id is required')
    session = get_session(session_id)

    cfg = _imagine_config()
    prompt = str(body.get('prompt') or '').strip()
    if not prompt:
        raise ValueError('prompt is required')

    token, base_url = _resolve_xai_credentials()
    output_dir = _output_dir(body, cfg)
    payload = _image_payload(body, cfg)
    model = payload['model']

    result = _json_request('POST', f'{base_url}/images/generations', payload, token, timeout=180)
    data = result.get('data') or []
    if not data:
        raise RuntimeError('xAI returned no image data')

    root, out_dir = _workspace_output(session, output_dir)
    target, raw_url = _save_image_result(data, out_dir, token)
    rel = _rel_path(root, target)
    web_url = _raw_url(session_id, Path(rel))
    response = {
        'ok': True,
        'kind': 'image',
        'model': model,
        'prompt': prompt,
        'path': rel,
        'raw_url': web_url,
        'source_url': raw_url,
        'images': [{
            'path': str(target.resolve()),
            'relative_path': rel,
            'raw_url': web_url,
            'source_url': raw_url,
        }],
        'payload': payload,
    }
    _append_messages(session, prompt, f'![Generated image]({web_url})', 'imagine_image', response)
    return response


def _generate_image_direct(body, workspace):
    cfg = _imagine_config()
    prompt = str(body.get('prompt') or '').strip()
    if not prompt:
        raise ValueError('prompt is required')

    token, base_url = _resolve_xai_credentials()
    output_dir = _output_dir(body, cfg)
    payload = _image_payload(body, cfg)
    result = _json_request('POST', f'{base_url}/images/generations', payload, token, timeout=180)
    data = result.get('data') or []
    if not data:
        raise RuntimeError('xAI returned no image data')

    root, out_dir = _direct_output(workspace, output_dir)
    target, raw_url = _save_image_result(data, out_dir, token)
    rel = _rel_path(root, target)
    return {
        'ok': True,
        'kind': 'image',
        'model': payload['model'],
        'prompt': prompt,
        'path': str(target.resolve()),
        'relative_path': rel,
        'source_url': raw_url,
        'images': [{
            'path': str(target.resolve()),
            'relative_path': rel,
            'source_url': raw_url,
        }],
        'payload': payload,
    }


def _video_payload(source, cfg):
    default_video = cfg.get('default_video') if isinstance(cfg.get('default_video'), dict) else {}
    return {
        'model': str(source.get('model') or cfg.get('video_model') or 'grok-imagine-video'),
        'prompt': str(source.get('prompt') or '').strip(),
        'duration': int(source.get('duration') or default_video.get('duration') or 5),
        'aspect_ratio': str(source.get('aspect_ratio') or default_video.get('aspect_ratio') or '16:9'),
        'resolution': str(source.get('resolution') or default_video.get('resolution') or '720p'),
    }


def generate_video(body, workspace=None, **options):
    if not isinstance(body, dict):
        direct_body = {'prompt': str(body or '').strip(), **options}
        return _generate_video_direct(direct_body, workspace)

    session_id = str(body.get('session_id') or '').strip()
    if not session_id:
        raise ValueError('session_id is required')
    session = get_session(session_id)

    cfg = _imagine_config()
    prompt = str(body.get('prompt') or '').strip()
    if not prompt:
        raise ValueError('prompt is required')

    token, base_url = _resolve_xai_credentials()
    output_dir = _output_dir(body, cfg)
    payload = _video_payload(body, cfg)
    model = payload['model']
    request_id, video_url = _generate_video_url(payload, token, base_url, int(body.get('timeout_seconds') or 360))
    root, out_dir = _workspace_output(session, output_dir)
    blob, content_type = _download(video_url, token=None, timeout=180)
    ext = _extension_from_content_type(content_type, '.mp4')
    target = out_dir / f'video-{time.strftime("%Y%m%d-%H%M%S")}-{uuid.uuid4().hex[:8]}{ext}'
    target.write_bytes(blob)
    rel = _rel_path(root, target)
    web_url = _raw_url(session_id, Path(rel))
    response = {
        'ok': True,
        'kind': 'video',
        'model': model,
        'prompt': prompt,
        'path': rel,
        'raw_url': web_url,
        'source_url': video_url,
        'request_id': request_id,
        'videos': [{
            'path': str(target.resolve()),
            'relative_path': rel,
            'raw_url': web_url,
            'source_url': video_url,
        }],
        'payload': payload,
    }
    _append_messages(session, prompt, web_url, 'imagine_video', response)
    return response


def _generate_video_url(payload, token, base_url, timeout):
    submit = _json_request('POST', f'{base_url}/videos/generations', payload, token, timeout=90)
    request_id = submit.get('request_id')
    if not request_id:
        raise RuntimeError('xAI video response did not include request_id')

    deadline = time.time() + timeout
    poll = {}
    while time.time() < deadline:
        poll = _json_request('GET', f'{base_url}/videos/{request_id}', None, token, timeout=60)
        status = str(poll.get('status') or '').lower()
        if status == 'done':
            break
        if status in {'failed', 'error', 'expired', 'cancelled'}:
            raise RuntimeError(f'xAI video generation ended with status {status}: {poll}')
        time.sleep(5)
    else:
        raise RuntimeError(f'Timed out waiting for video generation after {timeout}s')

    video_url = ((poll.get('video') or {}).get('url') or poll.get('url') or '').strip()
    if not video_url:
        raise RuntimeError('xAI video generation completed without a video URL')
    return request_id, video_url


def _generate_video_direct(body, workspace):
    cfg = _imagine_config()
    prompt = str(body.get('prompt') or '').strip()
    if not prompt:
        raise ValueError('prompt is required')

    token, base_url = _resolve_xai_credentials()
    output_dir = _output_dir(body, cfg)
    payload = _video_payload(body, cfg)
    request_id, video_url = _generate_video_url(payload, token, base_url, int(body.get('timeout_seconds') or 360))
    root, out_dir = _direct_output(workspace, output_dir)
    blob, content_type = _download(video_url, token=None, timeout=180)
    ext = _extension_from_content_type(content_type, '.mp4')
    target = out_dir / f'video-{time.strftime("%Y%m%d-%H%M%S")}-{uuid.uuid4().hex[:8]}{ext}'
    target.write_bytes(blob)
    rel = _rel_path(root, target)
    return {
        'ok': True,
        'kind': 'video',
        'model': payload['model'],
        'prompt': prompt,
        'path': str(target.resolve()),
        'relative_path': rel,
        'source_url': video_url,
        'request_id': request_id,
        'videos': [{
            'path': str(target.resolve()),
            'relative_path': rel,
            'source_url': video_url,
        }],
        'payload': payload,
    }
