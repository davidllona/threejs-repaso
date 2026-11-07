import { P, callout, codeBlock, demo, table } from '../ui.js';

const FACTORY = {
  Plano: {
    make: (T, a, b) => new T.PlaneGeometry(2, 2, a, b),
    code: (a, b) => `new THREE.PlaneGeometry(2, 2, ${a}, ${b})`,
  },
  Caja: {
    make: (T, a, b) => new T.BoxGeometry(1.6, 1.6, 1.6, a, b, a),
    code: (a, b) => `new THREE.BoxGeometry(1.6, 1.6, 1.6, ${a}, ${b}, ${a})`,
  },
  Esfera: {
    make: (T, a, b) => new T.SphereGeometry(1, Math.max(3, a), Math.max(2, b)),
    code: (a, b) => `new THREE.SphereGeometry(1, ${Math.max(3, a)}, ${Math.max(2, b)})`,
  },
  Dona: {
    make: (T, a, b) => new T.TorusGeometry(0.9, 0.38, Math.max(3, b), Math.max(3, a)),
    code: (a, b) => `new THREE.TorusGeometry(0.9, 0.38, ${Math.max(3, b)}, ${Math.max(3, a)})`,
  },
};

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Una forma son puntos y triángulos',
      body: () => [
        demo({
          title: 'Segmentos, vértices y triángulos',
          aspect: '16 / 10',
          caption: 'Sube y baja los segmentos y mira el contador. Prueba la **Caja con 1×1**: tiene 24 vértices, no 8 — cada esquina se repite 3 veces, una por cara, porque cada cara necesita su propia normal y su propia UV.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [2.4, 1.8, 3.4], fov: 45 });
            const { THREE, scene } = stage;
            scene.add(new THREE.AmbientLight('#fff', 1));
            const solidMat = new THREE.MeshBasicMaterial({ color: '#262b38', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, side: THREE.DoubleSide });
            const wireMat = new THREE.MeshBasicMaterial({ color: '#4cc9e0', wireframe: true });
            const pointsMat = new THREE.PointsMaterial({ color: '#ffc857', size: 0.045 });
            const group = new THREE.Group();
            scene.add(group);
            let geometry = null;
            const parts = {};
            const state = { kind: 'Esfera', a: 12, b: 8, wire: true, solid: true, pts: true };
            let ui;
            const rebuild = () => {
              geometry?.dispose();
              group.clear();
              geometry = FACTORY[state.kind].make(THREE, state.a, state.b);
              parts.solid = new THREE.Mesh(geometry, solidMat);
              parts.wire = new THREE.Mesh(geometry, wireMat);
              parts.points = new THREE.Points(geometry, pointsMat);
              group.add(parts.solid, parts.wire, parts.points);
              parts.solid.visible = state.solid; parts.wire.visible = state.wire; parts.points.visible = state.pts;
              const n = geometry.attributes.position.count;
              const tri = (geometry.index ? geometry.index.count : n) / 3;
              if (ui) ui.readout('info', `${FACTORY[state.kind].code(state.a, state.b)}\n\nvértices:   ${n}\ntriángulos: ${tri}\nnúmeros en position: ${n} × 3 = ${n * 3}`);
            };
            stage.onTick((dt) => { group.rotation.y += dt * 0.25; });
            ui = panel([
              { type: 'select', id: 'kind', label: 'Geometría', options: Object.keys(FACTORY), value: state.kind, onInput: (v) => { state.kind = v; rebuild(); } },
              { type: 'range', id: 'a', label: 'segmentos A', min: 1, max: 32, step: 1, value: state.a, onInput: (v) => { state.a = v; rebuild(); } },
              { type: 'range', id: 'b', label: 'segmentos B', min: 1, max: 32, step: 1, value: state.b, onInput: (v) => { state.b = v; rebuild(); } },
              { type: 'check', id: 'solid', label: 'Caras (relleno)', value: true, onInput: (v) => { state.solid = v; if (parts.solid) parts.solid.visible = v; } },
              { type: 'check', id: 'wire', label: 'Triángulos (wireframe)', value: true, onInput: (v) => { state.wire = v; if (parts.wire) parts.wire.visible = v; } },
              { type: 'check', id: 'pts', label: 'Vértices (puntos)', value: true, onInput: (v) => { state.pts = v; if (parts.points) parts.points.visible = v; } },
              { type: 'readout', id: 'info' },
            ], { initial: false });
            rebuild();
          },
        }),
        P('Una geometría es la **forma descrita con números**: los {{geo|vértices}} son puntos con coordenadas (x, y, z) y las caras son triángulos que los unen — como los dibujos de «une los puntos». Más segmentos = superficie más suave = más trabajo para la GPU.'),
      ],
      check: {
        type: 'mc',
        q: 'Subes los segmentos de una esfera de 12×8 a 48×32. ¿Qué ganas y qué pagas?',
        options: [
          'Más suavidad gratis: la GPU no lo nota',
          'Superficie más suave a cambio de muchos más vértices y triángulos que procesar',
          'Solo cambia el tamaño de la esfera',
        ],
        answer: 1,
        why: 'Cada segmento añade vértices (y el vertex shader se ejecuta una vez por vértice). El detalle siempre se paga; la gracia está en usar los justos.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Por dentro: BufferGeometry',
      body: () => [
        P('Toda geometría es un `BufferGeometry`: un contenedor de **atributos**, y cada atributo una lista plana de números en un `Float32Array` que la GPU lee a toda velocidad. Un triángulo = 9 números:'),
        codeBlock({
          title: 'script.js',
          code: `
const positionsArray = new Float32Array([
  0, 0, 0,   // vértice 0
  0, 1, 0,   // vértice 1
  1, 0, 0,   // vértice 2
])

const positionsAttribute = new THREE.BufferAttribute(positionsArray, 3)

const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', positionsAttribute)`,
          notes: [
            ['new Float32Array', 'Números decimales de 32 bits, planos: x, y, z, x, y, z… Es el formato de la GPU.'],
            ['new THREE.BufferAttribute(positionsArray, 3)', 'El **3** (itemSize) dice cuántos números forman un vértice.'],
            ["setAttribute('position'", 'El nombre **importa**: es el que los shaders esperan. Otros: `normal`, `uv`, `color`.'],
          ],
        }),
        table(['Atributo', 'Números por vértice', 'Qué guarda'], [
          ['`position`', '3', 'Dónde está el vértice. El único obligatorio.'],
          ['`normal`', '3', 'Hacia dónde «mira» la superficie: la **luz** lo necesita.'],
          ['`uv`', '2', 'Qué punto de la textura le corresponde.'],
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Un `Float32Array` de 18 números como `position` (itemSize 3), ¿cuántos vértices describe?',
        options: ['18', '9', '6'],
        answer: 2,
        why: '18 ÷ 3 = 6 vértices (dos triángulos, si no hay índice). El itemSize agrupa el array de 3 en 3.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'La forma ES la lista de números',
      body: () => [
        demo({
          title: 'Edita un triángulo a mano',
          aspect: '16 / 9',
          caption: 'Mueve los sliders y mira el array: cambiar la forma es cambiar números.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 0, 4.2], fov: 45, orbit: false });
            const { THREE, scene } = stage;
            scene.add(new THREE.AxesHelper(1.2));
            scene.add(new THREE.GridHelper(6, 12, '#3a4152', '#262b38').rotateX(Math.PI / 2));
            const positions = new Float32Array([-1, -0.8, 0, 0, 1, 0, 1.2, -0.6, 0]);
            const attr = new THREE.BufferAttribute(positions, 3);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', attr);
            const tri = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#4cc9e0', side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
            scene.add(tri);
            const dots = ['#ff5a5a', '#5bd65b', '#5a8dff'].map((c) => {
              const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshBasicMaterial({ color: c }));
              scene.add(d);
              return d;
            });
            let ui;
            const sync = () => {
              attr.needsUpdate = true;
              for (let i = 0; i < 3; i++) dots[i].position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
              if (!ui) return;
              const f = (n) => (n >= 0 ? ' ' : '') + n.toFixed(2);
              ui.readout('arr', `new Float32Array([
  ${f(positions[0])}, ${f(positions[1])}, ${f(positions[2])},   // v0 (rojo)
  ${f(positions[3])}, ${f(positions[4])}, ${f(positions[5])},   // v1 (verde)
  ${f(positions[6])}, ${f(positions[7])}, ${f(positions[8])},   // v2 (azul)
])`);
            };
            const mk = (v, axis) => ({
              type: 'range', label: `vértice ${v} · ${axis}`, min: -2, max: 2, step: 0.05,
              value: positions[v * 3 + (axis === 'x' ? 0 : axis === 'y' ? 1 : 2)],
              onInput: (val) => { positions[v * 3 + (axis === 'x' ? 0 : axis === 'y' ? 1 : 2)] = val; sync(); },
            });
            ui = panel([
              { type: 'readout', id: 'arr' },
              { type: 'group', label: 'Vértice 0 (rojo)' }, mk(0, 'x'), mk(0, 'y'),
              { type: 'group', label: 'Vértice 1 (verde)' }, mk(1, 'x'), mk(1, 'y'),
              { type: 'group', label: 'Vértice 2 (azul)' }, mk(2, 'x'), mk(2, 'y'),
            ]);
            sync();
          },
        }),
        P('Detalle clave: la GPU tiene **su propia copia** del array. Si cambias números cuando la geometría ya se dibuja, hay que avisar con `geometry.attributes.position.needsUpdate = true` para que se vuelva a subir.'),
      ],
      check: {
        type: 'fill',
        q: 'Cambias valores del array `position` y no se ve nada. Completa el aviso:',
        pre: 'geometry.attributes.position.', post: ' = true',
        answer: 'needsUpdate',
        accept: ['needsUpdate'],
        placeholder: 'propiedad',
        size: 14,
        why: 'Sin `needsUpdate`, Three.js no vuelve a subir el array a la GPU y se sigue dibujando la versión antigua.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: '50 triángulos al azar',
      body: () => [
        demo({
          title: 'Triángulos al azar',
          aspect: '16 / 9',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 0, 6], fov: 45 });
            const { THREE, scene } = stage;
            scene.add(new THREE.AmbientLight('#fff', 1));
            const dl = new THREE.DirectionalLight('#fff', 2);
            dl.position.set(2, 3, 4);
            scene.add(dl);
            const mat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, flatShading: true });
            let mesh = null;
            let ui;
            const build = (count) => {
              if (mesh) { mesh.geometry.dispose(); scene.remove(mesh); }
              const arr = new Float32Array(count * 3 * 3);
              for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() - 0.5) * 4;
              const g = new THREE.BufferGeometry();
              g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
              g.computeVertexNormals();
              mesh = new THREE.Mesh(g, mat);
              scene.add(mesh);
              if (ui) ui.readout('r', `count = ${count}\nFloat32Array(${count} × 3 × 3) → ${arr.length} números\nprimeros 6: [${[...arr.slice(0, 6)].map((n) => n.toFixed(2)).join(', ')}, …]`);
            };
            stage.onTick((dt) => { if (mesh) mesh.rotation.y += dt * 0.2; });
            let count = 50;
            ui = panel([
              { type: 'range', label: 'count (triángulos)', min: 1, max: 600, step: 1, value: count, onInput: (v) => { count = v; build(v); } },
              { type: 'button', label: 'Generar otros al azar', onClick: () => build(count) },
              { type: 'readout', id: 'r' },
            ], { initial: false });
            build(count);
          },
        }),
        P('El ejercicio clásico del curso: rellenar el array con números aleatorios. La única cuenta que importa:'),
        codeBlock({
          title: 'script.js',
          code: `
const count = 50
const positionsArray = new Float32Array(count * 3 * 3)

for (let i = 0; i < count * 3 * 3; i++) {
  positionsArray[i] = (Math.random() - 0.5) * 4
}`,
          notes: [
            ['count * 3 * 3', '50 triángulos × 3 vértices × 3 números = 450.'],
            ['(Math.random() - 0.5) * 4', '`random()` da 0…1; el `−0.5` lo centra (−0.5…0.5) y el `×4` lo estira (−2…2).'],
          ],
        }),
      ],
      more: () => [
        callout('tip', 'Una geometría, muchos Mesh', [
          P('¿100 cubos? **No crees 100 `BoxGeometry`**: una sola compartida por los 100 Mesh. La GPU la guarda una vez, y cada Mesh pone su `position`, `rotation` y `scale`. Al desecharla: `geometry.dispose()`. Y recuerda que hay tres sitios para «mover»: `mesh.position` (transformación, barata, cada frame), `geometry.translate()` (reescribe vértices, una vez) y los shaders (vértices en la GPU, cada frame: el twist del final).'),
        ]),
      ],
      check: {
        type: 'fill',
        q: '¿Cuántos números necesita el array para **20** triángulos?',
        pre: 'new Float32Array(', post: ')',
        answer: '180',
        accept: ['180', '20 * 3 * 3', '20*3*3'],
        placeholder: 'número',
        size: 10,
        why: '20 triángulos × 3 vértices × 3 coordenadas = 180 números.',
      },
    },
  ];
}
