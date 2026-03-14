'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

interface SiteSettings {
  name: string
  siteName: string
  sidebarBio: string
  github: string
  linkedin: string
  twitter: string
  email: string
  bluesky: string
  rssEnabled: boolean
  // Legacy show* fields (still used as fallback)
  showExperience?: boolean
  showBlog?: boolean
  showNotes?: boolean
  showSkills?: boolean
  showProjects?: boolean
  // Sidebar-specific nav fields
  navExperience?: boolean
  navBlog?: boolean
  navNotes?: boolean
  navSkills?: boolean
  navProjects?: boolean
  navAbout?: boolean
  navOrderExperience?: number
  navOrderBlog?: number
  navOrderNotes?: number
  navOrderSkills?: number
  navOrderProjects?: number
  navOrderAbout?: number
}

interface SidebarProps {
  settings: SiteSettings
}

function getNavLinks(settings: SiteSettings) {
  // Use nav* fields if available, fallback to show* for backward compat
  const items: { href: string; label: string; visible: boolean; order: number }[] = [
    {
      href: '/experience', label: 'Experience',
      visible: settings.navExperience ?? settings.showExperience ?? true,
      order: settings.navOrderExperience ?? 0,
    },
    {
      href: '/blog', label: 'Blog',
      visible: settings.navBlog ?? settings.showBlog ?? true,
      order: settings.navOrderBlog ?? 1,
    },
    {
      href: '/notes', label: 'Notes',
      visible: settings.navNotes ?? settings.showNotes ?? true,
      order: settings.navOrderNotes ?? 2,
    },
    {
      href: '/skills', label: 'Skills',
      visible: settings.navSkills ?? settings.showSkills ?? true,
      order: settings.navOrderSkills ?? 3,
    },
    {
      href: '/projects', label: 'Projects',
      visible: settings.navProjects ?? settings.showProjects ?? true,
      order: settings.navOrderProjects ?? 4,
    },
    {
      href: '/me', label: 'About Me',
      visible: settings.navAbout ?? true,
      order: settings.navOrderAbout ?? 5,
    },
  ]

  return items
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order)
    .map(({ href, label }) => ({ href, label }))
}

