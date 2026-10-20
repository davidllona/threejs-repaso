import { h, md, P, H2, H3, UL, OL, callout, codeBlock, codeEditor, demo, table, quiz, eq, figure } from '../ui.js';

/* ======================================================================
   Presets del laboratorio
   ====================================================================== */
const VERT = `varying vec2 vUv;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
}`;

const PRESETS = [
  {
    id: 'flat', name: '1 · Color plano',
    vertex: VERT,
    fragment: `uniform vec3 uColorA;

void main()
{
    gl_FragColor = vec4(uColorA, 1.0);
}`,
  },
  {
    id: 'uv', name: '2 · Las UV como color',
    vertex: VERT,
    fragment: `varying vec2 vUv;

void main()
{
    // x → rojo, y → verde
    gl_FragColor = vec4(vUv, 0.0, 1.0);
}`,
  },
  {
    id: 'gradient', name: '3 · Degradado con mix',
    vertex: VERT,
    fragment: `uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uA;
varying vec2 vUv;

void main()
{
    // t pasa de 0 a 1 en una franja alrededor de uA
    float t = smoothstep(uA - 0.25, uA + 0.25, vUv.x);
    vec3 color = mix(uColorA, uColorB, t);

    gl_FragColor = vec4(color, 1.0);
}`,
  },
  {
    id: 'strips', name: '4 · Franjas (mod + step)', def: true,
    vertex: VERT,
    fragment: `uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uA;
varying vec2 vUv;

void main()
{
    // se repite 10 veces de 0 a 1 en vertical
    float strength = mod(vUv.y * 10.0, 1.0);

    // corte duro: 0 antes de uA, 1 después
    strength = step(uA, strength);

    vec3 color = mix(uColorA, uColorB, strength);
    gl_FragColor = vec4(color, 1.0);
}`,
  },
  {
    id: 'checker', name: '5 · Tablero (floor + mod)',
    vertex: VERT,
    fragment: `uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec2 vUv;

void main()
{
    // cada casilla tiene un número entero (0..7, 0..7)
    vec2 cell = floor(vUv * 8.0);

    // suma par → 0, suma impar → 1
    float checker = mod(cell.x + cell.y, 2.0);

    vec3 color = mix(uColorA, uColorB, checker);
    gl_FragColor = vec4(color, 1.0);
}`,
  },
  {
    id: 'circle', name: '6 · Círculo (distance)',
    vertex: VERT,
    fragment: `uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uA;
varying vec2 vUv;

void main()
{
    float radius = uA * 0.5;
    float d = distance(vUv, vec2(0.5));

    // 1 dentro del círculo, 0 fuera (con un borde suave)
    float disc = 1.0 - smoothstep(radius - 0.01, radius + 0.01, d);

    vec3 color = mix(uColorB, uColorA, disc);
    gl_FragColor = vec4(color, 1.0);
}`,
  },
  {
    id: 'ripple', name: '7 · Ondas animadas (uTime)',
    vertex: VERT,
    fragment: `uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTime;
uniform float uB;
varying vec2 vUv;

void main()
{
    float d = distance(vUv, vec2(0.5));

    // sin() de la distancia: anillos. Restar uTime los hace viajar.
    float wave = sin(d * (10.0 + uB * 60.0) - uTime * 4.0) * 0.5 + 0.5;

    // se apaga hacia el borde
    wave *= 1.0 - smoothstep(0.0, 0.5, d);

    vec3 color = mix(uColorB, uColorA, wave);
    gl_FragColor = vec4(color, 1.0);
}`,
  },
  {
    id: 'waves', name: '8 · Olas con el vertex shader', cam: [0.4, -2.2, 1.9], colors: ['#ffc857', '#2b3a8f'],
    vertex: `uniform float uTime;
uniform float uA;
uniform float uB;
varying float vElevation;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    float frequency = 3.0 + uB * 12.0;

    float elevation = sin(modelPosition.x * frequency + uTime);
    elevation += sin(modelPosition.y * frequency * 0.7 - uTime * 1.3);
    elevation *= uA * 0.25;

    modelPosition.z += elevation;

    vec4 viewPosition = viewMatrix * modelPosition;
    gl_Position = projectionMatrix * viewPosition;

    vElevation = elevation;
}`,
    fragment: `uniform vec3 uColorA;
uniform vec3 uColorB;
varying float vElevation;

void main()
{
    float t = smoothstep(-0.25, 0.25, vElevation);
    vec3 color = mix(uColorB, uColorA, t);

    gl_FragColor = vec4(color, 1.0);
}`,
  },
  {
    id: 'blank', name: '9 · Hoja en blanco (tu turno)',
    vertex: VERT,
    fragment: `// Uniforms que puedes usar (quita el // para activarlos):
// uniform float uTime;
// uniform float uA;
// uniform float uB;
// uniform vec3 uColorA;
// uniform vec3 uColorB;
varying vec2 vUv;

void main()
{
    // Escribe aquí tu patrón
    gl_FragColor = vec4(vUv, 0.5, 1.0);
}`,
  },
];

