import { Link, useParams } from "@tanstack/react-router"
import { LayoutDashboard, LogOut, Menu, Settings } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DynamicMenu } from "@/components/Common/DynamicMenu"
import { LanguageSwitcher } from "@/components/Common/LanguageSwitcher"
import { UserMenu } from "@/components/Common/UserMenu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import useAuth, { isLoggedIn } from "@/hooks/useAuth"
import { useMenuByLocation } from "@/hooks/useMenu"
import { getInitials } from "@/utils"

export function PublicHeader() {
  const [open, setOpen] = useState(false)
  const loggedIn = isLoggedIn()
  const { user, logout } = useAuth()
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
            <UserMenu />
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
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 flex flex-col">
            <nav
              className="flex flex-col gap-6 mt-8"
              aria-label="Mobile navigation"
            >
              <div className="flex flex-col gap-4">
                {/* User Menu or Auth Buttons */}
                {loggedIn && user ? (
                  <div className="flex flex-col gap-3">
                    {/* User Info */}
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.full_name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {user.full_name || "User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* User Menu Items */}
                    <Link to="/admin/dashboard" className="w-full" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    <Link to="/profile" className="w-full" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        logout()
                        setOpen(false)
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" asChild className="w-full">
                      <Link to="/login">{t("common.login")}</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/signup">{t("common.register")}</Link>
                    </Button>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="border-t pt-4 flex flex-col gap-3">
                  {headerMenu?.items && headerMenu.items.length > 0
                    ? headerMenu.items.map((item) => {
                        const isInternal =
                          item.url.startsWith("/") && !item.url.startsWith("//")
                        if (isInternal) {
                          return (
                            <Link
                              key={item.id}
                              to={item.url as any}
                              className="w-full"
                              onClick={() => setOpen(false)}
                            >
                              <Button variant="ghost" className="w-full justify-start">
                                {item.label}
                              </Button>
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
                            className="w-full"
                            onClick={() => setOpen(false)}
                          >
                            <Button variant="ghost" className="w-full justify-start">
                              {item.label}
                            </Button>
                          </a>
                        )
                      })
                    : defaultNavLinks.map(({ to, params, label }) => (
                        <Link
                          key={to}
                          to={to}
                          params={params}
                          className="w-full"
                          onClick={() => setOpen(false)}
                        >
                          <Button variant="ghost" className="w-full justify-start">
                            {label}
                          </Button>
                        </Link>
                      ))}
                </div>

                {/* Language Switcher */}
                <div className="border-t pt-4 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {t("language.select")}
                  </span>
                  <LanguageSwitcher />
                </div>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
