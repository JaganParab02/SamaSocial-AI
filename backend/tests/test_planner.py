import pytest
from unittest.mock import MagicMock, AsyncMock
from app.planner.service import CoursePlannerService
from app.planner.models import CoursePlan
from app.planner.schemas import PlannerRequest

@pytest.fixture
def mock_planner_deps():
    session_manager = MagicMock()
    memory_service = MagicMock()
    retriever = MagicMock()
    llm_client = MagicMock()
    prompt_loader = MagicMock()
    
    # Setup default mock behaviors
    prompt_loader.load.return_value = "Mock Prompt"
    memory_service.serialize_for_prompt.return_value = "Mock History"
    retriever.search.return_value = []
    
    return {
        "session_manager": session_manager,
        "memory_service": memory_service,
        "retriever": retriever,
        "llm_client": llm_client,
        "prompt_loader": prompt_loader
    }

def test_planner_generate_valid_json(mock_planner_deps):
    """Test that the planner successfully parses valid LLM JSON output."""
    service = CoursePlannerService(**mock_planner_deps)
    
    # Mock LLM returning valid JSON
    valid_json = '''```json
    {
        "title": "Python Basics",
        "subject": "CS",
        "description": "Intro course",
        "target_audience": "Beginners",
        "prerequisites": [],
        "learning_outcomes": [],
        "modules": []
    }
    ```'''
    mock_planner_deps["llm_client"].generate.return_value = {"content": valid_json}
    
    plan = service._generate_json_plan("session_1", "Make python course", "", "", "")
    assert plan is not None
    assert plan.title == "Python Basics"

def test_planner_generate_malformed_json(mock_planner_deps):
    """Test that the planner gracefully handles completely malformed LLM JSON output."""
    service = CoursePlannerService(**mock_planner_deps)
    
    # Mock LLM returning garbage text instead of JSON
    mock_planner_deps["llm_client"].generate.return_value = {"content": "Sure, I can help you with that. Here is a course... Wait, I didn't output JSON."}
    
    plan = service._generate_json_plan("session_1", "Make python course", "", "", "")
    
    # Should safely catch JSONDecodeError and return None instead of crashing
    assert plan is None

def test_planner_generate_invalid_schema_json(mock_planner_deps):
    """Test that the planner gracefully handles JSON that violates the Pydantic schema."""
    service = CoursePlannerService(**mock_planner_deps)
    
    # Mock LLM returning JSON missing required fields (e.g., 'title' is missing)
    invalid_schema_json = '''{
        "subject": "CS",
        "modules": []
    }'''
    mock_planner_deps["llm_client"].generate.return_value = {"content": invalid_schema_json}
    
    plan = service._generate_json_plan("session_1", "Make python course", "", "", "")
    
    # Should safely catch ValidationError and return None
    assert plan is None

@pytest.mark.asyncio
async def test_planner_chat_stream_interruption(mock_planner_deps):
    """Test that if the LLM streaming fails midway, the generator yields an error event safely."""
    service = CoursePlannerService(**mock_planner_deps)
    
    # Mock synchronous JSON generation succeeding
    service._generate_json_plan = MagicMock(return_value=None)
    
    # Mock LLM stream raising an exception midway
    def mock_stream(*args, **kwargs):
        yield "Hello"
        raise ConnectionError("Groq disconnected")
        
    mock_planner_deps["llm_client"].stream = mock_stream
    
    request = PlannerRequest(session_id="s1", question="Hi", source_filter="all")
    
    events = []
    async for event in service.chat_stream(request):
        events.append(event)
        
    assert len(events) >= 2
    assert "Hello" in events[0]
    assert "error" in events[-1] # The last event yielded should be an error event
