import { P, UL, callout, codeBlock, liveCode, demo, table, eq } from '../ui.js';

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'La foto de la luz',
      body: () => [
        callout('analogy', 'Ponte en el lugar de la lámpara', [
          P('Imagina que eres la luz y haces una **foto especial** de la escena: en vez de colores, cada píxel guarda **a qué distancia** está lo primero que ves. Es el *shadow map*. Al dibujar la escena normal, cada punto pregunta: «¿hay algo más cerca de la luz que yo?». Si sí, está **a la sombra**.'),
        ]),
        eq(`Punto del suelo a 5 m de la luz.\nEl shadow map, en esa dirección, dice 3 m (la esfera está delante).\n\n5 > 3  →  algo me tapa  →  EN SOMBRA\n5 = 5  →  nada delante  →  ILUMINADO`),
        UL([
          'La foto es **un render extra** por cada luz con sombras (¡seis para una PointLight!). Por eso las sombras cuestan.',
          'Para la foto, Three.js **no usa tus materiales**: usa un `MeshDepthMaterial`. Si un shader deforma el objeto, la foto no se entera — **ahí nace el bug de la sombra del twist.**',
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué guarda el *shadow map* de una luz?',
        options: [
          'Los colores de la escena vistos desde la luz',
          'La distancia de lo más cercano que la luz ve en cada dirección',
          'Un booleano por objeto: sombra sí/no',
        ],
        answer: 1,
        why: 'Es una foto de **profundidad**. Cada punto de la escena compara su distancia a la luz con la del mapa: si la suya es mayor, algo lo tapa.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Los cuatro interruptores',
      body: () => [
        demo({
          title: 'Enciéndelos y apágalos',
          aspect: '16 / 10',
          caption: 'Apaga interruptores y mira el diagnóstico: si falta **uno**, no hay sombra y Three.js no avisa. Con `mapSize` 64 la sombra sale pixelada; con el helper y el área pequeña, se corta al salir del rectángulo.',
          setup({ makeStage, panel, side }) {
            const stage = makeStage({ pos: [4.8, 4.2, 6.4], target: [0, 0.4, 0], fov: 42, shadows: true, antialias: true });
            const { THREE, scene, renderer } = stage;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFShadowMap;
            scene.add(new THREE.AmbientLight('#ffffff', 0.35));
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ color: '#8d93a6', roughness: 0.85 }));
            floor.rotation.x = -Math.PI / 2;
            scene.add(floor);
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 32), new THREE.MeshStandardMaterial({ color: '#f472b6', roughness: 0.4 }));
            scene.add(sphere);
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.4, 0.9), new THREE.MeshStandardMaterial({ color: '#4cc9e0', roughness: 0.5 }));
            box.position.set(-1.8, 0.7, -0.5);
            scene.add(box);
            const st = { enabled: true, lightCast: true, sphereCast: true, boxCast: true, floorRecv: true, map: 1024, radius: 1, type: 'PCF', helper: false, area: 5 };
            let light = null;
            let lightHelper = null;
            const code = liveCode({ title: 'script.js', lang: 'js' });
            let ui;
            const TYPES = { Basic: THREE.BasicShadowMap, PCF: THREE.PCFShadowMap, PCFSoft: THREE.PCFSoftShadowMap, VSM: THREE.VSMShadowMap };
            const refreshMaterials = () => scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
            const build = () => {
              if (light) { light.shadow?.map?.dispose(); scene.remove(light); }
              if (lightHelper) { scene.remove(lightHelper); lightHelper.dispose?.(); lightHelper = null; }
              light = new THREE.DirectionalLight('#ffffff', 3);
              light.position.set(3, 4.5, 2.5);
              const a = st.area;
              Object.assign(light.shadow.camera, { left: -a, right: a, top: a, bottom: -a, near: 1, far: 12 });
              light.shadow.camera.updateProjectionMatrix();
              light.castShadow = st.lightCast;
              light.shadow.mapSize.set(st.map, st.map);
              light.shadow.radius = st.radius;
              scene.add(light);
              if (st.helper) {
                lightHelper = new THREE.CameraHelper(light.shadow.camera);
                scene.add(lightHelper);
              }
              apply();
            };
            const apply = () => {
              renderer.shadowMap.enabled = st.enabled;
              sphere.castShadow = st.sphereCast;
              box.castShadow = st.boxCast;
              floor.receiveShadow = st.floorRecv;
              if (light) light.castShadow = st.lightCast;
              const missing = [];
              if (!st.enabled) missing.push('renderer.shadowMap.enabled');
              if (!st.lightCast) missing.push('light.castShadow');
              if (!st.sphereCast && !st.boxCast) missing.push('mesh.castShadow (nadie proyecta)');
              if (!st.floorRecv) missing.push('floor.receiveShadow');
              code.set(`renderer.shadowMap.enabled = ${st.enabled}

light.castShadow = ${st.lightCast}
sphere.castShadow = ${st.sphereCast}
box.castShadow = ${st.boxCast}
floor.receiveShadow = ${st.floorRecv}

light.shadow.mapSize.set(${st.map}, ${st.map})
light.shadow.camera.left = -${st.area}  // y right, top, bottom`);
              if (ui) ui.readout('diag', missing.length ? `❌ SIN SOMBRA. Falta:\n  ${missing.join('\n  ')}` : '✓ Los 4 interruptores están bien.');
            };
            stage.onTick((dt, t) => {
              sphere.position.set(Math.cos(t * 0.8) * 1.1, 0.9 + Math.abs(Math.sin(t * 1.4)) * 0.8, Math.sin(t * 0.8) * 0.9);
              lightHelper?.update();
            });
            ui = panel([
              { type: 'group', label: 'Los 4 interruptores' },
              { type: 'check', label: 'renderer.shadowMap.enabled', value: true, onInput: (v) => { st.enabled = v; if (ui) { refreshMaterials(); apply(); } } },
              { type: 'check', label: 'light.castShadow', value: true, onInput: (v) => { st.lightCast = v; if (ui) apply(); } },
              { type: 'check', label: 'esfera.castShadow', value: true, onInput: (v) => { st.sphereCast = v; if (ui) apply(); } },
              { type: 'check', label: 'suelo.receiveShadow', value: true, onInput: (v) => { st.floorRecv = v; if (ui) apply(); } },
              { type: 'readout', id: 'diag' },
              { type: 'group', label: 'Calidad' },
              { type: 'select', label: 'shadow.mapSize', options: [[64, '64 × 64 (pixelada)'], [256, '256 × 256'], [1024, '1024 × 1024'], [2048, '2048 × 2048']], value: 1024, onInput: (v) => { st.map = +v; if (ui) build(); } },
              { type: 'select', label: 'renderer.shadowMap.type', options: ['Basic', 'PCF', 'PCFSoft', 'VSM'], value: 'PCF', onInput: (v) => { st.type = v; renderer.shadowMap.type = TYPES[v]; if (ui) { refreshMaterials(); build(); } } },
              { type: 'range', label: 'área de la cámara de la luz', min: 2, max: 10, step: 0.5, value: 5, onInput: (v) => { st.area = v; if (ui) build(); } },
              { type: 'check', label: 'Ver la «cámara de la luz» (helper)', value: false, onInput: (v) => { st.helper = v; if (ui) build(); } },
            ], { initial: false });
            side.append(code.el);
            build();
          },
        }),
        codeBlock({
          title: 'script.js · los 4 interruptores',
          code: `
renderer.shadowMap.enabled = true
directionalLight.castShadow = true
sphere.castShadow = true
plane.receiveShadow = true`,
          notes: [
            ['renderer.shadowMap.enabled', '**1.** El interruptor general.'],
            ['directionalLight.castShadow', '**2.** La luz que «hace la foto» (solo Directional, Point y Spot pueden).'],
            ['sphere.castShadow', '**3.** Quien **proyecta** (sale en la foto).'],
            ['plane.receiveShadow', '**4.** Quien **recibe** (consulta la foto). Un objeto puede ser ambas cosas.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '`renderer.shadowMap.enabled` y `light.castShadow` están a true, pero no hay sombra. ¿Qué puede faltar?',
        options: [
          'Un CameraHelper',
          '`castShadow` en el objeto que proyecta y `receiveShadow` en el que recibe',
          'Una segunda luz',
        ],
        answer: 1,
        why: 'Son **cuatro** interruptores y los meshes vienen con los suyos apagados. Si falta uno cualquiera, no hay sombra y no hay error.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Afinar la calidad',
      body: () => [
        table(['Ajuste', 'Qué hace', 'Consejo'], [
          ['`shadow.mapSize`', 'Resolución de la foto', 'Potencias de 2; 1024–2048 normalmente'],
          ['`shadow.camera.near/far`', 'Rango de distancias que la luz «ve»', 'Cuanto más estrecho, más precisión'],
          ['`shadow.camera.top/right/…`', 'Área fotografiada (solo Directional)', 'Justa al contenido: pequeña = se corta, enorme = borrosa'],
          ['`shadow.radius`', 'Desenfoque del borde', 'No funciona con Basic ni PCFSoft'],
          ['`shadowMap.type`', 'Algoritmo', '`PCFSoftShadowMap` suele ser el bonito'],
          ['`shadow.bias / normalBias`', 'Corrige «acné» y despegues', 'Valores mínimos: −0.001 / 0.02'],
        ]),
        codeBlock({
          title: 'script.js',
          code: `
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.top = 2
directionalLight.shadow.camera.right = 2
directionalLight.shadow.camera.bottom = -2
directionalLight.shadow.camera.left = -2
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 6

const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
scene.add(cameraHelper)`,
          notes: [
            ['shadow.camera.top = 2', 'La cámara de sombras de una Directional es **ortográfica**: una caja. Fuera de la caja, ni proyectan ni reciben.'],
            ['new THREE.CameraHelper', '**La** herramienta de depurar sombras: dibuja la caja. Sombra cortada o borrosa → míralo aquí.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'La sombra sale pixelada. ¿Cuáles son los dos arreglos razonables?',
        options: [
          'Subir `mapSize`, o encoger el área de `shadow.camera` para aprovechar los píxeles',
          'Subir la intensidad de la luz y bajar el fov',
          'Activar `wireframe` y `transparent`',
        ],
        answer: 0,
        why: 'Los píxeles de la foto se reparten por el área cubierta: más resolución o menos área = sombra más nítida. El helper te enseña cuánta área estás desperdiciando.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'La alternativa barata: hornear',
      body: () => [
        P('Para lo que **no se mueve**, la sombra se calcula una vez en Blender y se guarda en una textura (*baking*): coste cero en runtime. Y para un objeto que sí se mueve, el truco clásico del curso: una **mancha difusa** en un plano que lo sigue.'),
        codeBlock({
          title: 'script.js',
          code: `
const sphereShadow = new THREE.Mesh(
  new THREE.PlaneGeometry(1.5, 1.5),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, alphaMap: simpleShadow })
)
sphereShadow.rotation.x = -Math.PI * 0.5
sphereShadow.position.y = plane.position.y + 0.01

// en el tick:
sphereShadow.position.x = sphere.position.x
sphereShadow.position.z = sphere.position.z
sphereShadow.material.opacity = (1 - sphere.position.y) * 0.3`,
          notes: [
            ['alphaMap: simpleShadow', 'Una imagen gris (círculo difuso blanco sobre negro): blanco = opaco, negro = transparente.'],
            ['plane.position.y + 0.01', 'Un pelín sobre el suelo para que no parpadeen entre sí (z-fighting).'],
            ['material.opacity =', 'Cuanto más alto salta la esfera, más tenue la mancha. Barato y convincente.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Un shader retuerce el objeto, pero su sombra sale recta. ¿Por qué? (Es LA pregunta de esta lección.)',
        options: [
          'Porque la luz es débil',
          'Porque la foto de profundidad se hace con un `MeshDepthMaterial` que no lleva tu deformación',
          'Porque falta `receiveShadow` en el objeto',
        ],
        answer: 1,
        why: 'El shadow map se dibuja con otro material. La solución — darle a la malla un `customDepthMaterial` deformado igual — es el paso clave de *Modified materials*.',
      },
    },
  ];
}
