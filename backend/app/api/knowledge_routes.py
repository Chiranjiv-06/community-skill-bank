"""
app/api/knowledge_routes.py

FastAPI router for Module 15: RAG / Knowledge Assistant Foundation.
Provides administrative knowledge base management and user-facing deterministic knowledge retrieval.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentUpdate,
    KnowledgeDocumentOut,
    KnowledgeSearchOut,
    KnowledgeAssistantQuery,
    KnowledgeAssistantResponse,
)
from app.services.knowledge_service import (
    create_knowledge_document,
    update_knowledge_document,
    set_document_status,
    get_document_by_id,
    search_knowledge_documents,
    query_knowledge_assistant,
)
from app.utils.security import get_current_user, get_current_admin

router = APIRouter(prefix="/api/knowledge", tags=["Knowledge Base & Assistant"])


# ---------------------------------------------------------------------------
# Admin Knowledge Document Management
# ---------------------------------------------------------------------------

@router.post(
    "",
    response_model=KnowledgeDocumentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new knowledge article (Admin only)",
)
def create_knowledge_endpoint(
    doc_in: KnowledgeDocumentCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Create a new disaster response / emergency knowledge article.
    Initial status can be 'draft', 'published', or 'archived'.
    Access is restricted to platform administrators.
    """
    doc = create_knowledge_document(db=db, doc_in=doc_in, creator_id=current_admin.id)
    return doc


@router.patch(
    "/{document_id}",
    response_model=KnowledgeDocumentOut,
    summary="Update an existing knowledge article (Admin only)",
)
def update_knowledge_endpoint(
    document_id: int,
    doc_update: KnowledgeDocumentUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Update attributes of an existing knowledge document.
    Access is restricted to platform administrators.
    """
    doc = get_document_by_id(db=db, document_id=document_id, allow_non_published=True)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )
    return update_knowledge_document(db=db, document=doc, doc_update=doc_update)


@router.patch(
    "/{document_id}/publish",
    response_model=KnowledgeDocumentOut,
    summary="Publish a knowledge article (Admin only)",
)
def publish_knowledge_endpoint(
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Transition knowledge document status to 'published', making it searchable by all users.
    Access is restricted to platform administrators.
    """
    doc = get_document_by_id(db=db, document_id=document_id, allow_non_published=True)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )
    return set_document_status(db=db, document=doc, status="published")


@router.patch(
    "/{document_id}/archive",
    response_model=KnowledgeDocumentOut,
    summary="Archive a knowledge article (Admin only)",
)
def archive_knowledge_endpoint(
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    """
    Transition knowledge document status to 'archived', hiding it from standard user discovery without physical deletion.
    Access is restricted to platform administrators.
    """
    doc = get_document_by_id(db=db, document_id=document_id, allow_non_published=True)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )
    return set_document_status(db=db, document=doc, status="archived")


# ---------------------------------------------------------------------------
# Knowledge Discovery & Assistant Search
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=KnowledgeSearchOut,
    summary="Search knowledge documents",
)
def list_knowledge_endpoint(
    q: Optional[str] = Query(None, description="Search keyword query across title, description, and content"),
    disaster_type: Optional[str] = Query(None, description="Filter by disaster type (e.g. flood, earthquake, fire)"),
    category: Optional[str] = Query(None, description="Filter by category (e.g. first_aid, rescue, evacuation)"),
    status: Optional[str] = Query(None, description="Filter by status (Admin only: draft, published, archived)"),
    limit: int = Query(20, ge=1, le=100, description="Pagination limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Search and filter verified knowledge base documents:
    - Normal users strictly view 'published' documents.
    - Platform administrators may query or filter across 'draft', 'published', and 'archived' articles.
    """
    is_admin = (current_user.role == "admin")
    total_count, docs = search_knowledge_documents(
        db=db,
        q=q,
        disaster_type=disaster_type,
        category=category,
        status=status if is_admin else None,
        is_admin=is_admin,
        limit=limit,
        offset=offset,
    )
    return KnowledgeSearchOut(total_count=total_count, results=docs)


@router.get(
    "/assistant",
    response_model=KnowledgeAssistantResponse,
    summary="Query Knowledge Assistant via GET (Convenience)",
)
def get_knowledge_assistant_endpoint(
    question: str = Query(..., min_length=2, max_length=500, description="Inquiry question or phrase"),
    disaster_type: Optional[str] = Query(None, description="Optional disaster type filter"),
    category: Optional[str] = Query(None, description="Optional skill/domain category filter"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of relevant articles to retrieve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve relevant disaster knowledge articles using deterministic keyword & metadata ranking.
    """
    query_obj = KnowledgeAssistantQuery(
        question=question,
        disaster_type=disaster_type,
        category=category,
        limit=limit,
    )
    is_admin = (current_user.role == "admin")
    return query_knowledge_assistant(db=db, query_in=query_obj, is_admin=is_admin)


@router.post(
    "/assistant",
    response_model=KnowledgeAssistantResponse,
    summary="Query Knowledge Assistant (Deterministic Retrieval)",
)
def post_knowledge_assistant_endpoint(
    query_in: KnowledgeAssistantQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Safe Knowledge Assistant Retrieval Endpoint:
    - Tokenizes inquiry and computes deterministic relevance scores across published knowledge.
    - Returns ranked source documents with matched terms and citation sources.
    - Does not generate unverified facts or call external AI APIs.
    """
    is_admin = (current_user.role == "admin")
    return query_knowledge_assistant(db=db, query_in=query_in, is_admin=is_admin)


@router.get(
    "/{document_id}",
    response_model=KnowledgeDocumentOut,
    summary="Get knowledge article by ID",
)
def get_knowledge_document_endpoint(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve full details of a knowledge document by ID:
    - Normal users can only retrieve 'published' articles.
    - Draft or archived documents return 404 for non-admin callers.
    """
    is_admin = (current_user.role == "admin")
    doc = get_document_by_id(db=db, document_id=document_id, allow_non_published=is_admin)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )
    return doc
