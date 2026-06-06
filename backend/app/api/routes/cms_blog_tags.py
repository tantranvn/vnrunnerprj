import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import AdminUser, SessionDep
from app.models import (
    BlogTag,
    BlogTagCreate,
    BlogTagPublic,
    BlogTagsPublic,
    BlogTagTranslationUpdate,
    BlogTagUpdate,
    Message,
)

router = APIRouter(prefix="/cms/blog/tags", tags=["cms-blog-tags"])


@router.get("/", response_model=BlogTagsPublic)
def read_blog_tags(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
) -> Any:
    """
    Retrieve all blog tags.
    """
    tags = crud.get_blog_tags(
        session=session, skip=skip, limit=limit, is_active=is_active
    )
    
    count_statement = select(func.count()).select_from(BlogTag)
    if is_active is not None:
        count_statement = count_statement.where(BlogTag.is_active == is_active)
    count = session.exec(count_statement).one()
    
    return BlogTagsPublic(data=tags, count=count)


@router.get("/{tag_id}", response_model=BlogTagPublic)
def read_blog_tag(session: SessionDep, tag_id: uuid.UUID) -> Any:
    """
    Get a specific blog tag by ID.
    """
    tag = crud.get_blog_tag(session=session, tag_id=tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Blog tag not found")
    return tag


@router.get("/by-slug/{slug}", response_model=BlogTagPublic)
def read_blog_tag_by_slug(session: SessionDep, slug: str) -> Any:
    """
    Get a specific blog tag by slug.
    """
    tag = crud.get_blog_tag_by_slug(session=session, slug=slug)
    if not tag:
        raise HTTPException(status_code=404, detail="Blog tag not found")
    return tag


@router.post("/", response_model=BlogTagPublic)
def create_blog_tag(
    *, session: SessionDep, current_user: AdminUser, tag_in: BlogTagCreate
) -> Any:
    """
    Create a new blog tag (admin only).
    """
    # Check if slug already exists
    existing = crud.get_blog_tag_by_slug(session=session, slug=tag_in.slug)
    if existing:
        raise HTTPException(
            status_code=400, detail="A blog tag with this slug already exists"
        )
    
    tag = crud.create_blog_tag(session=session, tag_create=tag_in)
    return tag


@router.put("/{tag_id}", response_model=BlogTagPublic)
def update_blog_tag(
    *,
    session: SessionDep,
    current_user: AdminUser,
    tag_id: uuid.UUID,
    tag_in: BlogTagUpdate,
) -> Any:
    """
    Update a blog tag (admin only).
    """
    db_tag = crud.get_blog_tag(session=session, tag_id=tag_id)
    if not db_tag:
        raise HTTPException(status_code=404, detail="Blog tag not found")
    
    # Check if slug is being changed and if it conflicts
    if tag_in.slug and tag_in.slug != db_tag.slug:
        existing = crud.get_blog_tag_by_slug(session=session, slug=tag_in.slug)
        if existing:
            raise HTTPException(
                status_code=400, detail="A blog tag with this slug already exists"
            )
    
    tag = crud.update_blog_tag(session=session, db_tag=db_tag, tag_in=tag_in)
    return tag


@router.delete("/{tag_id}")
def delete_blog_tag(
    session: SessionDep, current_user: AdminUser, tag_id: uuid.UUID
) -> Message:
    """
    Delete a blog tag (admin only).
    """
    success = crud.delete_blog_tag(session=session, tag_id=tag_id)
    if not success:
        raise HTTPException(status_code=404, detail="Blog tag not found")
    return Message(message="Blog tag deleted successfully")


@router.post("/{tag_id}/translations", response_model=BlogTagPublic)
def update_blog_tag_translation(
    *,
    session: SessionDep,
    current_user: AdminUser,
    tag_id: uuid.UUID,
    translation_in: BlogTagTranslationUpdate,
) -> Any:
    """
    Update or create a translation for a blog tag (admin only).
    """
    tag = crud.update_blog_tag_translation(
        session=session, tag_id=tag_id, translation_update=translation_in
    )
    if not tag:
        raise HTTPException(status_code=404, detail="Blog tag not found")
    return tag
