import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('__vsLiveEdit', {
  submitEdit: (prompt: string) => {
    return ipcRenderer.invoke('live-edit-request', prompt, window.location.href)
  },
  onEditResult: (callback: (result: { success: boolean; message: string }) => void) => {
    const handler = (_e: any, result: { success: boolean; message: string }) => callback(result)
    ipcRenderer.on('live-edit-result', handler)
    return () => ipcRenderer.removeListener('live-edit-result', handler)
  },
  sendDomSelection: (html: string) => {
    return ipcRenderer.invoke('live-edit:dom-selected', html)
  },
})

function injectPromptBar() {
  if (document.getElementById('__vs-live-prompt-bar')) return

  const container = document.createElement('div')
  container.id = '__vs-live-prompt-bar'
  container.innerHTML = `
    <style>
      #__vs-live-prompt-bar {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #__vs-live-prompt-bar .vs-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(24,24,27,0.92);
        backdrop-filter: blur(16px);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08);
        min-width: 480px;
        max-width: 640px;
        transition: all 0.2s ease;
      }
      #__vs-live-prompt-bar .vs-bar.collapsed {
        min-width: auto;
        padding: 8px 14px;
        cursor: pointer;
      }
      #__vs-live-prompt-bar .vs-input {
        flex: 1;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        padding: 8px 14px;
        color: #f4f4f5;
        font-size: 13px;
        outline: none;
        resize: none;
        font-family: inherit;
        line-height: 1.4;
        min-height: 20px;
        max-height: 100px;
      }
      #__vs-live-prompt-bar .vs-input::placeholder { color: rgba(255,255,255,0.35); }
      #__vs-live-prompt-bar .vs-input:focus {
        border-color: rgba(139,92,246,0.6);
        background: rgba(255,255,255,0.1);
      }
      #__vs-live-prompt-bar .vs-btn {
        background: #7c3aed;
        color: white;
        border: none;
        border-radius: 10px;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: background 0.15s;
      }
      #__vs-live-prompt-bar .vs-btn:hover { background: #6d28d9; }
      #__vs-live-prompt-bar .vs-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      #__vs-live-prompt-bar .vs-toggle {
        background: none;
        border: none;
        color: rgba(255,255,255,0.5);
        cursor: pointer;
        padding: 4px;
        font-size: 16px;
        line-height: 1;
        transition: color 0.15s;
      }
      #__vs-live-prompt-bar .vs-toggle:hover { color: white; }
      #__vs-live-prompt-bar .vs-status {
        font-size: 11px;
        color: rgba(255,255,255,0.4);
        padding: 0 4px;
        white-space: nowrap;
      }
      #__vs-live-prompt-bar .vs-status.success { color: #34d399; }
      #__vs-live-prompt-bar .vs-status.error { color: #f87171; }
      #__vs-live-prompt-bar .vs-label {
        color: rgba(255,255,255,0.6);
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
      }
      /* ─── MD Viewer Panel ─── */
      #__vs-md-panel {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999998;
        width: 640px;
        max-height: 400px;
        background: rgba(15,15,20,0.95);
        backdrop-filter: blur(16px);
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #__vs-md-panel.visible { display: flex; }
      #__vs-md-panel .md-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        flex-shrink: 0;
      }
      #__vs-md-panel .md-header span { color: #a5b4fc; font-size: 12px; font-weight: 600; }
      #__vs-md-panel .md-close {
        background: none; border: none; color: rgba(255,255,255,0.4);
        cursor: pointer; font-size: 16px; padding: 2px 6px; border-radius: 4px;
      }
      #__vs-md-panel .md-close:hover { color: white; background: rgba(255,255,255,0.1); }
      #__vs-md-panel .md-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        color: #d1d5db;
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
      }
      #__vs-md-panel .md-body h2 { color: #e0e7ff; font-size: 15px; margin: 12px 0 6px; font-family: -apple-system, sans-serif; }
      #__vs-md-panel .md-body h3 { color: #a5b4fc; font-size: 13px; margin: 10px 0 4px; font-family: -apple-system, sans-serif; }
      #__vs-md-panel .md-body code { background: rgba(255,255,255,0.06); padding: 1px 4px; border-radius: 3px; font-size: 11px; }
      #__vs-md-panel .md-body pre { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; overflow-x: auto; margin: 6px 0; }
    </style>
    <div class="vs-bar" id="__vs-bar">
      <span class="vs-label">✦ VibeSynth</span>
      <textarea class="vs-input" id="__vs-input" rows="1" placeholder="Describe changes to apply..."></textarea>
      <button class="vs-btn" id="__vs-submit">Apply</button>
      <button class="vs-toggle" id="__vs-collapse" title="Minimize">−</button>
      <span class="vs-status" id="__vs-status"></span>
    </div>
  `
  document.body.appendChild(container)

  // ─── MD Viewer Panel (for Developer mode output) ───
  const mdPanel = document.createElement('div')
  mdPanel.id = '__vs-md-panel'
  mdPanel.innerHTML = `
    <div class="md-header">
      <span>💻 Developer Summary</span>
      <button class="md-close" id="__vs-md-close">✕</button>
    </div>
    <div class="md-body" id="__vs-md-body"></div>
  `
  document.body.appendChild(mdPanel)

  const mdBodyEl = document.getElementById('__vs-md-body')!
  const mdCloseBtn = document.getElementById('__vs-md-close')!
  mdCloseBtn.addEventListener('click', () => { mdPanel.classList.remove('visible') })

  function showMdPanel(markdown: string) {
    // Simple MD → HTML conversion (headings, code blocks, bold, lists)
    let html = markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.+)$/gm, '• $1')
    mdBodyEl.innerHTML = html
    mdPanel.classList.add('visible')
  }

  const bar = document.getElementById('__vs-bar')!
  const input = document.getElementById('__vs-input') as HTMLTextAreaElement
  const submitBtn = document.getElementById('__vs-submit') as HTMLButtonElement
  const collapseBtn = document.getElementById('__vs-collapse') as HTMLButtonElement
  const statusEl = document.getElementById('__vs-status')!
  let collapsed = false

  collapseBtn.addEventListener('click', () => {
    collapsed = !collapsed
    if (collapsed) {
      bar.classList.add('collapsed')
      input.style.display = 'none'
      submitBtn.style.display = 'none'
      statusEl.style.display = 'none'
      collapseBtn.textContent = '✦'
      collapseBtn.title = 'Expand VibeSynth prompt'
    } else {
      bar.classList.remove('collapsed')
      input.style.display = ''
      submitBtn.style.display = ''
      statusEl.style.display = ''
      collapseBtn.textContent = '−'
      collapseBtn.title = 'Minimize'
      input.focus()
    }
  })

  bar.addEventListener('click', (e) => {
    if (collapsed && e.target !== collapseBtn) {
      collapseBtn.click()
    }
  })

  async function handleSubmit() {
    const prompt = input.value.trim()
    if (!prompt) return

    submitBtn.disabled = true
    statusEl.textContent = 'Applying...'
    statusEl.className = 'vs-status'

    try {
      await ipcRenderer.invoke('live-edit-request', prompt, window.location.href)
    } catch {
      statusEl.textContent = 'Send failed'
      statusEl.className = 'vs-status error'
      submitBtn.disabled = false
    }
  }

  submitBtn.addEventListener('click', handleSubmit)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  })

  ipcRenderer.on('live-edit-result', (_e: any, result: { success: boolean; message: string; devMarkdown?: string }) => {
    submitBtn.disabled = false
    if (result.success) {
      statusEl.textContent = '✓ Applied'
      statusEl.className = 'vs-status success'
      input.value = ''
      // Show Developer MD panel if markdown is provided
      if (result.devMarkdown) {
        showMdPanel(result.devMarkdown)
      }
      setTimeout(() => { statusEl.textContent = '' }, 5000)
    } else {
      statusEl.textContent = `✗ ${result.message}`
      statusEl.className = 'vs-status error'
    }
  })

  input.addEventListener('input', () => {
    input.style.height = 'auto'
    input.style.height = Math.min(input.scrollHeight, 100) + 'px'
  })
}

