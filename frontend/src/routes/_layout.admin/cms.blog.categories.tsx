import { createFileRoute } from "@tanstack/react-router"

import { BlogCategoryManager } from "@/components/Admin/CMS/BlogCategoryManager"
import { BlogTagManager } from "@/components/Admin/CMS/BlogTagManager"

export const Route = createFileRoute("/_layout/admin/cms/blog/categories")({
  component: CMSBlogCategories,
})

function CMSBlogCategories() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Categories & Tags</h2>
        <p className="text-muted-foreground">
          Organize your blog content with categories and tags
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BlogCategoryManager />
        <BlogTagManager />
      </div>
    </div>
  )
}
