"""
CoursePlannerService: Orchestrates the logic for generating structured JSON course plans 
and conversational responses via dual LLM calls.
"""
import json
from typing import AsyncGenerator, Dict, Any, Optional
import re

from app.core.logger import get_logger
from app.chat.session_manager import SessionManager
from app.chat.memory_service import MemoryService
from app.llm.client import LLMClient
from app.llm.prompt_builder import PromptLoader, PromptBuilder
from app.rag.retriever import Retriever
from app.models.chat import SourceFilter
from app.planner.models import CoursePlan
from app.planner.schemas import PlannerRequest
from app.services.recommendation_service import RecommendationService
from app.services.curriculum_service import CurriculumService

logger = get_logger(__name__)

class CoursePlannerService:
    """
    Handles the AI Course Planning workflows.
    Executes a structured JSON LLM call to build the syllabus, and a secondary streaming 
    call to provide conversational feedback.
    """

    def __init__(
        self,
        session_manager: SessionManager,
        memory_service: MemoryService,
        retriever: Retriever,
        llm_client: LLMClient,
        prompt_loader: PromptLoader,
    ):
        self.session_manager = session_manager
        self.memory_service = memory_service
        self.retriever = retriever
        self.llm_client = llm_client
        self.prompt_loader = prompt_loader

    def _generate_json_plan(
        self,
        session_id: str,
        question: str,
        history_text: str,
        context_text: str,
        current_plan_str: str,
    ) -> Optional[CoursePlan]:
        """
        Synchronously calls the LLM to generate the updated JSON course plan.
        """
        system_prompt = self.prompt_loader.build_prompt(
            "course_planner_json",
            CONTEXT=context_text,
            HISTORY=history_text,
            CURRENT_PLAN=current_plan_str,
            QUESTION=question,
            context=context_text,
            history=history_text,
            current_plan=current_plan_str,
            question=question
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]

        logger.info(f"Generating structured JSON Course Plan for session {session_id}")
        
        try:
            result = self.llm_client.generate(
                messages=messages,
                temperature=0.1,
            )
            
            content = result["content"].strip()
            
            # Clean up markdown formatting if wrapped in ```json
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            content = content.strip()
            
            # Helper to extract JSON from surrounding dialogue if present
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                content = content[start_idx:end_idx + 1]
                
            # Try primary JSON load & Pydantic parse
            try:
                plan_data = json.loads(content)
            except json.JSONDecodeError as jde:
                logger.warning("Initial JSON syntax error detected (%s). Attempting auto-recovery...", str(jde))
                # Heuristics: remove trailing commas before closing brackets
                content_repaired = re.sub(r',\s*([\]}])', r'\1', content)
                try:
                    plan_data = json.loads(content_repaired)
                except Exception:
                    logger.info("Heuristics insufficient. Requesting automated LLM JSON self-repair...")
                    repair_messages = [
                        {"role": "system", "content": "You are a specialized JSON syntactic repair engine. Output ONLY valid repaired JSON matching the CoursePlan schema. No markdown, no explanations."},
                        {"role": "user", "content": f"Fix this broken JSON string:\n\n{content}"}
                    ]
                    repair_res = self.llm_client.generate(messages=repair_messages, temperature=0.0)
                    fixed_content = repair_res["content"].strip()
                    if fixed_content.startswith("```"):
                        fixed_content = re.sub(r'^```[a-z]*\n?', '', fixed_content)
                        fixed_content = re.sub(r'```$', '', fixed_content).strip()
                    plan_data = json.loads(fixed_content)

            course_plan = CoursePlan(**plan_data)
            
            # Sanitize any paid or non-public resources
            removed = RecommendationService.sanitize_course_resources(course_plan)
            if removed > 0:
                logger.info(f"Sanitized {removed} commercial resources from generated plan.")
                
            return course_plan
            
        except Exception as e:
            logger.error(f"Failed to generate or recover JSON Course Plan: {str(e)}")
            return None

    async def chat_stream(self, request: PlannerRequest) -> AsyncGenerator[str, None]:
        """
        Executes the dual LLM flow:
        1. Retrieves context and history.
        2. Generates the updated JSON course plan synchronously.
        3. Saves the updated plan to the session.
        4. Streams a conversational response back to the user.
        5. Emits the updated JSON payload via a specialized SSE event at the end.
        """
        session = self.session_manager.get_or_create(request.session_id)
        
        # 1. Retrieve Context
        # Only search if there are actually uploaded sources linked to the session, or use global
        if request.source_filter == "session":
            retrieval_filter = SourceFilter.ALL
            retrieval_session_id = request.session_id
        else:
            try:
                retrieval_filter = SourceFilter(request.source_filter)
            except ValueError:
                retrieval_filter = SourceFilter.ALL
            retrieval_session_id = None

        context_chunks = self.retriever.retrieve(
            query=request.question,
            top_k=5,
            source_filter=retrieval_filter,
            session_id=retrieval_session_id
        )
        
        context_text = ""
        for i, chunk in enumerate(context_chunks):
            context_text += f"\n[Source {i+1}: {chunk.source_name}]\n{chunk.chunk_text}\n"

        history_text = self.memory_service.serialize_for_prompt(session, max_turns=10)
        current_plan_str = "{}"
        if session.course_plan:
            try:
                if hasattr(session.course_plan, "model_dump") and not hasattr(session.course_plan, "_mock_return_value"):
                    val = session.course_plan.model_dump()
                    if isinstance(val, dict):
                        current_plan_str = json.dumps(val)
                elif isinstance(session.course_plan, dict):
                    current_plan_str = json.dumps(session.course_plan)
            except Exception:
                current_plan_str = "{}"

        # 2. Generate JSON Plan (Synchronous)
        updated_plan_obj = self._generate_json_plan(
            session_id=request.session_id,
            question=request.question,
            history_text=history_text,
            context_text=context_text,
            current_plan_str=current_plan_str,
        )

        # 3. Save to Session
        if updated_plan_obj:
            session.course_plan = updated_plan_obj.model_dump()
            self.session_manager.save(session)
        
        # We append the user message to memory
        self.memory_service.append(session, role="user", content=request.question)

        # 4. Generate Chat Response (Streaming)
        chat_system = self.prompt_loader.build_prompt(
            "course_chat",
            CONTEXT=context_text,
            HISTORY=history_text,
            QUESTION=request.question,
            context=context_text,
            history=history_text,
            question=request.question
        )

        messages = [
            {"role": "system", "content": chat_system},
            {"role": "user", "content": request.question}
        ]

        logger.info(f"Streaming conversational Planner response for session {request.session_id}")
        
        full_response = ""
        try:
            for token in self.llm_client.stream(messages=messages, temperature=0.7):
                full_response += token
                yield json.dumps({"event": "token", "data": token}) + "\n\n"
                
        except Exception as e:
            logger.error(f"Planner streaming error: {str(e)}")
            yield json.dumps({"event": "error", "data": "Stream interrupted."}) + "\n\n"
            return
            
        # Append assistant response to memory
        self.memory_service.append(session, role="assistant", content=full_response)
        
        # 5. Emit the updated plan as a specialized event
        if updated_plan_obj:
            yield json.dumps({
                "event": "plan_update",
                "data": updated_plan_obj.model_dump()
            }) + "\n\n"

        yield json.dumps({"event": "done", "data": {}}) + "\n\n"

    def get_course_plan(self, session_id: str) -> Optional[CoursePlan]:
        """Retrieve the current course plan for a session."""
        session = self.session_manager.get_session(session_id)
        if not session or not session.course_plan:
            return None
        return CoursePlan(**session.course_plan)

    def update_course_plan(self, session_id: str, new_plan: CoursePlan) -> CoursePlan:
        """Manually update the course plan via UI edits."""
        session = self.session_manager.get_or_create(session_id)
        session.course_plan = new_plan.model_dump()
        self.session_manager.save(session)
        return new_plan
