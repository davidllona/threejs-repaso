import { h, md, P, UL, OL, callout, codeBlock, codeEditor, demo, table, eq, figure } from '../ui.js';
import { canvas2d } from '../stage.js';

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

/* ======================================================================
   Mini-demos (dibujadas en la CPU imitando lo que haría el fragment shader)
   ====================================================================== */
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = clamp01((x - a) / ((b - a) || 1e-6)); return t * t * (3 - 2 * t); };
const PINK = [244, 114, 182], NAVY = [35, 42, 92];

/* Pinta una función (u, v) → [r, g, b] (0..255) en un cuadrado de res×res y la escala al tamaño pedido */
function paintField(ctx, x, y, size, res, fn) {
  const off = paintField.c || (paintField.c = document.createElement('canvas'));
  off.width = res; off.height = res;
  const o = off.getContext('2d');
  const img = o.createImageData(res, res);
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const [r, g, b] = fn((i + 0.5) / res, 1 - (j + 0.5) / res);
      const k = (j * res + i) * 4;
      img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
    }
  }
  o.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, x, y, size, size);
}

function recipeDemo() {
  return demo({
    title: 'La receta, paso a paso',
    aspect: '16 / 7',
    caption: 'Los tres cuadrados son el **mismo plano** en tres momentos del fragment shader: `mod(vUv.y × n, 1.0)` → `step(corte, …)` → `mix(colorA, colorB, …)`. La línea amarilla es el píxel que sigues con números.',
    setup({ stageEl, panel }) {
      const st = { n: 10, edge: 0.8, y: 0.58 };
      let ui;
      const saw = (v) => { const x = v * st.n + 1e-6; return x - Math.floor(x); };
      const draw = (ctx, w, hgt) => {
        const gap = 14;
        const size = Math.max(40, Math.min((w - gap * 4) / 3, hgt - 30 - 16));
        const top = Math.max(30, (hgt - size) / 2 + 8);
        const narrow = size < 170;
        const total = size * 3 + gap * 2;
        const x0 = (w - total) / 2;
        const steps = [
          [narrow ? '1 · mod' : '1 · mod(vUv.y × n, 1.0)', (u, v) => { const g = Math.round(saw(v) * 255); return [g, g, g]; }],
          [narrow ? '2 · step' : '2 · step(corte, …)', (u, v) => { const g = saw(v) >= st.edge ? 255 : 0; return [g, g, g]; }],
          [narrow ? '3 · mix' : '3 · mix(colorA, colorB, …)', (u, v) => { const t = saw(v) >= st.edge ? 1 : 0; return PINK.map((a, i) => Math.round(a * (1 - t) + NAVY[i] * t)); }],
        ];
        ctx.font = '600 12.5px system-ui, sans-serif'; ctx.textAlign = 'left';
        steps.forEach(([label, fn], k) => {
          const x = x0 + k * (size + gap);
          paintField(ctx, x, top, size, 120, fn);
          ctx.strokeStyle = '#4a5266'; ctx.lineWidth = 1; ctx.strokeRect(x, top, size, size);
          ctx.fillStyle = '#c9cedb'; ctx.fillText(label, x, top - 10);
          const py = top + (1 - st.y) * size;
          ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + size, py); ctx.stroke();
        });
      };
      const api = canvas2d(stageEl, draw);
      const info = () => {
        const a = st.y * st.n, b = saw(st.y), c = b >= st.edge ? 1 : 0;
        ui?.readout('calc', `vUv.y = ${st.y.toFixed(2)}\n× ${st.n}       = ${a.toFixed(2)}\nmod(…, 1.0) = ${b.toFixed(2)}\nstep(${st.edge.toFixed(2)}, …) = ${c.toFixed(1)}\n→ ${c ? 'colorB (azul)' : 'colorA (rosa)'}`);
      };
      const upd = () => { api.redraw(); info(); };
      ui = panel([
        { type: 'range', id: 'y', label: 'Píxel: vUv.y', min: 0, max: 1, step: 0.01, value: st.y, onInput: (v) => { st.y = v; upd(); } },
        { type: 'range', id: 'n', label: 'n (cuántas franjas)', min: 1, max: 20, step: 1, value: st.n, onInput: (v) => { st.n = v; upd(); } },
        { type: 'range', id: 'edge', label: 'corte del step', min: 0, max: 1, step: 0.05, value: st.edge, onInput: (v) => { st.edge = v; upd(); } },
        { type: 'readout', id: 'calc' },
      ]);
      upd();
    },
  });
}

