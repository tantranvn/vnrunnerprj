import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeft, Calendar, Clock, Eye, Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CmsBlogPostsService } from "@/client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  generateArticleSchema,
  generateMetaTags,
  StructuredData,
} from "@/lib/seo"
import { formatDateLong, getMediaUrl } from "@/lib/utils"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/_public/blog/$slug")({
  component: BlogPostPage,
  loader: async ({ params }) => {
    try {
      const post = await CmsBlogPostsService.readBlogPostBySlug({
        slug: params.slug,
      })
      return { post }
    } catch (_error) {
      throw notFound()
    }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post
    if (!post) {
      return {
        meta: generateMetaTags({
          title: "Blog Post Not Found - VNRunner",
          description: "The requested blog post could not be found.",
          canonicalUrl: `${baseUrl}/blog`,
        }),
      }
    }

    return {
      meta: generateMetaTags({
        title: post.meta_title || `${post.title} - VNRunner Blog`,
        description: post.meta_description || post.excerpt || post.title,
        keywords: post.meta_keywords || "",
        canonicalUrl: post.canonical_url || `${baseUrl}/blog/${post.slug}`,
        ogImage: post.og_image_url || post.featured_image_url || "",
        ogType: "article",
        publishedTime: post.published_at || post.created_at,
        modifiedTime: post.updated_at,
      }),
    }
  },
})

function BlogPostPage() {
  const { t } = useTranslation()
  const { slug } = Route.useParams()
  const loaderData = Route.useLoaderData()

  const { data: post } = useSuspenseQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => CmsBlogPostsService.readBlogPostBySlug({ slug }),
    initialData: loaderData.post,
  })

  const publishedDate = post.published_at || post.created_at

  const articleSchema = generateArticleSchema({
    headline: post.title,
    description: post.excerpt || "",
    image: post.featured_image_url ? getMediaUrl(post.featured_image_url) : "",
    datePublished: publishedDate,
    dateModified: post.updated_at,
    authorName: "VNRunner Team",
    publisherName: "VNRunner",
    publisherLogo: `${baseUrl}/assets/images/favicon.png`,
  })

  const handleShare = async () => {
    const url = `${baseUrl}/blog/${post.slug}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url,
        })
      } catch (error) {
        console.log("Share cancelled or failed:", error)
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <>
      <StructuredData data={articleSchema} />

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("blog.backToList", "Back to Blog")}
        </Link>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="mb-8 rounded-lg overflow-hidden aspect-video">
            <img
              src={getMediaUrl(post.featured_image_url)}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Header */}
        <header className="mb-8">
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatDateLong(publishedDate)}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.reading_time_minutes || 5} {t("blog.minRead", "min read")}
            </span>
            {post.view_count !== undefined && (
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {post.view_count} {t("blog.views", "views")}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              {t("blog.share", "Share")}
            </Button>
          </div>
        </header>

        <Separator className="mb-8" />

        {/* Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none mb-12"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: CMS blog content is trusted
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        <Separator className="mb-8" />

        {/* Footer */}
        <footer className="flex items-center justify-between">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("blog.backToList", "Back to Blog")}
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            {t("blog.share", "Share")}
          </Button>
        </footer>
      </article>
    </>
  )
}
