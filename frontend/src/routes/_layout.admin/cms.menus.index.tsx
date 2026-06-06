import { createFileRoute } from "@tanstack/react-router"

import { MenuManager } from "@/components/Admin/CMS/MenuManager"

export const Route = createFileRoute("/_layout/admin/cms/menus/")({
  component: CMSMenus,
})

function CMSMenus() {
  return <MenuManager />
}
