import { Link } from "@tanstack/react-router"
import { useMenuByLocation } from "@/hooks/useMenu"

export function PublicFooter() {
  // Fetch footer menu from CMS
  const { data: footerMenu } = useMenuByLocation("footer")

  return (
    <footer className="bg-[#0F0E0C] text-white py-6 px-4">
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
          <span className="text-white/50">© 2026 VNRunner</span>

          {footerMenu?.items &&
            footerMenu.items.length > 0 &&
            footerMenu.items.map((item) => {
              const isInternal =
                item.url.startsWith("/") && !item.url.startsWith("//")
              if (isInternal) {
                return (
                  <Link
                    key={item.id}
                    to={item.url as any}
                    className="hover:text-white transition-colors"
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
                    item.target === "_blank" ? "noopener noreferrer" : undefined
                  }
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </a>
              )
            })}
        </div>
      </div>
    </footer>
  )
}
