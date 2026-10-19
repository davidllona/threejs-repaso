import { P, H2, H3, UL, callout, codeBlock, liveCode, demo, table, quiz, figure, h } from '../ui.js';

const GEOS = {
  Caja: ['new THREE.BoxGeometry(1.3, 1.3, 1.3)', (T) => new T.BoxGeometry(1.3, 1.3, 1.3)],
  Esfera: ['new THREE.SphereGeometry(0.85, 32, 16)', (T) => new T.SphereGeometry(0.85, 32, 16)],
  Cono: ['new THREE.ConeGeometry(0.8, 1.6, 32)', (T) => new T.ConeGeometry(0.8, 1.6, 32)],
  Dona: ['new THREE.TorusGeometry(0.7, 0.28, 16, 48)', (T) => new T.TorusGeometry(0.7, 0.28, 16, 48)],
  'Nudo (TorusKnot)': ['new THREE.TorusKnotGeometry(0.6, 0.2, 128, 16)', (T) => new T.TorusKnotGeometry(0.6, 0.2, 128, 16)],
};

export default function render(root) {
  root.append(
    H2('¿Qué es WebGL y por qué usamos Three.js?'),
    P('**WebGL** es una pieza del navegador que permite hablar directamente con la tarjeta gráfica (GPU) para dibujar **triángulos, líneas y puntos**. Todo lo que ves en 3D en una web (un cubo, un coche, una galaxia) acaba siendo eso: triángulos muy pequeños pintados muy rápido.'),
    P('El problema es que WebGL es de **muy bajo nivel**. Para dibujar un solo cubo con WebGL puro necesitas más de cien líneas: crear buffers, compilar shaders, calcular matrices a mano… Es como querer conducir manejando cada pieza del motor.'),
    callout('analogy', 'Analogía del coche', [
      P('**WebGL** es el motor y la caja de cambios: potentísimo, pero tienes que operarlo pieza a pieza. **Three.js** es el volante y los pedales: tú dices «quiero una caja roja aquí» y la librería hace todo el trabajo sucio con WebGL por debajo. Por eso, más adelante, cuando bajemos a los *shaders*, vas a notar que estás tocando directamente «el motor».'),
    ]),

    H2('Los cuatro ingredientes de cualquier proyecto'),
    P('Da igual si es un cubo o una escena de película: siempre necesitas estas cuatro cosas.'),
    table(['Ingrediente', 'Qué es', 'Analogía'], [
      ['**Scene**', 'El contenedor donde metes todo lo que quieres ver', 'El plató'],
      ['**Mesh**', '{{geo|Geometry}} + {{mat|Material}}: el objeto visible', 'Un atrezo ya pintado'],
      ['**Camera**', 'El punto de vista (posición y ángulo de visión)', 'La cámara de rodaje'],
      ['**Renderer**', 'Dibuja la escena vista desde la cámara en un `<canvas>`', 'El que revela la foto'],
    ]),

    H3('El código mínimo, línea a línea'),
    P('Este es el proyecto más pequeño posible: un cubo rojo. Pulsa «Ocultar explicación» si quieres ver el código limpio.'),
    codeBlock({
      title: 'script.js',
      lang: 'js',
      code: `
import * as THREE from 'three'

// 1. El lienzo donde se dibujará todo
const canvas = document.querySelector('canvas.webgl')

// 2. La escena
const scene = new THREE.Scene()

// 3. El objeto: forma + piel
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)

// 4. El tamaño del lienzo
const sizes = { width: 800, height: 600 }

// 5. La cámara
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3
scene.add(camera)

// 6. El renderer
const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.setSize(sizes.width, sizes.height)

// 7. ¡Foto!
renderer.render(scene, camera)`,
      notes: [
        ["import * as THREE", 'Trae toda la librería y la guarda en un objeto llamado `THREE`. Todo lo que uses empezará por `THREE.` (`THREE.Scene`, `THREE.Mesh`…).'],
        ["document.querySelector", 'Busca en el HTML la etiqueta `<canvas class="webgl">`. Three.js dibujará **dentro** de ese canvas. Si no existe, devuelve `null` y nada funcionará.'],
        ["new THREE.Scene()", 'Crea la escena, vacía por ahora. Piénsala como una lista de cosas que existen en el mundo 3D.'],
        ["new THREE.BoxGeometry", 'La **forma**: una caja de 1×1×1 unidades (ancho, alto, profundidad). Una «unidad» es lo que tú decidas: metros, centímetros… Three.js no lo sabe.'],
        ["new THREE.MeshBasicMaterial", 'La **piel**: un material que pinta un color plano (`0xff0000` es rojo en hexadecimal). No reacciona a luces.'],
        ["new THREE.Mesh(", 'Une forma y piel en un objeto. **Un Mesh necesita siempre las dos cosas.**'],
        ["scene.add(mesh)", 'Mete el objeto en la escena. Si te olvidas de esta línea, el objeto existe pero **nadie lo dibuja**.'],
        ["const sizes", 'Guardamos el tamaño en un objeto porque lo usaremos varias veces (cámara y renderer).'],
        ["new THREE.PerspectiveCamera", 'Una cámara con perspectiva (lo lejano se ve más pequeño, como en la realidad). El primer número, 75, es el **campo de visión** en grados; el segundo, el **aspect ratio** (ancho ÷ alto).'],
        ["camera.position.z = 3", 'Por defecto la cámara está en (0, 0, 0), **justo dentro del cubo**. La alejamos 3 unidades hacia ti (eje z) para verlo desde fuera.'],
        ["scene.add(camera)", 'No es obligatorio para que se vea, pero es buena costumbre (y necesario si le añades hijos a la cámara).'],
        ["new THREE.WebGLRenderer", 'El renderer es quien habla con WebGL. Le pasamos nuestro canvas para que dibuje ahí.'],
        ["renderer.setSize", 'Ajusta el tamaño del canvas en píxeles.'],
        ["renderer.render", 'Hace **una** foto de la escena vista desde la cámara. Una sola, no una animación: para animar hay que repetirlo (lección «Animaciones»).'],
      ],
    }),

    H3('Los ejes: dónde está cada cosa'),
    P('Three.js usa un sistema de ejes en el que **x** va hacia la derecha, **y** hacia arriba y **z** hacia ti (hacia fuera de la pantalla). Por eso `camera.position.z = 3` aleja la cámara. Es el mismo código de color de Blender y del `AxesHelper`: {{x|rojo = X}} {{y|verde = Y}} {{z|azul = Z}}.'),
    h('div', { class: 'figure', style: { maxWidth: '560px' } }, h('div', {
      html: `
<svg viewBox="0 0 560 250" role="img" aria-label="Ejes X, Y y Z de Three.js">
  <line x1="260" y1="140" x2="470" y2="140" stroke="#ff5a5a" stroke-width="3"/><polygon points="470,140 456,133 456,147" fill="#ff5a5a"/>
  <text x="478" y="146" fill="#ff5a5a" font-size="16" font-weight="700">X</text><text x="478" y="164" fill="#97a0b4" font-size="12.5">derecha</text>
  <line x1="260" y1="140" x2="260" y2="24" stroke="#5bd65b" stroke-width="3"/><polygon points="260,24 253,38 267,38" fill="#5bd65b"/>
  <text x="270" y="30" fill="#5bd65b" font-size="16" font-weight="700">Y</text><text x="270" y="48" fill="#97a0b4" font-size="12.5">arriba</text>
  <line x1="260" y1="140" x2="170" y2="215" stroke="#5a8dff" stroke-width="3"/><polygon points="170,215 177,200 184,209" fill="#5a8dff" transform="rotate(0)"/>
  <text x="140" y="232" fill="#5a8dff" font-size="16" font-weight="700">Z</text><text x="160" y="232" fill="#97a0b4" font-size="12.5">hacia ti</text>
  <circle cx="260" cy="140" r="5" fill="#fff"/><text x="272" y="160" fill="#c9cedb" font-size="12.5">(0, 0, 0)</text>
</svg>` })),

    H2('Prueba: Mesh = Geometry + Material'),
    P('Cambia la geometría y el material y observa las tres primeras líneas del código. **Fíjate en lo que no cambia**: siempre hay una forma, una piel y un `new THREE.Mesh(geometry, material)` que las junta.'),
    demo({
      title: 'Monta tu propio Mesh',
      aspect: '16 / 10',
      caption: 'El `MeshStandardMaterial` y los demás materiales «con luz» se ven oscuros sin luces; en esta demo hay una luz direccional y una ambiente ya puestas. El `MeshBasicMaterial` las ignora.',
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
          { type: 'check', id: 'wire', label: 'wireframe (ver solo las aristas)', value: false, onInput: (v) => { state.wire = v; rebuild(); } },
          { type: 'check', id: 'axes', label: 'Mostrar ejes (AxesHelper)', value: false, onInput: (v) => { axes.visible = v; } },
        ]);
        side.append(code.el);
      },
    }),
    P('Con `wireframe` activado ves la geometría desnuda: **cada línea es una arista de un triángulo**. Recuerda: todo en 3D son triángulos.'),

    H2('Error típico: «no veo nada»'),
    P('Es lo que más te va a pasar. Esta demo reproduce el fallo más común: la cámara empieza en el origen, que es justo donde está el cubo. Mueve el slider para sacarla del cubo:'),
    demo({
      title: 'La cámara dentro del cubo',
      aspect: '16 / 8',
      caption: 'Three.js solo dibuja la cara **exterior** de los triángulos (a eso se le llama *backface culling*). Si la cámara está dentro del cubo, ve las caras desde dentro y las descarta: pantalla vacía.',
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

    callout('warn', 'Lista de comprobación si no ves nada', [
      UL([
        '¿Hiciste `scene.add(mesh)`?',
        '¿La cámara está alejada del objeto? (`camera.position.z = 3`)',
        '¿El canvas tiene tamaño? (ancho y alto mayores que 0)',
        '¿Llamaste a `renderer.render(scene, camera)`?',
        '¿Usas un material con luz (`Standard`, `Lambert`…) pero sin ninguna luz en la escena?',
        'Mira la consola del navegador (F12): casi siempre hay un error escrito en rojo.',
      ]),
    ]),

    quiz([
      {
        q: '¿Qué dos cosas necesita siempre un `THREE.Mesh`?',
        options: ['Una cámara y una luz', 'Una Geometry y un Material', 'Una Scene y un Renderer', 'Un canvas y un tamaño'],
        answer: 1,
        why: '`new THREE.Mesh(geometry, material)`: la forma y la piel. Escena, cámara y renderer son parte del proyecto, no del Mesh.',
      },
      {
        q: 'Escribes `scene.add(mesh)` pero la cámara está en (0, 0, 0) y el cubo también. ¿Qué verás?',
        options: ['El cubo normal', 'Nada: la cámara está dentro del cubo', 'Un cubo gigante', 'Un error de JavaScript'],
        answer: 1,
        why: 'Three.js descarta las caras vistas desde dentro. Por eso se hace `camera.position.z = 3`.',
      },
      {
        q: 'En Three.js, ¿qué eje apunta hacia ti, saliendo de la pantalla?',
        options: ['x', 'y', 'z', 'w'],
        answer: 2,
        why: 'x → derecha, y → arriba, z → hacia ti. Una cámara con `position.z = 3` mira hacia el origen desde delante.',
      },
      {
        q: '¿Cuántas veces dibuja `renderer.render(scene, camera)` si solo lo llamas una vez?',
        options: ['Continuamente, 60 veces por segundo', 'Una sola vez (una foto)', 'Hasta que cierres la pestaña', 'Depende del material'],
        answer: 1,
        why: 'Una llamada = una imagen fija. Para animar hay que llamar a render en cada frame con un bucle (lección «Animaciones y el Clock»).',
      },
    ]),
  );
}
