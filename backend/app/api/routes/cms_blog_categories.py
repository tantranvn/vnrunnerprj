import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import AdminUser, SessionDep
from app.models import (
    BlogCategoriesPublic,
    BlogCategory,
    BlogCategoryCreate,
    BlogCategoryPublic,
    BlogCategoryTranslationUpdate,
    BlogCategoryUpdate,
    Message,
)

router = APIRouter(prefix="/cms/blog/categories", tags=["cms-blog-categories"])


@router.get("/", response_model=BlogCategoriesPublic)
def read_blog_categories(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
) -> Any:
    """
    Retrieve all blog categories.
    """
    categories = crud.get_blog_categories(
        session=session, skip=skip, limit=limit, is_active=is_active
    )
    
    count_statement = select(func.count()).select_from(BlogCategory)
    if is_active is not None:
        count_statement = count_statement.where(BlogCategory.is_active == is_active)
    count = session.exec(count_statement).one()
    
    return BlogCategoriesPublic(data=categories, count=count)


@router.get("/{category_id}", response_model=BlogCategoryPublic)
def read_blog_category(session: SessionDep, category_id: uuid.UUID) -> Any:
    """
    Get a specific blog category by ID.
    """
    category = crud.get_blog_category(session=session, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Blog category not found")
    return category


@router.get("/by-slug/{slug}", response_model=BlogCategoryPublic)
def read_blog_category_by_slug(session: SessionDep, slug: str) -> Any:
    """
    Get a specific blog category by slug.
    """
    category = crud.get_blog_category_by_slug(session=session, slug=slug)
    if not category:
        raise HTTPException(status_code=404, detail="Blog category not found")
    return category


@router.post("/", response_model=BlogCategoryPublic)
def create_blog_category(
    *, session: SessionDep, current_user: AdminUser, category_in: BlogCategoryCreate
) -> Any:
    """
    Create a new blog category (admin only).
    """
    # Check if slug already exists
    existing = crud.get_blog_category_by_slug(session=session, slug=category_in.slug)
    if existing:
        raise HTTPException(
            status_code=400, detail="A blog category with this slug already exists"
        )
    
    category = crud.create_blog_category(session=session, category_create=category_in)
    return category


@router.put("/{category_id}", response_model=BlogCategoryPublic)
def update_blog_category(
    *,
    session: SessionDep,
    current_user: AdminUser,
    category_id: uuid.UUID,
    category_in: BlogCategoryUpdate,
) -> Any:
    """
    Update a blog category (admin only).
    """
    db_category = crud.get_blog_category(session=session, category_id=category_id)
    if not db_category:
        raise HTTPException(status_code=404, detail="Blog category not found")
    
    # Check if slug is being changed and if it conflicts
    if category_in.slug and category_in.slug != db_category.slug:
        existing = crud.get_blog_category_by_slug(session=session, slug=category_in.slug)
        if existing:
            raise HTTPException(
                status_code=400, detail="A blog category with this slug already exists"
            )
    
    category = crud.update_blog_category(
        session=session, db_category=db_category, category_in=category_in
    )
    return category


@router.delete("/{category_id}")
def delete_blog_category(
    session: SessionDep, current_user: AdminUser, category_id: uuid.UUID
) -> Message:
    """
    Delete a blog category (admin only).
    """
    success = crud.delete_blog_category(session=session, category_id=category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Blog category not found")
    return Message(message="Blog category deleted successfully")


@router.post("/{category_id}/translations", response_model=BlogCategoryPublic)
def update_blog_category_translation(
    *,
    session: SessionDep,
    current_user: AdminUser,
    category_id: uuid.UUID,
    translation_in: BlogCategoryTranslationUpdate,
) -> Any:
    """
    Update or create a translation for a blog category (admin only).
    """
    category = crud.update_blog_category_translation(
        session=session, category_id=category_id, translation_update=translation_in
    )
    if not category:
        raise HTTPException(status_code=404, detail="Blog category not found")
    return category
