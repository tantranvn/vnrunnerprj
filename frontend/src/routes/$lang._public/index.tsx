import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRight, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { RaceCard } from "@/components/Races/RaceCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isLoggedIn } from "@/hooks/useAuth"
import { useRaceSearch } from "@/hooks/useRaceSearch"
import {
  generateMetaTags,
  generateOrganizationSchema,
  StructuredData,
} from "@/lib/seo"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/$lang/_public/")({
  component: HomePage,
  head: () => ({
    meta: generateMetaTags({
      title:
        "VNRunner - Discover Vietnamese Running Races & Trail Runs | Register Online",
      description:
        "Find and register for running races across Vietnam. Discover trail runs, road races, marathons, and ultras. Join thousands of Vietnamese runners achieving their goals. Free online registration.",
      keywords:
        "Vietnam running races, trail running Vietnam, marathon Vietnam, ultra running, race registration, Vietnamese runners, running events Vietnam, 5K 10K races Vietnam",
      canonicalUrl: baseUrl,
      ogType: "website",
    }),
  }),
})

function HomePage() {
  const loggedIn = isLoggedIn()
  const { t, i18n } = useTranslation()
  const { lang } = Route.useParams()
  const currentLang = lang || i18n.language || "vi"
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch hand-picked races
  const { data: handPickedData, isLoading } = useRaceSearch({
    sort: "popularity",
    limit: 6,
  })
  const handPickedRaces = handPickedData?.data ?? []
  const totalRaces = handPickedData?.count ?? 11248

  const organizationSchema = generateOrganizationSchema({
    name: "VNRunner",
    url: baseUrl,
    logo: `${baseUrl}/assets/images/favicon.png`,
    description:
      "Vietnam's premier platform for discovering and registering for running races, trail runs, and marathons.",
    sameAs: [],
  })

  const quickFilters = [
    t("home.hero.quickFilters.halfMarathons"),
    t("home.hero.quickFilters.flat10K"),
    t("home.hero.quickFilters.coolMarathons"),
    t("home.hero.quickFilters.ultras50K"),
  ]

  const handleSearch = () => {
    // Navigate to races page with search query
    if (searchQuery.trim()) {
      window.location.href = `/${currentLang}/races?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <>
      <StructuredData data={organizationSchema} />

      {/* Hero Section - Bold Typography with AI Search */}
      <section
        className="w-full py-16 md:py-20 lg:py-24"
        itemScope
        itemType="https://schema.org/WebSite"
      >
        <meta itemProp="url" content={baseUrl} />
        <meta itemProp="name" content="VNRunner" />
        <div className="container max-w-[1100px]">
          <div className="mx-auto text-center space-y-5">
            {/* Small header text with icon */}
            <div className="flex items-center justify-center gap-2 text-xs tracking-[0.14em] uppercase text-[#74716A] font-mono">
              <Sparkles className="size-3.5" />
              <span>
                {t("home.hero.aiFinderLabel")} ·{" "}
                {t("home.hero.racesIndexed", {
                  count: totalRaces.toLocaleString(),
                })}
              </span>
            </div>

            {/* Large bold heading - Anton-style */}
            <h1 className="text-4xl md:text-5xl lg:text-7xl xl:text-[100px] font-black tracking-[-0.01em] leading-[0.9] uppercase">
              {t("home.hero.titleLine1")}
              <br />
              <span className="text-[#FF5A1F]">
                {t("home.hero.titleLine2Next")}
              </span>{" "}
              {t("home.hero.titleLine2Rest")}
              <br />
              {t("home.hero.titleLine3")}
            </h1>

            {/* Subtitle */}
            <p className="text-base md:text-lg lg:text-xl text-[#74716A] max-w-[620px] mx-auto leading-7 px-4">
              {t("home.hero.subtitle")}
            </p>

            {/* AI Search Bar */}
            <div className="max-w-[820px] mx-auto space-y-4 pt-5 px-4">
              <div className="relative bg-white border-2 border-[#E6E1D7] rounded-[28px] shadow-[0px_6px_12px_rgba(15,14,12,0.06),0px_1px_1px_rgba(15,14,12,0.04)] p-2.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Sparkles className="size-3.5 text-[#74716A] flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder={t("home.hero.searchPlaceholder")}
                      className="flex-1 h-11 px-1 border-0 text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="rounded-full h-11 px-5 font-bold text-sm bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 w-full sm:w-auto whitespace-nowrap"
                  >
                    {t("home.hero.findRaces")}{" "}
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </div>
              </div>

              {/* Quick filters */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[#74716A] font-mono tracking-widest uppercase">
                  {t("home.hero.tryLabel")}
                </span>
                {quickFilters.map((filter) => (
                  <Badge
                    key={filter}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted/50 transition-colors rounded-full px-3 py-1.5 border-[#E6E1D7] text-xs font-bold"
                    onClick={() => setSearchQuery(filter)}
                  >
                    {filter}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hand-Picked Races Section */}
      <section className="w-full py-16 md:py-20 lg:py-24">
        <div className="container max-w-[1400px]">
          <div className="space-y-7">
            {/* Section header with border */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between pb-7 border-b-2 border-[#0F0E0C] gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs tracking-[0.14em] uppercase text-[#74716A] font-mono">
                  <Sparkles className="size-3.5" />
                  <span>{t("home.handPicked.recommendedLabel")}</span>
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-black tracking-tight leading-[0.92] uppercase">
                  {t("home.handPicked.title")}
                </h2>
              </div>
              <Link
                to="/$lang/races"
                params={{ lang: currentLang }}
                className="text-sm font-bold hover:text-primary transition-colors flex items-center gap-2 border border-[#E6E1D7] rounded-full px-5 py-2.5 whitespace-nowrap"
              >
                {t("home.handPicked.seeAll")} <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Races Grid */}
            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[331px] rounded-[22px] border border-[#E6E1D7] bg-card/50 animate-pulse"
                  />
                ))}
              </div>
            ) : handPickedRaces.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {handPickedRaces.map((race) => (
                  <RaceCard key={race.id} race={race} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                {t("home.handPicked.noRacesAvailable")}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Orange Background */}
      {loggedIn && (
        <section className="w-full py-16 md:py-20 bg-[#FF5A1F] relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <div className="container max-w-[1328px] relative px-4">
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 md:gap-12 items-center">
              {/* Left side - Copy */}
              <div className="space-y-3">
                <p className="text-xs tracking-[0.14em] uppercase text-white/70 font-mono">
                  {t("home.cta.freeForever")}
                </p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-[80px] font-black tracking-tight leading-[0.95] uppercase text-white">
                  {t("home.cta.titleLine1")}
                  <br />
                  {t("home.cta.titleLine2")}
                  <br />
                  {t("home.cta.titleLine3")}
                </h2>
                <p className="text-sm md:text-base leading-6 text-white/90 max-w-[680px]">
                  {t("home.cta.description")}
                </p>
              </div>

              {/* Right side - Form */}
              <div className="bg-white rounded-[22px] p-6 space-y-2.5">
                <p className="text-xs tracking-[0.14em] uppercase text-[#74716A] font-mono">
                  {t("home.cta.formLabel")}
                </p>

                <Input
                  type="email"
                  placeholder={t("home.cta.emailPlaceholder")}
                  className="h-12 rounded-full border-[#E6E1D7] text-sm"
                />

                <Button className="w-full h-11 rounded-full bg-[#0F0E0C] hover:bg-[#0F0E0C]/90 text-white font-bold text-sm">
                  {t("home.cta.createAccount")}{" "}
                  <ArrowRight className="ml-2 size-4" />
                </Button>

                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-[#E6E1D7]" />
                  <span className="text-xs text-[#74716A]">
                    {t("home.cta.or")}
                  </span>
                  <div className="flex-1 h-px bg-[#E6E1D7]" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="h-[34px] rounded-full border-[#E6E1D7] text-xs font-bold"
                  >
                    {t("home.cta.apple")}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-[34px] rounded-full border-[#E6E1D7] text-xs font-bold"
                  >
                    {t("home.cta.google")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
