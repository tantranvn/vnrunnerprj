import { createFileRoute } from "@tanstack/react-router"

import { CMSPageEditor } from "@/components/Admin/CMS/CMSPageEditor"

export const Route = createFileRoute("/_layout/admin/cms/pages/$pageId/edit")({
  component: CMSPageEdit,
})

function CMSPageEdit() {
  const { pageId } = Route.useParams()
  return <CMSPageEditor pageId={pageId} />
}
