// ============================================================================
// Modified materials — en tarjetas. La lección estrella del repaso.
// ============================================================================
import { h, P, UL, OL, callout, codeBlock, table, eq, figure } from '../ui.js';
import { chunkExplorer, miniLab, challengeLab } from '../lib/modified-ui.js';
import { SOLUTION_CODE } from '../lib/modified-lab.js';

/* Esquema: cuándo se ejecuta onBeforeCompile */
const HOOK_SVG = `
<svg viewBox="0 0 1000 190" role="img" aria-label="Cuándo se ejecuta onBeforeCompile">
  <defs><marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#97a0b4"/></marker></defs>
  <rect x="8" y="40" width="178" height="110" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="97" y="72" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">1 · Primer render</text>
  <text x="97" y="96" text-anchor="middle" fill="#97a0b4" font-size="12.5">renderer.render(...)</text>
  <text x="97" y="116" text-anchor="middle" fill="#97a0b4" font-size="12.5">necesita el shader del</text>
  <text x="97" y="134" text-anchor="middle" fill="#97a0b4" font-size="12.5">material</text>
  <path d="M190 95 H214" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr2)"/>
  <rect x="218" y="40" width="190" height="110" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="313" y="72" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">2 · Three.js monta</text>
  <text x="313" y="92" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">el texto</text>
  <text x="313" y="116" text-anchor="middle" fill="#97a0b4" font-size="12.5">vertexShader con sus</text>
  <text x="313" y="134" text-anchor="middle" fill="#97a0b4" font-size="12.5">#include sin resolver</text>
  <path d="M412 95 H436" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr2)"/>
  <rect x="440" y="24" width="210" height="142" rx="12" fill="#a493ff22" stroke="#a493ff" stroke-width="2"/>
  <text x="545" y="56" text-anchor="middle" fill="#a493ff" font-size="14" font-weight="650">3 · onBeforeCompile</text>
  <text x="545" y="80" text-anchor="middle" fill="#fff" font-size="13" font-family="JetBrains Mono, monospace">(shader) =&gt; { … }</text>
  <text x="545" y="108" text-anchor="middle" fill="#c9cedb" font-size="12.5">¡Tu código! Puedes cambiar</text>
  <text x="545" y="126" text-anchor="middle" fill="#c9cedb" font-size="12.5">shader.vertexShader, el</text>
  <text x="545" y="144" text-anchor="middle" fill="#c9cedb" font-size="12.5">fragmentShader y los uniforms</text>
  <path d="M654 95 H678" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr2)"/>
  <rect x="682" y="40" width="150" height="110" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="757" y="72" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">4 · Se resuelven</text>
  <text x="757" y="92" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">los #include</text>
  <text x="757" y="120" text-anchor="middle" fill="#97a0b4" font-size="12.5">cada línea se cambia</text>
  <text x="757" y="138" text-anchor="middle" fill="#97a0b4" font-size="12.5">por su chunk</text>
  <path d="M836 95 H860" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr2)"/>
  <rect x="864" y="40" width="128" height="110" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="928" y="72" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">5 · La GPU</text>
  <text x="928" y="92" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">compila</text>
  <text x="928" y="120" text-anchor="middle" fill="#97a0b4" font-size="12.5">y ya está listo</text>
  <text x="928" y="138" text-anchor="middle" fill="#97a0b4" font-size="12.5">para dibujar</text>
</svg>`;

