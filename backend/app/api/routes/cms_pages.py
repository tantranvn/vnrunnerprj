import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import AdminUser, SessionDep
from app.models import (
    Message,
    Page,
    PageCreate,
    PagePublic,
    PagesPublic,
    PageStatusEnum,
    PageTranslationUpdate,
    PageUpdate,
)

router = APIRouter(prefix="/cms/pages", tags=["cms-pages"])


@router.get("/", response_model=PagesPublic)
def read_pages(
    session: SessionDep,
    current_user: AdminUser,
    skip: int = 0,
    limit: int = 100,
    status: str | None = Query(default=None, description="Filter by status"),
    is_homepage: bool | None = Query(default=None, description="Filter by homepage"),
) -> Any:
    """
    Retrieve all CMS pages (admin only).
    """
    pages = crud.get_pages(
        session=session, skip=skip, limit=limit, status=status, is_homepage=is_homepage
    )
    
    count_statement = select(func.count()).select_from(Page)
    if status:
        count_statement = count_statement.where(Page.status == PageStatusEnum(status))
    if is_homepage is not None:
        count_statement = count_statement.where(Page.is_homepage == is_homepage)
    count = session.exec(count_statement).one()
    
    return PagesPublic(data=pages, count=count)


@router.get("/{page_id}", response_model=PagePublic)
def read_page(
    session: SessionDep, current_user: AdminUser, page_id: uuid.UUID
) -> Any:
    """
    Get a specific CMS page by ID (admin only).
    """
    page = crud.get_page(session=session, page_id=page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.get("/by-slug/{slug}", response_model=PagePublic)
def read_page_by_slug(
    session: SessionDep, slug: str
) -> Any:
    """
    Get a specific CMS page by slug (public access).
    """
    page = crud.get_page_by_slug(session=session, slug=slug)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Only return published pages for non-admin users
    if page.status != PageStatusEnum.PUBLISHED:
        raise HTTPException(status_code=404, detail="Page not found")
    
    return page


@router.post("/", response_model=PagePublic)
def create_page(
    *, session: SessionDep, current_user: AdminUser, page_in: PageCreate
) -> Any:
    """
    Create a new CMS page (admin only).
    """
    # Check if slug already exists
    existing = crud.get_page_by_slug(session=session, slug=page_in.slug)
    if existing:
        raise HTTPException(status_code=400, detail="A page with this slug already exists")
    
    page = crud.create_page(
        session=session, page_create=page_in, created_by_id=current_user.id
    )
    return page


@router.put("/{page_id}", response_model=PagePublic)
def update_page(
    *,
    session: SessionDep,
    current_user: AdminUser,
    page_id: uuid.UUID,
    page_in: PageUpdate,
) -> Any:
    """
    Update a CMS page (admin only).
    """
    db_page = crud.get_page(session=session, page_id=page_id)
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Check if slug is being changed and if it conflicts
    if page_in.slug and page_in.slug != db_page.slug:
        existing = crud.get_page_by_slug(session=session, slug=page_in.slug)
        if existing:
            raise HTTPException(status_code=400, detail="A page with this slug already exists")
    
    page = crud.update_page(
        session=session, db_page=db_page, page_in=page_in, updated_by_id=current_user.id
    )
    return page


@router.delete("/{page_id}")
def delete_page(
    session: SessionDep, current_user: AdminUser, page_id: uuid.UUID
) -> Message:
    """
    Delete a CMS page (admin only).
    """
    success = crud.delete_page(session=session, page_id=page_id)
    if not success:
        raise HTTPException(status_code=404, detail="Page not found")
    return Message(message="Page deleted successfully")


@router.post("/{page_id}/translations", response_model=PagePublic)
def update_page_translation(
    *,
    session: SessionDep,
    current_user: AdminUser,
    page_id: uuid.UUID,
    translation_in: PageTranslationUpdate,
) -> Any:
    """
    Update or create a translation for a page (admin only).
    """
    page = crud.update_page_translation(
        session=session, page_id=page_id, translation_update=translation_in
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page
