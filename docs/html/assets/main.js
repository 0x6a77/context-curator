/* Context Curator docs — shared JS */

// ── Copy buttons ──────────────────────────────────────────────
document.querySelectorAll('pre').forEach(pre => {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = 'Copy';
  btn.addEventListener('click', () => {
    const code = pre.querySelector('code');
    const text = code ? code.textContent : pre.textContent;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copy';
        btn.classList.remove('copied');
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = 'Copied ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  });
  pre.appendChild(btn);
});

// ── Heading anchors ───────────────────────────────────────────
document.querySelectorAll('h2, h3').forEach(el => {
  const id = el.textContent
    .replace(/§$/, '')          // strip any existing anchor char
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  if (!id) return;
  el.id = id;
  const a = document.createElement('a');
  a.className = 'anchor';
  a.href = '#' + id;
  a.textContent = '§';
  a.setAttribute('aria-hidden', 'true');
  a.setAttribute('tabindex', '-1');
  el.appendChild(a);
});

// ── Mobile nav ────────────────────────────────────────────────
const toggle = document.querySelector('.nav-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.nav-overlay');

function setOpen(open) {
  if (!sidebar) return;
  sidebar.setAttribute('data-open', open);
  if (overlay) overlay.setAttribute('data-open', open);
  if (toggle) toggle.setAttribute('aria-expanded', open);
}

if (toggle) toggle.addEventListener('click', () => {
  setOpen(sidebar.getAttribute('data-open') !== 'true');
});

if (overlay) overlay.addEventListener('click', () => setOpen(false));

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') setOpen(false);
});
