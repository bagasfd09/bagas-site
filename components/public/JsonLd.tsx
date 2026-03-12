export function PersonJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bagas.dev'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Muhammad Bagas Fadillah',
    alternateName: 'Bagas',
    url: siteUrl,
    jobTitle: 'Software Engineer',
    description: 'Muhammad Bagas Fadillah is a software engineer and backend developer from Indonesia specializing in Go, TypeScript, and modern web development.',
    knowsAbout: [
      'Software Engineering',
      'Backend Development',
      'Go',
      'Golang',
      'TypeScript',
      'Node.js',
      'Next.js',
      'React',
      'PostgreSQL',
      'API Development',
      'System Design',
    ],
    nationality: {
      '@type': 'Country',
      name: 'Indonesia',
    },
    sameAs: [
      'https://github.com/bagas',
      'https://linkedin.com/in/bagas',
      'https://twitter.com/bagas',
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bagas.dev'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'bagas.dev',
    url: siteUrl,
    description: 'Personal website and blog of Muhammad Bagas Fadillah — software engineer and backend developer from Indonesia.',
    author: {
      '@type': 'Person',
      name: 'Muhammad Bagas Fadillah',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BlogPostJsonLd({
  title,
  description,
  slug,
  datePublished,
  dateModified,
  tags,
}: {
  title: string
  description: string
  slug: string
  datePublished: string
  dateModified: string
  tags: string[]
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bagas.dev'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url: `${siteUrl}/blog/${slug}`,
    datePublished,
    dateModified,
    author: {
      '@type': 'Person',
      name: 'Muhammad Bagas Fadillah',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Person',
      name: 'Muhammad Bagas Fadillah',
      url: siteUrl,
    },
    keywords: tags.join(', '),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${slug}`,
    },
    inLanguage: 'en',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
