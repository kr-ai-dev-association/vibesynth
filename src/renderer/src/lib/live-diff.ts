/** Lightweight line diff excerpt for Developer-mode live edit summaries (no external deps). */

export function countChangedLines(before: string, after: string): number {
  const b = before.split('\n')
  const a = after.split('\n')
  const n = Math.max(b.length, a.length)
  let c = 0
  for (let i = 0; i < n; i++) {
    if ((b[i] ?? '') !== (a[i] ?? '')) c++
  }
  return c
}

export function buildLineDiffExcerpt(before: string, after: string, maxLines = 48): string {
  const b = before.split('\n')
  const a = after.split('\n')
  const n = Math.max(b.length, a.length)
  let first = -1
  for (let i = 0; i < n; i++) {
    if ((b[i] ?? '') !== (a[i] ?? '')) {
      first = i
      break
    }
  }
  if (first < 0) return '(no textual line changes detected)'

  const start = Math.max(0, first - 4)
  const lines: string[] = []
  for (let i = start; i < n && lines.length < maxLines; i++) {
    const oldL = b[i]
    const newL = a[i]
    if (oldL === newL) {
      lines.push(`  ${i + 1}:  ${oldL ?? ''}`)
    } else {
      if (oldL !== undefined) lines.push(`-${i + 1}: ${oldL}`)
      if (newL !== undefined) lines.push(`+${i + 1}: ${newL}`)
    }
  }
  if (n - start > maxLines) lines.push('… (truncated)')
  return lines.join('\n')
}

export function buildLiveEditDeveloperMarkdown(
  prompt: string,
  filePath: string,
  before: string,
  after: string,
  locale: 'en' | 'ko',
): string {
  const changed = countChangedLines(before, after)
  const excerpt = buildLineDiffExcerpt(before, after)
  if (locale === 'ko') {
    return [
      '## 실시간(Live) 수정 요약',
      '',
      '### 요청 내용',
      prompt,
      '',
      '### 수정된 파일',
      `- \`${filePath}\``,
      '',
      '### 통계',
      `- 수정 전 줄 수: ${before.split('\n').length}`,
      `- 수정 후 줄 수: ${after.split('\n').length}`,
      `- 달라진 줄(대략): ${changed}`,
      '',
      '### 변경 발췌 (라인 기준)',
      '```',
      excerpt,
      '```',
      '',
      '### 다음 단계',
      '- **Live Export**로 현재 프로젝트 전체를 VS Code 워크스페이스 폴더에 복사할 수 있습니다.',
      '- 연동된 **VS Code** 실행 버튼으로 해당 폴더를 바로 엽니다.',
    ].join('\n')
  }
  return [
    '## Live edit summary',
    '',
    '### Request',
    prompt,
    '',
    '### Modified file',
    `- \`${filePath}\``,
    '',
    '### Stats',
    `- Lines before: ${before.split('\n').length}`,
    `- Lines after: ${after.split('\n').length}`,
    `- Lines changed (approx.): ${changed}`,
    '',
    '### Excerpt (line-based)',
    '```',
    excerpt,
    '```',
    '',
    '### Next steps',
    '- Use **Live Export** to copy the full generated project into your VS Code workspace folder.',
    '- Use **Open in VS Code** to open that folder (requires CLI on PATH).',
  ].join('\n')
}
