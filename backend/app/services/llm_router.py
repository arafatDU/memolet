import os
import logging
from typing import List, Dict, Any, Optional
from litellm import completion
from app.core.config import settings
from app.services.ollama_service import ollama_service

logger = logging.getLogger(__name__)

# Model dictionary grouped by provider (Free-tier safeguarded)
MODEL_PROVIDERS: Dict[str, Dict[str, Any]] = {
    "vercel_openai": {
        "name": "Vercel AI Gateway (OpenAI)",
        "env_key": "AI_GATEWAY_API_KEY",
        "is_vercel": True,
        "models": [
            "openai/gpt-4o-mini",
        ]
    },
    "vercel_anthropic": {
        "name": "Vercel AI Gateway (Anthropic)",
        "env_key": "AI_GATEWAY_API_KEY",
        "is_vercel": True,
        "models": [
            "anthropic/claude-3-haiku",
        ]
    },
    "vercel_deepseek": {
        "name": "Vercel AI Gateway (DeepSeek)",
        "env_key": "AI_GATEWAY_API_KEY",
        "is_vercel": True,
        "models": [
            "deepseek/deepseek-v3",
        ]
    },
    "vercel_meta": {
        "name": "Vercel AI Gateway (Meta LLaMA)",
        "env_key": "AI_GATEWAY_API_KEY",
        "is_vercel": True,
        "models": [
            "meta/llama-3.1-8b",
        ]
    },
    "vercel_mistral": {
        "name": "Vercel AI Gateway (Mistral)",
        "env_key": "AI_GATEWAY_API_KEY",
        "is_vercel": True,
        "models": [
            "mistral/ministral-8b",
        ]
    },
    "gemini": {
        "name": "Google Gemini & Gemma (LiteLLM Direct)",
        "env_key": "GEMINI_API_KEY",
        "is_vercel": False,
        "models": [
            "gemini/gemini-2.5-flash",
            "gemini/gemma-4-31b-it",
            "gemini/gemma-4-26b-a4b-it",
            "gemini/gemini-3.6-flash",
            "gemini/gemini-2.5-pro",
        ]
    }
}


