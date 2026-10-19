// ============================================================================
// ui.js — pequeñas piezas para construir las lecciones sin repetir HTML.
// ============================================================================
import { progress, current } from './progress.js';
import { createStage } from './stage.js';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Crea un elemento: h('div', {class:'x', onClick: fn}, hijo1, hijo2...) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) el.style.setProperty(sk, sv); else el.style[sk] = sv;
      }
    }
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  appendAll(el, children);
  return el;
}
function appendAll(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
}

// ---------- Mini-markdown: `código`, **negrita**, *cursiva*, {{geo|Geometría}}, [texto](url) ----------
export function md(src) {
  // 1) los `códigos` se apartan para que su contenido no se interprete; 2) se aplican negritas/cursivas; 3) se devuelven
  const codes = [];
  const text = String(src).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  return inline(esc(text)).replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[+i])}</code>`);
}
function inline(t) {
  return t
    .replace(/\{\{(\w+)\|([^}]+)\}\}/g, '<span class="tag $1">$2</span>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(¿¡])\*([^*\s][^*]*?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\[([^\]]+)\]\((#[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

// ---------- Bloques de texto ----------
export const P = (text) => h('p', { html: md(text) });
export const H2 = (text) => h('h2', { html: md(text) });
export const H3 = (text) => h('h3', { html: md(text) });
export const UL = (items) => h('ul', {}, items.map((t) => h('li', { html: md(t) })));
export const OL = (items) => h('ol', {}, items.map((t) => h('li', { html: md(t) })));
export const eq = (text) => h('div', { class: String(text).includes('\n') ? 'eq multi' : 'eq' }, text);
export const grid2 = (...kids) => h('div', { class: 'grid2' }, kids);
export function card(title, body, color) {
  const kids = Array.isArray(body) ? body : [P(body)];
  return h('div', { class: 'card', style: color ? { '--c': `var(--${color})` } : null }, h('h4', {}, title), kids);
}
export function table(head, rows) {
  return h('div', { class: 'tbl-wrap' }, h('table', { class: 'tbl' },
    h('thead', {}, h('tr', {}, head.map((t) => h('th', { html: md(t) })))),
    h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', { html: md(c) })))))));
}

/** Caja destacada. kind: idea | analogy | warn | tip | remember */
export function callout(kind, title, body) {
  const kids = Array.isArray(body) ? body : [P(body)];
  return h('div', { class: `callout ${kind}` }, h('div', { class: 'callout-title' }, title), kids);
}

/** Figura con SVG inline u otro contenido */
export const figure = (...kids) => h('div', { class: 'figure wide' }, kids);

// ---------- Resaltado de sintaxis (muy simple pero suficiente) ----------
const KW_JS = 'const|let|var|function|return|new|if|else|for|while|break|continue|import|from|export|default|class|extends|this|true|false|null|undefined|typeof|of|in|async|await|switch|case';
const JS_RE = new RegExp([
  String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
  String.raw`(\`(?:\\[\s\S]|[^\`\\])*\`|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")`,
  String.raw`(\b\d+(?:\.\d+)?\b)`,
  `\\b(${KW_JS})\\b`,
  String.raw`(\b[A-Z][A-Za-z0-9_]*\b)`,
  String.raw`(\.?[a-zA-Z_$][\w$]*(?=\())`,
  String.raw`(\.[a-zA-Z_$][\w$]*)`,
].join('|'), 'g');
const JS_CLS = ['cm', 'str', 'num', 'kw', 'cls', 'fn', 'prop'];

