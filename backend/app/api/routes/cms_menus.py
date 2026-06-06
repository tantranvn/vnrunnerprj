import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlmodel import func, select

from app import crud
from app.api.deps import AdminUser, SessionDep
from app.models import (
    Menu,
    MenuCreate,
    MenuItem,
    MenuItemCreate,
    MenuItemPublic,
    MenuItemsPublic,
    MenuItemTranslationUpdate,
    MenuItemUpdate,
    MenuPublic,
    MenusPublic,
    MenuUpdate,
    Message,
)

router = APIRouter(prefix="/cms/menus", tags=["cms-menus"])


@router.get("/", response_model=MenusPublic)
def read_menus(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    location: str | None = Query(default=None, description="Filter by location"),
) -> Any:
    """
    Retrieve all menus.
    """
    menus = crud.get_menus(
        session=session, skip=skip, limit=limit, location=location
    )
    
    count_statement = select(func.count()).select_from(Menu)
    if location:
        count_statement = count_statement.where(Menu.location == location)
    count = session.exec(count_statement).one()
    
    return MenusPublic(data=menus, count=count)


@router.get("/{menu_id}", response_model=MenuPublic)
def read_menu(session: SessionDep, menu_id: uuid.UUID) -> Any:
    """
    Get a specific menu by ID.
    """
    menu = crud.get_menu(session=session, menu_id=menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.get("/by-slug/{slug}", response_model=MenuPublic)
def read_menu_by_slug(session: SessionDep, slug: str) -> Any:
    """
    Get a specific menu by slug.
    """
    menu = crud.get_menu_by_slug(session=session, slug=slug)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.post("/", response_model=MenuPublic)
def create_menu(
    *, session: SessionDep, current_user: AdminUser, menu_in: MenuCreate
) -> Any:
    """
    Create a new menu (admin only).
    """
    # Check if slug already exists
    existing = crud.get_menu_by_slug(session=session, slug=menu_in.slug)
    if existing:
        raise HTTPException(
            status_code=400, detail="A menu with this slug already exists"
        )
    
    menu = crud.create_menu(session=session, menu_create=menu_in)
    return menu


@router.put("/{menu_id}", response_model=MenuPublic)
def update_menu(
    *,
    session: SessionDep,
    current_user: AdminUser,
    menu_id: uuid.UUID,
    menu_in: MenuUpdate,
) -> Any:
    """
    Update a menu (admin only).
    """
    db_menu = crud.get_menu(session=session, menu_id=menu_id)
    if not db_menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    # Check if slug is being changed and if it conflicts
    if menu_in.slug and menu_in.slug != db_menu.slug:
        existing = crud.get_menu_by_slug(session=session, slug=menu_in.slug)
        if existing:
            raise HTTPException(
                status_code=400, detail="A menu with this slug already exists"
            )
    
    menu = crud.update_menu(session=session, db_menu=db_menu, menu_in=menu_in)
    return menu


@router.delete("/{menu_id}")
def delete_menu(
    session: SessionDep, current_user: AdminUser, menu_id: uuid.UUID
) -> Message:
    """
    Delete a menu (admin only).
    """
    success = crud.delete_menu(session=session, menu_id=menu_id)
    if not success:
        raise HTTPException(status_code=404, detail="Menu not found")
    return Message(message="Menu deleted successfully")


# MenuItem endpoints


@router.get("/{menu_id}/items", response_model=MenuItemsPublic)
def read_menu_items(
    session: SessionDep,
    menu_id: uuid.UUID,
    parent_id: uuid.UUID | None = Query(default=None, description="Filter by parent"),
) -> Any:
    """
    Get all items for a menu.
    """
    # Verify menu exists
    menu = crud.get_menu(session=session, menu_id=menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    items = crud.get_menu_items(
        session=session, menu_id=menu_id, parent_id=parent_id
    )
    
    count_statement = select(func.count()).select_from(MenuItem).where(
        MenuItem.menu_id == menu_id
    )
    if parent_id is not None:
        count_statement = count_statement.where(MenuItem.parent_id == parent_id)
    else:
        count_statement = count_statement.where(MenuItem.parent_id.is_(None))
    count = session.exec(count_statement).one()
    
    return MenuItemsPublic(data=items, count=count)


@router.post("/{menu_id}/items", response_model=MenuItemPublic)
def create_menu_item(
    *,
    session: SessionDep,
    current_user: AdminUser,
    menu_id: uuid.UUID,
    item_in: MenuItemCreate,
) -> Any:
    """
    Create a new menu item (admin only).
    """
    # Verify menu exists
    menu = crud.get_menu(session=session, menu_id=menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    
    # Ensure menu_id matches
    if item_in.menu_id != menu_id:
        raise HTTPException(status_code=400, detail="Menu ID mismatch")
    
    item = crud.create_menu_item(session=session, item_create=item_in)
    return item


@router.get("/items/{item_id}", response_model=MenuItemPublic)
def read_menu_item(session: SessionDep, item_id: uuid.UUID) -> Any:
    """
    Get a specific menu item by ID.
    """
    item = crud.get_menu_item(session=session, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item


@router.put("/items/{item_id}", response_model=MenuItemPublic)
def update_menu_item(
    *,
    session: SessionDep,
    current_user: AdminUser,
    item_id: uuid.UUID,
    item_in: MenuItemUpdate,
) -> Any:
    """
    Update a menu item (admin only).
    """
    db_item = crud.get_menu_item(session=session, item_id=item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    item = crud.update_menu_item(session=session, db_item=db_item, item_in=item_in)
    return item


@router.delete("/items/{item_id}")
def delete_menu_item(
    session: SessionDep, current_user: AdminUser, item_id: uuid.UUID
) -> Message:
    """
    Delete a menu item (admin only).
    """
    success = crud.delete_menu_item(session=session, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return Message(message="Menu item deleted successfully")


@router.post("/items/{item_id}/translations", response_model=MenuItemPublic)
def update_menu_item_translation(
    *,
    session: SessionDep,
    current_user: AdminUser,
    item_id: uuid.UUID,
    translation_in: MenuItemTranslationUpdate,
) -> Any:
    """
    Update or create a translation for a menu item (admin only).
    """
    item = crud.update_menu_item_translation(
        session=session, item_id=item_id, translation_update=translation_in
    )
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return item
