import { h, md, P, UL, callout, codeBlock, liveCode, demo, table, eq, figure } from '../ui.js';
import { canvas2d } from '../stage.js';

const FLOW_SVG = `
<svg viewBox="0 0 1000 330" role="img" aria-label="Cómo viajan los datos de JavaScript a los shaders">
  <defs>
    <marker id="arrC" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#4cc9e0"/></marker>
    <marker id="arrP" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#f472b6"/></marker>
    <marker id="arrV" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#a493ff"/></marker>
  </defs>

  <rect x="10" y="100" width="200" height="170" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="110" y="130" text-anchor="middle" fill="#fff" font-size="15" font-weight="650">Tu JavaScript</text>
  <text x="110" y="156" text-anchor="middle" fill="#97a0b4" font-size="12.5">(la CPU)</text>
  <text x="110" y="190" text-anchor="middle" fill="#4cc9e0" font-size="12.5" font-family="JetBrains Mono, monospace">geometry.setAttribute</text>
  <text x="110" y="214" text-anchor="middle" fill="#f472b6" font-size="12.5" font-family="JetBrains Mono, monospace">uniforms: { uTime }</text>

  <rect x="340" y="110" width="220" height="150" rx="12" fill="#a493ff1c" stroke="#a493ff"/>
  <text x="450" y="140" text-anchor="middle" fill="#a493ff" font-size="15" font-weight="650">Vertex shader</text>
  <text x="450" y="168" text-anchor="middle" fill="#c9cedb" font-size="12.5">se ejecuta 1 vez por vértice</text>
  <text x="450" y="226" text-anchor="middle" fill="#97a0b4" font-size="12.5">escribe  gl_Position</text>
  <text x="450" y="246" text-anchor="middle" fill="#97a0b4" font-size="12.5">y los varyings</text>

  <rect x="730" y="110" width="220" height="150" rx="12" fill="#a493ff1c" stroke="#a493ff"/>
  <text x="840" y="140" text-anchor="middle" fill="#a493ff" font-size="15" font-weight="650">Fragment shader</text>
  <text x="840" y="168" text-anchor="middle" fill="#c9cedb" font-size="12.5">se ejecuta 1 vez por píxel</text>
  <text x="840" y="226" text-anchor="middle" fill="#97a0b4" font-size="12.5">escribe  gl_FragColor</text>

  <!-- attribute -->
  <path d="M214 185 H334" stroke="#4cc9e0" stroke-width="2.5" marker-end="url(#arrC)"/>
  <text x="274" y="174" text-anchor="middle" fill="#4cc9e0" font-size="14" font-weight="650">attribute</text>
  <text x="274" y="206" text-anchor="middle" fill="#97a0b4" font-size="12">1 valor por vértice</text>

  <!-- uniform -->
  <path d="M110 96 V44 H450 V106" fill="none" stroke="#f472b6" stroke-width="2.5" marker-end="url(#arrP)"/>
  <path d="M450 44 H840 V106" fill="none" stroke="#f472b6" stroke-width="2.5" marker-end="url(#arrP)"/>
  <text x="130" y="34" fill="#f472b6" font-size="14" font-weight="650">uniform</text>
  <text x="200" y="34" fill="#97a0b4" font-size="12">el mismo valor para todos los vértices y todos los píxeles</text>

  <!-- varying -->
  <path d="M564 185 H724" stroke="#a493ff" stroke-width="2.5" marker-end="url(#arrV)"/>
  <text x="644" y="174" text-anchor="middle" fill="#a493ff" font-size="14" font-weight="650">varying</text>
  <text x="644" y="206" text-anchor="middle" fill="#97a0b4" font-size="12">interpolado entre vértices</text>

  <text x="450" y="300" text-anchor="middle" fill="#97a0b4" font-size="12.5">Los datos solo viajan hacia la derecha: JS → vertex → fragment. Nunca al revés.</text>
</svg>`;

