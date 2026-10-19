// Progreso guardado en el navegador (localStorage). No sale de tu ordenador.
const KEY = 'threejs-repaso-v1';

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return { done: s?.done || {}, quiz: s?.quiz || {} };
  } catch {
    return { done: {}, quiz: {} };
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
  doneCount: () => Object.keys(state.done).length,
  reset() { state = { done: {}, quiz: {} }; save(); },
};

// Lección que se está viendo ahora mismo (la rellena el router).
export const current = { id: null };
