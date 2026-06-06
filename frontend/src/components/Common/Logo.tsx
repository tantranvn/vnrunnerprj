import { Link } from "@tanstack/react-router"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const content =
    variant === "responsive" ? (
      <>
        <span
          className={cn(
            "font-bold text-xl group-data-[collapsible=icon]:hidden",
            className,
          )}
        >
          VNRUNNER
        </span>
        <span
          className={cn(
            "font-bold text-xl hidden group-data-[collapsible=icon]:block",
            className,
          )}
        >
          VN
        </span>
      </>
    ) : (
      <span
        className={cn(
          "font-bold",
          variant === "full" ? "text-xl" : "text-lg",
          className,
        )}
      >
        {variant === "full" ? "VNRUNNER" : "VN"}
      </span>
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}
