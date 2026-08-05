"""
RecommendationService: Curates high-quality free public educational resources and purGES paid educational platforms.
Ensures modules and lessons recommend official documentation, MIT OCW, FreeCodeCamp, MDN, LeetCode, etc.
"""
from typing import List, Dict, Any
from app.planner.models import Resource, CoursePlan
from app.core.logger import get_logger

logger = get_logger(__name__)

class RecommendationService:
    """
    Service responsible for suggesting public resources and sanitizing educational links.
    """
    
    # Blocklist of typically commercial/paid platforms to discourage or warn about
    PAID_DOMAINS = [
        "udemy.com", "pluralsight.com", "linkedin.com/learning", 
        "masterclass.com", "skillshare.com", "coursera.org/specializations/paid"
    ]
    
    # Approved public free resource platforms
    APPROVED_PLATFORMS = [
        "MDN Web Docs", "YouTube", "Official Documentation", "MIT OpenCourseWare (OCW)",
        "FreeCodeCamp", "Microsoft Learn", "AWS Architecture Docs", "LeetCode (Free tier)",
        "HackerRank", "Kaggle Open Datasets", "Google Developers Docs", "Coursera (Free audit tier)"
    ]

    @classmethod
    def is_free_public_resource(cls, resource: Resource) -> bool:
        """
        Checks whether a resource URL or title links to an unacceptable paid wall.
        """
        if resource.url:
            url_low = resource.url.lower()
            if any(domain in url_low for domain in cls.PAID_DOMAINS):
                logger.warning(f"Flagged potentially paid resource: {resource.title} ({resource.url})")
                return False
        title_low = resource.title.lower()
        if any(term in title_low for term in ["paid course", "udemy bootcamp ($", "premium subscription"]):
            return False
        return True

    @classmethod
    def sanitize_course_resources(cls, plan: CoursePlan) -> int:
        """
        In-place filter that removes or flags non-public paid resources across all modules.
        Returns count of removed or replaced resources.
        """
        removed_count = 0
        for mod in plan.modules:
            valid_res = []
            for res in mod.resources:
                if cls.is_free_public_resource(res):
                    valid_res.append(res)
                else:
                    removed_count += 1
                    logger.info(f"Removed commercial resource '{res.title}' from module '{mod.title}'")
            mod.resources = valid_res
        return removed_count

    @classmethod
    def suggest_default_resources(cls, topic: str) -> List[Resource]:
        """
        Provides starter free public resource recommendations for common topics.
        """
        top = topic.lower()
        res = []
        if any(w in top for w in ["javascript", "react", "css", "html", "web"]):
            res.append(Resource(title="MDN Web Docs — Web Technology Fundamentals", url="https://developer.mozilla.org", type="documentation"))
            res.append(Resource(title="FreeCodeCamp Interactive Curriculum", url="https://www.freecodecamp.org", type="article"))
        elif any(w in top for w in ["python", "data", "ml", "ai"]):
            res.append(Resource(title="Official Python 3 Documentation", url="https://docs.python.org/3/", type="documentation"))
            res.append(Resource(title="Kaggle Datasets & Open Tutorials", url="https://www.kaggle.com/learn", type="article"))
            res.append(Resource(title="MIT OpenCourseWare — Intro to Computer Science", url="https://ocw.mit.edu", type="video"))
        elif any(w in top for w in ["cloud", "aws", "docker"]):
            res.append(Resource(title="AWS Free Tier & Well-Architected Framework Docs", url="https://aws.amazon.com/architecture/", type="documentation"))
            res.append(Resource(title="Microsoft Learn — Cloud Fundamentals", url="https://learn.microsoft.com", type="documentation"))
        else:
            res.append(Resource(title=f"YouTube Educational Lectures on {topic}", url=None, type="video"))
            res.append(Resource(title=f"Official Open-Source Documentation for {topic}", url=None, type="documentation"))
        return res
