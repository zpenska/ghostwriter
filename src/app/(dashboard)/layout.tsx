'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  HomeIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  ChartBarIcon,
  CogIcon,
  BeakerIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Letter Maintenance', href: '/letter-maintenance', icon: DocumentTextIcon },
  { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
  { name: 'Template Builder', href: '/template-builder', icon: PencilSquareIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
  { name: 'Client Simulator', href: '/client-simulator', icon: BeakerIcon },
];

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={classNames(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-sidebar-bg">
          <div className="flex h-16 shrink-0 items-center px-6">
            <Image
              className="h-8 w-auto"
              src="/logowhite.png"
              alt="Ghostwriter"
              width={150}
              height={32}
            />
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  pathname === item.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
              >
                <item.icon
                  className={classNames(
                    pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-gray-300',
                    'mr-3 h-6 w-6 shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className={classNames(
        'hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300',
        sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
      )}>
        <div className="flex flex-col flex-1 bg-sidebar-bg">
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            {!sidebarCollapsed && (
              <Image
                className="h-8 w-auto"
                src="/logowhite.png"
                alt="Ghostwriter"
                width={150}
                height={32}
              />
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-6 w-6" />
              ) : (
                <ChevronLeftIcon className="h-6 w-6" />
              )}
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  pathname === item.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={classNames(
                    pathname === item.href ? 'text-white' : 'text-gray-400 group-hover:text-gray-300',
                    sidebarCollapsed ? 'mx-auto h-6 w-6' : 'mr-3 h-6 w-6 shrink-0'
                  )}
                  aria-hidden="true"
                />
                {!sidebarCollapsed && item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={classNames(
        'flex flex-1 flex-col transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
      )}>
        <div className="sticky top-0 z-10 flex h-16 shrink-0 bg-white shadow lg:hidden">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}