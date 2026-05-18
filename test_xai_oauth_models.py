import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

from api.config import _PROVIDER_DISPLAY, _PROVIDER_MODELS, resolve_model_provider


def test_xai_oauth_provider_is_listed():
    assert _PROVIDER_DISPLAY["xai-oauth"] == "xAI Grok OAuth"
    assert {"id": "grok-4.3", "label": "Grok 4.3"} in _PROVIDER_MODELS["xai-oauth"]


def test_grok_chat_model_routes_to_xai_oauth():
    model, provider, base_url = resolve_model_provider("grok-4.3")

    assert model == "grok-4.3"
    assert provider == "xai-oauth"
    assert base_url == "https://api.x.ai/v1"
