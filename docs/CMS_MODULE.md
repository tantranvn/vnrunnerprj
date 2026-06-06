# CMS Module Documentation

## Overview

A comprehensive Content Management System (CMS) module has been implemented for the VNRunner platform with the following features:

- **Pages Management** - Create, edit, and manage static/dynamic pages
- **Blog/Articles** - Full-featured blog system with categories and tags
- **Navigation/Menu Management** - Manage site menus and hierarchies
- **SEO Management** - Complete SEO meta tags, Open Graph, and structured data
- **Media Library** - Enhanced media management with folder organization
- **Multilingual Content** - Full translation support for all CMS content

**Access Control:** Admin-only (all CMS features require admin role)

## Database Models

### Core CMS Models

#### 1. Page
Static and dynamic pages with full SEO support.

**Fields:**
- `title`, `slug`, `content`, `excerpt`
- SEO fields: `meta_title`, `meta_description`, `meta_keywords`, `og_title`, `og_description`, `og_image_url`, `canonical_url`
- Publishing: `status` (draft/published/scheduled/archived), `published_at`, `scheduled_at`
- Layout: `template`, `is_homepage`, `is_visible_in_menu`, `display_order`
- Multilingual: `default_language`, `translations` (JSON)
- Metadata: `page_metadata` (JSON)

#### 2. BlogPost
Blog articles with rich features.

**Fields:**
- `title`, `slug`, `content`, `excerpt`
- Featured image: `featured_image_url`, `featured_image_alt`
- SEO fields: Same as Page
- Publishing: `status`, `published_at`, `scheduled_at`
- Features: `is_featured`, `is_sticky`
- Engagement: `view_count`, `like_count`, `comment_count`
- Reading time: `reading_time_minutes`
- Relations: `category_id`, `author_id`, `updated_by_id`
- Tags: Many-to-many relationship via `BlogTagLink`

#### 3. BlogCategory
Hierarchical categories for blog posts.

**Fields:**
- `name`, `slug`, `description`
- `parent_id` (for hierarchy)
- `is_active`, `display_order`
- SEO: `meta_title`, `meta_description`
- Multilingual: `translations` (JSON)

#### 4. BlogTag
Tags for categorizing blog posts.

**Fields:**
- `name`, `slug`
- `is_active`
- Multilingual: `translations` (JSON)

#### 5. Menu
Navigation menu containers.

**Fields:**
- `name`, `slug`, `description`
- `location` (header, footer, sidebar, etc.)
- `is_active`

#### 6. MenuItem
Individual menu items with hierarchy support.

**Fields:**
- `label`, `url`, `title` (HTML title attribute)
- `target` (_self, _blank, etc.)
- `icon`, `css_classes`
- `parent_id` (for nested menus)
- `display_order`, `is_active`
- Multilingual: `translations` (JSON)

#### 7. MediaFolder
Organize media assets into folders.

**Fields:**
- `name`, `description`
- `parent_id` (for folder hierarchy)
- `is_active`
- `created_by_id`

## API Endpoints

All CMS endpoints are prefixed with `/api/v1/cms/`

### Pages API (`/api/v1/cms/pages`)

**Admin-only endpoints:**
- `GET /` - List all pages (filters: status, is_homepage)
- `GET /{page_id}` - Get page by ID
- `POST /` - Create new page
- `PUT /{page_id}` - Update page
- `DELETE /{page_id}` - Delete page
- `POST /{page_id}/translations` - Update page translations

**Public endpoint:**
- `GET /by-slug/{slug}` - Get published page by slug

### Blog Posts API (`/api/v1/cms/blog/posts`)

**Public endpoints:**
- `GET /` - List blog posts (filters: status, category_id, tag_id, is_featured, author_id)
- `GET /{post_id}` - Get post by ID (increments view count)
- `GET /by-slug/{slug}` - Get published post by slug

**Admin-only endpoints:**
- `POST /` - Create new blog post
- `PUT /{post_id}` - Update blog post
- `DELETE /{post_id}` - Delete blog post
- `POST /{post_id}/translations` - Update post translations

### Blog Categories API (`/api/v1/cms/blog/categories`)

**Public endpoints:**
- `GET /` - List all categories (filter: is_active)
- `GET /{category_id}` - Get category by ID
- `GET /by-slug/{slug}` - Get category by slug

**Admin-only endpoints:**
- `POST /` - Create new category
- `PUT /{category_id}` - Update category
- `DELETE /{category_id}` - Delete category
- `POST /{category_id}/translations` - Update category translations

### Blog Tags API (`/api/v1/cms/blog/tags`)

**Public endpoints:**
- `GET /` - List all tags (filter: is_active)
- `GET /{tag_id}` - Get tag by ID
- `GET /by-slug/{slug}` - Get tag by slug

