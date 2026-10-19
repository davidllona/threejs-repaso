import { P, H2, H3, UL, callout, codeBlock, liveCode, demo, table, quiz } from '../ui.js';

const deg = (r) => Math.round((r * 180) / Math.PI);

export default function render(root) {
  root.append(
    P('Todo objeto de Three.js (un Mesh, una cámara, una luz, un grupo…) tiene **tres propiedades** que dicen dónde está, qué tamaño tiene y hacia dónde mira. Se llaman *transformaciones* y las vas a tocar constantemente.'),
    table(['Propiedad', 'Tipo', 'Qué controla', 'Ejemplo'], [
      ['`position`', 'Vector3', 'Dónde está (x, y, z)', '`mesh.position.set(0.7, -0.6, 1)`'],
      ['`scale`', 'Vector3', 'Cuánto se estira en cada eje (1 = tamaño original)', '`mesh.scale.set(2, 0.5, 1)`'],
      ['`rotation`', 'Euler', 'Cuánto está girado alrededor de cada eje, **en radianes**', '`mesh.rotation.y = Math.PI / 2`'],
    ]),

    H2('Probémoslo'),
    P('Mueve los sliders. En el código de la derecha verás las líneas que haría falta escribir para conseguir exactamente esa pose. Los ejes de colores del cubo son *sus* ejes locales: cuando rota, giran con él.'),
    demo({
      title: 'position, scale y rotation',
      aspect: '16 / 10',
      setup({ makeStage, panel, side }) {
        const stage = makeStage({ pos: [3.4, 2.6, 4.6], fov: 45 });
        const { THREE, scene } = stage;
        scene.add(new THREE.AmbientLight('#fff', 0.7));
        const sun = new THREE.DirectionalLight('#fff', 2);
        sun.position.set(2, 4, 3);
        scene.add(sun);
        const grid = new THREE.GridHelper(8, 8, '#4a5266', '#2c3240');
        scene.add(grid);
        scene.add(new THREE.AxesHelper(3)); // ejes del mundo

        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: '#4cc9e0', roughness: 0.45 }));
        mesh.add(new THREE.AxesHelper(1.2)); // ejes locales del cubo
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

    H3('Los tres detalles que más confunden'),
    callout('warn', 'La rotación va en radianes, no en grados', [
      P('Un giro completo son `2π ≈ 6.283` radianes. Media vuelta es `Math.PI`, un cuarto `Math.PI / 2 ≈ 1.571`. Para convertir: `radianes = grados × π / 180`. Si escribes `mesh.rotation.y = 90` en lugar de `Math.PI / 2`, el objeto da casi **15 vueltas** y acaba mirando hacia un sitio raro.'),
    ]),
    callout('remember', '`position.set()` y `position.x =` hacen lo mismo', [
      P('`mesh.position.set(1, 2, 3)` cambia los tres ejes de una vez. `mesh.position.x = 1` cambia uno solo. Además, `position` es un **Vector3**, así que trae utilidades: `mesh.position.length()` (distancia al origen), `mesh.position.distanceTo(camera.position)` (distancia a otro punto) y `mesh.position.normalize()` (lo acorta a longitud 1 manteniendo la dirección).'),
    ]),
    callout('analogy', 'Escalar con números negativos', [
      P('`scale` multiplica: `2` lo hace el doble de grande, `0.5` la mitad, `1` lo deja igual. Un valor negativo (`-1`) lo **refleja** como un espejo. Y `0` lo aplasta hasta hacerlo invisible, como un papel visto de canto.'),
    ]),

    H2('El orden de rotación importa'),
    P('Cuando giras en varios ejes a la vez, el resultado depende de **en qué orden** se aplican los giros. Imagina un avión: no es lo mismo «primero giro a la derecha y luego subo el morro» que «primero subo el morro y luego giro». Three.js aplica por defecto el orden `XYZ`. Aquí tienes dos cubos con **exactamente los mismos números** pero distinto orden:'),
    demo({
      title: 'rotation.reorder(): mismos números, distinta pose',
      aspect: '16 / 8',
      caption: 'Pon solo un eje a la vez: se ven igual. Pon dos o tres a la vez y empiezan las diferencias. Cuando un eje queda «alineado» con otro se produce el *gimbal lock* (pierdes un grado de libertad). Para rotaciones complejas se usan **quaternions** (`mesh.quaternion`), que no tienen ese problema.',
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
          { type: 'note', html: '**Izquierda (cian):** orden `XYZ` (el de por defecto).<br>**Derecha (rosa):** orden `YXZ`, el que se suele usar en cámaras y personajes.' },
          { type: 'note', html: 'En código: `mesh.rotation.reorder(\'YXZ\')` — hazlo **antes** de asignar los ángulos.' },
        ]);
      },
    }),

    H2('Agrupar: Group'),
    P('Un `THREE.Group` es una caja vacía en la que metes otros objetos. Lo que le hagas al grupo (moverlo, girarlo, escalarlo) **se lo haces a todos sus hijos a la vez**. Y las coordenadas de cada hijo son *relativas al grupo*, no al mundo. Es la misma idea que las carpetas dentro de carpetas, o las capas agrupadas de Figma/Photoshop.'),
    codeBlock({
      title: 'script.js',
      code: `
const group = new THREE.Group()
group.position.y = 1
scene.add(group)

const cube1 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }))
const cube2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
cube2.position.x = -2
group.add(cube1)
group.add(cube2)`,
      notes: [
        ['new THREE.Group()', 'Un grupo vacío: no tiene forma ni material, solo transformaciones.'],
        ['group.position.y = 1', 'Sube el grupo 1 unidad. Todos sus hijos suben con él.'],
        ['scene.add(group)', 'Metemos el **grupo** en la escena (no hace falta meter a los hijos, ya van dentro).'],
        ['const cube1', 'Un cubo rojo, en la posición (0, 0, 0) **del grupo**.'],
        ['cube2.position.x = -2', 'Este cubo está a 2 unidades a la izquierda **del grupo**. En el mundo estará en (-2, 1, 0): su x más la y del grupo.'],
        ['group.add(cube1)', 'Metemos los cubos dentro del grupo con `add`.'],
      ],
    }),
    demo({
      title: 'Posición local contra posición en el mundo',
      aspect: '16 / 9',
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
          ui.readout('info', `Cubo azul\nposición LOCAL  (child.position):\n  x ${child.position.x.toFixed(2)}  y ${child.position.y.toFixed(2)}  z ${child.position.z.toFixed(2)}\nposición en el MUNDO (getWorldPosition):\n  x ${w.x.toFixed(2)}  y ${w.y.toFixed(2)}  z ${w.z.toFixed(2)}`);
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
      caption: 'Gira el grupo: la posición **local** del cubo azul no cambia (sigue en `x = 2` dentro de su grupo), pero su posición en el **mundo** sí. Eso es lo que hace útil agrupar.',
    }),

    H2('Mirar hacia un punto'),
    P('Todos los objetos tienen `lookAt(x, y, z)` (o `lookAt(vector)`): lo giran para que su eje «frente» apunte a ese punto. Se usa sobre todo con la cámara: `camera.lookAt(mesh.position)` hace que la cámara mire siempre al objeto, sin que calcules ángulos.'),

    quiz([
      {
        q: 'Quieres que un objeto dé media vuelta alrededor del eje Y. ¿Qué escribes?',
        options: ['`mesh.rotation.y = 180`', '`mesh.rotation.y = Math.PI`', '`mesh.rotation.y = 1`', '`mesh.rotation.y = 360`'],
        answer: 1,
        why: 'La rotación es en radianes: media vuelta = π ≈ 3.14. Con `180` darías unas 28 vueltas y media.',
      },
      {
        q: 'Un cubo tiene `position.x = 2` dentro de un grupo, y el grupo está en `position.x = 5`. ¿Dónde está el cubo en el mundo (si el grupo no rota ni escala)?',
        options: ['x = 2', 'x = 5', 'x = 7', 'x = 10'],
        answer: 2,
        why: 'La posición de un hijo es relativa al padre: 5 + 2 = 7. Si el grupo rotase o se escalara, el cálculo cambiaría.',
      },
      {
        q: '¿Qué hace `mesh.scale.set(1, 3, 1)`?',
        options: ['Lo mueve 3 unidades hacia arriba', 'Lo estira al triple de alto, sin cambiar ancho ni profundidad', 'Lo hace 3 veces más grande en todo', 'Lo gira 3 radianes'],
        answer: 1,
        why: '`scale` multiplica el tamaño en cada eje por separado: x y z se quedan igual (×1) e y se triplica.',
      },
    ]),
  );
}
