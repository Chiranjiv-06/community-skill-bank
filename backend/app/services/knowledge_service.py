"""
app/services/knowledge_service.py

Deterministic, rule-based Knowledge Retrieval & Assistant Service for Community Skill Bank (Module 15).
Manages disaster response knowledge articles, administrative document lifecycles (draft/published/archived),
and safe, explainable knowledge retrieval without external AI APIs or LLM dependencies.
"""

import re
from typing import List, Tuple, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.knowledge_document import KnowledgeDocument
from app.models.user import User
from app.schemas.schemas import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentUpdate,
    KnowledgeDocumentOut,
    KnowledgeAssistantQuery,
    KnowledgeAssistantResultItem,
    KnowledgeAssistantResponse,
)

STOPWORDS: Set[str] = {
    "a", "about", "after", "all", "also", "an", "and", "any", "are", "as", "at",
    "be", "because", "been", "before", "being", "between", "both", "but", "by",
    "can", "could", "did", "do", "does", "doing", "down", "during", "each",
    "for", "from", "further", "had", "has", "have", "having", "he", "her",
    "here", "hers", "herself", "him", "himself", "his", "how", "i", "if",
    "in", "into", "is", "it", "its", "itself", "just", "me", "more", "most",
    "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own",
    "same", "she", "should", "so", "some", "such", "than", "that", "the",
    "their", "theirs", "them", "themselves", "then", "there", "these", "they",
    "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "we", "were", "what", "when", "where", "which", "while", "who",
    "whom", "why", "will", "with", "would", "you", "your", "yours", "yourself",
}


def _clean(val: Optional[str]) -> str:
    """Normalize text: stripped, lowercase."""
    return val.strip().lower() if val else ""


def _tokenize(text: str) -> List[str]:
    """Extract clean alphanumeric query terms excluding standard stopwords."""
    words = re.findall(r"\b[a-zA-Z0-9_-]+\b", text.lower())
    return [w for w in words if len(w) >= 2 and w not in STOPWORDS]