class LLMRouter:
    def __init__(self):
        self._sync_env_keys()
        self.available_models: List[str] = []
        self.grouped_models: Dict[str, List[str]] = {}
        self.default_model: str = "gemini/gemini-2.5-flash"
        self._initialize_available_models()

    def _sync_env_keys(self):
        """Inject settings API keys into OS env for LiteLLM."""
        key_mappings = {
            "GEMINI_API_KEY": settings.GEMINI_API_KEY,
            "AI_GATEWAY_API_KEY": settings.AI_GATEWAY_API_KEY,
        }
        for env_name, value in key_mappings.items():
            if value and not value.startswith("mock_"):
                os.environ[env_name] = value

    def _initialize_available_models(self):
        """Detect configured providers and assemble available models."""
        all_models = []
        
        for key, pinfo in MODEL_PROVIDERS.items():
            env_val = getattr(settings, pinfo["env_key"], None)
            is_valid = bool(env_val) and not str(env_val).startswith("mock_")
            allow = pinfo.get("allow_without_key", False)

            if is_valid or allow:
                models = pinfo["models"]
                all_models.extend(models)
                self.grouped_models[pinfo["name"]] = models

        if getattr(settings, "AI_GATEWAY_API_KEY", None) and not settings.AI_GATEWAY_API_KEY.startswith("mock_"):
            self.default_model = "openai/gpt-4o-mini"
        elif getattr(settings, "GEMINI_API_KEY", None) and not settings.GEMINI_API_KEY.startswith("mock_"):
            self.default_model = "gemini/gemini-2.5-flash"
        elif all_models:
            self.default_model = all_models[0]

        if not all_models:
            all_models = MODEL_PROVIDERS["gemini"]["models"]
            self.grouped_models["Google Gemini & Gemma (LiteLLM Direct)"] = MODEL_PROVIDERS["gemini"]["models"]

        self.available_models = all_models

    def is_vercel_model(self, model: str) -> bool:
        """Returns True if the model belongs to Vercel AI Gateway suite."""
        if not model:
            return False
        if model.startswith("vercel_ai_gateway/"):
            return True
        for pkey, pinfo in MODEL_PROVIDERS.items():
            if pinfo.get("is_vercel") and model in pinfo.get("models", []):
                return True
        return False

    def _call_vercel_gateway_sync(self, model: str, messages: List[Dict[str, str]], temperature: float = 0.7) -> Dict[str, Any]:
        """Calls Vercel AI Gateway using OpenAI client interface."""
        api_key = getattr(settings, "AI_GATEWAY_API_KEY", None) or os.getenv("AI_GATEWAY_API_KEY")
        if not api_key:
            raise Exception("AI_GATEWAY_API_KEY is not configured.")

        from openai import OpenAI
        client = OpenAI(
            api_key=api_key,
            base_url="https://ai-gateway.vercel.sh/v1"
        )
        clean_model = model.replace("vercel_ai_gateway/", "")
        response = client.chat.completions.create(
            model=clean_model,
            messages=messages,
            temperature=temperature,
            max_tokens=1024
        )
        return {"choices": [{"message": {"content": response.choices[0].message.content}}]}

    def _call_vercel_gateway_stream_sync(self, model: str, messages: List[Dict[str, str]], temperature: float = 0.7):
        """Streams completion tokens from Vercel AI Gateway."""
        api_key = getattr(settings, "AI_GATEWAY_API_KEY", None) or os.getenv("AI_GATEWAY_API_KEY")
        if not api_key:
            raise Exception("AI_GATEWAY_API_KEY is not configured.")

        from openai import OpenAI
        client = OpenAI(
            api_key=api_key,
            base_url="https://ai-gateway.vercel.sh/v1"
        )
        clean_model = model.replace("vercel_ai_gateway/", "")
        response = client.chat.completions.create(
            model=clean_model,
            messages=messages,
            temperature=temperature,
            max_tokens=1024,
            stream=True
        )
        for chunk in response:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def generate_response(self, messages: List[Dict[str, str]], model: Optional[str] = None, temperature: float = 0.7) -> Dict[str, Any]:
        """Dispatches completion request to Vercel AI Gateway or LiteLLM with fallback support."""
        self._sync_env_keys()
        selected_model = model or self.default_model

        if self.is_vercel_model(selected_model):
            try:
                return self._call_vercel_gateway_sync(selected_model, messages, temperature)
            except Exception as vercel_err:
                logger.warning(f"Vercel AI Gateway model '{selected_model}' error: {vercel_err}. Falling back to default provider...")

        try:
            response = completion(
                model=selected_model,
                messages=messages,
                temperature=temperature,
            )
            return response
        except Exception as primary_error:
            logger.warning(f"Primary model '{selected_model}' failed: {primary_error}. Retrying fallbacks...")

            fallback_candidates = [
                "openai/gpt-4o-mini",
                "gemini/gemini-2.5-flash",
            ] + [m for m in self.available_models if m != selected_model]

            for fb in fallback_candidates:
                if fb == selected_model:
                    continue
                try:
                    logger.info(f"Attempting fallback model '{fb}'...")
                    if self.is_vercel_model(fb):
                        return self._call_vercel_gateway_sync(fb, messages, temperature)
                    response = completion(
                        model=fb,
                        messages=messages,
                        temperature=temperature,
                    )
                    return response
                except Exception as fb_err:
                    logger.warning(f"Fallback '{fb}' failed: {fb_err}")
                    continue

            return {"choices": [{"message": {"content": f"Unable to reach LLM provider. Error: {str(primary_error)}"}}]}

    def generate_response_stream(self, messages: List[Dict[str, str]], model: Optional[str] = None, temperature: float = 0.7):
        """Yields token deltas in real-time as a generator."""
        self._sync_env_keys()
        selected_model = model or self.default_model

        if self.is_vercel_model(selected_model):
            try:
                for token in self._call_vercel_gateway_stream_sync(selected_model, messages, temperature):
                    yield token
                return
            except Exception as vercel_err:
                logger.warning(f"Vercel AI Gateway stream error: {vercel_err}. Falling back to default provider...")

        try:
            response = completion(
                model=selected_model,
                messages=messages,
                temperature=temperature,
                stream=True
            )
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as primary_error:
            logger.warning(f"Primary streaming model '{selected_model}' failed: {primary_error}. Retrying fallbacks...")
            fallback_candidates = [
                "openai/gpt-4o-mini",
                "gemini/gemini-2.5-flash",
            ] + [m for m in self.available_models if m != selected_model]

            for fb in fallback_candidates:
                if fb == selected_model:
                    continue
                try:
                    logger.info(f"Attempting fallback stream with model '{fb}'...")
                    if self.is_vercel_model(fb):
                        for token in self._call_vercel_gateway_stream_sync(fb, messages, temperature):
                            yield token
                        return
                    response = completion(
                        model=fb,
                        messages=messages,
                        temperature=temperature,
                        stream=True
                    )
                    for chunk in response:
                        if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                            yield chunk.choices[0].delta.content
                    return
                except Exception as fb_err:
                    logger.warning(f"Fallback stream '{fb}' failed: {fb_err}")
                    continue

            yield f"Unable to reach LLM provider. Error: {str(primary_error)}"


llm_router = LLMRouter()


