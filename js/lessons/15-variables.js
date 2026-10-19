import { h, P, H2, H3, UL, callout, codeBlock, liveCode, demo, table, quiz, eq, figure } from '../ui.js';

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

export default function render(root) {
  root.append(
    P('Un shader es un programa que vive en la GPU y **no puede leer tus variables de JavaScript**. Ni `elapsedTime`, ni el color que eliges en lil-gui, ni la posición del ratón. Para que el shader reciba datos hay que usar unos «canales» concretos. Hay tres, y cada uno tiene una palabra clave en GLSL.'),

    H2('Los tres canales'),
    figure(h('div', { html: FLOW_SVG })),
    table(['Canal', 'Qué es', 'Quién lo escribe', 'Quién lo lee', 'Ejemplo'], [
      ['**attribute**', 'Un dato **distinto para cada vértice**', 'Tu JS (dentro de la geometría)', 'Solo el vertex shader', '`position`, `uv`, `normal`, tu `aRandom`'],
      ['**uniform**', 'Un dato **igual para todo** el dibujado (todos los vértices y todos los píxeles)', 'Tu JS (en el material)', 'Vertex y fragment', '`uTime`, `uColor`, `uFrequency`'],
      ['**varying**', 'Un dato que el vertex shader **pasa al fragment shader**', 'El vertex shader', 'El fragment shader (ya interpolado)', '`vUv`, `vElevation`'],
    ]),
    callout('analogy', 'Una fábrica de camisetas', [
      P('Cada camiseta (vértice) llega con **su etiqueta** de talla y color: eso son los *attributes*. Hay un **cartel único** en la pared con las instrucciones del día («hoy bordamos en azul»): eso es un *uniform*, lo ve todo el mundo igual. Y cuando la camiseta pasa a la sección de pintado, el cortador le **escribe una nota** para el pintor: eso es un *varying*.'),
    ]),

    H3('Numéricamente: qué significa «interpolado»'),
    P('Un varying solo se escribe en los **vértices**, pero el fragment shader corre en **cada píxel**. Los píxeles que quedan entre vértices reciben una mezcla proporcional (lo viste en la demo de la GPU):'),
    eq(`vértice A: vElevation = 0.0\nvértice B: vElevation = 1.0\n\npíxel al 25 % del camino entre A y B → vElevation = 0.0·0.75 + 1.0·0.25 = 0.25\npíxel al 50 %                          → vElevation = 0.50\npíxel al 90 %                          → vElevation = 0.90`),

    H2('Cómo se crea un material con shaders'),
    P('`ShaderMaterial` es el material al que le das **tus dos shaders** (como texto) y tus uniforms:'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
const geometry = new THREE.PlaneGeometry(2, 2, 32, 32)

// attribute: un valor por vértice
const count = geometry.attributes.position.count
const randoms = new Float32Array(count)
for (let i = 0; i < count; i++) randoms[i] = Math.random()
geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

// material con tus shaders y tus uniforms
const material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        uTime: { value: 0 },
        uFrequency: { value: new THREE.Vector2(10, 5) },
        uColor: { value: new THREE.Color('orange') }
    }
})

const mesh = new THREE.Mesh(geometry, material)

