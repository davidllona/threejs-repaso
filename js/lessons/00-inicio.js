import { P, H2, H3, callout, demo, figure, h, table, quiz, md } from '../ui.js';

// Retuerce un material usando el mismo truco que verás en «Modified materials».
function applyTwist(material, uniform, { normals }) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTwist = uniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTwist;
        mat2 rot2(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.xz = rot2(position.y * uTwist) * transformed.xz;`);
    if (normals) {
      shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        objectNormal.xz = rot2(position.y * uTwist) * objectNormal.xz;`);
    }
  };
}

const PIPELINE_SVG = `
<svg viewBox="0 0 1000 360" role="img" aria-label="Del código JavaScript a los píxeles de la pantalla">
  <defs>
    <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="#97a0b4"/>
    </marker>
  </defs>
  <!-- Fila 1: tu código -->
  <text x="10" y="22" fill="#97a0b4" font-size="13" font-weight="600">En la CPU · tu JavaScript</text>
  <rect x="10" y="34" width="170" height="104" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="95" y="68" text-anchor="middle" fill="#fff" font-size="15" font-weight="650">Tu código</text>
  <text x="95" y="92" text-anchor="middle" fill="#97a0b4" font-size="12.5">crea objetos y los</text>
  <text x="95" y="110" text-anchor="middle" fill="#97a0b4" font-size="12.5">mueve en cada frame</text>
  <path d="M184 86 H226" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="230" y="34" width="440" height="104" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="250" y="58" fill="#fff" font-size="15" font-weight="650">Scene</text>
  <text x="310" y="58" fill="#97a0b4" font-size="12.5">(el escenario donde pones todo)</text>
  <rect x="250" y="72" width="84" height="30" rx="15" fill="#4cc9e022" stroke="#4cc9e0"/><text x="292" y="92" text-anchor="middle" fill="#4cc9e0" font-size="13" font-weight="600">Geometry</text>
  <text x="344" y="92" fill="#97a0b4" font-size="16">+</text>
  <rect x="360" y="72" width="78" height="30" rx="15" fill="#f472b622" stroke="#f472b6"/><text x="399" y="92" text-anchor="middle" fill="#f472b6" font-size="13" font-weight="600">Material</text>
  <text x="448" y="92" fill="#97a0b4" font-size="16">=</text>
  <text x="466" y="92" fill="#fff" font-size="14" font-weight="650">Mesh</text>
  <rect x="540" y="72" width="58" height="30" rx="15" fill="#ffc85722" stroke="#ffc857"/><text x="569" y="92" text-anchor="middle" fill="#ffc857" font-size="13" font-weight="600">Light</text>
  <rect x="606" y="72" width="52" height="30" rx="15" fill="#ffffff10" stroke="#97a0b4"/><text x="632" y="92" text-anchor="middle" fill="#c9cedb" font-size="13" font-weight="600">Cam</text>
  <text x="250" y="124" fill="#97a0b4" font-size="12.5">Un Mesh es lo único que se dibuja: la forma y su piel, siempre juntas.</text>
  <path d="M674 86 H716" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="720" y="34" width="270" height="104" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="855" y="68" text-anchor="middle" fill="#fff" font-size="15" font-weight="650">Renderer</text>
  <text x="855" y="92" text-anchor="middle" fill="#ffe2b8" font-size="12.5" font-family="JetBrains Mono, monospace">renderer.render(scene, camera)</text>
  <text x="855" y="114" text-anchor="middle" fill="#97a0b4" font-size="12.5">manda todo a la tarjeta gráfica</text>

  <!-- Codo hacia la fila 2 -->
  <path d="M855 142 V178 H117 V214" fill="none" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr)"/>

  <!-- Fila 2: GPU -->
  <text x="990" y="206" text-anchor="end" fill="#97a0b4" font-size="13" font-weight="600">En la GPU · cada pieza trabaja con miles de datos a la vez</text>
  <rect x="10" y="218" width="215" height="124" rx="12" fill="#a493ff1c" stroke="#a493ff"/>
  <text x="117" y="248" text-anchor="middle" fill="#a493ff" font-size="15" font-weight="650">Vertex shader</text>
  <text x="117" y="272" text-anchor="middle" fill="#c9cedb" font-size="12.5">1 ejecución por vértice</text>
  <text x="117" y="292" text-anchor="middle" fill="#97a0b4" font-size="12.5">Decide dónde cae cada</text>
  <text x="117" y="310" text-anchor="middle" fill="#97a0b4" font-size="12.5">punto en la pantalla</text>
  <path d="M229 280 H262" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="266" y="218" width="215" height="124" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="373" y="248" text-anchor="middle" fill="#fff" font-size="15" font-weight="650">Rasterización</text>
  <text x="373" y="272" text-anchor="middle" fill="#c9cedb" font-size="12.5">Automática, no la escribes</text>
  <text x="373" y="292" text-anchor="middle" fill="#97a0b4" font-size="12.5">Calcula qué píxeles cubre</text>
  <text x="373" y="310" text-anchor="middle" fill="#97a0b4" font-size="12.5">cada triángulo</text>
  <path d="M485 280 H518" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="522" y="218" width="215" height="124" rx="12" fill="#a493ff1c" stroke="#a493ff"/>
  <text x="629" y="248" text-anchor="middle" fill="#a493ff" font-size="15" font-weight="650">Fragment shader</text>
  <text x="629" y="272" text-anchor="middle" fill="#c9cedb" font-size="12.5">1 ejecución por píxel</text>
  <text x="629" y="292" text-anchor="middle" fill="#97a0b4" font-size="12.5">Decide de qué color</text>
  <text x="629" y="310" text-anchor="middle" fill="#97a0b4" font-size="12.5">se pinta ese píxel</text>
  <path d="M741 280 H774" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr)"/>

  <rect x="778" y="218" width="212" height="124" rx="12" fill="#242833" stroke="#373d4d"/>
  <text x="884" y="248" text-anchor="middle" fill="#fff" font-size="15" font-weight="650">Tu canvas</text>
  <text x="884" y="272" text-anchor="middle" fill="#c9cedb" font-size="12.5">La imagen final</text>
  <text x="884" y="292" text-anchor="middle" fill="#97a0b4" font-size="12.5">que ves en el navegador,</text>
  <text x="884" y="310" text-anchor="middle" fill="#97a0b4" font-size="12.5">repetida 60 veces por segundo</text>
</svg>`;

