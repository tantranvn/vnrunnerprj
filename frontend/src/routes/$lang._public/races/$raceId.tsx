import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Award, Calendar, Globe, MapPin, Mountain } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { RacePublicWithDetails } from "@/client"
import { RacesService } from "@/client"
import { CourseMap } from "@/components/Races/CourseMap"
import { RaceAssistant } from "@/components/Races/RaceAssistant"
import { RaceCard } from "@/components/Races/RaceCard"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRaceSearch } from "@/hooks/useRaceSearch"
import {
  generateBreadcrumbSchema,
  generateEventSchema,
  generateMetaTags,
  StructuredData,
  stripHtml,
  truncateText,
} from "@/lib/seo"
import { cn, formatDateLong, getMediaUrl } from "@/lib/utils"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/$lang/_public/races/$raceId")({
  component: RaceDetailPage,
  loader: async ({ params }) => {
    try {
      const race = await RacesService.readRace({ raceId: params.raceId })
      return { race }
    } catch {
      return { race: null }
    }
  },
  head: ({ loaderData }) => {
    const race = loaderData?.race
    if (!race) {
      return {
        meta: generateMetaTags({
          title: "Race Not Found - VNRunner",
          description: "The race you're looking for could not be found.",
        }),
      }
    }

    const location =
      [race.city, race.state, race.country].filter(Boolean).join(", ") ||
      race.location
    const description = race.description
      ? truncateText(stripHtml(race.description), 160)
      : `Join ${race.name} on ${new Date(race.event_start_date).toLocaleDateString()}. ${location}. Register online now.`

    const eventDate = new Date(race.event_start_date).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    )

    return {
      meta: generateMetaTags({
        title: `${race.name} - ${eventDate} | VNRunner`,
        description,
        keywords: `${race.name}, Vietnam running race, ${location}, ${race.terrain_type || ""} running, ${race.difficulty_level || ""} race, race registration`,
        canonicalUrl: `${baseUrl}/races/${race.id}`,
        ogType: "event",
        publishedTime: race.created_at,
        modifiedTime: race.updated_at,
      }),
    }
  },
})

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  moderate: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  hard: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  extreme: "bg-red-500/10 text-red-500 border-red-500/20",
}

function getTerrainLabel(
  terrainType: string,
  t: (key: string) => string,
): string {
  const key = `races.terrain.${terrainType}`
  return t(key)
}

