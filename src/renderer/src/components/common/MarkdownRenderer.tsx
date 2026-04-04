/** Minimal markdown: headings, lists, tables, **bold**, fenced ``` blocks. */

export function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let tableRows: string[][] = []
  let inTable = false
  let inFence = false
  let fenceLines: string[] = []
  let key = 0

  const flushTable = () => {
    if (tableRows.length < 2) {
      tableRows = []
      return
    }
    const headers = tableRows[0]
    const rows = tableRows.slice(2)
    elements.push(
      <div key={key++} className="overflow-x-auto my-3">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="text-left px-3 py-2 border-b-2 border-neutral-200 dark:border-neutral-600 font-semibold text-neutral-700 dark:text-neutral-200 text-xs"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b border-neutral-100 dark:border-neutral-700/50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )
    tableRows = []
  }

  const flushFence = () => {
    if (fenceLines.length === 0) {
      inFence = false
      return
    }
    elements.push(
      <pre
        key={key++}
        className="text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900/80 p-3 rounded-lg overflow-x-auto my-2 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap break-all"
      >
        {fenceLines.join('\n')}
      </pre>,
    )
    fenceLines = []
    inFence = false
  }

  const inlineFormat = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    let remaining = text
    let idx = 0
    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) parts.push(remaining.slice(0, boldMatch.index))
        parts.push(
          <strong key={`b${idx++}`} className="font-semibold text-neutral-800 dark:text-neutral-100">
            {boldMatch[1]}
          </strong>,
        )
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
      } else {
        parts.push(remaining)
        break
      }
    }
    return parts
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      if (inFence) {
        flushFence()
      } else {
        if (inTable) {
          inTable = false
          flushTable()
        }
        inFence = true
      }
      continue
    }

    if (inFence) {
      fenceLines.push(line)
      continue
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (!inTable) inTable = true
      const cells = line.split('|').slice(1, -1).map((c) => c.trim())
      tableRows.push(cells)
      continue
    } else if (inTable) {
      inTable = false
      flushTable()
    }

    if (!line.trim()) continue

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={key++} className="text-2xl font-bold mt-1 mb-3 text-neutral-900 dark:text-white">
          {line.slice(2)}
        </h1>,
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={key++}
          className="text-lg font-bold mt-5 mb-2 text-neutral-800 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-700 pb-1"
        >
          {line.slice(3)}
        </h2>,
      )
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={key++} className="text-sm font-bold mt-4 mb-1.5 text-neutral-700 dark:text-neutral-200">
          {line.slice(4)}
        </h3>,
      )
    } else if (line.match(/^\s*[-*]\s/)) {
      const indent = line.search(/\S/)
      const text = line.replace(/^\s*[-*]\s/, '')
      elements.push(
        <div
          key={key++}
          className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed"
          style={{ paddingLeft: Math.max(0, indent * 4) + 'px' }}
        >
          <span className="text-neutral-300 dark:text-neutral-500 mt-0.5">•</span>
          <span>{inlineFormat(text)}</span>
        </div>,
      )
    } else if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\.\s/)![1]
      const text = line.replace(/^\d+\.\s/, '')
      elements.push(
        <div key={key++} className="flex gap-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
          <span className="text-neutral-400 dark:text-neutral-500 font-medium w-4 shrink-0 text-right">{num}.</span>
          <span>{inlineFormat(text)}</span>
        </div>,
      )
    } else {
      elements.push(
        <p key={key++} className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-1">
          {inlineFormat(line)}
        </p>,
      )
    }
  }

  if (inTable) flushTable()
  if (inFence) flushFence()

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>
}
