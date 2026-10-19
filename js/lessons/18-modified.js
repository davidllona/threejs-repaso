import { h, md, P, H2, H3, UL, OL, callout, codeBlock, table, quiz, eq, figure } from '../ui.js';
import { THREE } from '../stage.js';
import { chunkExplorer, guidedLab, challengeLab, STEPS } from '../lib/modified-ui.js';
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

/** Del shader real de MeshStandardMaterial, enseñamos todo (con tabuladores → espacios) */
const standardVertex = () => THREE.ShaderLib.standard.vertexShader.replace(/\t/g, '    ').replace(/^\n+/, '').replace(/\n\s*\n\s*\n/g, '\n\n').trim();

export default function render(root) {
  const ctl = { pending: 0, goTo: null, fig: null };
  const tryIt = (n) => h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', margin: '14px 0 26px' } },
    h('button', {
      class: 'btn primary',
      onClick: () => {
        ctl.pending = n;
        ctl.goTo?.(n);
        ctl.fig?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    }, `▶ Verlo en el laboratorio · paso ${n}`),
    h('span', { class: 'ctl-note', style: { margin: 0 } }, STEPS[n].t));

  const lab = guidedLab(ctl);
  lab.style.scrollMarginTop = '14px';

  root.append(
    P('Esta es la lección estrella: **retorcer un modelo con un shader sin perder luces, sombras ni texturas**. Hasta ahora, o usabas los materiales de Three.js (que no puedes editar) o creabas un `ShaderMaterial` desde cero (y perdías luces, sombras, texturas…). Aquí aprendes la tercera vía: **meter tu código dentro de un material que ya existe**.'),
    callout('analogy', 'La receta de cocina', [
      P('`MeshStandardMaterial` es como una receta de 200 pasos ya escrita (física de la luz, sombras, texturas…). Reescribirla entera es un trabajo enorme. Lo que haremos es **dejarle una nota al cocinero justo antes de que empiece**: «en el paso 35, antes de cortar las verduras, añade esto». Esa nota es el gancho `onBeforeCompile`, y los «pasos de la receta» se llaman **chunks**.'),
    ]),
    P('Al terminar la lección serás capaz de escribir tú solo este ejercicio. Por eso la web te lo hace **ejecutar de verdad**: abajo tienes un laboratorio con una columna 3D y, en cada paso, el código real que se ejecuta, el shader que Three.js compila y los errores que da la GPU.'),

    H2('Qué necesitas recordar'),
    P('Esta lección junta cosas de las anteriores. Si alguna no te suena, repásala primero (5 minutos cada una):'),
    UL([
      '**Uniforms** (`uTime`, `value`…): [Attributes, uniforms y varyings](#/variables).',
      '**`mat2` y rotaciones**: [Matrices y la rotación mat2](#/matrices).',
      '**Cómo se calculan las sombras** (el mapa de sombras): [Sombras](#/sombras).',
      '**Materiales y normales**: [Materiales](#/materiales) y [Luces](#/luces).',
    ]),

    H2('El plan: 8 pasos'),
    table(['#', 'Qué hacemos', 'La idea clave'], [
      ['1', 'Engancharnos al shader del material', '`material.onBeforeCompile`'],
      ['2', 'Encontrar **dónde** escribir', 'Los *chunks* y los `#include`'],
      ['3', 'Mover los vértices', '`transformed`'],
      ['4', 'Retorcerlos', '`mat2` + el ángulo depende de `position.y`'],
      ['5', 'Animarlo', 'Un uniform `uTime` y un objeto `customUniforms`'],
      ['6', 'Arreglar la sombra (no se retuerce)', '`customDepthMaterial`'],
      ['7', 'Arreglar la luz (se ve rara)', 'Las normales: `objectNormal`'],
      ['8', 'Ir más lejos', 'Otras fórmulas y controles'],
    ]),

    H2('El laboratorio'),
    P('Este laboratorio te acompañará toda la lección. Verás en cada paso unos botones **«Verlo en el laboratorio»** que te traen aquí con el paso ya preparado. También puedes usar los botones *Anterior/Siguiente* y las casillas por tu cuenta. Gira la cámara con el ratón.'),
    lab,

    /* ------------------------------------------------------------------ */
    H2('Paso 1 · Engancharse con onBeforeCompile'),
    P('Primero, entender **cuándo** podemos intervenir. Un material no tiene un shader «guardado»: Three.js lo **monta como un texto** la primera vez que lo necesita y se lo da a la GPU para compilar. Justo antes de compilar, mira si el material tiene una función llamada `onBeforeCompile` y, si la tienes, **la llama** pasándole el texto para que lo cambies:'),
    figure(h('div', { html: HOOK_SVG })),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
material.onBeforeCompile = (shader) =>
{
    console.log(shader)
}`,
      notes: [
        ['material.onBeforeCompile', 'Asignamos **una función** a esta propiedad del material (todos los materiales la tienen, vacía por defecto). Three.js la llamará antes de compilar. Esa función recibe un objeto, `shader`, con todo lo que va a compilar (puedes llamarlo como quieras; en el curso es `shader`).'],
        ['console.log(shader)', 'Para ver qué contiene. Ábrelo en la consola del navegador (F12): verás `vertexShader`, `fragmentShader` y `uniforms`.'],
      ],
    }),
    P('Lo importante de `shader`:'),
    UL([
      '`shader.vertexShader` → el **texto** (string) del vertex shader.',
      '`shader.fragmentShader` → el texto del fragment shader.',
      '`shader.uniforms` → el objeto con los uniforms del material (`diffuse`, `roughness`…). Podemos añadirle los nuestros.',
    ]),
    callout('warn', 'Solo se llama una vez', [
      P('`onBeforeCompile` se ejecuta **cuando se compila el material**, no en cada frame. Si lo asignas cuando el material ya se estaba dibujando, tienes que avisar con `material.needsUpdate = true` para que se recompile.'),
    ]),
    P('Fíjate en el vertexShader que se ve en el laboratorio (panel de abajo a la derecha): es un texto largo lleno de líneas como `#include <begin_vertex>`. Vamos a entender qué son.'),
    tryIt(1),

    /* ------------------------------------------------------------------ */
    H2('Paso 2 · Los chunks y los #include'),
    P('Three.js tiene decenas de materiales y todos comparten trozos de código (la niebla, el skinning, el mapa de sombras…). Para no repetirlos, guarda cada trozo en un fichero pequeño llamado **chunk** (en `three/src/renderers/shaders/ShaderChunk/`, y disponible en JS como `THREE.ShaderChunk`). En el shader de cada material, cada chunk aparece como **una línea `#include <nombre>`**. Al final, Three.js sustituye cada `#include` por el texto del chunk y lo junta todo en **un solo shader**.'),
    P('Este es el vertex shader real de `MeshStandardMaterial` (el que Three.js te da en `onBeforeCompile`). Mira su esqueleto: una cabecera con `#include <common>`… y dentro de `main()` una lista de chunks:'),
    codeBlock({
      title: 'MeshStandardMaterial · vertexShader (de tu versión de Three.js)',
      lang: 'glsl',
      code: standardVertex(),
      notesOpen: true,
      notes: [
        ['#include <common>', 'El primero, **fuera de `main`**. Aquí caben funciones y uniforms.'],
        ['void main()', 'Empieza el programa que se ejecuta una vez por vértice.'],
        ['#include <beginnormal_vertex>', 'Este chunk **declara `objectNormal`** (la normal del vértice).'],
        ['#include <defaultnormal_vertex>', 'Este y los siguientes **leen** `objectNormal` para calcular la iluminación.'],
        ['#include <begin_vertex>', 'Este chunk **declara `transformed`**: la posición del vértice, que podremos modificar.'],
        ['#include <project_vertex>', 'Lee `transformed` y calcula `gl_Position`. Por eso lo que le hagamos a `transformed` se verá en pantalla.'],
      ],
    }),
    P('Explora tú mismo qué hay dentro de cada chunk. Elige uno y mira a la izquierda **dónde** se usa y a la derecha **qué contiene**:'),
    chunkExplorer(),
    callout('idea', 'Lo que tienes que quedarte', [
      UL([
        '`begin_vertex` → declara **`transformed`** (posición). Cambias esto = mueves el vértice.',
        '`beginnormal_vertex` → declara **`objectNormal`** (normal). Cambias esto = giras la iluminación.',
        '`common` → va **antes de `main`**: ahí pones funciones y uniforms propios.',
        'Los chunks de normal van **antes** que los de posición.',
      ]),
    ]),
    figure(h('div', { html: ORDER_SVG })),

    H3('Cómo «escribimos» en un chunk: replace'),
    P('El `shader.vertexShader` es un string de JavaScript. Para añadir código en un sitio, buscamos su `#include` y lo **reemplazamos por él mismo más nuestro código**, con el `replace` normal de JS (el que ya conoces de cualquier texto):'),
    eq(`'hola #include <x> adiós'.replace('#include <x>', 'MI TEXTO')\n   →  'hola MI TEXTO adiós'`),
    P('Dos cosas que debes saber: `replace` **no modifica** el string original, **devuelve uno nuevo** (por eso hay que guardarlo de vuelta en `shader.vertexShader`), y solo reemplaza **la primera coincidencia**.'),
    P('Probemos lo que dice el curso para ver qué pasa si reemplazamos **por nada**:'),
    codeBlock({
      title: 'main.js · ¡esto rompe!',
      lang: 'js',
      code: `
material.onBeforeCompile = (shader) =>
{
    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        ''
    )
}`,
      notes: [
        ['shader.vertexShader = shader.vertexShader.replace', 'Cogemos el texto, lo cambiamos y **lo guardamos de vuelta**. Sin el `shader.vertexShader =` el cambio se perdería.'],
        ["'#include <begin_vertex>'", 'Lo que buscamos: la línea del chunk que declara `transformed`.'],
        ["''", 'Lo cambiamos por… nada. Esa línea desaparece, y con ella la declaración de `transformed`.'],
      ],
    }),
    P('Ejecútalo en el laboratorio: la GPU protesta con `\'transformed\' : undeclared identifier`. Tiene sentido: `project_vertex` intenta usar `transformed`, que ya no existe. **Un error de compilación** no es un fallo de JavaScript: salta en la GPU y aparece en la consola.'),
    tryIt(2),
    P('Lo arreglamos devolviendo el `#include` justo donde estaba. Como el código nuevo tiene varias líneas, usamos **comillas invertidas** (template string):'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
material.onBeforeCompile = (shader) =>
{
    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        \`
            #include <begin_vertex>
        \`
    )
}`,
      notes: [
        ['.replace(', 'Ahora `replace` recibe dos cosas: qué buscar y por qué cambiarlo.'],
        ["'#include <begin_vertex>',", 'Lo que buscamos (entre comillas normales).'],
        ['`', 'Abre un texto de **varias líneas** con comillas invertidas.'],
        ['#include <begin_vertex>', 'Volvemos a poner el chunk: así `transformed` se sigue declarando.'],
      ],
    }),
    P('No cambia nada visualmente, pero ahora **tenemos un sitio donde escribir**: todo lo que pongamos debajo del `#include` se ejecuta justo después de crear `transformed`.'),
    tryIt(3),

    /* ------------------------------------------------------------------ */
    H2('Paso 3 · Mover los vértices'),
    P('`transformed` es un `vec3` con la posición del vértice. Si le sumamos algo, el vértice se mueve (y como `project_vertex` va después, el cambio llega a la pantalla). Probemos con la altura, `y`:'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    \`
        #include <begin_vertex>

        transformed.y += 3.0;
    \`
)`,
      notes: [
        ['#include <begin_vertex>', 'Primero el chunk, que crea `transformed`.'],
        ['transformed.y += 3.0;', 'Después lo modificamos: **todos** los vértices suben 3 unidades. (Con el punto: `3.0`, recuerda las reglas de GLSL.)'],
      ],
    }),
    P('La columna sube… pero fíjate en el suelo: **su sombra se ha quedado donde estaba**. Es una pista de lo que vendrá en el paso 6. Quitamos esta línea y seguimos.'),
    tryIt(4),

    /* ------------------------------------------------------------------ */
    H2('Paso 4 · Retorcer: la matriz de rotación'),
    P('Queremos girar los vértices **alrededor del eje vertical**, es decir, girar sus coordenadas `x` y `z` y dejar la `y`. Para eso usamos la matriz 2×2 de la lección anterior ([Matrices y la rotación mat2](#/matrices)). Hay tres piezas.'),

    H3('4a · Meter la función en `common`'),
    P('La función `get2dRotateMatrix` debe existir **antes** de `main()`. El chunk `common` está justo ahí, así que lo reemplazamos igual que antes (devolviendo el include y añadiendo la función):'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
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
        ["'#include <common>'", 'Ahora buscamos otro chunk: `common`, que está **antes** de `main()`.'],
        ['#include <common>', 'Lo devolvemos para no romper nada.'],
        ['mat2 get2dRotateMatrix', 'Añadimos nuestra función. Como `common` se pega fuera de `main`, ya está disponible en **todo** el shader.'],
      ],
    }),
    P('Todavía no se nota nada, pero la función ya existe en el shader final. (Si quieres comprobarlo, mira el panel del laboratorio: las líneas verdes son las que has añadido tú.)'),

    H3('4b · Un ángulo fijo, para probar'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    \`
        #include <begin_vertex>

        float angle = 0.3;
        mat2 rotateMatrix = get2dRotateMatrix(angle);

        transformed.xz = rotateMatrix * transformed.xz;
    \`
)`,
      notes: [
        ['float angle = 0.3;', 'Un ángulo cualquiera (en radianes) para probar. 0.3 rad ≈ 17°.'],
        ['mat2 rotateMatrix', 'Pedimos la matriz que gira ese ángulo.'],
        ['transformed.xz = rotateMatrix * transformed.xz;', 'Multiplicamos la matriz por las coordenadas `x` y `z` y guardamos el resultado en esas mismas dos. La `y` no se toca: giramos **alrededor del eje vertical**.'],
      ],
    }),
    P('Toda la columna gira 17° — pero **igual** todos los vértices, así que no se «retuerce»: se limita a rotar. Y la sombra no se entera (más adelante).'),
    tryIt(5),

    H3('4c · El ángulo depende de la altura'),
    P('El toque final: que cada vértice gire **un ángulo distinto según su altura**. Sustituimos el `0.3` por `position.y * 0.9`:'),
    codeBlock({
      title: 'main.js',
      lang: 'glsl',
      code: `
float angle = position.y * 0.9;`,
      notes: [['float angle', '`position` es el atributo original del vértice (no cambia aunque modifiquemos `transformed`). Altura 0 → ángulo 0; altura 4 → 3.6 rad (206°). Cuanto más alto el vértice, más gira: **torsión**. El `0.9` decide cuánto retuerce.']],
    }),
    table(['Altura (`position.y`)', 'Ángulo = y × 0.9', 'En grados', 'Qué le pasa'], [
      ['−4 (la base)', '−3.6 rad', '−206°', 'gira hacia el lado contrario'],
      ['0 (el medio)', '0 rad', '0°', 'no se mueve'],
      ['2', '1.8 rad', '103°', 'gira bastante'],
      ['4 (la parte de arriba)', '3.6 rad', '206°', 'gira más de media vuelta'],
    ]),
    tryIt(6),
    callout('tip', 'Por qué `position.y` y no `transformed.y`', [
      P('Usamos `position.y` (el original) en lugar de `transformed.y` para que el ángulo dependa siempre de la altura **inicial** del vértice. Con `transformed.y` el resultado cambiaría si ya hubieses movido el vértice antes.'),
    ]),

    /* ------------------------------------------------------------------ */
    H2('Paso 5 · Animarlo: el uniform uTime'),
    P('Para animar, el ángulo debe cambiar con el tiempo, y el shader no tiene reloj propio. Usamos la técnica de la lección de uniforms: un `uTime` que sube desde JavaScript. La diferencia es que aquí **no creamos nosotros el material**, así que tenemos un pequeño problema que se resuelve en cuatro movimientos.'),
    H3('5a · Añadir el uniform al shader'),
    P('Dentro del hook, `shader.uniforms` es donde se guardan los uniforms. Añadimos el nuestro, y lo declaramos en el shader (en `common`, antes de usarlo):'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
material.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = { value: 0 }

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        \`
            #include <common>

            uniform float uTime;

            mat2 get2dRotateMatrix(float _angle)
            {
                return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
            }
        \`
    )
}`,
      notes: [
        ['shader.uniforms.uTime', 'Añadimos un uniform a la lista, con el formato de siempre: un objeto con `value`.'],
        ['uniform float uTime;', 'Y lo **declaramos** en el shader, igual que con un `ShaderMaterial`.'],
      ],
    }),
    H3('5b · Usarlo en el ángulo'),
    codeBlock({
      title: 'main.js',
      lang: 'glsl',
      code: `
float angle = (position.y + uTime) * 0.9;`,
      notes: [['float angle', 'Sumamos el tiempo a la altura: cada segundo, todo el patrón de giro «sube» un poco. El resultado es una torsión que avanza.']],
    }),
    H3('5c · El problema: ¿cómo actualizo `uTime`?'),
    P('Si lo dejamos así, `uTime` valdrá siempre 0, porque **no tenemos forma de llegar a él desde el `tick`**: el objeto `shader` solo existe dentro del hook, y los materiales de Three.js no tienen una propiedad `material.uniforms` como el `ShaderMaterial`. Sin acceso, no hay animación.'),
    H3('5d · La solución: un objeto compartido'),
    P('Creamos **fuera** del hook un objeto con nuestro uniform, y dentro del hook lo **enchufamos** a `shader.uniforms`. Como JavaScript pasa los objetos por referencia, ambos nombres apuntan **al mismo objeto `{ value }`**: cuando el `tick` cambia su `.value`, el shader lo ve.'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
const customUniforms = {
    uTime: { value: 0 }
}

material.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime

    // ... los replace de antes
}