**Admin-only endpoints:**
- `POST /` - Create new tag
- `PUT /{tag_id}` - Update tag
- `DELETE /{tag_id}` - Delete tag
- `POST /{tag_id}/translations` - Update tag translations

### Menus API (`/api/v1/cms/menus`)

**Public endpoints:**
- `GET /` - List all menus (filter: location)
- `GET /{menu_id}` - Get menu by ID
- `GET /by-slug/{slug}` - Get menu by slug
- `GET /{menu_id}/items` - Get menu items (filter: parent_id)
- `GET /items/{item_id}` - Get menu item by ID

**Admin-only endpoints:**
- `POST /` - Create new menu
- `PUT /{menu_id}` - Update menu
- `DELETE /{menu_id}` - Delete menu
- `POST /{menu_id}/items` - Create menu item
- `PUT /items/{item_id}` - Update menu item
- `DELETE /items/{item_id}` - Delete menu item
- `POST /items/{item_id}/translations` - Update menu item translations

### Media Folders API (`/api/v1/cms/media/folders`)

**Admin-only endpoints:**
- `GET /` - List all folders (filter: parent_id)
- `GET /{folder_id}` - Get folder by ID
- `POST /` - Create new folder
- `PUT /{folder_id}` - Update folder
- `DELETE /{folder_id}` - Delete folder

## CRUD Operations

All CRUD operations are available in `backend/app/crud.py` under the "CMS CRUD Operations" section:

### Page Operations
- `create_page()`, `get_page()`, `get_page_by_slug()`
- `get_pages()`, `update_page()`, `delete_page()`
- `update_page_translation()`

### Blog Post Operations
- `create_blog_post()`, `get_blog_post()`, `get_blog_post_by_slug()`
- `get_blog_posts()`, `update_blog_post()`, `delete_blog_post()`
- `increment_blog_post_view_count()`
- `update_blog_post_translation()`

### Blog Category Operations
- `create_blog_category()`, `get_blog_category()`, `get_blog_category_by_slug()`
- `get_blog_categories()`, `update_blog_category()`, `delete_blog_category()`
- `update_blog_category_translation()`

### Blog Tag Operations
- `create_blog_tag()`, `get_blog_tag()`, `get_blog_tag_by_slug()`
- `get_blog_tags()`, `update_blog_tag()`, `delete_blog_tag()`
- `update_blog_tag_translation()`

### Menu Operations
- `create_menu()`, `get_menu()`, `get_menu_by_slug()`
- `get_menus()`, `update_menu()`, `delete_menu()`

### Menu Item Operations
- `create_menu_item()`, `get_menu_item()`, `get_menu_items()`
- `update_menu_item()`, `delete_menu_item()`
- `update_menu_item_translation()`

### Media Folder Operations
- `create_media_folder()`, `get_media_folder()`, `get_media_folders()`
- `update_media_folder()`, `delete_media_folder()`

## Multilingual Support

All CMS content supports translations via a JSON `translations` field:

```json
{
  "translations": {
    "en": {
      "title": "About Us",
      "content": "Welcome to our site...",
      "excerpt": "Learn more about us"
    },
    "vi": {
      "title": "Về chúng tôi",
      "content": "Chào mừng đến với trang web của chúng tôi...",
      "excerpt": "Tìm hiểu thêm về chúng tôi"
    }
  }
}
```

### Translation Update Endpoints

Use the `/translations` endpoints to update translations:

**Pages:**
```
POST /api/v1/cms/pages/{page_id}/translations
Body: {
  "language": "vi",
  "title": "Tiêu đề",
  "content": "Nội dung...",
  "excerpt": "Trích dẫn",
  "meta_title": "Tiêu đề SEO",
  "meta_description": "Mô tả SEO"
}
```

**Blog Posts, Categories, Tags, Menu Items:**
Similar pattern with respective translation fields.

## SEO Features

### Page and Blog Post SEO Fields

**Standard Meta Tags:**
- `meta_title` - Title tag
- `meta_description` - Description meta tag
- `meta_keywords` - Keywords meta tag

**Open Graph:**
- `og_title` - OG title
- `og_description` - OG description
- `og_image_url` - OG image URL

**Other:**
- `canonical_url` - Canonical URL for duplicate content
- `featured_image_url`, `featured_image_alt` (Blog Posts only)

**Category SEO:**
- `meta_title`
- `meta_description`

## Usage Examples

### Creating a Page

```python
from app.models import PageCreate, PageStatusEnum

page_create = PageCreate(
    title="About Us",
    slug="about-us",
    content="<p>Welcome to our company...</p>",
    excerpt="Learn more about our mission",
    status=PageStatusEnum.PUBLISHED,
    meta_title="About Us | VNRunner",
    meta_description="Learn about VNRunner's mission and values",
    is_homepage=False,
    is_visible_in_menu=True,
    template="default"
)

page = crud.create_page(
    session=session,
    page_create=page_create,
    created_by_id=current_user.id
)
```

