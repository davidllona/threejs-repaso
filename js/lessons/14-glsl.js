import { h, md, P, H2, H3, UL, callout, codeBlock, liveCode, controlPanel, demo, table, quiz, eq } from '../ui.js';
import { canvas2d } from '../stage.js';

/* ---------- Explorador de swizzling (solo DOM) ---------- */
function swizzleExplorer() {
  const state = { n: 4, vals: [1.0, 0.5, 0.25, 0.0], expr: 'v.zyx' };
  const SETS = ['xyzw', 'rgba', 'stpq'];

  const input = h('input', {
    type: 'text', value: state.expr, spellcheck: 'false',
    style: { width: '100%', font: '600 15px ui-monospace, monospace', padding: '8px 10px', background: '#0d0f13', color: '#e4e7ee', border: '1px solid #3a4152', borderRadius: '8px' },
  });
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
    caption: 'La gráfica muestra qué valor devuelve la función para cada `x` entre 0 y 1. La franja de abajo es **exactamente lo que pintaría un fragment shader** con `gl_FragColor = vec4(vec3(valor), 1.0);` donde `x` es la coordenada horizontal (`vUv.x`): 0 = negro, 1 = blanco.',
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

        // franja de color resultante
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
      const hover = (e) => {
        const r = api.canvas.getBoundingClientRect();
        const x = (e.clientX - r.left - 44) / (r.width - 44 - 18);
        st.hx = x >= 0 && x <= 1 ? x : null;
        if (st.hx === null) ui?.readout('info', 'Mueve el cursor sobre la gráfica.');
        api.redraw();
      };
      api.canvas.addEventListener('pointermove', hover);
      api.canvas.addEventListener('pointerleave', () => { st.hx = null; ui?.readout('info', 'Mueve el cursor sobre la gráfica.'); api.redraw(); });

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
        { type: 'readout', id: 'info', text: 'Mueve el cursor sobre la gráfica.' },
      ]);
      ui.el.append(code.el);
      update();
    },
  });
}

