import { P, H2, H3, UL, callout, codeBlock, demo, table, quiz, eq } from '../ui.js';

const FACTORY = {
  Plano: {
    make: (T, a, b) => new T.PlaneGeometry(2, 2, a, b),
    code: (a, b) => `new THREE.PlaneGeometry(2, 2, ${a}, ${b})`,
    names: ['widthSegments', 'heightSegments'],
  },
  Caja: {
    make: (T, a, b) => new T.BoxGeometry(1.6, 1.6, 1.6, a, b, a),
    code: (a, b) => `new THREE.BoxGeometry(1.6, 1.6, 1.6, ${a}, ${b}, ${a})`,
    names: ['widthSegments (y depthSegments)', 'heightSegments'],
  },
  Esfera: {
    make: (T, a, b) => new T.SphereGeometry(1, Math.max(3, a), Math.max(2, b)),
    code: (a, b) => `new THREE.SphereGeometry(1, ${Math.max(3, a)}, ${Math.max(2, b)})`,
    names: ['widthSegments', 'heightSegments'],
  },
  Dona: {
    make: (T, a, b) => new T.TorusGeometry(0.9, 0.38, Math.max(3, b), Math.max(3, a)),
    code: (a, b) => `new THREE.TorusGeometry(0.9, 0.38, ${Math.max(3, b)}, ${Math.max(3, a)})`,
    names: ['tubularSegments', 'radialSegments'],
  },
};

export default function render(root) {
  root.append(
    P('Una geometría es **la forma de un objeto, descrita con números**. No tiene color, ni brillo, ni textura: solo dice dónde están sus puntos y cómo se unen formando triángulos.'),
    callout('analogy', 'Piensa en unir puntos', [
      P('¿Recuerdas los dibujos de «une los puntos del 1 al 20»? Una geometría es eso. Los **vértices** son los puntos numerados (cada uno con unas coordenadas x, y, z) y las **caras** son los triángulos que salen de unir tres de ellos. Una esfera, un coche o la cara de una persona son miles de puntos unidos en triángulos diminutos.'),
    ]),

    H2('Segmentos: más puntos, más detalle, más coste'),
    P('Las geometrías que trae Three.js (`BoxGeometry`, `SphereGeometry`, `PlaneGeometry`…) aceptan parámetros de **segmentos**: en cuántos trozos se divide cada lado. Más segmentos = más vértices = superficie más suave, pero también más trabajo para la GPU. En esta demo puedes ver los vértices (puntos ámbar) y los triángulos (líneas cian).'),
    demo({
      title: 'Segmentos, vértices y triángulos',
      aspect: '16 / 10',
      setup({ makeStage, panel, side }) {
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
          if (ui) {
            ui.readout('info', `${FACTORY[state.kind].code(state.a, state.b)}\n\nvértices:   ${n}\ntriángulos: ${tri}\nnúmeros en el array position:\n  ${n} × 3 = ${n * 3}`);
          }
        };
        stage.onTick((dt) => { group.rotation.y += dt * 0.25; });

        let ui;
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
      caption: 'Prueba con una **Caja de 1×1**: tiene 24 vértices, no 8. ¿Por qué? Porque cada cara necesita sus propios vértices (con su propia normal y UV): los puntos de las esquinas se repiten 3 veces, una por cada cara que se juntan allí.',
    }),

    H2('Por dentro: BufferGeometry'),
    P('Todas las geometrías de Three.js son un `BufferGeometry`. Es un contenedor de **atributos**; cada atributo es una lista larga de números, guardada en un array especial de JavaScript (`Float32Array`) que la GPU puede leer a toda velocidad.'),
    table(['Atributo', 'Números por vértice', 'Qué guarda'], [
      ['`position`', '3 (x, y, z)', 'Dónde está cada vértice. Es el único que siempre existe.'],
      ['`normal`', '3 (x, y, z)', 'Hacia dónde «mira» la superficie en ese punto. La **luz** necesita las normales para saber cuánto ilumina cada punto.'],
      ['`uv`', '2 (u, v)', 'Qué punto de una textura (imagen) le corresponde. Lo verás en la lección de texturas.'],
    ]),
    P('Así, una geometría de un solo triángulo es esto: **9 números** (3 vértices × 3 coordenadas):'),
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
        ['new Float32Array', 'Un array de números decimales de 32 bits. Es el formato que entiende la GPU. Lo escribimos plano: x, y, z, x, y, z…'],
        ['vértice 0', 'Cada fila son las coordenadas (x, y, z) de un punto. Las filas son solo para que lo leas mejor; para el ordenador es una lista seguida de 9 números.'],
        ['new THREE.BufferAttribute(positionsArray, 3)', 'Convierte el array en un «atributo». El **3** (itemSize) le dice cuántos números forman un vértice: de 3 en 3.'],
        ['new THREE.BufferGeometry()', 'Una geometría vacía.'],
        ["setAttribute('position'", 'Le asignamos el atributo. El nombre `\'position\'` **importa**: es el nombre que los shaders esperan encontrar. Otros nombres: `\'normal\'`, `\'uv\'`, `\'color\'`.'],
      ],
    }),
    P('Edita los vértices de este triángulo en vivo y mira cómo cambian los números del array. **La forma es literalmente la lista de números.**'),
    demo({
      title: 'Edita un triángulo a mano',
      aspect: '16 / 9',
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
  ${f(positions[0])}, ${f(positions[1])}, ${f(positions[2])},   // vértice 0 (rojo)
  ${f(positions[3])}, ${f(positions[4])}, ${f(positions[5])},   // vértice 1 (verde)
  ${f(positions[6])}, ${f(positions[7])}, ${f(positions[8])},   // vértice 2 (azul)
])`);
        };
        const mk = (v, axis, color) => ({
          type: 'range', label: `vértice ${v} · ${axis}`, min: -2, max: 2, step: 0.05,
          value: positions[v * 3 + (axis === 'x' ? 0 : axis === 'y' ? 1 : 2)],
          onInput: (val) => { positions[v * 3 + (axis === 'x' ? 0 : axis === 'y' ? 1 : 2)] = val; sync(); },
        });
        ui = panel([
          { type: 'readout', id: 'arr' },
          { type: 'group', label: 'Vértice 0 (punto rojo)' }, mk(0, 'x'), mk(0, 'y'), mk(0, 'z'),
          { type: 'group', label: 'Vértice 1 (punto verde)' }, mk(1, 'x'), mk(1, 'y'), mk(1, 'z'),
          { type: 'group', label: 'Vértice 2 (punto azul)' }, mk(2, 'x'), mk(2, 'y'), mk(2, 'z'),
        ]);
        sync();
      },
      caption: 'Cuando modificas un array que la GPU ya tiene, hay que avisarle: `geometry.attributes.position.needsUpdate = true`. Si no, sigue dibujando la versión antigua.',
    }),

    H3('Un montón de triángulos al azar'),
    P('Con lo mismo se puede crear cualquier forma: solo hace falta rellenar el array con más números. Este es el ejemplo clásico del curso (*«crea 50 triángulos aleatorios»*):'),
    codeBlock({
      title: 'script.js',
      code: `
