import { useState } from 'react'

export function SyntaxHelp() {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded text-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-3 py-2 flex justify-between items-center
                   text-slate-600 dark:text-slate-400 hover:text-slate-900
                   dark:hover:text-slate-200 transition-colors"
      >
        <span className="font-semibold">Syntax reference</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1 font-mono text-xs text-slate-600 dark:text-slate-400">
          <p><span className="text-slate-800 dark:text-slate-200">Table: Name</span> — declare a table</p>
          <p><span className="text-slate-800 dark:text-slate-200">[@TableName]</span> — pick one random entry</p>
          <p><span className="text-slate-800 dark:text-slate-200">[!2 Table &gt;&gt; implode]</span> — pick 2 distinct entries, comma-joined</p>
          <p><span className="text-slate-800 dark:text-slate-200">[&amp;#x2640]</span> — Unicode entity as table reference</p>
          <p><span className="text-slate-800 dark:text-slate-200">\n</span> — line break in output</p>
          <p><span className="text-slate-800 dark:text-slate-200">&lt;b&gt;, &lt;i&gt;</span> — HTML tags pass through</p>
        </div>
      )}
    </div>
  )
}
