import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/admin/cms/blog")({
  component: CMSBlogLayout,
})

function CMSBlogLayout() {
  return <Outlet />
}
