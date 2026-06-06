import { useQuery } from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import { Plus, Menu, Eye } from "lucide-react"

import { CmsMenusService } from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function MenuManager() {
  const { data: menus } = useQuery({
    queryKey: ["cms-menus"],
    queryFn: () => CmsMenusService.readMenus({}),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menu Management</h2>
          <p className="text-muted-foreground">
            Manage navigation menus and menu items
          </p>
        </div>
        <Button asChild>
          <RouterLink to="/admin/cms/menus/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Menu
          </RouterLink>
        </Button>
      </div>

      {!menus?.data.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center text-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Menu className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No menus yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first navigation menu to get started
            </p>
            <Button asChild>
              <RouterLink to="/admin/cms/menus/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Menu
              </RouterLink>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {menus.data.map((menu) => (
            <Card key={menu.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                    {menu.description && (
                      <p className="text-sm text-muted-foreground">{menu.description}</p>
                    )}
                  </div>
                  {menu.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Location:</span>{" "}
                    <span className="font-medium capitalize">{menu.location || "Not set"}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Slug:</span>{" "}
                    <span className="font-mono text-xs">/{menu.slug}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <RouterLink to="/admin/cms/menus/$menuId/edit" params={{ menuId: menu.id }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Manage Items
                      </RouterLink>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
