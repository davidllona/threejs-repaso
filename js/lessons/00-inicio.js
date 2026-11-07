import { P, callout, demo, figure, h, table, md } from '../ui.js';

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

  <path d="M855 142 V178 H117 V214" fill="none" stroke="#97a0b4" stroke-width="2" marker-end="url(#arr)"/>

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

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Las cuatro capas de un objeto',
      body: () => [
        demo({
          title: 'Enciende y apaga cada capa',
          caption: 'Sin **luz**, el material se queda a oscuras. Sin **material**, solo queda el esqueleto de la **geometría**. El **shader** es el twist que construirás al final.',
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
            ]);
          },
        }),
        P('Todo lo que dibuja Three.js son estas capas: la {{geo|geometría}} es la forma, el {{mat|material}} la piel, la {{light|luz}} lo que la hace visible y el {{shader|shader}} el código de la GPU que puede deformarla. Estos cuatro colores significan lo mismo en toda la web.'),
      ],
      check: {
        type: 'mc',
        q: 'Apagas la luz y el objeto con `MeshStandardMaterial` se ve casi negro. ¿Por qué?',
        options: [
          'Porque el canvas se apaga',
          'Porque los materiales «físicos» calculan su color a partir de la luz que reciben: sin luz, no hay nada que calcular',
          'Porque la geometría desaparece sin luz',
        ],
        answer: 1,
        why: 'La forma sigue ahí (el esqueleto cian lo demuestra); lo que falta es la luz con la que el material calcula su color. `MeshBasicMaterial`, en cambio, ignora la luz.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'El mapa: de tu código al píxel',
      body: () => [
        figure(h('div', { html: PIPELINE_SVG })),
        P('Hay **dos mundos**. Arriba, tu JavaScript: objetos cómodos (cajas, luces, cámaras) que Three.js prepara para la tarjeta gráfica. Abajo, la GPU: todo son números y triángulos, y los *shaders* son los dos programas que puedes escribir tú. Los capítulos 1–3 del curso viven arriba; el capítulo 4 baja a la GPU. Vuelve a este esquema cuando te pierdas.'),
      ],
      check: {
        type: 'mc',
        q: '¿Qué hace el **vertex shader**?',
        options: [
          'Decide el color de cada píxel',
          'Calcula la posición final de cada vértice en la pantalla',
          'Carga las texturas del disco',
        ],
        answer: 1,
        why: 'Se ejecuta una vez por vértice y devuelve `gl_Position`. El color por píxel es trabajo del fragment shader; entre ambos, la rasterización reparte los triángulos en píxeles.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Las ocho palabras clave',
      body: () => [
        table(['Palabra', 'Qué es, en una frase'], [
          ['**Scene**', 'El escenario: la caja donde metes todo lo que quieres ver.'],
          ['**Camera**', 'Los ojos: desde dónde y con qué ángulo se mira.'],
          ['**Renderer**', 'El que hace la foto: escena + cámara → píxeles en un `<canvas>`.'],
          ['{{geo|Geometry}}', 'La forma: una lista de vértices (puntos con coordenadas).'],
          ['{{mat|Material}}', 'La apariencia. Por dentro es un **shader** ya escrito por Three.js.'],
          ['**Mesh**', '{{geo|Geometry}} + {{mat|Material}} = un objeto dibujable.'],
          ['{{light|Light}}', 'Una fuente de luz. Los materiales «estándar» la necesitan.'],
          ['{{shader|Shader}}', 'Programa que corre en la GPU: vertex (posiciones) y fragment (colores).'],
        ]),
      ],
      more: () => [
        callout('analogy', 'El plató de cine', [
          P('La *Scene* es el plató. La *Geometry* es el esqueleto de cada atrezo y el *Material* su pintura. Las *Lights* son los focos, la *Camera* la de rodaje y el *Renderer* el que revela la película. Un *Shader* es dar instrucciones precisas a miles de ayudantes (los núcleos de la GPU) que trabajan todos a la vez.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué necesitas como mínimo para ver un objeto en pantalla?',
        options: [
          'Solo una Geometry',
          'Un Mesh (Geometry + Material) en una Scene, más una Camera y un Renderer',
          'Una Light y una Camera',
        ],
        answer: 1,
        why: 'El Mesh junta forma y piel; la Scene lo contiene, la Camera encuadra y el Renderer dibuja. Con `MeshBasicMaterial` ni siquiera hace falta luz.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Cómo usar este cuaderno',
      body: () => [
        P('Cada lección es una serie de **tarjetas cortas**: una idea, algo que tocar y una pregunta. Las que falles vuelven a salir en el repaso final de la lección, y la barrita de arriba te marca en verde y rojo cómo vas. Puedes saltar a cualquier tarjeta tocando su segmento.'),
        P('Si tienes poco tiempo, la ruta mínima hasta *Modified materials* es esta:'),
        h('ol', {},
          h('li', { html: md('[La escena y el Mesh](#/escena) y [Geometrías](#/geometrias): las piezas.') }),
          h('li', { html: md('[Materiales](#/materiales), [Luces](#/luces) y [Sombras](#/sombras): para entender por qué la sombra se rompe al retorcer.') }),
          h('li', { html: md('[Cómo dibuja la GPU](#/gpu), [GLSL](#/glsl) y [Attributes, uniforms y varyings](#/variables): la base de los shaders.') }),
          h('li', { html: md('[Matrices y mat2](#/matrices): la matemática del twist.') }),
          h('li', { html: md('[Modified materials](#/modified): el objetivo final, con laboratorio.') }),
        ),
        callout('tip', 'El mejor consejo del cuaderno', [
          P('Cuando algo no te cuadre, **no releas: toca la demo**. Mueve el slider, rompe el código, mira el error. Casi todo se entiende moviendo cosas.'),
        ]),
      ],
    },
  ];
}
