import AppChrome from '@/components/layout/AppChrome'

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppChrome>{children}</AppChrome>
}
