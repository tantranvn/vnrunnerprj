import { Link as RouterLink } from "@tanstack/react-router"
import { LayoutDashboard, LogOut, Settings, User as UserIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useAuth from "@/hooks/useAuth"
import { getInitials } from "@/utils"

export function UserMenu() {
  const { user, logout } = useAuth()

  if (!user) return null

  const handleLogout = () => {
    logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
          data-testid="header-user-menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-0">
        {/* User Info Section */}
        <div className="flex items-center gap-3 p-4 pb-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-base">
              {getInitials(user.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none truncate">
              {user.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {user.email}
            </p>
            <RouterLink to="/profile">
              <Button
                variant="link"
                className="h-auto p-0 text-xs text-primary mt-1 justify-start"
              >
                View profile
              </Button>
            </RouterLink>
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* Main Navigation */}
        <div className="py-1">
          <RouterLink to="/admin/dashboard">
            <DropdownMenuItem className="px-4 py-2.5 cursor-pointer">
              <LayoutDashboard className="mr-3 h-5 w-5" />
              <span className="text-sm">Dashboard</span>
            </DropdownMenuItem>
          </RouterLink>
          <RouterLink to="/profile">
            <DropdownMenuItem className="px-4 py-2.5 cursor-pointer">
              <Settings className="mr-3 h-5 w-5" />
              <span className="text-sm">Settings</span>
            </DropdownMenuItem>
          </RouterLink>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* Sign Out */}
        <div className="py-1">
          <DropdownMenuItem
            onClick={handleLogout}
            className="px-4 py-2.5 cursor-pointer"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span className="text-sm">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