function getDifficultyLabel(
  difficulty: string,
  t: (key: string) => string,
): string {
  const key = `races.difficulty.${difficulty}`
  return t(key)
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function RaceDetailSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

function RaceDetailPage() {
  const { raceId, lang } = Route.useParams()
  const { t, i18n } = useTranslation()

  // Sync i18n language with route parameter
  useEffect(() => {
    if (lang && i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
  }, [lang, i18n])

  // Map language code to locale for date formatting
  const locale = lang === "vi" ? "vi-VN" : "en-GB"

  const { data: race, isLoading } = useQuery<RacePublicWithDetails>({
    queryKey: ["race", raceId],
    queryFn: () => RacesService.readRace({ raceId }),
  })

  const { data: similarData } = useRaceSearch({
    terrain: race?.terrain_type ?? undefined,
    difficulty: race?.difficulty_level ?? undefined,
    limit: 3,
  })
  const similarRaces = (similarData?.data ?? []).filter((r) => r.id !== raceId)

  if (isLoading)
    return (
      <div className="container py-12">
        <RaceDetailSkeleton />
      </div>
    )
  if (!race)
    return (
      <div className="container py-12 text-center text-muted-foreground">
        {t("races.detail.raceNotFound")}
      </div>
    )

  const registrationOpen = race.status === "registration_open"
  const location =
    [race.city, race.state, race.country].filter(Boolean).join(", ") ||
    race.location

  // Generate structured data for SEO
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Races", url: `${baseUrl}/races` },
    { name: race.name, url: `${baseUrl}/races/${race.id}` },
  ])

  const eventSchema = generateEventSchema({
    name: race.name,
    description: race.description
      ? stripHtml(race.description)
      : `${race.name} running event in ${location}`,
    startDate: race.event_start_date,
    endDate: race.event_end_date || undefined,
    location: {
      name: location,
      address: {
        addressLocality: race.city || undefined,
        addressRegion: race.state || race.province_name || undefined,
        addressCountry: race.country || "Vietnam",
      },
      geo:
        race.latitude && race.longitude
          ? { latitude: race.latitude, longitude: race.longitude }
          : undefined,
    },
    organizer: {
      name: "VNRunner",
      url: baseUrl,
    },
    offers:
      race.categories?.map((cat) => ({
        price: cat.price || race.base_price || 0,
        priceCurrency: race.currency || "VND",
        availability: registrationOpen ? "InStock" : "SoldOut",
        url: race.website_url || `${baseUrl}/races/${race.id}`,
        validFrom: race.registration_start || undefined,
      })) ||
      (race.base_price
        ? [
            {
              price: race.base_price,
              priceCurrency: race.currency || "VND",
              availability: registrationOpen ? "InStock" : "SoldOut",
              url: race.website_url || `${baseUrl}/races/${race.id}`,
              validFrom: race.registration_start || undefined,
            },
          ]
        : undefined),
  })

  const metadata = race.race_metadata as
    | { cover_url?: string }
    | null
    | undefined
  const coverUrl = metadata?.cover_url ? getMediaUrl(metadata.cover_url) : null

  return (
    <div className="w-full">
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={eventSchema} />

      {/* Hero Banner */}
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
        {/* Background Image or Gradient */}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={race.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50" />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Content */}
        <div className="relative h-full flex items-end">
          <div className="container pb-8 md:pb-12 lg:pb-16">
            <div className="max-w-5xl space-y-4 md:space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {race.terrain_type && (
                  <Badge
                    variant="secondary"
                    className="rounded-full backdrop-blur-sm bg-white/90 text-gray-900"
                  >
                    {getTerrainLabel(race.terrain_type, t)}
                  </Badge>
                )}
                {race.difficulty_level && (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium backdrop-blur-sm",
                      DIFFICULTY_COLORS[race.difficulty_level] ??
                        "bg-white/90 text-gray-900",
                    )}
                  >
                    {getDifficultyLabel(race.difficulty_level, t)}
                  </span>
                )}
                {race.is_certified && (
                  <Badge className="gap-1.5 rounded-full backdrop-blur-sm bg-white/90 text-gray-900">
                    <Award className="size-3.5" /> {t("races.card.certified")}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white drop-shadow-lg">
                {race.name}
              </h1>

              {/* Location and Date */}
              <div className="flex flex-wrap gap-4 md:gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <MapPin className="size-5" />
                  <span className="text-sm md:text-base font-medium">
                    {location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-5" />
                  <span className="text-sm md:text-base font-medium">
                    {formatDateLong(race.event_start_date, locale)}
                  </span>
                </div>
              </div>

              {/* Registration CTA on Banner */}
              {race.website_url && registrationOpen && (
                <div className="pt-2">
                  <a
                    href={race.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 hover:bg-white/90 transition-colors shadow-lg"
                  >
                    {t("races.detail.registerNow")}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-12 md:py-16 lg:py-20">
        <article
          className="mx-auto max-w-5xl space-y-12"
          itemScope
          itemType="https://schema.org/SportsEvent"
        >
          <meta itemProp="name" content={race.name} />
          <meta itemProp="startDate" content={race.event_start_date} />
          {race.event_end_date && (
            <meta itemProp="endDate" content={race.event_end_date} />
          )}

          {/* Description */}
          <div className="space-y-6">
            {race.description && (
              <div>
                <h2 className="text-2xl font-bold mb-4">
                  {t("races.detail.aboutRace")}
                </h2>
                <div
                  className="prose prose-lg max-w-none text-muted-foreground leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-4 [&_li]:my-2 [&_a]:text-primary [&_a]:underline [&_a]:transition-colors [&_a:hover]:text-primary/80 [&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: Race description content is sanitized
                  dangerouslySetInnerHTML={{ __html: race.description }}
                />
              </div>
            )}
          </div>

          {/* Key info */}
          <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 divide-y divide-border/50">
            <InfoRow
              icon={<Calendar className="size-5" />}
              label={t("races.detail.raceDate")}
              value={formatDateLong(race.event_start_date, locale)}
            />
            {race.event_end_date && (
              <InfoRow
                icon={<Calendar className="size-5" />}
                label={t("races.detail.endDate")}
                value={formatDateLong(race.event_end_date, locale)}
              />
            )}
            <InfoRow
              icon={<MapPin className="size-5" />}
              label={t("races.detail.location")}
              value={
                [race.city, race.state, race.country]
                  .filter(Boolean)
                  .join(", ") || race.location
              }
            />
            {race.elevation_gain_m && (
              <InfoRow
                icon={<Mountain className="size-5" />}
                label={t("races.detail.elevationGain")}
                value={`${race.elevation_gain_m.toLocaleString()} ${t("races.detail.meters")}`}
              />
            )}
            {race.website_url && (
              <div className="flex items-center gap-4 py-3">
                <Globe className="size-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground w-32 shrink-0">
                  {t("races.detail.website")}
                </span>
                <a
                  href={race.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {t("races.detail.officialSite")}
                </a>
              </div>
            )}
          </div>

          {/* Categories */}
          {race.categories && race.categories.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                {t("races.detail.categories")}
              </h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-2 text-left font-medium">
                        {t("races.detail.category")}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t("races.detail.distance")}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t("races.detail.price")}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t("races.detail.cutoffTime")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {race.categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium">{cat.name}</td>
                        <td className="px-4 py-2">
                          {cat.distance_km ? `${cat.distance_km} km` : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {cat.price != null
                            ? `${cat.price} ${race.currency ?? "VND"}`
                            : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {cat.cutoff_time_minutes
                            ? `${cat.cutoff_time_minutes} ${t("races.detail.min")}`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Course map */}
          {race.latitude != null && race.longitude != null && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">
                {t("races.detail.courseLocation")}
              </h2>
              <CourseMap
                latitude={race.latitude}
                longitude={race.longitude}
                name={race.name}
              />
            </section>
          )}

          {/* Tags */}
          {race.tags && race.tags.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold">
                {t("races.detail.tags")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {race.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Registration Info */}
          {!registrationOpen && (
            <section className="rounded-lg border bg-muted/20 p-6">
              <div>
                <div className="font-semibold text-lg">
                  {t("races.detail.registrationNotAvailable")}
                </div>
                {race.registration_end && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {t("races.detail.registrationClosedOn")}{" "}
                    {formatDateLong(race.registration_end, locale)}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Similar races */}
          {similarRaces.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">
                {t("races.detail.similarRaces")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similarRaces.map((r) => (
                  <RaceCard key={r.id} race={r} />
                ))}
              </div>
            </section>
          )}

          <div className="pt-4">
            <Link
              to="/$lang/races"
              params={{ lang }}
              className="text-sm text-primary hover:underline"
            >
              {t("races.backToAll")}
            </Link>
          </div>
        </article>
      </div>

      {/* Floating AI assistant */}
      <RaceAssistant raceId={raceId} />
    </div>
  )
}
