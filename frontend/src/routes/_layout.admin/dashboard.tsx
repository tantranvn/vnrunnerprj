import { createFileRoute, Link as RouterLink } from "@tanstack/react-router"
import {
  BookOpen,
  Box,
  Calendar,
  FileText,
  Menu,
  Tag,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import useAuth from "@/hooks/useAuth"

export const Route = createFileRoute("/_layout/admin/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      {
        title: "Dashboard - Admin",
      },
    ],
  }),
})

const adminSections = [
  {
    title: "Pages",
    description: "Manage static and dynamic pages",
    icon: FileText,
    href: "/admin/cms/pages",
    color: "text-blue-600",
  },
  {
    title: "Blog Posts",
    description: "Create and manage blog content",
    icon: BookOpen,
    href: "/admin/cms/blog/posts",
    color: "text-green-600",
  },
  {
    title: "Categories & Tags",
    description: "Organize blog content",
    icon: Tag,
    href: "/admin/cms/blog/categories",
    color: "text-purple-600",
  },
  {
    title: "Menus",
    description: "Configure site navigation",
    icon: Menu,
    href: "/admin/cms/menus",
    color: "text-orange-600",
  },
  {
    title: "Races",
    description: "Manage race events",
    icon: Calendar,
    href: "/admin/races",
    color: "text-red-600",
  },
  {
    title: "Users",
    description: "Manage user accounts",
    icon: Users,
    href: "/admin/users",
    color: "text-indigo-600",
  },
  {
    title: "Items",
    description: "Manage system items",
    icon: Box,
    href: "/admin/items",
    color: "text-teal-600",
  },
]

function Dashboard() {
  const { user: currentUser } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl truncate max-w-sm">
          Hi, {currentUser?.full_name || currentUser?.email} 👋
        </h2>
        <p className="text-muted-foreground">
          Welcome back to the admin dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminSections.map((section) => {
          const Icon = section.icon
          return (
            <Card
              key={section.href}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-muted ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <RouterLink to={section.href}>
                    Manage {section.title}
                  </RouterLink>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
