import { createFileRoute } from '@tanstack/react-router'
import { ProfileWorkspacePage } from '@/components/pages/profile-page'

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  return <ProfileWorkspacePage />;
}
