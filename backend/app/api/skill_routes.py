"""
app/api/skill_routes.py

Skill management endpoints.

POST   /api/skills/           — Add a skill to your profile (auth required)
GET    /api/skills/           — List all skills (public)
GET    /api/skills/mine       — List only my skills (auth required)
DELETE /api/skills/{skill_id} — Delete one of my skills (auth required)
"""

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.models import Skill
from app.models.user import User
from app.schemas.schemas import SkillCreate, SkillOut
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/skills",
    tags=["Skills"],
)


@router.post(
    "/",
    response_model=SkillOut,
    status_code=status.HTTP_201_CREATED,
    summary="Add a skill to your profile",
)
def create_skill(
    skill: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new skill record linked to the authenticated user.

    Skills are primarily for skilled_volunteer users, but any authenticated
    user can add a skill record.
    """
    new_skill = Skill(
        title=skill.title,
        category=skill.category,
        description=skill.description,
        owner_id=current_user.id,
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


@router.get(
    "/mine",
    response_model=List[SkillOut],
    summary="List my skills",
)
def get_my_skills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all skills belonging to the currently authenticated user."""
    return (
        db.query(Skill)
        .filter(Skill.owner_id == current_user.id)
        .order_by(Skill.created_at.desc())
        .all()
    )


@router.get(
    "/",
    response_model=List[SkillOut],
    summary="List all skills",
)
def list_skills(
    category: str = None,
    db: Session = Depends(get_db),
):
    """
    List all skills in the system.

    Optionally filter by category (e.g., ?category=First+Aid).
    """
    query = db.query(Skill)
    if category:
        query = query.filter(Skill.category.ilike(f"%{category}%"))
    return query.order_by(Skill.created_at.desc()).all()


@router.delete(
    "/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete one of my skills",
)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a skill by ID.

    Only the skill owner can delete their own skill.
    Admins can delete any skill.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    # Allow owner or admin to delete
    if skill.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own skills",
        )

    db.delete(skill)
    db.commit()
    return None
