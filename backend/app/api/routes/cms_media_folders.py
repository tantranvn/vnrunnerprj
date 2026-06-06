import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import AdminUser, SessionDep
from app.models import (
    MediaFolder,
    MediaFolderCreate,
    MediaFolderPublic,
    MediaFoldersPublic,
    MediaFolderUpdate,
    Message,
)

router = APIRouter(prefix="/cms/media/folders", tags=["cms-media-folders"])


@router.get("/", response_model=MediaFoldersPublic)
def read_media_folders(
    session: SessionDep,
    current_user: AdminUser,
    skip: int = 0,
    limit: int = 100,
    parent_id: uuid.UUID | None = Query(default=None, description="Filter by parent folder"),
) -> Any:
    """
    Retrieve all media folders (admin only).
    """
    folders = crud.get_media_folders(
        session=session, skip=skip, limit=limit, parent_id=parent_id
    )
    
    count_statement = select(func.count()).select_from(MediaFolder)
    if parent_id is not None:
        count_statement = count_statement.where(MediaFolder.parent_id == parent_id)
    else:
        count_statement = count_statement.where(MediaFolder.parent_id.is_(None))
    count = session.exec(count_statement).one()
    
    return MediaFoldersPublic(data=folders, count=count)


@router.get("/{folder_id}", response_model=MediaFolderPublic)
def read_media_folder(
    session: SessionDep, current_user: AdminUser, folder_id: uuid.UUID
) -> Any:
    """
    Get a specific media folder by ID (admin only).
    """
    folder = crud.get_media_folder(session=session, folder_id=folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Media folder not found")
    return folder


@router.post("/", response_model=MediaFolderPublic)
def create_media_folder(
    *, session: SessionDep, current_user: AdminUser, folder_in: MediaFolderCreate
) -> Any:
    """
    Create a new media folder (admin only).
    """
    # Verify parent folder exists if specified
    if folder_in.parent_id:
        parent = crud.get_media_folder(session=session, folder_id=folder_in.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    
    folder = crud.create_media_folder(
        session=session, folder_create=folder_in, created_by_id=current_user.id
    )
    return folder


@router.put("/{folder_id}", response_model=MediaFolderPublic)
def update_media_folder(
    *,
    session: SessionDep,
    current_user: AdminUser,
    folder_id: uuid.UUID,
    folder_in: MediaFolderUpdate,
) -> Any:
    """
    Update a media folder (admin only).
    """
    db_folder = crud.get_media_folder(session=session, folder_id=folder_id)
    if not db_folder:
        raise HTTPException(status_code=404, detail="Media folder not found")
    
    # Verify parent folder exists if being changed
    if folder_in.parent_id and folder_in.parent_id != db_folder.parent_id:
        parent = crud.get_media_folder(session=session, folder_id=folder_in.parent_id)
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
        
        # Prevent circular references
        if folder_in.parent_id == folder_id:
            raise HTTPException(
                status_code=400, detail="A folder cannot be its own parent"
            )
    
    folder = crud.update_media_folder(
        session=session, db_folder=db_folder, folder_in=folder_in
    )
    return folder


@router.delete("/{folder_id}")
def delete_media_folder(
    session: SessionDep, current_user: AdminUser, folder_id: uuid.UUID
) -> Message:
    """
    Delete a media folder (admin only).
    """
    success = crud.delete_media_folder(session=session, folder_id=folder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Media folder not found")
    return Message(message="Media folder deleted successfully")
