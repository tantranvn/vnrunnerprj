import { Link } from "@tanstack/react-router"
import type { MenuItemPublic } from "@/client"

interface DynamicMenuProps {
  items: MenuItemPublic[]
  className?: string
  itemClassName?: string
  activeClassName?: string
}

/**
 * Renders a dynamic menu from CMS menu items
 * Supports both internal and external links
 */
export function DynamicMenu({ 
  items, 
  className = "", 
  itemClassName = "",
  activeClassName = "text-primary"
}: DynamicMenuProps) {
  if (!items || items.length === 0) return null

  const isInternalLink = (url: string) => {
    return url.startsWith('/') && !url.startsWith('//')
  }

  return (
    <nav className={className}>
      {items.map((item) => {
        const isInternal = isInternalLink(item.url)
        const target = item.target || '_self'

        if (isInternal) {
          return (
            <Link
              key={item.id}
              to={item.url as any}
              className={itemClassName}
              activeProps={{ className: activeClassName }}
              title={item.title || undefined}
            >
              {item.label}
            </Link>
          )
        }

        // External link
        return (
          <a
            key={item.id}
            href={item.url}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            className={itemClassName}
            title={item.title || undefined}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
