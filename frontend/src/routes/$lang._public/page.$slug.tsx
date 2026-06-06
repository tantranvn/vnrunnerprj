import { createFileRoute, notFound } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { CmsPagesService } from "@/client"
import { Separator } from "@/components/ui/separator"
import { generateMetaTags, StructuredData, generateWebPageSchema } from "@/lib/seo"
import { formatDateLong } from "@/lib/utils"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/$lang/_public/page/$slug")({
  component: CMSPage,
  loader: async ({ params }) => {
    try {
      const page = await CmsPagesService.readPageBySlug({
        slug: params.slug,
      })
      return { page }
    } catch (error) {
      throw notFound()
    }
  },
  head: ({ loaderData }) => {
    const page = loaderData?.page
    if (!page) {
      return {
        meta: generateMetaTags({
          title: "Page Not Found - VNRunner",
          description: "The requested page could not be found.",
          canonicalUrl: baseUrl,
        }),
      }
    }

    return {
      meta: generateMetaTags({
        title: page.meta_title || `${page.title} - VNRunner`,
        description: page.meta_description || page.excerpt || page.title,
        keywords: page.meta_keywords || "",
        canonicalUrl: page.canonical_url || `${baseUrl}/page/${page.slug}`,
        ogImage: page.og_image_url || "",
        ogType: "website",
      }),
    }
  },
})

function CMSPage() {
  const { i18n, t } = useTranslation()
  const { slug } = Route.useParams()
  const currentLang = i18n.language || "vi"
  const loaderData = Route.useLoaderData()

  const { data: page } = useSuspenseQuery({
    queryKey: ["cms-page", slug],
    queryFn: () => CmsPagesService.readPageBySlug({ slug }),
    initialData: loaderData.page,
  })

  const webPageSchema = generateWebPageSchema({
    name: page.title,
    description: page.excerpt || page.meta_description || "",
    url: page.canonical_url || `${baseUrl}/page/${page.slug}`,
    datePublished: page.published_at || page.created_at,
    dateModified: page.updated_at,
  })

  // Handle different templates if needed
  const renderContent = () => {
    // You can add custom template rendering logic here
    switch (page.template) {
      default:
        return (
          <div
            className="prose prose-lg dark:prose-invert max-w-none
              prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mt-0 prose-h1:mb-8
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
            itemProp="mainContentOfPage"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: CMS content is trusted
            dangerouslySetInnerHTML={{ __html: page.content || "" }}
          />
        )
    }
  }

  return (
    <>
      <StructuredData data={webPageSchema} />
      
      <div className="w-full py-12 md:py-16 lg:py-20">
        <div className="container max-w-225">
          <article className="space-y-8" itemScope itemType="https://schema.org/WebPage">
            <meta itemProp="name" content={page.title} />
            
            {/* Header */}
            <header className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight" itemProp="headline">
                {page.title}
              </h1>

              {page.excerpt && (
                <p className="text-xl text-muted-foreground leading-relaxed" itemProp="description">
                  {page.excerpt}
                </p>
              )}
            </header>

            <Separator />

            {/* Content */}
            {page.content && renderContent()}

            {/* Footer - Last Updated */}
            {page.updated_at && (
              <footer className="pt-8 border-t">
                <p className="text-sm text-muted-foreground" itemProp="dateModified">
                  {t("page.lastUpdated", "Last updated")}: {formatDateLong(page.updated_at, currentLang)}
                </p>
              </footer>
            )}
          </article>
        </div>
      </div>
    </>
  )
}
