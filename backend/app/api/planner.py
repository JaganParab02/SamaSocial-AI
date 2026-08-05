"""
Planner API Router exposing endpoints for Task 2 (Course Planning Assistant).
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Body, Response
from fastapi.responses import StreamingResponse
from app.core.dependencies import get_planner_service
from app.planner.service import CoursePlannerService
from app.planner.schemas import PlannerRequest
from app.planner.models import CoursePlan
from app.services.export_service import ExportService

router = APIRouter(prefix="/planner", tags=["Course Planner"])

@router.post("/chat/stream")
async def chat_stream(
    request: PlannerRequest,
    planner_service: CoursePlannerService = Depends(get_planner_service)
):
    """
    Streams the conversational response while internally generating the structured course plan.
    Emits a special 'plan_update' SSE event at the end of the stream with the JSON payload.
    """
    try:
        return StreamingResponse(
            planner_service.chat_stream(request),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}")
async def get_course_plan(
    session_id: str,
    planner_service: CoursePlannerService = Depends(get_planner_service)
) -> CoursePlan:
    """
    Retrieves the currently saved course plan for the given session.
    """
    plan = planner_service.get_course_plan(session_id)
    if not plan:
        # Return an empty plan placeholder instead of 404 to gracefully handle new sessions
        return CoursePlan(
            title="", subject="", description="", target_audience="",
            prerequisites=[], learning_outcomes=[], modules=[]
        )
    return plan

@router.put("/course")
async def update_course_plan(
    session_id: str = Body(...),
    course_plan: CoursePlan = Body(...),
    planner_service: CoursePlannerService = Depends(get_planner_service)
) -> CoursePlan:
    """
    Endpoint for the UI to save manual edits to the course plan.
    """
    try:
        updated = planner_service.update_course_plan(session_id, course_plan)
        return updated
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update plan: {str(e)}")

@router.post("/export/json")
async def export_json(
    session_id: str = Body(..., embed=True),
    planner_service: CoursePlannerService = Depends(get_planner_service)
):
    """
    Exports the current course plan as a raw JSON string for downloading.
    """
    plan = planner_service.get_course_plan(session_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No course plan found for this session.")
    return json.loads(plan.model_dump_json())

@router.post("/export/markdown")
async def export_markdown(
    session_id: str = Body(..., embed=True),
    planner_service: CoursePlannerService = Depends(get_planner_service)
):
    """
    Exports the current course plan as formatted GitHub Flavored Markdown.
    """
    plan = planner_service.get_course_plan(session_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No course plan found for this session.")
    md_content = ExportService.export_to_markdown(plan)
    return Response(content=md_content, media_type="text/markdown", headers={"Content-Disposition": f'attachment; filename="course_plan_{session_id[:8]}.md"'})

@router.post("/export/pdf")
async def export_pdf(
    session_id: str = Body(..., embed=True),
    planner_service: CoursePlannerService = Depends(get_planner_service)
):
    """
    Exports the current course plan as a clean PDF document generated in memory.
    """
    plan = planner_service.get_course_plan(session_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No course plan found for this session.")
    pdf_bytes = ExportService.export_to_pdf_bytes(plan)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="course_plan_{session_id[:8]}.pdf"'})

@router.post("/export/docx-stub")
async def export_docx(
    session_id: str = Body(..., embed=True),
    planner_service: CoursePlannerService = Depends(get_planner_service)
):
    """
    Architectural interface preparing for native DOCX generation.
    """
    plan = planner_service.get_course_plan(session_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No course plan found for this session.")
    return ExportService.export_to_docx_stub(plan)
