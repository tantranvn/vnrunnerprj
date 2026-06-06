import { createFileRoute, Link as RouterLink } from "@tanstack/react-router"
import { Filter, Plus } from "lucide-react"
import { Suspense, useState } from "react"

import { CMSPageList } from "@/components/Admin/CMS/CMSPageList"
import PendingItems from "@/components/Pending/PendingItems"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const Route = createFileRoute("/_layout/admin/cms/pages/")({
  component: CMSPages,
})

function CMSPagesContent({ status }: { status: string }) {
  return (
    <Suspense fallback={<PendingItems />}>
      <CMSPageList status={status || undefined} />
    </Suspense>
  )
}

function CMSPages() {
  const [statusFilter, setStatusFilter] = useState<string>("all")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pages</h2>
          <p className="text-muted-foreground">
            Manage static and dynamic pages for your website
          </p>
        </div>
        <Button asChild>
          <RouterLink to="/admin/cms/pages/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Page
          </RouterLink>
        </Button>
      </div>

      <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-50">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter && statusFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            Clear filter
          </Button>
        )}
      </div>

      <CMSPagesContent status={statusFilter === "all" ? "" : statusFilter} />
    </div>
  )
}
