// ============================================================================
// cards.js — el motor de tarjetas: una idea por pantalla, con pregunta al final.
//
//   Cada lección exporta un array de tarjetas:
//     { t: 'Título corto',
//       body: () => [nodos...],        ← lo que se ve (demo/diagrama primero)
//       more: () => [nodos...],        ← opcional: «Entender más» (plegado)
//       check: { ... } }               ← opcional: la pregunta de la tarjeta
//
//   Tipos de pregunta (check.type):
//     'mc'      → { q, options:[], answer:i, why }               test normal
//     'predict' → igual que mc + reveal: () => nodo               predice y mira
//     'fill'    → { q, pre, post, accept:[...], answer, why }     completa el hueco
//     'order'   → { q, lines:[en orden correcto], why }           ordena las líneas
//
//   La última tarjeta («Repaso») la genera el motor: repite las que fallaste.
// ============================================================================
import { h, md } from './ui.js';
import { progress } from './progress.js';

/* ---------- utilidades ---------- */
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // que nunca salga ya ordenado (si hay más de 2)
  if (a.length > 2 && a.every((v, i) => v === arr[i])) [a[0], a[1]] = [a[1], a[0]];
  return a;
}
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

/* ----------------------------------------------------------------------
   Preguntas. makeCheck(def, onResult) → elemento.
   onResult(ok) se llama UNA vez, con el primer intento (para el progreso);
   en fill/order se puede reintentar después, pero el resultado ya quedó.
   ---------------------------------------------------------------------- */
export function makeCheck(def, onResult) {
  const box = h('div', { class: 'check' },
    h('div', { class: 'check-head' }, h('span', { class: 'check-ico' }, '?'), h('span', {}, '¿Lo pillas?')));
  const q = h('p', { class: 'q-text', html: md(def.q) });
  box.append(q);
  let reported = false;
  const report = (ok) => { if (!reported) { reported = true; onResult?.(ok); } };
  const why = h('div', { class: 'q-why', html: md(def.why || '') });

  if (def.type === 'fill') {
    const input = h('input', {
      class: 'fill-input', type: 'text', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off',
      placeholder: def.placeholder || '…', 'aria-label': 'Tu respuesta',
      style: def.size ? { width: `${def.size}ch` } : null,
    });
    const line = h('div', { class: 'fill-line' },
      def.pre != null && h('span', { class: 'fill-code' }, def.pre), input, def.post != null && h('span', { class: 'fill-code' }, def.post));
    const msg = h('div', { class: 'q-why' });
    const btn = h('button', { class: 'btn primary', type: 'button' }, 'Comprobar');
    const test = (v) => (def.accept || [def.answer]).some((a) => (a instanceof RegExp ? a.test(norm(v)) : norm(a) === norm(v)));
    const go = () => {
      if (!input.value.trim()) { input.focus(); return; }
      const ok = test(input.value);
      report(ok);
      line.classList.remove('right', 'wrong');
      line.classList.add(ok ? 'right' : 'wrong');
      msg.style.display = 'block';
      msg.innerHTML = ok
        ? md(`**Correcto.** ${def.why || ''}`)
        : md(`**Aún no.** La respuesta era \`${def.answer}\`. ${def.why || ''}`);
      if (ok) { btn.disabled = true; input.disabled = true; }
    };
    btn.addEventListener('click', go);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    box.append(line, h('div', { class: 'check-row' }, btn), msg);
    return box;
  }

  if (def.type === 'order') {
    const correct = def.lines;
    let pickedIdx = [];
    const pool = h('div', { class: 'ord-pool' });
    const out = h('div', { class: 'ord-out' });
    const msg = h('div', { class: 'q-why' });
    const btns = correct.map((text, i) => h('button', { class: 'ord-line', type: 'button', html: `<code>${md(text).replace(/<\/?code>/g, '')}</code>` }));
    const paintOut = () => {
      out.innerHTML = '';
      pickedIdx.forEach((ci, n) => out.append(h('div', { class: 'ord-line picked' },
        h('span', { class: 'ord-n' }, n + 1), h('code', { html: md(correct[ci]).replace(/<\/?code>/g, '') }))));
      if (!pickedIdx.length) out.append(h('div', { class: 'ord-hint' }, 'Toca las líneas de arriba en el orden correcto.'));
    };
    btns.forEach((b, ci) => b.addEventListener('click', () => {
      if (b.disabled) return;
      b.disabled = true;
      pickedIdx.push(ci);
      paintOut();
      if (pickedIdx.length === correct.length) {
        const ok = pickedIdx.every((v, i) => v === i);
        report(ok);
        out.classList.add(ok ? 'right' : 'wrong');
        msg.style.display = 'block';
        msg.innerHTML = ok
          ? md(`**Correcto.** ${def.why || ''}`)
          : md(`**Aún no.** El orden correcto era:\n`) + `<ol class="ord-sol">${correct.map((l) => `<li><code>${md(l).replace(/<\/?code>/g, '')}</code></li>`).join('')}</ol>` + md(def.why || '');
      }
    }));
    const reset = h('button', { class: 'btn', type: 'button', onClick: () => {
      pickedIdx = [];
      out.classList.remove('right', 'wrong');
      msg.style.display = 'none';
      btns.forEach((b) => { b.disabled = false; });
      paintOut();
    } }, 'Empezar de nuevo');
    const order = shuffled(correct.map((_, i) => i));
    order.forEach((ci) => pool.append(btns[ci]));
    paintOut();
    box.append(pool, out, h('div', { class: 'check-row' }, reset), msg);
    return box;
  }

  // mc / predict
  const opts = def.options.map((text, i) => h('button', {
    class: 'q-opt', type: 'button', html: md(text),
    onClick: () => {
      if (box.classList.contains('answered')) return;
      box.classList.add('answered');
      const ok = i === def.answer;
      report(ok);
      opts.forEach((b, j) => {
        b.disabled = true;
        if (j === def.answer) b.classList.add('right');
        else if (j === i) b.classList.add('wrong');
      });
      why.style.display = 'block';
      why.innerHTML = md(`${ok ? '**Correcto.**' : '**Aún no.**'} ${def.why || ''}`);
      if (def.type === 'predict' && def.reveal) {
        const r = h('div', { class: 'reveal' });
        const made = def.reveal();
        (Array.isArray(made) ? made : [made]).forEach((n) => n && r.append(n));
        box.append(r);
      }
    },
  }));
  box.append(...opts, why);
  return box;
}

