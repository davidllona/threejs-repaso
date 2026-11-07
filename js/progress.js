// Progreso guardado en el navegador (localStorage). No sale de tu ordenador.
const KEY = 'threejs-repaso-v1';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return { done: s?.done || {}, quiz: s?.quiz || {}, cards: s?.cards || {} };
  } catch {
    return { done: {}, quiz: {}, cards: {} };
  }
}

let state = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* modo privado: no pasa nada */ }
  window.dispatchEvent(new CustomEvent('tj-progress'));
}

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
  reset() { state = { done: {}, quiz: {}, cards: {} }; save(); },
};

// Lección que se está viendo ahora mismo (la rellena el router).
export const current = { id: null };
