// src/app/(dashboard)/layout.tsx
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
  Cog6ToothIcon,
  ComputerDesktopIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Letter Maintenance', href: '/letter-maintenance', icon: DocumentTextIcon },
  { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
  { name: 'Template Builder', href: '/template-builder', icon: PencilSquareIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Client Simulator', href: '/client-simulator', icon: ComputerDesktopIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-[#F5F5F1]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Sidebar content */}
        <div className="flex flex-col flex-1 bg-[#1E1E1E] border-r border-gray-800">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4">
            {!sidebarCollapsed && (
              <Image
                src="/logowhite.png"
                alt="Ghostwriter"
                width={150}
                height={32}
                className="h-8 w-auto"
                priority
              />
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-5 w-5" />
              ) : (
                <ChevronLeftIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-[#8a7fae] text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  )}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <item.icon
                    className={cn(
                      "flex-shrink-0 h-5 w-5",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-white",
                      sidebarCollapsed ? "mx-auto" : "mr-3"
                    )}
                    aria-hidden="true"
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="px-3 py-4 border-t border-gray-700">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-[#8a7fae] flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">User</p>
                  <p className="text-xs text-gray-400">user@example.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}