function circleDemo() {
  return demo({
    title: 'Un círculo con distance',
    aspect: '16 / 9',
    caption: 'Izquierda: la **distancia al centro** como gris (0 negro, 0.7 blanco). Derecha: el círculo que sale de cortarla. Toca un punto para ver sus números.',
    setup({ stageEl, panel }) {
      const st = { r: 0.25, soft: 0, px: 0.62, py: 0.5 };
      let ui;
      const disc = (d) => (st.soft > 0 ? 1 - sstep(st.r - st.soft, st.r + st.soft, d) : (d < st.r ? 1 : 0));
      const geom = { x0: 0, x1: 0, top: 0, size: 1 };
      const draw = (ctx, w, hgt) => {
        const gap = 22;
        const size = Math.max(40, Math.min((w - gap * 3) / 2, hgt - 28 - 12));
        const top = Math.max(28, (hgt - size) / 2 + 8);
        const x0 = (w - size * 2 - gap) / 2, x1 = x0 + size + gap;
        Object.assign(geom, { x0, x1, top, size });
        paintField(ctx, x0, top, size, 140, (u, v) => { const g = Math.round(clamp01(Math.hypot(u - 0.5, v - 0.5) / 0.71) * 255); return [g, g, g]; });
        paintField(ctx, x1, top, size, 140, (u, v) => { const g = Math.round(disc(Math.hypot(u - 0.5, v - 0.5)) * 255); return [g, g, g]; });
        ctx.font = '600 12.5px system-ui, sans-serif'; ctx.fillStyle = '#c9cedb'; ctx.textAlign = 'left';
        ctx.fillText(size < 170 ? 'distance' : 'distance(vUv, vec2(0.5))', x0, top - 10);
        ctx.fillText(st.soft > 0 ? (size < 170 ? '1 − smoothstep' : '1 − smoothstep(…)') : '1 − step(radio, d)', x1, top - 10);
        [x0, x1].forEach((x) => {
          ctx.strokeStyle = '#4a5266'; ctx.lineWidth = 1; ctx.strokeRect(x, top, size, size);
          const cx = x + size / 2, cy = top + size / 2, qx = x + st.px * size, qy = top + (1 - st.py) * size;
          ctx.strokeStyle = '#ffc857'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(qx, qy); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#ffc857'; ctx.beginPath(); ctx.arc(qx, qy, 5, 0, Math.PI * 2); ctx.fill();
        });
      };
      const api = canvas2d(stageEl, draw);
      api.canvas.style.touchAction = 'pan-y';
      api.canvas.style.cursor = 'crosshair';
      const info = () => {
        const d = Math.hypot(st.px - 0.5, st.py - 0.5), v = disc(d);
        ui?.readout('calc', `vUv = (${st.px.toFixed(2)}, ${st.py.toFixed(2)})\nd = ${d.toFixed(2)}\nvalor = ${v.toFixed(2)} → ${v > 0.99 ? 'blanco (dentro)' : v < 0.01 ? 'negro (fuera)' : 'gris (en el borde)'}`);
      };
      const upd = () => { api.redraw(); info(); };
      api.canvas.addEventListener('pointerdown', (e) => {
        const r = api.canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        for (const gx of [geom.x0, geom.x1]) {
          if (x >= gx && x <= gx + geom.size && y >= geom.top && y <= geom.top + geom.size) {
            st.px = (x - gx) / geom.size; st.py = 1 - (y - geom.top) / geom.size; upd();
          }
        }
      });
      ui = panel([
        { type: 'range', id: 'r', label: 'radio', min: 0.05, max: 0.5, step: 0.01, value: st.r, onInput: (v) => { st.r = v; upd(); } },
        { type: 'range', id: 'soft', label: 'suavidad (0 = step)', min: 0, max: 0.15, step: 0.01, value: st.soft, onInput: (v) => { st.soft = v; upd(); } },
        { type: 'readout', id: 'calc' },
      ]);
      upd();
    },
  });
}

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Pintar con matemáticas',
      body: () => [
        figure(h('div', { html: UV_SVG })),
        P('Un fragment shader no dibuja formas. Para cada píxel responde a una sola pregunta: **¿de qué color eres?** Y para saber dónde está ese píxel tiene `vUv`, que va de **0 a 1** en cada dirección. Si pintas `vUv` tal cual (x = rojo, y = verde), ves este mapa.'),
      ],
      check: {
        type: 'mc',
        q: 'Con `gl_FragColor = vec4(vUv, 0.0, 1.0);`, ¿de qué color es la esquina **(1, 0)**?',
        options: ['Negro', 'Rojo', 'Verde', 'Amarillo'],
        answer: 1,
        why: 'En (1, 0): rojo = 1, verde = 0 → rojo puro. Amarillo sería (1, 1), la esquina de arriba a la derecha.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'La receta de tres pasos',
      body: () => [
        recipeDemo(),
        OL([
          '**Saca un número** de `vUv` (aquí, una «sierra» que sube de 0 a 1 `n` veces).',
          '**Dale forma**: `step` corta, `smoothstep` suaviza, `sin` ondula, `distance` hace círculos.',
          '**Conviértelo en color** con `mix(colorA, colorB, número)`.',
        ]),
      ],
      more: () => [
        codeBlock({
          title: 'fragment.glsl · las franjas',
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
            ['mod(vUv.y', '`mod(x, 1.0)` se queda con la **parte decimal**: 3.7 → 0.7. Por eso sube de 0 a 1 diez veces.'],
            ['step(0.8', '0 mientras valga menos de 0.8, 1 a partir de ahí: franjas del 20 %.'],
            ['vec3(strength)', 'El mismo número en r, g y b = gris.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Con `float s = mod(vUv.x * 4.0, 1.0);`, ¿cuánto vale `s` en un píxel con `vUv.x = 0.6`?',
        options: ['0.4', '0.6', '2.4'],
        answer: 0,
        why: '0.6 × 4 = 2.4, y `mod(2.4, 1.0)` se queda con la parte decimal: 0.4.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Círculos con distance',
      body: () => [
        circleDemo(),
        codeBlock({
          title: 'fragment.glsl',
          lang: 'glsl',
          code: `
float d = distance(vUv, vec2(0.5));
float disc = 1.0 - step(0.25, d);
gl_FragColor = vec4(vec3(disc), 1.0);`,
          notes: [
            ['distance(', 'Distancia del píxel al centro: 0 en el centro, ≈ 0.71 en las esquinas.'],
            ['1.0 - step', '`step` da 1 **fuera** del radio; restándolo de 1, el blanco queda **dentro**.'],
          ],
        }),
      ],
      check: {
        type: 'predict',
        q: 'Sube la **suavidad** por encima de 0. ¿Qué cambiará en el círculo?',
        options: ['Se hace más grande', 'El borde pasa de corte duro a degradado', 'Desaparece'],
        answer: 1,
        why: 'Con suavidad > 0 la demo usa `smoothstep(radio − s, radio + s, d)`: en vez de saltar de 1 a 0, el valor baja poco a poco a lo largo del borde.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'El vertex shader cambia la forma',
      body: () => [
        P('Todo lo anterior cambia el **color**. Si en el vertex shader modificas `modelPosition` **antes** de proyectarla, cambias la **forma**:'),
        codeBlock({
          title: 'vertex.glsl · olas',
          lang: 'glsl',
          code: `
vec4 modelPosition = modelMatrix * vec4(position, 1.0);
float elevation = sin(modelPosition.x * 4.0 + uTime) * 0.15;
modelPosition.z += elevation;
vElevation = elevation;   // para colorear por altura`,
          notes: [
            ['sin(', 'Cada vértice sube o baja según su x: una ola. `uTime` la desplaza.'],
            ['vElevation', 'El fragment no sabe la altura: se la pasas con un varying.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Quieres que un plano se ondule. ¿Qué necesita la geometría?',
        options: ['Muchos vértices (subdivisiones)', 'Una textura', 'Luces'],
        answer: 0,
        why: 'El vertex shader solo mueve vértices. Un plano sin subdividir tiene 4: se inclinaría, pero nunca haría olas.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'Laboratorio: ahora tú',
      body: () => [
        labDemo(),
        P('Elige un ejemplo y **cámbialo**: `10.0` por `20.0` en las franjas, mueve `uA` y `uB`, o borra un `;` a propósito para ver un error real del compilador.'),
      ],
      more: () => [
        UL([
          'Cada cambio crea un **`ShaderMaterial` nuevo** con tus dos textos y llama a `renderer.render()` para compilarlo ya.',
          'Si falla, Three.js llama a **`renderer.debug.onShaderError`**: ahí se lee el mensaje real con `gl.getShaderInfoLog`. Te sirve en cualquier proyecto.',
          'Los uniforms viven en un único objeto compartido: por eso mover un slider no recompila nada.',
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Tu shader no compila y la pantalla se queda negra. ¿Dónde está el error real?',
        options: ['En el terminal de VS Code', 'En la consola del navegador', 'En ningún sitio'],
        answer: 1,
        why: 'Quien compila es la GPU, a través del navegador, así que el mensaje sale en la consola (o lo capturas con `renderer.debug.onShaderError`).',
      },
    },

    /* 6 ------------------------------------------------------------------ */
    {
      t: 'Retos',
      body: () => [
        P('Hazlos en el laboratorio de la tarjeta anterior antes de abrir la pista:'),
        h('details', {}, h('summary', {}, '1 · Tablero de 4 × 4 en vez de 8 × 8'), P('En el ejemplo 5 cambia el `8.0` por `4.0`: son las casillas por lado.')),
        h('details', {}, h('summary', {}, '2 · Un círculo que late'), P('En el ejemplo 6 declara `uniform float uTime;` y usa `float radius = 0.25 + sin(uTime * 3.0) * 0.05;`.')),
        h('details', {}, h('summary', {}, '3 · Degradado en diagonal'), P('`float t = (vUv.x + vUv.y) * 0.5;` y luego `mix(uColorA, uColorB, t)`. En (0, 0) vale 0 y en (1, 1) vale 1.')),
        h('details', {}, h('summary', {}, '4 · Un tablero que se desplaza'), P('Suma el tiempo antes del `floor`: `floor((vUv + vec2(uTime * 0.3, 0.0)) * 8.0)`.')),
      ],
      check: {
        type: 'fill',
        q: 'Las franjas del ejemplo 4 son horizontales. ¿Qué escribes para que sean **verticales**?',
        pre: 'float strength = mod(vUv.', post: ' * 10.0, 1.0);',
        answer: 'x',
        accept: ['x', 's', 'r'],
        size: 3,
        why: 'Con `vUv.y` el valor cambia al subir → franjas horizontales. Con `vUv.x` cambia de izquierda a derecha → verticales.',
      },
    },
  ];
}
