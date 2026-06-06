// @ts-nocheck - Disabled due to duplicate react-hook-form type definitions in node_modules
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Save, Upload } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  type BlogPostCreate,
  type BlogPostUpdate,
  CmsBlogCategoriesService,
  CmsBlogPostsService,
  CmsBlogTagsService,
} from "@/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { LoadingButton } from "@/components/ui/loading-button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import useCustomToast from "@/hooks/useCustomToast"
import { toDateTimeLocalString } from "@/lib/utils"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  featured_image_url: z.string().optional(),
  featured_image_alt: z.string().optional(),
  status: z.enum(["draft", "published", "scheduled", "archived"]),
  category_id: z.string().optional(),
  tag_ids: z.array(z.string()).optional(),
  is_featured: z.boolean(),
  is_sticky: z.boolean(),
  reading_time_minutes: z.coerce.number().optional(),
  published_at: z.string().optional(),
  scheduled_at: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  meta_keywords: z.string().optional(),
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  og_image_url: z.string().optional(),
  canonical_url: z.string().optional(),
  default_language: z.string(),
})

type FormData = z.infer<typeof formSchema>

interface BlogPostEditorProps {
  postId?: string
}

export function BlogPostEditor({ postId }: BlogPostEditorProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const isEdit = Boolean(postId)

  // Fetch existing post data if editing
  const { data: existingPost } = useQuery({
    queryKey: ["cms-blog-post", postId],
    queryFn: () =>
      postId ? CmsBlogPostsService.readBlogPost({ postId }) : null,
    enabled: isEdit,
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["cms-blog-categories"],
    queryFn: () => CmsBlogCategoriesService.readBlogCategories({}),
  })

  // Fetch tags (for future tag selection implementation)
  const { data: _tagsData } = useQuery({
    queryKey: ["cms-blog-tags"],
    queryFn: () => CmsBlogTagsService.readBlogTags({}),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: existingPost
      ? {
          title: existingPost.title,
          slug: existingPost.slug,
          content: existingPost.content || "",
          excerpt: existingPost.excerpt || "",
          featured_image_url: existingPost.featured_image_url || "",
          featured_image_alt: existingPost.featured_image_alt || "",
          status: existingPost.status,
          category_id: existingPost.category_id || "",
          is_featured: existingPost.is_featured,
          is_sticky: existingPost.is_sticky,
          default_language: existingPost.default_language,
          reading_time_minutes: existingPost.reading_time_minutes ?? undefined,
          published_at: existingPost.published_at || "",
          scheduled_at: existingPost.scheduled_at || "",
          meta_title: existingPost.meta_title || "",
          meta_description: existingPost.meta_description || "",
          meta_keywords: existingPost.meta_keywords || "",
          og_title: existingPost.og_title || "",
          og_description: existingPost.og_description || "",
          og_image_url: existingPost.og_image_url || "",
          canonical_url: existingPost.canonical_url || "",
        }
      : {
          title: "",
          slug: "",
          content: "",
          excerpt: "",
          status: "draft" as const,
          is_featured: false,
          is_sticky: false,
          default_language: "en",
        },
  })

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    if (!isEdit) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
      form.setValue("slug", slug)
    }
  }

  const mutation = useMutation({
    mutationFn: (data: BlogPostCreate | BlogPostUpdate) => {
      if (isEdit && postId) {
        return CmsBlogPostsService.updateBlogPost({
          postId,
          requestBody: data as BlogPostUpdate,
        })
      }
      return CmsBlogPostsService.createBlogPost({
        requestBody: data as BlogPostCreate,
      })
    },
    onSuccess: () => {
      showSuccessToast(
        isEdit
          ? "Blog post updated successfully!"
          : "Blog post created successfully!",
      )
      queryClient.invalidateQueries({ queryKey: ["cms-blog-posts"] })
      navigate({ to: "/admin/cms/blog/posts" })
    },
    onError: (error) => {
      showErrorToast(`Failed to save blog post: ${error}`)
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {isEdit ? "Edit Blog Post" : "Create New Blog Post"}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/admin/cms/blog/posts" })}
            >
              Cancel
            </Button>
            <LoadingButton type="submit" loading={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isEdit ? "Update" : "Create"} Post
            </LoadingButton>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="seo">SEO</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleTitleChange(e.target.value)
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
                      <FormDescription>
                        URL-friendly version of the title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Excerpt</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Short description for previews
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="featured_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder="/media/blog/image.jpg"
                          />
                          <Button type="button" variant="outline" size="icon">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured_image_alt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image Alt Text</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormDescription>
                        Describe the image for accessibility
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="meta_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Title</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="meta_keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Keywords</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="keyword1, keyword2, keyword3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="og_title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Title</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="og_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ""}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="og_image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Open Graph Image URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="canonical_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriesData?.data.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="default_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="vi">Vietnamese</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reading_time_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reading Time (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="published_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Published Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={
                            field.value
                              ? toDateTimeLocalString(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={
                            field.value
                              ? toDateTimeLocalString(field.value)
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Featured Post
                        </FormLabel>
                        <FormDescription>
                          Highlight this post on the homepage
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_sticky"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Sticky Post</FormLabel>
                        <FormDescription>
                          Pin this post to the top of lists
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  )
}
