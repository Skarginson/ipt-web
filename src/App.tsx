import { useCallback, useEffect, useRef, useState } from 'react'
import { evaluate, parse, Registry } from './core'
import { FileDropzone } from './components/FileDropzone'
import { GeneratorList } from './components/GeneratorList'
import { ResultPanel, type HistoryEntry } from './components/ResultPanel'
import { SyntaxHelp } from './components/SyntaxHelp'
import { readFileAsWindows1252 } from './lib/readFile'

const registry = new Registry()
let nextId = 1

interface LoadedFile {
  name: string
}

export default function App() {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([])
  const [tables, setTables] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const registryRef = useRef(registry)
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  async function handleFiles(files: File[]) {
    for (const file of files) {
      const source = await readFileAsWindows1252(file)
      const { tables: parsed } = parse(source)
      registryRef.current.add(parsed)
      setLoadedFiles(prev => {
        if (prev.some(f => f.name === file.name)) return prev
        return [...prev, { name: file.name }]
      })
    }
    const names = registryRef.current.listNames().sort()
    setTables(names)
    setSelected(prev => prev || names[0] || '')
  }

  function handleRemoveFile(name: string) {
    const remaining = loadedFiles.filter(f => f.name !== name)
    setLoadedFiles(remaining)
    registryRef.current.clear()
    setTables([])
    setSelected('')
    setHistory([])
  }

  const handleGenerate = useCallback(() => {
    if (!selected) return
    const res = evaluate(selected, registryRef.current)
    if (res.warnings.length) console.warn('[evaluate]', res.warnings)
    setHistory(prev => [
      { id: nextId++, tableName: selected, output: res.output, rawOutput: res.rawOutput },
      ...prev,
    ])
  }, [selected])

  // Global keyboard shortcut: R = regenerate
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'r' || e.key === 'R') {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        handleGenerate()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleGenerate])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg">IPT Web</h1>
          <p className="text-xs text-slate-500">.ipt generator runner — client-side, no server</p>
        </div>
        <button
          onClick={() => setDark(d => !d)}
          className="p-2 rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-0 md:gap-0 max-w-6xl mx-auto">
        {/* Left column */}
        <aside className="md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-200
                          dark:border-slate-800 p-4 space-y-4">
          <FileDropzone onFiles={handleFiles} />

          {loadedFiles.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400
                             dark:text-slate-500 mb-2">
                Loaded files
              </h2>
              <ul className="space-y-1">
                {loadedFiles.map(f => (
                  <li key={f.name} className="flex items-center gap-2 text-sm">
                    <span className="font-mono truncate flex-1 text-slate-600 dark:text-slate-400">
                      {f.name}
                    </span>
                    <button
                      onClick={() => handleRemoveFile(f.name)}
                      className="text-slate-400 hover:text-red-500 transition-colors text-xs"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400
                           dark:text-slate-500 mb-2">
              Tables
            </h2>
            <GeneratorList tables={tables} selected={selected} onSelect={setSelected} />
          </div>

          <SyntaxHelp />
        </aside>

        {/* Right column */}
        <main className="flex-1 p-4 md:p-6">
          <ResultPanel
            selected={selected}
            history={history}
            onGenerate={handleGenerate}
            onClear={() => setHistory([])}
          />
          {tables.length === 0 && (
            <p className="mt-8 text-sm text-slate-400 italic text-center">
              Load one or more <span className="font-mono">.ipt</span> files to get started.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}