// ─── DOM Element Picker ───────────────────────────────────────
// Alt+Click on any element sends its outerHTML to Live Edit popup

function injectDomPicker() {
  if (document.getElementById('__vs-dom-picker-style')) return

  const style = document.createElement('style')
  style.id = '__vs-dom-picker-style'
  style.textContent = `
    .__vs-picker-highlight {
      outline: 2px solid #7c3aed !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
    }
    #__vs-picker-badge {
      position: fixed;
      bottom: 8px;
      right: 8px;
      z-index: 999999;
      background: rgba(124,58,237,0.9);
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 99px;
      font-family: -apple-system, sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
    }
    #__vs-picker-badge.active { opacity: 1; }
  `
  document.head.appendChild(style)

  const badge = document.createElement('div')
  badge.id = '__vs-picker-badge'
  badge.textContent = '⊹ Alt+Click to select element'
  document.body.appendChild(badge)

  let highlighted: HTMLElement | null = null
  let pickerMode = false

  document.addEventListener('keydown', (e) => {
    if (e.altKey && !pickerMode) {
      pickerMode = true
      badge.classList.add('active')
    }
  })
  document.addEventListener('keyup', (e) => {
    if (!e.altKey && pickerMode) {
      pickerMode = false
      badge.classList.remove('active')
      if (highlighted) {
        highlighted.classList.remove('__vs-picker-highlight')
        highlighted = null
      }
    }
  })

  document.addEventListener('mouseover', (e) => {
    if (!pickerMode) return
    const el = e.target as HTMLElement
    if (el.id === '__vs-picker-badge' || el.closest('#__vs-md-panel')) return
    if (highlighted) highlighted.classList.remove('__vs-picker-highlight')
    highlighted = el
    el.classList.add('__vs-picker-highlight')
  })

  document.addEventListener('click', (e) => {
    if (!pickerMode || !e.altKey) return
    e.preventDefault()
    e.stopPropagation()
    const el = e.target as HTMLElement
    if (el.id === '__vs-picker-badge') return
    // Get concise outerHTML (truncate if too long)
    let html = el.outerHTML
    if (html.length > 2000) html = html.substring(0, 2000) + '...'
    const tag = el.tagName.toLowerCase()
    const cls = el.className ? '.' + el.className.split(/\s+/).filter(c => !c.startsWith('__vs')).join('.') : ''
    console.log('[VibeSynth] DOM selected:', tag + cls)
    // Send to Live Edit popup via IPC (use ipcRenderer directly — contextBridge APIs aren't accessible from preload context)
    ipcRenderer.invoke('live-edit:dom-selected', html)
    // Visual feedback
    el.style.outline = '2px solid #34d399'
    el.style.outlineOffset = '2px'
    setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = '' }, 1500)
  }, true)
}

// Inject DOM picker when page is ready
function injectTools() {
  injectDomPicker()
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(injectTools, 500)
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(injectTools, 500))
}
