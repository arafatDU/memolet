import logging
from typing import List, Optional, Dict, Any, Generator
import httpx
import json
from app.core.config import settings

logger = logging.getLogger(__name__)


class OllamaService:
    """Wrapper around Ollama REST API for remote / Colab / local deployment."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or getattr(settings, "OLLAMA_BASE_URL", None) or "http://localhost:11434").rstrip("/")
        self.timeout = httpx.Timeout(180.0, connect=15.0)
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "ngrok-skip-browser-warning": "true",
            "Bypass-Tunnel-Reminder": "true",
            "Content-Type": "application/json"
        }

    def update_base_url(self, new_url: str):
        """Update the base URL at runtime."""
        self.base_url = new_url.rstrip("/")
        logger.info(f"Ollama base URL updated to: {self.base_url}")

    def check_health_sync(self) -> bool:
        """Sync check if Ollama server is reachable."""
        try:
            with httpx.Client(timeout=httpx.Timeout(5.0, connect=3.0), headers=self.headers) as client:
                res = client.get(f"{self.base_url}/")
                return res.status_code == 200
        except Exception:
            return False

    async def check_health(self) -> bool:
        """Check if Ollama server is reachable."""
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0), headers=self.headers) as client:
            try:
                response = await client.get(f"{self.base_url}/")
                return response.status_code == 200
            except Exception:
                return False

    def list_models_sync(self) -> List[Dict[str, Any]]:
        """Sync list available models from Ollama."""
        try:
            with httpx.Client(timeout=httpx.Timeout(8.0, connect=4.0), headers=self.headers) as client:
                response = client.get(f"{self.base_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return [
                        {"name": m["name"], "size": m.get("size", 0), "modified_at": m.get("modified_at")}
                        for m in data.get("models", [])
                    ]
        except Exception as e:
            logger.warning(f"Could not reach Ollama server at {self.base_url}: {e}")
        return []

    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models from Ollama."""
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, connect=5.0), headers=self.headers) as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                return [
                    {"name": m["name"], "size": m.get("size", 0), "modified_at": m.get("modified_at")}
                    for m in data.get("models", [])
                ]
            except Exception as e:
                raise Exception(f"Failed to list models from Ollama ({self.base_url}): {str(e)}")

    async def pull_model(self, model_name: str) -> Dict[str, Any]:
        """Pull a model from Ollama registry."""
        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0, connect=30.0), headers=self.headers) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/pull",
                    json={"name": model_name, "stream": False}
                )
                response.raise_for_status()
                return {"status": "success", "model": model_name}
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    raise Exception(f"Model '{model_name}' not found in Ollama registry")
                raise Exception(f"Failed to pull model: {str(e)}")
            except Exception as e:
                raise Exception(f"Failed to pull model: {str(e)}")

    def chat_completion_sync(
        self,
        model: str,
        messages: List[Dict[str, str]]
    ) -> str:
        """Send sync chat completion request to Ollama."""
        clean_model = model.replace("ollama/", "")
        try:
            with httpx.Client(timeout=httpx.Timeout(180.0, connect=15.0), headers=self.headers) as client:
                response = client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": clean_model,
                        "messages": messages,
                        "stream": False
                    }
                )
                
                # If model is not found, try pulling it once
                if response.status_code == 404:
                    logger.info(f"Model '{clean_model}' not found in Ollama. Attempting to pull...")
                    try:
                        pull_resp = client.post(
                            f"{self.base_url}/api/pull",
                            json={"name": clean_model, "stream": False},
                            timeout=httpx.Timeout(600.0, connect=30.0)
                        )
                        if pull_resp.status_code == 200:
                            response = client.post(
                                f"{self.base_url}/api/chat",
                                json={
                                    "model": clean_model,
                                    "messages": messages,
                                    "stream": False
                                }
                            )
                    except Exception as pull_err:
                        logger.error(f"Failed to pull Ollama model {clean_model}: {pull_err}")
                
                response.raise_for_status()
                data = response.json()
                return data["message"]["content"]
        except Exception as e:
            raise Exception(f"Ollama API Error ({self.base_url}): {str(e)}")

    def chat_completion_stream_sync(
        self,
        model: str,
        messages: List[Dict[str, str]]
    ) -> Generator[str, None, None]:
        """Send sync streaming chat completion request to Ollama."""
        clean_model = model.replace("ollama/", "")
        try:
            with httpx.Client(timeout=httpx.Timeout(180.0, connect=15.0), headers=self.headers) as client:
                with client.stream(
                    "POST",
                    f"{self.base_url}/api/chat",
                    json={
                        "model": clean_model,
                        "messages": messages,
                        "stream": True
                    }
                ) as response:
                    response.raise_for_status()
                    for line in response.iter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                delta = data.get("message", {}).get("content", "")
                                if delta:
                                    yield delta
                            except json.JSONDecodeError:
                                continue
        except Exception as e:
            yield f"Ollama Stream Error ({self.base_url}): {str(e)}"

    async def chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]]
    ) -> str:
        """Send async chat completion request to Ollama."""
        clean_model = model.replace("ollama/", "")
        async with httpx.AsyncClient(timeout=httpx.Timeout(180.0, connect=15.0), headers=self.headers) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": clean_model,
                        "messages": messages,
                        "stream": False
                    }
                )
                
                if response.status_code == 404:
                    print(f"Model '{clean_model}' not found. Attempting to pull...")
                    pull_result = await self.pull_model(clean_model)
                    if pull_result.get("status") == "success":
                        print(f"Model '{clean_model}' pulled successfully. Retrying chat...")
                        response = await client.post(
                            f"{self.base_url}/api/chat",
                            json={
                                "model": clean_model,
                                "messages": messages,
                                "stream": False
                            }
                        )
                
                response.raise_for_status()
                data = response.json()
                return data["message"]["content"]
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    raise Exception(f"Model '{clean_model}' not found even after pulling. Please check if the name is correct.")
                raise Exception(f"Ollama API error: {str(e)}")
            except Exception as e:
                raise Exception(f"Failed to get chat response: {str(e)}")


ollama_service = OllamaService()