// en el tick: actualizar el uniform cada frame
material.uniforms.uTime.value = elapsedTime`,
      notes: [
        ['PlaneGeometry(2, 2, 32, 32)', 'Un plano de 2×2 con 32×32 subdivisiones: **33 × 33 = 1089 vértices**. Sin subdivisiones no habría vértices que mover.'],
        ['position.count', 'Cuántos vértices tiene la geometría (1089). Necesitamos **un valor por vértice**.'],
        ['new Float32Array(count)', 'Una lista de números decimales de tamaño fijo. Los attributes viajan a la GPU como arrays tipados.'],
        ['setAttribute', 'Registra el array con el nombre `aRandom`. El `1` final significa **1 número por vértice** (para `position` serían 3: x, y, z). En el shader lo recibes como `attribute float aRandom`.'],
        ['new THREE.ShaderMaterial', 'Material que ejecuta **tu** código en vez del de Three.js.'],
        ['vertexShader: vertexShader', 'El texto (string) del vertex shader. En el curso viene de un archivo `.glsl` importado; aquí lo puedes escribir en un template string.'],
        ['uniforms: {', 'Cada uniform es un **objeto con una propiedad `value`**. Hay que respetar ese `{ value }`: Three.js lo mira cada frame.'],
        ['uFrequency', 'Un `Vector2` de Three.js llega al shader como `vec2`.'],
        ['uColor', 'Un `Color` de Three.js llega como `vec3` (r, g, b).'],
        ['uniforms.uTime.value', 'Así se actualiza un uniform: **se cambia `.value`** (no se crea un objeto nuevo). Esto va dentro del `tick`.'],
      ],
    }),
    callout('tip', 'Convención de nombres', [P('Es solo una costumbre del curso (GLSL no la obliga): **`a`**ttributes → `aRandom`, **`u`**niforms → `uTime`, **`v`**aryings → `vUv`. Te ayuda a saber de dónde viene cada variable al leer el shader.')]),

    H2('Pruébalo: los tres canales en vivo'),
    P('Esta demo es un `ShaderMaterial` real sobre un plano de 1089 vértices. Lo que ves en los paneles de código **es el shader que se está ejecutando**. Observa qué cambia al tocar cada cosa: los sliders (uniforms) cambian la ola sin recompilar nada; las casillas cambian el código mismo.'),
    demo({
      title: 'Attribute, uniform y varying',
      aspect: '4 / 3',
      caption: '**Sin varying:** el fragment shader no sabe nada de lo que hizo el vertex shader y pinta todo del mismo color (¡activa «wireframe» para ver el relieve!). **Con varying:** `vElevation` viaja de vértice a píxel y se convierte en color.',
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
    }),

    H2('ShaderMaterial frente a RawShaderMaterial'),
    P('Fíjate en que en la demo usamos `modelMatrix`, `viewMatrix`, `projectionMatrix` y `position` **sin declararlos**. Nos los regala `ShaderMaterial`: antes de compilar tu shader, Three.js le pega por encima un trozo de código con esas declaraciones. `RawShaderMaterial` no pega nada: es «crudo» y lo declaras tú todo.'),
    table(['', '`ShaderMaterial`', '`RawShaderMaterial`'], [
      ['Matrices (`modelMatrix`, `viewMatrix`, `projectionMatrix`, `modelViewMatrix`, `normalMatrix`) y `cameraPosition`', 'Ya declaradas', 'Las declaras tú (`uniform mat4 …`)'],
      ['Attributes `position`, `normal`, `uv`', 'Ya declarados', 'Los declaras tú (`attribute vec3 position;`)'],
      ['`precision`', 'La añade Three.js', 'La escribes tú (`precision mediump float;`)'],
      ['Uso típico', '**El que usarás casi siempre**', 'Para aprender cómo funciona por dentro'],
    ]),
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
        ['uniform mat4 projectionMatrix', 'Con `RawShaderMaterial` **hay que declarar** cada matriz que uses. Three.js las rellena solas porque conoce los nombres.'],
        ['attribute vec3 position', 'Y también cada attribute. Con `ShaderMaterial` no harían falta estas 5 líneas.'],
        ['gl_Position', 'El resto es lo mismo que ya conoces.'],
      ],
    }),
    callout('idea', 'Pista para la lección final', [
      P('Los materiales normales de Three.js (`MeshStandardMaterial`, `MeshBasicMaterial`…) **también son shaders**, pero enormes (luces, sombras, mapas…), montados juntando trozos de código de Three.js. En *Modified materials* no vas a escribir un shader desde cero: vas a **meter unas pocas líneas tuyas dentro** de uno de esos shaders ya hecho. Lo que has aprendido (uniforms, `position`, `gl_Position`) es exactamente lo mismo.'),
    ]),

    H2('Tipos de uniforms: de JS a GLSL'),
    table(['En JavaScript (`value`)', 'En GLSL', 'Ejemplo'], [
      ['Un número', '`float`', '`uTime: { value: 0 }`'],
      ['`new THREE.Vector2(x, y)`', '`vec2`', '`uFrequency: { value: new THREE.Vector2(10, 5) }`'],
      ['`new THREE.Vector3(x, y, z)` o `new THREE.Color(...)`', '`vec3`', '`uColor: { value: new THREE.Color("orange") }`'],
      ['`new THREE.Vector4(...)`', '`vec4`', '`uSize: { value: new THREE.Vector4(1, 2, 3, 4) }`'],
      ['`new THREE.Matrix3()` / `Matrix4()`', '`mat3` / `mat4`', '`uMatrix: { value: new THREE.Matrix4() }`'],
      ['Una `THREE.Texture`', '`sampler2D`', '`uTexture: { value: textureLoader.load("a.png") }`'],
      ['`true` / `false`', '`bool`', '`uActive: { value: true }`'],
    ]),
    P('Y en el shader declaras cada uno con el **mismo nombre**: `uniform float uTime;`, `uniform vec2 uFrequency;`, `uniform vec3 uColor;`. Si los nombres no coinciden, el shader recibirá `0` y no verás ningún error: es uno de los fallos más difíciles de ver.'),

    quiz([
      {
        q: 'Quieres que cada vértice tenga un número aleatorio distinto. ¿Qué canal usas?',
        options: ['uniform', 'attribute', 'varying', 'Ninguno, no se puede'],
        answer: 1,
        why: 'Un attribute lleva un valor por vértice, guardado en la geometría con `setAttribute`.',
      },
      {
        q: 'Quieres animar con el tiempo: un solo número igual para todos los vértices y píxeles, que cambia en cada frame. ¿Qué usas?',
        options: ['attribute', 'varying', 'uniform actualizado en el tick', 'Una constante en el shader'],
        answer: 2,
        why: 'Un uniform es igual para todos y lo actualizas desde JS cada frame: `material.uniforms.uTime.value = elapsedTime`.',
      },
      {
        q: 'El vertex shader escribe `vElevation = 0.0` en el vértice A y `1.0` en el B. Un píxel está al 40 % del camino de A a B. ¿Cuánto vale `vElevation` en el fragment shader?',
        options: ['0.0', '0.4', '0.6', '1.0'],
        answer: 1,
        why: 'El varying se interpola linealmente: 0.0·0.6 + 1.0·0.4 = 0.4.',
      },
      {
        q: 'Escribes `uniforms: { uTime: 0 }` y el shader siempre ve `uTime = 0`. ¿Qué falla?',
        options: ['Falta declarar el uniform en el fragment', 'Un uniform debe ser un objeto con `value`: `{ uTime: { value: 0 } }`', 'Los uniforms no pueden ser float', 'Hay que llamar a `renderer.update()`'],
        answer: 1,
        why: 'Three.js lee `uniforms.uTime.value`. Sin el objeto `{ value }`, nunca se actualiza correctamente.',
      },
      {
        q: '¿Qué ventaja tiene `ShaderMaterial` frente a `RawShaderMaterial`?',
        options: ['Es más rápido en la GPU', 'Three.js declara por ti las matrices, `position`, `uv`… y la precisión', 'Permite usar luces automáticamente', 'Admite más uniforms'],
        answer: 1,
        why: 'La velocidad es la misma. `ShaderMaterial` solo te ahorra escribir esas declaraciones (y las luces no vienen incluidas en ninguno de los dos).',
      },
    ]),
  );
}
