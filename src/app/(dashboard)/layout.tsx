// src/app/(dashboard)/layout.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
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
  UserIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  EllipsisHorizontalIcon,
  MegaphoneIcon  // Added for Campaigns
} from '@heroicons/react/24/outline';
import { CodeBracketIcon } from '@heroicons/react/24/outline';

// Simple Avatar Component (since we don't have Catalyst Avatar yet)
const Avatar = ({ src, initials, className, ...props }: {
  src?: string | null;
  initials?: string;
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={`inline-flex items-center justify-center rounded-full bg-gray-500 text-white font-medium overflow-hidden ${className}`}
    {...props}
  >
    {src ? (
      <img src={src} alt="" className="w-full h-full object-cover" />
    ) : (
      <span className="text-sm font-semibold">{initials}</span>
    )}
  </div>
);

const navigation = [
  { name: 'Home', href: '/home', icon: HomeIcon },
  { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
  { name: 'Template Builder', href: '/template-builder', icon: PencilSquareIcon },
  { name: 'Campaigns', href: '/campaigns', icon: MegaphoneIcon }, // Added before Client Simulator
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Client Simulator', href: '/client-simulator', icon: ComputerDesktopIcon },
  { name: 'API Docs', href: '/api-docs', icon: CodeBracketIcon },
];

function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, userProfile, loading, signOut, getUserInitials, getUserDisplayName } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto"></div>
          <p className="mt-2 text-zinc-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar Container with padding for rounded effect - FIXED */}
      <div
        className={classNames(
          "flex flex-col transition-all duration-300 ease-in-out flex-shrink-0",
          sidebarCollapsed ? "w-20 p-2" : "w-72 p-3"
        )}
      >
        {/* Rounded Sidebar content */}
        <div className="flex flex-col h-full bg-[#1E1E1E] rounded-xl shadow-lg border border-zinc-800">
          {/* Logo Section - Only show when expanded */}
          {!sidebarCollapsed && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <img
                  src="/favicon-32x32.png"
                  alt="Ghostwriter"
                  className="h-8 w-8"
                />
                <span className="text-white text-base font-medium">Ghostwriter</span>
              </div>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] p-2"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Collapsed expand button - Only show when collapsed */}
          {sidebarCollapsed && (
            <div className="flex justify-center py-2 border-b border-zinc-700 flex-shrink-0">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-[#1E1E1E] w-10 h-10"
                title="Expand Sidebar"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Navigation - SCROLLABLE IF NEEDED */}
          <nav className={classNames(
            "flex-1 overflow-y-auto",
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

          {/* User Profile Section - FIXED AT BOTTOM */}
          <div className={classNames(
            "border-t border-zinc-700 flex-shrink-0",
            sidebarCollapsed ? "px-2 py-3" : "px-4 py-3"
          )}>
            {sidebarCollapsed ? (
              // Simple avatar when collapsed
              <div className="flex justify-center">
                <Avatar
                  src={user.photoURL}
                  initials={getUserInitials()}
                  className="w-10 h-10 bg-zinc-700 text-white ring-2 ring-zinc-600"
                />
              </div>
            ) : (
              // Full profile dropdown when expanded
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center w-full rounded-lg transition-colors duration-200 hover:bg-zinc-800 cursor-pointer px-3 py-2.5"
                >
                  <Avatar
                    src={user.photoURL}
                    initials={getUserInitials()}
                    className="w-8 h-8 bg-zinc-700 text-white ring-2 ring-zinc-600"
                  />
                  <div className="ml-3 min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-white truncate">
                      {getUserDisplayName()}
                    </p>
                  </div>
                  <EllipsisHorizontalIcon className="h-5 w-5 text-zinc-400" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      {userProfile?.department && (
                        <p className="text-xs text-gray-500">
                          {userProfile.department}
                        </p>
                      )}
                    </div>
                    <Link
                      href="/user-settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <UserIcon className="mr-3 h-4 w-4 text-gray-400" />
                      Account Settings
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <UserCircleIcon className="mr-3 h-4 w-4 text-gray-400" />
                      View Profile
                    </Link>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          signOut();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4 text-gray-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content - SCROLLABLE */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </div>
  );
}