interface HistoryEntry {
  id: number
  tableName: string
  output: string
  rawOutput: string
}

interface Props {
  selected: string
  history: HistoryEntry[]
  onGenerate: () => void
  onClear: () => void
}

export function ResultPanel({ selected, history, onGenerate, onClear }: Props) {
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="font-mono text-slate-600 dark:text-slate-400 text-sm truncate flex-1">
          {selected || <span className="italic">No table selected</span>}
        </span>
        <button
          onClick={onGenerate}
          disabled={!selected}
          className="px-5 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900
                     rounded font-semibold hover:bg-slate-700 dark:hover:bg-slate-300
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Generate
        </button>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800
                       dark:hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3">
        {history.map((entry, idx) => (
          <div
            key={entry.id}
            className={`rounded border p-3 font-mono text-sm
              ${idx === 0
                ? 'border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-70'
              }`}
          >
            <div className="flex justify-between items-start gap-2 mb-1">
              <span className="text-xs text-slate-400 font-sans">{entry.tableName}</span>
              <button
                onClick={() => copyToClipboard(entry.rawOutput)}
                className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                           shrink-0 transition-colors"
              >
                Copy
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: entry.output }} />
          </div>
        ))}
        {history.length === 0 && (
          <p className="text-sm text-slate-400 italic">
            Select a table and click Generate.
          </p>
        )}
      </div>
    </div>
  )
}

export type { HistoryEntry }
