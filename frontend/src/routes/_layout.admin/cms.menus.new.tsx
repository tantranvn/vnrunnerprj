import { createFileRoute } from "@tanstack/react-router"

import { MenuEditor } from "@/components/Admin/CMS/MenuEditor"

export const Route = createFileRoute("/_layout/admin/cms/menus/new")({
  component: CMSMenuNew,
})

function CMSMenuNew() {
  return <MenuEditor />
}
