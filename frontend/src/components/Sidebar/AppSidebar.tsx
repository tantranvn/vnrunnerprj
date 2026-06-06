import {
  Bookmark,
  Briefcase,
  Calendar,
  FileText,
  Flag,
  Home,
  Menu,
  PenTool,
  Settings,
  Tags,
  User as UserIcon,
  Users,
} from "lucide-react"

import { SidebarAppearance } from "@/components/Common/Appearance"
import { Logo } from "@/components/Common/Logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import useAuth from "@/hooks/useAuth"
import { type Item, Main } from "./Main"
import { User } from "./User"

const adminItems: Item[] = [
  { icon: Home, title: "Dashboard", path: "/admin/dashboard" },
  { icon: Flag, title: "Races", path: "/admin/races" },
  { icon: Tags, title: "Tags", path: "/admin/tags" },
  { icon: Users, title: "Users", path: "/admin/users" },
  { icon: FileText, title: "Pages", path: "/admin/cms/pages" },
  { icon: PenTool, title: "Blog", path: "/admin/cms/blog/posts" },
  { icon: Menu, title: "Menus", path: "/admin/cms/menus" },
  { icon: Briefcase, title: "Items", path: "/admin/items" },
  { icon: Settings, title: "Settings", path: "/admin/settings" },
]

const userItems: Item[] = [
  { icon: Calendar, title: "My Races", path: "/history" },
  { icon: Bookmark, title: "Saved", path: "/saved" },
  { icon: UserIcon, title: "Profile", path: "/profile" },
]

export function AppSidebar() {
  const { user: currentUser } = useAuth()

  const items = currentUser?.is_superuser ? adminItems : userItems

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:items-center">
        <Logo variant="responsive" />
      </SidebarHeader>
      <SidebarContent>
        <Main items={items} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarAppearance />
        <User user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

export default AppSidebar
