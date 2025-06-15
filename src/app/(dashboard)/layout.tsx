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

const navigation = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
  { name: 'Template Builder', href: '/template-builder', icon: PencilSquareIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Client Simulator', href: '/client-simulator', icon: ComputerDesktopIcon },
];

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Container with padding for rounded effect */}
      <div
        className={classNames(
          "flex flex-col transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-20 p-2" : "w-72 p-3"
        )}
      >
        {/* Rounded Sidebar content */}
        <div className="flex flex-col flex-1 bg-[#1E1E1E] rounded-xl shadow-lg border border-zinc-800">
          {/* Logo Section - Only show when expanded */}
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700">
              <div className="flex items-center space-x-3">
                <img
                  src="/favicon-32x32.png"
                  alt="Medecision"
                  className="h-8 w-8"
                />
                <span className="text-white text-base font-medium">Medecision</span>
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] p-2"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Collapsed expand button - Only show when collapsed */}
          {sidebarCollapsed && (
            <div className="flex justify-center py-2 border-b border-zinc-700">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] w-10 h-10"
                title="Expand Sidebar"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className={classNames(
            "flex-1",
            sidebarCollapsed ? "px-2 py-3" : "px-4 py-4"
          )}>
            <ul className={classNames(
              sidebarCollapsed ? "space-y-3" : "space-y-2"
            )}>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={classNames(
                        "group flex items-center rounded-lg text-sm font-medium transition-all duration-200",
                        sidebarCollapsed 
                          ? "justify-center w-12 h-12 mx-auto" 
                          : "px-3 py-2.5",
                        isActive
                          ? "bg-zinc-900 text-white shadow-sm ring-1 ring-zinc-700"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      )}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={classNames(
                          "flex-shrink-0 transition-colors duration-200",
                          sidebarCollapsed ? "h-6 w-6" : "h-5 w-5 mr-3",
                          isActive 
                            ? "text-white" 
                            : "text-zinc-400 group-hover:text-white"
                        )}
                        aria-hidden="true"
                      />
                      {!sidebarCollapsed && (
                        <>
                          <span className="truncate">{item.name}</span>
                          {isActive && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile Section */}
          <div className={classNames(
            "border-t border-zinc-700",
            sidebarCollapsed ? "px-2 py-3" : "px-4 py-3"
          )}>
            <div
              className={classNames(
                "flex items-center rounded-lg transition-colors duration-200 hover:bg-zinc-800",
                sidebarCollapsed 
                  ? "justify-center w-12 h-12 mx-auto" 
                  : "px-3 py-2.5"
              )}
            >
              <div className={classNames(
                "rounded-full bg-zinc-700 flex items-center justify-center ring-2 ring-zinc-600",
                sidebarCollapsed ? "h-10 w-10" : "h-8 w-8"
              )}>
                <span className={classNames(
                  "text-white font-semibold",
                  sidebarCollapsed ? "text-base" : "text-sm"
                )}>U</span>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">User</p>
                  <p className="text-xs text-zinc-400 truncate">user@example.com</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {children}
      </div>
    </div>
  );
}