// ---- más abajo, en el tick ----
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update material
    customUniforms.uTime.value = elapsedTime

    // ...
}`,
      notes: [
        ['const customUniforms', 'Un objeto normal, **declarado fuera** de cualquier función para que el `tick` también lo vea.'],
        ['uTime: { value: 0 }', 'El uniform, con su `{ value }`.'],
        ['shader.uniforms.uTime = customUniforms.uTime', '**No** copiamos el número, enchufamos **el mismo objeto**. Por eso lo que cambie el `tick` llega al shader.'],
        ['clock.getElapsedTime()', 'El reloj que ya conoces: segundos desde que empezó la página.'],
        ['customUniforms.uTime.value = elapsedTime', 'Cada frame actualizamos el valor. ¡Esta es la animación!'],
      ],
    }),
    eq(`t = 0 s → angle(y=1) = (1 + 0) × 0.9 = 0.90 rad\nt = 2 s → angle(y=1) = (1 + 2) × 0.9 = 2.70 rad\nt = 4 s → angle(y=1) = (1 + 4) × 0.9 = 4.50 rad`),
    tryIt(7),

    /* ------------------------------------------------------------------ */
    H2('Paso 6 · Arreglar la sombra'),
    P('Mira otra vez el suelo y la pared del laboratorio: la columna se retuerce, pero su **sombra no**. Para entender por qué hay que recordar cómo se calculan las sombras (lección de [Sombras](#/sombras)).'),
    callout('analogy', 'La foto de la luz', [
      P('Para saber qué está en sombra, Three.js hace primero **una foto de la escena desde la luz**, pero no una foto normal: solo guarda **a qué distancia** está cada cosa (un *mapa de profundidad*). Luego, al pintar, comprueba cada píxel contra esa foto: «¿hay algo más cerca de la luz que yo?».'),
    ]),
    P('La clave: para hacer esa foto, Three.js **cambia todos los materiales por un `MeshDepthMaterial`**, que solo sabe dibujar profundidad. Nuestro `onBeforeCompile` está en el `MeshStandardMaterial`, así que ese material de profundidad **no sabe nada de la torsión**: dibuja la columna recta, y la sombra sale recta.'),
    P('La solución: decirle a Three.js que use **nuestro** material de profundidad en esta malla, con la propiedad `customDepthMaterial`, y retorcerlo igual que al principal:'),
    codeBlock({
      title: 'main.js',
      lang: 'js',
      code: `