/* ---------- Generador de los shaders de la demo ---------- */
function makeShaders({ attr, vary }) {
  const vertex = [
    'uniform float uTime;',
    'uniform vec2 uFrequency;',
    'uniform float uAmplitude;',
    attr ? 'attribute float aRandom;' : null,
    vary ? 'varying float vElevation;' : null,
    '',
    'void main()',
    '{',
    '    vec4 modelPosition = modelMatrix * vec4(position, 1.0);',
    '',
    '    float elevation = sin(modelPosition.x * uFrequency.x - uTime) * 0.1;',
    '    elevation += sin(modelPosition.y * uFrequency.y - uTime) * 0.1;',
    '    elevation *= uAmplitude;',
    attr ? '    elevation += aRandom * 0.1;' : null,
    '    modelPosition.z += elevation;',
    '',
    '    vec4 viewPosition = viewMatrix * modelPosition;',
    '    gl_Position = projectionMatrix * viewPosition;',
    vary ? '' : null,
    vary ? '    vElevation = elevation;' : null,
    '}',
  ].filter((l) => l !== null).join('\n');

  const fragment = vary
    ? [
      'varying float vElevation;',
      '',
      'void main()',
      '{',
      '    float k = smoothstep(-0.25, 0.3, vElevation);',
      '    vec3 color = mix(vec3(0.15, 0.2, 0.55), vec3(1.0, 0.8, 0.3), k);',
      '',
      '    gl_FragColor = vec4(color, 1.0);',
      '}',
    ].join('\n')
    : [
      'void main()',
      '{',
      '    // Sin varying, este shader no sabe nada de la altura',
      '    gl_FragColor = vec4(0.3, 0.79, 0.88, 1.0);',
      '}',
    ].join('\n');
  return { vertex, fragment };
}

/* ---------- Demo principal: los tres canales en vivo ---------- */
function channelsDemo() {
  return demo({
      title: 'Attribute, uniform y varying',
      aspect: '4 / 3',
      caption: '**Sin varying** el fragment shader no sabe nada de lo que hizo el vertex shader y pinta todo del mismo color (activa «wireframe» para ver el relieve). **Con varying:** `vElevation` viaja de vértice a píxel y se convierte en color.',
      setup({ makeStage, panel, side }) {
        const stage = makeStage({ pos: [0.3, -2.3, 2.0], target: [0, 0, 0], fov: 45 });
        const { THREE } = stage;
        const geo = new THREE.PlaneGeometry(2, 2, 32, 32);
        const count = geo.attributes.position.count;
        const randoms = new Float32Array(count);
        let seed = 7;
        const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        for (let i = 0; i < count; i++) randoms[i] = rnd();
        geo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

        const uniforms = {
          uTime: { value: 0 },
          uFrequency: { value: new THREE.Vector2(10, 5) },
          uAmplitude: { value: 1 },
        };
        const st = { attr: false, vary: true, wire: false };
        const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
        stage.scene.add(mesh);
        stage.onTick((dt, t) => { uniforms.uTime.value = t; });

        const vcode = liveCode({ title: 'vertex.glsl', lang: 'glsl' });
        const fcode = liveCode({ title: 'fragment.glsl', lang: 'glsl' });
        let ui = null;

        const build = () => {
          const { vertex, fragment } = makeShaders(st);
          const old = mesh.material;
          mesh.material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, side: THREE.DoubleSide, wireframe: st.wire });
          old.dispose();
          vcode.set(vertex);
          fcode.set(fragment);
        };
        const readout = () => ui?.readout('info', `aRandom: ${count} valores (uno por vértice)\nuFrequency = (${uniforms.uFrequency.value.x.toFixed(0)}, ${uniforms.uFrequency.value.y.toFixed(0)})\nuAmplitude = ${uniforms.uAmplitude.value.toFixed(2)}`);

        ui = panel([
          { type: 'group', label: 'ATTRIBUTE · un valor por vértice' },
          { type: 'check', id: 'attr', label: 'Usar aRandom (picos aleatorios)', value: st.attr, onInput: (v) => { st.attr = v; if (ui) build(); } },
          { type: 'group', label: 'UNIFORMS · se cambian sin recompilar' },
          { type: 'range', id: 'fx', label: 'uFrequency.x', min: 0, max: 30, step: 1, value: 10, onInput: (v) => { uniforms.uFrequency.value.x = v; readout(); } },
          { type: 'range', id: 'fy', label: 'uFrequency.y', min: 0, max: 30, step: 1, value: 5, onInput: (v) => { uniforms.uFrequency.value.y = v; readout(); } },
          { type: 'range', id: 'amp', label: 'uAmplitude', min: 0, max: 2, step: 0.05, value: 1, onInput: (v) => { uniforms.uAmplitude.value = v; readout(); } },
          { type: 'group', label: 'VARYING · del vértice al fragment' },
          { type: 'check', id: 'vary', label: 'Colorear con vElevation', value: st.vary, onInput: (v) => { st.vary = v; if (ui) build(); } },
          { type: 'check', id: 'wire', label: 'Ver wireframe', value: st.wire, onInput: (v) => { st.wire = v; if (ui) build(); } },
          { type: 'readout', id: 'info' },
        ]);
        side.append(vcode.el, fcode.el);
        build();
        readout();
      },
    });
}

