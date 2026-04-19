interface Props {
  tables: string[]
  selected: string
  onSelect: (name: string) => void
}

export function GeneratorList({ tables, selected, onSelect }: Props) {
  if (tables.length === 0) {
    return <p className="text-sm text-slate-500 italic px-1">No tables loaded.</p>
  }
  return (
    <ul className="overflow-y-auto max-h-96 space-y-0.5">
      {tables.map(t => (
        <li key={t}>
          <button
            onClick={() => onSelect(t)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm truncate transition-colors
              ${selected === t
                ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
          >
            {t}
          </button>
        </li>
      ))}
    </ul>
  )
}
