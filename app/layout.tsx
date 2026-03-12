import type { Metadata } from 'next'
import { Newsreader } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import NextTopLoader from 'nextjs-toploader'
import './globals.css'

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-serif',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bagas.dev'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Muhammad Bagas Fadillah — Software Engineer & Backend Developer from Indonesia',
    template: '%s — bagas.dev',
  },
  description:
    'Muhammad Bagas Fadillah (Bagas) is a software engineer and backend developer from Indonesia specializing in Go, TypeScript, Node.js, and modern web development. Read articles on backend engineering, system design, and open-source projects.',
  keywords: [
    'Muhammad Bagas Fadillah',
    'Bagas Fadillah',
    'Bagas',
    'software engineer',
    'backend engineer',
    'backend developer',
    'golang developer',
    'Go developer',
    'TypeScript developer',
    'Node.js developer',
    'software developer Indonesia',
    'backend engineer Indonesia',
    'web developer Indonesia',
    'full-stack developer',
    'open source',
    'Next.js',
    'React',
    'Prisma',
    'PostgreSQL',
    'system design',
    'API development',
  ],
  authors: [{ name: 'Muhammad Bagas Fadillah', url: siteUrl }],
  creator: 'Muhammad Bagas Fadillah',
  publisher: 'Muhammad Bagas Fadillah',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'bagas.dev',
    title: 'Muhammad Bagas Fadillah — Software Engineer & Backend Developer from Indonesia',
    description:
      'Muhammad Bagas Fadillah — software engineer specializing in Go, TypeScript, and backend development. Building modern web apps and writing about engineering.',
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Muhammad Bagas Fadillah — Software Engineer & Backend Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muhammad Bagas Fadillah — Software Engineer & Backend Developer',
    description:
      'Muhammad Bagas Fadillah — software engineer from Indonesia specializing in Go, TypeScript, and backend development.',
    images: [`${siteUrl}/images/og-image.png`],
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || '',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={newsreader.variable} suppressHydrationWarning>
      <body>
        <NextTopLoader color="#b4762c" height={2} showSpinner={false} shadow={false} crawlSpeed={300} speed={300} easing="ease" />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
