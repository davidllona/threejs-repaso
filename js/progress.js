// Progreso: se guarda en el navegador (localStorage) y, si inicias sesión,
// también en Firebase (ver js/cloud.js), para no perderlo entre dispositivos.
const KEY = 'threejs-repaso-v1';

const empty = () => ({ done: {}, quiz: {}, cards: {} });

function clean(s) {
  return { done: s?.done || {}, quiz: s?.quiz || {}, cards: s?.cards || {} };
}

function load() {
  try { return clean(JSON.parse(localStorage.getItem(KEY))); } catch { return empty(); }
}

let state = load();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado: no pasa nada */ }
  window.dispatchEvent(new CustomEvent('tj-progress'));
}

/** Cambio hecho por ti en esta pestaña: se guarda y avisa a la nube. */
function save() {
  persist();
  window.dispatchEvent(new CustomEvent('tj-progress-local'));
}

// Al mezclar dos progresos nunca se pierde nada: un acierto gana a un fallo,
// y un fallo a una tarjeta solo vista.
const RANK = { seen: 1, wrong: 2, right: 3 };

export function mergeStates(a, b) {
  a = clean(a); b = clean(b);
  const out = empty();
  for (const id of new Set([...Object.keys(a.done), ...Object.keys(b.done)])) {
    if (a.done[id] || b.done[id]) out.done[id] = true;
  }
  for (const id of new Set([...Object.keys(a.quiz), ...Object.keys(b.quiz)])) {
    const x = a.quiz[id], y = b.quiz[id];
    out.quiz[id] = !x ? y : !y ? x : (y.score > x.score ? y : x);
  }
  for (const id of new Set([...Object.keys(a.cards), ...Object.keys(b.cards)])) {
    const x = a.cards[id] || {}, y = b.cards[id] || {};
    const c = {};
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
      c[k] = (RANK[y[k]] || 0) > (RANK[x[k]] || 0) ? y[k] : x[k];
    }
    out.cards[id] = c;
  }
  return out;
}

// Comparación que no depende del orden de las claves.
const sortKeys = (v) => (v && typeof v === 'object' && !Array.isArray(v)
  ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {})
  : v);
const same = (a, b) => JSON.stringify(sortKeys(clean(a))) === JSON.stringify(sortKeys(clean(b)));

export const progress = {
  isDone: (id) => !!state.done[id],
  setDone(id, value) {
    if (value) state.done[id] = true; else delete state.done[id];
    save();
  },
  quiz: (id) => state.quiz[id] || null,
  setQuiz(id, score, total) {
    const prev = state.quiz[id];
    if (!prev || score >= prev.score) state.quiz[id] = { score, total };
    save();
  },
  /** Estado por tarjeta: { 0:'right'|'wrong'|'seen', ... } */
  cards: (id) => state.cards[id] || {},
  setCard(id, idx, status) {
    const c = state.cards[id] || (state.cards[id] = {});
    if (c[idx] === 'right' && status !== 'right') return; // un acierto no se degrada
    if (c[idx] === status) return;
    c[idx] = status;
    save();
  },
  doneCount: () => Object.keys(state.done).length,
  reset() { state = empty(); save(); },

  /** Copia del progreso para guardarla fuera. */
  snapshot: () => JSON.parse(JSON.stringify(state)),
  /**
   * Mezcla un progreso que viene de fuera (la nube) con el de aquí.
   * Devuelve true si aquí había algo que la nube aún no tiene (hay que subirlo).
   */
  absorb(remote) {
    const merged = mergeStates(state, remote);
    if (!same(merged, state)) { state = merged; persist(); }
    return !same(merged, remote);
  },
};

// Lección que se está viendo ahora mismo (la rellena el router).
export const current = { id: null };