const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking
})

mesh.customDepthMaterial = depthMaterial

depthMaterial.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        \`
            #include <common>

            uniform float uTime;

            mat2 get2dRotateMatrix(float _angle)
            {
                return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
            }
        \`
    )

    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        \`
            #include <begin_vertex>

            float angle = (position.y + uTime) * 0.9;
            mat2 rotateMatrix = get2dRotateMatrix(angle);

            transformed.xz = rotateMatrix * transformed.xz;
        \`
    )
}`,
      notes: [
        ['new THREE.MeshDepthMaterial', 'El material que Three.js usa para la «foto de profundidad». Nosotros creamos el nuestro.'],
        ['depthPacking', 'Es la forma de guardar la profundidad en los canales de color (R, G, B y A) para tener más precisión. Basta con ponerlo como en el curso: `THREE.RGBADepthPacking`.'],
        ['mesh.customDepthMaterial', 'Le decimos a la malla: «cuando te dibujes en el mapa de sombras, usa este material». (Si el modelo tuviera varias mallas, habría que hacerlo con cada una.)'],
        ['depthMaterial.onBeforeCompile', 'El mismo truco de siempre, pero en el material de profundidad.'],
        ["'#include <common>'", 'Mismo uniform y misma función que en el material principal.'],
        ["'#include <begin_vertex>'", 'Mismo giro de `transformed.xz`. **Tiene que ser idéntico** al del material, si no la sombra no coincidiría con el modelo.'],
      ],
    }),
    callout('remember', 'Regla de oro', [P('**Todo lo que cambie la posición** del modelo en el material principal debe repetirse en el `depthMaterial`. Si no, sombras y modelo se separan (como cuando movimos la columna en el paso 3).')]),
    tryIt(8),

    /* ------------------------------------------------------------------ */
    H2('Paso 7 · Arreglar la luz: las normales'),
    P('Con la sombra bien, queda otro detalle. Compara en el laboratorio el paso 8 y el paso 10: en el 8 las caras laterales se ven oscuras y la iluminación **no sigue** a la superficie retorcida; en el 10 todo es coherente. ¿Por qué?'),
    P('Una **normal** es una flecha que sale perpendicular a la superficie en cada vértice. La luz la usa para calcular el brillo: si la normal apunta hacia la luz, el punto se ve claro; si apunta en contra, oscuro. Al retorcer hemos movido los **vértices** (`transformed`), pero **no hemos girado las flechas**. La superficie ha rotado y las normales siguen apuntando a donde apuntaban antes, así que la luz «cree» que la superficie no se ha movido.'),
    eq(`Un vértice de la cara lateral derecha: normal = (1, 0, 0)\n\nTras rotar la superficie 90° alrededor de y:\n  superficie  →  ahora mira hacia  (0, 0, ±1)\n  normal sin arreglar → sigue siendo (1, 0, 0)   ✘ ¡no coincide!\n  normal arreglada    → pasa a ser  (0, 0, ±1)   ✔`),
    P('Hay que girar `objectNormal` **con la misma matriz**. Ese vector lo declara el chunk `beginnormal_vertex`. La tentación es hacer exactamente lo mismo que con `begin_vertex`:'),
    codeBlock({
      title: 'main.js · la versión que falla',
      lang: 'js',
      code: `
shader.vertexShader = shader.vertexShader.replace(
    '#include <beginnormal_vertex>',
    \`
        #include <beginnormal_vertex>

        float angle = (position.y + uTime) * 0.9;
        mat2 rotateMatrix = get2dRotateMatrix(angle);

        objectNormal.xz = rotateMatrix * objectNormal.xz;
    \`
)`,
      notes: [
        ["'#include <beginnormal_vertex>'", 'El chunk que declara `objectNormal`.'],
        ['float angle', 'Las mismas dos líneas que ya tenemos en `begin_vertex`…'],
        ['objectNormal.xz', 'Y giramos la normal igual que giramos `transformed`.'],
      ],
    }),
    P('Esto da **un error de compilación**: `\'angle\' : redefinition` y `\'rotateMatrix\' : redefinition`. Compruébalo en el laboratorio. Pasa porque (como vimos) **todos los chunks se fusionan en un solo shader**: `angle` y `rotateMatrix` están declaradas dos veces en el mismo `main()`, y GLSL no deja.'),
    tryIt(9),
    P('La solución aprovecha el orden: `beginnormal_vertex` va **antes** que `begin_vertex`. Declaramos `angle` y `rotateMatrix` **solo** en el primero, y en `begin_vertex` simplemente las **usamos**:'),
    codeBlock({
      title: 'main.js · la versión que funciona',
      lang: 'js',
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
        ['#include <beginnormal_vertex>', 'Primer chunk en ejecutarse: aquí **nacen** `angle` y `rotateMatrix`.'],
        ['float angle', 'Declaradas una sola vez.'],
        ['objectNormal.xz', 'Normal girada con la matriz.'],
        ["'#include <begin_vertex>'", 'Más abajo en `main()` (mira el esquema del orden).'],
        ['transformed.xz', 'Aquí ya **no** se declara nada: `rotateMatrix` existe de antes y solo se usa.'],
      ],
    }),
    callout('warn', 'Ojo: el depthMaterial es distinto', [
      P('El `depthMaterial` **no necesita normales** (solo dibuja distancias), y su shader ni siquiera incluye `beginnormal_vertex` (salvo con displacement maps). Por eso, en él, `angle` y `rotateMatrix` se siguen declarando dentro de `begin_vertex`, como en el paso 6.'),
    ]),
    tryIt(10),

    /* ------------------------------------------------------------------ */
    H2('Paso 8 · Ir más lejos'),
    P('Ya tienes todo el mecanismo. Cambiando solo el ángulo puedes conseguir efectos muy distintos. Una fórmula que mueve la columna como un junco al viento (acuérdate de cambiarla **en el material y en el depthMaterial**):'),
    codeBlock({
      title: 'GLSL',
      lang: 'glsl',
      code: `
float angle = (sin(position.y + uTime)) * 0.4;`,
      notes: [['float angle', '`sin(...)` oscila entre −1 y 1, así que el ángulo va y viene entre −0.4 y 0.4 rad en vez de crecer sin parar. `position.y + uTime` hace que la onda **viaje hacia arriba**.']],
    }),
    P('Y otro nivel: en lugar de escribir `0.4` fijo, puedes pasarlo como **otro uniform** (`uTwist`) y controlarlo desde un slider de lil-gui, o con la posición del ratón. Exactamente la misma idea que `uTime`: se añade a `customUniforms`, se enchufa con `shader.uniforms.uTwist = customUniforms.uTwist`, se declara con `uniform float uTwist;` y se actualiza desde JS. Pruébalo en el laboratorio: es el paso 11.'),
    tryIt(11),

    /* ------------------------------------------------------------------ */
    H2('Tu turno: escríbelo tú'),
    P('Ahora viene lo que importa: que lo escribas **tú** sin mirar. Aquí abajo tienes un editor. Empieza con un esqueleto de comentarios con los 5 pasos; ve rellenándolos con lo que has aprendido (si no recuerdas la sintaxis de algún trozo, vuelve a los pasos de arriba). El resultado se ve en la columna al instante y la lista de la derecha te dice qué piezas has puesto.'),
    callout('tip', 'Sugerencia de método', [
      OL([
        'Escribe primero solo el gancho y la matriz, **sin animar**. Comprueba que gira.',
        'Añade `uTime` y la animación.',
        'Añade el `depthMaterial` (la sombra).',
        'Por último, las normales.',
      ]),
      P('Si algo falla, **lee el mensaje de error**: casi siempre te dice exactamente qué falta.'),
    ]),
    challengeLab(),
    h('details', {}, h('summary', {}, 'Pista 1 · No me compila / nada cambia'),
      P('Comprueba que el texto que buscas en `replace` es **exactamente** `#include <begin_vertex>` (sin espacios de más ni mayúsculas). Si el texto no se encuentra, `replace` no avisa: simplemente no hace nada. Para comprobar qué tiene el shader, haz `console.log(shader.vertexShader)`.')),
    h('details', {}, h('summary', {}, 'Pista 2 · `\'uTime\' : undeclared identifier`'),
      P('Te falta `uniform float uTime;`. Va en el chunk `common`, antes de la función. Y no olvides `shader.uniforms.uTime = customUniforms.uTime`.')),
    h('details', {}, h('summary', {}, 'Pista 3 · La sombra no se retuerce'),
      P('Necesitas **tres** cosas: crear `new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking })`, asignarlo con `mesh.customDepthMaterial = depthMaterial` y darle su propio `onBeforeCompile` con el mismo giro.')),
    h('details', {}, h('summary', {}, 'Pista 4 · `\'angle\' : redefinition`'),
      P('Declaraste `angle` o `rotateMatrix` en dos chunks del **mismo** shader. Déjalas solo en `beginnormal_vertex` y, en `begin_vertex`, usa únicamente `transformed.xz = rotateMatrix * transformed.xz;`.')),
    h('details', {}, h('summary', {}, 'Ver la solución completa, explicada línea a línea'),
      codeBlock({
        title: 'Solución',
        lang: 'js',
        code: SOLUTION_CODE,
        notes: [
          ['material.onBeforeCompile', 'El gancho en el material principal.'],
          ['shader.uniforms.uTime = customUniforms.uTime', 'Enchufamos **el mismo objeto** que actualiza el tick. (En tu proyecto, `customUniforms` lo creas tú fuera, como en el paso 5.)'],
          ["'#include <common>'", 'Chunk que va antes de `main()`: añadimos el uniform y la función.'],
          ['uniform float uTime;', 'El uniform, declarado.'],
          ['mat2 get2dRotateMatrix', 'La función que devuelve la matriz de giro.'],
          ["'#include <beginnormal_vertex>'", 'Las normales: este chunk va **antes** que `begin_vertex`.'],
          ['float angle', '`angle` y `rotateMatrix` se declaran **una sola vez**, aquí.'],
          ['objectNormal.xz', 'Giramos la normal con la misma matriz.'],
          ["'#include <begin_vertex>'", 'La posición: va después.'],
          ['transformed.xz', 'Giramos `transformed` con la matriz **ya declarada**.'],
          ['const depthMaterial', 'Material que Three.js usará para el mapa de sombras…'],
          ['mesh.customDepthMaterial', '…y se lo asignamos a la malla.'],
          ['depthMaterial.onBeforeCompile', 'Repetimos la torsión en el material de profundidad.'],
          ['float angle', 'Aquí **sí** se declaran `angle` y `rotateMatrix`: el depthMaterial no tiene el chunk de normales.'],
        ],
      })),

    H2('Así encaja en tu proyecto del curso'),
    P('En el proyecto del curso no hay una «columna» sino el modelo de la cabeza cargado con `GLTFLoader`. Esto es solo el esqueleto de **dónde va cada pieza** (adapta los nombres a los de tu `script.js`):'),
    codeBlock({
      title: 'script.js (esqueleto)',
      lang: 'js',
      code: `
/**
 * Material
 */
const mapTexture = textureLoader.load('/models/LeePerrySmith/color.jpg')
mapTexture.colorSpace = THREE.SRGBColorSpace
const normalTexture = textureLoader.load('/models/LeePerrySmith/normal.jpg')

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
    // replace('#include <common>', ...)
    // replace('#include <beginnormal_vertex>', ...)
    // replace('#include <begin_vertex>', ...)
}

depthMaterial.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime
    // replace('#include <common>', ...)
    // replace('#include <begin_vertex>', ...)
}

/**
 * Model
 */
gltfLoader.load('/models/LeePerrySmith/LeePerrySmith.glb', (gltf) =>
{
    const mesh = gltf.scene.children[0]
    mesh.rotation.y = Math.PI * 0.5
    mesh.material = material
    mesh.customDepthMaterial = depthMaterial
    scene.add(mesh)
})

/**
 * Animate
 */
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update material
    customUniforms.uTime.value = elapsedTime

    // ...
}`,
      notes: [
        ['const material', 'El material con sus texturas normales (mapa de color y mapa de normales). **No** es un ShaderMaterial: es el de siempre.'],
        ['const depthMaterial', 'El material de profundidad para las sombras.'],
        ['const customUniforms', 'Fuera de los hooks y de los callbacks, para que el `tick` lo vea.'],
        ['material.onBeforeCompile', 'Hook del material principal: tres `replace` (`common`, `beginnormal_vertex`, `begin_vertex`).'],
        ['depthMaterial.onBeforeCompile', 'Hook del depthMaterial: solo dos (`common`, `begin_vertex`).'],
        ['mesh.material = material', 'Sustituimos el material de la malla cargada…'],
        ['mesh.customDepthMaterial', '…y le damos su material de profundidad.'],
        ['customUniforms.uTime.value', 'El `tick` actualiza el uniform compartido en cada frame.'],
      ],
    }),

    H2('Si algo falla'),
    table(['Síntoma', 'Causa probable', 'Arreglo'], [
      ['No cambia absolutamente nada', 'El texto que buscas en `replace` no existe (una errata) y `replace` no avisa', 'Revisa el `#include <…>` y haz `console.log(shader.vertexShader)`'],
      ['El objeto desaparece o la pantalla queda negra', 'Error de compilación en la GPU', 'Mira la consola del navegador, o usa `renderer.debug.onShaderError`'],
      ['`\'transformed\' : undeclared identifier`', 'Reemplazaste `begin_vertex` por nada', 'Vuelve a incluir `#include <begin_vertex>`'],
      ['`\'angle\' : redefinition`', 'Declaraste `angle`/`rotateMatrix` en dos chunks', 'Decláralas solo en `beginnormal_vertex`'],
      ['`\'uTime\' : undeclared identifier`', 'Falta `uniform float uTime;`', 'Ponlo en el chunk `common`'],
      ['No se anima (el ángulo nunca cambia)', 'Falta `shader.uniforms.uTime = customUniforms.uTime` o no actualizas el valor en el `tick`', 'Enchufa el objeto y actualiza `customUniforms.uTime.value`'],
      ['El modelo se retuerce pero su sombra no', 'Falta el `customDepthMaterial` o su `onBeforeCompile`', 'Paso 6'],
      ['La sombra se retuerce pero la luz se ve rara', 'No giraste `objectNormal`', 'Paso 7'],
      ['Dos materiales distintos comparten shader por error', 'Three.js reutiliza programas con el mismo `onBeforeCompile`', 'Dales a cada uno `material.customProgramCacheKey = () => \'miClave\'`'],
    ]),

    H2('Chuleta: dónde escribir cada cosa'),
    table(['Quiero…', 'Chunk que reemplazo', 'Variable que tengo', 'Ejemplo'], [
      ['Añadir funciones o uniforms', '`#include <common>`', '—', '`uniform float uTime;`'],
      ['Mover/deformar el vértice', '`#include <begin_vertex>`', '`transformed` (vec3)', '`transformed.y += 3.0;`'],
      ['Girar la iluminación al deformar', '`#include <beginnormal_vertex>`', '`objectNormal` (vec3)', '`objectNormal.xz = rotateMatrix * objectNormal.xz;`'],
      ['Que la sombra siga a la deformación', 'El mismo `begin_vertex` en `customDepthMaterial`', '`transformed`', 'Repetir el cambio en el depthMaterial'],
      ['Cambiar el color en el fragment shader', '`shader.fragmentShader`: `#include <color_fragment>`', '`diffuseColor` (vec4)', 'Un buen ejercicio para después'],
    ]),
    callout('idea', 'La receta de cuatro líneas', [
      OL([
        '`material.onBeforeCompile = (shader) => { … }`',
        "`shader.vertexShader = shader.vertexShader.replace('#include <chunk>', texto nuevo)`: el texto nuevo es el `#include` de vuelta más tu código",
        'Los uniforms propios: **un objeto `customUniforms` fuera** + `shader.uniforms.uX = customUniforms.uX` + `uniform …;` en `common`',
        'Si deformas la posición: **repítelo en `customDepthMaterial`** (sombra) y, si hace falta, **en `objectNormal`** (luz).',
      ]),
    ]),

    quiz([
      {
        q: '¿Cuándo llama Three.js a `material.onBeforeCompile`?',
        options: ['En cada frame', 'Una vez, justo antes de compilar el shader del material', 'Cuando el ratón se mueve', 'Cuando la cámara cambia'],
        answer: 1,
        why: 'Solo cuando se va a compilar el material. Por eso, para animar, usamos un uniform que sí se actualiza cada frame.',
      },
      {
        q: 'Reemplazas `#include <begin_vertex>` por una cadena vacía. ¿Qué ocurre?',
        options: ['Nada: el chunk era opcional', 'Error de compilación: `transformed` deja de existir y `project_vertex` lo necesita', 'El objeto se vuelve invisible pero compila', 'Three.js restaura el chunk'],
        answer: 1,
        why: '`begin_vertex` declara `transformed` y `project_vertex` lo usa. Sin esa declaración, la GPU dice `undeclared identifier`.',
      },
      {
        q: '¿Dónde pones la función `get2dRotateMatrix` para poder usarla en cualquier punto de `main()`?',
        options: ['Dentro de `begin_vertex`', 'En el chunk `common`, que va antes de `main`', 'En `project_vertex`', 'En el fragment shader'],
        answer: 1,
        why: 'Una función GLSL debe estar declarada antes de usarse y no puede estar dentro de `main`. `common` está justo antes.',
      },
      {
        q: '¿Por qué el ángulo es `position.y * 0.9` (y no un número fijo) para retorcer?',
        options: ['Porque así es más rápido', 'Porque cada vértice debe girar un ángulo proporcional a su altura; con un ángulo fijo el modelo solo rotaría', 'Porque `position.y` es el tiempo', 'Porque `0.9` es una constante de la GPU'],
        answer: 1,
        why: 'Distinto ángulo según la altura = torsión. Un ángulo igual para todos sería una rotación rígida.',
      },
      {
        q: 'Quieres animar el ángulo con el tiempo. ¿Cómo haces que el `tick` pueda actualizar `uTime`?',
        options: ['`material.uniforms.uTime.value = t` (como en un ShaderMaterial)', 'Creando un objeto `customUniforms` fuera del hook y enchufándolo con `shader.uniforms.uTime = customUniforms.uTime`', 'Reasignando `onBeforeCompile` en cada frame', 'Con `shader.needsUpdate`'],
        answer: 1,
        why: 'Los materiales estándar no exponen `uniforms`. Compartes un mismo objeto `{ value }` entre el tick y el shader.',
      },
      {
        q: 'La columna se retuerce, pero su sombra en el suelo sigue recta. ¿Qué te falta?',
        options: ['Más luces', 'Un `customDepthMaterial` con el mismo `onBeforeCompile` de torsión', 'Subir la resolución del mapa de sombras', 'Rotar la sombra desde JavaScript'],
        answer: 1,
        why: 'El mapa de sombras se genera con un `MeshDepthMaterial`, que no tiene tu torsión. Hay que darle uno propio.',
      },
      {
        q: 'Al girar `objectNormal` en `beginnormal_vertex` con las mismas dos líneas que en `begin_vertex` obtienes `\'angle\' : redefinition`. ¿Por qué?',
        options: ['Porque `angle` es una palabra reservada', 'Porque todos los chunks forman un único shader y `angle` queda declarada dos veces en `main()`', 'Porque falta el uniform', 'Porque `objectNormal` es de solo lectura'],
        answer: 1,
        why: 'Hay que declarar `angle` y `rotateMatrix` solo en el primer chunk (`beginnormal_vertex`) y usarlas después.',
      },
      {
        q: '¿Qué chunk va primero dentro de `main()`: `beginnormal_vertex` o `begin_vertex`?',
        options: ['`begin_vertex`', '`beginnormal_vertex`', 'Da igual, se ordenan solos', 'Ninguno está en `main()`'],
        answer: 1,
        why: 'Las normales se calculan antes que la posición, así que `beginnormal_vertex` va antes. Por eso declaras ahí las variables compartidas.',
      },
    ]),
  );
}
