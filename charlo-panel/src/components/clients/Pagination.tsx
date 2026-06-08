import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
      <div className="text-sm text-gray-500">
        Página {page} de {totalPages}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        {getVisiblePages().map((pageNum, i) => (
          <button
            key={i}
            onClick={() => typeof pageNum === 'number' && onPageChange(pageNum)}
            disabled={pageNum === '...'}
            className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
              pageNum === page
                ? 'bg-primary-500 text-white'
                : typeof pageNum === 'number'
                ? 'hover:bg-gray-100 text-gray-600'
                : 'text-gray-400 cursor-default'
            }`}
          >
            {pageNum}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
    </div>
  )
}
