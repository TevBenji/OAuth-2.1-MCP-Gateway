'use client';

import { useAuth, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  Building2,
  Settings,
  FolderOpen,
  Key,
  BarChart3,
  FileText,
  CreditCard,
  Receipt,
  DollarSign,
  FileDown,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Home,
  Gauge,
  Shield,
  Users,
  HelpCircle,
  Bell,
  Search,
  Plus,
  Ticket,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon?: any;
  children?: NavItem[];
  badge?: string;
}

const navigation: { section: string; items: NavItem[] }[] = [
  {
    section: 'Getting Started',
    items: [
      {
        label: 'Onboarding Guide',
        href: '/onboarding',
        icon: Plus,
      },
    ],
  },
  {
    section: 'Organization',
    items: [
      {
        label: 'General',
        href: '/dashboard/organization/general',
        icon: Settings,
      },
      {
        label: 'Projects',
        href: '/dashboard/organization/projects',
        icon: FolderOpen,
      },
      {
        label: 'API Keys',
        href: '/dashboard/organization/api-keys',
        icon: Key,
        badge: 'New',
      },
      {
        label: 'Usage Limits',
        href: '/dashboard/organization/usage-limits',
        icon: Gauge,
      },
    ],
  },
  {
    section: 'Gateway',
    items: [
      {
        label: 'How It Works',
        href: '/dashboard/gateway-info',
        icon: Shield,
      },
      {
        label: 'Gateway Settings',
        href: '/dashboard/gateway-settings',
        icon: Settings,
      },
    ],
  },
  {
    section: 'Analytics',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    section: 'Resources',
    items: [
      {
        label: 'Files',
        href: '/dashboard/resources/files',
        icon: FileText,
      },
    ],
  },
  {
    section: 'Billing',
    items: [
      {
        label: 'Overview',
        href: '/dashboard/billing/overview',
        icon: CreditCard,
      },
      {
        label: 'Recharge',
        href: '/dashboard/billing/recharge',
        icon: DollarSign,
      },
      {
        label: 'Recharge Details',
        href: '/dashboard/billing/recharge-details',
        icon: Receipt,
      },
      {
        label: 'Billing Details',
        href: '/dashboard/billing/details',
        icon: FileText,
      },
      {
        label: 'Invoice',
        href: '/dashboard/billing/invoice',
        icon: Receipt,
      },
      {
        label: 'Voucher',
        href: '/dashboard/billing/voucher',
        icon: Ticket,
      },
      {
        label: 'Export Records',
        href: '/dashboard/billing/export',
        icon: FileDown,
      },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['Getting Started', 'Organization', 'Billing']);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscription, setSubscription] = useState<{
    plan: string;
    apiCallsUsed: number;
    apiCallLimit: number;
  } | null>(null);

  // Convex subscription query
  const subscriptionData = useQuery(
    api.users.getSubscription,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (isLoaded && !userId) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (subscriptionData) {
      setSubscription(subscriptionData);
    }
  }, [subscriptionData]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (!isLoaded || !userId) {
    return (
      <div
        className='min-h-screen flex items-center justify-center bg-wise-gray-50'
        suppressHydrationWarning
      >
        <div className='loader-wise' suppressHydrationWarning></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-wise-gray-50' suppressHydrationWarning>
      {/* Top Navigation Bar */}
      <header className='fixed top-0 w-full h-16 bg-white border-b border-wise-gray-200 z-40' suppressHydrationWarning>
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

          <div className='flex items-center space-x-4'>
            {/* Search Bar */}
            <div className='hidden md:flex items-center'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-wise-gray-400' />
                <input
                  type='text'
                  placeholder='Search...'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className='pl-10 pr-4 py-2 w-64 bg-wise-gray-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wise-green-primary/20 focus:bg-white'
                />
              </div>
            </div>

            {/* Quick Actions */}
            <button className='p-2 rounded-lg hover:bg-wise-gray-50 relative'>
              <Bell className='w-5 h-5 text-wise-gray-600' />
              <span className='absolute top-1 right-1 w-2 h-2 bg-wise-green-primary rounded-full'></span>
            </button>

            <button className='p-2 rounded-lg hover:bg-wise-gray-50'>
              <HelpCircle className='w-5 h-5 text-wise-gray-600' />
            </button>

            {/* User Menu */}
            <div className='flex items-center space-x-3 pl-3 border-l border-wise-gray-200'>
              <div className='hidden sm:block text-right'>
                <p className='text-sm font-medium text-wise-gray-900'>{user?.fullName || 'User'}</p>
                <p className='text-xs text-wise-gray-500'>
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
              <UserButton
                afterSignOutUrl='/'
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  },
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <div className='flex pt-16' suppressHydrationWarning>
        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-wise-gray-200 transform transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          suppressHydrationWarning
        >
          <div className='h-full overflow-y-auto pt-16 lg:pt-0'>
            <nav className='p-4 space-y-6'>
              {/* Dashboard Link */}
              <Link
                href='/dashboard'
                className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                  pathname === '/dashboard'
                    ? 'bg-wise-green-50 text-wise-green-primary font-medium'
                    : 'text-wise-gray-700 hover:bg-wise-gray-50'
                }`}
              >
                <Home className='w-5 h-5 mr-3' />
                Dashboard
              </Link>

              {/* Navigation Sections */}
              {navigation.map(section => (
                <div key={section.section}>
                  <button
                    onClick={() => toggleSection(section.section)}
                    className='flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-wise-gray-500 uppercase tracking-wider hover:text-wise-gray-700 transition-colors'
                  >
                    <span>{section.section}</span>
                    {expandedSections.includes(section.section) ? (
                      <ChevronDown className='w-4 h-4' />
                    ) : (
                      <ChevronRight className='w-4 h-4' />
                    )}
                  </button>

                  {expandedSections.includes(section.section) && (
                    <div className='mt-2 space-y-1'>
                      {section.items.map(item => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                          <Link
                            key={item.label}
                            href={item.href || '#'}
                            className={`flex items-center px-3 py-2 rounded-lg transition-all relative ${
                              active
                                ? 'bg-wise-green-50 text-wise-green-primary font-medium'
                                : 'text-wise-gray-700 hover:bg-wise-gray-50'
                            }`}
                          >
                            {Icon && <Icon className='w-5 h-5 mr-3' />}
                            <span className='flex-1'>{item.label}</span>
                            {item.badge && (
                              <span className='ml-2 px-2 py-0.5 text-xs bg-wise-green-100 text-wise-green-700 rounded-full font-medium'>
                                {item.badge}
                              </span>
                            )}
                            {active && (
                              <div className='absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-wise-green-primary rounded-r-full' />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Additional Links */}
              <div className='pt-6 border-t border-wise-gray-200'>
                <Link
                  href='/dashboard/team'
                  className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                    pathname.startsWith('/dashboard/team')
                      ? 'bg-wise-green-50 text-wise-green-primary font-medium'
                      : 'text-wise-gray-700 hover:bg-wise-gray-50'
                  }`}
                >
                  <Users className='w-5 h-5 mr-3' />
                  Team Members
                </Link>
                <Link
                  href='/dashboard/settings'
                  className={`flex items-center px-3 py-2 rounded-lg transition-all ${
                    pathname.startsWith('/dashboard/settings')
                      ? 'bg-wise-green-50 text-wise-green-primary font-medium'
                      : 'text-wise-gray-700 hover:bg-wise-gray-50'
                  }`}
                >
                  <Settings className='w-5 h-5 mr-3' />
                  Settings
                </Link>
              </div>

              {/* Quick Create Button */}
              <div className='pt-6'>
                <button className='w-full btn-wise-primary px-4 py-2.5 flex items-center justify-center'>
                  <Plus className='w-5 h-5 mr-2' />
                  New Project
                </button>
              </div>

              {/* Usage Stats */}
              <div className='pt-6 border-t border-wise-gray-200'>
                <div className='px-3 py-4 bg-wise-gray-50 rounded-lg'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-xs font-medium text-wise-gray-600'>API Usage</span>
                    <span className='text-xs text-wise-gray-500'>This Month</span>
                  </div>
                  {subscription ? (
                    <div className='mb-2'>
                      <div className='flex items-end justify-between mb-1'>
                        <span className='text-2xl font-bold text-wise-gray-900'>
                          {subscription.apiCallsUsed.toLocaleString()}
                        </span>
                        <span className='text-xs text-wise-gray-500'>
                          / {subscription.apiCallLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className='w-full h-2 bg-wise-gray-200 rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-wise-green-primary rounded-full transition-all duration-300'
                          style={{
                            width: `${Math.min(100, (subscription.apiCallsUsed / subscription.apiCallLimit) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className='mb-2 animate-pulse'>
                      <div className='h-8 bg-wise-gray-200 rounded mb-2'></div>
                      <div className='h-2 bg-wise-gray-200 rounded'></div>
                    </div>
                  )}
                  <Link
                    href='/dashboard/billing/overview'
                    className='text-xs text-wise-green-primary hover:text-wise-green-600 font-medium'
                  >
                    {subscription?.plan === 'FREE' ? 'Upgrade Plan →' : 'Manage Plan →'}
                  </Link>
                </div>
              </div>
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
        <main className='flex-1 p-6 lg:p-8 overflow-y-auto' suppressHydrationWarning>
          <div className='max-w-7xl mx-auto' suppressHydrationWarning>{children}</div>
        </main>
      </div>
    </div>
  );
}
