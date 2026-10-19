import { P, H2, H3, UL, callout, codeBlock, demo, table, quiz, eq, h } from '../ui.js';

export default function render(root) {
  root.append(
    P('La cámara no es un objeto que se vea: es **un punto de vista y una forma de proyectar** el mundo 3D sobre la pantalla 2D. Three.js tiene varias; las dos que importan son `PerspectiveCamera` (la normal, como el ojo o una cámara de fotos) y `OrthographicCamera` (sin perspectiva, como un plano técnico o un juego isométrico).'),

    H2('PerspectiveCamera: los cuatro números'),
    codeBlock({
      title: 'script.js',
      code: `const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)`,
      notes: [
        ['new THREE.PerspectiveCamera', 'Estos cuatro argumentos definen un «tronco de pirámide» (frustum): solo se dibuja lo que cae dentro de él.'],
      ],
    }),
    table(['Argumento', 'Nombre', 'Qué hace'], [
      ['`75`', '**fov** (field of view)', 'Ángulo de visión **vertical** en grados. Pequeño = teleobjetivo (zoom, todo plano). Grande = gran angular (mucha distorsión). Entre 45 y 75 es lo normal.'],
      ['`sizes.width / sizes.height`', '**aspect ratio**', 'Proporción ancho/alto del canvas. Si no coincide con el canvas, la imagen se ve estirada.'],
      ['`0.1`', '**near**', 'Lo que esté **más cerca** de la cámara que esto no se dibuja.'],
      ['`100`', '**far**', 'Lo que esté **más lejos** que esto no se dibuja.'],
    ]),
    callout('warn', 'No uses near = 0.0001 y far = 999999', [
      P('Parece buena idea «dibujarlo todo», pero la GPU guarda la distancia de cada píxel con precisión limitada. Si el rango es enorme, dos superficies cercanas se confunden y aparece un parpadeo feo llamado **z-fighting**. Usa el rango más corto que te sirva (por ejemplo `0.1` y `100`).'),
    ]),

    H3('Míralo desde fuera'),
    P('A la izquierda ves **lo que ve la cámara**. A la derecha, la misma escena desde fuera con la cámara dibujada como una pirámide (`CameraHelper`). Mueve `near` y `far` y fíjate cómo los cubos desaparecen cuando salen del rango. Prueba también la cámara ortográfica.'),
    demo({
      title: 'Lo que ve la cámara y su pirámide de visión',
      aspect: '16 / 8',
      caption: 'Arrastra en la mitad derecha para orbitar la vista exterior. Los cubos más cercanos están en z = 4 y los más lejanos en z = −20.',
      setup({ makeStage, panel }) {
        const stage = makeStage({ pos: [15, 11, 7], target: [0, 0, -7], fov: 45, far: 200, background: '#14171c' });
        const { THREE, scene, camera: viewCam, renderer, size } = stage;

        // Decorado: una fila de cubos a distintas distancias
        const colors = ['#ff5a5a', '#ffc857', '#5bd65b', '#4cc9e0', '#5a8dff', '#a493ff', '#f472b6'];
        for (let i = 0; i < 7; i++) {
          const z = 4 - i * 4;
          const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2 + (i % 2), 1.4), new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.5 }));
          m.position.set(i % 2 ? -1.8 : 1.8, 1, z);
          scene.add(m);
        }
        const floor = new THREE.GridHelper(60, 60, '#4a5266', '#2a303c');
        floor.position.y = -0.1;
        scene.add(floor);
        scene.add(new THREE.AmbientLight('#fff', 0.8));
        const sun = new THREE.DirectionalLight('#fff', 2.4);
        sun.position.set(4, 8, 6);
        scene.add(sun);

        // Las dos cámaras que comparamos
        const persp = new THREE.PerspectiveCamera(50, 1, 2, 18);
        const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 2, 18);
        let cam = persp;
        [persp, ortho].forEach((c) => c.position.set(0, 1.2, 9));
        let helper = null;
        const st = { fov: 50, near: 2, far: 18, ortho: false };

        const apply = () => {
          const aspect = (size.width / 2) / size.height;
          persp.fov = st.fov; persp.near = st.near; persp.far = st.far; persp.aspect = aspect;
          persp.updateProjectionMatrix();
          const half = 3.2; // «altura» visible de la ortográfica
          ortho.left = -half * aspect; ortho.right = half * aspect; ortho.top = half; ortho.bottom = -half;
          ortho.near = st.near; ortho.far = st.far;
          ortho.updateProjectionMatrix();
          cam = st.ortho ? ortho : persp;
          if (helper) { scene.remove(helper); helper.dispose(); }
          helper = new THREE.CameraHelper(cam);
          scene.add(helper);
          helper.update();
        };
        stage.onResize(apply);

        // Dibujamos dos viewports: izquierda = cámara, derecha = vista exterior
        stage.setRender(() => {
          const w = size.width, hgt = size.height;
          renderer.setScissorTest(true);
          helper.visible = false;
          renderer.setViewport(0, 0, w / 2, hgt);
          renderer.setScissor(0, 0, w / 2, hgt);
          renderer.render(scene, cam);
          helper.visible = true;
          viewCam.aspect = (w / 2) / hgt;
          viewCam.updateProjectionMatrix();
          renderer.setViewport(w / 2, 0, w / 2, hgt);
          renderer.setScissor(w / 2, 0, w / 2, hgt);
          renderer.render(scene, viewCam);
          renderer.setScissorTest(false);
        });
        const divider = h('div', { style: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'var(--shader)', pointerEvents: 'none' } });
        const l1 = h('div', { class: 'overlay', style: { top: '8px', bottom: 'auto', right: '52%' } }, 'Lo que ve la cámara');
        const l2 = h('div', { class: 'overlay', style: { top: '8px', bottom: 'auto', left: '52%' } }, 'Vista exterior');
        stage.container.append(divider, l1, l2);

        let ui;
        const info = () => (st.ortho
          ? 'OrthographicCamera\nlas líneas paralelas siguen\nsiendo paralelas; un objeto\nmide lo mismo cerca o lejos'
          : `PerspectiveCamera(${st.fov}, aspect, ${st.near.toFixed(1)}, ${st.far.toFixed(1)})\nlo lejano se ve más pequeño`);
        const refresh = () => { if (ui) ui.readout('r', info()); };
        ui = panel([
          { type: 'check', id: 'ortho', label: 'Cámara ortográfica (sin perspectiva)', value: false, onInput: (v) => { st.ortho = v; apply(); refresh(); } },
          { type: 'range', id: 'fov', label: 'fov (grados, solo perspectiva)', min: 15, max: 120, step: 1, value: 50, onInput: (v) => { st.fov = v; apply(); refresh(); } },
          { type: 'range', id: 'near', label: 'near', min: 0.1, max: 12, step: 0.1, value: 2, onInput: (v) => { st.near = Math.min(v, st.far - 0.5); apply(); refresh(); } },
          { type: 'range', id: 'far', label: 'far', min: 3, max: 40, step: 0.5, value: 18, onInput: (v) => { st.far = Math.max(v, st.near + 0.5); apply(); refresh(); } },
          { type: 'readout', id: 'r' },
        ]);
        refresh();
      },
    }),

    H3('OrthographicCamera'),
    P('No tiene `fov` ni perspectiva: define directamente una **caja** con `left, right, top, bottom, near, far`. Un objeto mide lo mismo estando cerca que lejos. Para que no se deforme hay que respetar el aspect ratio:'),
    codeBlock({
      title: 'script.js',
      code: `
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(
  -1 * aspectRatio,
  1 * aspectRatio,
  1,
  -1,
  0.1,
  100
)`,
      notes: [
        ['const aspectRatio', 'Ancho entre alto. En una pantalla 16:9 vale 1.78.'],
        ['-1 * aspectRatio', 'Izquierda y derecha se multiplican por el aspect ratio: la caja es más ancha que alta, igual que el canvas.'],
        ['  1,', '  -1,', 'Arriba (1) y abajo (-1): la altura visible es 2 unidades, sea cual sea la pantalla.'],
        ['0.1', 'near y far funcionan igual que en la perspectiva.'],
      ],
    }),

    H2('Controlar la cámara: OrbitControls'),
    P('Todas las demos de esta web las puedes girar con el ratón, y es porque usan `OrbitControls`: una utilidad que mueve la cámara alrededor de un punto (el *target*). Arrastrar = orbitar, rueda = zoom, clic derecho = desplazar.'),
    codeBlock({
      title: 'script.js',
      code: `
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.y = 1

const tick = () => {
  controls.update()
  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}`,
      notes: [
        ['import { OrbitControls }', 'No viene en el paquete principal; está en la carpeta de «extras» (`examples/jsm`). En esta web verás la ruta `three/addons/…`, que es la misma cosa con otro nombre.'],
        ['new OrbitControls(camera, canvas)', 'Necesita saber **qué cámara** mover y **qué elemento** escucha los eventos del ratón (el canvas).'],
        ['controls.enableDamping', 'Añade inercia: al soltar, la cámara se frena poco a poco en vez de pararse en seco. Se siente mucho mejor.'],
        ['controls.target.y = 1', 'El punto alrededor del que gira la cámara. Por defecto es (0,0,0). Si lo cambias, hay que llamar a `controls.update()` para que se aplique.'],
        ['controls.update()', 'Obligatorio en cada frame **si usas damping**: es el que calcula la inercia.'],
      ],
    }),

    H2('Que se adapte a la pantalla: resize y pixel ratio'),
    P('En un proyecto real el canvas ocupa toda la ventana, y la ventana cambia de tamaño. Hay que avisar a tres cosas: **sizes**, **cámara** y **renderer**.'),
    codeBlock({
      title: 'script.js',
      code: `
const sizes = { width: window.innerWidth, height: window.innerHeight }

window.addEventListener('resize', () => {
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('dblclick', () => {
  if (!document.fullscreenElement) canvas.requestFullscreen()
  else document.exitFullscreen()
})`,
      notes: [
        ['const sizes', 'Empezamos con el tamaño actual de la ventana en píxeles CSS.'],
        ["addEventListener('resize'", 'Esta función se ejecuta cada vez que cambia el tamaño de la ventana.'],
        ['sizes.width = window.innerWidth', 'Actualizamos nuestro objeto de tamaños con los nuevos valores.'],
        ['camera.aspect =', 'Actualizamos la proporción de la cámara. Si te olvidas, la escena se ve estirada.'],
        ['camera.updateProjectionMatrix()', '**Imprescindible.** Cambiar `aspect`, `fov`, `near` o `far` no tiene efecto hasta que recalculas la matriz de proyección de la cámara.'],
        ['renderer.setSize', 'Redimensiona el canvas.'],
        ['setPixelRatio(Math.min', 'Ajusta la nitidez en pantallas retina. Está explicado justo debajo: `Math.min(…, 2)` es para no pasarnos.'],
        ["'dblclick'", 'Doble clic = pantalla completa.'],
        ['canvas.requestFullscreen()', 'Pide al navegador que ponga el canvas en pantalla completa; `document.fullscreenElement` dice si ya lo está. (Safari antiguo necesita el prefijo `webkit`).'],
      ],
    }),

    H3('Pixel ratio: por qué importa'),
    P('Una pantalla «retina» tiene **dos píxeles físicos por cada píxel CSS** en cada eje (pixel ratio = 2), o incluso tres. Si dibujas con un pixel ratio de 1 en una pantalla retina, la imagen se ve borrosa; pero si dibujas con 3 en un móvil, la GPU tiene que pintar **9 veces más píxeles** que con 1. Por eso se limita a 2: `Math.min(window.devicePixelRatio, 2)`. Pruébalo con números:'),
    demo({
      title: 'Calculadora de píxeles',
      aspect: '16 / 6',
      side: false,
      setup({ stageEl }) {
        stageEl.style.background = 'var(--surface)';
        stageEl.style.backgroundImage = 'none';
        stageEl.style.aspectRatio = 'auto';
        let w = 1280, hh = 720, dpr = 2;
        const out = h('div', { class: 'readout', style: { margin: '0 0 14px', fontSize: '14px' } });
        const mkSlider = (label, min, max, step, value, on) => {
          const o = h('output', {}, value);
          const i = h('input', { type: 'range', min, max, step, value, style: { width: '100%', accentColor: 'var(--shader)' } });
          i.addEventListener('input', () => { o.textContent = i.value; on(+i.value); paint(); });
          return h('label', { class: 'ctl', style: { marginBottom: '10px' } }, h('span', {}, label), o, i);
        };
        const paint = () => {
          const real = Math.round(w * dpr) * Math.round(hh * dpr);
          const base = w * hh;
          out.textContent =
`Canvas en píxeles CSS:   ${w} × ${hh}  =  ${base.toLocaleString('es-ES')} px
Con pixel ratio ${dpr}:      ${Math.round(w * dpr)} × ${Math.round(hh * dpr)}  =  ${real.toLocaleString('es-ES')} px reales
La GPU pinta ${(real / base).toFixed(1)}× más píxeles que con pixel ratio 1
Tu pantalla ahora mismo: devicePixelRatio = ${window.devicePixelRatio}`;
        };
        const wrap = h('div', { style: { padding: '20px', width: '100%' } },
          mkSlider('Ancho del canvas (px CSS)', 400, 2560, 10, w, (v) => { w = v; }),
          mkSlider('Alto del canvas (px CSS)', 300, 1440, 10, hh, (v) => { hh = v; }),
          mkSlider('Pixel ratio (devicePixelRatio)', 1, 3, 0.5, dpr, (v) => { dpr = v; }),
          out);
        stageEl.append(wrap);
        paint();
      },
      caption: 'Un fragment shader se ejecuta **una vez por píxel real**. Triplicar el pixel ratio multiplica por 9 el trabajo del shader. Por eso en el capítulo de shaders esto cobra mucha importancia.',
    }),

    quiz([
      {
        q: 'Cambias `camera.aspect` en el evento resize pero la imagen sigue estirada. ¿Qué falta?',
        options: ['`camera.updateProjectionMatrix()`', '`camera.lookAt()`', '`renderer.render()` dos veces', 'Nada, es un error del navegador'],
        answer: 0,
        why: 'Los parámetros de la cámara se «hornean» en una matriz de proyección. Hasta que no la recalculas con `updateProjectionMatrix()`, el cambio no tiene efecto.',
      },
      {
        q: '¿Qué hace el `fov` de una PerspectiveCamera?',
        options: ['Define cuántos objetos se dibujan', 'Es el ángulo de visión vertical en grados', 'Define la distancia máxima de dibujado', 'Define la proporción ancho/alto'],
        answer: 1,
        why: 'Un fov pequeño es como un teleobjetivo; uno grande como un gran angular. La distancia máxima es `far` y la proporción es `aspect`.',
      },
      {
        q: 'En un móvil con `devicePixelRatio = 3`, ¿por qué conviene usar `Math.min(window.devicePixelRatio, 2)`?',
        options: ['Porque 3 no es un valor permitido', 'Porque pintar 9 veces más píxeles que con 1 consume mucho rendimiento y la mejora apenas se nota', 'Porque Three.js solo soporta 1 y 2', 'Para que la imagen sea más borrosa'],
        answer: 1,
        why: 'Pasar de 2 a 3 casi no se aprecia, pero supone 9/4 = 2.25 veces más trabajo para la GPU.',
      },
      {
        q: 'Con `controls.enableDamping = true`, ¿qué tienes que hacer en cada frame?',
        options: ['Nada', 'Llamar a `controls.update()`', 'Llamar a `controls.reset()`', 'Recrear los controles'],
        answer: 1,
        why: 'El damping calcula la inercia frame a frame; sin `controls.update()` en el tick, la cámara no se mueve con suavidad.',
      },
    ]),
  );
}
