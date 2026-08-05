import pytest
from app.planner.models import CoursePlan, Module, Lesson, Resource, Assessment, Project
from app.services.curriculum_service import CurriculumService
from app.services.recommendation_service import RecommendationService
from app.services.export_service import ExportService

@pytest.fixture
def sample_course_plan():
    return CoursePlan(
        title="Modern Python Data Engineering & AI",
        subject="Python & Machine Learning",
        description="A complete curriculum covering algorithmic fundamentals to production RAG pipelines.",
        target_audience="Software Engineers transition to Data Science",
        prerequisites=["Python OOP syntax", "Git & CLI fundamentals"],
        learning_outcomes=["Build multi-turn streaming RAG applications", "Master Pydantic schema validation"],
        modules=[
            Module(
                id="module-1",
                title="Python Core & Data Wrangling",
                description="Foundations of data parsing and structural transformation.",
                objectives=["Understand generators and async workflows", "Manipulate tabular structures"],
                difficulty="Beginner",
                estimated_duration_hours=12.5,
                lessons=[
                    Lesson(id="l1", title="Memory models and iterables", description="Deep dive into Python variables", estimated_duration_minutes=45),
                    Lesson(id="l2", title="Pydantic models for type safety", description="Data validation pipelines", estimated_duration_minutes=60)
                ],
                resources=[
                    Resource(title="Official Python 3 Docs", url="https://docs.python.org/3/", type="documentation"),
                    Resource(title="Udemy Paid Bootcamp ($49.99)", url="https://www.udemy.com/course/paid-python", type="video"),
                    Resource(title="MIT OCW Computer Science", url="https://ocw.mit.edu", type="video")
                ],
                assessments=[
                    Assessment(title="Data extraction quiz", description="Test regex and JSON serialization", type="quiz")
                ],
                projects=[
                    Project(title="Build a CLI Web Scraper", description="Scrape documentation and output clean JSON", difficulty="Beginner")
                ]
            ),
            Module(
                id="module-2",
                title="Vector Databases & Semantic RAG",
                description="Advanced retrieval architectures with Qdrant.",
                objectives=["Index dense embeddings", "Optimize context windows"],
                difficulty="Advanced",
                estimated_duration_hours=18.0,
                lessons=[
                    Lesson(id="l3", title="Sentence Transformers Under the Hood", description="Embeddings explained", estimated_duration_minutes=90)
                ],
                resources=[
                    Resource(title="Qdrant Architecture Docs", url="https://qdrant.tech/documentation/", type="documentation")
                ],
                assessments=[],
                projects=[
                    Project(title="Deploy an AI Course Planner", description="Build dual LLM streaming pipeline", difficulty="Advanced")
                ]
            )
        ]
    )

def test_curriculum_difficulty_progression(sample_course_plan):
    result = CurriculumService.audit_difficulty_progression(sample_course_plan.modules)
    assert result["valid"] is True
    assert result["progression"] == ["Beginner", "Advanced"]
    
    # Introduce invalid abrupt drop
    sample_course_plan.modules.append(Module(
        id="mod-3", title="Intro to Print Statements", description="Basic syntax",
        objectives=[], difficulty="Beginner", estimated_duration_hours=2.0
    ))
    bad_res = CurriculumService.audit_difficulty_progression(sample_course_plan.modules)
    assert bad_res["valid"] is False
    assert "drops abruptly" in bad_res["issues"][0]

def test_prerequisite_recommendations():
    prereqs_ai = CurriculumService.suggest_prerequisites("Python Data Science and AI", "Beginners")
    assert any("mathematics" in p.lower() or "algorithmic" in p.lower() for p in prereqs_ai)
    
    prereqs_web = CurriculumService.suggest_prerequisites("Next.js React Web Engineering", "Students")
    assert any("html5" in p.lower() or "javascript" in p.lower() for p in prereqs_web)

def test_completion_score_calculator(sample_course_plan):
    score_info = CurriculumService.calculate_completion_score(sample_course_plan)
    assert score_info["percentage"] >= 85
    assert score_info["is_complete"] is True
    
    empty_plan = CoursePlan(title="", subject="", description="", target_audience="", prerequisites=[], learning_outcomes=[], modules=[])
    empty_score = CurriculumService.calculate_completion_score(empty_plan)
    assert empty_score["percentage"] == 0
    assert empty_score["is_complete"] is False

def test_recommendation_resource_sanitizing(sample_course_plan):
    # Ensure Udemy paid link is stripped while Official Docs & MIT OCW are kept
    removed_cnt = RecommendationService.sanitize_course_resources(sample_course_plan)
    assert removed_cnt == 1 # The Udemy link
    
    mod1_res_titles = [r.title for r in sample_course_plan.modules[0].resources]
    assert "Official Python 3 Docs" in mod1_res_titles
    assert "MIT OCW Computer Science" in mod1_res_titles
    assert not any("Udemy" in t for t in mod1_res_titles)

def test_export_markdown_generation(sample_course_plan):
    md = ExportService.export_to_markdown(sample_course_plan)
    assert "# Modern Python Data Engineering & AI" in md
    assert "## Key Learning Outcomes" in md
    assert "### Module 1: Python Core & Data Wrangling" in md
    assert "**Lessons:**" in md
    assert "[DOCUMENTATION] **Official Python 3 Docs**" in md

def test_export_pdf_bytes_generation(sample_course_plan):
    pdf_bytes = ExportService.export_to_pdf_bytes(sample_course_plan)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 500 # Valid non-empty PDF binary signature
    assert pdf_bytes[:4] == b"%PDF" # Official magic number for PDF files
