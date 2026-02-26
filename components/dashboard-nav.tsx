'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Send, HandCoins, History, Contacts, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', icon: Send, label: 'Home' },
  { href: '/dashboard/send', icon: Send, label: 'Send' },
  { href: '/dashboard/request', icon: HandCoins, label: 'Request' },
  { href: '/dashboard/history', icon: History, label: 'History' },
  { href: '/dashboard/contacts', icon: Contacts, label: 'Contacts' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="w-full md:w-64 bg-gray-900 text-white fixed bottom-0 md:static md:border-r md:border-gray-200 z-40">
      <div className="hidden md:flex flex-col h-screen">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold">PayFlown</h1>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="space-y-2 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`w-full justify-start gap-2 ${
                      isActive ? 'bg-blue-600 hover:bg-blue-700' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex h-16 items-center justify-around border-t border-gray-700">
        {navItems.slice(0, 5).map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 ${
                isActive ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
