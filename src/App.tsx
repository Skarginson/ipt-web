import { useState } from 'react'
import { evaluate, parse, Registry } from './core'

const registry = new Registry()

function App() {
  const [source, setSource] = useState('')
  const [tables, setTables] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [result, setResult] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  function handleLoad() {
    registry.clear()
    const { tables: parsed, warnings: parseWarnings } = parse(source)
    registry.add(parsed)
    const names = registry.listNames()
    setTables(names)
    setSelected(names[0] ?? '')
    setWarnings(parseWarnings.map(w => `Line ${w.line}: ${w.message}`))
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
      <textarea
        value={source}
        onChange={e => setSource(e.target.value)}
        rows={10}
        cols={60}
        placeholder="Paste .ipt content here…"
      />
      <br />
      <button onClick={handleLoad}>Load</button>
      <br />
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
