import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import AdminUser, CurrentUser, SessionDep
from app.models import (
    BlogPost,
    BlogPostCreate,
    BlogPostPublic,
    BlogPostsPublic,
    BlogPostStatusEnum,
    BlogPostTranslationUpdate,
    BlogPostUpdate,
    Message,
)

router = APIRouter(prefix="/cms/blog/posts", tags=["cms-blog-posts"])


@router.get("/", response_model=BlogPostsPublic)
def read_blog_posts(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    status: str | None = Query(default=None, description="Filter by status"),
    category_id: uuid.UUID | None = Query(default=None, description="Filter by category"),
    tag_id: uuid.UUID | None = Query(default=None, description="Filter by tag"),
    is_featured: bool | None = Query(default=None, description="Filter by featured"),
    author_id: uuid.UUID | None = Query(default=None, description="Filter by author"),
) -> Any:
    """
    Retrieve all blog posts (public access for published, admin for all).
    """
    posts = crud.get_blog_posts(
        session=session,
        skip=skip,
        limit=limit,
        status=status,
        category_id=category_id,
        tag_id=tag_id,
        is_featured=is_featured,
        author_id=author_id,
    )
    
    count_statement = select(func.count()).select_from(BlogPost)
    if status:
        count_statement = count_statement.where(BlogPost.status == BlogPostStatusEnum(status))
    if category_id:
        count_statement = count_statement.where(BlogPost.category_id == category_id)
    if is_featured is not None:
        count_statement = count_statement.where(BlogPost.is_featured == is_featured)
    if author_id:
        count_statement = count_statement.where(BlogPost.author_id == author_id)
    count = session.exec(count_statement).one()
    
    return BlogPostsPublic(data=posts, count=count)


@router.get("/{post_id}", response_model=BlogPostPublic)
def read_blog_post(session: SessionDep, post_id: uuid.UUID) -> Any:
    """
    Get a specific blog post by ID.
    """
    post = crud.get_blog_post(session=session, post_id=post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Increment view count
    crud.increment_blog_post_view_count(session=session, post_id=post_id)
    
    return post


@router.get("/by-slug/{slug}", response_model=BlogPostPublic)
def read_blog_post_by_slug(session: SessionDep, slug: str) -> Any:
    """
    Get a specific blog post by slug (public access).
    """
    post = crud.get_blog_post_by_slug(session=session, slug=slug)
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Only return published posts for non-admin users
    if post.status != BlogPostStatusEnum.PUBLISHED:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Increment view count
    crud.increment_blog_post_view_count(session=session, post_id=post.id)
    
    return post


@router.post("/", response_model=BlogPostPublic)
def create_blog_post(
    *, session: SessionDep, current_user: AdminUser, post_in: BlogPostCreate
) -> Any:
    """
    Create a new blog post (admin only).
    """
    # Check if slug already exists
    existing = crud.get_blog_post_by_slug(session=session, slug=post_in.slug)
    if existing:
        raise HTTPException(status_code=400, detail="A blog post with this slug already exists")
    
    post = crud.create_blog_post(
        session=session, post_create=post_in, author_id=current_user.id
    )
    return post


@router.put("/{post_id}", response_model=BlogPostPublic)
def update_blog_post(
    *,
    session: SessionDep,
    current_user: AdminUser,
    post_id: uuid.UUID,
    post_in: BlogPostUpdate,
) -> Any:
    """
    Update a blog post (admin only).
    """
    db_post = crud.get_blog_post(session=session, post_id=post_id)
    if not db_post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Check if slug is being changed and if it conflicts
    if post_in.slug and post_in.slug != db_post.slug:
        existing = crud.get_blog_post_by_slug(session=session, slug=post_in.slug)
        if existing:
            raise HTTPException(status_code=400, detail="A blog post with this slug already exists")
    
    post = crud.update_blog_post(
        session=session, db_post=db_post, post_in=post_in, updated_by_id=current_user.id
    )
    return post


@router.delete("/{post_id}")
def delete_blog_post(
    session: SessionDep, current_user: AdminUser, post_id: uuid.UUID
) -> Message:
    """
    Delete a blog post (admin only).
    """
    success = crud.delete_blog_post(session=session, post_id=post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return Message(message="Blog post deleted successfully")


@router.post("/{post_id}/translations", response_model=BlogPostPublic)
def update_blog_post_translation(
    *,
    session: SessionDep,
    current_user: AdminUser,
    post_id: uuid.UUID,
    translation_in: BlogPostTranslationUpdate,
) -> Any:
    """
    Update or create a translation for a blog post (admin only).
    """
    post = crud.update_blog_post_translation(
        session=session, post_id=post_id, translation_update=translation_in
    )
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post
