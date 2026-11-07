import { h, md, P, UL, callout, codeBlock, liveCode, controlPanel, demo, table, eq, figure } from '../ui.js';
import { canvas2d } from '../stage.js';

/* ---------- Explorador de swizzling (solo DOM) ---------- */
function swizzleExplorer() {
  const state = { n: 4, vals: [1.0, 0.5, 0.25, 0.0], expr: 'v.zyx' };
  const SETS = ['xyzw', 'rgba', 'stpq'];

  const input = h('input', { class: 'code-input', type: 'text', value: state.expr, spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off', 'aria-label': 'Expresión de swizzle, por ejemplo v.zyx' });
  const out = h('div', { class: 'readout', style: { minHeight: '120px' } });

  const evaluate = () => {
    const src = input.value.trim();
    const m = /^v\.([a-z]+)$/.exec(src);
    const names = ['x', 'y', 'z', 'w'].slice(0, state.n);
    const vecName = `vec${state.n}`;
    const head = `v = ${vecName}(${state.vals.slice(0, state.n).map((x) => x.toFixed(2)).join(', ')})\n\n`;
    if (!m) return head + 'Escribe algo como  v.xy   v.zyx   v.xxyy   v.rg   v.x';
    const letters = m[1].split('');
    if (letters.length > 4) return head + 'ERROR: un swizzle tiene como mucho 4 letras.';
    const setIdx = SETS.findIndex((s) => s.includes(letters[0]));
    if (setIdx < 0) return head + `ERROR: «${letters[0]}» no es un componente. Usa x y z w · r g b a · s t p q.`;
    if (!letters.every((l) => SETS[setIdx].includes(l))) return head + 'ERROR: no puedes mezclar juegos de letras\n(xyzw con rgba, por ejemplo) en un mismo swizzle.';
    const idx = letters.map((l) => SETS[setIdx].indexOf(l));
    const bad = idx.find((i) => i >= state.n);
    if (bad !== undefined) return head + `ERROR: «${SETS[setIdx][bad]}» no existe en un ${vecName}.\nSolo tiene: ${names.join(', ')}.`;
    const res = idx.map((i) => state.vals[i]);
    const type = res.length === 1 ? 'float' : `vec${res.length}`;
    const value = res.length === 1 ? res[0].toFixed(2) : `${type}(${res.map((x) => x.toFixed(2)).join(', ')})`;
    return head + `${src}\n  → tipo:  ${type}\n  → valor: ${value}`;
  };
  const refresh = () => { out.textContent = evaluate(); };
  input.addEventListener('input', refresh);

  const sliders = controlPanel([
    { type: 'select', id: 'n', label: 'Tipo de v', options: [['2', 'vec2'], ['3', 'vec3'], ['4', 'vec4']], value: '4', onInput: (v) => { state.n = +v; refresh(); } },
    ...['x', 'y', 'z', 'w'].map((nm, i) => ({ type: 'range', id: nm, label: `v.${nm}`, min: 0, max: 1, step: 0.05, value: state.vals[i], onInput: (v) => { state.vals[i] = v; refresh(); } })),
  ]);

  const presets = h('div', { class: 'btn-row', style: { margin: '8px 0' } },
    ['v.xy', 'v.zyx', 'v.xxyy', 'v.rgb', 'v.x', 'v.w', 'v.xw', 'v.xr'].map((p) =>
      h('button', { class: 'btn', onClick: () => { input.value = p; refresh(); } }, p)));

  refresh();
  return h('figure', { class: 'demo wide' },
    h('div', { class: 'demo-head' }, h('span', { class: 'demo-title' }, 'Explorador de swizzling'), h('span', { class: 'demo-badge' }, 'interactivo')),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', padding: '16px' } },
      h('div', {}, sliders.el),
      h('div', {}, h('div', { class: 'ctl-note' }, 'Escribe una expresión (empieza por «v.»):'), input, presets, out)),
    h('figcaption', { html: md('Prueba los errores a propósito: pide `v.z` con un vec2, o mezcla `v.xr`. Los mensajes imitan lo que te diría el compilador de la GPU.') }));
}

/* ---------- Funciones de GLSL en una gráfica ---------- */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const FUNCS = {
  identidad: { label: 'x (sin función)', f: () => (x) => x, code: () => 'x' },
  step: { label: 'step(a, x)', f: ({ a }) => (x) => (x < a ? 0 : 1), code: ({ a }) => `step(${a.toFixed(2)}, x)` },
  smoothstep: {
    label: 'smoothstep(a, b, x)',
    f: ({ a, b }) => (x) => { const t = clamp01((x - a) / ((b - a) || 1e-6)); return t * t * (3 - 2 * t); },
    code: ({ a, b }) => `smoothstep(${a.toFixed(2)}, ${b.toFixed(2)}, x)`,
  },
  mix: { label: 'mix(a, b, x)', f: ({ a, b }) => (x) => a * (1 - x) + b * x, code: ({ a, b }) => `mix(${a.toFixed(2)}, ${b.toFixed(2)}, x)` },
  fract: { label: 'fract(x * n)', f: ({ n }) => (x) => { const v = x * n; return v - Math.floor(v); }, code: ({ n }) => `fract(x * ${n.toFixed(0)}.0)` },
  sin: { label: 'sin(x * n) * 0.5 + 0.5', f: ({ n }) => (x) => Math.sin(x * n) * 0.5 + 0.5, code: ({ n }) => `sin(x * ${n.toFixed(0)}.0) * 0.5 + 0.5` },
  abs: { label: 'abs(x - a)', f: ({ a }) => (x) => Math.abs(x - a), code: ({ a }) => `abs(x - ${a.toFixed(2)})` },
  pow: { label: 'pow(x, n)', f: ({ n }) => (x) => Math.pow(x, n / 4), code: ({ n }) => `pow(x, ${(n / 4).toFixed(2)})` },
};

function functionGraph() {
  return demo({
    title: 'Funciones de GLSL en una gráfica',
    aspect: '4 / 3',
    caption: 'La franja de abajo es **exactamente lo que pintaría un fragment shader** con `gl_FragColor = vec4(vec3(valor), 1.0);` donde `x` es `vUv.x`: 0 = negro, 1 = blanco.',
    setup({ stageEl, panel }) {
      const st = { fn: 'smoothstep', a: 0.3, b: 0.7, n: 8, hx: null };
      let ui;
      const code = liveCode({ title: 'fragment.glsl (lo que equivale)', lang: 'glsl' });

      const draw = (ctx, w, hgt) => {
        const m = { l: 44, r: 18, t: 18, b: 78 };
        const gw = w - m.l - m.r, gh = hgt - m.t - m.b;
        const yMin = -0.15, yMax = 1.15;
        const X = (x) => m.l + x * gw;
        const Y = (y) => m.t + (1 - (y - yMin) / (yMax - yMin)) * gh;
        const fn = FUNCS[st.fn].f(st);

        ctx.fillStyle = '#181b22'; ctx.fillRect(m.l, m.t, gw, gh);
        ctx.strokeStyle = '#2f3542'; ctx.lineWidth = 1; ctx.font = '11.5px ui-monospace, monospace'; ctx.fillStyle = '#8b94a8';
        ctx.textAlign = 'right';
        [0, 0.5, 1].forEach((v) => { ctx.beginPath(); ctx.moveTo(m.l, Y(v)); ctx.lineTo(m.l + gw, Y(v)); ctx.stroke(); ctx.fillText(v.toFixed(1), m.l - 8, Y(v) + 4); });
        ctx.textAlign = 'center';
        [0, 0.5, 1].forEach((v) => { ctx.beginPath(); ctx.moveTo(X(v), m.t); ctx.lineTo(X(v), m.t + gh); ctx.stroke(); ctx.fillText(`x=${v}`, X(v), m.t + gh + 15); });

        ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t, gw, gh); ctx.clip();
        ctx.strokeStyle = '#a58bff'; ctx.lineWidth = 3; ctx.beginPath();
        const S = 240;
        for (let i = 0; i <= S; i++) { const x = i / S; const y = fn(x); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); }
        ctx.stroke(); ctx.restore();

        const sy = m.t + gh + 30, sh = 26;
        for (let px = 0; px < gw; px++) {
          const v = Math.round(clamp01(fn(px / gw)) * 255);
          ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(m.l + px, sy, 1.5, sh);
        }
        ctx.strokeStyle = '#4a5266'; ctx.strokeRect(m.l, sy, gw, sh);
        ctx.fillStyle = '#8b94a8'; ctx.textAlign = 'left'; ctx.fillText('lo que se vería en pantalla', m.l, sy + sh + 16);

        if (st.hx !== null) {
          const v = fn(st.hx);
          ctx.strokeStyle = '#ffc857'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(st.hx), m.t); ctx.lineTo(X(st.hx), sy + sh); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#ffc857'; ctx.beginPath(); ctx.arc(X(st.hx), Y(v), 5, 0, Math.PI * 2); ctx.fill();
          ui?.readout('info', `x = ${st.hx.toFixed(2)}\nvalor = ${v.toFixed(3)}\n→ gris ${Math.round(clamp01(v) * 255)} de 255`);
        }
      };
      const api = canvas2d(stageEl, draw);
      api.canvas.style.cursor = 'crosshair';
      api.canvas.style.touchAction = 'pan-y';
      const coarse = window.matchMedia?.('(pointer: coarse)').matches;
      const hint = coarse ? 'Toca o desliza el dedo sobre la gráfica.' : 'Mueve el cursor sobre la gráfica.';
      const hover = (e) => {
        const r = api.canvas.getBoundingClientRect();
        const x = (e.clientX - r.left - 44) / (r.width - 44 - 18);
        st.hx = x >= 0 && x <= 1 ? x : null;
        if (st.hx === null) ui?.readout('info', hint);
        api.redraw();
      };
      api.canvas.addEventListener('pointermove', hover);
      api.canvas.addEventListener('pointerdown', hover);
      api.canvas.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse') return; st.hx = null; ui?.readout('info', hint); api.redraw(); });

      const update = () => {
        code.set(`
void main()
{
    float x = vUv.x;
    float value = ${FUNCS[st.fn].code(st)};

    gl_FragColor = vec4(vec3(value), 1.0);
}`);
        api.redraw();
      };
      ui = panel([
        { type: 'select', id: 'fn', label: 'Función', options: Object.entries(FUNCS).map(([k, v]) => [k, v.label]), value: st.fn, onInput: (v) => { st.fn = v; if (ui) update(); } },
        { type: 'range', id: 'a', label: 'a', min: 0, max: 1, step: 0.01, value: st.a, onInput: (v) => { st.a = v; if (ui) update(); } },
        { type: 'range', id: 'b', label: 'b', min: 0, max: 1, step: 0.01, value: st.b, onInput: (v) => { st.b = v; if (ui) update(); } },
        { type: 'range', id: 'n', label: 'n', min: 1, max: 24, step: 1, value: st.n, onInput: (v) => { st.n = v; if (ui) update(); } },
        { type: 'note', html: '`a` y `b` los usan step, smoothstep, mix y abs. `n` lo usan fract, sin y pow.' },
        { type: 'readout', id: 'info', text: hint },
      ]);
      ui.el.append(code.el);
      update();
    },
  });
}

