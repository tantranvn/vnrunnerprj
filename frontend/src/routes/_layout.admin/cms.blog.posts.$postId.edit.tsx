import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_layout/admin/cms/blog/posts/$postId/edit',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_layout/admin/cms/blog/posts/$postId/edit"!</div>
}
