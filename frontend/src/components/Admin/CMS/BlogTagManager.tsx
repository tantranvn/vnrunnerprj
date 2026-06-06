// @ts-nocheck - Disabled due to duplicate react-hook-form type definitions in node_modules
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit, Trash2, Tag } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { 
  type BlogTagPublic,
  type BlogTagCreate,
  type BlogTagUpdate,
  CmsBlogTagsService 
} from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { LoadingButton } from "@/components/ui/loading-button"
import { Badge } from "@/components/ui/badge"
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
import useCustomToast from "@/hooks/useCustomToast"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  is_active: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

function TagDialog({ 
  tag, 
  onClose 
}: { 
  tag?: BlogTagPublic
  onClose: () => void 
}) {
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isEdit = Boolean(tag)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: tag || {
      name: "",
      slug: "",
      is_active: true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: BlogTagCreate | BlogTagUpdate) => {
      if (isEdit && tag) {
        return CmsBlogTagsService.updateBlogTag({
          tagId: tag.id,
          requestBody: data as BlogTagUpdate,
        })
      }
      return CmsBlogTagsService.createBlogTag({
        requestBody: data as BlogTagCreate,
      })
    },
    onSuccess: () => {
      showSuccessToast(isEdit ? "Tag updated!" : "Tag created!")
      queryClient.invalidateQueries({ queryKey: ["cms-blog-tags"] })
      onClose()
    },
    onError: (error) => {
      showErrorToast(`Failed to save tag: ${error}`)
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

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Tag" : "Create Tag"}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
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
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>Show this tag on the site</FormDescription>
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

export function BlogTagManager() {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<BlogTagPublic | undefined>()

  const { data: tags } = useQuery({
    queryKey: ["cms-blog-tags"],
    queryFn: () => CmsBlogTagsService.readBlogTags({}),
  })

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) =>
      CmsBlogTagsService.deleteBlogTag({ tagId }),
    onSuccess: () => {
      showSuccessToast("Tag deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["cms-blog-tags"] })
    },
    onError: (error) => {
      showErrorToast(`Failed to delete tag: ${error}`)
    },
  })

  const handleEdit = (tag: BlogTagPublic) => {
    setSelectedTag(tag)
    setDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedTag(undefined)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedTag(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Blog Tags</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </DialogTrigger>
            <TagDialog tag={selectedTag} onClose={handleClose} />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {!tags?.data.length ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Tag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No tags yet</h3>
            <p className="text-muted-foreground">Create tags to categorize your blog posts</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.data.map((tag) => (
              <div key={tag.id} className="group relative">
                <Badge
                  variant={tag.is_active ? "default" : "secondary"}
                  className="pr-8"
                >
                  {tag.name}
                </Badge>
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleEdit(tag)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{tag.name}"? This action cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteMutation.mutate(tag.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
