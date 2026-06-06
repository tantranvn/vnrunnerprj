import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/admin/cms/blog/posts")({
  component: CMSBlogPostsLayout,
})

function CMSBlogPostsLayout() {
  return <Outlet />
}