/* Pequeñas ayudas en español para los errores más típicos del compilador */
function hint(msg) {
  if (/cannot convert from 'const int'|implicit conversion|'\*' : wrong operand types|wrong operand types/.test(msg)) return '→ ¿Un número sin punto decimal? Escribe 1.0 en vez de 1.';
  if (/undeclared identifier/.test(msg)) return '→ Variable no declarada: ¿falta el `uniform`/`varying`, o está mal escrita?';
  if (/syntax error/.test(msg)) return '→ Casi siempre falta un `;` o un paréntesis (en esta línea o en la anterior).';
  if (/No matching overloaded function|no matching overload/.test(msg)) return '→ Los tipos de los argumentos no encajan con la función (¿vec3 donde va float?).';
  if (/redefinition/.test(msg)) return '→ Esa variable ya existe; no la declares dos veces.';
  if (/dimension mismatch|cannot convert/.test(msg)) return '→ Los dos lados no tienen el mismo tipo o tamaño (vec3 frente a vec4, por ejemplo).';
  if (/[Vv]arying/.test(msg)) return '→ El varying debe declararse igual (mismo tipo y nombre) en vertex y fragment, y el vertex debe escribirlo.';
  return '';
}

/* ======================================================================
   Esquema de las UV
   ====================================================================== */
const UV_SVG = `
<svg viewBox="0 0 600 290" role="img" aria-label="Las coordenadas uv recorren el cuadrado de 0 a 1">
  <defs>
    <linearGradient id="gx" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#f00"/></linearGradient>
    <linearGradient id="gy" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#0f0"/></linearGradient>
  </defs>
  <rect x="70" y="30" width="200" height="200" fill="url(#gx)"/>
  <rect x="70" y="30" width="200" height="200" fill="url(#gy)" style="mix-blend-mode:screen"/>
  <rect x="70" y="30" width="200" height="200" fill="none" stroke="#97a0b4"/>
  <text x="66" y="248" text-anchor="end" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">(0, 0)</text>
  <text x="274" y="248" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">(1, 0)</text>
  <text x="66" y="42" text-anchor="end" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">(0, 1)</text>
  <text x="274" y="42" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">(1, 1)</text>
  <text x="170" y="272" text-anchor="middle" fill="#97a0b4" font-size="12.5">x crece hacia la derecha → rojo</text>
  <text x="14" y="130" fill="#97a0b4" font-size="12.5" transform="rotate(-90 14 130)" text-anchor="middle">y crece hacia arriba → verde</text>

  <circle cx="120" cy="80" r="6" fill="#fff" stroke="#000"/>
  <circle cx="250" cy="210" r="6" fill="#fff" stroke="#000"/>
  <text x="320" y="70" fill="#fff" font-size="14" font-weight="650">Píxel A</text>
  <text x="320" y="92" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">vUv = (0.25, 0.75)</text>
  <text x="320" y="112" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">color = vec4(0.25, 0.75, 0.0, 1.0)</text>
  <text x="320" y="132" fill="#97a0b4" font-size="12.5">poco rojo y mucho verde → verde</text>
  <text x="320" y="190" fill="#fff" font-size="14" font-weight="650">Píxel B</text>
  <text x="320" y="212" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">vUv = (0.90, 0.10)</text>
  <text x="320" y="232" fill="#c9cedb" font-size="13" font-family="JetBrains Mono, monospace">color = vec4(0.90, 0.10, 0.0, 1.0)</text>
  <text x="320" y="252" fill="#97a0b4" font-size="12.5">mucho rojo y casi nada de verde → rojo</text>
</svg>`;

/* ======================================================================
   El laboratorio
   ====================================================================== */