function SocialIcon({ type }: { type: string }) {
  const props = { width: 16, height: 16, fill: 'currentColor', viewBox: '0 0 16 16' }
  switch (type) {
    case 'GitHub':
      return (
        <svg {...props}>
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
      )
    case 'LinkedIn':
      return (
        <svg {...props}>
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
        </svg>
      )
    case 'Twitter':
      return (
        <svg {...props}>
          <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z" />
        </svg>
      )
    case 'Bluesky':
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.584 3.493 6.17 3.253-4.598.45-5.82 2.74-3.271 5.028 4.835 4.34 6.951-1.088 7.477-2.478.526 1.39 2.642 6.818 7.477 2.478 2.549-2.288 1.327-4.578-3.271-5.028 2.586.24 5.385-.626 6.17-3.253C21.622 9.418 22 4.458 22 3.768c0-.69-.139-1.861-.902-2.203-.659-.3-1.664-.621-4.3 1.24C14.046 4.747 11.087 8.686 10 10.8" />
        </svg>
      )
    case 'Email':
      return (
        <svg {...props} fill="none" stroke="currentColor" strokeWidth="1.3">
          <rect x="1" y="3" width="14" height="10" rx="2" />
          <path d="M1 5l7 4 7-4" />
        </svg>
      )
    case 'RSS feed':
      return (
        <svg {...props}>
          <circle cx="3" cy="13" r="2" />
          <path d="M1 1a14 14 0 0114 14" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M1 5.5A9.5 9.5 0 0110.5 15" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
}

export default function Sidebar({ settings }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = getNavLinks(settings)

  const socialLinks = [
    settings.github?.trim() && { href: settings.github, label: 'GitHub' },
    settings.linkedin?.trim() && { href: settings.linkedin, label: 'LinkedIn' },
    settings.twitter?.trim() && { href: settings.twitter, label: 'Twitter' },
    settings.bluesky?.trim() && { href: settings.bluesky, label: 'Bluesky' },
    settings.email?.trim() && { href: `mailto:${settings.email}`, label: 'Email' },
    settings.rssEnabled && { href: '/rss.xml', label: 'RSS feed' },
  ].filter(Boolean) as { href: string; label: string }[]

  const SidebarContent = ({ showHeader = true }: { showHeader?: boolean }) => (
    <>
      {/* Header: Logo + Theme Toggle (desktop only) */}
      {showHeader && (
        <div className="flex items-center justify-between mb-5">
          <Link
            href="/"
            className="flex items-center gap-2 hover:no-underline"
            style={{ color: 'var(--text)' }}
          >
            <span className="ufo-scene">
              <svg width="45" height="45" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Beam */}
                <path d="M22 38 L32 72 L42 38" fill="#4ade80" opacity="0.15"/>

                {/* UFO */}
                <g className="ufo-hover">
                  <ellipse cx="32" cy="24" rx="10" ry="8" fill="#166534"/>
                  <ellipse cx="32" cy="28" rx="20" ry="7" fill="#22c55e"/>
                  <ellipse cx="32" cy="26" rx="18" ry="4" fill="#4ade80" opacity="0.4"/>
                  <ellipse cx="32" cy="32" rx="14" ry="3" fill="#15803d"/>
                  <circle cx="22" cy="28" r="2" fill="#f0fdf4"/>
                  <circle cx="32" cy="28" r="2" fill="#f0fdf4"/>
                  <circle cx="42" cy="28" r="2" fill="#f0fdf4"/>
                </g>

                {/* Person being abducted */}
                <g className="ufo-person">
                  <circle cx="28" cy="58" r="2" fill="var(--muted)"/>
                  <line x1="28" y1="60" x2="28" y2="67" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="28" y1="62" x2="25" y2="65" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="28" y1="62" x2="31" y2="65" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="28" y1="67" x2="26" y2="72" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                  <line x1="28" y1="67" x2="30" y2="72" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                </g>

                {/* Cow being abducted */}
                <g className="ufo-cow">
                  <ellipse cx="38" cy="63" rx="4" ry="2.5" fill="var(--muted)"/>
                  <circle cx="35" cy="61" r="1.8" fill="var(--muted)"/>
                  <line x1="35" y1="65.5" x2="35" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="37" y1="65.5" x2="37" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="39" y1="65.5" x2="39" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
                  <line x1="41" y1="65.5" x2="41" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
                </g>
              </svg>
            </span>
            <span
              className="font-serif font-medium tracking-tight"
              style={{ fontSize: '1.2rem' }}
            >
              {settings.siteName}
            </span>
          </Link>
          <ThemeToggle />
        </div>
      )}

      {/* About Me Section */}
      <div className="sb-bio-section">
        <p className="sb-bio">{settings.sidebarBio}</p>
      </div>

      {/* Navigation */}
      <nav className="sb-nav">
        <p className="sb-section-label">Navigate</p>
        <ul>
          {navLinks.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`sb-nav-link${isActive ? ' sb-nav-link--active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Stay Connected */}
      {socialLinks.length > 0 && (
        <div className="sb-social">
          <p className="sb-section-label">Connect</p>
          <div className="sb-social-links">
            {socialLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="sb-social-link"
                title={label}
              >
                <SocialIcon type={label} />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-full overflow-y-auto sidebar"
        style={{ width: '300px', padding: '2rem 1.75rem' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Top Bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 sidebar border-b"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 hover:no-underline"
          style={{ color: 'var(--text)' }}
        >
          <span className="ufo-scene">
            <svg width="36" height="36" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 38 L32 72 L42 38" fill="#4ade80" opacity="0.15"/>
              <g className="ufo-hover">
                <ellipse cx="32" cy="24" rx="10" ry="8" fill="#166534"/>
                <ellipse cx="32" cy="28" rx="20" ry="7" fill="#22c55e"/>
                <ellipse cx="32" cy="26" rx="18" ry="4" fill="#4ade80" opacity="0.4"/>
                <ellipse cx="32" cy="32" rx="14" ry="3" fill="#15803d"/>
                <circle cx="22" cy="28" r="2" fill="#f0fdf4"/>
                <circle cx="32" cy="28" r="2" fill="#f0fdf4"/>
                <circle cx="42" cy="28" r="2" fill="#f0fdf4"/>
              </g>
              <g className="ufo-person">
                <circle cx="28" cy="58" r="2" fill="var(--muted)"/>
                <line x1="28" y1="60" x2="28" y2="67" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="28" y1="62" x2="25" y2="65" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="28" y1="62" x2="31" y2="65" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="28" y1="67" x2="26" y2="72" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="28" y1="67" x2="30" y2="72" stroke="var(--muted)" strokeWidth="1.2" strokeLinecap="round"/>
              </g>
              <g className="ufo-cow">
                <ellipse cx="38" cy="63" rx="4" ry="2.5" fill="var(--muted)"/>
                <circle cx="35" cy="61" r="1.8" fill="var(--muted)"/>
                <line x1="35" y1="65.5" x2="35" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
                <line x1="37" y1="65.5" x2="37" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
                <line x1="39" y1="65.5" x2="39" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
                <line x1="41" y1="65.5" x2="41" y2="69" stroke="var(--muted)" strokeWidth="1" strokeLinecap="round"/>
              </g>
            </svg>
          </span>
          <span className="font-serif font-medium" style={{ fontSize: '1.1rem' }}>
            {settings.siteName}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-1.5"
            aria-label="Toggle menu"
          >
            <span
              className={`w-5 h-0.5 transition-all ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}
              style={{ backgroundColor: 'var(--text)', display: 'block' }}
            />
            <span
              className={`w-5 h-0.5 transition-all ${mobileOpen ? 'opacity-0' : ''}`}
              style={{ backgroundColor: 'var(--text)', display: 'block' }}
            />
            <span
              className={`w-5 h-0.5 transition-all ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}
              style={{ backgroundColor: 'var(--text)', display: 'block' }}
            />
          </button>
        </div>
      </header>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden fixed top-12 left-0 right-0 z-30 p-6 sidebar border-b shadow-lg"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <SidebarContent showHeader={false} />
        </div>
      )}

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black/20"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