const count = 50
const positionsArray = new Float32Array(count * 3 * 3)

for (let i = 0; i < count * 3 * 3; i++) {
  positionsArray[i] = (Math.random() - 0.5) * 4
}

const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(positionsArray, 3))`,
      notes: [
        ['const count = 50', 'Queremos 50 triángulos.'],
        ['new Float32Array(count * 3 * 3)', 'Cada triángulo tiene **3 vértices** y cada vértice **3 números**: 50 × 3 × 3 = 450 números. El array se crea ya con ese tamaño.'],
        ['for (let i', 'Recorremos las 450 posiciones del array.'],
        ['(Math.random() - 0.5) * 4', '`Math.random()` da un número entre 0 y 1. Restarle 0.5 lo centra (de −0.5 a 0.5) y multiplicarlo por 4 lo estira (de −2 a 2). Así los puntos quedan repartidos alrededor del origen.'],
        ['new THREE.BufferGeometry()', 'Creamos la geometría y le damos el atributo, igual que con un solo triángulo.'],
      ],
    }),
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

    H2('Reutiliza geometrías'),
    callout('tip', 'Una geometría, muchos Mesh', [
      P('Si necesitas 100 cubos, **no crees 100 `BoxGeometry`**: crea una y úsala en los 100 Mesh (`new THREE.Mesh(sameGeometry, material)`). La GPU la guarda una sola vez. Cada Mesh tiene su propia posición, rotación y escala, así que se pueden distribuir como quieras. Y cuando ya no la uses: `geometry.dispose()` libera la memoria de la GPU.'),
    ]),
    callout('remember', 'Dos sitios donde mover cosas', [
      P('Puedes mover un objeto con `mesh.position` (cambia la **transformación**, barata) o con `geometry.translate(x, y, z)` (reescribe **los vértices** del array, hecho una sola vez). Y los shaders (capítulo 4) permiten tocar los vértices **en la GPU en cada frame**, que es justo lo que hará el twist del final.'),
    ]),

    quiz([
      {
        q: 'Un `Float32Array` de 18 números como atributo `position` (con itemSize 3), ¿cuántos vértices describe?',
        options: ['18', '9', '6', '3'],
        answer: 2,
        why: '18 números ÷ 3 (x, y, z) = 6 vértices. Si no hay índices, serían 2 triángulos.',
      },
      {
        q: '¿Para qué sirve el atributo `normal`?',
        options: ['Para colocar el vértice en el espacio', 'Para saber hacia dónde mira la superficie y así calcular la luz', 'Para pegar una textura', 'Para dar color al vértice'],
        answer: 1,
        why: 'La luz rebota distinto según el ángulo de la superficie. Sin normales correctas, la iluminación sale mal (algo que verás con el twist: hay que girar también las normales).',
      },
      {
        q: 'Tienes una geometría ya creada y cambias valores de su array `position`, pero no se ve ningún cambio. ¿Qué falta?',
        options: ['`geometry.attributes.position.needsUpdate = true`', 'Llamar a `scene.add()` otra vez', 'Reiniciar el navegador', 'Cambiar el material'],
        answer: 0,
        why: 'La GPU tiene su propia copia del array. `needsUpdate = true` le dice a Three.js que la vuelva a subir.',
      },
    ]),
  );
}