const KW_GLSL = 'uniform|attribute|varying|precision|highp|mediump|lowp|const|return|if|else|for|while|in|out|inout|true|false|discard|break|continue|void';
const TYPES_GLSL = 'float|int|bool|vec2|vec3|vec4|ivec2|ivec3|mat2|mat3|mat4|sampler2D|samplerCube';
const GLSL_RE = new RegExp([
  String.raw`(\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
  String.raw`(^[ \t]*#[a-z]+[^\n]*)`,
  String.raw`(\b\d+\.?\d*(?:e[+-]?\d+)?\b)`,
  `\\b(${KW_GLSL})\\b`,
  `\\b(${TYPES_GLSL})\\b`,
  String.raw`(\bgl_[A-Za-z]+\b)`,
  String.raw`(\b[a-zA-Z_]\w*(?=\())`,
].join('|'), 'gm');
const GLSL_CLS = ['cm', 'pp', 'num', 'kw', 'type', 'bi', 'fn'];

function tokenize(code, re, classes) {
  const out = [];
  let last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(code))) {
    if (m[0] === '') { re.lastIndex++; continue; }
    if (m.index > last) out.push([null, code.slice(last, m.index)]);
    let g = 1;
    while (m[g] === undefined) g++;
    out.push([classes[g - 1], m[0]]);
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push([null, code.slice(last)]);
  return out;
}

export function highlightLines(code, lang = 'js') {
  const tokens = lang === 'glsl' ? tokenize(code, GLSL_RE, GLSL_CLS)
    : lang === 'js' ? tokenize(code, JS_RE, JS_CLS)
    : [[null, code]];
  const lines = [[]];
  for (const [cls, text] of tokens) {
    text.split('\n').forEach((piece, i) => {
      if (i > 0) lines.push([]);
      if (piece) lines[lines.length - 1].push([cls, piece]);
    });
  }
  return lines.map((l) => l.map(([c, t]) => (c ? `<span class="tk-${c}">${esc(t)}</span>` : esc(t))).join(''));
}

const cleanCode = (code) => String(code).replace(/^\n+/, '').replace(/\s+$/, '');


/**
 * Las notas se pueden dar de dos formas:
 *  - Objeto por número de línea:   { 3: 'texto', '5-7': 'texto' }
 *  - Lista por texto de la línea:  [ ['new THREE.Scene()', 'texto'], ['const a', 'const b', 'texto de rango'] ]
 *    (busca la primera línea que contenga ese texto, siempre hacia adelante → sin contar líneas a mano)
 */
function resolveNotes(notes, rawLines) {
  if (!Array.isArray(notes)) {
    return Object.keys(notes)
      .map((k) => { const [a, b] = String(k).split('-').map(Number); return { a, b: b || a, text: notes[k] }; })
      .sort((x, y) => x.a - y.a || x.b - y.b);
  }
  const find = (needle, fromIdx) => {
    if (typeof needle === 'number') return needle;
    for (let i = fromIdx; i < rawLines.length; i++) if (rawLines[i].includes(needle)) return i + 1;
    return -1;
  };
  const items = [];
  let cursor = 0;
  for (const n of notes) {
    const isRange = n.length === 3;
    const la = find(n[0], cursor);
    if (la < 0) { console.warn('codeBlock: no encuentro la línea', n[0]); continue; }
    const lb = isRange ? find(n[1], la - 1) : la;
    if (lb < 0) { console.warn('codeBlock: no encuentro el final del rango', n[1]); continue; }
    items.push({ a: la, b: lb, text: isRange ? n[2] : n[1] });
    cursor = lb;
  }
  return items;
}

// ---------- Bloque de código con explicación línea a línea ----------
/**
 * codeBlock({ title, lang, code, notes: { 3: 'explica la línea 3', '5-7': 'explica de la 5 a la 7' } })
 */
