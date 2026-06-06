// @ts-nocheck - Disabled due to duplicate react-hook-form type definitions in node_modules
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Save, Plus, Edit, Trash2, GripVertical, Link2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { 
  type MenuPublic,
  type MenuCreate,
  type MenuUpdate,
  type MenuItemPublic,
  type MenuItemCreate,
  type MenuItemUpdate,
  CmsMenusService,
  CmsPagesService
} from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingButton } from "@/components/ui/loading-button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import useCustomToast from "@/hooks/useCustomToast"

const menuFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  is_active: z.boolean().default(true),
})

const menuItemFormSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().min(1, "URL is required"),
  title: z.string().optional(),
  target: z.string().default("_self"),
  icon: z.string().optional(),
  css_classes: z.string().optional(),
  parent_id: z.string().optional(),
  display_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
})

type MenuFormData = z.infer<typeof menuFormSchema>
type MenuItemFormData = z.infer<typeof menuItemFormSchema>

function MenuItemDialog({ 
  menuId,
  item, 
  onClose 
}: { 
  menuId: string
  item?: MenuItemPublic
  onClose: () => void 
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isEdit = Boolean(item)

  // Fetch CMS pages for quick selection
  const { data: pagesData } = useQuery({
    queryKey: ["cms-pages-for-menu"],
    queryFn: () => CmsPagesService.readPages({ limit: 100 }),
  })

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: item || {
      label: "",
      url: "",
      target: "_self",
      display_order: 0,
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: MenuItemCreate | MenuItemUpdate) => {
      if (isEdit && item) {
        return CmsMenusService.updateMenuItem({
          itemId: item.id,
          requestBody: data as MenuItemUpdate,
        })
      }
      // Add menu_id to the request body when creating
      return CmsMenusService.createMenuItem({
        menuId,
        requestBody: {
          ...data,
          menu_id: menuId,
        } as MenuItemCreate,
      })
    },
    onSuccess: () => {
      showSuccessToast(isEdit ? "Menu item updated!" : "Menu item created!")
      queryClient.invalidateQueries({ queryKey: ["cms-menu-items", menuId] })
      onClose()
    },
    onError: (error) => {
      showErrorToast(`Failed to save menu item: ${error}`)
    },
  })

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Label</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Home" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} placeholder="/" />
                  </FormControl>
                  {pagesData?.data && pagesData.data.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" type="button">
                          <Link2 className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80" align="end">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Select CMS Page</h4>
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {pagesData.data
                              .filter((p) => p.status === "published")
                              .map((page) => (
                                <Button
                                  key={page.id}
                                  variant="ghost"
                                  className="w-full justify-start text-sm h-auto py-2"
                                  type="button"
                                  onClick={() => {
                                    form.setValue("url", `/page/${page.slug}`)
                                    if (!form.getValues("label")) {
                                      form.setValue("label", page.title)
                                    }
                                  }}
                                >
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{page.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                      /page/{page.slug}
                                    </span>
                                  </div>
                                </Button>
                              ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <FormDescription>
                  Internal path (e.g., /) or external URL (e.g., https://example.com)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (tooltip)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>Shown on hover</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_self">Same window</SelectItem>
                    <SelectItem value="_blank">New window</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="display_order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon (optional)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="home-icon" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={mutation.isPending}>
              {isEdit ? "Update" : "Create"}
            </LoadingButton>
          </div>
        </form>
      </Form>
    </DialogContent>
  )
}

interface MenuEditorProps {
  menuId?: string
}

export function MenuEditor({ menuId }: MenuEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isEdit = Boolean(menuId)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItemPublic | undefined>()

  // Fetch existing menu data if editing
  const { data: existingMenu } = useQuery({
    queryKey: ["cms-menu", menuId],
    queryFn: () => (menuId ? CmsMenusService.readMenu({ menuId }) : null),
    enabled: isEdit,
  })

  // Fetch menu items if editing
  const { data: menuItems } = useQuery({
    queryKey: ["cms-menu-items", menuId],
    queryFn: () => (menuId ? CmsMenusService.readMenuItems({ menuId }) : null),
    enabled: isEdit,
  })

  const form = useForm<MenuFormData>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: existingMenu || {
      name: "",
      slug: "",
      description: "",
      location: "header",
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: MenuCreate | MenuUpdate) => {
      if (isEdit && menuId) {
        return CmsMenusService.updateMenu({ menuId, requestBody: data as MenuUpdate })
      }
      return CmsMenusService.createMenu({ requestBody: data as MenuCreate })
    },
    onSuccess: (menu) => {
      showSuccessToast(isEdit ? "Menu updated successfully!" : "Menu created successfully!")
      queryClient.invalidateQueries({ queryKey: ["cms-menus"] })
      if (!isEdit) {
        navigate({ to: "/admin/cms/menus/$menuId/edit", params: { menuId: menu.id } })
      }
    },
    onError: (error) => {
      showErrorToast(`Failed to save menu: ${error}`)
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => CmsMenusService.deleteMenuItem({ itemId }),
    onSuccess: () => {
      showSuccessToast("Menu item deleted!")
      queryClient.invalidateQueries({ queryKey: ["cms-menu-items", menuId] })
    },
    onError: (error) => {
      showErrorToast(`Failed to delete menu item: ${error}`)
    },
  })

  const handleNameChange = (name: string) => {
    if (!isEdit) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      form.setValue("slug", slug)
    }
  }

  const handleAddItem = () => {
    setSelectedItem(undefined)
    setDialogOpen(true)
  }

  const handleEditItem = (item: MenuItemPublic) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedItem(undefined)
  }

  const onSubmit = (data: MenuFormData) => {
    mutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEdit ? "Edit Menu" : "Create New Menu"}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate({ to: "/admin/cms/menus" })}>
              Cancel
            </Button>
            <LoadingButton type="submit" loading={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? "Update" : "Create"} Menu
            </LoadingButton>
          </div>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            {isEdit && <TabsTrigger value="items">Menu Items</TabsTrigger>}
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Menu Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleNameChange(e.target.value)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>URL-friendly identifier</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="header">Header</SelectItem>
                          <SelectItem value="footer">Footer</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                          <SelectItem value="mobile">Mobile</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Where the menu will be displayed</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>Show this menu on the site</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {isEdit && (
            <TabsContent value="items" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Menu Items</CardTitle>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={handleAddItem}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <MenuItemDialog 
                        menuId={menuId!} 
                        item={selectedItem} 
                        onClose={handleCloseDialog} 
                      />
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {!menuItems?.data.length ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No menu items yet. Add one to get started.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Label</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {menuItems.data
                          .sort((a, b) => a.display_order - b.display_order)
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                              <TableCell className="font-medium">{item.label}</TableCell>
                              <TableCell className="text-muted-foreground">{item.url}</TableCell>
                              <TableCell>{item.display_order}</TableCell>
                              <TableCell>
                                {item.is_active ? (
                                  <span className="text-green-600">Active</span>
                                ) : (
                                  <span className="text-muted-foreground">Inactive</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEditItem(item)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{item.label}"? This action
                                          cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteItemMutation.mutate(item.id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </form>
    </Form>
  )
}