/* Esquema: orden de los chunks en main() */
const ORDER_SVG = `
<svg viewBox="0 0 1000 150" role="img" aria-label="Orden de los chunks que importan en main()">
  <defs><marker id="arr3" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#97a0b4"/></marker></defs>
  <text x="8" y="22" fill="#97a0b4" font-size="13" font-weight="600">Orden dentro de main() del vertex shader (de arriba abajo en el código = de izquierda a derecha aquí)</text>
  <rect x="8" y="40" width="170" height="90" rx="12" fill="#a493ff1c" stroke="#a493ff"/>
  <text x="93" y="70" text-anchor="middle" fill="#a493ff" font-size="14" font-weight="650">common</text>
  <text x="93" y="92" text-anchor="middle" fill="#97a0b4" font-size="12.5">ANTES de main()</text>
  <text x="93" y="110" text-anchor="middle" fill="#97a0b4" font-size="12.5">funciones y uniforms</text>
  <path d="M182 85 H236" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr3)"/>
  <rect x="240" y="40" width="200" height="90" rx="12" fill="#242833" stroke="#4cc9e0"/>
  <text x="340" y="70" text-anchor="middle" fill="#4cc9e0" font-size="14" font-weight="650">beginnormal_vertex</text>
  <text x="340" y="92" text-anchor="middle" fill="#c9cedb" font-size="12.5">crea objectNormal</text>
  <text x="340" y="110" text-anchor="middle" fill="#97a0b4" font-size="12.5">(la normal)</text>
  <path d="M444 85 H498" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr3)"/>
  <rect x="502" y="40" width="180" height="90" rx="12" fill="#242833" stroke="#97a0b4"/>
  <text x="592" y="70" text-anchor="middle" fill="#fff" font-size="14" font-weight="650">normal_vertex…</text>
  <text x="592" y="92" text-anchor="middle" fill="#97a0b4" font-size="12.5">usan la normal para</text>
  <text x="592" y="110" text-anchor="middle" fill="#97a0b4" font-size="12.5">la iluminación</text>
  <path d="M686 85 H740" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr3)"/>
  <rect x="744" y="40" width="130" height="90" rx="12" fill="#242833" stroke="#f472b6"/>
  <text x="809" y="70" text-anchor="middle" fill="#f472b6" font-size="14" font-weight="650">begin_vertex</text>
  <text x="809" y="92" text-anchor="middle" fill="#c9cedb" font-size="12.5">crea transformed</text>
  <text x="809" y="110" text-anchor="middle" fill="#97a0b4" font-size="12.5">(la posición)</text>
  <path d="M878 85 H910" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr3)"/>
  <rect x="914" y="40" width="80" height="90" rx="12" fill="#242833" stroke="#97a0b4"/>
  <text x="954" y="76" text-anchor="middle" fill="#fff" font-size="13" font-weight="650">project_</text>
  <text x="954" y="94" text-anchor="middle" fill="#fff" font-size="13" font-weight="650">vertex</text>
  <text x="954" y="114" text-anchor="middle" fill="#97a0b4" font-size="11.5">gl_Position</text>
</svg>`;

