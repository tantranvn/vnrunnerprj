import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/admin/cms/")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin/cms/pages",
    })
  },
})
