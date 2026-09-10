import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/verifikasi')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/verifikasi"!</div>
}
