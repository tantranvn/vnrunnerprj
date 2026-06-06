import { useQuery } from "@tanstack/react-query"
import { CmsMenusService } from "@/client"

/**
 * Hook to fetch active menus by location
 */
export function useMenuByLocation(location: string) {
  return useQuery({
    queryKey: ["cms-menus", location],
    queryFn: async () => {
      const response = await CmsMenusService.readMenus({})
      // Filter active menus by location
      const menu = response.data.find(
        (m) => m.location === location && m.is_active,
      )
      if (!menu) return null

      // Fetch menu items
      const items = await CmsMenusService.readMenuItems({ menuId: menu.id })
      return {
        ...menu,
        items: items.data
          .filter((item) => item.is_active && !item.parent_id)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
