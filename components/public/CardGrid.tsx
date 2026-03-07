interface CardGridProps {
  children: React.ReactNode
  columns?: 2 | 3
}

export default function CardGrid({ children, columns = 3 }: CardGridProps) {
  const colClass =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2'

  return (
    <div className={`grid ${colClass} gap-3`}>
      {children}
    </div>
  )
}
