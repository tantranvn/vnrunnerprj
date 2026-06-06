import { createFileRoute, Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Calendar, Clock, Pin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CmsBlogPostsService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { generateMetaTags } from "@/lib/seo"
import { formatDate, getMediaUrl } from "@/lib/utils"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/_public/blog/")({
  component: BlogIndexPage,
  loader: async () => {
    const posts = await CmsBlogPostsService.readBlogPosts({
      status: "published",
      limit: 100,
    })
    return { posts }
  },
  head: () => ({
    meta: generateMetaTags({
      title: "Blog - VNRunner",
      description: "Read the latest news, tips, and stories from the Vietnamese running community.",
      canonicalUrl: `${baseUrl}/blog`,
    }),
  }),
})

function BlogIndexPage() {
  const { t, i18n } = useTranslation()
  const loaderData = Route.useLoaderData()
  const lang = "vi" // Default to Vietnamese for non-prefixed routes

  const { data: postsData } = useSuspenseQuery({
    queryKey: ["blog-posts", "published"],
    queryFn: () =>
      CmsBlogPostsService.readBlogPosts({ status: "published", limit: 100 }),
    initialData: loaderData.posts,
  })

  const posts = postsData.data || []
  const featuredPosts = posts.filter((p) => p.is_featured)
  const stickyPosts = posts.filter((p) => p.is_sticky && !p.is_featured)
  const regularPosts = posts.filter((p) => !p.is_featured && !p.is_sticky)

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t("blog.title", "VNRunner Blog")}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t("blog.description", "Latest news, tips, and stories from the Vietnamese running community")}
        </p>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t("blog.featured", "Featured")}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group"
              >
                <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getMediaUrl(post.featured_image_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">{t("blog.featured", "Featured")}</Badge>
                      {post.category && (
                        <Badge variant="outline">{post.category.name}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.read_time_minutes || 5} min read
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky Posts */}
      {stickyPosts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">{t("blog.pinned", "Pinned")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {stickyPosts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getMediaUrl(post.featured_image_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Pin className="h-4 w-4" />
                      {post.category && (
                        <Badge variant="outline">{post.category.name}</Badge>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Regular Posts */}
      {regularPosts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">{t("blog.allPosts", "All Posts")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {post.featured_image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={getMediaUrl(post.featured_image_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardHeader>
                    {post.category && (
                      <Badge variant="outline" className="mb-2 w-fit">
                        {post.category.name}
                      </Badge>
                    )}
                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.published_at || post.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {t("blog.noPosts", "No blog posts found.")}
          </p>
        </div>
      )}
    </div>
  )
}
