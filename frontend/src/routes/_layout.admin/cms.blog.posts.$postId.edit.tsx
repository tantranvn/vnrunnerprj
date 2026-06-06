import { createFileRoute } from "@tanstack/react-router"

import { BlogPostEditor } from "@/components/Admin/CMS/BlogPostEditor"

export const Route = createFileRoute(
  "/_layout/admin/cms/blog/posts/$postId/edit",
)({
  component: CMSBlogPostEdit,
})

function CMSBlogPostEdit() {
  const { postId } = Route.useParams()
  return <BlogPostEditor postId={postId} />
}
