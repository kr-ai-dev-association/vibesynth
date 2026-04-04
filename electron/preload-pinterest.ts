import { ipcRenderer } from 'electron'

function getHighResUrl(src: string): string {
  return src
    .replace(/\/236x\//, '/736x/')
    .replace(/\/474x\//, '/736x/')
}

function injectOverlay() {
  if (document.getElementById('__vs-pinterest-overlay')) return

  const overlay = document.createElement('div')
  overlay.id = '__vs-pinterest-overlay'
  overlay.innerHTML = `
    <style>
      #__vs-pinterest-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #__vs-pin-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 20px;
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        color: white;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      #__vs-pin-bar .vs-left { display: flex; flex-direction: column; gap: 2px; }
      #__vs-pin-bar .vs-title { font-size: 14px; font-weight: 600; }
      #__vs-pin-bar .vs-hint { font-size: 12px; opacity: 0.85; }
      .vs-btn {
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 16px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        background: rgba(255,255,255,0.15);
        transition: background 0.15s;
      }
      .vs-btn:hover { background: rgba(255,255,255,0.25); }
      .__vs-img-highlight {
        outline: 3px solid #7c3aed !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
        transition: outline-color 0.15s, transform 0.15s !important;
      }
      .__vs-img-highlight:hover {
        outline-color: #2563eb !important;
        transform: scale(1.02) !important;
      }
    </style>
    <div id="__vs-pin-bar">
      <div class="vs-left">
        <div class="vs-title">VibeSynth — Design Steal</div>
        <div class="vs-hint">Click any design image to steal its style<span id="__vs-pin-status"></span></div>
      </div>
      <button class="vs-btn" id="__vs-pin-cancel">Cancel</button>
    </div>
  `
  document.body.appendChild(overlay)

  document.getElementById('__vs-pin-cancel')!.addEventListener('click', () => {
    ipcRenderer.invoke('pinterest:cancel')
  })

  const statusEl = document.getElementById('__vs-pin-status')!

  function processImages() {
    const images = document.querySelectorAll('img[src*="pinimg.com"]')
    images.forEach((img) => {
      if ((img as any).__vsProcessed) return
      ;(img as any).__vsProcessed = true

      img.classList.add('__vs-img-highlight')

      img.addEventListener('click', async (e) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()

        const src = (img as HTMLImageElement).src
        if (!src) return

        const highRes = getHighResUrl(src)
        statusEl.textContent = ' — Capturing...'

        try {
          await ipcRenderer.invoke('pinterest:image-selected', highRes)
        } catch {
          statusEl.textContent = ' — Failed to capture'
        }
      }, true)
    })
  }

  processImages()
  const observer = new MutationObserver(() => processImages())
  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(injectOverlay, 800)
} else {
  window.addEventListener('DOMContentLoaded', () => setTimeout(injectOverlay, 800))
}