function labDemo() {
  const def = PRESETS.find((p) => p.def) || PRESETS[0];
  let schedule = () => {};
  const edV = codeEditor({ title: 'vertex.glsl', lang: 'glsl', value: def.vertex, height: 380, onInput: () => schedule() });
  const edF = codeEditor({ title: 'fragment.glsl', lang: 'glsl', value: def.fragment, height: 380, onInput: () => schedule() });
  const status = h('div', { class: 'lab-status' }, 'Se compilará al empezar la demo…');
  const editors = h('div', { class: 'lab-editors' }, edV.el, edF.el, status);

  const fig = demo({
    title: 'Laboratorio de shaders',
    aspect: '16 / 10',
    caption: 'Todo lo que escribes se compila **de verdad** en tu GPU medio segundo después de dejar de teclear. Si hay un error, ves el mensaje real del compilador con la línea marcada, y el dibujo conserva el último shader que funcionó.',
    setup({ makeStage, panel }) {
      const stage = makeStage({ pos: [0, 0, 2.6], target: [0, 0, 0], fov: 45 });
      const { THREE, renderer, scene, camera, controls } = stage;
      const makeGeo = {
        plane: () => new THREE.PlaneGeometry(2, 2, 64, 64),
        sphere: () => new THREE.SphereGeometry(0.95, 64, 64),
        torus: () => new THREE.TorusGeometry(0.6, 0.3, 64, 128),
      };
      const uniforms = {
        uTime: { value: 0 },
        uA: { value: 0.5 },
        uB: { value: 0.5 },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
      };
      const setColor = (u, hex) => {
        const n = parseInt(hex.slice(1), 16);
        u.value.setRGB(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
      };
      const st = { paused: false, wire: false, curV: '', curF: '' };
      stage.onTick((dt) => { if (!st.paused) uniforms.uTime.value += dt; });

      const mesh = new THREE.Mesh(makeGeo.plane(), new THREE.MeshBasicMaterial({ color: '#444' }));
      scene.add(mesh);
      let good = mesh.material;
      let counter = 0;
      let timer = 0;
      let pendingErr = null;

      // Three.js llama a esta función cuando el compilador de la GPU rechaza un shader.
      renderer.debug.onShaderError = (gl, program, glV, glF) => {
        const parse = (shader, userSrc) => {
          const log = gl.getShaderInfoLog(shader) || '';
          const src = gl.getShaderSource(shader) || '';
          // Three.js pega código delante del tuyo: restamos esas líneas para que la línea coincida con tu editor
          const offset = src.split('\n').length - userSrc.split('\n').length;
          return [...log.matchAll(/ERROR:\s*\d+:(\d+):\s*(.*)/g)].map((m) => ({ line: +m[1] - offset, msg: m[2].trim() }));
        };
        pendingErr = {
          vertex: parse(glV, st.curV),
          fragment: parse(glF, st.curF),
          program: (gl.getProgramInfoLog(program) || '').split('\n').map((l) => l.replace(/^ERROR:\s*/, '').trim()).filter(Boolean),
        };
      };

      const showOk = () => {
        status.className = 'lab-status ok';
        status.textContent = '✔ Compila sin errores';
        edV.mark([]); edF.mark([]);
      };
      const showErr = (err) => {
        const out = ['✘ Error de compilación (el dibujo conserva el último shader válido)'];
        const fmt = (file, list) => list.forEach((e) => { out.push(`  ${file} · línea ${e.line}: ${e.msg}`); const t = hint(e.msg); if (t) out.push(`      ${t}`); });
        fmt('vertex.glsl', err.vertex);
        fmt('fragment.glsl', err.fragment);
        if (!err.vertex.length && !err.fragment.length) {
          err.program.forEach((l) => { out.push(`  enlace: ${l}`); const t = hint(l); if (t) out.push(`      ${t}`); });
        }
        status.className = 'lab-status bad';
        status.textContent = out.join('\n');
        edV.mark(err.vertex.map((e) => e.line));
        edF.mark(err.fragment.map((e) => e.line));
      };

      const compile = () => {
        st.curV = edV.get(); st.curF = edF.get();
        pendingErr = null;
        const key = `lab-${++counter}`;
        const material = new THREE.ShaderMaterial({ vertexShader: st.curV, fragmentShader: st.curF, uniforms, side: THREE.DoubleSide, wireframe: st.wire });
        material.customProgramCacheKey = () => key;   // así cada intento se compila de verdad
        mesh.material = material;
        renderer.render(scene, camera);               // fuerza la compilación ahora mismo
        if (pendingErr) {
          mesh.material = good;
          material.dispose();
          showErr(pendingErr);
        } else {
          if (good !== material) good.dispose();
          good = material;
          showOk();
        }
      };
      schedule = () => { clearTimeout(timer); timer = setTimeout(compile, 500); };

      const setGeo = (name) => { const old = mesh.geometry; mesh.geometry = makeGeo[name](); old.dispose(); };
      let ui1, ui2;
      const colorInputs = {};
      const colorRow = (label, id, value) => {
        const input = h('input', { class: 'color-input', type: 'color', value, 'aria-label': label });
        colorInputs[id] = input;
        input.addEventListener('input', () => setColor(uniforms[id], input.value));
        setColor(uniforms[id], value);
        return h('label', { class: 'ctl', style: { gridTemplateColumns: 'auto 1fr', alignItems: 'center' } }, input, h('span', {}, label));
      };
      const loadPreset = (id) => {
        const p = PRESETS.find((x) => x.id === id);
        edV.set(p.vertex); edF.set(p.fragment);
        const [ca, cb] = p.colors || ['#f472b6', '#232a5c'];
        colorInputs.uColorA.value = ca; colorInputs.uColorB.value = cb;
        setColor(uniforms.uColorA, ca); setColor(uniforms.uColorB, cb);
        camera.position.set(...(p.cam || [0, 0, 2.6]));
        controls.target.set(0, 0, 0); controls.update();
        clearTimeout(timer);
        compile();
      };

      ui1 = panel([
        { type: 'select', id: 'preset', label: 'Ejemplo', options: PRESETS.map((p) => [p.id, p.name]), value: def.id, onInput: (v) => { if (ui2) loadPreset(v); } },
        { type: 'select', id: 'geo', label: 'Geometría', options: [['plane', 'Plano'], ['sphere', 'Esfera'], ['torus', 'Toro']], value: 'plane', onInput: (v) => { if (ui2) setGeo(v); } },
        { type: 'button', label: 'Restablecer ejemplo', onClick: () => loadPreset(ui1.get('preset')) },
      ]);
      ui2 = panel([
        { type: 'group', label: 'Uniforms (solo llegan si los declaras)' },
        { type: 'range', id: 'a', label: 'uA', min: 0, max: 1, step: 0.01, value: 0.5, onInput: (v) => { uniforms.uA.value = v; } },
        { type: 'range', id: 'b', label: 'uB', min: 0, max: 1, step: 0.01, value: 0.5, onInput: (v) => { uniforms.uB.value = v; } },
      ]);
      ui2.el.append(colorRow('uColorA', 'uColorA', '#f472b6'), colorRow('uColorB', 'uColorB', '#232a5c'));
      panel([
        { type: 'check', id: 'pause', label: 'Pausar uTime', value: false, onInput: (v) => { st.paused = v; } },
        { type: 'check', id: 'wire', label: 'Ver wireframe', value: false, onInput: (v) => { st.wire = v; good.wireframe = v; } },
        { type: 'note', html: '`uTime` es un uniform que sube solo, en segundos. `uA`, `uB`, `uColorA` y `uColorB` los controlas tú aquí.' },
      ]);

      loadPreset(def.id);
    },
  });
  fig.querySelector('.demo-body').after(editors);
  return fig;
}

export default function render(root) {
  root.append(
    P('Con lo que ya sabes (GPU, GLSL, attributes, uniforms y varyings) tienes todas las piezas. Esta lección es **para jugar**: aprender a pensar un shader como una receta que, dado un píxel, devuelve un color, y practicar con un laboratorio donde puedes escribir tu propio código.'),

    H2('Pintar con matemáticas'),
    P('Un fragment shader no «dibuja formas». Solo responde, para cada píxel, a una pregunta: **¿de qué color eres?** Y la única información útil que tiene sobre dónde está ese píxel son las coordenadas **UV**, que el vertex shader le pasa con un varying (`vUv = uv;`).'),
    P('Las UV recorren la superficie del objeto de **0 a 1** en cada dirección, sin importar su tamaño. Si las conviertes directamente en color (x = rojo, y = verde), ves el mapa de coordenadas:'),
    figure(h('div', { html: UV_SVG })),

    H2('La receta de tres pasos'),
    OL([
      '**Saca un número por píxel** a partir de `vUv` (a veces `vUv.x`, a veces una distancia, etc.). Piensa: «¿qué número quiero en cada sitio?».',
      '**Dale forma a ese número** con funciones: `mod`/`fract` (repetir), `step` (cortar), `smoothstep` (suavizar), `sin` (ondular), `distance` (círculos).',
      '**Conviértelo en color** con `mix(colorA, colorB, número)`. Donde el número vale 0 sale `colorA`; donde vale 1, `colorB`.',
    ]),

    H3('Ejemplo 1 · Franjas'),
    codeBlock({
      title: 'fragment.glsl',
      lang: 'glsl',
      code: `
varying vec2 vUv;

void main()
{
    float strength = mod(vUv.y * 10.0, 1.0);
    strength = step(0.8, strength);

    gl_FragColor = vec4(vec3(strength), 1.0);
}`,
      notes: [
        ['varying vec2 vUv', 'Recibimos las UV interpoladas que escribió el vertex shader.'],
        ['mod(vUv.y', '`vUv.y` va de 0 a 1; multiplicado por 10 va de 0 a 10; `mod(…, 1.0)` se queda con el **resto de dividir entre 1**, así que el número sube de 0 a 1 **diez veces** (una sierra).'],
        ['step(0.8', 'Convierte la sierra en cortes duros: 0 mientras valga menos de 0.8 y 1 a partir de ahí. Franjas blancas del 20 % de cada tramo.'],
        ['gl_FragColor', '`vec3(strength)` repite el número en rojo, verde y azul: gris (negro si 0, blanco si 1).'],
      ],
    }),
    P('Con números, para tres píxeles:'),
    table(['vUv.y', '× 10', 'mod(…, 1.0)', 'step(0.8, …)', 'Color'], [
      ['0.37', '3.7', '0.7', '0.0', 'negro'],
      ['0.58', '5.8', '0.8', '1.0', 'blanco'],
      ['0.95', '9.5', '0.5', '0.0', 'negro'],
    ]),

    H3('Ejemplo 2 · Círculo'),
    codeBlock({
      title: 'fragment.glsl',
      lang: 'glsl',
      code: `
varying vec2 vUv;

void main()
{
    float d = distance(vUv, vec2(0.5));
    float disc = 1.0 - step(0.25, d);

    gl_FragColor = vec4(vec3(disc), 1.0);
}`,
      notes: [
        ['distance(vUv', 'Distancia de este píxel al **centro** (0.5, 0.5). En el centro vale 0; en una esquina, aprox. 0.71.'],
        ['1.0 - step(0.25', '`step(0.25, d)` vale 0 dentro del radio y 1 fuera; con `1.0 -` lo invertimos: blanco dentro, negro fuera. El radio es 0.25.'],
      ],
    }),
    eq(`píxel (0.5, 0.6): distance = 0.10 → step(0.25, 0.10) = 0 → 1 - 0 = 1  → blanco (dentro)\npíxel (0.9, 0.5): distance = 0.40 → step(0.25, 0.40) = 1 → 1 - 1 = 0  → negro  (fuera)`),
    callout('tip', '`step` frente a `smoothstep`', [P('`step` da bordes **duros** (con dientes de sierra). `smoothstep(a, b, x)` hace la transición **gradual** entre `a` y `b`: úsalo cuando quieras bordes suaves, como en el preset del círculo.')]),

    H2('Y el vertex shader: mover vértices'),
    P('Todo lo anterior cambia el **color**. Si en el vertex shader modificas `modelPosition` antes de proyectarlo, cambias la **forma**. En el preset de las olas se suma una `sin()` a la coordenada `z`, y el valor se envía con un varying (`vElevation`) para colorear por altura. Para ver el relieve, el plano necesita muchos vértices (aquí 65 × 65 = 4225).'),

    H2('Laboratorio de shaders'),
    P('Escoge un ejemplo, mira el código, **cámbialo** y observa. Algunas ideas para empezar: cambia `10.0` por `20.0` en las franjas, cambia `8.0` por `4.0` en el tablero, mueve los sliders `uA` y `uB`, o borra un `;` a propósito para ver cómo es un error real.'),
    labDemo(),

    callout('idea', 'Cómo funciona por dentro (te servirá en la lección final)', [
      UL([
        'Cada vez que cambias el código se crea un **`ShaderMaterial` nuevo** con tus dos textos.',
        'Se llama a `renderer.render(...)` una vez para obligar a la GPU a compilarlo ya.',
        'Si falla, Three.js llama a **`renderer.debug.onShaderError`**: ahí leemos el mensaje real (`gl.getShaderInfoLog`) y lo mostramos. Con esa función puedes ver, en cualquier proyecto tuyo, el error exacto en vez de una pantalla negra.',
        'Los uniforms `uTime`, `uA`… viven en un único objeto que comparten todos los materiales; por eso mover un slider no recompila nada.',
      ]),
    ]),

    H2('Retos'),
    P('Intenta hacerlos en el laboratorio antes de mirar la pista:'),
    h('details', {}, h('summary', {}, '1 · Tablero de 4 × 4 en vez de 8 × 8'), P('En el ejemplo 5 cambia el `8.0` por `4.0`. Es el número de casillas por lado.')),
    h('details', {}, h('summary', {}, '2 · Franjas en vertical en vez de en horizontal'), P('En el ejemplo 4 usa `vUv.x` en vez de `vUv.y`.')),
    h('details', {}, h('summary', {}, '3 · Un círculo que late'), P('En el ejemplo 6 declara `uniform float uTime;` y calcula `float radius = 0.25 + sin(uTime * 3.0) * 0.05;`.')),
    h('details', {}, h('summary', {}, '4 · Un degradado en diagonal'), P('Usa `float t = (vUv.x + vUv.y) * 0.5;` y pásalo a `mix(uColorA, uColorB, t)`. En la esquina (0, 0) vale 0 y en (1, 1) vale 1.')),
    h('details', {}, h('summary', {}, '5 · Un tablero que se desplaza'), P('Suma el tiempo antes del `floor`: `floor((vUv + vec2(uTime * 0.3, 0.0)) * 8.0)`.')),
    h('details', {}, h('summary', {}, '6 · Rompe un shader a propósito'), P('Quita un `;`, escribe `1` en vez de `1.0`, o inventa una variable. Lee el mensaje y la ayuda que aparece: aprender a leer estos errores es media batalla.')),

    callout('remember', 'Lo que te llevas', [
      UL([
        'Un fragment shader es una función **píxel → color**; `vUv` te dice dónde está el píxel.',
        'Receta: número por píxel → darle forma (`mod`, `step`, `smoothstep`, `sin`, `distance`) → `mix` entre dos colores.',
        'Con el vertex shader mueves vértices (`modelPosition.z += …`) y con un varying avisas al fragment.',
        'Los errores de GLSL aparecen en la consola; con `renderer.debug.onShaderError` los puedes capturar.',
      ]),
    ]),

    quiz([
      {
        q: 'Para pintar `vUv` como color usamos `gl_FragColor = vec4(vUv, 0.0, 1.0);`. ¿Qué color tiene la esquina (1, 0) de la superficie?',
        options: ['Negro', 'Rojo', 'Verde', 'Amarillo'],
        answer: 1,
        why: 'En (1, 0): rojo = 1, verde = 0, azul = 0 → rojo puro. Amarillo sería (1, 1), la esquina opuesta.',
      },
      {
        q: 'Con `float s = mod(vUv.x * 4.0, 1.0);`, ¿cuánto vale `s` en un píxel con `vUv.x = 0.6`?',
        options: ['0.4', '0.6', '2.4', '0.0'],
        answer: 0,
        why: '0.6 × 4 = 2.4 y el resto de dividir entre 1 es 0.4. Es la parte decimal (como `fract`).',
      },
      {
        q: '¿Qué función usarías para un borde de círculo **suave**?',
        options: ['`step`', '`smoothstep`', '`floor`', '`abs`'],
        answer: 1,
        why: '`smoothstep` da una transición gradual entre dos valores; `step` corta de golpe.',
      },
      {
        q: 'Tu shader no compila y la pantalla se queda negra. ¿Dónde ves el error real?',
        options: ['En el terminal de VS Code', 'En la consola del navegador (o con `renderer.debug.onShaderError`)', 'En el archivo .glsl', 'No se puede ver'],
        answer: 1,
        why: 'El compilador es el de la GPU del navegador, así que el mensaje sale en la consola del navegador.',
      },
      {
        q: 'Quieres que un plano se ondule. ¿Qué necesita tener la geometría?',
        options: ['Más vértices (subdivisiones)', 'Un material de metal', 'Una textura', 'Luces'],
        answer: 0,
        why: 'El vertex shader solo puede mover vértices; con un plano de 1×1 subdivisión (4 vértices) no habría nada que ondular.',
      },
    ]),
  );
}
