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
export const STEPS = [
  { t: 'El material normal', cfg: {}, look: 'Este es un `MeshStandardMaterial` tal cual: textura, luz y sombras. Todavía no hemos tocado su shader.' },
  { t: 'Engancharse: onBeforeCompile', cfg: { hook: true, log: true }, look: '`console.log(shader)` enseña que el gancho recibe un objeto con `vertexShader`, `fragmentShader` y `uniforms` (mira el panel de estado). A la derecha tienes el vertexShader de verdad, lleno de `#include`.' },
  { t: 'Romper a propósito: reemplazar por nada', cfg: { hook: true, beginMode: 'nothing' }, look: 'El compilador se queja: `transformed` ya no existe. Fíjate en el mensaje real de la GPU y en cómo el dibujo se queda con el último material válido.' },
  { t: 'Devolver el include', cfg: { hook: true, beginMode: 'include' }, look: 'Reemplazamos `#include <begin_vertex>` por sí mismo: no cambia nada, pero ya tenemos **un sitio donde escribir**.' },
  { t: 'Mover en y: transformed.y += 3.0', cfg: { hook: true, beginMode: 'include', moveY: true }, look: 'La columna sube 3 unidades… ¡pero su **sombra se queda en el suelo**! (De eso nos ocupamos en el paso 9.)' },
  { t: 'Torsión con un ángulo fijo', cfg: { hook: true, beginMode: 'include', twist: 'const' }, look: 'Con `angle = 0.3` todos los vértices giran lo mismo: la columna entera rota. La sombra sigue sin enterarse.' },
  { t: 'Torsión según la altura', cfg: { hook: true, beginMode: 'include', twist: 'height' }, look: 'Ahora el ángulo es `position.y * 0.9`: abajo no gira, arriba gira más. ¡Retorcida! Fíjate en que la luz del lateral sigue como si nada hubiera pasado (normales sin arreglar).' },
  { t: 'Animar con uTime', cfg: { hook: true, beginMode: 'include', twist: 'height', animate: true }, look: 'Un uniform que cambia cada frame: `(position.y + uTime) * 0.9`. El `uTime` viaja desde el `tick` gracias a `customUniforms`.' },
  { t: 'Arreglar la sombra: customDepthMaterial', cfg: { hook: true, beginMode: 'include', twist: 'height', animate: true, depth: true }, look: 'La sombra del suelo y de la pared ya se retuerce. Cambia el selector del panel derecho a «del depthMaterial» para ver su shader.' },
  { t: 'Normales: el error de las dos declaraciones', cfg: { hook: true, beginMode: 'include', twist: 'height', animate: true, depth: true, normals: true, dup: true }, look: 'Error real de la lección: `angle` y `rotateMatrix` quedan declaradas **dos veces** en el mismo shader. Los chunks se fusionan en uno solo.' },
  { t: 'Normales: arreglado', cfg: { hook: true, beginMode: 'include', twist: 'height', animate: true, depth: true, normals: true }, look: 'Declaradas una sola vez (en `beginnormal_vertex`, que va antes) y usadas en `begin_vertex`. Ahora la iluminación **gira con la superficie**. Compara activando y desactivando «Normales».' },
  { t: 'Ir más lejos: seno + control con slider', cfg: { hook: true, beginMode: 'include', twist: 'height', animate: true, depth: true, normals: true, formula: 'sin', slider: true }, look: 'Fórmula distinta: `sin(position.y + uTime) * 0.4` — la columna se balancea. Y un segundo uniform, `uTwist`, controlado por el slider sin recompilar nada.' },
];

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
const shaderSelect = () => h('select', { style: { background: '#0d0f13', color: '#e4e7ee', border: '1px solid #3a4152', borderRadius: '6px', padding: '3px 6px', font: '12.5px system-ui' } },
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

  const edMain = codeEditor({ title: 'vertexShader de MeshStandardMaterial (el de verdad)', lang: 'glsl', value: src, height: 440, readOnly: true });
  const edChunk = codeEditor({ title: 'chunk', lang: 'glsl', value: '', height: 440, readOnly: true });
  const info = h('div', { class: 'lab-status' });
  const select = h('select', { style: { background: '#0d0f13', color: '#e4e7ee', border: '1px solid #3a4152', borderRadius: '8px', padding: '7px 10px', font: '13.5px ui-monospace, monospace' } },
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
   2 · Laboratorio guiado
   ====================================================================== */
export function guidedLab(ctl) {
  const edJS = codeEditor({ title: 'Tu código (esto es lo que se ejecuta)', lang: 'js', value: '', height: 470, readOnly: true });
  const edSh = codeEditor({ title: 'vertexShader resultante', lang: 'glsl', value: '', height: 470, readOnly: true });
  const sel = shaderSelect();
  edSh.head.append(sel);
  const status = h('div', { class: 'lab-status' }, 'Se compilará al empezar el laboratorio…');
  const editors = h('div', { class: 'lab-editors' }, edJS.el, edSh.el, status);

  const fig = demo({
    title: 'Laboratorio de Modified materials',
    aspect: '5 / 6',
    caption: 'Cada casilla añade **líneas de código reales**: lo que ves abajo a la izquierda es exactamente lo que se ejecuta, y abajo a la derecha el vertexShader que Three.js compila después (en verde, lo que has añadido tú). Gira la cámara con el ratón.',
    setup({ makeStage, panel }) {
      const stage = makeStage({ pos: [9.5, 4.6, 19], target: [0, 1.4, 0], fov: 36, shadows: true });
      const parts = buildScene(stage);
      const runner = createRunner(stage, parts);
      let time = 0; let paused = false; let ui; let ui2; let ui3; let ready = false;
      let cfg = { ...DEFAULT_CFG };
      let stepIdx = 0;
      stage.onTick((dt) => { if (!paused) time += dt; const u = runner.uniforms; if (u && u.uTime) u.uTime.value = time; });

      const lookEl = h('div', { class: 'ctl-note' });
      const okEl = h('div', { class: 'ctl-note' });
      const sync = (n) => {
        ui2.set('hook', n.hook); ui2.set('log', n.log); ui2.set('begin', n.beginMode); ui2.set('moveY', n.moveY);
        ui2.set('twist', n.twist); ui2.set('animate', n.animate); ui2.set('depth', n.depth); ui2.set('normals', n.normals);
        ui2.set('dup', n.dup); ui2.set('formula', n.formula); ui2.set('slider', n.slider);
      };
      const updateShader = () => paintShader(edSh, runner, sel.value);
      const refresh = () => {
        cfg = normalizeCfg(cfg);
        sync(cfg);
        const code = generateJS(cfg);
        edJS.set(code);
        const res = runner.run(code);
        showResult(status, res);
        okEl.textContent = res.ok ? '✔ Compila bien' : '✘ Error de compilación: mira el panel de estado (abajo)';
        okEl.style.color = res.ok ? 'var(--ok)' : 'var(--bad)';
        updateShader();
      };
      const change = (partial) => {
        if (!ready) return;
        if ('normals' in partial && !partial.normals) partial.dup = false;
        if ('formula' in partial) { const v = partial.formula === 'sin' ? 0.4 : 0.9; runner.uniforms.uTwist.value = v; ui2.set('twistVal', v); }
        cfg = { ...cfg, ...partial };
        refresh();
      };
      const goTo = (n) => {
        stepIdx = Math.max(0, Math.min(STEPS.length - 1, n));
        const s = STEPS[stepIdx];
        cfg = { ...DEFAULT_CFG, ...s.cfg };
        const v = cfg.formula === 'sin' ? 0.4 : 0.9;
        runner.uniforms.uTwist.value = v; ui2.set('twistVal', v);
        ui.set('step', String(stepIdx));
        lookEl.innerHTML = md(s.look);
        ui.refs.prev.input.disabled = stepIdx === 0;
        ui.refs.next.input.disabled = stepIdx === STEPS.length - 1;
        refresh();
      };

      ui = panel([
        { type: 'select', id: 'step', label: 'Paso', options: STEPS.map((s, i) => [String(i), `${i} · ${s.t}`]), value: '0', onInput: (v) => { if (ready) goTo(+v); } },
        { type: 'button', id: 'prev', label: '‹ Anterior', onClick: () => goTo(stepIdx - 1) },
        { type: 'button', id: 'next', label: 'Siguiente ›', primary: true, onClick: () => goTo(stepIdx + 1) },
      ], { initial: false });
      ui.el.append(lookEl, okEl);

      ui2 = panel([
        { type: 'group', label: 'Cada casilla añade líneas de código' },
        { type: 'check', id: 'hook', label: 'onBeforeCompile (el gancho)', value: false, onInput: (v) => change({ hook: v }) },
        { type: 'check', id: 'log', label: 'console.log(shader)', value: false, onInput: (v) => change({ log: v }) },
        { type: 'select', id: 'begin', label: 'Chunk begin_vertex', options: [['none', 'sin tocar'], ['nothing', 'reemplazar por NADA (¡rompe!)'], ['include', 'reemplazar y devolver el include']], value: 'none', onInput: (v) => change({ beginMode: v }) },
        { type: 'check', id: 'moveY', label: 'transformed.y += 3.0', value: false, onInput: (v) => change({ moveY: v }) },
        { type: 'select', id: 'twist', label: 'Giro de transformed.xz', options: [['none', 'ninguno'], ['const', 'ángulo fijo (0.3)'], ['height', 'ángulo según la altura']], value: 'none', onInput: (v) => change({ twist: v }) },
        { type: 'check', id: 'animate', label: 'Animar con uTime', value: false, onInput: (v) => change({ animate: v }) },
        { type: 'check', id: 'depth', label: 'Sombra: customDepthMaterial', value: false, onInput: (v) => change({ depth: v }) },
        { type: 'check', id: 'normals', label: 'Normales: objectNormal.xz', value: false, onInput: (v) => change({ normals: v }) },
        { type: 'check', id: 'dup', label: '…con angle declarado dos veces (error)', value: false, onInput: (v) => change({ dup: v }) },
        { type: 'select', id: 'formula', label: 'Fórmula del ángulo', options: [['linear', 'lineal (× 0.9)'], ['sin', 'seno: sin(y + uTime) × 0.4']], value: 'linear', onInput: (v) => change({ formula: v }) },
        { type: 'check', id: 'slider', label: 'Intensidad con un uniform uTwist', value: false, onInput: (v) => change({ slider: v }) },
        { type: 'range', id: 'twistVal', label: 'uTwist (slider)', min: 0, max: 2, step: 0.05, value: 0.9, onInput: (v) => { runner.uniforms.uTwist.value = v; } },
      ], { initial: false });

      ui3 = panel([
        { type: 'group', label: 'Escena' },
        { type: 'select', id: 'model', label: 'Modelo', options: Object.entries(MODELS).map(([k, m]) => [k, m.label]), value: 'column', onInput: (v) => { if (ready) parts.setModel(v); } },
        { type: 'check', id: 'pause', label: 'Pausar uTime', value: false, onInput: (v) => { paused = v; } },
      ], { initial: false });

      sel.addEventListener('change', updateShader);
      ready = true;
      ctl.goTo = goTo;
      goTo(ctl.pending || 0);
    },
  });
  fig.querySelector('.demo-body').after(editors);
  ctl.fig = fig;
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
  const edSh = codeEditor({ title: 'vertexShader resultante', lang: 'glsl', value: '', height: 540, readOnly: true });
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
