import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { requireOrganization, requireUser } from '@/lib/session'

// Données propres à chaque utilisateur : jamais de pré-rendu statique.
export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, org] = await Promise.all([requireUser(), requireOrganization()])
  const account = { fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl, companyName: org.name }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar account={account} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar account={account} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
