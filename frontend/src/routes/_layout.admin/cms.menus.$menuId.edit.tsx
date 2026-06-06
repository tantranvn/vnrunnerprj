import { createFileRoute } from "@tanstack/react-router"

import { MenuEditor } from "@/components/Admin/CMS/MenuEditor"

export const Route = createFileRoute("/_layout/admin/cms/menus/$menuId/edit")({
  component: CMSMenuEdit,
})

function CMSMenuEdit() {
  const { menuId } = Route.useParams()
  return <MenuEditor menuId={menuId} />
}