export function codeBlock({ title = '', lang = 'js', code, notes = {}, notesOpen = true }) {
  const raw = cleanCode(code);
  const lines = highlightLines(raw, lang);

  const items = resolveNotes(notes, raw.split('\n'));
  items.forEach((it, i) => { it.n = i + 1; });

  const body = h('div', { class: 'cb-body' });
  lines.forEach((html, i) => {
    const ln = i + 1;
    const inRange = items.some((it) => ln >= it.a && ln <= it.b && it.b > it.a);
    const badges = items.filter((it) => it.a === ln).map((it) => `<span class="nb">${it.n}</span>`).join('');
    body.append(h('div', { class: `cb-line${inRange ? ' hl' : ''}` },
      h('span', { class: 'ln' }, ln),
      h('span', { class: 'lc', html: html + badges })));
    items.filter((it) => it.b === ln).forEach((it) => {
      body.append(h('div', { class: 'cb-note' }, h('span', { class: 'nb' }, it.n), h('div', { html: md(it.text) })));
    });
  });

  const hasNotes = items.length > 0;
  const root = h('div', { class: 'codeblock', 'data-notes': hasNotes && notesOpen ? 'on' : 'off' });
  const toggle = hasNotes && h('button', {
    class: 'cb-btn',
    onClick: () => {
      const on = root.dataset.notes === 'on';
      root.dataset.notes = on ? 'off' : 'on';
      toggle.textContent = on ? 'Mostrar explicación' : 'Ocultar explicación';
    },
  }, notesOpen ? 'Ocultar explicación' : 'Mostrar explicación');
  const copy = h('button', {
    class: 'cb-btn',
    onClick: async () => {
      try { await navigator.clipboard.writeText(raw); copy.textContent = '¡Copiado!'; } catch { copy.textContent = 'No se pudo'; }
      setTimeout(() => { copy.textContent = 'Copiar'; }, 1400);
    },
  }, 'Copiar');
  root.append(h('div', { class: 'cb-head' }, title && h('span', { class: 'cb-title' }, title), h('span', { class: 'cb-lang' }, lang.toUpperCase()), toggle, copy), body);
  return root;
}

/** Bloque de código que se actualiza solo (p. ej. refleja lo que mueves con los sliders). */
export function liveCode({ title = '', lang = 'js' } = {}) {
  const body = h('div', { class: 'cb-body' });
  const el = h('div', { class: 'codeblock', 'data-notes': 'off' },
    h('div', { class: 'cb-head' }, title && h('span', { class: 'cb-title' }, title), h('span', { class: 'cb-lang' }, lang.toUpperCase())), body);
  return {
    el,
    set(code) {
      body.innerHTML = '';
      highlightLines(cleanCode(code), lang).forEach((html, i) => {
        body.append(h('div', { class: 'cb-line' }, h('span', { class: 'ln' }, i + 1), h('span', { class: 'lc', html })));
      });
    },
  };
}

/**
 * Editor de código sencillo y editable: <textarea> transparente encima de un <pre> coloreado.
 * codeEditor({ title, lang, value, height, onInput }) → { el, get, set, mark([líneas]), focus }
 */
