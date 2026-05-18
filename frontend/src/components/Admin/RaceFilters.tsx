import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export interface AdminRaceFilters {
  status: string
  search: string
  startDateFrom: string
  startDateTo: string
}

interface RaceFiltersProps {
  filters: AdminRaceFilters
  onChange: (filters: AdminRaceFilters) => void
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "registration_open", label: "Registration Open" },
  { value: "registration_closed", label: "Registration Closed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export function RaceFilters({ filters, onChange }: RaceFiltersProps) {
  const hasFilters =
    filters.status !== "" ||
    filters.search !== "" ||
    filters.startDateFrom !== "" ||
    filters.startDateTo !== ""

  const update = (patch: Partial<AdminRaceFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const reset = () => {
    onChange({ status: "", search: "", startDateFrom: "", startDateTo: "" })
  }

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="ml-auto h-7"
          >
            <X className="mr-1 size-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search race name..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status || "all"}
            onValueChange={(v) => update({ status: v === "all" ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date From */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Start Date From</label>
          <Input
            type="date"
            value={filters.startDateFrom}
            onChange={(e) => update({ startDateFrom: e.target.value })}
          />
        </div>

        {/* Start Date To */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Start Date To</label>
          <Input
            type="date"
            value={filters.startDateTo}
            onChange={(e) => update({ startDateTo: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
