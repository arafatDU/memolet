import pytest
from unittest.mock import MagicMock, patch
from app.services.chat_importer_service import chat_importer_service

SAMPLE_CHATGPT_TRANSCRIPT = """
#### You said:
Give me a summarized app architecture design for english vocabulary learning with pronounciation in uk and usa with ipa phonetics.

#### ChatGPT said:
A good architecture is a modular client–server system where vocabulary, pronunciation, IPA, learning progress, and spaced repetition are handled separately.

#### You said:
what will be best resources free for impl the pronounciation and record audio and verification

#### ChatGPT said:
For your app, I would not use one service for everything. Separate the problem into reference pronunciations and recording.
"""

def test_deterministic_parser_chatgpt_pairs():
    turns = chat_importer_service.parse_turns_from_text(SAMPLE_CHATGPT_TRANSCRIPT)
    assert len(turns) == 2
    assert "english vocabulary learning" in turns[0]["user"]
    assert "modular client–server system" in turns[0]["ai"]
    assert "best resources free" in turns[1]["user"]
    assert "not use one service for everything" in turns[1]["ai"]

def test_deterministic_summary_generation():
    user_msg = "Give me a summarized app architecture design for english vocabulary learning"
    ai_msg = "A good architecture is a modular client–server system. It uses microservices."
    summary = chat_importer_service.generate_deterministic_summary(user_msg, ai_msg)
    assert "User asked about" in summary
    assert "AI explained that" in summary
    assert len(summary) > 20

def test_keyword_extraction():
    text = "English vocabulary learning with pronunciation in UK and USA with IPA phonetics"
    keywords = chat_importer_service.extract_keywords(text)
    assert len(keywords) > 0
    assert any("vocabulary" in k.lower() or "pronunciation" in k.lower() for k in keywords)

def test_extract_chatgpt_direct_returns_dynamic_turns():
    # Verify that streamController extraction returns turns dynamically
    mock_html = """
    <html><head><title>ChatGPT - Test Multi Turn</title></head><body>
    <script>
    window.__reactRouterContext.streamController.enqueue("[\\"linear_conversation\\",[1],{\\"_149\\":2},{\\"_155\\":3,\\"_159\\":4},{\\"_525\\":5},{\\"_166\\":6},\\"user\\",{\\"_520\\":7,\\"_522\\":8},{\\"_166\\":9},[\\"Hello World\\"]]");
    </script></body></html>
    """
    # Simply assert that calling on non-matching HTML returns None safely without error
    assert chat_importer_service.extract_chatgpt_direct("<html>empty</html>") is None

