import { Link, useParams } from "@tanstack/react-router"
import { Menu } from "lucide-react"
import { useTranslation } from "react-i18next"
import { DynamicMenu } from "@/components/Common/DynamicMenu"
import { LanguageSwitcher } from "@/components/Common/LanguageSwitcher"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { isLoggedIn } from "@/hooks/useAuth"
import { useMenuByLocation } from "@/hooks/useMenu"

export function PublicHeader() {
  const loggedIn = isLoggedIn()
  const { t, i18n } = useTranslation()
  const params = useParams({ strict: false }) as Record<string, any>
  const lang = params?.lang || i18n.language || "vi"

  // Fetch header menu from CMS
  const { data: headerMenu } = useMenuByLocation("header")

  const defaultNavLinks = [
    { to: "/$lang", params: { lang }, label: t("nav.home") },
    { to: "/$lang/races", params: { lang }, label: t("nav.races") },
    { to: "/$lang/about", params: { lang }, label: t("nav.about") },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Desktop Navigation */}
        <div className="flex items-center gap-8">
          <Link
            to="/$lang"
            params={{ lang }}
            className="flex items-center gap-2 font-bold text-xl hover:text-primary transition-colors"
          >
            <span>VNRUNNER</span>
          </Link>

          {/* Desktop Navigation - Use CMS menu if available, otherwise fallback to default */}
          {headerMenu?.items && headerMenu.items.length > 0 ? (
            <DynamicMenu
              items={headerMenu.items}
              className="hidden md:flex items-center gap-6"
              itemClassName="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeClassName="text-primary"
            />
          ) : (
            <nav
              className="hidden md:flex items-center gap-6"
              aria-label="Main navigation"
            >
              {defaultNavLinks.map(({ to, params, label }) => (
                <Link
                  key={to}
                  to={to}
                  params={params}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  activeProps={{ className: "text-primary" }}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {loggedIn ? (
            <Button asChild>
              <Link to="/admin/dashboard">{t("nav.dashboard")}</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">{t("common.login")}</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">{t("common.register")}</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <nav
              className="flex flex-col gap-6 mt-8"
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col gap-4">
                {/* Mobile Navigation - Use CMS menu if available */}
                {headerMenu?.items && headerMenu.items.length > 0
                  ? headerMenu.items.map((item) => {
                      const isInternal =
                        item.url.startsWith("/") && !item.url.startsWith("//")
                      if (isInternal) {
                        return (
                          <Link
                            key={item.id}
                            to={item.url as any}
                            className="text-lg font-medium transition-colors hover:text-primary"
                            activeProps={{ className: "text-primary" }}
                          >
                            {item.label}
                          </Link>
                        )
                      }
                      return (
                        <a
                          key={item.id}
                          href={item.url}
                          target={item.target || "_self"}
                          rel={
                            item.target === "_blank"
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="text-lg font-medium transition-colors hover:text-primary"
                        >
                          {item.label}
                        </a>
                      )
                    })
                  : defaultNavLinks.map(({ to, params, label }) => (
                      <Link
                        key={to}
                        to={to}
                        params={params}
                        className="text-lg font-medium transition-colors hover:text-primary"
                        activeProps={{ className: "text-primary" }}
                      >
                        {label}
                      </Link>
                    ))}
              </div>
              <div className="border-t pt-6 flex flex-col gap-3">
                <LanguageSwitcher />
                {loggedIn ? (
                  <Button asChild className="w-full">
                    <Link to="/admin/dashboard">{t("nav.dashboard")}</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login">{t("common.login")}</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/signup">{t("common.register")}</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