export default function render(root) {
  root.append(
    P('Este cuaderno existe para una cosa: que vuelvas a tener **claro cómo funciona Three.js** y que, al terminar, puedas escribir tú mismo el ejercicio de *Modified materials* (la lección 31) sin mirar el curso. No es una copia del curso: es un repaso con otras palabras, demos que puedes tocar y el código explicado línea a línea.'),
    callout('tip', 'Cómo usar cada lección', [
      P('Lee el texto, **juega con la demo** (mueve los sliders, cambia las opciones) y mira qué cambia en el código. Después contesta el mini test del final. Si algo no te cuadra, vuelve a la demo: casi siempre se entiende moviendo cosas, no releyendo.'),
    ]),

    H2('La idea que lo sostiene todo'),
    P('Three.js no dibuja nada por sí mismo. Lo que hace es **prepararle los datos a la tarjeta gráfica** (la GPU) de forma cómoda para ti. Esta imagen resume todo el curso; vuelve a ella cuando te pierdas:'),
    figure(h('div', { html: PIPELINE_SVG })),
    P('Fíjate en que hay dos mundos. En el de arriba (tu JavaScript) trabajas con objetos fáciles: cajas, luces, cámaras. En el de abajo (la GPU) todo son **números y triángulos**, y los *shaders* son los pequeños programas que decides tú. Los capítulos 1 a 3 del curso viven arriba; el capítulo 4 (shaders) baja a la GPU.'),

    H2('Los colores significan algo'),
    P('En toda la web uso siempre los mismos colores para que tu cabeza haga la asociación sola:'),
    h('div', { class: 'grid2' },
      callout('remember', 'Cian · Geometría', 'La **forma**: una lista de puntos (vértices) en el espacio.'),
      callout('analogy', 'Ámbar · Luz', 'Lo que **ilumina**. Sin luz, la mayoría de materiales se ven negros.'),
      h('div', { class: 'callout', style: { '--c': 'var(--mat)' } }, h('div', { class: 'callout-title' }, 'Rosa · Material'), P('La **piel**: color, brillo, textura. Cómo reacciona la superficie a la luz.')),
      h('div', { class: 'callout' }, h('div', { class: 'callout-title' }, 'Violeta · Shader'), P('Código que **corre en la GPU**: decide posiciones (vertex) y colores (fragment).')),
    ),

    demo({
      title: 'Las cuatro capas de un objeto 3D',
      caption: 'Enciende y apaga cada capa. Sin **luz**, el material se queda a oscuras. Sin **material**, solo queda el esqueleto de la **geometría**. El **shader** de abajo es el twist que construirás al final del curso.',
      aspect: '16 / 10',
      setup({ makeStage, panel }) {
        const stage = makeStage({ pos: [0, 0.4, 6.4], fov: 42 });
        const { THREE, scene } = stage;
        const uTwist = { value: 0 };

        const geometry = new THREE.TorusKnotGeometry(1.15, 0.36, 220, 28);
        const solidMat = new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.35, metalness: 0.08 });
        const wireMat = new THREE.MeshBasicMaterial({ color: '#4cc9e0', wireframe: true });
        applyTwist(solidMat, uTwist, { normals: true });
        applyTwist(wireMat, uTwist, { normals: false });

        const group = new THREE.Group();
        const solid = new THREE.Mesh(geometry, solidMat);
        const wire = new THREE.Mesh(geometry, wireMat);
        wire.scale.setScalar(1.004);
        wire.visible = false;
        group.add(solid, wire);
        scene.add(group);

        scene.add(new THREE.AmbientLight('#ffffff', 0.32));
        const lightPivot = new THREE.Group();
        const bulb = new THREE.PointLight('#ffc857', 60, 0, 2);
        bulb.position.set(3.2, 1.6, 0);
        const marker = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: '#ffc857' }));
        marker.position.copy(bulb.position);
        lightPivot.add(bulb, marker);
        scene.add(lightPivot);

        let twistTarget = 0;
        stage.onTick((dt, t) => {
          group.rotation.y = t * 0.25;
          lightPivot.rotation.y = t * 0.9;
          uTwist.value += (twistTarget - uTwist.value) * Math.min(1, dt * 4);
        });

        panel([
          { type: 'check', id: 'geo', label: 'Geometría (esqueleto en cian)', value: false, onInput: (v) => { wire.visible = v; } },
          { type: 'check', id: 'mat', label: 'Material (piel rosa)', value: true, onInput: (v) => { solid.visible = v; } },
          { type: 'check', id: 'light', label: 'Luz (bombilla ámbar)', value: true, onInput: (v) => { bulb.visible = v; marker.visible = v; } },
          { type: 'check', id: 'shader', label: 'Shader (retorcer los vértices)', value: false, onInput: (v) => { twistTarget = v ? 0.9 : 0; } },
          { type: 'note', html: 'Arrastra con el ratón para girar la cámara. La rueda hace zoom.' },
        ]);
      },
    }),

    H2('Las ocho palabras que debes tener claras'),
    table(['Palabra', 'Qué es, en una frase'], [
      ['**Scene**', 'El escenario: una caja donde metes todo lo que quieres ver (objetos, luces).'],
      ['**Camera**', 'Los ojos: desde dónde y con qué ángulo se mira la escena.'],
      ['**Renderer**', 'El que hace la foto: recibe escena + cámara y pinta el resultado en un `<canvas>`.'],
      ['{{geo|Geometry}}', 'La forma, guardada como una lista de vértices (puntos con coordenadas).'],
      ['{{mat|Material}}', 'La apariencia de la superficie. Por dentro, un material es un **shader** ya escrito por Three.js.'],
      ['**Mesh**', '{{geo|Geometry}} + {{mat|Material}} = un objeto que se puede dibujar.'],
      ['{{light|Light}}', 'Una fuente de luz. Los materiales «estándar» la necesitan para verse.'],
      ['{{shader|Shader}}', 'Un programa que se ejecuta en la GPU. Hay dos tipos: vertex (posiciones) y fragment (colores).'],
    ]),

    H2('Ruta recomendada'),
    P('Las lecciones están en el orden del curso, así que puedes ir de arriba abajo. Si tienes poco tiempo, esta es la ruta mínima para llegar a *Modified materials* sin lagunas:'),
    h('ol', {},
      h('li', { html: md('[La escena y el Mesh](#/escena) y [Geometrías](#/geometrias): qué es cada pieza.') }),
      h('li', { html: md('[Materiales](#/materiales), [Luces](#/luces) y [Sombras](#/sombras): para entender por qué la sombra se rompe al retorcer.') }),
      h('li', { html: md('[Cómo dibuja la GPU](#/gpu), [GLSL](#/glsl) y [Attributes, uniforms y varyings](#/variables): la base de los shaders.') }),
      h('li', { html: md('[Matrices y mat2](#/matrices): la matemática del twist.') }),
      h('li', { html: md('[Modified materials](#/modified): el laboratorio final, paso a paso.') }),
    ),

    callout('analogy', 'Una forma de recordarlo todo', [
      P('Piensa en un **plató de cine**. La *Scene* es el plató. La *Geometry* es el esqueleto de cada atrezo, el *Material* es la pintura que le echas, las *Lights* son los focos y la *Camera* es la cámara de rodaje. El *Renderer* es el que revela la película. Y un *Shader* es como darle instrucciones muy precisas a un equipo de miles de ayudantes (los núcleos de la GPU) que trabajan todos a la vez.'),
    ]),

    quiz([
      {
        q: '¿Qué necesitas como mínimo para ver un objeto en pantalla?',
        options: ['Solo una Geometry', 'Un Mesh (Geometry + Material) dentro de una Scene, una Camera y un Renderer', 'Una Light y una Camera', 'Un shader escrito a mano'],
        answer: 1,
        why: 'El Mesh combina forma y piel; la Scene lo contiene; la Camera decide el encuadre y el Renderer lo dibuja. Con `MeshBasicMaterial` ni siquiera hace falta luz.',
      },
      {
        q: '¿Qué hace el vertex shader?',
        options: ['Decide el color de cada píxel', 'Calcula la posición final de cada vértice en la pantalla', 'Carga las texturas', 'Crea la geometría'],
        answer: 1,
        why: 'Se ejecuta una vez por vértice y su trabajo principal es devolver `gl_Position`. El color de cada píxel lo decide el fragment shader.',
      },
      {
        q: 'Un `MeshStandardMaterial` sin ninguna luz en la escena se verá…',
        options: ['Normal', 'Casi negro', 'Transparente', 'Con error'],
        answer: 1,
        why: 'Los materiales «físicos» calculan su color a partir de la luz que reciben. Sin luz no hay nada que calcular (solo se vería lo que aporte la luz ambiente o el entorno).',
      },
    ]),
  );
}
