'use client'

interface ReorderButtonsProps {
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
  size?: 'sm' | 'md'
  direction?: 'vertical' | 'horizontal'
}

export default function ReorderButtons({
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  size = 'sm',
  direction = 'vertical',
}: ReorderButtonsProps) {
  const btnClass = size === 'sm'
    ? 'w-6 h-6 text-xs'
    : 'w-8 h-8 text-sm'

  const containerClass = direction === 'vertical'
    ? 'flex flex-col gap-0.5'
    : 'flex gap-0.5'

  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onMoveUp() }}
        disabled={isFirst}
        className={`${btnClass} rounded border border-gray-300 flex items-center justify-center transition-colors ${
          isFirst
            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
            : 'text-gray-600 hover:bg-gray-100 hover:border-gray-400'
        }`}
        title="Move up"
      >
        ▲
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onMoveDown() }}
        disabled={isLast}
        className={`${btnClass} rounded border border-gray-300 flex items-center justify-center transition-colors ${
          isLast
            ? 'text-gray-300 cursor-not-allowed bg-gray-50'
            : 'text-gray-600 hover:bg-gray-100 hover:border-gray-400'
        }`}
        title="Move down"
      >
        ▼
      </button>
    </div>
  )
}
