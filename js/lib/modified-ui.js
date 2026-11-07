// ============================================================================
// modified-ui.js — las piezas interactivas de la lección «Modified materials»
//   chunkExplorer()      → explora los chunks REALES de Three.js
//   guidedLab(ctl)       → laboratorio paso a paso (genera y ejecuta el código de cada paso)
//   challengeLab()       → «tu turno»: escribes tú el código y se ejecuta de verdad
// ============================================================================
import { h, md, codeEditor, demo } from '../ui.js';
import { THREE } from '../stage.js';
import {
  buildScene, createRunner, diffAdded, generateJS, hintFor, DEFAULT_CFG, normalizeCfg, MODELS,
  SOLUTION_CODE, STARTER_CODE,
} from './modified-lab.js';

const tabs = (s) => s.replace(/\t/g, '    ');

/* ----------------------------------------------------------------------
   Pasos del laboratorio guiado (siguen las secciones de la lección)
   ---------------------------------------------------------------------- */
/* (el antiguo laboratorio guiado por pasos se sustituyó por miniLab: un laboratorio
   pequeño por tarjeta, configurado con el cfg de generateJS) */

/* ----------------------------------------------------------------------
   Pintar el resultado de ejecutar (éxito o errores reales)
   ---------------------------------------------------------------------- */
