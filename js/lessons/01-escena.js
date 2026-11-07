import { P, UL, callout, codeBlock, liveCode, demo, table, h } from '../ui.js';

const GEOS = {
  Caja: ['new THREE.BoxGeometry(1.3, 1.3, 1.3)', (T) => new T.BoxGeometry(1.3, 1.3, 1.3)],
  Esfera: ['new THREE.SphereGeometry(0.85, 32, 16)', (T) => new T.SphereGeometry(0.85, 32, 16)],
  Cono: ['new THREE.ConeGeometry(0.8, 1.6, 32)', (T) => new T.ConeGeometry(0.8, 1.6, 32)],
  Dona: ['new THREE.TorusGeometry(0.7, 0.28, 16, 48)', (T) => new T.TorusGeometry(0.7, 0.28, 16, 48)],
  'Nudo (TorusKnot)': ['new THREE.TorusKnotGeometry(0.6, 0.2, 128, 16)', (T) => new T.TorusKnotGeometry(0.6, 0.2, 128, 16)],
};

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Mesh = Geometry + Material',
      body: () => [
        demo({
          title: 'Monta tu propio Mesh',
          aspect: '16 / 10',
          caption: 'Cambia la forma y la piel y fíjate en **lo que no cambia** del código: siempre hay una geometría, un material y un `new THREE.Mesh(...)` que los junta.',
          setup({ makeStage, panel, side }) {
            const stage = makeStage({ pos: [2.4, 1.7, 3.6], fov: 45 });
            const { THREE, scene } = stage;
            scene.add(new THREE.AmbientLight('#ffffff', 0.55));
            const sun = new THREE.DirectionalLight('#ffffff', 2.4);
            sun.position.set(3, 4, 2);
            scene.add(sun);
            const axes = new THREE.AxesHelper(1.8);
            axes.visible = false;
            scene.add(axes);
            let mesh = null;
            const state = { geo: 'Caja', mat: 'MeshStandardMaterial', color: '#f472b6', wire: false };
            const code = liveCode({ title: 'script.js', lang: 'js' });
            const rebuild = () => {
              if (mesh) { mesh.geometry.dispose(); mesh.material.dispose(); scene.remove(mesh); }
              const geometry = GEOS[state.geo][1](THREE);
              let material;
              if (state.mat === 'MeshBasicMaterial') material = new THREE.MeshBasicMaterial({ color: state.color, wireframe: state.wire });
              else if (state.mat === 'MeshNormalMaterial') material = new THREE.MeshNormalMaterial({ wireframe: state.wire });
              else material = new THREE.MeshStandardMaterial({ color: state.color, roughness: 0.4, wireframe: state.wire });
              mesh = new THREE.Mesh(geometry, material);
              scene.add(mesh);
              const matArgs = state.mat === 'MeshNormalMaterial'
                ? `{ wireframe: ${state.wire} }`
                : `{ color: '${state.color}', wireframe: ${state.wire} }`;
              code.set(`const geometry = ${GEOS[state.geo][0]}
const material = new THREE.${state.mat}(${matArgs})
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)`);
            };
            stage.onTick((dt) => { if (mesh) mesh.rotation.y += dt * 0.5; });
            panel([
              { type: 'select', id: 'geo', label: 'Geometría (la forma)', options: Object.keys(GEOS), value: 'Caja', onInput: (v) => { state.geo = v; rebuild(); } },
              { type: 'select', id: 'mat', label: 'Material (la piel)', options: ['MeshStandardMaterial', 'MeshBasicMaterial', 'MeshNormalMaterial'], value: state.mat, onInput: (v) => { state.mat = v; rebuild(); } },
              { type: 'select', id: 'color', label: 'Color', options: [['#f472b6', 'Rosa'], ['#4cc9e0', 'Cian'], ['#ffc857', 'Ámbar'], ['#a493ff', 'Violeta'], ['#ffffff', 'Blanco']], value: state.color, onInput: (v) => { state.color = v; rebuild(); } },
              { type: 'check', id: 'wire', label: 'wireframe (solo las aristas)', value: false, onInput: (v) => { state.wire = v; rebuild(); } },
              { type: 'check', id: 'axes', label: 'Mostrar ejes (AxesHelper)', value: false, onInput: (v) => { axes.visible = v; } },
            ]);
            side.append(code.el);
          },
        }),
        P('Con `wireframe` ves la geometría desnuda: **cada línea es la arista de un triángulo**. Todo lo que dibuja una GPU son triángulos; Three.js te ahorra tener que montarlos a mano sobre WebGL, que es el lenguaje de bajo nivel del navegador para hablar con la tarjeta gráfica.'),
      ],
      more: () => [
        callout('analogy', 'WebGL y Three.js: el motor y el volante', [
          P('**WebGL** es el motor: potentísimo, pero para dibujar un solo cubo necesitas más de cien líneas (buffers, shaders, matrices…). **Three.js** es el volante y los pedales: dices «quiero una caja rosa» y la librería opera el motor por ti. En el capítulo de shaders levantaremos el capó y tocaremos el motor directamente.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué dos cosas necesita siempre un `THREE.Mesh`?',
        options: ['Una cámara y una luz', 'Una Geometry y un Material', 'Una Scene y un Renderer'],
        answer: 1,
        why: '`new THREE.Mesh(geometry, material)`: forma + piel. Escena, cámara y renderer son parte del proyecto, no del Mesh.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'El proyecto mínimo, línea a línea',
      body: () => [
        P('Un cubo rojo en pantalla: estas son **todas** las líneas que hacen falta, y cada una tiene su porqué.'),
        codeBlock({
          title: 'script.js',
          lang: 'js',
          code: `
import * as THREE from 'three'

const canvas = document.querySelector('canvas.webgl')

const scene = new THREE.Scene()

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

const sizes = { width: 800, height: 600 }

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.render(scene, camera)`,
          notes: [
            ['import * as THREE', 'Toda la librería dentro de un objeto `THREE`: por eso todo empieza por `THREE.`.'],
            ['document.querySelector', 'La etiqueta `<canvas class="webgl">` de tu HTML: Three.js dibuja **dentro** de ella.'],
            ['new THREE.BoxGeometry', 'La forma: 1×1×1 «unidades». La unidad es la que tú decidas (metros, cm…); Three.js no lo sabe.'],
            ['new THREE.MeshBasicMaterial', 'La piel más simple: color plano (`0xff0000` = rojo), ignora las luces.'],
            ['scene.add(mesh)', 'Sin esta línea el objeto existe pero **nadie lo dibuja**. Es el olvido más común.'],
            ['new THREE.PerspectiveCamera', '75 = campo de visión en grados; el segundo número, ancho ÷ alto.'],
            ['camera.position.z = 3', 'La cámara nace en (0, 0, 0), **dentro del cubo**. La alejamos 3 unidades hacia ti.'],
            ['renderer.render', '**Una** foto de la escena vista desde la cámara. Una, no una animación.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '¿Cuántas imágenes dibuja `renderer.render(scene, camera)` si solo lo llamas una vez?',
        options: ['60 por segundo, continuamente', 'Una sola (una foto fija)', 'Hasta que cierres la pestaña'],
        answer: 1,
        why: 'Una llamada = una imagen. Para animar hay que llamarlo en cada frame con un bucle: justo la lección de [Animaciones y el Clock](#/animar).',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Los ejes: x, y, z',
      body: () => [
        h('div', { class: 'figure', style: { maxWidth: '560px' } }, h('div', {
          html: `
<svg viewBox="0 0 560 250" role="img" aria-label="Ejes X, Y y Z de Three.js">
  <line x1="260" y1="140" x2="470" y2="140" stroke="#ff5a5a" stroke-width="3"/><polygon points="470,140 456,133 456,147" fill="#ff5a5a"/>
  <text x="478" y="146" fill="#ff5a5a" font-size="16" font-weight="700">X</text><text x="478" y="164" fill="#97a0b4" font-size="12.5">derecha</text>
  <line x1="260" y1="140" x2="260" y2="24" stroke="#5bd65b" stroke-width="3"/><polygon points="260,24 253,38 267,38" fill="#5bd65b"/>
  <text x="270" y="30" fill="#5bd65b" font-size="16" font-weight="700">Y</text><text x="270" y="48" fill="#97a0b4" font-size="12.5">arriba</text>
  <line x1="260" y1="140" x2="170" y2="215" stroke="#5a8dff" stroke-width="3"/><polygon points="170,215 177,200 184,209" fill="#5a8dff"/>
  <text x="140" y="232" fill="#5a8dff" font-size="16" font-weight="700">Z</text><text x="160" y="232" fill="#97a0b4" font-size="12.5">hacia ti</text>
  <circle cx="260" cy="140" r="5" fill="#fff"/><text x="272" y="160" fill="#c9cedb" font-size="12.5">(0, 0, 0)</text>
</svg>` })),
        P('**x** va a la derecha, **y** hacia arriba y **z** hacia ti, saliendo de la pantalla. Por eso `camera.position.z = 3` aleja la cámara hacia tu lado. Los colores son los mismos en Blender y en el `AxesHelper`: {{x|rojo = X}} {{y|verde = Y}} {{z|azul = Z}}.'),
      ],
      check: {
        type: 'fill',
        q: 'La cámara debe alejarse 3 unidades **hacia ti** para ver el cubo. Completa el eje:',
        pre: 'camera.position.', post: ' = 3',
        answer: 'z',
        accept: ['z'],
        placeholder: 'eje',
        size: 6,
        why: 'El eje z sale de la pantalla hacia ti. Con `y = 3` la verías desde arriba y con `x = 3`, desde un lado (y en ambos casos, además, habría que girarla con `lookAt`).',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Error típico: «no veo nada»',
      body: () => [
        demo({
          title: 'La cámara dentro del cubo',
          aspect: '16 / 8',
          caption: 'Mueve el slider hacia 0: cuando la cámara entra en el cubo, la pantalla se vacía.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 0, 4], fov: 60, orbit: false });
            const { THREE, scene, camera } = stage;
            const cube = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshNormalMaterial());
            scene.add(cube);
            cube.rotation.set(0.4, 0.6, 0);
            const msg = document.createElement('div');
            msg.className = 'overlay';
            stage.container.append(msg);
            const ui = panel([
              {
                type: 'range', id: 'z', label: 'camera.position.z', min: 0, max: 5, step: 0.05, value: 4,
                onInput: (z) => {
                  camera.position.z = z;
                  const inside = z < 0.71;
                  msg.textContent = inside ? 'La cámara está DENTRO del cubo → no se ve nada' : `camera.position.z = ${z.toFixed(2)}`;
                },
              },
              { type: 'button', label: 'Poner en 0 (el valor por defecto)', onClick: () => { ui.set('z', 0); camera.position.z = 0; msg.textContent = 'La cámara está DENTRO del cubo → no se ve nada'; } },
            ]);
          },
        }),
        P('Three.js solo dibuja la cara **exterior** de cada triángulo (*backface culling*). Si la cámara está dentro del cubo, ve las caras desde dentro y las descarta: pantalla vacía sin ningún error. Es el «no veo nada» más común de todos.'),
      ],
      more: () => [
        callout('warn', 'Lista de comprobación si no ves nada', [
          UL([
            '¿Hiciste `scene.add(mesh)`?',
            '¿La cámara está alejada del objeto? (`camera.position.z = 3`)',
            '¿El canvas tiene tamaño mayor que 0?',
            '¿Llamaste a `renderer.render(scene, camera)`?',
            '¿Material con luz (`Standard`, `Lambert`…) pero sin ninguna luz en la escena?',
            'Mira la consola (F12): casi siempre hay un error en rojo.',
          ]),
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Cubo en (0,0,0), cámara en (0,0,0), `scene.add(mesh)` hecho. ¿Qué ves?',
        options: ['El cubo, enorme', 'Nada: la cámara está dentro y las caras se descartan', 'Un error de JavaScript en la consola'],
        answer: 1,
        why: 'No hay error: todo es «correcto» para Three.js. Simplemente las caras, vistas desde dentro, no se dibujan. Solución: `camera.position.z = 3`.',
      },
    },
  ];
}