/* ---------- Mini-demo: cómo se interpola un varying ---------- */
function interpDemo() {
  return demo({
    title: 'Un varying entre dos vértices',
    aspect: '16 / 7',
    caption: 'El vertex shader solo escribe el valor en **A** y en **B**. Cada píxel de en medio recibe una mezcla proporcional a lo cerca que está de cada vértice.',
    setup({ stageEl, panel }) {
      const st = { a: 0.0, b: 1.0, t: 0.25 };
      let ui;
      const lerp = (a, b, t) => a * (1 - t) + b * t;
      const col = (v) => { const k = Math.max(0, Math.min(1, v)); return `rgb(${Math.round(38 + k * 217)},${Math.round(51 + k * 153)},${Math.round(140 - k * 64)})`; };
      const draw = (ctx, w, hgt) => {
        const x0 = 46, x1 = w - 46, y = hgt * 0.5, n = 14;
        const cw = (x1 - x0) / n;
        for (let i = 0; i < n; i++) {
          const t = (i + 0.5) / n;
          ctx.fillStyle = col(lerp(st.a, st.b, t));
          ctx.fillRect(x0 + i * cw + 1, y - 22, cw - 2, 44);
        }
        ctx.fillStyle = '#8b94a8'; ctx.font = '12px ui-monospace, monospace'; ctx.textAlign = 'center';
        ctx.fillText('cada cuadradito = un píxel (un fragment)', w / 2, y + 44);
        [[x0, st.a, 'A'], [x1, st.b, 'B']].forEach(([x, v, nm]) => {
          ctx.fillStyle = '#4cc9e0'; ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#e4e7ee'; ctx.font = '600 13px system-ui, sans-serif';
          ctx.fillText(`${nm} = ${v.toFixed(2)}`, x, y - 34);
        });
        const px = x0 + st.t * (x1 - x0);
        ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 2.5; ctx.strokeRect(px - cw / 2, y - 26, cw, 52);
        ctx.fillStyle = '#ffc857'; ctx.font = '600 13px system-ui, sans-serif';
        ctx.fillText(`${lerp(st.a, st.b, st.t).toFixed(2)}`, px, y + 66 > hgt - 4 ? y - 34 : y + 66);
      };
      const api = canvas2d(stageEl, draw);
      const info = () => ui?.readout('calc', `píxel al ${Math.round(st.t * 100)} % de A a B\nvElevation = A·${(1 - st.t).toFixed(2)} + B·${st.t.toFixed(2)}\n           = ${(st.a * (1 - st.t)).toFixed(2)} + ${(st.b * st.t).toFixed(2)} = ${lerp(st.a, st.b, st.t).toFixed(2)}`);
      const upd = () => { api.redraw(); info(); };
      ui = panel([
        { type: 'range', id: 't', label: 'Píxel (de A a B)', min: 0, max: 1, step: 0.01, value: st.t, onInput: (v) => { st.t = v; upd(); } },
        { type: 'range', id: 'a', label: 'Valor en A', min: 0, max: 1, step: 0.05, value: st.a, onInput: (v) => { st.a = v; upd(); } },
        { type: 'range', id: 'b', label: 'Valor en B', min: 0, max: 1, step: 0.05, value: st.b, onInput: (v) => { st.b = v; upd(); } },
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
      t: 'Tres canales hacia la GPU',
      body: () => [
        figure(h('div', { html: FLOW_SVG })),
        P('Un shader **no puede leer tus variables de JavaScript**. Ni `elapsedTime`, ni el color de lil-gui. Los datos solo le llegan por tres canales:'),
        UL([
          '**attribute** → un valor **distinto por vértice** (`position`, `uv`, tu `aRandom`). Solo lo lee el vertex shader.',
          '**uniform** → **un mismo valor para todo** (`uTime`, `uColor`). Lo leen los dos shaders.',
          '**varying** → una nota que el vertex shader **le pasa** al fragment shader (`vUv`).',
        ]),
      ],
      more: () => [
        callout('analogy', 'Una fábrica de camisetas', [
          P('Cada camiseta (vértice) llega con **su etiqueta** de talla: *attribute*. En la pared hay **un cartel** con las instrucciones del día, igual para todos: *uniform*. Y el cortador le **deja una nota** al pintor: *varying*.'),
        ]),
        callout('tip', 'Convención de nombres', [P('**a**Random, **u**Time, **v**Uv: la letra te dice de qué canal viene. GLSL no lo obliga, pero ayuda muchísimo al leer.')]),
      ],
      check: {
        type: 'mc',
        q: 'Quieres que **cada vértice** tenga un número aleatorio distinto. ¿Qué canal usas?',
        options: ['uniform', 'attribute', 'varying'],
        answer: 1,
        why: 'Un valor por vértice = attribute. Se guarda en la geometría con `setAttribute`.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Los tres, funcionando',
      body: () => [
        channelsDemo(),
        P('Esto es un `ShaderMaterial` real, y los paneles muestran el shader que se está ejecutando. Los **sliders** son uniforms: cambian la ola al instante, sin recompilar. Las **casillas** cambian el código.'),
      ],
      check: {
        type: 'predict',
        q: 'Desmarca «Colorear con vElevation» (sin mirar todavía). ¿Qué crees que pasará?',
        options: ['La ola deja de moverse', 'La ola sigue, pero todo se pinta de un solo color', 'Sale un error de compilación'],
        answer: 1,
        why: 'El vertex shader sigue moviendo los vértices (la ola existe; actívale el wireframe y la verás). Pero sin el varying, el fragment shader no sabe la altura de nada y pinta todo igual. Pruébalo ahora en la demo.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: '«Interpolado», con números',
      body: () => [
        interpDemo(),
        P('El vertex shader corre **por vértice**, pero el fragment shader corre **por píxel**, y hay muchos más píxeles. Así que la GPU rellena los huecos mezclando:'),
        eq('valor del píxel = A · (1 − t) + B · t        (t = cuánto has avanzado de A a B)'),
      ],
      check: {
        type: 'mc',
        q: 'En A, `vElevation = 0.0`; en B, `1.0`. Un píxel está al **40 %** del camino. ¿Qué recibe el fragment shader?',
        options: ['0.0', '0.4', '0.6', '1.0'],
        answer: 1,
        why: '0.0·0.6 + 1.0·0.4 = 0.4. Ponlo en la demo: «Píxel» a 0.40.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Crear tu propio attribute',
      body: () => [
        codeBlock({
          title: 'main.js',
          lang: 'js',
          code: `
const geometry = new THREE.PlaneGeometry(2, 2, 32, 32)

const count = geometry.attributes.position.count
const randoms = new Float32Array(count)
for (let i = 0; i < count; i++) randoms[i] = Math.random()

geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))`,
          notes: [
            ['32, 32', '32×32 subdivisiones = **33 × 33 = 1089 vértices**. Sin subdivisiones solo habría 4 y no habría nada que mover.'],
            ['position.count', '1089: necesitas **un número por vértice**.'],
            ['Float32Array', 'Los attributes viajan a la GPU como listas de decimales de tamaño fijo.'],
            ['randoms, 1', 'El `1` = **1 número por vértice**. Para `position` serían 3 (x, y, z).'],
          ],
        }),
        P('En el vertex shader lo recibes con el mismo nombre: `attribute float aRandom;`.'),
      ],
      check: {
        type: 'order',
        q: 'Ordena los pasos para crear el attribute:',
        lines: [
          '`const count = geometry.attributes.position.count`',
          '`const randoms = new Float32Array(count)`',
          '`for (...) randoms[i] = Math.random()`',
          "`geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))`",
        ],
        why: 'Primero sabes cuántos vértices hay, luego creas la lista de ese tamaño, la rellenas y, al final, se la das a la geometría.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'ShaderMaterial y sus uniforms',
      body: () => [
        codeBlock({
          title: 'main.js',
          lang: 'js',
          code: `
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uFrequency: { value: new THREE.Vector2(10, 5) }
    }
})

// en el tick, cada frame:
material.uniforms.uTime.value = elapsedTime`,
          notes: [
            ['vertexShader:', 'Tus shaders son **texto** (strings). En el curso vienen de archivos `.glsl` importados.'],
            ['{ value: 0 }', 'Cada uniform es un **objeto con `value`**. Three.js lee ese `value` en cada frame.'],
            ['uTime.value =', 'Se actualiza cambiando `.value`, no creando un objeto nuevo.'],
          ],
        }),
        callout('warn', 'Fallo silencioso', [P('Si escribes `uTime: 0` (sin `{ value }`), o el nombre no coincide con el del shader, este recibe **0** y **no sale ningún error**.')]),
      ],
      check: {
        type: 'fill',
        q: 'Completa la línea del tick:',
        pre: 'material.uniforms.uTime.', post: ' = elapsedTime',
        answer: 'value',
        accept: ['value'],
        size: 8,
        why: 'Siempre `.value`. Es la caja donde Three.js mira el dato que mandará a la GPU.',
      },
    },

    /* 6 ------------------------------------------------------------------ */
    {
      t: 'De JavaScript a GLSL: los tipos',
      body: () => [
        table(['En JS (`value`)', 'En GLSL'], [
          ['un número', '`float`'],
          ['`new THREE.Vector2()`', '`vec2`'],
          ['`new THREE.Vector3()` o `new THREE.Color()`', '`vec3`'],
          ['`new THREE.Matrix4()`', '`mat4`'],
          ['una textura', '`sampler2D`'],
          ['`true` / `false`', '`bool`'],
        ]),
        P('Y en el shader se declara con el **mismo nombre**: `uniform vec2 uFrequency;`.'),
      ],
      check: {
        type: 'mc',
        q: 'Pasas `uColor: { value: new THREE.Color("orange") }`. ¿Cómo lo declaras en el shader?',
        options: ['`uniform float uColor;`', '`uniform vec3 uColor;`', '`uniform color uColor;`'],
        answer: 1,
        why: 'Un color son 3 números (r, g, b) → `vec3`. En GLSL no existe el tipo `color`.',
      },
    },

    /* 7 ------------------------------------------------------------------ */
    {
      t: 'ShaderMaterial o RawShaderMaterial',
      body: () => [
        P('En la demo usamos `modelMatrix`, `projectionMatrix` y `position` **sin declararlos**. Te los regala `ShaderMaterial`: pega esas declaraciones encima de tu código antes de compilar.'),
        table(['', '`ShaderMaterial`', '`RawShaderMaterial`'], [
          ['Matrices y `cameraPosition`', 'Ya declaradas', 'Las declaras tú'],
          ['`position`, `normal`, `uv`', 'Ya declarados', 'Los declaras tú'],
          ['`precision`', 'La pone Three.js', 'La escribes tú'],
        ]),
        callout('idea', 'Pista para Modified materials', [P('`MeshStandardMaterial` **también es un shader**, solo que enorme. En la lección final no escribirás uno desde cero: meterás unas pocas líneas tuyas **dentro** de ese shader ya hecho.')]),
      ],
      more: () => [
        codeBlock({
          title: 'raw-vertex.glsl · RawShaderMaterial',
          lang: 'glsl',
          code: `
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec3 position;

void main()
{
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`,
          notes: [
            ['uniform mat4', 'Con Raw hay que declarar cada matriz. Three.js las rellena porque conoce los nombres.'],
            ['attribute vec3 position', 'Con `ShaderMaterial` estas cuatro líneas sobrarían.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '¿Qué te ahorra `ShaderMaterial` frente a `RawShaderMaterial`?',
        options: ['Es más rápido en la GPU', 'Declarar las matrices, `position`, `uv`… y la precisión', 'Añade las luces de la escena solo'],
        answer: 1,
        why: 'La velocidad es la misma y ninguno de los dos trae luces. Solo te ahorra esas declaraciones.',
      },
    },
  ];
}