const BASE = { hook: true, beginMode: 'include' };
const TWIST = { ...BASE, twist: 'height', animate: true };

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Qué vamos a construir',
      body: () => [
        miniLab({ ...TWIST, depth: true, normals: true, slider: true }, {
          title: 'El resultado final',
          caption: 'Una columna que se **retuerce animada**, con su **sombra** y su **iluminación** siguiendo el giro. Gira la cámara y mueve el slider.',
          showStatus: false,
        }),
        P('Esto es un `MeshStandardMaterial` normal —con su textura, sus luces y sus sombras— al que le hemos **inyectado unas líneas de shader**. Esa es la técnica de esta lección: en vez de reescribir un material desde cero, retocamos uno que ya existe.'),
      ],
      more: () => [
        P('Hasta ahora tenías dos opciones: usar los materiales de Three.js tal cual (sin poder deformarlos) o escribir un `ShaderMaterial` desde cero (y entonces pierdes toda la física de la luz, las sombras y las texturas que Three.js ya resuelve: cientos de líneas de shader). La tercera vía es quedarte **todo** lo del material y añadir solo tu efecto.'),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué no hacemos este efecto con un `ShaderMaterial` escrito desde cero?',
        options: [
          'Porque `ShaderMaterial` no permite mover vértices',
          'Porque perderíamos las luces, sombras y texturas que `MeshStandardMaterial` ya calcula',
          'Porque sería más lento para la GPU',
        ],
        answer: 1,
        why: 'Un `ShaderMaterial` empieza vacío: tendrías que reescribir tú toda la iluminación física. Retocando el material existente conservas todo eso y añades solo la torsión.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'El gancho: onBeforeCompile',
      body: () => [
        figure(h('div', { html: HOOK_SVG })),
        P('Un material no tiene un shader «guardado»: Three.js **monta el texto** del shader la primera vez que lo necesita. Justo antes de dárselo a la GPU, mira si el material tiene una función `onBeforeCompile` y, si existe, **la llama** con todo lo que va a compilar:'),
        codeBlock({
          title: 'main.js', lang: 'js',
          code: `
material.onBeforeCompile = (shader) =>
{
    console.log(shader)
}`,
          notes: [
            ['material.onBeforeCompile', 'Asignamos **una función**. Three.js la llamará justo antes de compilar (paso 3 del esquema).'],
            ['console.log(shader)', 'El objeto `shader` trae tres cosas: `shader.vertexShader` (texto), `shader.fragmentShader` (texto) y `shader.uniforms` (objeto).'],
          ],
        }),
      ],
      more: () => [
        P('`onBeforeCompile` se ejecuta **una vez** (cuando se compila), no en cada frame. Si lo asignas cuando el material ya se está dibujando, avisa con `material.needsUpdate = true` para forzar la recompilación. Y si dos materiales distintos llevan hooks distintos pero Three.js los confunde (comparten shader), dales un `material.customProgramCacheKey = () => \'miClave\'`.'),
      ],
      check: {
        type: 'mc',
        q: '¿Cuándo llama Three.js a tu función `onBeforeCompile`?',
        options: [
          'En cada frame, antes de dibujar',
          'Una sola vez, justo antes de compilar el shader del material',
          'Cada vez que la cámara se mueve',
        ],
        answer: 1,
        why: 'Solo al compilar. Por eso, para animar, no podremos «entrar» cada frame: usaremos un uniform que sí se actualiza cada frame (tarjeta 7).',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Los chunks: el shader por piezas',
      body: () => [
        P('El `shader.vertexShader` que recibes es un texto lleno de líneas `#include <nombre>`. Cada una es un **chunk**: un trozo de shader que Three.js guarda aparte y comparte entre materiales. Antes de compilar, cada `#include` se sustituye por su texto y todo queda en **un único shader**.'),
        P('Explóralo con datos reales. A la izquierda, el vertexShader de `MeshStandardMaterial`; elige un chunk y a la derecha verás **qué contiene**:'),
        chunkExplorer(),
      ],
      check: {
        type: 'mc',
        q: 'De estos chunks, ¿cuál declara `transformed`, la variable con la **posición** del vértice que podremos modificar?',
        options: ['`common`', '`begin_vertex`', '`project_vertex`', '`beginnormal_vertex`'],
        answer: 1,
        why: '`begin_vertex` hace `vec3 transformed = vec3(position);`. Después, `project_vertex` usa `transformed` para calcular `gl_Position` — por eso lo que cambies ahí se ve en pantalla. `beginnormal_vertex` declara la normal (`objectNormal`) y `common` va antes de `main()`.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Escribir dentro: replace',
      body: () => [
        P('El shader es **un string de JavaScript**. Para añadir código en un punto, buscamos su `#include` y lo reemplazamos **por él mismo más nuestras líneas**, con el `replace` de toda la vida:'),
        eq(`'hola #include <x> adiós'.replace('#include <x>', 'MI TEXTO')\n   →  'hola MI TEXTO adiós'`),
        codeBlock({
          title: 'main.js', lang: 'js',
          code: `
shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    \`
        #include <begin_vertex>

        // aquí irá nuestro código
    \`
)`,
          notes: [
            ['shader.vertexShader = shader', '`replace` **no modifica** el string: devuelve uno nuevo. Hay que guardarlo de vuelta.'],
            ['#include <begin_vertex>', 'Devolvemos el include para no romper nada: `transformed` se sigue declarando, y justo debajo tenemos **un sitio donde escribir**.'],
          ],
        }),
      ],
      check: {
        type: 'predict',
        q: 'Predice: ¿qué pasa si reemplazas `#include <begin_vertex>` por una cadena **vacía** `\'\'`?',
        options: [
          'Nada: ese chunk era opcional',
          'El objeto se dibuja sin textura',
          'Error de compilación en la GPU: `transformed` deja de existir',
        ],
        answer: 2,
        why: '`begin_vertex` es quien declara `transformed`, y `project_vertex` lo necesita después. La GPU protesta con `\'transformed\' : undeclared identifier`. Compruébalo abajo: es el error real.',
        reveal: () => miniLab({ ...BASE, beginMode: 'nothing' }, {
          title: 'Roto a propósito: replace por nada',
          caption: 'El panel muestra el **error real de la GPU**. Fíjate: el dibujo conserva el último material válido (el normal).',
          aspect: '16 / 9',
        }),
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'Mover vértices: transformed',
      body: () => [
        miniLab({ ...BASE, moveY: true }, {
          title: 'transformed.y += 3.0',
          caption: 'La columna sube 3 unidades… pero **su sombra se queda en el suelo**. Guárdate ese detalle: lo arreglamos en la tarjeta 9.',
          aspect: '16 / 9',
        }),
        P('`transformed` es un `vec3` con la posición del vértice. Todo lo que le hagas **después** del `#include` llega a la pantalla, porque `project_vertex` lo lee más abajo. La línea inyectada aquí es:'),
        eq('transformed.y += 3.0;'),
        P('Recuerda GLSL: `3.0` con punto, y `;` al final. Esto mueve **todos** los vértices igual; para retorcer necesitamos que cada uno se mueva distinto.'),
      ],
      check: {
        type: 'fill',
        q: 'Completa la línea que empuja cada vértice 2 unidades a la derecha (eje x):',
        pre: '', post: '.x += 2.0;',
        answer: 'transformed',
        accept: ['transformed'],
        placeholder: 'variable',
        size: 14,
        why: 'Se modifica `transformed` (la copia que declara `begin_vertex`), nunca `position`: `position` es un atributo de solo lectura.',
      },
    },

    /* 6 ------------------------------------------------------------------ */
    {
      t: 'La torsión: un ángulo por altura',
      body: () => [
        miniLab({ ...BASE, twist: 'height' }, {
          title: 'Ángulo según la altura',
          caption: 'Activa y desactiva la casilla para comparar: con ángulo **fijo**, la columna solo rota; con ángulo **según la altura**, se retuerce.',
          aspect: '16 / 9',
          compare: { label: 'Ángulo según la altura (si no, fijo 0.3)', initial: true, on: { ...BASE, twist: 'height' }, off: { ...BASE, twist: 'const' } },
        }),
        P('Giramos `x` y `z` con la `mat2` de la lección de [matrices](#/matrices), dejando `y` quieta. La clave está en el ángulo: `position.y * 0.9` — **cuanto más alto el vértice, más gira**:'),
        table(['`position.y`', 'ángulo = y × 0.9', 'qué hace'], [
          ['−4 (base)', '−3.6 rad (−206°)', 'gira al lado contrario'],
          ['0 (medio)', '0 rad', 'quieto'],
          ['4 (arriba)', '3.6 rad (206°)', 'más de media vuelta'],
        ]),
      ],
      more: () => [
        P('Usamos `position.y` (el atributo original, que nunca cambia) y no `transformed.y`, para que el ángulo dependa de la altura **inicial** del vértice aunque antes lo hayas movido. Las dos líneas inyectadas en `begin_vertex` son: `float angle = position.y * 0.9;` y `transformed.xz = get2dRotateMatrix(angle) * transformed.xz;`. El `0.9` decide cuánto retuerce.'),
      ],
      check: {
        type: 'mc',
        q: 'Con `float angle = 0.3;` (igual para todos los vértices), ¿qué se ve?',
        options: [
          'La columna se retuerce suavemente',
          'La columna entera rota 0.3 rad, rígida, sin deformarse',
          'Solo gira la parte de arriba',
        ],
        answer: 1,
        why: 'Torsión = **ángulos distintos** por vértice. Si todos giran lo mismo, es una rotación rígida, como hacer `mesh.rotation.y = 0.3` (pero más cara).',
      },
    },

    /* 7 ------------------------------------------------------------------ */
    {
      t: 'La función va en common',
      body: () => [
        P('`get2dRotateMatrix` no existe en GLSL: hay que **definirla en el shader**, fuera de `main()` y antes de usarla. El chunk `common` está exactamente ahí, así que lo reemplazamos igual que antes:'),
        codeBlock({
          title: 'main.js', lang: 'js',
          code: `
shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    \`
        #include <common>

        mat2 get2dRotateMatrix(float _angle)
        {
            return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
        }
    \`
)`,
          notes: [
            ["'#include <common>'", '`common` se incluye **antes de `main()`**: lo que pongas aquí vale para todo el shader.'],
            ['mat2 get2dRotateMatrix', 'La matriz de rotación 2D de la lección de matrices, tal cual.'],
          ],
        }),
        figure(h('div', { html: ORDER_SVG })),
      ],
      check: {
        type: 'order',
        q: 'Ordena las tres piezas como quedan en el shader final (de arriba abajo):',
        lines: [
          'mat2 get2dRotateMatrix(...) { ... }   // en <common>, fuera de main',
          'float angle = position.y * 0.9;       // en <begin_vertex>',
          'transformed.xz = rotateMatrix * transformed.xz;',
        ],
        why: 'Las funciones viven antes de `main()` (chunk `common`); dentro de `main()`, primero calculas el ángulo y luego lo aplicas a `transformed`.',
      },
    },

    /* 8 ------------------------------------------------------------------ */
    {
      t: 'Animar: uTime y customUniforms',
      body: () => [
        miniLab(TWIST, {
          title: 'La torsión, animada',
          caption: 'El ángulo ahora es `(position.y + uTime) * 0.9`. Cada frame, `uTime` sube y el patrón de giro «viaja».',
          aspect: '16 / 9',
        }),
        P('Problema: el objeto `shader` **solo existe dentro del hook**, y los materiales estándar no tienen `material.uniforms`. ¿Cómo actualiza el `tick` un uniform al que no llega? Con un objeto compartido:'),
        codeBlock({
          title: 'main.js', lang: 'js',
          code: `
const customUniforms = {
    uTime: { value: 0 }
}

material.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime
    // ... y en <common>:  uniform float uTime;
}

const tick = () =>
{
    customUniforms.uTime.value = clock.getElapsedTime()
}`,
          notes: [
            ['const customUniforms', '**Fuera** del hook, donde el `tick` también lo ve.'],
            ['shader.uniforms.uTime = customUniforms.uTime', 'No copiamos el número: enchufamos **el mismo objeto** `{ value }`. JavaScript pasa objetos por referencia.'],
            ['customUniforms.uTime.value', 'El tick cambia `value`… y el shader lo ve, porque es el mismo objeto.'],
          ],
        }),
      ],
      more: () => [
        P('No olvides declararlo en el shader: `uniform float uTime;` dentro del reemplazo de `common` (antes de la función). Sin esa línea, la GPU dirá `\'uTime\' : undeclared identifier`. Ejemplo numérico: a los 2 s, un vértice con `y = 1` gira `(1 + 2) × 0.9 = 2.7 rad`.'),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué funciona `shader.uniforms.uTime = customUniforms.uTime` para animar?',
        options: [
          'Porque copia el valor actual de uTime al shader',
          'Porque ambos nombres apuntan al **mismo objeto** `{ value }`: lo que cambie el tick, lo ve el shader',
          'Porque obliga a recompilar el shader cada frame',
        ],
        answer: 1,
        why: 'Es una referencia compartida, no una copia. El shader se compila una vez; el `value` del objeto cambia cada frame y la GPU lo recibe como uniform.',
      },
    },

    /* 9 ------------------------------------------------------------------ */
    {
      t: 'La sombra no se entera',
      body: () => [
        miniLab(TWIST, {
          title: 'Columna retorcida, sombra recta',
          caption: 'Mira el suelo y la pared: la columna se retuerce pero **su sombra sigue recta**.',
          aspect: '16 / 9',
        }),
        callout('analogy', 'La foto de la luz', [
          P('Para calcular sombras, Three.js hace primero una «foto» de la escena **desde la luz**, que solo guarda distancias (un mapa de profundidad). Y para esa foto **sustituye todos los materiales por un `MeshDepthMaterial`**… que no sabe nada de nuestra torsión. Dibuja la columna recta → sombra recta.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué la sombra no se retuerce, si el material ya tiene el hook?',
        options: [
          'Porque las sombras se calculan en el fragment shader',
          'Porque el mapa de sombras se dibuja con **otro material** (`MeshDepthMaterial`), que no lleva nuestro hook',
          'Porque el mapa de sombras tiene poca resolución',
        ],
        answer: 1,
        why: 'Nuestro `onBeforeCompile` vive en el `MeshStandardMaterial`. La «foto de profundidad» se hace con un material distinto que dibuja la geometría sin torsión.',
      },
    },

    /* 10 ----------------------------------------------------------------- */
    {
      t: 'Arreglarla: customDepthMaterial',
      body: () => [
        miniLab({ ...TWIST, depth: true }, {
          title: 'Sombra arreglada',
          caption: 'Activa y desactiva la casilla para comparar la sombra del suelo y de la pared.',
          aspect: '16 / 9',
          compare: { label: 'customDepthMaterial con la torsión', initial: true, on: { ...TWIST, depth: true }, off: TWIST },
        }),
        P('La solución: darle a la malla **nuestro propio material de profundidad** y retorcerlo exactamente igual:'),
        codeBlock({
          title: 'main.js', lang: 'js',
          code: `
const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking
})

mesh.customDepthMaterial = depthMaterial

depthMaterial.onBeforeCompile = (shader) =>
{
    // los MISMOS replace de <common> y <begin_vertex>
}`,
          notes: [
            ['depthPacking', 'Cómo se guarda la profundidad en los canales RGBA, para más precisión. Se pone tal cual.'],
            ['mesh.customDepthMaterial', '«Cuando te dibujes en el mapa de sombras, usa este material.»'],
            ['depthMaterial.onBeforeCompile', 'El mismo truco, con la **misma** torsión: si difieren, modelo y sombra se separan.'],
          ],
        }),
        callout('remember', 'Regla de oro', [P('Todo lo que cambie la **posición** en el material principal debe repetirse en el `depthMaterial`.')]),
      ],
      check: {
        type: 'fill',
        q: 'Completa: ¿en qué propiedad de la **malla** se asigna el material de profundidad?',
        pre: 'mesh.', post: ' = depthMaterial',
        answer: 'customDepthMaterial',
        accept: ['customDepthMaterial'],
        placeholder: 'propiedad',
        size: 22,
        why: 'Es una propiedad de la malla (no del material). Si el modelo tuviera varias mallas, habría que asignarlo en cada una.',
      },
    },

    /* 11 ----------------------------------------------------------------- */
    {
      t: 'La luz se ve rara: las normales',
      body: () => [
        miniLab({ ...TWIST, depth: true, normals: true }, {
          title: 'Normales: antes y después',
          caption: 'Desactiva la casilla y mira los laterales: la luz **no sigue** la superficie retorcida. Actívala y la iluminación gira con ella.',
          aspect: '16 / 9',
          compare: { label: 'Girar también las normales', initial: false, on: { ...TWIST, depth: true, normals: true }, off: { ...TWIST, depth: true } },
        }),
        P('Una **normal** es la flecha perpendicular a la superficie en cada vértice; la luz la usa para decidir el brillo. Hemos girado los vértices (`transformed`) pero **no las flechas** (`objectNormal`): la luz sigue creyendo que la superficie mira a donde miraba antes.'),
        eq(`cara lateral derecha: normal = (1, 0, 0)\ntras girar 90°:  superficie mira a (0, 0, 1)\n  sin arreglar → normal sigue (1, 0, 0)  ✘\n  arreglada    → normal pasa a (0, 0, 1) ✔`),
      ],
      check: {
        type: 'mc',
        q: 'Tras retorcer los vértices, ¿por qué los laterales se iluminan «como si nada hubiera pasado»?',
        options: [
          'Porque la luz no alcanza los vértices movidos',
          'Porque las normales siguen apuntando a donde apuntaban antes del giro',
          'Porque falta subir la intensidad de la luz',
        ],
        answer: 1,
        why: 'El brillo se calcula con la normal. Si mueves la superficie pero no giras su normal, la iluminación queda «congelada» en la pose original.',
      },
    },

    /* 12 ----------------------------------------------------------------- */
    {
      t: 'El error de la redefinición',
      body: () => [
        P('Para girar la normal hay que inyectar el giro en `beginnormal_vertex` (el chunk que declara `objectNormal`). La tentación es copiar las **mismas dos líneas** que ya tienes en `begin_vertex`… y falla:'),
        miniLab({ ...TWIST, depth: true, normals: true, dup: true }, {
          title: 'Roto a propósito: angle declarado dos veces',
          caption: 'Error real: `\'angle\' : redefinition`. Todos los chunks acaban **fusionados en un único shader**, así que `angle` y `rotateMatrix` quedan declaradas dos veces dentro del mismo `main()`.',
          aspect: '16 / 9',
        }),
        P('La solución aprovecha el **orden**: `beginnormal_vertex` va *antes* que `begin_vertex`. Declara las variables solo en el primero y en el segundo **úsalas** sin declararlas:'),
        codeBlock({
          title: 'main.js · la versión buena', lang: 'js',
          code: `
shader.vertexShader = shader.vertexShader.replace(
    '#include <beginnormal_vertex>',
    \`
        #include <beginnormal_vertex>

        float angle = (position.y + uTime) * 0.9;
        mat2 rotateMatrix = get2dRotateMatrix(angle);

        objectNormal.xz = rotateMatrix * objectNormal.xz;
    \`
)

shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    \`
        #include <begin_vertex>

        transformed.xz = rotateMatrix * transformed.xz;
    \`
)`,
          notes: [
            ['float angle', 'Declaradas **una sola vez**, en el chunk que va antes.'],
            ['objectNormal.xz', 'La normal gira con la misma matriz.'],
            ['transformed.xz = rotateMatrix', 'Aquí ya no se declara nada: `rotateMatrix` existe de antes.'],
          ],
        }),
      ],
      more: () => [
        P('Ojo: el `depthMaterial` es distinto. No usa normales (solo dibuja distancias) y su shader **no incluye** `beginnormal_vertex`, así que en él `angle` y `rotateMatrix` se siguen declarando dentro de `begin_vertex`, como en la tarjeta 10.'),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué da `\'angle\' : redefinition` si las dos declaraciones están en chunks distintos?',
        options: [
          'Porque `angle` es una palabra reservada de GLSL',
          'Porque los chunks se fusionan en **un único** `main()`: la variable queda declarada dos veces en el mismo ámbito',
          'Porque el depthMaterial también la declara',
        ],
        answer: 1,
        why: 'Los `#include` son solo texto que se pega. Al final hay un único shader, y GLSL no permite dos `float angle` en el mismo bloque.',
      },
    },

    /* 13 ----------------------------------------------------------------- */
    {
      t: 'Ir más lejos: otras fórmulas',
      body: () => [
        miniLab({ ...TWIST, depth: true, normals: true, formula: 'sin', slider: true }, {
          title: 'Seno + uniform uTwist',
          caption: 'Fórmula `sin(position.y + uTime) * uTwist`: la columna se balancea como un junco. El slider cambia `uTwist` **sin recompilar nada**.',
          aspect: '16 / 9',
        }),
        P('Ya tienes todo el mecanismo; ahora el efecto es solo **la fórmula del ángulo**. `sin(...)` oscila entre −1 y 1, así que el ángulo va y viene en vez de crecer. Y la intensidad puede ser otro uniform (`uTwist`) controlado desde un slider o el ratón, con la misma receta que `uTime`.'),
      ],
      more: () => [
        UL([
          '`uTwist` se añade igual: a `customUniforms`, a `shader.uniforms`, y `uniform float uTwist;` en `common`.',
          'Recuerda cambiar la fórmula **también en el depthMaterial**, o la sombra se balanceará distinto que el modelo.',
          'Otras ideas: `angle` según la distancia al centro (`length(position.xz)`), o ruido con una textura.',
        ]),
      ],
      check: {
        type: 'fill',
        q: 'Completa la fórmula del balanceo (oscila en vez de crecer):',
        pre: 'float angle = ', post: '(position.y + uTime) * uTwist;',
        answer: 'sin',
        accept: ['sin'],
        placeholder: 'función',
        size: 8,
        why: '`sin` convierte un valor que crece sin parar en una oscilación entre −1 y 1: por eso la columna va y viene.',
      },
    },

    /* 14 ----------------------------------------------------------------- */
    {
      t: 'Así encaja en tu proyecto',
      body: () => [
        P('En el proyecto del curso no hay una columna: hay la cabeza de Lee Perry-Smith cargada con `GLTFLoader`. Las piezas son las mismas; esto es **dónde va cada una** en tu `script.js`:'),
        codeBlock({
          title: 'script.js (esqueleto)', lang: 'js',
          code: `
const material = new THREE.MeshStandardMaterial({
    map: mapTexture,
    normalMap: normalTexture
})

const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking
})

const customUniforms = {
    uTime: { value: 0 }
}

material.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime
    // replace <common>  +  <beginnormal_vertex>  +  <begin_vertex>
}

depthMaterial.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime
    // replace <common>  +  <begin_vertex>
}

gltfLoader.load('/models/LeePerrySmith/LeePerrySmith.glb', (gltf) =>
{
    const mesh = gltf.scene.children[0]
    mesh.material = material
    mesh.customDepthMaterial = depthMaterial
    scene.add(mesh)
})

const tick = () =>
{
    customUniforms.uTime.value = clock.getElapsedTime()
}`,
          notes: [
            ['const material', 'El material normal del curso, con sus texturas. No es un ShaderMaterial.'],
            ['material.onBeforeCompile', 'Tres replace: `common`, `beginnormal_vertex`, `begin_vertex`.'],
            ['depthMaterial.onBeforeCompile', 'Solo dos: `common` y `begin_vertex` (sin normales).'],
            ['mesh.customDepthMaterial', 'Dentro del callback del loader, cuando la malla ya existe.'],
            ['customUniforms.uTime.value', 'El tick alimenta el uniform compartido.'],
          ],
        }),
      ],
      more: () => [
        table(['Síntoma', 'Causa', 'Arreglo'], [
          ['No cambia nada', 'El texto del `replace` no existe (errata) y no avisa', '`console.log(shader.vertexShader)`'],
          ['Pantalla negra / objeto invisible', 'Error de compilación de la GPU', 'Mira la consola (F12)'],
          ['`\'transformed\' : undeclared`', 'Quitaste `#include <begin_vertex>`', 'Devuélvelo'],
          ['`\'angle\' : redefinition`', 'Declarada en dos chunks', 'Solo en `beginnormal_vertex`'],
          ['`\'uTime\' : undeclared`', 'Falta `uniform float uTime;`', 'En `common`'],
          ['No se anima', 'Falta enchufar `customUniforms` o actualizar `value` en el tick', 'Tarjeta 8'],
          ['Sombra recta', 'Falta `customDepthMaterial` + su hook', 'Tarjeta 10'],
          ['Luz rara', 'No giraste `objectNormal`', 'Tarjetas 11–12'],
        ]),
      ],
      check: {
        type: 'order',
        q: 'Ordena el flujo completo del efecto, de la causa al resultado:',
        lines: [
          'onBeforeCompile recibe el shader como texto',
          'replace inyecta tu código tras los #include',
          'la GPU compila el shader modificado una vez',
          'cada frame, el tick actualiza customUniforms.uTime.value',
        ],
        why: 'Compilar pasa una sola vez; lo único que cambia cada frame es el valor del uniform.',
      },
    },

    /* 15 ----------------------------------------------------------------- */
    {
      t: 'Tu turno: escríbelo tú',
      body: () => [
        P('Esta es la meta de toda la lección: escribir el efecto **tú, sin mirar**. El editor ejecuta tu código de verdad; la lista detecta qué piezas llevas y los errores que veas son los reales de la GPU.'),
        callout('tip', 'Método recomendado', [
          OL([
            'Gancho + función `mat2` + giro con ángulo fijo. ¿Rota? Bien.',
            'Ángulo según `position.y`. ¿Se retuerce? Bien.',
            '`uTime` (customUniforms) para animar.',
            '`customDepthMaterial` para la sombra.',
            'Las normales, al final.',
          ]),
        ]),
        challengeLab(),
        h('details', {}, h('summary', {}, 'Pista 1 · No compila / no cambia nada'),
          P('Comprueba que buscas exactamente `#include <begin_vertex>` (sin espacios de más). Si `replace` no encuentra el texto, no avisa: no hace nada. Mira el shader con `console.log(shader.vertexShader)`.')),
        h('details', {}, h('summary', {}, 'Pista 2 · `\'uTime\' : undeclared identifier`'),
          P('Falta `uniform float uTime;` en el chunk `common`. Y no olvides `shader.uniforms.uTime = customUniforms.uTime`.')),
        h('details', {}, h('summary', {}, 'Pista 3 · La sombra no se retuerce'),
          P('Tres cosas: `new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })`, `mesh.customDepthMaterial = depthMaterial`, y su propio `onBeforeCompile` con el mismo giro.')),
        h('details', {}, h('summary', {}, 'Pista 4 · `\'angle\' : redefinition`'),
          P('La declaraste en dos chunks. Déjala solo en `beginnormal_vertex`; en `begin_vertex`, usa `transformed.xz = rotateMatrix * transformed.xz;` a secas.')),
        h('details', {}, h('summary', {}, 'Ver la solución completa'),
          codeBlock({ title: 'Solución', lang: 'js', code: SOLUTION_CODE, notesOpen: false, notes: [] })),
      ],
    },
  ];
}
