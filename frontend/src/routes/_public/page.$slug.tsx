import { createFileRoute, notFound } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { CmsPagesService } from "@/client"
import { generateMetaTags, generateWebPageSchema, StructuredData } from "@/lib/seo"

const baseUrl = import.meta.env.VITE_FRONTEND_URL || "https://vnrunner.com"

export const Route = createFileRoute("/_public/page/$slug")({
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
        description: page.meta_description || page.title,
        keywords: page.meta_keywords || "",
        canonicalUrl: page.canonical_url || `${baseUrl}/page/${page.slug}`,
        ogImage: page.og_image_url || page.featured_image_url || "",
        ogType: "website",
      }),
    }
  },
})

function CMSPage() {
  const { t } = useTranslation()
  const { slug } = Route.useParams()
  const loaderData = Route.useLoaderData()

  const { data: page } = useSuspenseQuery({
    queryKey: ["cms-page", slug],
    queryFn: () => CmsPagesService.readPageBySlug({ slug }),
    initialData: loaderData.page,
  })

  const pageSchema = generateWebPageSchema({
    name: page.title,
    description: page.meta_description || page.title,
    url: `${baseUrl}/page/${page.slug}`,
  })

  // Template-specific rendering
  const renderPageContent = () => {
    switch (page.template) {
      case "full-width":
        return (
          <div className="w-full">
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        )

      case "sidebar-left":
        return (
          <div className="grid md:grid-cols-[300px_1fr] gap-8">
            <aside className="space-y-4">
              {/* Sidebar content could be added here */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{t("page.sidebar", "Navigation")}</h3>
              </div>
            </aside>
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        )

      case "sidebar-right":
        return (
          <div className="grid md:grid-cols-[1fr_300px] gap-8">
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
            <aside className="space-y-4">
              {/* Sidebar content could be added here */}
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">{t("page.sidebar", "Quick Links")}</h3>
              </div>
            </aside>
          </div>
        )

      case "landing":
        return (
          <div className="w-full">
            <div
              className="max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        )

      default:
        return (
          <div
            className="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        )
    }
  }

  return (
    <>
      <StructuredData data={pageSchema} />
      
      <div className={page.template === "landing" ? "w-full" : "container mx-auto px-4 py-12"}>
        {page.template !== "landing" && (
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{page.title}</h1>
          </header>
        )}
        
        {renderPageContent()}
      </div>
    </>
  )
}
