import { P, H2, H3, UL, callout, codeBlock, liveCode, demo, table, quiz, eq } from '../ui.js';

export default function render(root) {
  root.append(
    P('Las sombras son **la parte que más confunde** del curso, pero se entienden con una sola idea (y esta idea es justo la que necesitarás en la lección final para arreglar la sombra del twist).'),

    H2('Cómo se calcula una sombra'),
    callout('analogy', 'Ponte en el lugar de la lámpara', [
      P('Imagina que eres la luz. Te giras hacia la escena y haces una **foto muy especial**: en vez de colores, cada píxel de la foto guarda **a qué distancia está lo primero que ves** en esa dirección. Esa foto se llama *shadow map* (mapa de sombras). Después, cuando se dibuja la escena normal desde la cámara, cada punto pregunta: «¿hay algo más cerca de la luz que yo, en mi misma dirección?». Si la respuesta es sí, ese punto está **a la sombra**. Si no, le llega la luz.'),
    ]),
    eq(`Un punto del suelo está a 5 m de la luz.\nEn el shadow map, esa dirección tiene registrado 3 m (la esfera está delante).\n\n5 m  >  3 m   →  algo me tapa  →  EN SOMBRA\n\nOtro punto del suelo, a 5 m, y el mapa dice 5 m (no hay nada delante)  →  ILUMINADO`),
    P('Dos consecuencias muy importantes de esta idea:'),
    UL([
      'La luz «hace una foto» de la escena **otra vez** (un render extra por cada luz con sombras, o seis si es una PointLight). Por eso las sombras son caras.',
      'Para esa foto, Three.js **no usa tus materiales**: usa un material especial de profundidad (`MeshDepthMaterial`). Si tu shader deforma un objeto, la foto de la luz no se entera. **Aquí nace el bug de la sombra del twist.**',
    ]),

    H2('Activar sombras: cuatro interruptores'),
    P('Hacen falta **cuatro** cosas. Si olvidas una, no hay sombra y Three.js no avisa de nada. Mira cuál te falta en cada caso en la demo siguiente.'),
    codeBlock({
      title: 'script.js',
      code: `
renderer.shadowMap.enabled = true

directionalLight.castShadow = true

sphere.castShadow = true

plane.receiveShadow = true`,
      notes: [
        ['renderer.shadowMap.enabled', '**1.** Interruptor general. Sin esto, Three.js ni siquiera prepara el sistema de sombras.'],
        ['directionalLight.castShadow', '**2.** La luz debe «hacer la foto». Solo `DirectionalLight`, `PointLight` y `SpotLight` pueden.'],
        ['sphere.castShadow', '**3.** Los objetos que **proyectan** sombra (aparecen en la foto de la luz).'],
        ['plane.receiveShadow', '**4.** Los objetos que **reciben** sombra (los que miran la foto para saber si están tapados). Un objeto puede hacer las dos cosas.'],
      ],
    }),

    demo({
      title: 'Los interruptores y la calidad de la sombra',
      aspect: '16 / 10',
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

        const st = {
          enabled: true, lightCast: true, sphereCast: true, boxCast: true, floorRecv: true,
          map: 1024, radius: 1, type: 'PCF', helper: false, area: 5, lightKind: 'Directional',
        };
        let light = null;
        let lightHelper = null;
        const code = liveCode({ title: 'script.js', lang: 'js' });
        let ui;

        const TYPES = { Basic: THREE.BasicShadowMap, PCF: THREE.PCFShadowMap, PCFSoft: THREE.PCFSoftShadowMap, VSM: THREE.VSMShadowMap };

        const refreshMaterials = () => scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });

        const build = () => {
          if (light) { light.shadow?.map?.dispose(); scene.remove(light); }
          if (lightHelper) { scene.remove(lightHelper); lightHelper.dispose?.(); lightHelper = null; }
          if (st.lightKind === 'Directional') {
            light = new THREE.DirectionalLight('#ffffff', 3);
            light.position.set(3, 4.5, 2.5);
            const a = st.area;
            Object.assign(light.shadow.camera, { left: -a, right: a, top: a, bottom: -a, near: 1, far: 12 });
            light.shadow.camera.updateProjectionMatrix();
          } else {
            light = new THREE.SpotLight('#ffffff', 260, 0, Math.PI / 5, 0.35, 2);
            light.position.set(2.5, 4.5, 2);
            light.shadow.camera.near = 1;
            light.shadow.camera.far = 12;
          }
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
          if (!st.sphereCast && !st.boxCast) missing.push('mesh.castShadow (ningún objeto proyecta)');
          if (!st.floorRecv) missing.push('floor.receiveShadow');
          const a = st.area;
          code.set(`renderer.shadowMap.enabled = ${st.enabled}
renderer.shadowMap.type = THREE.${st.type === 'Basic' ? 'BasicShadowMap' : st.type === 'PCF' ? 'PCFShadowMap' : st.type === 'PCFSoft' ? 'PCFSoftShadowMap' : 'VSMShadowMap'}

light.castShadow = ${st.lightCast}
sphere.castShadow = ${st.sphereCast}
box.castShadow = ${st.boxCast}
floor.receiveShadow = ${st.floorRecv}

light.shadow.mapSize.set(${st.map}, ${st.map})
light.shadow.radius = ${st.radius.toFixed(1)}${st.lightKind === 'Directional' ? `
light.shadow.camera.left = -${a}  // y right, top, bottom` : ''}`);
          if (ui) ui.readout('diag', missing.length ? `❌ SIN SOMBRA. Falta:\n  ${missing.join('\n  ')}` : '✓ Los 4 interruptores están bien.');
        };

        stage.onTick((dt, t) => {
          sphere.position.set(Math.cos(t * 0.8) * 1.1, 0.9 + Math.abs(Math.sin(t * 1.4)) * 0.8, Math.sin(t * 0.8) * 0.9);
          lightHelper?.update();
        });

        const rebuildOnChange = (key) => (v) => { st[key] = v; if (ui) build(); };
        ui = panel([
          { type: 'group', label: 'Los 4 interruptores' },
          { type: 'check', label: 'renderer.shadowMap.enabled', value: true, onInput: (v) => { st.enabled = v; if (ui) { refreshMaterials(); apply(); } } },
          { type: 'check', label: 'light.castShadow', value: true, onInput: (v) => { st.lightCast = v; if (ui) apply(); } },
          { type: 'check', label: 'esfera.castShadow', value: true, onInput: (v) => { st.sphereCast = v; if (ui) apply(); } },
          { type: 'check', label: 'caja.castShadow', value: true, onInput: (v) => { st.boxCast = v; if (ui) apply(); } },
          { type: 'check', label: 'suelo.receiveShadow', value: true, onInput: (v) => { st.floorRecv = v; if (ui) apply(); } },
          { type: 'readout', id: 'diag' },
          { type: 'group', label: 'Calidad' },
          { type: 'select', label: 'Luz', options: ['Directional', 'Spot'], value: 'Directional', onInput: rebuildOnChange('lightKind') },
          { type: 'select', label: 'shadow.mapSize (resolución de la «foto»)', options: [[64, '64 × 64 (borroso)'], [256, '256 × 256'], [1024, '1024 × 1024'], [2048, '2048 × 2048']], value: 1024, onInput: (v) => { st.map = +v; if (ui) build(); } },
          { type: 'select', label: 'renderer.shadowMap.type', options: ['Basic', 'PCF', 'PCFSoft', 'VSM'], value: 'PCF', onInput: (v) => { st.type = v; renderer.shadowMap.type = TYPES[v]; if (ui) { refreshMaterials(); build(); } } },
          { type: 'range', label: 'shadow.radius (desenfoque; Basic y PCFSoft lo ignoran)', min: 1, max: 12, step: 0.5, value: 1, onInput: rebuildOnChange('radius') },
          { type: 'range', label: 'shadow.camera: área cubierta (solo Directional)', min: 2, max: 10, step: 0.5, value: 5, onInput: rebuildOnChange('area') },
          { type: 'check', label: 'Mostrar la «cámara de la luz» (CameraHelper)', value: false, onInput: (v) => { st.helper = v; if (ui) build(); } },
        ], { initial: false });
        side.append(code.el);
        build();
      },
      caption: 'Fíjate en dos trucos: con `mapSize` en 64 la sombra sale pixelada (la «foto» tiene pocos píxeles); y con el helper activado y `área` pequeña, la sombra se corta cuando sale del rectángulo que ve la cámara de la luz. **Ajustar ese rectángulo lo más justo posible** da sombras mucho más nítidas sin subir el mapSize.',
    }),

    H2('Ajustar la calidad'),
    table(['Ajuste', 'Qué hace', 'Consejo'], [
      ['`light.shadow.mapSize.set(1024, 1024)`', 'Resolución de la foto de la luz. Más = nítida, pero más memoria y cálculo.', 'Siempre potencias de 2. 1024 o 2048 para la mayoría.'],
      ['`light.shadow.camera.near / far`', 'Entre qué distancias la luz «ve». La GPU guarda la profundidad con precisión limitada: **un rango estrecho mejora la precisión**.', 'Usa un `CameraHelper` para ver el volumen y ajústalo al contenido.'],
      ['`light.shadow.camera.top/right/bottom/left`', 'Solo DirectionalLight. El área rectangular que se fotografía.', 'Muy pequeño = sombra cortada. Muy grande = sombra borrosa.'],
      ['`light.shadow.radius`', 'Desenfoca el borde de la sombra.', 'No funciona con `BasicShadowMap` ni `PCFSoftShadowMap`.'],
      ['`renderer.shadowMap.type`', 'Algoritmo: `Basic` (rápido, bordes duros), `PCF` (por defecto), `PCFSoft` (suave), `VSM` (muy suave, más artefactos).', 'Prueba PCFSoft primero.'],
      ['`light.shadow.bias / normalBias`', 'Corrige «acné» de sombra (rayas feas en superficies planas) o sombras separadas del objeto.', 'Valores minúsculos: `bias = -0.001`, `normalBias = 0.02`.'],
    ]),
    codeBlock({
      title: 'script.js',
      code: `
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
directionalLight.shadow.camera.top = 2
directionalLight.shadow.camera.right = 2
directionalLight.shadow.camera.bottom = -2
directionalLight.shadow.camera.left = -2
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 6
directionalLight.shadow.radius = 4

const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
scene.add(cameraHelper)`,
      notes: [
        ['shadow.mapSize.width', 'Resolución de la foto de sombras. La anchura y la altura se pueden poner por separado, o con `.set(1024, 1024)`.'],
        ['shadow.camera.top = 2', 'La «cámara de la luz» (en una DirectionalLight es **ortográfica**: una caja, no una pirámide) cubre de -2 a 2 en cada eje. Lo que quede fuera de esa caja no proyecta ni recibe sombra.'],
        ['shadow.camera.near = 1', 'Distancia más cercana y más lejana a la luz que se tiene en cuenta.'],
        ['shadow.radius = 4', 'Desenfoque del borde.'],
        ['new THREE.CameraHelper', 'Dibuja esa caja para que la veas. Es **la herramienta de depuración** de sombras: si una sombra se corta o es borrosa, ábrelo.'],
      ],
    }),

    H2('Alternativa barata: hornear la sombra'),
    P('Las sombras en tiempo real cuestan. Para objetos que **no se mueven** puedes calcular la sombra una sola vez en Blender y guardarla en una textura (*baking*), usándola como `map` o `aoMap`; el coste en runtime es cero. Y para un objeto que sí se mueve, un truco clásico es una **sombra falsa**: un plano justo encima del suelo con una textura de mancha difusa, que sigue al objeto y se hace más transparente al alejarse.'),
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
        ['new THREE.PlaneGeometry(1.5, 1.5)', 'Un plano pequeño que hará de «mancha».'],
        ['alphaMap: simpleShadow', 'Una imagen en escala de grises (círculo blanco difuso sobre negro) decide qué parte del plano es visible: blanco = opaco, negro = transparente.'],
        ['sphereShadow.rotation.x', 'Lo tumbamos para que quede paralelo al suelo.'],
        ['plane.position.y + 0.01', 'Un poquito por encima del suelo, para evitar que parpadeen (z-fighting).'],
        ['sphereShadow.position.x', 'La mancha sigue a la esfera en x y z.'],
        ['material.opacity =', 'Cuanto más alto está el objeto, más tenue la mancha.'],
      ],
    }),

    quiz([
      {
        q: 'Has puesto `light.castShadow = true` y `renderer.shadowMap.enabled = true`, pero no ves ninguna sombra. ¿Qué dos cosas pueden faltar?',
        options: ['`mesh.castShadow` en el objeto que proyecta y `receiveShadow` en el que recibe', 'Un `CameraHelper` y más intensidad', '`wireframe` y `transparent`', 'Una segunda luz'],
        answer: 0,
        why: 'Son cuatro interruptores: renderer, luz, **objeto que proyecta** y **objeto que recibe**. Los meshes no proyectan ni reciben por defecto.',
      },
      {
        q: '¿Qué contiene el *shadow map* de una luz?',
        options: ['Los colores de la escena vistos desde la luz', 'La distancia de lo más cercano que ve la luz en cada dirección', 'Un número por objeto', 'Las normales de los objetos'],
        answer: 1,
        why: 'Es una «foto de profundidad». Al dibujar, cada punto compara su distancia a la luz con la guardada: si es mayor, algo lo tapa.',
      },
      {
        q: 'Las sombras de un objeto deformado por un shader salen en la forma original. ¿Por qué?',
        options: ['Porque el shadow map usa un material de profundidad propio que no incluye tu deformación', 'Porque la luz es demasiado débil', 'Porque falta `receiveShadow`', 'Porque la cámara está mal'],
        answer: 0,
        why: 'La luz renderiza la escena con `MeshDepthMaterial`, no con tu material. Hay que decirle que use uno modificado con `mesh.customDepthMaterial` (lo verás en el laboratorio final).',
      },
      {
        q: 'Una sombra aparece pixelada. ¿Qué puedes subir?',
        options: ['`shadow.mapSize`', '`material.roughness`', '`camera.fov`', '`light.angle`'],
        answer: 0,
        why: 'El mapSize es la resolución de la «foto». También puedes reducir el área que cubre `shadow.camera` para aprovechar mejor los píxeles.',
      },
    ]),
  );
}
