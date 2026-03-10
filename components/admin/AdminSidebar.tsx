'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  FileText,
  StickyNote,
  Cpu,
  Briefcase,
  FolderKanban,
  Settings,
  User,
  ExternalLink,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react'
import { useAdminTheme } from './AdminThemeProvider'

const mainNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/posts', label: 'Posts', icon: FileText },
  { href: '/admin/notes', label: 'Notes', icon: StickyNote },
  { href: '/admin/skills', label: 'Skills', icon: Cpu },
  { href: '/admin/experiences', label: 'Experiences', icon: Briefcase },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
]

const secondaryNav = [
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
  { href: '/admin/about', label: 'About Me', icon: User },
]

interface AdminSidebarProps {
  username: string
}

export default function AdminSidebar({ username }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { theme, toggleTheme } = useAdminTheme()

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    window.location.href = '/admin/login'
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  function NavLink({
    href,
    label,
    icon: Icon,
    exact,
  }: {
    href: string
    label: string
    icon: typeof LayoutDashboard
    exact?: boolean
  }) {
    const active = isActive(href, exact)
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`adm-nav-link${active ? ' active' : ''}`}
      >
        <Icon size={16} />
        <span>{label}</span>
      </Link>
    )
  }

  function SidebarInner() {
    return (
      <div className="adm-sidebar">
        {/* Logo + site identity */}
        <div className="adm-sidebar-identity">
          <div className="adm-sidebar-avatar">B</div>
          <div className="adm-sidebar-identity-text">
            <div className="adm-sidebar-sitename">bagas.dev</div>
            <div className="adm-sidebar-username">admin</div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--admin-border)', margin: '0 16px' }} />

        {/* Main nav */}
        <div className="adm-nav-label">Main</div>
        <nav className="adm-sidebar-nav">
          {mainNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Settings nav */}
        <div className="adm-nav-label">Settings</div>
        <nav className="adm-sidebar-nav">
          {secondaryNav.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Spacer */}
        <div className="adm-sidebar-spacer" />

        {/* Bottom actions */}
        <div className="adm-sidebar-bottom">
          <Link href="/" target="_blank" className="adm-nav-link" onClick={() => setMobileOpen(false)}>
            <ExternalLink size={16} />
            <span>View Site</span>
          </Link>
          <button onClick={toggleTheme} className="adm-nav-link">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button onClick={handleLogout} disabled={loggingOut} className="adm-nav-link">
            <LogOut size={16} />
            <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{ width: '230px' }}
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 z-30"
      >
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: '52px',
          background: 'var(--admin-surface)',
          borderBottom: '1px solid var(--admin-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="adm-sidebar-avatar" style={{ width: '28px', height: '28px', fontSize: '0.7rem' }}>
            B
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--admin-text-primary)' }}>
            bagas.dev
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--admin-text-secondary)',
            cursor: 'pointer',
            padding: '6px',
          }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="md:hidden fixed top-0 left-0 bottom-0 z-40 flex flex-col"
            style={{ width: '230px' }}
          >
            <SidebarInner />
          </div>
        </>
      )}
    </>
  )
}
