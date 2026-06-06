import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Calendar, Clock, Eye } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CmsBlogPostsService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { generateMetaTags } from "@/lib/seo"
import { formatDateLong, getMediaUrl } from "@/lib/utils"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/$lang/_public/blog/")({
  component: BlogIndexPage,
  loader: async () => {
    // Prefetch blog posts
    return {
      posts: await CmsBlogPostsService.readBlogPosts({
        status: "published",
        limit: 100,
      }),
    }
  },
  head: () => ({
    meta: generateMetaTags({
      title:
        "Blog - VNRunner | Running Tips, Race Reports & Trail Running Stories",
      description:
        "Read the latest running tips, race reports, training guides, and trail running stories from Vietnam's running community. Expert advice for runners of all levels.",
      keywords:
        "running blog Vietnam, trail running tips, race reports, marathon training, running community Vietnam",
      canonicalUrl: `${baseUrl}/blog`,
      ogType: "website",
    }),
  }),
})

function BlogIndexPage() {
  const { t, i18n } = useTranslation()
  const { lang } = Route.useParams()
  const currentLang = lang || i18n.language || "vi"
  const loaderData = Route.useLoaderData()

  const { data: postsData } = useSuspenseQuery({
    queryKey: ["blog-posts", { status: "published" }],
    queryFn: () =>
      CmsBlogPostsService.readBlogPosts({
        status: "published",
        limit: 100,
      }),
    initialData: loaderData.posts,
  })

  const posts = postsData?.data ?? []

  return (
    <div className="w-full py-12 md:py-16 lg:py-20">
      <div className="container max-w-[1100px]">
        <article className="space-y-12">
          {/* Header */}
          <header className="space-y-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {t("blog.title", "Blog")}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {t(
                "blog.description",
                "Discover running tips, race reports, and stories from Vietnam's running community",
              )}
            </p>
          </header>

          {/* Blog Posts Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {t(
                  "blog.noPosts",
                  "No blog posts available yet. Check back soon!",
                )}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/${currentLang}/blog/${post.slug}`}
                  className="group"
                >
                  <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                    {post.featured_image_url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={getMediaUrl(post.featured_image_url)}
                          alt={post.featured_image_alt || post.title}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <CardContent className="p-6 space-y-4">
                      {/* Title */}
                      <h2 className="text-xl font-bold tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-muted-foreground line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta Information */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {post.published_at && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            <span>
                              {formatDateLong(post.published_at, currentLang)}
                            </span>
                          </div>
                        )}
                        {post.reading_time_minutes && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            <span>
                              {post.reading_time_minutes}{" "}
                              {t("blog.minRead", "min read")}
                            </span>
                          </div>
                        )}
                        {post.view_count !== undefined &&
                          post.view_count > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Eye className="size-4" />
                              <span>{post.view_count.toLocaleString()}</span>
                            </div>
                          )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2">
                        {post.is_featured && (
                          <Badge variant="default" className="text-xs">
                            {t("blog.featured", "Featured")}
                          </Badge>
                        )}
                        {post.is_sticky && (
                          <Badge variant="secondary" className="text-xs">
                            {t("blog.sticky", "Pinned")}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </article>
      </div>
    </div>
  )
}
