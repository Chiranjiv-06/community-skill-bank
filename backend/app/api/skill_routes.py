"""
app/api/skill_routes.py

Skill management endpoints.

POST   /api/skills/           — Add a skill to your profile (auth required)
GET    /api/skills/categories — List canonical skill categories
GET    /api/skills/mine       — List only my skills (auth required)
GET    /api/skills/           — List all skills with search and filters (public)
GET    /api/skills/{skill_id} — Get single skill by ID (public)
PATCH  /api/skills/{skill_id} — Update a skill (owner or admin)
DELETE /api/skills/{skill_id} — Delete a skill (owner or admin)
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.models import Skill
from app.models.user import User
from app.schemas.schemas import SkillCreate, SkillUpdate, SkillOut
from app.utils.security import get_current_user


router = APIRouter(
    prefix="/api/skills",
    tags=["Skills"],
)

# Canonical disaster-response skill categories
CANONICAL_SKILL_CATEGORIES = [
    "Medical & First Aid",
    "Search & Rescue",
    "Firefighting & Hazard Control",
    "Logistics & Transportation",
    "Technical, Electrical & Mechanics",
    "Shelter & Food Management",
    "Communications & IT",
    "Psychological & Community Support",
    "General Emergency Assistance",
]


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
        experience_years=skill.experience_years,
        proficiency=skill.proficiency,
        owner_id=current_user.id,
    )
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    return new_skill


@router.get(
    "/categories",
    summary="List canonical disaster-response skill categories",
)
def get_skill_categories():
    """Return standard disaster-response skill categories for dropdowns."""
    return {"categories": CANONICAL_SKILL_CATEGORIES}


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
    summary="List all skills with search and filters",
)
def list_skills(
    category: Optional[str] = None,
    search: Optional[str] = None,
    proficiency: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    List all skills in the system.

    Supports:
    - category filter (e.g. ?category=Medical)
    - search query (e.g. ?search=cpr across title, description, category)
    - proficiency filter (e.g. ?proficiency=advanced)
    """
    query = db.query(Skill)

    if category:
        query = query.filter(Skill.category.ilike(f"%{category}%"))

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Skill.title.ilike(search_filter),
                Skill.description.ilike(search_filter),
                Skill.category.ilike(search_filter),
            )
        )

    if proficiency:
        query = query.filter(Skill.proficiency == proficiency)

    return query.order_by(Skill.created_at.desc()).all()


@router.get(
    "/{skill_id}",
    response_model=SkillOut,
    summary="Get a skill by ID",
)
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
):
    """Retrieve a single skill record by its ID."""
    skill = db.query(Skill).filter(Skill.id == skill_id).first()
    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )
    return skill


@router.patch(
    "/{skill_id}",
    response_model=SkillOut,
    summary="Update one of my skills",
)
def update_skill(
    skill_id: int,
    skill_update: SkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing skill by ID.

    Only the skill owner can update their own skill.
    Admins can update any skill.
    """
    skill = db.query(Skill).filter(Skill.id == skill_id).first()

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    if skill.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own skills",
        )

    update_data = skill_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(skill, field, value)

    db.commit()
    db.refresh(skill)
    return skill


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
