import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

from api import imagine
from api.imagine import OUTPUT_DIR_NAME, _extension_from_content_type, _raw_url


def test_content_type_to_extension():
    assert _extension_from_content_type("image/png", ".jpg") == ".png"
    assert _extension_from_content_type("video/mp4", ".bin") == ".mp4"
    assert _extension_from_content_type("application/octet-stream", ".webp") == ".webp"


def test_raw_url_uses_file_raw_endpoint():
    url = _raw_url("abc123", pathlib.Path("Hermes-Imagine/image 1.png"))

    assert url.startswith("/api/file/raw?session_id=abc123")
    assert "Hermes-Imagine/image%201.png" in url


def test_direct_image_helper_writes_discord_attachable_path(tmp_path, monkeypatch):
    monkeypatch.setattr(imagine, "_resolve_xai_credentials", lambda: ("token", "https://api.x.ai/v1"))
    monkeypatch.setattr(
        imagine,
        "_json_request",
        lambda method, url, payload, token, timeout=120: {
            "data": [{"b64_json": "iVBORw0KGgo="}]
        },
    )

    result = imagine.generate_image("tiny test icon", tmp_path)
    path = pathlib.Path(result["images"][0]["path"])

    assert path.exists()
    assert path.parent.name == OUTPUT_DIR_NAME
    assert " " not in path.parent.name
    assert result["payload"]["model"] == "grok-imagine-image-quality"