function showResult(status, res) {
  if (res.ok) {
    status.className = 'lab-status ok';
    status.textContent = ['✔ Compila sin errores', ...(res.logs.length ? ['', 'console.log →', ...res.logs] : [])].join('\n');
    return;
  }
  const out = ['✘ Error (el dibujo conserva el último resultado válido)'];
  res.errors.slice(0, 4).forEach((e) => {
    out.push('', `  ${e.where}${e.line ? ` · línea ${e.line} del shader final` : ''}: ${e.msg}`);
    if (e.src) out.push(`      > ${e.src}`);
    const t = hintFor(e.msg);
    if (t) out.push(`      Pista: ${t.replace(/`/g, '')}`);
  });
  if (res.errors.length > 4) out.push('', `  … y ${res.errors.length - 4} errores más (suelen ser consecuencia del primero).`);
  status.className = 'lab-status bad';
  status.textContent = out.join('\n');
}

const pickShader = (runner, which) => {
  const src = which === 'depth' ? runner.captured.depth : runner.captured.main;
  const orig = which === 'depth' ? runner.originals.depth : runner.originals.main;
  return { src: src && tabs(src), orig: tabs(orig) };
};
function paintShader(ed, runner, which) {
  const { src, orig } = pickShader(runner, which);
  if (!src) {
    ed.set('// El depthMaterial todavía no existe.\n// (en el laboratorio guiado: activa «Sombra: customDepthMaterial»)');
    return;
  }
  ed.set(src);
  const added = diffAdded(src, orig);
  ed.mark(added, 'add');
  if (added.length) ed.scrollToLine(added[0]);
  else ed.scrollToLine(1);
}
const shaderSelect = () => h('select', { class: 'mini-select' },
  h('option', { value: 'main' }, 'del material'), h('option', { value: 'depth' }, 'del depthMaterial'));

/* ======================================================================
   1 · Explorador de chunks (datos reales de THREE.ShaderChunk)
   ====================================================================== */
const CHUNK_NOTES = {
  common: 'Se incluye **antes de `main()`**: es el sitio ideal para tus funciones y tus `uniform`. Declara constantes como `PI`, y funciones auxiliares que usan los demás chunks.',
  beginnormal_vertex: 'Declara **`objectNormal`**, la normal del vértice. Va **antes** que `begin_vertex` en `main()`.',
  begin_vertex: 'Declara **`transformed`**, una copia de `position`. Todo lo que le hagas a `transformed` es lo que luego se proyecta a la pantalla.',
  project_vertex: 'Usa `transformed` para calcular `gl_Position`, la posición final en pantalla. Por eso lo que cambies en `begin_vertex` se ve.',
  defaultnormal_vertex: 'Convierte `objectNormal` a la normal que usa la iluminación (`transformedNormal`). Lee `objectNormal`, así que cualquier cambio tiene que hacerse **antes**.',
  shadowmap_vertex: 'Calcula la posición del vértice vista desde la luz, para poder decidir si está en sombra.',
};

export function chunkExplorer() {
  const SH = THREE.ShaderChunk;
  const src = tabs(THREE.ShaderLib.standard.vertexShader);
  const names = [];
  for (const m of src.matchAll(/#include <(\w+)>/g)) if (!names.includes(m[1])) names.push(m[1]);
  const star = new Set(['common', 'beginnormal_vertex', 'begin_vertex', 'project_vertex']);

  const edMain = codeEditor({ title: 'vertexShader de MeshStandardMaterial (el de verdad)', lang: 'glsl', value: src, height: 440, readOnly: true, autoHeight: true });
  const edChunk = codeEditor({ title: 'chunk', lang: 'glsl', value: '', height: 440, readOnly: true, autoHeight: true });
  const info = h('div', { class: 'lab-status' });
  const select = h('select', { class: 'code-select', 'aria-label': 'Elige un chunk' },
    names.map((n, i) => h('option', { value: n }, `${star.has(n) ? '★ ' : ''}${n}`)));

  const show = (name) => {
    select.value = name;
    const lines = src.replace(/^\n+/, '').split('\n');
    const idx = lines.findIndex((l) => l.includes(`#include <${name}>`));
    edMain.mark(idx >= 0 ? [idx + 1] : [], 'sel');
    if (idx >= 0) edMain.scrollToLine(idx + 1);
    const text = tabs(SH[name] || '// (vacío)');
    edChunk.set(text);
    edChunk.setTitle(`THREE.ShaderChunk.${name}`);
    const vars = [...text.matchAll(/^\s*(?:vec[234]|mat[234]|float|int|bool)\s+(\w+)\s*(?:=|;)/gm)].map((m) => m[1]);
    const fns = [...text.matchAll(/^\s*(?:vec[234]|mat[234]|float|int|bool|void)\s+(\w+)\s*\(/gm)].map((m) => m[1]);
    const parts = [];
    if (vars.length) parts.push(`Declara las variables: ${[...new Set(vars)].join(', ')}`);
    if (fns.length) parts.push(`Define las funciones: ${[...new Set(fns)].slice(0, 8).join(', ')}${fns.length > 8 ? '…' : ''}`);
    if (!parts.length) parts.push('No declara variables ni funciones propias (solo usa o modifica las que ya existen).');
    info.className = 'lab-status';
    info.innerHTML = `${parts.join('\n')}${CHUNK_NOTES[name] ? `\n\n${CHUNK_NOTES[name]}` : ''}`.split('\n\n').map((p) => `<div>${md(p)}</div>`).join('<br>');
  };
  select.addEventListener('change', () => show(select.value));

  const quick = ['common', 'beginnormal_vertex', 'begin_vertex', 'project_vertex'].map((n) => h('button', { class: 'btn', onClick: () => show(n) }, n));
  const fig = h('figure', { class: 'demo wide' },
    h('div', { class: 'demo-head' }, h('span', { class: 'demo-title' }, 'Explorador de chunks'), h('span', { class: 'demo-badge' }, 'interactivo')),
    h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', padding: '14px 16px 0' } },
      h('span', { class: 'ctl-note', style: { margin: 0 } }, 'Elige un chunk:'), select, h('span', { class: 'ctl-note', style: { margin: '0 0 0 8px' } }, 'Atajos:'), ...quick),
    h('div', { class: 'lab-editors', style: { borderTop: '0', background: 'transparent' } }, edMain.el, edChunk.el, info),
    h('figcaption', { html: md('A la izquierda, el shader real que Three.js usa para `MeshStandardMaterial` (con sus `#include` sin resolver, tal como lo recibe `onBeforeCompile`). A la derecha, el texto real del chunk que eliges. Lo que ves es `THREE.ShaderChunk` de la versión instalada, no una copia.') }));
  show('begin_vertex');
  return fig;
}

