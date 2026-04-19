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
      style={{
        border: `2px dashed ${dragging ? '#4a9eff' : '#aaa'}`,
        padding: '1rem',
        cursor: 'pointer',
        textAlign: 'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ipt"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      Drop .ipt files here or click to browse
    </div>
  )
}
