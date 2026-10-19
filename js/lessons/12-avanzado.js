import { P, H2, H3, UL, callout, codeBlock, demo, table, quiz, eq, card, grid2 } from '../ui.js';

export default function render(root) {
  root.append(
    P('El capítulo 3 del curso son técnicas «de proyecto real». Aquí tienes **lo esencial de cada una**: qué problema resuelve, el código mínimo y las trampas conocidas. No hace falta memorizarlo todo: basta con saber que existe y volver aquí a copiar.'),

    H2('Físicas (cannon-es, Rapier…)'),
    P('Three.js **solo dibuja**: no sabe nada de gravedad ni de choques. Para eso se usa una librería de físicas aparte (`cannon-es` o `Rapier`) que mantiene **su propio mundo**. El truco es tener dos mundos paralelos: en cada frame avanzas la simulación física y **copias** las posiciones de los cuerpos físicos a tus Mesh.'),
    codeBlock({
      title: 'script.js',
      code: `
import CANNON from 'cannon'

const world = new CANNON.World()
world.gravity.set(0, -9.82, 0)

const sphereBody = new CANNON.Body({
  mass: 1,
  position: new CANNON.Vec3(0, 3, 0),
  shape: new CANNON.Sphere(0.5),
})
world.addBody(sphereBody)

// en el tick:
world.step(1 / 60, deltaTime, 3)
sphereMesh.position.copy(sphereBody.position)`,
      notes: [
        ['new CANNON.World()', 'El mundo físico. Es **independiente** de tu `scene` de Three.js.'],
        ['world.gravity.set', 'Gravedad: −9.82 m/s² en Y, como en la Tierra.'],
        ['new CANNON.Body', 'Un cuerpo físico: tiene masa (`mass: 0` = estático, como un suelo), posición inicial y una forma de colisión.'],
        ['new CANNON.Sphere(0.5)', 'La forma de colisión (esfera de radio 0.5). Suele ser más simple que la forma visible para que sea barato calcular.'],
        ['world.addBody', 'Lo añadimos al mundo físico.'],
        ['world.step(1 / 60, deltaTime, 3)', 'Avanza la simulación: «un paso fijo de 1/60 s, con el tiempo real transcurrido como referencia, y hasta 3 pasos para ponerse al día». Hay que llamarlo en cada frame.'],
        ['sphereMesh.position.copy', '**La sincronización:** la posición calculada por la física se copia al objeto que se ve. (Para rotación, lo mismo con `quaternion`.)'],
      ],
    }),

    H2('Modelos importados (glTF)'),
    P('Para objetos complejos no los programas: los modelas en Blender (u otro) y los cargas. El formato recomendado es **glTF** (`.gltf` o su versión empaquetada `.glb`), pensado para la web: incluye geometría, materiales, texturas, animaciones y jerarquía.'),
    codeBlock({
      title: 'script.js',
      code: `
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

let mixer = null
gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) => {
  gltf.scene.scale.set(0.025, 0.025, 0.025)
  scene.add(gltf.scene)

  mixer = new THREE.AnimationMixer(gltf.scene)
  const action = mixer.clipAction(gltf.animations[1])
  action.play()
})

// en el tick:
if (mixer) mixer.update(deltaTime)`,
      notes: [
        ['import { GLTFLoader }', 'El cargador de glTF; vive en la carpeta de addons.'],
        ['new DRACOLoader()', 'Draco es un compresor de geometría: reduce muchísimo el peso de modelos grandes. Si el archivo está comprimido con Draco, hace falta este decodificador.'],
        ["setDecoderPath('/draco/')", 'Carpeta con los archivos del decodificador (se copian desde `three/examples/jsm/libs/draco`).'],
        ['gltfLoader.setDRACOLoader', 'Conectamos Draco con el cargador.'],
        ['let mixer = null', 'El **AnimationMixer** es quien reproduce las animaciones del modelo. Lo declaramos fuera porque el callback es asíncrono y lo usará el tick.'],
        ['gltfLoader.load(', 'Carga el modelo. El callback recibe un objeto `gltf` con `gltf.scene` (el modelo), `gltf.animations` (lista de animaciones)…'],
        ['gltf.scene.scale.set', 'Muchos modelos vienen en una escala distinta a la tuya: aquí se reduce a 2.5 %.'],
        ['scene.add(gltf.scene)', '**Añade `gltf.scene` completo.** Una trampa clásica: recorrer `gltf.scene.children` y añadirlos uno a uno a tu escena **los saca del array mientras lo recorres** y te saltas hijos. Añadir la escena entera evita el problema.'],
        ['new THREE.AnimationMixer', 'Crea el reproductor para ese modelo.'],
        ['mixer.clipAction(gltf.animations[1])', 'Elige una animación de la lista (por ejemplo, «Walk») y crea la acción.'],
        ['action.play()', 'La arranca.'],
        ['mixer.update(deltaTime)', 'Cada frame hay que avisar al mixer cuánto tiempo pasó, para que avance la animación.'],
      ],
    }),

    H2('Raycaster y eventos del ratón'),
    P('Un **raycaster** lanza un rayo (una línea infinita) desde un punto en una dirección y te dice **qué objetos atraviesa**, ordenados por distancia. Con él detectas clics, hover, colisiones sencillas, línea de visión… Lo más común: lanzarlo desde la cámara hacia donde apunta el ratón.'),
    P('La parte que más cuesta recordar son las **coordenadas del ratón**: Three.js usa un sistema que va de −1 a 1 en ambos ejes, con el (0,0) en el centro del canvas y la **y hacia arriba** (al revés que el navegador).'),
    eq(`canvas de 800 × 600, ratón en (600, 150) píxeles\n\nx = 600 / 800 × 2 − 1        =  0.5    (a la derecha)\ny = −(150 / 600 × 2 − 1)     =  0.5    (arriba)\n\nratón en el centro (400, 300) → (0, 0)`),
    demo({
      title: 'Hover y clic con Raycaster',
      aspect: '16 / 8',
      caption: 'Pasa el ratón por encima de las esferas (se iluminan) y haz clic (alternan tamaño). El raycaster devuelve también la **distancia** del impacto y el punto exacto en 3D. Si hay varios objetos alineados, `intersects[0]` es siempre el más cercano.',
      setup({ makeStage, panel }) {
        const stage = makeStage({ pos: [0, 0.5, 7], fov: 40, orbit: false });
        const { THREE, scene, camera, canvas } = stage;
        scene.add(new THREE.AmbientLight('#fff', 0.8));
        const dl = new THREE.DirectionalLight('#fff', 2);
        dl.position.set(2, 3, 4);
        scene.add(dl);
        const balls = [];
        ['#f472b6', '#4cc9e0', '#ffc857', '#a493ff'].forEach((c, i) => {
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.7, 40, 28), new THREE.MeshStandardMaterial({ color: c, roughness: 0.4, emissive: '#000000' }));
          m.position.x = (i - 1.5) * 2.1;
          m.name = `esfera ${i + 1}`;
          m.userData.big = false;
          scene.add(m);
          balls.push(m);
        });
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(9, 9);
        let hit = null;
        let ui;
        const report = (info) => ui.readout('r', info);
        canvas.addEventListener('pointermove', (e) => {
          const r = canvas.getBoundingClientRect();
          mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
          mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        });
        canvas.addEventListener('pointerleave', () => { mouse.set(9, 9); });
        canvas.addEventListener('click', () => { if (hit) hit.object.userData.big = !hit.object.userData.big; });
        stage.onTick((dt, t) => {
          raycaster.setFromCamera(mouse, camera);
          const intersects = raycaster.intersectObjects(balls);
          hit = intersects[0] || null;
          balls.forEach((b, i) => {
            b.position.y = Math.sin(t * 1.2 + i) * 0.25;
            const target = b.userData.big ? 1.35 : 1;
            b.scale.setScalar(b.scale.x + (target - b.scale.x) * Math.min(1, dt * 8));
            b.material.emissive.set(hit && hit.object === b ? '#444444' : '#000000');
          });
          if (ui) {
            report(`mouse (−1 a 1)\n  x ${mouse.x.toFixed(2)}   y ${mouse.y.toFixed(2)}\n\n` + (hit
              ? `intersects.length = ${intersects.length}\nobject: ${hit.object.name}\ndistance: ${hit.distance.toFixed(2)}\npoint: ${hit.point.x.toFixed(2)}, ${hit.point.y.toFixed(2)}, ${hit.point.z.toFixed(2)}`
              : 'intersects.length = 0\n(el rayo no toca nada)'));
          }
        });
        ui = panel([{ type: 'readout', id: 'r' }, { type: 'note', html: '`raycaster.setFromCamera(mouse, camera)` y después `raycaster.intersectObjects(lista)`.' }]);
      },
    }),
    codeBlock({
      title: 'script.js',
      code: `
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / sizes.width) * 2 - 1
  mouse.y = -(event.clientY / sizes.height) * 2 + 1
})

// en el tick:
raycaster.setFromCamera(mouse, camera)
const intersects = raycaster.intersectObjects(objectsToTest)

if (intersects.length) {
  intersects[0].object.material.color.set('#ff0000')
}`,
      notes: [
        ['new THREE.Raycaster()', 'El lanzador de rayos. Se crea una vez.'],
        ['new THREE.Vector2()', 'Aquí guardaremos la posición normalizada del ratón.'],
        ["addEventListener('mousemove'", 'Cada vez que mueves el ratón, calculamos las coordenadas.'],
        ['mouse.x =', 'Convierte píxeles (0 a width) a −1…1: dividir por el ancho (0…1), por 2 (0…2) y restar 1 (−1…1).'],
        ['mouse.y =', 'Igual, pero **invertido** (el menos), porque en pantalla la y crece hacia abajo y en Three.js hacia arriba.'],
        ['raycaster.setFromCamera', 'Lanza el rayo desde la cámara pasando por ese punto del canvas.'],
        ['intersectObjects(objectsToTest)', 'Devuelve una lista de impactos **ordenada de más cerca a más lejos**. Solo mira los objetos que le pasas (más rápido que mirar toda la escena).'],
        ['if (intersects.length)', 'Si la lista no está vacía, el rayo tocó algo.'],
        ['intersects[0].object', 'El primero es el más cercano. Cada impacto trae `object`, `distance`, `point`, `face`, `uv`…'],
      ],
    }),

    H2('Modelos propios con Blender'),
    UL([
      'Modela con pocos polígonos cuando puedas: cada triángulo cuenta.',
      'Antes de exportar: **aplica escala y rotación** (`Ctrl+A`), asigna nombres claros a materiales y objetos.',
      'Haz el *UV unwrap* (el «desplegado de la caja» de la lección de texturas) si vas a usar texturas.',
      'Exporta como **glTF 2.0 (`.glb`)**, con materiales y texturas incluidos.',
      'Para ahorrar peso: comprime con Draco y las texturas, en JPG o con formatos comprimidos.',
    ]),

    H2('Render realista'),
    P('Con un modelo bien hecho, lo que lo hace parecer real son unos pocos ajustes del **renderer** y de la luz. Esta es la «receta» del curso:'),
    codeBlock({
      title: 'script.js',
      code: `
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.5
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

scene.environment = environmentMap
scene.environmentIntensity = 1

directionalLight.shadow.normalBias = 0.05
directionalLight.shadow.bias = -0.001`,
      notes: [
        ['antialias: true', 'Suaviza los bordes dentados (aliasing). Solo se nota en pantallas con pixel ratio 1; en retina rara vez hace falta.'],
        ['toneMapping = THREE.ACESFilmicToneMapping', 'Las luces pueden tener valores muy por encima del blanco; el *tone mapping* los «comprime» al rango que una pantalla puede mostrar, imitando una cámara de cine. Evita los blancos quemados.'],
        ['toneMappingExposure', 'Un «brillo general» (la exposición de la cámara).'],
        ['shadowMap.enabled', 'Sombras activadas (lección anterior).'],
        ['PCFSoftShadowMap', 'Algoritmo de sombra suave.'],
        ['scene.environment = environmentMap', 'La iluminación y reflejos vienen de un HDRI (lección de materiales).'],
        ['environmentIntensity', 'Cuánta fuerza tiene ese entorno.'],
        ['shadow.normalBias', 'Corrige el «acné» de sombra: rayas que aparecen en superficies que se sombrean a sí mismas. Mueve el punto de muestreo a lo largo de la normal.'],
        ['shadow.bias', 'Lo mismo pero a lo largo de la dirección de la luz. Valores pequeños (−0.001); si te pasas, la sombra se separa del objeto.'],
      ],
    }),

    H2('Estructurar el código de un proyecto grande'),
    P('Un archivo `script.js` de 800 líneas se vuelve inmanejable. El curso propone separarlo en **clases** (módulos), cada una con una responsabilidad, y una clase principal, `Experience`, que las crea y las conecta:'),
    codeBlock({
      title: 'estructura',
      lang: 'text',
      code: `
src/
  script.js            ← punto de entrada: new Experience(canvas)
  Experience/
    Experience.js      ← crea y conecta todo (patrón singleton)
    Camera.js          ← cámara + OrbitControls
    Renderer.js        ← WebGLRenderer
    World/
      World.js         ← lo que hay en la escena
      Floor.js, Fox.js ← cada objeto con su propia clase
    Utils/
      Sizes.js         ← ancho, alto, pixelRatio (y avisa en resize)
      Time.js          ← deltaTime / elapsed (y emite 'tick')
      Resources.js     ← carga todos los assets (texturas, modelos)
      EventEmitter.js  ← .on('tick', fn) / .trigger('tick')`,
      notes: [],
    }),
    callout('remember', 'Qué te llevas de aquí', [
      P('Un **bus de eventos** (`on` y `trigger`) permite que `Time` avise «hay un tick» y `Sizes` avise «cambió el tamaño» sin que se conozcan entre sí. Cada clase se suscribe a lo que le interesa. Es lo mismo que `addEventListener`, pero para tus propias clases.'),
    ]),

    quiz([
      {
        q: 'Con una librería de físicas, ¿cómo consigues que un Mesh «caiga»?',
        options: ['Three.js aplica gravedad a todos los Mesh automáticamente', 'Se simula en un mundo físico aparte y en cada frame se copia la posición del cuerpo al Mesh', 'Cambiando `mesh.mass`', 'Con `mesh.gravity = true`'],
        answer: 1,
        why: 'Three.js no tiene físicas. Son dos mundos que se mantienen sincronizados copiando posiciones y rotaciones.',
      },
      {
        q: 'El ratón está en la esquina superior izquierda del canvas. ¿Qué coordenadas normalizadas tiene?',
        options: ['(0, 0)', '(−1, 1)', '(1, −1)', '(−1, −1)'],
        answer: 1,
        why: 'x va de −1 (izquierda) a 1 (derecha) e y de −1 (abajo) a 1 (arriba). Arriba-izquierda es (−1, 1).',
      },
      {
        q: '¿Cuál es la trampa al añadir un modelo glTF recorriendo `gltf.scene.children`?',
        options: ['Que no tiene hijos', 'Que `scene.add(hijo)` lo saca del array que estás recorriendo y te saltas elementos', 'Que hay que usar `for...in`', 'Que no se puede animar'],
        answer: 1,
        why: 'Añadir un objeto a otro padre lo quita del anterior, modificando el array que recorres. Solución: `scene.add(gltf.scene)` o recorrer una copia.',
      },
    ]),
  );
}
