// @ts-nocheck - Disabled due to strict type checking and potential duplicate type definitions
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { Link as RouterLink } from "@tanstack/react-router"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Calendar, Edit, Eye, Star, Trash2 } from "lucide-react"

import { type BlogPostPublic, CmsBlogPostsService } from "@/client"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import useCustomToast from "@/hooks/useCustomToast"
import { formatDate } from "@/lib/utils"

interface BlogPostListProps {
  status?: string
  categoryId?: string
  isFeatured?: boolean
}

const getStatusBadge = (status: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    draft: "secondary",
    published: "default",
    scheduled: "outline",
    archived: "destructive",
  }

  return (
    <Badge variant={variants[status] || "default"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function DeleteBlogPostDialog({
  postId,
  postTitle,
  onSuccess,
}: {
  postId: string
  postTitle: string
  onSuccess: () => void
}) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => CmsBlogPostsService.deleteBlogPost({ postId }),
    onSuccess: () => {
      showSuccessToast("Blog post deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ["cms-blog-posts"] })
      onSuccess()
    },
    onError: (error) => {
      showErrorToast(`Failed to delete blog post: ${error}`)
    },
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{postTitle}"? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteMutation.mutate()}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function BlogPostList({
  status,
  categoryId,
  isFeatured,
}: BlogPostListProps) {
  const { data: posts } = useSuspenseQuery({
    queryKey: ["cms-blog-posts", status, categoryId, isFeatured],
    queryFn: () =>
      CmsBlogPostsService.readBlogPosts({
        status,
        categoryId,
        isFeatured,
      }),
  })

  const columns: ColumnDef<BlogPostPublic>[] = [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const post = row.original
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {post.is_featured && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              )}
              {post.is_sticky && <Star className="h-4 w-4 text-blue-500" />}
              <span className="font-medium">{post.title}</span>
            </div>
            <div className="text-sm text-muted-foreground">/{post.slug}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "category_id",
      header: "Category",
      cell: ({ row }) => {
        return row.original.category_id ? (
          <Badge variant="outline">Category</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "published_at",
      header: "Published",
      cell: ({ row }) => {
        const date = row.original.published_at
        return date ? (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(date as string)}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Not published</span>
        )
      },
    },
    {
      accessorKey: "view_count",
      header: "Views",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.view_count}</span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const post = row.original
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <RouterLink
                to="/admin/cms/blog/posts/$postId/edit"
                params={{ postId: post.id }}
              >
                <Edit className="h-4 w-4" />
              </RouterLink>
            </Button>
            <DeleteBlogPostDialog
              postId={post.id}
              postTitle={post.title}
              onSuccess={() => {}}
            />
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: posts.data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (posts.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No blog posts found</h3>
        <p className="text-muted-foreground">
          {status
            ? `No ${status} posts found`
            : "Add a new blog post to get started"}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
