/* Context Curator docs — shared JS */

/* ── Page configuration ───────────────────────────────────── */
const REPO = 'https://github.com/0x6a77/context-curator';
const DOCS_SRC = REPO + '/blob/main/docs/markdown/';

const PAGE_ORDER = [
  { file: 'index.html',              title: 'Introduction',        source: null },
  { file: 'getting-started.html',    title: 'Getting Started',     source: 'getting-started.md' },
  { file: 'managing-contexts.html',  title: 'Managing Contexts',   source: 'managing-contexts.md' },
  { file: 'context-monitoring.html', title: 'Context Monitoring',  source: 'context-monitoring.md' },
  { file: 'hooks-automation.html',   title: 'Hooks & Automation',  source: 'hooks-automation.md' },
  { file: 'for-teams.html',          title: 'For Teams',           source: 'for-teams.md' },
  { file: 'security.html',           title: 'Security',            source: 'security.md' },
  { file: 'reference.html',          title: 'Reference',           source: 'reference.md' },
  { file: 'boss-fight-workflow.html',title: 'PRD-Driven Development', source: 'boss-fight-workflow.md' },
  { file: 'glossary.html',           title: 'Glossary',            source: 'glossary.md' },
  { file: 'permuted-index.html',     title: 'Index',               source: null },
];

const curFile = window.location.pathname.split('/').pop() || 'index.html';
const curIdx  = PAGE_ORDER.findIndex(p => p.file === curFile);
const curPage = curIdx >= 0 ? PAGE_ORDER[curIdx] : null;

/* ── Theme toggle ─────────────────────────────────────────── */
(function () {
  const root = document.documentElement;
  const btn  = document.querySelector('.theme-toggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀' : '🌙';
      btn.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  const stored = localStorage.getItem('cc-theme') || 'dark';
  applyTheme(stored);

  if (btn) {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('cc-theme', next);
    });
  }
})();

/* ── Copy buttons ─────────────────────────────────────────── */
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
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
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

/* ── Heading anchors ──────────────────────────────────────── */
document.querySelectorAll('h2, h3').forEach(el => {
  const id = el.textContent
    .replace(/§$/, '')
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

/* ── Mobile nav ───────────────────────────────────────────── */
const toggle  = document.querySelector('.nav-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.nav-overlay');

function setSidebarOpen(open) {
  if (!sidebar) return;
  sidebar.setAttribute('data-open', open);
  if (overlay) overlay.setAttribute('data-open', open);
  if (toggle)  toggle.setAttribute('aria-expanded', open);
}

if (toggle) toggle.addEventListener('click', () =>
  setSidebarOpen(sidebar.getAttribute('data-open') !== 'true'));
if (overlay) overlay.addEventListener('click', () => setSidebarOpen(false));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setSidebarOpen(false); });

/* ── Page TOC ─────────────────────────────────────────────── */
(function () {
  const aside = document.querySelector('.page-toc');
  if (!aside) return;

  const headings = [...document.querySelectorAll('.content h2, .content h3')];
  if (headings.length < 2) return;

  const label = document.createElement('div');
  label.className = 'page-toc-label';
  label.textContent = 'On this page';

  const ul = document.createElement('ul');
  ul.className = 'page-toc-list';

  headings.forEach(h => {
    if (!h.id) return;
    const li = document.createElement('li');
    if (h.tagName === 'H3') li.className = 'toc-h3';
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent.replace(/§\s*$/, '').trim();
    li.appendChild(a);
    ul.appendChild(li);
  });

  aside.appendChild(label);
  aside.appendChild(ul);

  const tocLinks = [...ul.querySelectorAll('a')];
  function updateTocActive() {
    const scrollY = window.scrollY + 100;
    let active = null;
    headings.forEach((h, i) => {
      if (h.offsetTop <= scrollY) active = tocLinks[i];
    });
    tocLinks.forEach(a => a.classList.remove('toc-active'));
    if (active) active.classList.add('toc-active');
  }
  window.addEventListener('scroll', updateTocActive, { passive: true });
  updateTocActive();
})();

