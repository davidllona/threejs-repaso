import { P, UL, callout, codeBlock, liveCode, demo, table, eq } from '../ui.js';

const deg = (r) => Math.round((r * 180) / Math.PI);

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Las tres transformaciones',
      body: () => [
        demo({
          title: 'position, scale y rotation',
          aspect: '16 / 10',
          caption: 'Mueve los sliders: el código de al lado es exactamente el que haría falta para esa pose. Los ejes de colores del cubo son **sus** ejes locales: cuando rota, giran con él.',
          setup({ makeStage, panel, side }) {
            const stage = makeStage({ pos: [3.4, 2.6, 4.6], fov: 45 });
            const { THREE, scene } = stage;
            scene.add(new THREE.AmbientLight('#fff', 0.7));
            const sun = new THREE.DirectionalLight('#fff', 2);
            sun.position.set(2, 4, 3);
            scene.add(sun);
            scene.add(new THREE.GridHelper(8, 8, '#4a5266', '#2c3240'));
            scene.add(new THREE.AxesHelper(3));
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#4cc9e0', roughness: 0.45 }));
            mesh.add(new THREE.AxesHelper(1.2));
            scene.add(mesh);
            const code = liveCode({ title: 'script.js', lang: 'js' });
            const refresh = () => {
              const { position: p, scale: s, rotation: r } = mesh;
              code.set(`mesh.position.set(${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)})
mesh.scale.set(${s.x.toFixed(1)}, ${s.y.toFixed(1)}, ${s.z.toFixed(1)})
mesh.rotation.set(${r.x.toFixed(2)}, ${r.y.toFixed(2)}, ${r.z.toFixed(2)})
// rotation en grados: ${deg(r.x)}°, ${deg(r.y)}°, ${deg(r.z)}°
// distancia al origen: ${p.length().toFixed(2)}`);
            };
            const set = (obj, key, v) => { obj[key] = v; refresh(); };
            const rotFmt = (v) => `${deg(v)}° (${v.toFixed(2)} rad)`;
            panel([
              { type: 'group', label: 'position' },
              { type: 'range', label: 'x', min: -3, max: 3, step: 0.1, value: 0, onInput: (v) => set(mesh.position, 'x', v) },
              { type: 'range', label: 'y', min: -3, max: 3, step: 0.1, value: 0.5, onInput: (v) => set(mesh.position, 'y', v) },
              { type: 'range', label: 'z', min: -3, max: 3, step: 0.1, value: 0, onInput: (v) => set(mesh.position, 'z', v) },
              { type: 'group', label: 'scale' },
              { type: 'range', label: 'x', min: 0.2, max: 3, step: 0.1, value: 1, onInput: (v) => set(mesh.scale, 'x', v) },
              { type: 'range', label: 'y', min: 0.2, max: 3, step: 0.1, value: 1, onInput: (v) => set(mesh.scale, 'y', v) },
              { type: 'range', label: 'z', min: 0.2, max: 3, step: 0.1, value: 1, onInput: (v) => set(mesh.scale, 'z', v) },
              { type: 'group', label: 'rotation (radianes)' },
              { type: 'range', label: 'x', min: -3.1416, max: 3.1416, step: 0.01, value: 0, fmt: rotFmt, onInput: (v) => set(mesh.rotation, 'x', v) },
              { type: 'range', label: 'y', min: -3.1416, max: 3.1416, step: 0.01, value: 0, fmt: rotFmt, onInput: (v) => set(mesh.rotation, 'y', v) },
              { type: 'range', label: 'z', min: -3.1416, max: 3.1416, step: 0.01, value: 0, fmt: rotFmt, onInput: (v) => set(mesh.rotation, 'z', v) },
            ]);
            side.append(code.el);
          },
        }),
        P('Todo objeto de Three.js (Mesh, cámara, luz, grupo…) tiene estas **tres** propiedades:'),
        table(['Propiedad', 'Tipo', 'Qué controla'], [
          ['`position`', 'Vector3', 'Dónde está (x, y, z)'],
          ['`scale`', 'Vector3', 'Cuánto se estira en cada eje (1 = original)'],
          ['`rotation`', 'Euler', 'Cuánto gira alrededor de cada eje, **en radianes**'],
        ]),
      ],
      more: () => [
        P('`position` es un **Vector3**, así que trae utilidades gratis: `mesh.position.length()` (distancia al origen), `mesh.position.distanceTo(camera.position)` (distancia a otro punto), `mesh.position.normalize()` (longitud 1 manteniendo la dirección). `mesh.position.set(1, 2, 3)` cambia los tres ejes de una vez; `mesh.position.x = 1`, solo uno. Y en `scale`, un valor negativo (`-1`) **refleja** el objeto como un espejo; `0` lo aplasta hasta hacerlo invisible.'),
      ],
      check: {
        type: 'mc',
        q: '¿Qué hace `mesh.scale.set(1, 3, 1)`?',
        options: [
          'Lo mueve 3 unidades hacia arriba',
          'Lo estira al triple de alto, sin cambiar ancho ni profundidad',
          'Lo hace 3 veces más grande en todo',
        ],
        answer: 1,
        why: '`scale` multiplica el tamaño eje a eje: x y z quedan igual (×1) e y se triplica. Mover es `position`; girar, `rotation`.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'La rotación va en radianes',
      body: () => [
        eq(`una vuelta completa = 2π ≈ 6.283 rad\nmedia vuelta       = π  ≈ 3.142 rad   (Math.PI)\nun cuarto          = π/2 ≈ 1.571 rad  (Math.PI / 2)\n\nradianes = grados × π / 180`),
        P('Si escribes `mesh.rotation.y = 90` pensando en grados, el objeto da **más de 14 vueltas** y acaba mirando a un sitio raro. En Three.js, los giros siempre se escriben en radianes, con `Math.PI` como pieza básica.'),
        callout('tip', 'Cómo pensarlo rápido', [
          P('No conviertas de cabeza: piensa en **fracciones de vuelta**. ¿Media vuelta? `Math.PI`. ¿Un cuarto? `Math.PI / 2`. ¿Un octavo? `Math.PI / 4`. Es como leyeron la hora los relojeros toda la vida: por fracciones de círculo.'),
        ]),
      ],
      check: {
        type: 'fill',
        q: 'Quieres que el objeto dé **media vuelta** alrededor del eje Y. Completa:',
        pre: 'mesh.rotation.y = ', post: '',
        answer: 'Math.PI',
        accept: ['Math.PI', 'math.pi', '3.14', '3.1416', '3.14159', /^math\.pi$/i],
        placeholder: 'valor',
        size: 12,
        why: 'Media vuelta son π radianes: `Math.PI` (≈ 3.1416). Con `180` darías unas 28 vueltas y media.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'El orden de los giros importa',
      body: () => [
        demo({
          title: 'Mismos números, distinta pose',
          aspect: '16 / 8',
          caption: 'Dos cubos con **exactamente los mismos ángulos**. Izquierda (cian): orden `XYZ` (el de por defecto). Derecha (rosa): orden `YXZ`. Pon un solo eje: iguales. Pon dos o tres: distintos.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 1.8, 6], fov: 40, orbit: false });
            const { THREE, scene } = stage;
            scene.add(new THREE.AmbientLight('#fff', 0.7));
            const sun = new THREE.DirectionalLight('#fff', 2);
            sun.position.set(2, 4, 3);
            scene.add(sun);
            const make = (x, color, order) => {
              const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1.8), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
              m.position.x = x;
              m.rotation.order = order;
              m.add(new THREE.AxesHelper(1.6));
              scene.add(m);
              return m;
            };
            const a = make(-1.8, '#4cc9e0', 'XYZ');
            const b = make(1.8, '#f472b6', 'YXZ');
            const set = (axis, v) => { a.rotation[axis] = v; b.rotation[axis] = v; };
            const fmt = (v) => `${deg(v)}°`;
            panel([
              { type: 'range', label: 'rotation.x', min: -3.1416, max: 3.1416, step: 0.01, value: 0.7, fmt, onInput: (v) => set('x', v) },
              { type: 'range', label: 'rotation.y', min: -3.1416, max: 3.1416, step: 0.01, value: 0.9, fmt, onInput: (v) => set('y', v) },
              { type: 'range', label: 'rotation.z', min: -3.1416, max: 3.1416, step: 0.01, value: 0, fmt, onInput: (v) => set('z', v) },
              { type: 'note', html: 'En código: `mesh.rotation.reorder(\'YXZ\')` — **antes** de asignar los ángulos.' },
            ]);
          },
        }),
        P('Girar en varios ejes es como orientar un avión: no es lo mismo «giro a la derecha y luego subo el morro» que al revés. Three.js aplica los giros en orden `XYZ` por defecto; `reorder()` lo cambia.'),
      ],
      more: () => [
        P('Cuando un giro deja dos ejes alineados se pierde un grado de libertad: es el famoso *gimbal lock*. Para rotaciones complejas (cámaras libres, personajes) se usan **quaternions** (`mesh.quaternion`), que no sufren ese problema; `lookAt()` y los controles de cámara los usan por dentro. El orden `YXZ` es el típico para cámaras tipo FPS: primero rumbo (Y), luego inclinación (X).'),
      ],
      check: {
        type: 'mc',
        q: 'Dos objetos reciben `rotation.x = 0.7` y `rotation.y = 0.9`, pero uno tiene orden `XYZ` y el otro `YXZ`. ¿Cómo acaban?',
        options: [
          'Igual: los ángulos son los mismos',
          'En poses distintas: el resultado depende del orden en que se aplican los giros',
          'El segundo da error, YXZ no existe',
        ],
        answer: 1,
        why: 'Los giros no son conmutativos: girar A→B no acaba igual que B→A (pruébalo con el móvil en la mano). Por eso existe `rotation.order`.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Agrupar con Group',
      body: () => [
        P('Un `THREE.Group` es una caja vacía: lo que le hagas al grupo (mover, girar, escalar) **se lo haces a todos sus hijos a la vez**, y las coordenadas de cada hijo pasan a ser *relativas al grupo*. La misma idea que agrupar capas en Figma.'),
        codeBlock({
          title: 'script.js',
          code: `
const group = new THREE.Group()
group.position.y = 1
scene.add(group)

const cube1 = new THREE.Mesh(geometry, material1)
const cube2 = new THREE.Mesh(geometry, material2)
cube2.position.x = -2
group.add(cube1)
group.add(cube2)`,
          notes: [
            ['new THREE.Group()', 'Sin forma ni material: solo transformaciones.'],
            ['group.position.y = 1', 'Sube el grupo 1 unidad: todos sus hijos suben con él.'],
            ['scene.add(group)', 'A la escena va el **grupo**; los hijos ya van dentro.'],
            ['cube2.position.x = -2', '2 unidades a la izquierda **del grupo**. En el mundo: (−2, 1, 0).'],
            ['group.add(cube1)', 'Los hijos se meten con `add`, igual que en la escena.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Un cubo tiene `position.x = 2` dentro de un grupo con `position.x = 5` (sin giros ni escalas). ¿Dónde está el cubo en el mundo?',
        options: ['x = 2', 'x = 5', 'x = 7', 'x = 10'],
        answer: 2,
        why: 'La posición de un hijo es relativa a su padre: 5 + 2 = 7. Si el grupo girase o escalase, el cálculo sería más complejo (lo hace Three.js con matrices).',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'Posición local contra el mundo',
      body: () => [
        demo({
          title: 'Local contra mundo',
          aspect: '16 / 9',
          caption: 'Gira el grupo: la posición **local** del cubo azul no cambia (sigue en `x = 2` dentro del grupo), pero su posición en el **mundo** sí. Eso es lo que hace útil agrupar.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 3.2, 7], fov: 45 });
            const { THREE, scene } = stage;
            scene.add(new THREE.GridHelper(10, 10, '#4a5266', '#2c3240'));
            scene.add(new THREE.AxesHelper(2.5));
            scene.add(new THREE.AmbientLight('#fff', 0.7));
            const sun = new THREE.DirectionalLight('#fff', 2);
            sun.position.set(2, 4, 3);
            scene.add(sun);
            const group = new THREE.Group();
            scene.add(group);
            group.add(new THREE.AxesHelper(1.6));
            const mk = (color, x) => {
              const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
              m.position.x = x;
              group.add(m);
              return m;
            };
            mk('#ff5a5a', -2); mk('#5bd65b', 0); const child = mk('#5a8dff', 2);
            let ui;
            const info = () => {
              const w = new THREE.Vector3();
              child.getWorldPosition(w);
              ui.readout('info', `Cubo azul\nLOCAL  (child.position):\n  x ${child.position.x.toFixed(2)}  y ${child.position.y.toFixed(2)}  z ${child.position.z.toFixed(2)}\nMUNDO (getWorldPosition):\n  x ${w.x.toFixed(2)}  y ${w.y.toFixed(2)}  z ${w.z.toFixed(2)}`);
            };
            ui = panel([
              { type: 'group', label: 'Grupo' },
              { type: 'range', label: 'group.position.y', min: -2, max: 2, step: 0.1, value: 0.5, onInput: (v) => { group.position.y = v; if (ui) info(); } },
              { type: 'range', label: 'group.rotation.y', min: -3.1416, max: 3.1416, step: 0.01, value: 0.5, fmt: (v) => `${deg(v)}°`, onInput: (v) => { group.rotation.y = v; if (ui) info(); } },
              { type: 'range', label: 'group.scale', min: 0.4, max: 1.6, step: 0.05, value: 1, onInput: (v) => { group.scale.setScalar(v); if (ui) info(); } },
              { type: 'group', label: 'Un solo hijo' },
              { type: 'range', label: 'child.position.x (local)', min: -3, max: 3, step: 0.1, value: 2, onInput: (v) => { child.position.x = v; if (ui) info(); } },
              { type: 'readout', id: 'info' },
            ]);
            info();
          },
        }),
        P('Y un regalo para cerrar: todos los objetos tienen `lookAt(x, y, z)` (o `lookAt(vector)`), que los gira para «mirar» a ese punto. Con `camera.lookAt(mesh.position)` la cámara sigue al objeto sin que calcules ni un ángulo.'),
      ],
      check: {
        type: 'mc',
        q: 'Giras el grupo 90° y lees `child.position`. ¿Qué te devuelve?',
        options: [
          'La posición del cubo en el mundo, ya girada',
          'La posición **local** de siempre, sin cambios: para la del mundo hace falta `getWorldPosition()`',
          'Un error: no se puede leer mientras el grupo rota',
        ],
        answer: 1,
        why: '`position` siempre es relativa al padre. El sitio real en el mundo lo calcula Three.js al renderizar, y lo puedes pedir con `mesh.getWorldPosition(destino)`.',
      },
    },
  ];
}
