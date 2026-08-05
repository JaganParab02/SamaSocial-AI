"""
CurriculumService: Provides advanced pedagogical heuristics and structural audits for AI Course Planning.
Supports difficulty progression checking, intelligent prerequisite recommendations, and module sequencing refinement.
"""
from typing import List, Dict, Any, Optional
from app.planner.models import CoursePlan, Module
from app.core.logger import get_logger

logger = get_logger(__name__)

class CurriculumService:
    """
    Service responsible for educational structure validation and syllabus improvement.
    """

    @staticmethod
    def audit_difficulty_progression(modules: List[Module]) -> Dict[str, Any]:
        """
        Analyzes the sequence of modules to verify logical pedagogical progression
        (Beginner -> Intermediate -> Advanced).
        """
        if not modules:
            return {"valid": True, "notes": "No modules to evaluate."}
            
        levels = {"beginner": 1, "intermediate": 2, "advanced": 3}
        current_max = 0
        issues = []
        
        for idx, mod in enumerate(modules):
            diff_str = (mod.difficulty or "beginner").lower()
            diff_val = levels.get(diff_str, 1)
            
            if diff_val < current_max - 1:
                issues.append(
                    f"Module {idx + 1} ('{mod.title}') drops abruptly to '{mod.difficulty}' after more advanced content."
                )
            current_max = max(current_max, diff_val)
            
        if issues:
            return {
                "valid": False,
                "progression": [m.difficulty for m in modules],
                "issues": issues,
                "recommendation": "Consider reordering modules so foundational concepts precede specialized applications."
            }
        return {
            "valid": True,
            "progression": [m.difficulty for m in modules],
            "notes": "Optimal scaffolded progression detected."
        }

    @staticmethod
    def suggest_prerequisites(subject: str, target_audience: str) -> List[str]:
        """
        Infers high-level standard prerequisites based on subject domain keywords.
        """
        sub = (subject or "").lower()
        prereqs = []
        
        if any(w in sub for w in ["python", "data science", "machine learning", "ai", "deep learning"]):
            prereqs.extend([
                "Basic algorithmic problem-solving concepts",
                "Familiarity with foundational mathematics (Algebra/Basic Statistics)"
            ])
            if "deep learning" in sub or "neural" in sub:
                prereqs.append("Intermediate Python programming & matrix calculus understanding")
        elif any(w in sub for w in ["react", "web", "frontend", "next.js", "javascript"]):
            prereqs.extend([
                "Core HTML5, CSS3, and DOM fundamentals",
                "Basic understanding of HTTP and RESTful APIs",
                "Familiarity with ES6+ JavaScript syntax"
            ])
        elif any(w in sub for w in ["cloud", "docker", "kubernetes", "devops", "aws"]):
            prereqs.extend([
                "Basic terminal/command-line navigation (Bash/Linux)",
                "Fundamental networking concepts (IP, DNS, ports)",
                "Introductory software deployment workflow understanding"
            ])
        else:
            prereqs.append("Basic computer literacy and analytical reading aptitude")
            
        return list(set(prereqs))

    @staticmethod
    def calculate_completion_score(plan: CoursePlan) -> Dict[str, Any]:
        """
        Calculates a real-time syllabus completeness percentage to guide the conversational interview flow.
        """
        score = 0
        max_score = 100
        details = []
        
        if plan.title and len(plan.title.strip()) > 3:
            score += 15
        else:
            details.append("Missing course title")
            
        if plan.subject and plan.target_audience:
            score += 15
        else:
            details.append("Need subject domain and target audience definitions")
            
        if plan.learning_outcomes and len(plan.learning_outcomes) >= 2:
            score += 15
        else:
            details.append("Requires at least 2 clear learning outcomes")
            
        if plan.modules and len(plan.modules) >= 1:
            score += 25
            has_lessons = any(len(m.lessons) > 0 for m in plan.modules)
            has_resources = any(len(m.resources) > 0 for m in plan.modules)
            has_assessments = any(len(m.assessments) > 0 or len(m.projects) > 0 for m in plan.modules)
            
            if has_lessons:
                score += 10
            else:
                details.append("Modules need structured individual lessons")
                
            if has_resources:
                score += 10
            else:
                details.append("Include public free resources (MDN, YouTube, Docs)")
                
            if has_assessments:
                score += 10
            else:
                details.append("Add hands-on projects, quizzes, or assignments")
        else:
            details.append("Course requires structured curricular modules")
            
        return {
            "percentage": min(score, 100),
            "is_complete": score >= 85,
            "next_recommendations": details
        }