### Creating a Blog Post with Tags

```python
from app.models import BlogPostCreate, BlogPostStatusEnum

post_create = BlogPostCreate(
    title="Top 10 Trail Running Tips",
    slug="top-10-trail-running-tips",
    content="<p>Trail running is an amazing way to...</p>",
    excerpt="Discover essential tips for trail running",
    featured_image_url="/media/trail-running.jpg",
    status=BlogPostStatusEnum.PUBLISHED,
    category_id=category_id,
    tag_ids=[tag1_id, tag2_id, tag3_id],
    is_featured=True,
    reading_time_minutes=5
)

post = crud.create_blog_post(
    session=session,
    post_create=post_create,
    author_id=current_user.id
)
```

### Creating a Menu with Items

```python
from app.models import MenuCreate, MenuItemCreate

# Create menu
menu = crud.create_menu(
    session=session,
    menu_create=MenuCreate(
        name="Main Navigation",
        slug="main-nav",
        location="header"
    )
)

# Create top-level menu item
home_item = crud.create_menu_item(
    session=session,
    item_create=MenuItemCreate(
        menu_id=menu.id,
        label="Home",
        url="/",
        display_order=1
    )
)

# Create dropdown menu item
about_item = crud.create_menu_item(
    session=session,
    item_create=MenuItemCreate(
        menu_id=menu.id,
        label="About",
        url="/about",
        parent_id=None,
        display_order=2
    )
)

# Create sub-menu item
team_item = crud.create_menu_item(
    session=session,
    item_create=MenuItemCreate(
        menu_id=menu.id,
        label="Our Team",
        url="/about/team",
        parent_id=about_item.id,
        display_order=1
    )
)
```

## Database Migration

The CMS module tables have been created with migration:
- **File:** `backend/app/alembic/versions/21cfb2e6b325_add_cms_module_tables.py`
- **Status:** ✅ Applied to database

## Next Steps for Frontend Implementation

To complete the CMS module, the following frontend components should be created:

### Admin Dashboard Components

1. **Pages Management**
   - `CMSPageList.tsx` - List all pages with filters
   - `CMSPageEditor.tsx` - Create/edit pages with rich text editor
   - `CMSPagePreview.tsx` - Preview page before publishing

2. **Blog Management**
   - `BlogPostList.tsx` - List all posts with filters
   - `BlogPostEditor.tsx` - Create/edit blog posts
   - `BlogCategoryManager.tsx` - Manage categories
   - `BlogTagManager.tsx` - Manage tags

3. **Menu Management**
   - `MenuManager.tsx` - List and manage menus
   - `MenuEditor.tsx` - Create/edit menus and items
   - `MenuItemEditor.tsx` - Drag-and-drop menu builder

4. **Media Library**
   - `MediaFolderBrowser.tsx` - Browse folders
   - `MediaFolderManager.tsx` - Create/edit folders

### Frontend Routes

Add to `frontend/src/routes/_layout/admin/`:
- `/admin/cms/pages`
- `/admin/cms/pages/new`
- `/admin/cms/pages/:id/edit`
- `/admin/cms/blog/posts`
- `/admin/cms/blog/posts/new`
- `/admin/cms/blog/posts/:id/edit`
- `/admin/cms/blog/categories`
- `/admin/cms/blog/tags`
- `/admin/cms/menus`
- `/admin/cms/media/folders`

### Public Routes

Add to `frontend/src/routes/$lang._public/`:
- `/pages/:slug` - Display CMS pages
- `/blog` - Blog post listing
- `/blog/:slug` - Single blog post
- `/blog/category/:slug` - Category archive
- `/blog/tag/:slug` - Tag archive

## API Client

The frontend API client has been regenerated and now includes all CMS endpoints in:
- `frontend/src/client/services.gen.ts`
- `frontend/src/client/types.gen.ts`

Import and use like this:
```typescript
import { CmsPagesService, BlogPostsService } from '@/client'

// List pages
const pages = await CmsPagesService.readPages({
  skip: 0,
  limit: 10,
  status: 'published'
})

// Get blog post by slug
const post = await BlogPostsService.readBlogPostBySlug({
  slug: 'my-post-slug'
})
```

## Summary

✅ **Completed:**
- Database models for all CMS entities
- CRUD operations for all CMS features
- RESTful API endpoints with proper authentication
- Database migration applied successfully
- Frontend API client updated
- Multilingual content support
- Complete SEO management
- Hierarchical menus and categories
- Media folder organization

🔲 **Remaining (Frontend):**
- Admin UI components for content management
- Frontend routing for CMS pages
- Rich text editor integration (TinyMCE/CKEditor)
- Menu builder with drag-and-drop
- Media browser integration

The backend CMS module is fully functional and ready to use. You can start creating and managing content through the API endpoints immediately, or build the frontend admin interface to provide a user-friendly CMS experience.
