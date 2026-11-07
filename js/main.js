// ============================================================================
// main.js — navegación (hash), barra lateral, progreso y carga de lecciones.
// ============================================================================
import { GROUPS, FLAT, BY_ID } from './lessons/index.js';
import { disposeAllStages } from './stage.js';
import { h } from './ui.js';
import { progress, current } from './progress.js';
import { renderCardLesson } from './cards.js';
import { mountCloud } from './cloud.js';

const sidebar = document.getElementById('sidebar');
const lessonEl = document.getElementById('lesson');
const mainEl = document.getElementById('main');
const menuBtn = document.getElementById('menuBtn');
const topbarTitle = document.getElementById('topbarTitle');
const topbarProg = document.getElementById('topbarProg');

function setNav(open) {
  document.body.classList.toggle('nav-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Cerrar el índice de lecciones' : 'Abrir el índice de lecciones');
}

// ---------- Barra lateral ----------
function buildSidebar() {
  sidebar.innerHTML = '';
  sidebar.append(
    h('div', { class: 'brand' },
      h('a', { href: '#/inicio' }, h('strong', {}, 'Three.js'), h('span', {}, 'cuaderno de repaso')),
      h('div', { class: 'brand-axes' }, h('i'), h('i'), h('i')),
      h('button', { class: 'side-close', type: 'button', 'aria-label': 'Cerrar el índice', onClick: () => setNav(false) }, '✕')),
  );

  const search = h('input', { class: 'side-search', type: 'search', placeholder: 'Buscar lección…', 'aria-label': 'Buscar lección' });
  sidebar.append(search);

  const links = [];
  GROUPS.forEach((g) => {
    const box = h('div', { class: 'side-group' }, h('h4', { style: { '--c': `var(--${g.color})` } }, h('i'), g.title));
    g.items.forEach((it) => {
      const a = h('a', { class: 'side-link', href: `#/${it.id}`, 'data-id': it.id, style: { '--c': `var(--${g.color})` } },
        h('span', { class: 'tick' }, '✓'), h('span', {}, it.title), it.star && h('span', { class: 'star' }, '★'));
      links.push({ a, it, box });
      box.append(a);
    });
    sidebar.append(box);
  });

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    links.forEach(({ a, it }) => {
      const hit = !q || `${it.title} ${it.sub} ${it.course || ''}`.toLowerCase().includes(q);
      a.style.display = hit ? '' : 'none';
    });
    sidebar.querySelectorAll('.side-group').forEach((box) => {
      const any = [...box.querySelectorAll('.side-link')].some((a) => a.style.display !== 'none');
      box.style.display = any ? '' : 'none';
    });
  });

  const prog = h('div', { class: 'side-progress' }, h('span', { id: 'progText' }), h('div', { class: 'bar' }, h('i', { id: 'progBar' })));
  sidebar.append(prog);
  mountCloud(sidebar, topbarProg);
  refreshProgress();
}

function refreshProgress() {
  sidebar.querySelectorAll('.side-link').forEach((a) => {
    a.classList.toggle('done', progress.isDone(a.dataset.id));
    a.classList.toggle('active', a.dataset.id === current.id);
  });
  const n = progress.doneCount();
  const t = document.getElementById('progText');
  const b = document.getElementById('progBar');
  if (t) t.textContent = `${n} de ${FLAT.length} lecciones repasadas`;
  if (b) b.style.width = `${(n / FLAT.length) * 100}%`;
  topbarProg.textContent = `${n}/${FLAT.length} ✓`;
}
window.addEventListener('tj-progress', refreshProgress);

// ---------- Router ----------
let token = 0;

async function route() {
  const raw = location.hash.replace(/^#\/?/, '') || 'inicio';
  const [id, nStr] = raw.split('/');
  const idx = Math.max(0, (parseInt(nStr, 10) || 1) - 1);
  const item = BY_ID[id] || BY_ID.inicio;
  const my = ++token;

  disposeAllStages();
  current.id = item.id;
  document.title = `${item.title} · Three.js repaso`;
  setNav(false);
  topbarTitle.textContent = item.title;
  lessonEl.innerHTML = '';

  try {
    const mod = await item.load();
    if (my !== token) return;
    const out = await mod.default(lessonEl);
    if (my !== token) return;
    if (Array.isArray(out)) {
      // Lección en formato tarjetas: el motor pinta cabecera, tarjeta y navegación.
      lessonEl.innerHTML = '';
      renderCardLesson(lessonEl, item, out, idx, { FLAT });
    } else {
      // Página clásica (la chuleta): cabecera grande + navegación de lecciones.
      const head = h('header', { class: 'lesson-head' },
        h('h1', {}, item.title),
        h('p', { class: 'sub' }, item.sub),
        h('div', { class: 'meta' },
          h('span', { class: 'chip' }, item.group.title),
          item.course && h('span', { class: 'chip' }, `Curso: ${item.course}`),
          h('span', { class: 'chip' }, `~${item.min} min`)));
      lessonEl.prepend(head);
      lessonEl.append(buildNav(item));
    }
  } catch (err) {
    console.error(err);
    lessonEl.append(h('div', { class: 'err-box' },
      h('strong', {}, 'No se pudo cargar esta lección'),
      h('pre', {}, String(err?.stack || err))));
  }
  if (my !== token) return;
  refreshProgress();
  window.scrollTo(0, 0);
  mainEl.focus({ preventScroll: true });
}

function buildNav(item) {
  const i = FLAT.findIndex((x) => x.id === item.id);
  const prev = FLAT[i - 1];
  const next = FLAT[i + 1];
  const doneBtn = h('button', { class: 'btn primary' }, '');
  const paint = () => { doneBtn.textContent = progress.isDone(item.id) ? '✓ Repasada (pulsa para desmarcar)' : 'Marcar como repasada'; };
  doneBtn.addEventListener('click', () => { progress.setDone(item.id, !progress.isDone(item.id)); paint(); });
  paint();
  return h('nav', { class: 'lesson-nav wide' },
    prev ? h('a', { class: 'btn nav-prev', href: `#/${prev.id}` }, `← ${prev.title}`) : null,
    h('span', { class: 'spacer' }),
    doneBtn,
    next ? h('a', { class: 'btn nav-next', href: `#/${next.id}` }, `${next.title} →`) : null);
}

// ---------- Menú móvil ----------
menuBtn.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
document.getElementById('scrim').addEventListener('click', () => setNav(false));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });
// al pasar a pantalla grande, el menú deja de ser un cajón
window.matchMedia('(min-width: 1101px)').addEventListener?.('change', (e) => { if (e.matches) setNav(false); });
// deslizar el menú hacia la izquierda lo cierra
{
  let x0 = 0, y0 = 0, tracking = false;
  sidebar.addEventListener('touchstart', (e) => { const t = e.touches[0]; x0 = t.clientX; y0 = t.clientY; tracking = true; }, { passive: true });
  sidebar.addEventListener('touchmove', (e) => {
    if (!tracking) return;
    const t = e.touches[0];
    if (x0 - t.clientX > 60 && Math.abs(t.clientY - y0) < 40) { tracking = false; setNav(false); }
  }, { passive: true });
  sidebar.addEventListener('touchend', () => { tracking = false; }, { passive: true });
}

buildSidebar();
window.addEventListener('hashchange', route);
route();