export default function render(root) {
  root.append(
    P('**GLSL** (OpenGL Shading Language) es el lenguaje en el que se escriben los shaders. No te asustes: se parece mucho a JavaScript/C, tiene pocas reglas y las que tiene son muy estrictas. En esta lección aprendes todo lo necesario para leer y escribir los shaders del curso.'),

    callout('analogy', 'Un idioma que habla la GPU', [
      P('Tu JavaScript lo ejecuta el navegador. Los shaders los ejecuta la **tarjeta gráfica**, que habla otro idioma. Por eso se escriben aparte (en un *string* de texto que Three.js manda a la GPU para que lo **compile**). Si hay un error, no lo verás en tu editor: lo verás en la consola del navegador cuando se intente compilar.'),
    ]),

    H2('Reglas básicas'),
    UL([
      'Cada instrucción acaba en **`;`**. Si te lo olvidas, no compila.',
      'Todo tiene un **tipo** y hay que escribirlo siempre (`float`, `vec3`…). No existe `let` ni `const x =`.',
      'Siempre hay una función **`void main()`**: es el punto de entrada, lo que ejecuta la GPU (una vez por vértice o por píxel, según el shader).',
      'Los números decimales **deben llevar el punto**: `1.0`, no `1`. Esta es la regla que más errores causa (siguiente sección).',
      'No hay `console.log`. Para «ver» un valor, lo conviertes en **color** (truco de depuración).',
      'Los comentarios son iguales que en JS: `//` y `/* */`.',
    ]),

    H2('Tipos de datos'),
    table(['Tipo', 'Qué guarda', 'Ejemplo'], [
      ['`float`', 'Un número con decimales', '`float strength = 0.5;`'],
      ['`int`', 'Un entero', '`int count = 3;`'],
      ['`bool`', 'Verdadero o falso', '`bool visible = true;`'],
      ['`vec2`', '2 floats (una posición 2D, un uv…)', '`vec2 uv = vec2(0.25, 0.75);`'],
      ['`vec3`', '3 floats (una posición 3D, un **color RGB**, una normal…)', '`vec3 color = vec3(1.0, 0.5, 0.0);`'],
      ['`vec4`', '4 floats (posición con w, color con alfa…)', '`vec4 c = vec4(1.0, 0.5, 0.0, 1.0);`'],
      ['`mat2`, `mat3`, `mat4`', 'Matrices (cuadradas) de 2×2, 3×3, 4×4', '`mat2 m = mat2(1.0, 0.0, 0.0, 1.0);`'],
      ['`sampler2D`', 'Una textura que se puede «muestrear» (leer)', '`uniform sampler2D uTexture;`'],
    ]),

    H3('La regla del punto decimal'),
    P('GLSL **no convierte** entre `int` y `float` por ti. Mezclarlos es un error de compilación:'),
    codeBlock({
      title: 'tipos.glsl',
      lang: 'glsl',
      code: `
float a = 1.0;        // ✔ correcto
float b = 1;          // ✘ ERROR: 1 es un int
float c = a * 2;      // ✘ ERROR: float * int
float d = a * 2.0;    // ✔ correcto
int e = 3;
float f = float(e);   // ✔ conversión explícita con float(...)`,
      notes: [
        ['float a', 'El `.0` hace que el número sea un `float`.'],
        ['float b', '`1` sin punto es un `int`. No puedes guardarlo directamente en un `float`.'],
        ['float c', 'Un `float` multiplicado por un `int` tampoco está permitido. Escribe siempre `2.0`.'],
        ['float f', 'Si de verdad tienes un `int`, conviértelo con `float(e)`.'],
      ],
    }),
    callout('warn', 'Error típico', [P("Si el compilador te dice algo como `cannot convert from 'const int' to 'highp float'`, busca un número **sin punto**. En los shaders del curso verás siempre `0.0`, `1.0`, `2.0`.")]),

    H2('Vectores: la estrella de GLSL'),
    P('Un `vec3` es **un paquete de 3 floats**. Sirve igual para una posición (x, y, z) que para un color (r, g, b): la GPU no sabe lo que significa, tú decides. Se crean con un *constructor* y se acceden por letras:'),
    codeBlock({
      title: 'vectores.glsl',
      lang: 'glsl',
      code: `
vec3 position = vec3(1.0, 2.0, 3.0);

float a = position.x;        // 1.0
float b = position.y;        // 2.0

vec3 color = vec3(0.2, 0.6, 1.0);
float red = color.r;         // 0.2  (r = x)

vec3 gray = vec3(0.5);       // (0.5, 0.5, 0.5): un solo valor se repite
vec4 withAlpha = vec4(color, 1.0);   // (0.2, 0.6, 1.0, 1.0)
vec2 flat = position.xy;     // (1.0, 2.0)  ← swizzle`,
      notes: [
        ['vec3 position', 'Constructor con tres números: x = 1, y = 2, z = 3.'],
        ['position.x', 'Se accede a cada componente con un punto y una letra.'],
        ['color.r', '`x y z w`, `r g b a` y `s t p q` son **nombres distintos para los mismos huecos**: usa el juego que tenga sentido (xyz para posiciones, rgb para colores, st para texturas).'],
        ['vec3(0.5)', 'Si le das un solo número, lo repite en todos los componentes. Muy cómodo para grises: `vec3(0.5)` = gris medio.'],
        ['vec4(color, 1.0)', 'Puedes **componer** vectores: un `vec3` más un `float` forman un `vec4`.'],
        ['position.xy', '**Swizzling**: coger varios componentes a la vez y formar un vector nuevo. ¡Lo vas a ver en todos los shaders!'],
      ],
    }),

    H3('Swizzling: reordenar y repetir componentes'),
    P('Con el punto puedes escribir **varias letras**, en el orden que quieras y repitiendo las que quieras. El resultado es un vector del tamaño de las letras que hayas puesto:'),
    eq(`vec4 v = vec4(1.0, 0.5, 0.25, 0.0);\n\nv.xy    → vec2(1.0, 0.5)\nv.zyx   → vec3(0.25, 0.5, 1.0)      (dado la vuelta)\nv.xxyy  → vec4(1.0, 1.0, 0.5, 0.5)  (repetidos)\nv.w     → 0.0                       (float)`),
    swizzleExplorer(),

    H3('Aritmética con vectores'),
    P('Las operaciones `+ − * /` entre vectores del mismo tamaño se hacen **componente a componente**. Y un vector con un `float` aplica el número a todos los componentes:'),
    eq(`vec3(1.0, 2.0, 3.0) + vec3(10.0, 20.0, 30.0)  =  vec3(11.0, 22.0, 33.0)\nvec3(1.0, 2.0, 3.0) * vec3(2.0, 2.0, 0.5)    =  vec3(2.0, 4.0, 1.5)\nvec3(1.0, 2.0, 3.0) * 2.0                    =  vec3(2.0, 4.0, 6.0)`),
    callout('remember', 'Excepción importante', [P('Con **matrices** el `*` no es componente a componente: es una multiplicación de matrices (`mat2 * vec2` rota un punto, por ejemplo). Eso lo verás con números en la lección de matrices.')]),

    H2('Funciones propias'),
    P('Puedes crear tus propias funciones. Se declara el tipo que devuelve, el nombre y los parámetros **con su tipo**. Deben estar **definidas antes** de usarse:'),
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
        ['float remap', 'Tipo devuelto (`float`), nombre y parámetros tipados. Convierte un valor de un rango a otro de 0 a 1.'],
        ['return', 'Devuelve el resultado, como en JS.'],
        ['void main', '`main` es especial: no devuelve nada (`void`). Su «resultado» lo escribe en variables especiales como `gl_FragColor`.'],
        ['remap(5.0', 'Llamada a la función. 5 está en la mitad de 0..10 → 0.5.'],
      ],
    }),

    H2('Funciones que vienen incluidas'),
    P('GLSL trae muchas funciones matemáticas. Estas son las que usarás el 95 % del tiempo (todas funcionan también con vectores, componente a componente):'),
    table(['Función', 'Qué hace', 'Ejemplo con números'], [
      ['`sin(x)` `cos(x)`', 'Onda suave entre −1 y 1', '`sin(0.0)` = 0 · `sin(1.5708)` ≈ 1'],
      ['`abs(x)`', 'Quita el signo', '`abs(-0.3)` = 0.3'],
      ['`floor(x)` `fract(x)`', 'Parte entera / parte decimal', '`floor(2.7)` = 2 · `fract(2.7)` = 0.7'],
      ['`min(a, b)` `max(a, b)`', 'El menor / el mayor', '`max(0.2, 0.9)` = 0.9'],
      ['`clamp(x, lo, hi)`', 'Limita x al rango', '`clamp(1.4, 0.0, 1.0)` = 1.0'],
      ['`mix(a, b, t)`', 'Mezcla de a a b: `a·(1−t) + b·t`', '`mix(0.0, 10.0, 0.25)` = 2.5'],
      ['`step(edge, x)`', '0 si x < edge, 1 si no (un corte duro)', '`step(0.5, 0.3)` = 0 · `step(0.5, 0.8)` = 1'],
      ['`smoothstep(e0, e1, x)`', 'Transición suave de 0 a 1 entre e0 y e1', '`smoothstep(0.0, 1.0, 0.5)` = 0.5'],
      ['`length(v)`', 'Longitud del vector', '`length(vec2(3.0, 4.0))` = 5.0'],
      ['`distance(a, b)`', 'Distancia entre dos puntos', '`distance(vec2(0.0), vec2(3.0, 4.0))` = 5.0'],
      ['`dot(a, b)`', 'Producto escalar (cuánto «apuntan» igual)', '`dot(vec3(1,0,0), vec3(1,0,0))` = 1'],
      ['`normalize(v)`', 'Mismo sentido pero longitud 1', '`normalize(vec2(3.0, 4.0))` = (0.6, 0.8)'],
      ['`pow(x, n)`', 'x elevado a n', '`pow(0.5, 2.0)` = 0.25'],
    ]),

    H3('`mix`: la función que más vas a usar'),
    P('`mix(a, b, t)` es una mezcla. Con `t = 0` te da `a`; con `t = 1` te da `b`; con `t = 0.25`, un 75 % de `a` y un 25 % de `b`. Sirve para números **y para colores**:'),
    eq(`mix(vec3(1,0,0), vec3(0,0,1), 0.0)  = vec3(1.0, 0.0, 0.0)   rojo\nmix(vec3(1,0,0), vec3(0,0,1), 0.5)  = vec3(0.5, 0.0, 0.5)   morado\nmix(vec3(1,0,0), vec3(0,0,1), 1.0)  = vec3(0.0, 0.0, 1.0)   azul`),
    P('Y su compañero habitual es `step`/`smoothstep`: te dan un `t` que **cambia de golpe o suavemente** según un valor. Combínalos y puedes pintar cualquier cosa. Pruébalo aquí:'),
    functionGraph(),

    H2('`if` y bucles: con cuidado'),
    P('Existen (`if`, `else`, `for`), pero la GPU ejecuta miles de «ayudantes» a la vez y le encanta que **todos hagan lo mismo**. Un `if` puede hacer que unos hagan una cosa y otros otra, y eso la ralentiza. Por eso en shaders se prefiere sustituir condiciones por matemáticas:'),
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
        ['if (x', 'Funciona, pero mete bifurcaciones en el código de la GPU.'],
        ['step(0.5', '`step` hace lo mismo sin ramas: devuelve 1.0 si x ≥ 0.5 y 0.0 si no.'],
      ],
    }),

    H2('Cómo «depurar» sin console.log'),
    P('Si quieres saber cuánto vale algo, **píntalo**. Si `value` es un `float` entre 0 y 1, haz `gl_FragColor = vec4(vec3(value), 1.0);` y lo verás como un gris. Si es un `vec2` (como el `uv`), haz `vec4(uv, 0.0, 1.0)`: rojo = x, verde = y. Esto lo practicarás en el laboratorio de shaders.'),

    callout('idea', 'Resumen de la lección', [
      UL([
        'GLSL es estricto: tipos obligatorios, `;`, y números decimales **siempre con punto**.',
        '`vec2/3/4` guardan varios floats; accedes con `.xyz`, `.rgb`, `.st` y puedes reordenar (swizzling).',
        'Operaciones entre vectores = componente a componente.',
        'Con `mix`, `step`, `smoothstep`, `fract`, `sin`… construyes casi cualquier patrón sin `if`.',
        'No hay `console.log`: depura convirtiendo valores en colores.',
      ]),
    ]),

    quiz([
      {
        q: '¿Qué falla en `float strength = 1;`?',
        options: ['Falta el `;`', 'El `1` es un `int` y no se convierte solo en `float`: debe ser `1.0`', 'No se puede usar `float` en un shader', 'La variable debería llamarse `uStrength`'],
        answer: 1,
        why: 'GLSL no hace conversiones implícitas de int a float. Hay que escribir `1.0` o `float(1)`.',
      },
      {
        q: 'Si `vec3 c = vec3(0.2, 0.6, 1.0);`, ¿qué vale `c.bg`?',
        options: ['`vec2(1.0, 0.6)`', '`vec2(0.6, 1.0)`', '`vec3(1.0, 0.6, 0.2)`', 'Es un error'],
        answer: 0,
        why: 'b es el tercer componente (1.0) y g el segundo (0.6). El swizzle respeta el orden en que escribes las letras.',
      },
      {
        q: '¿Cuánto vale `mix(2.0, 10.0, 0.25)`?',
        options: ['2.5', '4.0', '6.0', '8.0'],
        answer: 1,
        why: '2·(1 − 0.25) + 10·0.25 = 1.5 + 2.5 = 4.0. Es decir, el 25 % del camino entre 2 y 10.',
      },
      {
        q: 'Quieres un valor que sea 0 a la izquierda de x = 0.5 y 1 a la derecha, sin usar `if`. ¿Qué escribes?',
        options: ['`mix(0.0, 1.0, 0.5)`', '`step(0.5, x)`', '`fract(x)`', '`abs(x)`'],
        answer: 1,
        why: '`step(edge, x)` devuelve 0 mientras x < edge y 1 cuando x ≥ edge: un corte duro.',
      },
      {
        q: '`vec3(1.0, 2.0, 3.0) * 2.0` es…',
        options: ['`vec3(2.0, 4.0, 6.0)`', '`vec3(2.0, 2.0, 2.0)`', '`12.0`', 'Un error de tipos'],
        answer: 0,
        why: 'Multiplicar un vector por un float multiplica cada componente.',
      },
    ]),
  );
}
