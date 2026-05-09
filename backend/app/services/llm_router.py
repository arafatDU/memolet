from litellm import completion
from app.core.config import settings
import os

# Inject API keys into OS env for litellm
if settings.GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
if settings.GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = settings.GROQ_API_KEY

GEMINI_25_FLASH = "gemini/gemini-2.5-flash"
GEMINI_20_FLASH = "gemini/gemini-2.0-flash"
GEMMA_4_31B = "gemini/gemma-4-31b-it"
GEMMA_4_26B = "gemini/gemma-4-26b-a4b-it"
GROQ_LLAMA = "groq/llama3-8b-8192"

class LLMRouter:
    def __init__(self):
        # Prefer gemini-2.5-flash, fall back to gemini-2.0-flash then groq
        if settings.GEMINI_API_KEY:
            self.default_model = GEMINI_25_FLASH
            self.fallback_models = [GEMINI_20_FLASH, GEMMA_4_31B, GEMMA_4_26B]
        else:
            self.default_model = GROQ_LLAMA
            self.fallback_models = []

        if settings.GROQ_API_KEY:
            self.fallback_models.append(GROQ_LLAMA)

        # Human-readable model list for the UI
        self.available_models = []
        if settings.GEMINI_API_KEY:
            self.available_models += [GEMINI_25_FLASH, GEMINI_20_FLASH, GEMMA_4_31B, GEMMA_4_26B]
        if settings.GROQ_API_KEY:
            self.available_models.append(GROQ_LLAMA)

    def generate_response(self, messages, model=None, temperature=0.7):
        selected_model = model or self.default_model

        try:
            response = completion(
                model=selected_model,
                messages=messages,
                temperature=temperature,
            )
            return response
        except Exception as e:
            # Try fallbacks manually
            for fb in self.fallback_models:
                if fb == selected_model:
                    continue
                try:
                    response = completion(model=fb, messages=messages, temperature=temperature)
                    return response
                except Exception:
                    continue
            return {"choices": [{"message": {"content": f"Unable to reach configured LLMs. Error: {str(e)}"}}]}

llm_router = LLMRouter()