/* ======================================================================
   2 · miniLab — un laboratorio pequeño y enfocado para cada tarjeta
   ====================================================================== */
export function miniLab(cfg, opts = {}) {
  const { caption = '', title = 'Laboratorio', aspect = '16 / 10', showCode = false, compare = null, showStatus = true } = opts;
  let edJS = null;
  const statusEl = h('div', { class: 'lab-status' }, 'Se compilará al entrar en pantalla…');
  const fig = demo({
    title, aspect, caption,
    setup({ makeStage, panel }) {
      const stage = makeStage({ pos: [9.5, 4.6, 19], target: [0, 1.4, 0], fov: 36, shadows: true });
      const parts = buildScene(stage);
      const runner = createRunner(stage, parts);
      let time = 0; let paused = false;
      stage.onTick((dt) => { if (!paused) time += dt; const u = runner.uniforms; if (u && u.uTime) u.uTime.value = time; });

      const apply = (c) => {
        const n = normalizeCfg({ ...DEFAULT_CFG, ...c });
        const code = generateJS(n);
        if (edJS) edJS.set(code);
        const res = runner.run(code);
        showResult(statusEl, res);
      };

      const defs = [];
      if (compare) defs.push({ type: 'check', id: 'cmp', label: compare.label, value: !!compare.initial, onInput: (v) => apply(v ? compare.on : compare.off) });
      if (cfg.slider) defs.push({ type: 'range', id: 'twist', label: 'uTwist (la intensidad)', min: 0, max: 2, step: 0.05, value: cfg.formula === 'sin' ? 0.4 : 0.9, onInput: (v) => { runner.uniforms.uTwist.value = v; } });
      defs.push({ type: 'select', id: 'model', label: 'Modelo', options: Object.entries(MODELS).map(([k, m]) => [k, m.label]), value: 'column', onInput: (v) => parts.setModel(v) });
      if (cfg.animate || (compare && (compare.on.animate || compare.off.animate))) defs.push({ type: 'check', id: 'pause', label: 'Pausar uTime', value: false, onInput: (v) => { paused = v; } });
      panel(defs, { initial: false });

      apply(compare && compare.initial ? compare.on : cfg);
    },
  });
  if (showCode) {
    edJS = codeEditor({ title: 'El código que se está ejecutando', lang: 'js', value: '', height: 340, readOnly: true, autoHeight: true });
    fig.querySelector('.demo-body').after(h('div', { class: 'lab-editors one' }, edJS.el, statusEl));
  } else if (showStatus) {
    fig.querySelector('.demo-body').after(h('div', { class: 'lab-editors one' }, statusEl));
  }
  return fig;
}

/* ======================================================================
   3 · Tu turno
   ====================================================================== */
