import { createFileRoute } from "@tanstack/react-router"

import { CMSPageEditor } from "@/components/Admin/CMS/CMSPageEditor"

export const Route = createFileRoute("/_layout/admin/cms/pages/new")({
  component: CMSPageNew,
})

function CMSPageNew() {
  return <CMSPageEditor />
}
