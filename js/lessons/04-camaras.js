import { P, callout, codeBlock, demo, table, h } from '../ui.js';

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'La pirámide de visión',
      body: () => [
        demo({
          title: 'Lo que ve la cámara y su pirámide',
          aspect: '16 / 8',
          caption: 'Izquierda: lo que ve la cámara. Derecha: la misma escena desde fuera, con la cámara dibujada como pirámide (`CameraHelper`). Mueve `near` y `far` y mira cómo los cubos desaparecen al salir del rango.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [15, 11, 7], target: [0, 0, -7], fov: 45, far: 200, background: '#14171c' });
            const { THREE, scene, camera: viewCam, renderer, size } = stage;
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
              const half = 3.2;
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
              ? 'OrthographicCamera\nlas paralelas siguen paralelas;\nun objeto mide lo mismo\ncerca o lejos'
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
        P('Una `PerspectiveCamera(75, aspect, 0.1, 100)` define un **tronco de pirámide** (el *frustum*): solo se dibuja lo que cae dentro. `fov` es el ángulo de visión vertical en grados, `aspect` la proporción del canvas, y `near`/`far` las distancias mínima y máxima de dibujado.'),
      ],
      more: () => [
        callout('warn', 'No uses near = 0.0001 y far = 999999', [
          P('La GPU guarda la distancia de cada píxel con precisión limitada. Con un rango enorme, dos superficies cercanas se confunden y parpadean: el **z-fighting**. Usa el rango más corto que te sirva (`0.1` y `100` van bien casi siempre). Y entre 45 y 75 de fov es lo normal: poco fov = teleobjetivo, mucho = gran angular con distorsión.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué es el `fov` de una PerspectiveCamera?',
        options: [
          'La distancia máxima de dibujado',
          'El ángulo de visión vertical, en grados',
          'La proporción ancho/alto del canvas',
        ],
        answer: 1,
        why: 'fov = ángulo de visión (vertical). La distancia máxima es `far` y la proporción es `aspect`.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'La ortográfica: sin perspectiva',
      body: () => [
        P('La `OrthographicCamera` no tiene fov: define directamente una **caja** con `left, right, top, bottom, near, far`. Un objeto mide lo mismo cerca que lejos — el look de los planos técnicos y los juegos isométricos. (Actívala en la demo de la tarjeta anterior.) Para que no deforme, sus lados deben respetar el aspect ratio:'),
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
            ['-1 * aspectRatio', 'Izquierda y derecha multiplicadas por el aspect: la caja es más ancha que alta, como el canvas.'],
            ['  1,', 'Arriba 1 y abajo −1: la altura visible es siempre 2 unidades.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'En una cámara ortográfica, un cubo a 2 unidades y otro idéntico a 20 unidades se ven…',
        options: [
          'El lejano más pequeño, como siempre',
          'Exactamente del mismo tamaño',
          'El lejano borroso',
        ],
        answer: 1,
        why: 'Sin perspectiva no hay reducción con la distancia: la proyección es paralela. Por eso sirve para vistas técnicas e isométricas.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'OrbitControls',
      body: () => [
        P('Todas las demos de esta web se giran con el ratón (o el dedo) gracias a `OrbitControls`: la cámara orbita alrededor de un punto (el *target*). Arrastrar = orbitar, rueda = zoom, clic derecho = desplazar. En táctil: un dedo de lado gira, dos dedos hacen zoom e inclinan.'),
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
            ['import { OrbitControls }', 'No está en el paquete principal: vive en los «extras» (`examples/jsm`, también importable como `three/addons/…`).'],
            ['new OrbitControls(camera, canvas)', 'Qué cámara mover y qué elemento escucha el ratón.'],
            ['controls.enableDamping', 'Inercia: al soltar, la cámara se frena poco a poco. Se siente mucho mejor.'],
            ['controls.update()', '**Obligatorio en cada frame si usas damping**: es quien calcula la inercia.'],
          ],
        }),
      ],
      check: {
        type: 'fill',
        q: 'Activaste `enableDamping` pero la cámara se para en seco. ¿Qué línea falta en el tick?',
        pre: 'controls.', post: '()',
        answer: 'update',
        accept: ['update'],
        placeholder: 'método',
        size: 10,
        why: 'El damping se calcula frame a frame: sin `controls.update()` en el tick no hay inercia (ni se aplican los cambios de target).',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Resize: tres cosas que avisar',
      body: () => [
        codeBlock({
          title: 'script.js',
          code: `
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
            ['sizes.width = window.innerWidth', '1) Actualizar los tamaños.'],
            ['camera.aspect =', '2) La proporción de la cámara. Si te la saltas, la escena se estira.'],
            ['camera.updateProjectionMatrix()', '**Imprescindible**: `aspect`, `fov`, `near` y `far` se «hornean» en una matriz; hasta recalcularla, el cambio no existe.'],
            ['renderer.setSize', '3) Redimensionar el canvas.'],
            ["'dblclick'", 'De regalo: doble clic = pantalla completa.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Cambias `camera.aspect` en el resize pero la imagen sigue estirada. ¿Qué falta?',
        options: ['`camera.lookAt()`', '`camera.updateProjectionMatrix()`', 'Llamar a `renderer.render()` dos veces'],
        answer: 1,
        why: 'Los parámetros de la cámara no actúan directamente: se compilan en la matriz de proyección, y hay que pedir el recálculo.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'Pixel ratio: nitidez contra trabajo',
      body: () => [
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
          caption: 'El fragment shader se ejecuta **una vez por píxel real**: con pixel ratio 3 pinta 9 veces más que con 1.',
        }),
        P('Una pantalla «retina» tiene 2 o 3 píxeles físicos por cada píxel CSS. Dibujar con ratio 1 ahí se ve borroso; dibujar con 3 obliga a pintar 9 veces más píxeles. El punto medio estándar: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`.'),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué se limita el pixel ratio a 2 con `Math.min(window.devicePixelRatio, 2)`?',
        options: [
          'Porque 3 no es un valor permitido en Three.js',
          'Porque de 2 a 3 la mejora apenas se nota y el trabajo de la GPU se multiplica',
          'Para que la imagen sea más borrosa a propósito',
        ],
        answer: 1,
        why: 'De ratio 2 a 3 el ojo apenas nota diferencia, pero son 9/4 ≈ 2.25 veces más píxeles que pintar en cada frame.',
      },
    },
  ];
}