def create_knowledge_document(
    db: Session,
    doc_in: KnowledgeDocumentCreate,
    creator_id: int,
) -> KnowledgeDocument:
    """Create a new knowledge article (admin only)."""
    doc = KnowledgeDocument(
        title=doc_in.title.strip(),
        content=doc_in.content.strip(),
        description=doc_in.description.strip() if doc_in.description else None,
        category=_clean(doc_in.category),
        disaster_type=_clean(doc_in.disaster_type),
        source=doc_in.source.strip(),
        source_url=doc_in.source_url.strip() if doc_in.source_url else None,
        status=_clean(doc_in.status) or "draft",
        created_by_id=creator_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def update_knowledge_document(
    db: Session,
    document: KnowledgeDocument,
    doc_update: KnowledgeDocumentUpdate,
) -> KnowledgeDocument:
    """Update fields on an existing knowledge document (admin only)."""
    update_data = doc_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            if field in ["category", "disaster_type", "status"]:
                setattr(document, field, _clean(val))
            elif isinstance(val, str):
                setattr(document, field, val.strip())
            else:
                setattr(document, field, val)

    db.commit()
    db.refresh(document)
    return document


def set_document_status(
    db: Session,
    document: KnowledgeDocument,
    status: str,
) -> KnowledgeDocument:
    """Set status transition on a knowledge document (e.g., publish, archive)."""
    document.status = _clean(status)
    db.commit()
    db.refresh(document)
    return document


def get_document_by_id(
    db: Session,
    document_id: int,
    allow_non_published: bool = False,
) -> Optional[KnowledgeDocument]:
    """Retrieve document by ID with strict status isolation for non-admin callers."""
    query = db.query(KnowledgeDocument).filter(KnowledgeDocument.id == document_id)
    if not allow_non_published:
        query = query.filter(KnowledgeDocument.status == "published")
    return query.first()


def search_knowledge_documents(
    db: Session,
    q: Optional[str] = None,
    disaster_type: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    is_admin: bool = False,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[int, List[KnowledgeDocument]]:
    """
    Search and filter knowledge documents.
    - Normal users strictly receive published documents.
    - Admins can query any status or filter by specific status.
    """
    query = db.query(KnowledgeDocument)

    # Status isolation guard
    if not is_admin:
        query = query.filter(KnowledgeDocument.status == "published")
    elif status:
        query = query.filter(KnowledgeDocument.status == _clean(status))

    # Disaster type filter
    if disaster_type:
        dt_clean = _clean(disaster_type)
        if dt_clean not in ["all", "any"]:
            query = query.filter(
                or_(
                    KnowledgeDocument.disaster_type == dt_clean,
                    KnowledgeDocument.disaster_type.in_(["all", "general"]),
                )
            )

    # Category filter
    if category:
        cat_clean = _clean(category)
        if cat_clean not in ["all", "any"]:
            query = query.filter(KnowledgeDocument.category == cat_clean)

    # Text search filter
    if q and q.strip():
        search_term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                KnowledgeDocument.title.ilike(search_term),
                KnowledgeDocument.description.ilike(search_term),
                KnowledgeDocument.content.ilike(search_term),
                KnowledgeDocument.category.ilike(search_term),
                KnowledgeDocument.disaster_type.ilike(search_term),
                KnowledgeDocument.source.ilike(search_term),
            )
        )

    total_count = query.count()
    documents = (
        query.order_by(KnowledgeDocument.updated_at.desc(), KnowledgeDocument.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return total_count, documents


def query_knowledge_assistant(
    db: Session,
    query_in: KnowledgeAssistantQuery,
    is_admin: bool = False,
) -> KnowledgeAssistantResponse:
    """
    Deterministic Knowledge Assistant Retrieval Engine.
    - Matches query terms against published disaster knowledge base.
    - Ranks by exact title matching, keyword overlaps, category/disaster-type relevance.
    - Formats structured results with source citations.
    - Zero stochastic generation or hallucinated text.
    """
    raw_question = query_in.question.strip()
    query_tokens = _tokenize(raw_question)
    disaster_filter = _clean(query_in.disaster_type) if query_in.disaster_type else None
    category_filter = _clean(query_in.category) if query_in.category else None
    limit = max(1, min(query_in.limit, 20))

    # Base candidate pool (strictly published for normal users)
    base_query = db.query(KnowledgeDocument)
    if not is_admin:
        base_query = base_query.filter(KnowledgeDocument.status == "published")

    # If filters specified, pre-filter or include generic articles
    if disaster_filter and disaster_filter not in ["all", "any"]:
        base_query = base_query.filter(
            or_(
                KnowledgeDocument.disaster_type == disaster_filter,
                KnowledgeDocument.disaster_type.in_(["all", "general"]),
            )
        )

    if category_filter and category_filter not in ["all", "any"]:
        base_query = base_query.filter(KnowledgeDocument.category == category_filter)

    candidates: List[KnowledgeDocument] = base_query.all()

    scored_items: List[Tuple[float, List[str], KnowledgeDocument]] = []
    question_lower = raw_question.lower()

    for doc in candidates:
        doc_title_lower = doc.title.lower()
        doc_cat_lower = doc.category.lower()
        doc_disaster_lower = doc.disaster_type.lower()
        doc_content_lower = doc.content.lower()
        doc_desc_lower = (doc.description or "").lower()

        relevance_score = 0.0
        matched_terms: Set[str] = set()

        # 1. Exact phrase match in title (+50.0)
        if len(raw_question) > 3 and raw_question.lower() in doc_title_lower:
            relevance_score += 50.0
            matched_terms.add("exact_title_phrase")

        # 2. Token matching in title (+15.0 per term)
        for token in query_tokens:
            if token in doc_title_lower:
                relevance_score += 15.0
                matched_terms.add(token)

        # 3. Token matching in category & disaster_type (+10.0 per term)
        for token in query_tokens:
            if token in doc_cat_lower:
                relevance_score += 10.0
                matched_terms.add(token)
            if token in doc_disaster_lower:
                relevance_score += 10.0
                matched_terms.add(token)

        # 4. Content & description token matching (+2.0 per term, max +30.0)
        content_score = 0.0
        for token in query_tokens:
            if token in doc_content_lower or token in doc_desc_lower:
                content_score += 2.0
                matched_terms.add(token)
        relevance_score += min(30.0, content_score)

        # 5. Explicit filter boosts (+10.0)
        if disaster_filter and (doc_disaster_lower == disaster_filter or doc_disaster_lower == "all"):
            relevance_score += 10.0
        if category_filter and doc_cat_lower == category_filter:
            relevance_score += 10.0

        # Keep candidate if score > 0 or if explicitly matching filter query
        if relevance_score > 0.0 or (not query_tokens and (disaster_filter or category_filter)):
            scored_items.append((relevance_score, sorted(list(matched_terms)), doc))

    # Sort deterministically by relevance_score DESC, updated_at DESC, id ASC
    scored_items.sort(
        key=lambda item: (
            -item[0],
            -item[2].updated_at.timestamp() if item[2].updated_at else 0.0,
            item[2].id,
        )
    )

    top_items = scored_items[:limit]
    result_items: List[KnowledgeAssistantResultItem] = []

    for score, terms, doc in top_items:
        result_items.append(
            KnowledgeAssistantResultItem(
                document_id=doc.id,
                title=doc.title,
                category=doc.category,
                disaster_type=doc.disaster_type,
                content=doc.content,
                summary=doc.description,
                source=doc.source,
                source_url=doc.source_url,
                relevance_score=round(score, 2),
                matched_terms=terms,
            )
        )

    message = None
    if len(result_items) == 0:
        message = "No matching knowledge articles found for the provided inquiry."

    return KnowledgeAssistantResponse(
        question=raw_question,
        disaster_type_filter=disaster_filter,
        category_filter=category_filter,
        total_found=len(result_items),
        results=result_items,
        retrieval_strategy="deterministic_keyword_and_metadata_ranking",
        message=message,
    )
