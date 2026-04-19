import { useState } from 'react'
import { evaluate, parse, Registry } from './core'
import { FileDropzone } from './components/FileDropzone'
import { readFileAsWindows1252 } from './lib/readFile'

const registry = new Registry()

interface LoadedFile {
  name: string
}

function App() {
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([])
  const [tables, setTables] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [result, setResult] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  async function handleFiles(files: File[]) {
    const allWarnings: string[] = []
    for (const file of files) {
      const source = await readFileAsWindows1252(file)
      const { tables: parsed, warnings: parseWarnings } = parse(source)
      registry.add(parsed)
      allWarnings.push(...parseWarnings.map(w => `${file.name} line ${w.line}: ${w.message}`))
      setLoadedFiles(prev => [...prev, { name: file.name }])
    }
    const names = registry.listNames()
    setTables(names)
    if (names.length && !selected) setSelected(names[0])
    setWarnings(allWarnings)
  }

  function handleRemoveFile(name: string) {
    const remaining = loadedFiles.filter(f => f.name !== name)
    setLoadedFiles(remaining)
    registry.clear()
    setTables([])
    setSelected('')
    setResult('')
    setWarnings([`Removed ${name}. Reload remaining files to rebuild registry.`])
  }

  function handleGenerate() {
    if (!selected) return
    const res = evaluate(selected, registry)
    setResult(res.output)
    if (res.warnings.length) setWarnings(res.warnings)
  }

  return (
    <div>
      <h1>IPT Web</h1>
      <FileDropzone onFiles={handleFiles} />
      <ul>
        {loadedFiles.map(f => (
          <li key={f.name}>
            {f.name}
            <button onClick={() => handleRemoveFile(f.name)}>×</button>
          </li>
        ))}
      </ul>
      <select value={selected} onChange={e => setSelected(e.target.value)}>
        {tables.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <button onClick={handleGenerate}>Generate</button>
      <div dangerouslySetInnerHTML={{ __html: result }} />
      {warnings.length > 0 && (
        <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      )}
    </div>
  )
}

export default App
