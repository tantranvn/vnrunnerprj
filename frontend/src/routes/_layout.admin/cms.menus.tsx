import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/admin/cms/menus")({
  component: CMSMenusLayout,
})

function CMSMenusLayout() {
  return <Outlet />
}
