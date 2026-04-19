import { useRef, useState } from 'react'

interface Props {
  onFiles: (files: File[]) => void
}

export function FileDropzone({ onFiles }: Props) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function filterIpt(files: FileList | null): File[] {
    if (!files) return []
    const valid: File[] = []
    const invalid: string[] = []
    for (const f of Array.from(files)) {
      if (f.name.toLowerCase().endsWith('.ipt')) valid.push(f)
      else invalid.push(f.name)
    }
    if (invalid.length) console.warn('Ignored non-.ipt files:', invalid)
    return valid
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const valid = filterIpt(e.dataTransfer.files)
    if (valid.length) onFiles(valid)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const valid = filterIpt(e.target.files)
    if (valid.length) onFiles(valid)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`rounded-lg border-2 border-dashed cursor-pointer
        px-4 py-6 text-center text-sm transition-colors select-none
        ${dragging
          ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ipt"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <p>Drop <span className="font-mono">.ipt</span> files here</p>
      <p className="text-xs mt-1">or click to browse</p>
    </div>
  )
}
