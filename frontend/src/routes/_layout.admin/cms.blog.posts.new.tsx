import { createFileRoute } from "@tanstack/react-router"

import { BlogPostEditor } from "@/components/Admin/CMS/BlogPostEditor"

export const Route = createFileRoute("/_layout/admin/cms/blog/posts/new")({
  component: CMSBlogPostNew,
})

function CMSBlogPostNew() {
  return <BlogPostEditor />
}
