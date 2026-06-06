import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense } from "react"

import { RacesService } from "@/client"
import PendingItems from "@/components/Pending/PendingItems"
import EditRace from "@/components/Races/EditRace"

export const Route = createFileRoute("/_layout/admin/races/$raceId/edit")({
  component: AdminEditRace,
  head: () => ({
    meta: [
      {
        title: "Edit Race - Admin",
      },
    ],
  }),
})

function getRaceQueryOptions(raceId: string) {
  return {
    queryFn: () => RacesService.readRace({ raceId }),
    queryKey: ["races", raceId],
  }
}

function EditRaceContent() {
  const { raceId } = Route.useParams()
  const { data: race } = useSuspenseQuery(getRaceQueryOptions(raceId))

  return <EditRace race={race} />
}

function AdminEditRace() {
  return (
    <Suspense fallback={<PendingItems />}>
      <EditRaceContent />
    </Suspense>
  )
}
