import { P, UL, callout, codeBlock, demo, eq } from '../ui.js';

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Físicas: dos mundos paralelos',
      body: () => [
        P('Three.js **solo dibuja**: no sabe de gravedad ni de choques. Una librería de físicas (`cannon-es`, `Rapier`) mantiene **su propio mundo invisible**; en cada frame avanzas la simulación y **copias** las posiciones de los cuerpos físicos a tus Mesh.'),
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
            ['new CANNON.World()', 'El mundo físico, **independiente** de tu `scene`.'],
            ['mass: 1', '`mass: 0` = estático (un suelo). La forma de colisión suele ser más simple que la visible, para que el cálculo sea barato.'],
            ['world.step(1 / 60, deltaTime, 3)', 'Avanza la simulación: paso fijo de 1/60 s, con el tiempo real como referencia y hasta 3 pasos para ponerse al día.'],
            ['sphereMesh.position.copy', '**La sincronización**: lo que calculó la física se copia al objeto que se ve (para girar, lo mismo con `quaternion`).'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '¿Cómo consigues que un Mesh «caiga» con gravedad?',
        options: ['Three.js aplica gravedad automáticamente', 'Se simula en un mundo físico aparte y cada frame se copia la posición del cuerpo al Mesh', 'Con `mesh.gravity = true`'],
        answer: 1,
        why: 'Three.js no tiene físicas. Son dos mundos sincronizados: la librería calcula, tú copias posición y rotación al Mesh.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Modelos importados: glTF',
      body: () => [
        P('Los objetos complejos no se programan: se modelan en Blender y se cargan. El formato web es **glTF** (`.gltf`, o `.glb` empaquetado): trae geometría, materiales, texturas y animaciones.'),
        codeBlock({
          title: 'script.js',
          code: `
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const gltfLoader = new GLTFLoader()

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
            ['gltfLoader.load(', 'El callback recibe `gltf.scene` (el modelo) y `gltf.animations` (la lista de animaciones).'],
            ['gltf.scene.scale.set', 'Muchos modelos vienen en otra escala; aquí se reduce al 2.5 %.'],
            ['scene.add(gltf.scene)', '**Añade la escena entera.** Recorrer `gltf.scene.children` añadiéndolos uno a uno los va sacando del array mientras lo recorres, y te saltas hijos.'],
            ['new THREE.AnimationMixer', 'El reproductor de animaciones del modelo: eliges un clip, `play()`, y cada frame `mixer.update(deltaTime)`.'],
          ],
        }),
      ],
      more: () => [
        callout('tip', 'Checklist al exportar desde Blender', [
          UL([
            'Pocos polígonos cuando puedas; aplica escala y rotación (`Ctrl+A`).',
            'UV unwrap hecho si vas a usar texturas; nombres claros.',
            'Exporta **glTF 2.0 (`.glb`)** con materiales incluidos.',
            'Para ahorrar peso: geometría comprimida con **Draco** (`DRACOLoader` + `setDecoderPath(\'/draco/\')`) y texturas en JPG o formatos comprimidos.',
          ]),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Cuál es la trampa de añadir un glTF recorriendo `gltf.scene.children`?',
        options: ['Que no tiene hijos', 'Que `scene.add(hijo)` lo saca del array que recorres y te saltas elementos', 'Que no se puede animar después'],
        answer: 1,
        why: 'Añadir un objeto a otro padre lo quita del anterior y el array cambia bajo tus pies. Solución: `scene.add(gltf.scene)` o recorrer una copia (`[...children]`).',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Raycaster: tocar el 3D',
      body: () => [
        demo({
          title: 'Hover y clic con Raycaster',
          aspect: '16 / 8',
          caption: 'Pasa el ratón (o toca) las esferas: se iluminan; con clic cambian de tamaño. Mira el panel: el impacto trae el objeto, la **distancia** y el punto 3D exacto.',
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
            const aim = (e) => {
              const r = canvas.getBoundingClientRect();
              mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
              mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
            };
            canvas.addEventListener('pointermove', aim);
            canvas.addEventListener('pointerdown', aim); // con el dedo no hay «hover»: apuntamos al tocar
            canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') mouse.set(9, 9); });
            canvas.addEventListener('click', (e) => {
              aim(e);
              raycaster.setFromCamera(mouse, camera);
              const first = raycaster.intersectObjects(balls)[0];
              if (first) first.object.userData.big = !first.object.userData.big;
            });
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
                ui.readout('r', `mouse (−1 a 1)\n  x ${mouse.x.toFixed(2)}   y ${mouse.y.toFixed(2)}\n\n` + (hit
                  ? `intersects.length = ${intersects.length}\nobject: ${hit.object.name}\ndistance: ${hit.distance.toFixed(2)}\npoint: ${hit.point.x.toFixed(2)}, ${hit.point.y.toFixed(2)}, ${hit.point.z.toFixed(2)}`
                  : 'intersects.length = 0\n(el rayo no toca nada)'));
              }
            });
            ui = panel([{ type: 'readout', id: 'r' }, { type: 'note', html: '`raycaster.setFromCamera(mouse, camera)` y después `raycaster.intersectObjects(lista)`.' }]);
          },
        }),
        P('Un **raycaster** lanza un rayo y te dice qué objetos atraviesa, **ordenados por distancia**. Lo difícil de recordar son las coordenadas del ratón: de −1 a 1, (0,0) en el centro, y la **y hacia arriba** (al revés que el navegador):'),
        eq(`canvas de 800 × 600, ratón en (600, 150) píxeles

x = 600 / 800 × 2 − 1        =  0.5    (a la derecha)
y = −(150 / 600 × 2 − 1)     =  0.5    (arriba)

ratón en el centro (400, 300) → (0, 0)`),
      ],
      check: {
        type: 'mc',
        q: 'El ratón está en la esquina superior izquierda del canvas. ¿Coordenadas normalizadas?',
        options: ['(0, 0)', '(−1, 1)', '(−1, −1)'],
        answer: 1,
        why: 'x: −1 izquierda, 1 derecha. y: −1 abajo, 1 arriba. Arriba-izquierda = (−1, 1).',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'El raycaster, en código',
      body: () => [
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
            ['mouse.x =', 'Píxeles → −1…1: divides por el ancho (0…1), ×2 (0…2), −1 (−1…1).'],
            ['mouse.y =', 'Igual pero **invertido** (el menos): en pantalla la y crece hacia abajo; en Three.js, hacia arriba.'],
            ['raycaster.setFromCamera', 'Lanza el rayo desde la cámara pasando por ese punto del canvas.'],
            ['intersectObjects(objectsToTest)', 'Solo mira los objetos que le pasas (más rápido que toda la escena). Devuelve impactos con `object`, `distance`, `point`, `uv`…'],
          ],
        }),
      ],
      check: {
        type: 'fill',
        q: 'Hay tres objetos alineados delante del rayo. Completa para quedarte con **el más cercano**:',
        pre: 'const first = intersects[', post: ']',
        answer: '0',
        accept: ['0'],
        placeholder: 'índice',
        size: 6,
        why: 'La lista viene ordenada de más cerca a más lejos, así que el más cercano siempre es `intersects[0]`.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'La receta del render realista',
      body: () => [
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
            ['antialias: true', 'Suaviza bordes dentados. Se nota sobre todo con pixel ratio 1; en pantallas retina apenas.'],
            ['toneMapping = THREE.ACESFilmicToneMapping', 'Las luces pueden superar el blanco; el tone mapping los «comprime» al rango de la pantalla imitando una cámara de cine. Evita blancos quemados.'],
            ['scene.environment = environmentMap', 'Iluminación y reflejos desde un HDRI (lección de materiales).'],
            ['shadow.normalBias', 'Corrige el **acné de sombra**: rayas en superficies que se sombrean a sí mismas.'],
            ['shadow.bias = -0.001', 'Lo mismo a lo largo de la luz. Si te pasas, la sombra se despega del objeto.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Tu modelo tiene rayas oscuras raras, como si se sombreara a sí mismo. ¿Qué tocas?',
        options: ['`toneMappingExposure`', '`light.shadow.normalBias`', '`antialias`'],
        answer: 1,
        why: 'Eso es el «acné de sombra». `normalBias` desplaza el punto de muestreo a lo largo de la normal y las rayas desaparecen.',
      },
    },

    /* 6 ------------------------------------------------------------------ */
    {
      t: 'Estructurar un proyecto grande',
      body: () => [
        P('Un `script.js` de 800 líneas se vuelve inmanejable. El curso lo separa en **clases con una responsabilidad cada una**, conectadas por una clase principal `Experience`:'),
        codeBlock({
          title: 'estructura',
          lang: 'text',
          code: `
src/
  script.js            ← punto de entrada: new Experience(canvas)
  Experience/
    Experience.js      ← crea y conecta todo (singleton)
    Camera.js          ← cámara + OrbitControls
    Renderer.js        ← WebGLRenderer
    World/
      World.js         ← lo que hay en la escena
      Floor.js, Fox.js ← cada objeto, su clase
    Utils/
      Sizes.js         ← ancho, alto, pixelRatio (avisa en resize)
      Time.js          ← deltaTime / elapsed (emite 'tick')
      Resources.js     ← carga todos los assets
      EventEmitter.js  ← .on('tick', fn) / .trigger('tick')`,
          notes: [],
        }),
      ],
      more: () => [
        callout('remember', 'El bus de eventos', [
          P('Con `on` y `trigger`, `Time` puede avisar «hay un tick» y `Sizes` «cambió el tamaño» **sin que nadie se conozca entre sí**: cada clase se suscribe a lo que le interesa. Es `addEventListener`, pero para tus propias clases.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué resuelve el `EventEmitter` en esta estructura?',
        options: ['Hace el render más rápido', 'Que `Time` y `Sizes` avisen de sus cambios sin que las demás clases dependan unas de otras', 'Sustituye a `requestAnimationFrame`'],
        answer: 1,
        why: 'Es desacople: quien emite no sabe quién escucha. Cada clase se suscribe a `tick` o `resize` y reacciona por su cuenta.',
      },
    },
  ];
}
