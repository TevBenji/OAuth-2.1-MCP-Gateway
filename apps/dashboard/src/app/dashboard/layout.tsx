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
      {/* Top Navigation Bar */}
      <header className='fixed top-0 w-full h-16 bg-white border-b border-wise-gray-200 z-40'>
        <div className='flex items-center justify-between h-full px-4 lg:px-6'>
          <div className='flex items-center space-x-4'>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='lg:hidden p-2 rounded-lg hover:bg-wise-gray-50'
            >
              <Menu className='w-5 h-5 text-wise-gray-700' />
            </button>
            <Link href='/dashboard' className='flex items-center space-x-2'>
              <div className='w-8 h-8 bg-wise-green-primary rounded-lg flex items-center justify-center'>
                <Shield className='w-5 h-5 text-white' />
              </div>
              <span className='font-bold text-xl text-wise-gray-900 hidden sm:block'>
                MCP Gateway
              </span>
            </Link>
          </div>

          <div className='flex items-center space-x-3 pl-3 border-l border-wise-gray-200'>
            <div className='hidden sm:block text-right'>
              <p className='text-sm font-medium text-wise-gray-900'>
                {session?.user?.name || 'User'}
              </p>
              <p className='text-xs text-wise-gray-500'>{session?.user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className='p-2 rounded-lg hover:bg-wise-gray-50'
              title='Sign out'
              aria-label='Sign out'
            >
              <LogOut className='w-5 h-5 text-wise-gray-600' />
            </button>
          </div>
        </div>
      </header>

      <div className='flex pt-16'>
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-wise-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className='h-full overflow-y-auto pt-16 lg:pt-0'>
            <nav className='p-4 space-y-1'>
              {navigation.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-all relative ${
                      active
                        ? 'bg-wise-green-50 text-wise-green-primary font-medium'
                        : 'text-wise-gray-700 hover:bg-wise-gray-50'
                    }`}
                  >
                    <Icon className='w-5 h-5 mr-3' />
                    <span className='flex-1'>{item.label}</span>
                    {active && (
                      <div className='absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-wise-green-primary rounded-r-full' />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className='fixed inset-0 bg-black/40 z-20 lg:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className='flex-1 p-6 lg:p-8 overflow-y-auto'>
          <div className='max-w-7xl mx-auto'>{children}</div>
        </main>
      </div>
    </div>
  );
}
