import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Calendar, Clock, Eye, ArrowLeft, Share2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CmsBlogPostsService } from "@/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { generateMetaTags, generateArticleSchema, StructuredData } from "@/lib/seo"
import { formatDateLong, getMediaUrl } from "@/lib/utils"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/$lang/_public/blog/$slug")({
  component: BlogPostPage,
  loader: async ({ params }) => {
    try {
      const post = await CmsBlogPostsService.readBlogPostBySlug({
        slug: params.slug,
      })
      return { post }
    } catch (error) {
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
  const { t, i18n } = useTranslation()
  const { lang, slug } = Route.useParams()
  const currentLang = lang || i18n.language || "vi"
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
    const url = `${baseUrl}/${currentLang}/blog/${post.slug}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.title,
          url,
        })
      } catch (error) {
        // User cancelled share or error occurred
        console.log("Share cancelled or failed:", error)
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url)
      // You could show a toast notification here
    }
  }

  return (
    <>
      <StructuredData data={articleSchema} />
      
      <div className="w-full py-12 md:py-16 lg:py-20">
        <div className="container max-w-[900px]">
          {/* Back Button */}
          <div className="mb-8">
            <Link to="/$lang/blog" params={{ lang: currentLang }}>
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="size-4" />
                {t("blog.backToList", "Back to Blog")}
              </Button>
            </Link>
          </div>

          <article className="space-y-8" itemScope itemType="https://schema.org/BlogPosting">
            {/* Header */}
            <header className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {post.is_featured && (
                  <Badge variant="default">
                    {t("blog.featured", "Featured")}
                  </Badge>
                )}
                {post.is_sticky && (
                  <Badge variant="secondary">
                    {t("blog.sticky", "Pinned")}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight" itemProp="headline">
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed" itemProp="description">
                  {post.excerpt}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <time dateTime={publishedDate} itemProp="datePublished" className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>{formatDateLong(publishedDate, currentLang)}</span>
                </time>
                {post.reading_time_minutes && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    <span>
                      {post.reading_time_minutes} {t("blog.minRead", "min read")}
                    </span>
                  </div>
                )}
                {post.view_count !== undefined && post.view_count > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Eye className="size-4" />
                    <span>{post.view_count.toLocaleString()} {t("blog.views", "views")}</span>
                  </div>
                )}
              </div>

              {/* Share Button */}
              <div>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                  <Share2 className="size-4" />
                  {t("blog.share", "Share")}
                </Button>
              </div>
            </header>

            <Separator />

            {/* Featured Image */}
            {post.featured_image_url && (
              <figure className="space-y-3" itemProp="image" itemScope itemType="https://schema.org/ImageObject">
                <div className="aspect-video overflow-hidden rounded-lg">
                  <img
                    src={getMediaUrl(post.featured_image_url)}
                    alt={post.featured_image_alt || post.title}
                    className="object-cover w-full h-full"
                    itemProp="url"
                  />
                  <meta itemProp="width" content="1200" />
                  <meta itemProp="height" content="675" />
                </div>
                {post.featured_image_alt && (
                  <figcaption className="text-sm text-muted-foreground text-center" itemProp="caption">
                    {post.featured_image_alt}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Content */}
            {post.content && (
              <div
                className="prose prose-lg dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                  prose-p:leading-relaxed prose-p:text-muted-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-lg prose-img:shadow-md
                  prose-blockquote:border-l-4 prose-blockquote:border-primary
                  prose-blockquote:pl-6 prose-blockquote:italic
                  prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                  prose-pre:bg-muted prose-pre:border
                  prose-ul:list-disc prose-ol:list-decimal
                  prose-li:text-muted-foreground"
                itemProp="articleBody"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: CMS content is trusted
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}

            <Separator className="my-12" />

            {/* Footer */}
            <footer className="space-y-6">
              {/* Publish/Update Dates */}
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  {t("blog.published", "Published")}: {formatDateLong(publishedDate, currentLang)}
                </p>
                {post.updated_at !== post.created_at && (
                  <p itemProp="dateModified">
                    {t("blog.lastUpdated", "Last updated")}: {formatDateLong(post.updated_at, currentLang)}
                  </p>
                )}
              </div>

              {/* Back to Blog */}
              <Link to="/$lang/blog" params={{ lang: currentLang }}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="size-4" />
                  {t("blog.backToList", "Back to Blog")}
                </Button>
              </Link>
            </footer>
          </article>
        </div>
      </div>
    </>
  )
}