/* ----------------------------------------------------------------------
   El reproductor de tarjetas
   ---------------------------------------------------------------------- */
export function renderCardLesson(root, item, cards, idx, { FLAT }) {
  const lessonId = item.id;
  const total = cards.length + 1; // + la tarjeta de repaso
  const isReview = idx >= cards.length;
  if (idx > cards.length) idx = cards.length;
  const st = progress.cards(lessonId);

  /* --- cabecera compacta + barra segmentada --- */
  const segs = [];
  for (let i = 0; i < total; i++) {
    const s = i < cards.length ? st[i] : null;
    const a = h('a', {
      class: `seg${i === idx ? ' cur' : ''}${s === 'right' ? ' ok' : s === 'wrong' ? ' ko' : s ? ' seen' : ''}`,
      href: `#/${lessonId}/${i + 1}`,
      'aria-label': i < cards.length ? `Tarjeta ${i + 1}: ${cards[i].t}` : 'Repaso',
      title: i < cards.length ? cards[i].t : 'Repaso',
    });
    segs.push(a);
  }
  // Si llega progreso de otro dispositivo (js/cloud.js), la barra se actualiza sola.
  const repaintSegs = () => {
    const now = progress.cards(lessonId);
    segs.forEach((a, i) => {
      if (i >= cards.length) return;
      const s = now[i];
      a.classList.toggle('ok', s === 'right');
      a.classList.toggle('ko', s === 'wrong');
      a.classList.toggle('seen', !!s && s !== 'right' && s !== 'wrong');
    });
  };
  window.addEventListener('tj-progress', repaintSegs);
  window.addEventListener('hashchange', () => window.removeEventListener('tj-progress', repaintSegs), { once: true });
  const head = h('header', { class: 'card-head' },
    h('div', { class: 'card-meta' },
      h('span', { class: 'card-lesson' }, item.title),
      h('span', { class: 'card-count' }, isReview ? 'Repaso' : `${idx + 1} / ${total}`)),
    h('div', { class: 'card-segs', role: 'navigation', 'aria-label': 'Tarjetas de la lección' }, segs),
    idx === 0 && item.sub ? h('p', { class: 'card-sub' }, item.sub) : null);
  root.append(head);

  /* --- cuerpo --- */
  const art = h('section', { class: 'card-body' });
  root.append(art);

  const onResult = (i) => (ok) => {
    progress.setCard(lessonId, i, ok ? 'right' : 'wrong');
    segs[i].classList.remove('seen', 'ok', 'ko');
    segs[i].classList.add(ok ? 'ok' : 'ko');
    maybeComplete();
  };
  const checkIdxs = cards.map((c, i) => (c.check ? i : -1)).filter((i) => i >= 0);
  const maybeComplete = () => {
    const now = progress.cards(lessonId);
    if (checkIdxs.every((i) => now[i] === 'right') && !progress.isDone(lessonId)) progress.setDone(lessonId, true);
  };

  if (!isReview) {
    const c = cards[idx];
    if (!c.check) progress.setCard(lessonId, idx, st[idx] || 'seen');
    art.append(h('h1', { class: 'card-title' }, c.t));
    const made = typeof c.body === 'function' ? c.body() : c.body;
    (Array.isArray(made) ? made : [made]).forEach((n) => n && art.append(n));
    if (c.more) {
      const det = h('details', { class: 'more' }, h('summary', {}, 'Entender más'));
      let built = false;
      det.addEventListener('toggle', () => {
        if (!det.open || built) return;
        built = true;
        const m = typeof c.more === 'function' ? c.more() : c.more;
        (Array.isArray(m) ? m : [m]).forEach((n) => n && det.append(n));
      });
      art.append(det);
    }
    if (c.check) art.append(makeCheck(c.check, onResult(idx)));
  } else {
    art.append(h('h1', { class: 'card-title' }, 'Repaso de la lección'));
    const now = progress.cards(lessonId);
    const failed = checkIdxs.filter((i) => now[i] !== 'right');
    const pending = checkIdxs.filter((i) => !now[i]);
    if (!checkIdxs.length) {
      art.append(h('p', {}, 'Esta lección no tiene preguntas. Si has pasado por todas las tarjetas, ya la tienes.'));
    } else if (!failed.length) {
      art.append(h('p', { class: 'review-ok', html: md(`**Todo correcto**: has acertado las ${checkIdxs.length} preguntas de la lección. 🎉`) }));
    } else {
      art.append(h('p', { html: md(pending.length === failed.length && !pending.every((p) => now[p])
        ? ''
        : `Vuelven a salir las **${failed.length}** que ${pending.length ? 'te saltaste o ' : ''}fallaste. Si dudas, toca su número arriba para releer la tarjeta.`) }));
      failed.forEach((i) => {
        art.append(h('div', { class: 'review-item' },
          h('a', { class: 'review-link', href: `#/${lessonId}/${i + 1}` }, `Tarjeta ${i + 1} · ${cards[i].t}`),
          makeCheck(cards[i].check, onResult(i))));
      });
    }
    /* marcar lección */
    const doneBtn = h('button', { class: 'btn primary', type: 'button' }, '');
    const paint = () => { doneBtn.textContent = progress.isDone(lessonId) ? '✓ Lección repasada (toca para desmarcar)' : 'Marcar la lección como repasada'; };
    doneBtn.addEventListener('click', () => { progress.setDone(lessonId, !progress.isDone(lessonId)); paint(); });
    paint();
    window.addEventListener('tj-progress', paint, { once: true });
    art.append(h('div', { class: 'check-row', style: { marginTop: '22px' } }, doneBtn));
  }

  /* --- navegación --- */
  const i = FLAT.findIndex((x) => x.id === lessonId);
  const prevLesson = FLAT[i - 1];
  const nextLesson = FLAT[i + 1];
  const prev = idx > 0
    ? h('a', { class: 'btn nav-prev', href: `#/${lessonId}/${idx}` }, '← Anterior')
    : (prevLesson ? h('a', { class: 'btn nav-prev', href: `#/${prevLesson.id}`, 'aria-label': `Lección anterior: ${prevLesson.title}` },
        '← ', h('span', { class: 'nav-label' }, prevLesson.title)) : null);
  const next = !isReview
    ? h('a', { class: 'btn primary nav-next', href: `#/${lessonId}/${idx + 2}` }, idx + 1 === cards.length ? 'Repaso →' : 'Siguiente →')
    : (nextLesson ? h('a', { class: 'btn primary nav-next', href: `#/${nextLesson.id}`, 'aria-label': `Siguiente lección: ${nextLesson.title}` },
        h('span', { class: 'nav-short' }, 'Siguiente lección'), h('span', { class: 'nav-label' }, nextLesson.title), ' →') : null);
  root.append(h('nav', { class: 'lesson-nav card-nav wide' }, prev, h('span', { class: 'spacer' }), next));

  /* flechas del teclado */
  const onKey = (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight' && next) location.hash = next.getAttribute('href');
    else if (e.key === 'ArrowLeft' && prev) location.hash = prev.getAttribute('href');
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', () => window.removeEventListener('keydown', onKey), { once: true });
}
