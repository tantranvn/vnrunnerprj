import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/admin/cms/pages")({
  component: CMSPagesLayout,
})

function CMSPagesLayout() {
  return <Outlet />
}