const strip = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
const CHECKS = [
  ['Gancho `material.onBeforeCompile`', (c) => /material\.onBeforeCompile\s*=/.test(c)],
  ['Función con `mat2` colocada en el chunk `common`', (c) => /#include <common>/.test(c) && /mat2\s+\w+\s*\(\s*float/.test(c)],
  ['Ángulo según la altura (`position.y`)', (c) => /position\.y/.test(c)],
  ['Giro: `transformed.xz = rotateMatrix * transformed.xz`', (c) => /transformed\.xz\s*=\s*\w+\s*\*\s*transformed\.xz/.test(c)],
  ['Animación: `shader.uniforms.uTime` y `uniform float uTime`', (c) => /shader\.uniforms\.uTime\s*=/.test(c) && /uniform\s+float\s+uTime/.test(c)],
  ['Sombra: `customDepthMaterial` con `RGBADepthPacking`', (c) => /customDepthMaterial\s*=/.test(c) && /RGBADepthPacking/.test(c) && /depthMaterial\.onBeforeCompile/.test(c)],
  ['Normales: `objectNormal.xz` en `beginnormal_vertex`', (c) => /#include <beginnormal_vertex>/.test(c) && /objectNormal\.xz\s*=/.test(c)],
];

export function challengeLab() {
  let schedule = () => {};
  const edCode = codeEditor({ title: 'Tu código (se ejecuta de verdad)', lang: 'js', value: STARTER_CODE, height: 540, onInput: () => schedule() });
  const edSh = codeEditor({ title: 'vertexShader resultante', lang: 'glsl', value: '', height: 540, readOnly: true, autoHeight: true });
  const sel = shaderSelect();
  edSh.head.append(sel);
  const status = h('div', { class: 'lab-status' }, 'Se ejecutará al empezar…');
  const editors = h('div', { class: 'lab-editors' }, edCode.el, edSh.el, status);
  const checklist = h('div', { class: 'checklist' });

  const fig = demo({
    title: 'Tu turno: escríbelo tú',
    aspect: '5 / 6',
    caption: 'Escribe (o pega) el código y se ejecuta medio segundo después de que dejes de teclear. Si se rompe, verás el mensaje real y la columna conserva el último resultado que funcionó. La lista de la derecha solo **detecta** si tu código contiene cada pieza.',
    setup({ makeStage, panel }) {
      const stage = makeStage({ pos: [9.5, 4.6, 19], target: [0, 1.4, 0], fov: 36, shadows: true });
      const parts = buildScene(stage);
      const runner = createRunner(stage, parts);
      let time = 0; let paused = false; let timer = 0; let last = { ok: true };
      stage.onTick((dt) => { if (!paused) time += dt; const u = runner.uniforms; if (u && u.uTime) u.uTime.value = time; });

      const updateChecklist = () => {
        const code = strip(edCode.get());
        checklist.innerHTML = '';
        CHECKS.forEach(([label, test]) => {
          const ok = test(code);
          checklist.append(h('div', { class: `chk${ok ? ' ok' : ''}` }, h('span', {}, ok ? '✔' : '○'), h('span', { html: md(label) })));
        });
        checklist.append(h('div', { class: `chk${last.ok ? ' ok' : ' bad'}` }, h('span', {}, last.ok ? '✔' : '✘'), h('span', {}, last.ok ? 'Compila sin errores' : 'Hay un error (mira el panel de estado)')));
      };
      const updateShader = () => paintShader(edSh, runner, sel.value);
      const execute = () => {
        clearTimeout(timer);
        const res = runner.run(edCode.get());
        last = res;
        showResult(status, res);
        updateShader();
        updateChecklist();
      };
      schedule = () => { clearTimeout(timer); timer = setTimeout(execute, 500); updateChecklist(); };

      panel([
        { type: 'button', label: 'Ejecutar ahora', primary: true, onClick: execute },
        { type: 'button', label: 'Empezar de cero', onClick: () => { edCode.set(STARTER_CODE); execute(); } },
        { type: 'button', label: 'Cargar la solución', onClick: () => { edCode.set(SOLUTION_CODE); execute(); } },
        { type: 'check', id: 'pause', label: 'Pausar uTime', value: false, onInput: (v) => { paused = v; } },
        { type: 'select', id: 'model', label: 'Modelo', options: Object.entries(MODELS).map(([k, m]) => [k, m.label]), value: 'column', onInput: (v) => parts.setModel(v) },
      ], { initial: false }).el.append(h('div', { class: 'ctl-group' }, 'Lo que detecta tu código'), checklist);
      sel.addEventListener('change', updateShader);
      execute();
    },
  });
  fig.querySelector('.demo-body').after(editors);
  return fig;
}