/* ── Page footer: prev/next + edit link ───────────────────── */
(function () {
  const footer = document.querySelector('.page-footer');
  if (!footer || !curPage) return;

  // Prev/Next nav
  const nav = document.createElement('nav');
  nav.className = 'prev-next-nav';
  nav.setAttribute('aria-label', 'Page navigation');

  if (curIdx > 0) {
    const prev = PAGE_ORDER[curIdx - 1];
    const a = document.createElement('a');
    a.className = 'prev-page';
    a.href = prev.file;
    a.textContent = '← ' + prev.title;
    nav.appendChild(a);
  }
  if (curIdx < PAGE_ORDER.length - 1) {
    const next = PAGE_ORDER[curIdx + 1];
    const a = document.createElement('a');
    a.className = 'next-page';
    a.href = next.file;
    a.textContent = next.title + ' →';
    nav.appendChild(a);
  }
  if (nav.children.length > 0) footer.appendChild(nav);

  // Edit link
  if (curPage.source) {
    const edit = document.createElement('a');
    edit.className = 'edit-link';
    edit.href = DOCS_SRC + curPage.source;
    edit.target = '_blank';
    edit.rel = 'noopener noreferrer';
    edit.textContent = 'Edit this page on GitHub ↗';
    footer.appendChild(edit);
  }
})();

/* ── Search ───────────────────────────────────────────────── */
(function () {
  const input   = document.querySelector('.search-input');
  const results = document.querySelector('.search-results');
  if (!input || !results) return;

  let index = null;

  async function loadIndex() {
    if (index !== null) return index;
    try {
      const base = window.location.pathname.replace(/[^/]*$/, '');
      const r = await fetch(base + 'assets/search-index.json');
      index = await r.json();
    } catch (_) {
      index = [];
    }
    return index;
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlight(text, q) {
    if (!q) return text;
    return text.replace(
      new RegExp('(' + escapeRegex(q) + ')', 'gi'),
      '<mark>$1</mark>'
    );
  }

  function doSearch(query, data) {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const words = q.split(/\s+/).filter(Boolean);
    return data
      .map(page => {
        const hay = [
          page.title,
          ...(page.headings || []),
          page.content || ''
        ].join(' ').toLowerCase();
        const score = words.reduce((n, w) => {
          const m = hay.match(new RegExp(escapeRegex(w), 'g'));
          return n + (m ? m.length : 0);
        }, 0);
        return { ...page, score };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);
  }

  function renderResults(matches, query) {
    results.removeAttribute('hidden');
    results.innerHTML = '';

    if (!matches.length) {
      const msg = document.createElement('div');
      msg.className = 'search-no-results';
      msg.textContent = 'No results for “' + query + '”';
      results.appendChild(msg);
      return;
    }

    matches.forEach(m => {
      const a = document.createElement('a');
      a.className = 'search-result';
      a.href = m.url;

      const titleDiv = document.createElement('div');
      titleDiv.className = 'search-result-title';
      titleDiv.innerHTML = highlight(m.title, query);

      const excerptDiv = document.createElement('div');
      excerptDiv.className = 'search-result-excerpt';
      const raw = m.content || '';
      const qi  = raw.toLowerCase().indexOf(query.toLowerCase());
      const snip = qi >= 0
        ? raw.slice(Math.max(0, qi - 25), qi + 90)
        : raw.slice(0, 100);
      excerptDiv.innerHTML = highlight(snip, query) + '…';

      a.appendChild(titleDiv);
      a.appendChild(excerptDiv);
      results.appendChild(a);
    });
  }

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) { results.setAttribute('hidden', ''); return; }
    debounceTimer = setTimeout(async () => {
      const data = await loadIndex();
      renderResults(doSearch(q, data), q);
    }, 180);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      results.setAttribute('hidden', '');
      input.blur();
    }
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !results.contains(e.target)) {
      results.setAttribute('hidden', '');
    }
  });
})();