const COMPILE_SVG = `
<svg viewBox="0 0 760 210" role="img" aria-label="El shader viaja como texto desde JavaScript y la GPU lo compila">
  <defs><marker id="gA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#97a0b4"/></marker></defs>
  <rect x="10" y="40" width="190" height="96" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="105" y="72" text-anchor="middle" fill="#fff" font-size="15" font-weight="650">main.js</text>
  <text x="105" y="96" text-anchor="middle" fill="#97a0b4" font-size="12.5">lo ejecuta la CPU</text>
  <text x="105" y="120" text-anchor="middle" fill="#a493ff" font-size="12" font-family="JetBrains Mono, monospace">\`void main() {…}\`</text>
  <path d="M204 88 H286" stroke="#97a0b4" stroke-width="2.2" marker-end="url(#gA)"/>
  <text x="245" y="78" text-anchor="middle" fill="#97a0b4" font-size="12">texto</text>
  <rect x="292" y="40" width="190" height="96" rx="12" fill="#a493ff1c" stroke="#a493ff"/>
  <text x="387" y="72" text-anchor="middle" fill="#a493ff" font-size="15" font-weight="650">GPU: compila</text>
  <text x="387" y="96" text-anchor="middle" fill="#c9cedb" font-size="12.5">al cargar la página</text>
  <text x="387" y="118" text-anchor="middle" fill="#c9cedb" font-size="12.5">revisa tipos y ;</text>
  <path d="M486 70 L566 44" stroke="#4ade80" stroke-width="2.2" marker-end="url(#gA)"/>
  <path d="M486 106 L566 150" stroke="#f87171" stroke-width="2.2" marker-end="url(#gA)"/>
  <rect x="572" y="14" width="178" height="58" rx="12" fill="#4ade801a" stroke="#4ade80"/>
  <text x="661" y="40" text-anchor="middle" fill="#4ade80" font-size="14" font-weight="650">✔ píxeles</text>
  <text x="661" y="60" text-anchor="middle" fill="#97a0b4" font-size="12">miles de veces a la vez</text>
  <rect x="572" y="120" width="178" height="62" rx="12" fill="#f871711a" stroke="#f87171"/>
  <text x="661" y="146" text-anchor="middle" fill="#f87171" font-size="14" font-weight="650">✘ error</text>
  <text x="661" y="166" text-anchor="middle" fill="#97a0b4" font-size="12">en la consola, con la línea</text>
</svg>`;

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'GLSL: un idioma estricto',
      body: () => [
        figure(h('div', { html: COMPILE_SVG })),
        P('Tu JavaScript lo ejecuta el navegador; los shaders los ejecuta la **tarjeta gráfica**. Se escriben como **texto** que Three.js manda a la GPU para que lo **compile**.'),
        P('Las reglas, en corto:'),
        UL([
          'Cada instrucción acaba en **`;`**.',
          'Todo lleva su **tipo** (`float`, `vec3`…): no existe `let`.',
          'Siempre hay un **`void main()`**: lo que ejecuta la GPU, una vez por vértice o por píxel.',
          'Los decimales **siempre con punto**: `1.0`, no `1`.',
          'No hay `console.log`: para «ver» un valor, lo pintas como color.',
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Escribes un error en un shader. ¿Dónde lo ves?',
        options: ['En tu editor, subrayado en rojo', 'En la consola del navegador, cuando la GPU intenta compilarlo', 'En ningún sitio: GLSL no da errores'],
        answer: 1,
        why: 'El shader es texto hasta que la GPU lo compila al cargar la página. El error aparece entonces, en la consola, con el número de línea.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'La regla del punto decimal',
      body: () => [
        P('GLSL **no convierte** entre `int` y `float` por ti. Es el error de compilación más común del curso:'),
        codeBlock({
          title: 'tipos.glsl',
          lang: 'glsl',
          code: `
float a = 1.0;        // ✔ correcto
float b = 1;          // ✘ ERROR: 1 es un int
float c = a * 2;      // ✘ ERROR: float * int
float d = a * 2.0;    // ✔ correcto
int e = 3;
float f = float(e);   // ✔ conversión explícita`,
          notes: [
            ['float b', '`1` sin punto es un `int`: no cabe directamente en un `float`.'],
            ['float c', 'Mezclar float con int tampoco. Escribe siempre `2.0`.'],
            ['float f', 'Si de verdad tienes un int, conviértelo con `float(e)`.'],
          ],
        }),
        callout('warn', 'Error típico', [P("`cannot convert from 'const int' to 'highp float'` = busca un número **sin punto**.")]),
      ],
      more: () => [
        table(['Tipo', 'Qué guarda', 'Ejemplo'], [
          ['`float`', 'Un número con decimales', '`float strength = 0.5;`'],
          ['`int` / `bool`', 'Entero / verdadero-falso', '`int count = 3;`'],
          ['`vec2`', '2 floats (un uv…)', '`vec2 uv = vec2(0.25, 0.75);`'],
          ['`vec3`', '3 floats (posición, **color RGB**, normal…)', '`vec3 color = vec3(1.0, 0.5, 0.0);`'],
          ['`vec4`', '4 floats (posición con w, color con alfa)', '`vec4 c = vec4(1.0, 0.5, 0.0, 1.0);`'],
          ['`mat2/3/4`', 'Matrices cuadradas', '`mat2 m = mat2(1.0, 0.0, 0.0, 1.0);`'],
          ['`sampler2D`', 'Una textura que se puede leer', '`uniform sampler2D uTexture;`'],
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué falla en `float strength = 1;`?',
        options: ['Falta el `;`', 'El `1` es un `int` y no se convierte solo: debe ser `1.0`', 'No se puede usar `float` en un shader'],
        answer: 1,
        why: 'GLSL no hace conversiones implícitas. `1.0` o `float(1)`.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Vectores y swizzling',
      body: () => [
        swizzleExplorer(),
        P('Un `vec3` es un **paquete de 3 floats**: igual sirve para una posición (x, y, z) que para un color (r, g, b) — la GPU no sabe lo que significa. Con el punto puedes coger componentes en el orden que quieras y repetirlos: eso es el **swizzling**.'),
      ],
      more: () => [
        codeBlock({
          title: 'vectores.glsl',
          lang: 'glsl',
          code: `
vec3 position = vec3(1.0, 2.0, 3.0);
float a = position.x;              // 1.0

vec3 color = vec3(0.2, 0.6, 1.0);
float red = color.r;               // 0.2  (r = x)

vec3 gray = vec3(0.5);             // (0.5, 0.5, 0.5)
vec4 withAlpha = vec4(color, 1.0); // componer vectores
vec2 flat = position.xy;           // (1.0, 2.0)  ← swizzle`,
          notes: [
            ['color.r', '`xyzw`, `rgba` y `stpq` son **nombres distintos para los mismos huecos**: usa el juego que tenga sentido.'],
            ['vec3(0.5)', 'Un solo número se repite en todos los componentes: gris medio.'],
            ['vec4(color, 1.0)', 'Un `vec3` + un `float` componen un `vec4`.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Si `vec3 c = vec3(0.2, 0.6, 1.0);`, ¿qué vale `c.bg`?',
        options: ['`vec2(1.0, 0.6)`', '`vec2(0.6, 1.0)`', 'Es un error'],
        answer: 0,
        why: '`b` es el tercer componente (1.0) y `g` el segundo (0.6): el swizzle respeta el orden de tus letras. Compruébalo arriba con `v.bg`… o `v.zy`.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Operar con vectores',
      body: () => [
        P('Entre vectores del mismo tamaño, `+ − * /` van **componente a componente**. Un vector con un `float` aplica el número a todos:'),
        eq(`vec3(1.0, 2.0, 3.0) + vec3(10.0, 20.0, 30.0)  =  vec3(11.0, 22.0, 33.0)
vec3(1.0, 2.0, 3.0) * vec3(2.0, 2.0, 0.5)    =  vec3(2.0, 4.0, 1.5)
vec3(1.0, 2.0, 3.0) * 2.0                    =  vec3(2.0, 4.0, 6.0)`),
        callout('remember', 'Excepción importante', [P('Con **matrices** el `*` no es componente a componente: `mat2 * vec2` es multiplicación de matrices (rota un punto, por ejemplo). Lo verás con números en la lección de matrices.')]),
      ],
      more: () => [
        P('También puedes crear tus propias funciones — tipo devuelto, nombre y parámetros tipados, definidas **antes** de usarse:'),
        codeBlock({
          title: 'funciones.glsl',
          lang: 'glsl',
          code: `
float remap(float value, float inMin, float inMax)
{
    return (value - inMin) / (inMax - inMin);
}

void main()
{
    float t = remap(5.0, 0.0, 10.0);   // 0.5
    gl_FragColor = vec4(vec3(t), 1.0);
}`,
          notes: [
            ['float remap', 'Convierte un valor de un rango a 0…1. 5 está en la mitad de 0..10 → 0.5.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '`vec3(1.0, 2.0, 3.0) * 2.0` es…',
        options: ['`vec3(2.0, 4.0, 6.0)`', '`12.0`', 'Un error de tipos'],
        answer: 0,
        why: 'Un vector por un float multiplica cada componente.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'Las funciones que usarás siempre',
      body: () => [
        functionGraph(),
        P('Con `mix`, `step`, `smoothstep`, `fract` y `sin` se construye casi cualquier patrón. `mix(a, b, t)` es la estrella: con `t = 0` da `a`, con `t = 1` da `b`, y entre medias, mezcla — vale para números **y colores**:'),
        eq(`mix(vec3(1,0,0), vec3(0,0,1), 0.0)  = rojo
mix(vec3(1,0,0), vec3(0,0,1), 0.5)  = morado
mix(vec3(1,0,0), vec3(0,0,1), 1.0)  = azul`),
      ],
      more: () => [
        table(['Función', 'Qué hace', 'Con números'], [
          ['`sin(x)` `cos(x)`', 'Onda suave entre −1 y 1', '`sin(1.5708)` ≈ 1'],
          ['`abs(x)`', 'Quita el signo', '`abs(-0.3)` = 0.3'],
          ['`floor(x)` `fract(x)`', 'Parte entera / decimal', '`fract(2.7)` = 0.7'],
          ['`clamp(x, lo, hi)`', 'Limita x al rango', '`clamp(1.4, 0.0, 1.0)` = 1.0'],
          ['`mix(a, b, t)`', 'Mezcla: `a·(1−t) + b·t`', '`mix(0.0, 10.0, 0.25)` = 2.5'],
          ['`step(edge, x)`', '0 si x < edge, 1 si no', '`step(0.5, 0.8)` = 1'],
          ['`smoothstep(e0, e1, x)`', 'De 0 a 1, suave, entre e0 y e1', '`smoothstep(0.0, 1.0, 0.5)` = 0.5'],
          ['`length(v)` / `distance(a, b)`', 'Longitud / distancia', '`length(vec2(3.0, 4.0))` = 5.0'],
          ['`dot(a, b)`', 'Cuánto «apuntan» igual', '`dot(vec3(1,0,0), vec3(1,0,0))` = 1'],
          ['`normalize(v)`', 'Mismo sentido, longitud 1', '`normalize(vec2(3.0, 4.0))` = (0.6, 0.8)'],
          ['`pow(x, n)`', 'x elevado a n', '`pow(0.5, 2.0)` = 0.25'],
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Cuánto vale `mix(2.0, 10.0, 0.25)`?',
        options: ['2.5', '4.0', '8.0'],
        answer: 1,
        why: '2·(1 − 0.25) + 10·0.25 = 1.5 + 2.5 = 4.0: el 25 % del camino entre 2 y 10.',
      },
    },

    /* 6 ------------------------------------------------------------------ */
    {
      t: 'Sin «if» y sin console.log',
      body: () => [
        P('`if` y `for` existen, pero la GPU quiere que sus miles de «ayudantes» hagan **todos lo mismo**: las bifurcaciones la frenan. En shaders, las condiciones se sustituyen por matemáticas:'),
        codeBlock({
          title: 'sin-if.glsl',
          lang: 'glsl',
          code: `
// Con if (más lento, más largo):
float value;
if (x > 0.5) { value = 1.0; } else { value = 0.0; }

// Sin if (lo habitual):
float value = step(0.5, x);`,
          notes: [
            ['step(0.5', '`step` hace lo mismo sin ramas: 1.0 si x ≥ 0.5, 0.0 si no.'],
          ],
        }),
        P('Y para depurar, **pinta el valor**: un `float` 0…1 → `gl_FragColor = vec4(vec3(value), 1.0)` y lo ves como gris; un `vec2` como el uv → `vec4(uv, 0.0, 1.0)`: rojo = x, verde = y.'),
      ],
      check: {
        type: 'fill',
        q: '0 a la izquierda de x = 0.5 y 1 a la derecha, sin `if`:',
        pre: 'float value = ', post: '(0.5, x);',
        answer: 'step',
        accept: ['step'],
        placeholder: 'función',
        size: 12,
        why: '`step(edge, x)` devuelve 0 mientras x < edge y 1 cuando x ≥ edge: un corte duro. Para un borde suave, `smoothstep`.',
      },
    },
  ];
}
