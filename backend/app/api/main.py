from fastapi import APIRouter

from app.api.routes import (
    cms_blog_categories,
    cms_blog_posts,
    cms_blog_tags,
    cms_media_folders,
    cms_menus,
    cms_pages,
    items,
    login,
    media,
    private,
    profiles,
    provinces,
    race_attributes,
    race_categories,
    race_registrations,
    race_results,
    races,
    roles,
    tags,
    users,
    utils,
)
from app.api.routes.races import admin_router as races_admin_router
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(roles.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(media.router)

# Race management routes
api_router.include_router(races.router)
api_router.include_router(race_categories.router)
api_router.include_router(race_registrations.router)
api_router.include_router(race_results.router)
api_router.include_router(race_attributes.router)

# Discovery & personalization routes
api_router.include_router(tags.router)
api_router.include_router(profiles.router)
api_router.include_router(provinces.router)

# CMS routes
api_router.include_router(cms_pages.router)
api_router.include_router(cms_blog_posts.router)
api_router.include_router(cms_blog_categories.router)
api_router.include_router(cms_blog_tags.router)
api_router.include_router(cms_menus.router)
api_router.include_router(cms_media_folders.router)

# Admin utilities
api_router.include_router(races_admin_router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
