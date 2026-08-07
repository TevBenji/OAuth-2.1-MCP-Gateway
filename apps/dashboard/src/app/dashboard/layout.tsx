'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import {
  Home,
  BarChart3,
  Building2,
  Server,
  FileText,
  Key,
  Shield,
  Settings,
  SlidersHorizontal,
  Menu,
  LogOut,
} from 'lucide-react';

const navigation = [
  { label: 'Overview', href: '/dashboard', icon: Home },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Tenants', href: '/dashboard/tenants', icon: Building2 },
  { label: 'MCP Servers', href: '/dashboard/mcp-servers', icon: Server },
  { label: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText },
  { label: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { label: 'Gateway Info', href: '/dashboard/gateway-info', icon: Shield },
  { label: 'Gateway Settings', href: '/dashboard/gateway-settings', icon: SlidersHorizontal },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
] as const;

function LogoMark() {
  return (
    <Link href='/dashboard' className='flex items-center gap-2.5'>
      <span className='flex h-7 w-7 items-center justify-center rounded-md bg-wise-green-bright text-sm font-black text-wise-green-forest'>
        G
      </span>
      <span className='text-[15px] font-semibold tracking-tight text-white'>MCP Gateway</span>
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  return (
    <div className='min-h-screen bg-wise-gray-50' suppressHydrationWarning>
      {/* Mobile top bar */}
      <header className='fixed top-0 z-40 flex h-14 w-full items-center gap-3 bg-wise-green-forest px-4 lg:hidden'>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className='rounded-lg p-2 text-white/70 transition hover:bg-white/10 hover:text-white'
          aria-label='Toggle navigation'
        >
          <Menu className='h-5 w-5' />
        </button>
        <LogoMark />
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 transform flex-col bg-wise-green-forest transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='hidden h-16 items-center border-b border-white/[0.08] px-5 lg:flex'>
          <LogoMark />
        </div>

        <nav className='flex-1 space-y-1 overflow-y-auto p-4 pt-16 lg:pt-4'>
          {navigation.map(item => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`relative flex items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-white/10 font-semibold text-wise-green-bright'
                    : 'font-medium text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className='mr-3 h-[18px] w-[18px]' />
                <span className='flex-1'>{item.label}</span>
                {active && (
                  <span className='absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-wise-green-bright' />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div className='border-t border-white/[0.08] p-4'>
          <div className='flex items-center justify-between gap-2'>
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold text-white'>
                {session?.user?.name || 'User'}
              </p>
              <p className='truncate text-xs text-white/50'>{session?.user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className='shrink-0 rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-wise-green-bright'
              title='Sign out'
              aria-label='Sign out'
            >
              <LogOut className='h-[18px] w-[18px]' />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className='fixed inset-0 z-20 bg-wise-green-forest/40 backdrop-blur-sm lg:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className='overflow-y-auto p-6 pt-20 lg:p-8 lg:pl-72 lg:pt-8'>
        <div className='mx-auto max-w-7xl'>{children}</div>
      </main>
    </div>
  );
}
