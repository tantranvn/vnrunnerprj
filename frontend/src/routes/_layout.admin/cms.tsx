import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_layout/admin/cms")({
  component: CMSLayout,
})

function CMSLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Content Management
        </h1>
        <p className="text-muted-foreground">
          Manage pages, blog posts, menus, and media
        </p>
      </div>
      <Outlet />
    </div>
  )
}