export function codeEditor({ title = '', lang = 'glsl', value = '', height = 300, onInput = null, readOnly = false } = {}) {
  let marks = new Map();
  const ta = h('textarea', { class: 'ed-ta', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', wrap: 'off', 'aria-label': title || 'Editor de código' });
  if (readOnly) ta.readOnly = true;
  const gutIn = h('div', { class: 'ed-in' });
  const codeIn = h('div', { class: 'ed-in' });
  const wrap = h('div', { class: 'ed-wrap', style: { height: `${height}px` } },
    h('div', { class: 'ed-gut', 'aria-hidden': 'true' }, gutIn),
    h('div', { class: 'ed-code', 'aria-hidden': 'true' }, codeIn),
    ta);
  const titleEl = h('span', { class: 'ed-title' }, title);
  const head = h('div', { class: 'ed-head' }, titleEl, h('span', { class: 'cb-lang' }, lang.toUpperCase()));
  const el = h('div', { class: 'ed' }, head, wrap);

  const paint = () => {
    const lines = highlightLines(ta.value, lang);
    gutIn.innerHTML = lines.map((_, i) => `<span class="ed-line${marks.has(i + 1) ? ` ${marks.get(i + 1)}` : ''}">${i + 1}</span>`).join('');
    codeIn.innerHTML = lines.map((l, i) => `<span class="ed-line${marks.has(i + 1) ? ` ${marks.get(i + 1)}` : ''}">${l || ' '}</span>`).join('');
  };
  const sync = () => {
    codeIn.style.transform = `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    gutIn.style.transform = `translateY(${-ta.scrollTop}px)`;
  };
  ta.value = cleanCode(value);
  ta.addEventListener('scroll', sync);
  ta.addEventListener('input', () => { paint(); sync(); onInput?.(ta.value); });
  ta.addEventListener('keydown', (e) => {
    if (readOnly) return;
    const insert = (txt) => { ta.setRangeText(txt, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); };
    if (e.key === 'Tab') { e.preventDefault(); insert('    '); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const before = ta.value.slice(0, ta.selectionStart);
      const line = before.slice(before.lastIndexOf('\n') + 1);
      const indent = (/^\s*/.exec(line) || [''])[0];
      insert(`\n${indent}${line.trimEnd().endsWith('{') ? '    ' : ''}`);
    }
  });
  paint();
  return {
    el,
    get: () => ta.value,
    set(v) { ta.value = cleanCode(v); marks = new Map(); paint(); sync(); },
    mark(lines = [], cls = 'err') { marks = new Map(lines.map((l) => [l, cls])); paint(); },
    scrollToLine(n) { ta.scrollTop = Math.max(0, (n - 4) * 20); sync(); },
    focus: () => ta.focus(),
    setTitle: (t) => { titleEl.textContent = t; },
    head,
  };
}

// ---------- Panel de controles ----------
const decimals = (step) => (String(step).includes('.') ? String(step).split('.')[1].length : 0);

/**
 * controlPanel([
 *   { type:'group', label:'Posición' },
 *   { type:'range', id:'x', label:'x', min:-3, max:3, step:.1, value:0, onInput: v => ... },
 *   { type:'select', id:'geo', label:'Geometría', options:['Caja','Esfera'], value:'Caja', onInput: v => ... },
 *   { type:'check', id:'wire', label:'Wireframe', value:false, onInput: v => ... },
 *   { type:'button', label:'Reiniciar', onClick: () => ... },
 *   { type:'readout', id:'info' },
 *   { type:'note', html:'texto' },
 * ])
 */
export function controlPanel(defs, { initial = true } = {}) {
  const el = h('div', { class: 'controls' });
  const refs = {};
  const inits = [];
  const btnRow = () => { const r = h('div', { class: 'btn-row' }); el.append(r); return r; };
  let row = null;

  for (const d of defs) {
    if (d.type !== 'button') row = null;
    if (d.type === 'group') {
      el.append(h('div', { class: 'ctl-group' }, d.label));
    } else if (d.type === 'range') {
      const dec = d.decimals ?? decimals(d.step ?? 1);
      const fmt = d.fmt || ((v) => Number(v).toFixed(dec));
      const input = h('input', { type: 'range', min: d.min, max: d.max, step: d.step ?? 1, value: d.value });
      const out = h('output', {}, fmt(d.value));
      const handler = () => { out.textContent = fmt(+input.value); d.onInput?.(+input.value); };
      input.addEventListener('input', handler);
      refs[d.id] = { input, out, get: () => +input.value, set: (v) => { input.value = v; out.textContent = fmt(+v); } };
      el.append(h('label', { class: 'ctl' }, h('span', {}, d.label), out, input));
      inits.push(() => d.onInput?.(+input.value));
    } else if (d.type === 'select') {
      const opts = d.options.map((o) => (Array.isArray(o) ? o : [o, o]));
      const input = h('select', {}, opts.map(([v, l]) => h('option', { value: v }, l)));
      input.value = d.value ?? opts[0][0];
      input.addEventListener('change', () => d.onInput?.(input.value));
      refs[d.id] = { input, get: () => input.value, set: (v) => { input.value = v; } };
      el.append(h('label', { class: 'ctl' }, h('span', {}, d.label), h('span'), input));
      inits.push(() => d.onInput?.(input.value));
    } else if (d.type === 'check') {
      const input = h('input', { type: 'checkbox' });
      input.checked = !!d.value;
      input.addEventListener('change', () => d.onInput?.(input.checked));
      refs[d.id] = { input, get: () => input.checked, set: (v) => { input.checked = !!v; } };
      el.append(h('label', { class: 'ctl check' }, input, h('span', {}, d.label)));
      inits.push(() => d.onInput?.(input.checked));
    } else if (d.type === 'button') {
      row = row || btnRow();
      const b = h('button', { class: `btn${d.primary ? ' primary' : ''}`, onClick: () => d.onClick?.() }, d.label);
      if (d.id) refs[d.id] = { input: b };
      row.append(b);
    } else if (d.type === 'readout') {
      const out = h('div', { class: 'readout' }, d.text || '');
      refs[d.id] = { el: out };
      if (d.label) el.append(h('div', { class: 'ctl-note' }, d.label));
      el.append(out);
    } else if (d.type === 'note') {
      el.append(h('div', { class: 'ctl-note', html: md(d.html) }));
    }
  }
  if (initial) inits.forEach((fn) => fn());
  return {
    el,
    refs,
    get: (id) => refs[id].get(),
    set: (id, v) => refs[id].set(v),
    readout: (id, text) => { refs[id].el.textContent = text; },
  };
}

// ---------- Demo interactiva (se inicia sola al acercarte con el scroll) ----------
const pendingDemos = new Set();
window.__tjStartAll = () => [...pendingDemos].forEach((fn) => fn()); // útil para pruebas automáticas

/**
 * demo({ title, caption, aspect, setup({ stageEl, side, makeStage, panel }) })
 */
export function demo({ title, caption, aspect = '16 / 9', side = true, setup }) {
  const stageEl = h('div', { class: 'demo-stage', style: { aspectRatio: aspect } });
  const sideEl = h('div', { class: 'demo-side' });
  const fig = h('figure', { class: 'demo wide' },
    h('div', { class: 'demo-head' }, h('span', { class: 'demo-title' }, title), h('span', { class: 'demo-badge' }, 'interactivo')),
    h('div', { class: `demo-body${side ? '' : ' no-side'}` }, h('div', { class: 'demo-main' }, stageEl), side && sideEl),
    caption && h('figcaption', { html: md(caption) }));

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    pendingDemos.delete(start);
    try {
      setup({
        stageEl,
        side: sideEl,
        fig,
        makeStage: (opts) => createStage(stageEl, opts),
        panel: (defs, opts) => { const p = controlPanel(defs, opts); sideEl.append(p.el); return p; },
      });
    } catch (err) {
      console.error(err);
      stageEl.append(h('div', { class: 'demo-error' }, `No se pudo iniciar esta demo:\n${err.message}`));
    }
  };
  pendingDemos.add(start);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); start(); }
    }, { rootMargin: '300px' });
    requestAnimationFrame(() => io.observe(fig));
  } else {
    requestAnimationFrame(start);
  }
  return fig;
}

// ---------- Quiz ----------
/** quiz([{ q, options:[...], answer: 1, why: '...' }]) */
export function quiz(questions) {
  const lessonId = current.id;
  const root = h('div', { class: 'quiz wide' }, h('h3', {}, 'Compruébalo tú mismo'));
  let answered = 0, correct = 0;
  const score = h('div', { class: 'q-score' });
  questions.forEach((q) => {
    const box = h('div', { class: 'q' }, h('p', { class: 'q-text', html: md(q.q) }));
    const opts = q.options.map((text, i) => h('button', {
      class: 'q-opt',
      html: md(text),
      onClick: () => {
        if (box.classList.contains('answered')) return;
        box.classList.add('answered');
        opts.forEach((b, j) => {
          b.disabled = true;
          if (j === q.answer) b.classList.add('right');
          else if (j === i) b.classList.add('wrong');
        });
        answered++;
        if (i === q.answer) correct++;
        if (answered === questions.length) {
          score.textContent = `Resultado: ${correct} de ${questions.length}${correct === questions.length ? ' — perfecto' : ' — repasa las explicaciones en rojo y vuelve a intentarlo recargando la página'}`;
          progress.setQuiz(lessonId, correct, questions.length);
        }
      },
    }));
    box.append(...opts, h('div', { class: 'q-why', html: md(q.why) }));
    root.append(box);
  });
  root.append(score);
  return root;
}
