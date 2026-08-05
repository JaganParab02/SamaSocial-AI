from typing import List, Optional
from pydantic import BaseModel, Field

class Resource(BaseModel):
    title: str = Field(..., description="Title of the resource (e.g. YouTube Video, Official Docs)")
    url: Optional[str] = Field(None, description="URL to the public resource, if applicable")
    type: str = Field(..., description="Type of resource (e.g. video, article, documentation, github)")

class Assessment(BaseModel):
    title: str = Field(..., description="Title of the assessment or quiz")
    description: str = Field(..., description="What the assessment evaluates")
    type: str = Field(..., description="Type of assessment (e.g. quiz, project, peer review)")

class Project(BaseModel):
    title: str = Field(..., description="Title of the project")
    description: str = Field(..., description="Description of the project requirements")
    difficulty: str = Field(..., description="Difficulty level (e.g. Beginner, Intermediate, Advanced)")

class Lesson(BaseModel):
    id: str = Field(..., description="Unique identifier for the lesson")
    title: str = Field(..., description="Title of the lesson")
    description: str = Field(..., description="Brief description of the lesson content")
    estimated_duration_minutes: int = Field(..., description="Estimated time in minutes to complete")

class Module(BaseModel):
    id: str = Field(..., description="Unique identifier for the module")
    title: str = Field(..., description="Title of the module (e.g. Module 1: Introduction)")
    description: str = Field(..., description="Description of what this module covers")
    objectives: List[str] = Field(..., description="Learning objectives for this module")
    difficulty: str = Field(..., description="Overall difficulty (e.g. Beginner, Intermediate, Advanced)")
    estimated_duration_hours: float = Field(..., description="Estimated time in hours to complete")
    lessons: List[Lesson] = Field(default_factory=list)
    resources: List[Resource] = Field(default_factory=list)
    assessments: List[Assessment] = Field(default_factory=list)
    projects: List[Project] = Field(default_factory=list)

class CoursePlan(BaseModel):
    title: str = Field(..., description="Overall title of the course")
    subject: str = Field(..., description="Subject domain of the course")
    description: str = Field(..., description="High-level description of the course")
    target_audience: str = Field(..., description="Who this course is for")
    prerequisites: List[str] = Field(default_factory=list, description="Required knowledge or skills before starting")
    learning_outcomes: List[str] = Field(default_factory=list, description="What the student will achieve by the end")
    modules: List[Module] = Field(default_factory=list)
