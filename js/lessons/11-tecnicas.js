import { P, UL, callout, codeBlock, demo } from '../ui.js';

/* ---------- Mini casa encantada: niebla + fantasma ---------- */
function hauntedDemo() {
  return demo({
    title: 'Niebla y un fantasma',
    aspect: '16 / 10',
    caption: 'Mueve **near** y **far**: entre esos dos valores (distancia a la cámara) la niebla va tapando los objetos. El fondo tiene **el mismo color** que la niebla; por eso lo lejano «se disuelve».',
    setup({ makeStage, panel }) {
      const stage = makeStage({ pos: [5, 2.6, 7], target: [0, 0.8, -3], fov: 50, background: '#262837' });
      const { THREE, scene } = stage;
      scene.fog = new THREE.Fog('#262837', 1, 15);
      scene.add(new THREE.AmbientLight('#b9d5ff', 0.5));
      const moon = new THREE.DirectionalLight('#b9d5ff', 1.2); moon.position.set(4, 5, 2); scene.add(moon);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#4b6b4f' }));
      floor.rotation.x = -Math.PI / 2; scene.add(floor);
      const house = new THREE.Group();
      const walls = new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 2), new THREE.MeshStandardMaterial({ color: '#ac8e82' })); walls.position.y = 0.7;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.9, 4), new THREE.MeshStandardMaterial({ color: '#b35f45' })); roof.position.y = 1.85; roof.rotation.y = Math.PI / 4;
      house.add(walls, roof); scene.add(house);
      const graveMat = new THREE.MeshStandardMaterial({ color: '#b2b6b1' });
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39996, r = 3 + (i % 7) * 1.4;
        const g = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.18), graveMat);
        g.position.set(Math.cos(a) * r, 0.33, Math.sin(a) * r - 2); g.rotation.y = a; g.rotation.z = ((i % 5) - 2) * 0.08;
        scene.add(g);
      }
      const ghost = new THREE.PointLight('#ff00ff', 6, 4, 1.4); scene.add(ghost);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.06), new THREE.MeshBasicMaterial({ color: '#ff66ff', fog: false })); ghost.add(dot);
      stage.onTick((dt, t) => { const a = t * 0.5; ghost.position.set(Math.cos(a) * 2.6, 0.5 + Math.sin(t * 3) * 0.3, Math.sin(a) * 2.6); });
      let ui;
      ui = panel([
        { type: 'range', id: 'near', label: 'near', min: 0, max: 15, step: 0.5, value: 1, onInput: (v) => { scene.fog.near = v; } },
        { type: 'range', id: 'far', label: 'far', min: 2, max: 40, step: 0.5, value: 15, onInput: (v) => { scene.fog.far = v; } },
        { type: 'check', id: 'fog', label: 'Niebla activada', value: true, onInput: (v) => { scene.fog = v ? new THREE.Fog('#262837', ui ? ui.get('near') : 1, ui ? ui.get('far') : 15) : null; } },
        { type: 'check', id: 'ghost', label: 'Fantasma (PointLight)', value: true, onInput: (v) => { ghost.visible = v; } },
      ]);
    },
  });
}


function softCircleTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'La casa encantada, en cinco ideas',
      body: () => [
        hauntedDemo(),
        P('Este proyecto del curso no trae conceptos nuevos: es **todo lo anterior junto**. Lo que merece quedarse contigo:'),
        UL([
          'La casa es un **`Group` de `Mesh`**: paredes (`Box`), tejado (`Cone` de 4 lados = pirámide), puerta (`Plane` con texturas), arbustos (`Sphere` escaladas).',
          '**Niebla**: `scene.fog` funde lo lejano con un color. Barata y con muchísimo ambiente.',
          'Los **fantasmas** son `PointLight` dando vueltas con `sin` y `cos` del tiempo.',
        ]),
      ],
      more: () => [
        codeBlock({
          title: 'script.js',
          code: `
scene.fog = new THREE.Fog('#262837', 1, 15)
renderer.setClearColor('#262837')

const ghost1 = new THREE.PointLight('#ff00ff', 6, 3)
scene.add(ghost1)

// en el tick:
const ghost1Angle = elapsedTime * 0.5
ghost1.position.x = Math.cos(ghost1Angle) * 4
ghost1.position.z = Math.sin(ghost1Angle) * 4
ghost1.position.y = Math.sin(elapsedTime * 3)`,
          notes: [
            ["new THREE.Fog('#262837', 1, 15)", 'Color, **near** (donde empieza la niebla) y **far** (donde ya es total). Los materiales la usan automáticamente.'],
            ['renderer.setClearColor', 'El fondo del canvas **del mismo color** que la niebla, o se verá un borde.'],
            ['Math.cos(ghost1Angle) * 4', 'El círculo de siempre: x = cos, z = sin, radio 4. El fantasma rodea la casa.'],
            ['Math.sin(elapsedTime * 3)', 'Y flota arriba y abajo con otra onda más rápida.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: "En `new THREE.Fog('#262837', 1, 15)`, ¿qué son el 1 y el 15?",
        options: ['La intensidad mínima y máxima', 'Donde la niebla empieza (near) y donde ya lo tapa todo (far)', 'Los fotogramas que tarda en aparecer'],
        answer: 1,
        why: 'Entre near y far la niebla se mezcla progresivamente. Antes del 1 no hay niebla; después del 15, solo se ve el color de la niebla.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Points: miles de partículas en un solo objeto',
      body: () => [
        demo({
          title: 'Prueba PointsMaterial',
          aspect: '16 / 9',
          caption: 'Sube `count` a 60 000 y mira que sigue fluido. Activa `alphaMap` (círculo suave), luego `AdditiveBlending` y `vertexColors`.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 0, 7], fov: 50 });
            const { THREE, scene } = stage;
            const tex = softCircleTexture(THREE);
            let points = null;
            const mat = new THREE.PointsMaterial({ size: 0.12, sizeAttenuation: true, color: '#a493ff', transparent: true, depthWrite: false, blending: THREE.NormalBlending });
            let ui;
            const build = (count) => {
              if (points) { points.geometry.dispose(); scene.remove(points); }
              const arr = new Float32Array(count * 3);
              const col = new Float32Array(count * 3);
              const c = new THREE.Color();
              for (let i = 0; i < count; i++) {
                arr[i * 3] = (Math.random() - 0.5) * 10;
                arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
                arr[i * 3 + 2] = (Math.random() - 0.5) * 10;
                c.setHSL(0.55 + Math.random() * 0.3, 0.9, 0.6);
                col.set([c.r, c.g, c.b], i * 3);
              }
              const g = new THREE.BufferGeometry();
              g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
              g.setAttribute('color', new THREE.BufferAttribute(col, 3));
              points = new THREE.Points(g, mat);
              scene.add(points);
            };
            stage.onTick((dt) => { if (points) points.rotation.y += dt * 0.1; });
            ui = panel([
              { type: 'range', label: 'count (partículas)', min: 100, max: 60000, step: 100, value: 4000, onInput: (v) => { if (ui) build(v); } },
              { type: 'range', label: 'size', min: 0.02, max: 0.6, step: 0.01, value: 0.12, onInput: (v) => { mat.size = v; } },
              { type: 'check', label: 'sizeAttenuation', value: true, onInput: (v) => { mat.sizeAttenuation = v; mat.needsUpdate = true; } },
              { type: 'check', label: 'alphaMap (círculo suave)', value: false, onInput: (v) => { mat.alphaMap = v ? tex : null; mat.needsUpdate = true; } },
              { type: 'check', label: 'AdditiveBlending', value: false, onInput: (v) => { mat.blending = v ? THREE.AdditiveBlending : THREE.NormalBlending; mat.needsUpdate = true; } },
              { type: 'check', label: 'depthWrite', value: false, onInput: (v) => { mat.depthWrite = v; } },
              { type: 'check', label: 'vertexColors', value: false, onInput: (v) => { mat.vertexColors = v; mat.color.set(v ? '#ffffff' : '#a493ff'); mat.needsUpdate = true; } },
            ], { initial: false });
            build(4000);
          },
        }),
        P('`THREE.Points` es como un Mesh, pero dibuja **un punto por vértice** en vez de triángulos. 50 000 vértices = 50 000 partículas en **una sola llamada de dibujo**; 50 000 Mesh serían 50 000 llamadas, y eso sí mata el rendimiento.'),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué 100 000 partículas en un `Points` van fluidas y 100 000 `Mesh` no?',
        options: ['Porque los puntos no se dibujan de verdad', 'Porque es una sola geometría y una sola llamada de dibujo', 'Porque los puntos no usan material'],
        answer: 1,
        why: 'Lo que limita el rendimiento son las llamadas de dibujo (draw calls), una por Mesh. `Points` agrupa todo en una.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'El material de las partículas',
      body: () => [
        codeBlock({
          title: 'script.js',
          code: `
const count = 5000
const positions = new Float32Array(count * 3)
for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 10

const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const material = new THREE.PointsMaterial({
  size: 0.1,
  sizeAttenuation: true,
  alphaMap: particleTexture,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
})
scene.add(new THREE.Points(geometry, material))`,
          notes: [
            ['new Float32Array(count * 3)', 'Tres números (x, y, z) por partícula. Es la geometría a mano de la lección «Geometrías».'],
            ['sizeAttenuation: true', 'Los puntos lejanos se ven más pequeños (perspectiva). Con `false`, todos miden igual en pantalla.'],
            ['alphaMap: particleTexture', 'Textura en blanco y negro que recorta el punto: de cuadrado a círculo difuso. Necesita `transparent: true`.'],
            ['depthWrite: false', 'Evita que una partícula transparente «tape» a las de detrás con un borde cuadrado.'],
            ['blending: THREE.AdditiveBlending', 'Los colores se **suman**: donde se solapan, más brillo. Perfecto para fuego y galaxias.'],
          ],
        }),
      ],
      more: () => [
        callout('warn', 'Animar partículas: cuidado con la CPU', [
          P('Puedes mover cada partícula recorriendo el array cada frame y marcando `geometry.attributes.position.needsUpdate = true`. Con unos miles va bien; con cientos de miles no, porque el trabajo lo hace la CPU y re-subes el array entero a la GPU cada frame. La solución profesional: moverlas **en un vertex shader** (capítulo 4).'),
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Quieres que las partículas brillen más donde se solapan. ¿Qué cambias?',
        options: ['`blending = THREE.AdditiveBlending`', '`sizeAttenuation = false`', '`depthWrite = true`'],
        answer: 0,
        why: 'El blending aditivo suma el color nuevo al que ya hay en el píxel. Combínalo con `depthWrite: false` para evitar cortes.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'La galaxia: tres decisiones por partícula',
      body: () => [
        demo({
          title: 'Galaxia generada con código',
          aspect: '16 / 10',
          caption: 'Prueba `spin = 0` (brazos rectos), `branches = 1` y `randomness = 0` (líneas perfectas). Cada parámetro tiene un efecto visual claro.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [3.8, 3.8, 5.4], fov: 55 });
            const { THREE, scene } = stage;
            const p = { count: 40000, size: 0.012, radius: 5, branches: 3, spin: 1, randomness: 0.2, power: 3, inside: '#ff6030', outside: '#1b3984' };
            let points = null;
            const material = new THREE.PointsMaterial({ size: p.size, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true });
            const generate = () => {
              if (points) { points.geometry.dispose(); scene.remove(points); }
              const positions = new Float32Array(p.count * 3);
              const colors = new Float32Array(p.count * 3);
              const inside = new THREE.Color(p.inside);
              const outside = new THREE.Color(p.outside);
              const sign = () => (Math.random() < 0.5 ? 1 : -1);
              for (let i = 0; i < p.count; i++) {
                const i3 = i * 3;
                const radius = Math.random() * p.radius;
                const spinAngle = radius * p.spin;
                const branchAngle = ((i % p.branches) / p.branches) * Math.PI * 2;
                const rx = Math.pow(Math.random(), p.power) * sign() * p.randomness * radius;
                const ry = Math.pow(Math.random(), p.power) * sign() * p.randomness * radius;
                const rz = Math.pow(Math.random(), p.power) * sign() * p.randomness * radius;
                positions[i3] = Math.cos(branchAngle + spinAngle) * radius + rx;
                positions[i3 + 1] = ry;
                positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + rz;
                const mixed = inside.clone().lerp(outside, radius / p.radius);
                colors[i3] = mixed.r; colors[i3 + 1] = mixed.g; colors[i3 + 2] = mixed.b;
              }
              const g = new THREE.BufferGeometry();
              g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
              g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
              points = new THREE.Points(g, material);
              scene.add(points);
            };
            stage.onTick((dt) => { if (points) points.rotation.y += dt * 0.08; });
            const regen = (key) => (v) => { p[key] = v; generate(); };
            panel([
              { type: 'range', label: 'count', min: 1000, max: 120000, step: 1000, value: p.count, onInput: regen('count') },
              { type: 'range', label: 'size', min: 0.002, max: 0.05, step: 0.001, value: p.size, onInput: (v) => { p.size = v; material.size = v; } },
              { type: 'range', label: 'radius', min: 1, max: 8, step: 0.1, value: p.radius, onInput: regen('radius') },
              { type: 'range', label: 'branches (brazos)', min: 1, max: 8, step: 1, value: p.branches, onInput: regen('branches') },
              { type: 'range', label: 'spin (curvatura)', min: -3, max: 3, step: 0.05, value: p.spin, onInput: regen('spin') },
              { type: 'range', label: 'randomness', min: 0, max: 1, step: 0.01, value: p.randomness, onInput: regen('randomness') },
              { type: 'range', label: 'randomnessPower', min: 1, max: 10, step: 0.1, value: p.power, onInput: regen('power') },
              { type: 'select', label: 'insideColor', options: [['#ff6030', 'Naranja'], ['#ffc857', 'Ámbar'], ['#f472b6', 'Rosa'], ['#4cc9e0', 'Cian']], value: p.inside, onInput: (v) => { p.inside = v; generate(); } },
              { type: 'select', label: 'outsideColor', options: [['#1b3984', 'Azul'], ['#a493ff', 'Violeta'], ['#5bd68a', 'Verde'], ['#ff5a5a', 'Rojo']], value: p.outside, onInput: (v) => { p.outside = v; generate(); } },
            ], { initial: false });
            generate();
          },
        }),
        P('Para colocar cada partícula se deciden tres cosas: a qué **distancia** del centro está (*radius*), a qué **brazo** pertenece (*branch*) y cuánto se **curva** el brazo a esa distancia (*spin*). Más un poco de azar para que parezca polvo.'),
      ],
      check: {
        type: 'predict',
        q: 'Antes de tocarlo: si pones `spin = 0`, ¿cómo se verán los brazos?',
        options: ['Rectos, como radios de una rueda', 'Más curvados todavía', 'Desaparecen'],
        answer: 0,
        why: '`spinAngle = radius × spin`. Con spin = 0 el ángulo no cambia con la distancia: cada brazo es una línea recta. Pruébalo en la demo de arriba.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'El bucle de la galaxia, línea a línea',
      body: () => [
        codeBlock({
          title: 'script.js',
          code: `
for (let i = 0; i < count; i++) {
  const i3 = i * 3

  const radius = Math.random() * params.radius
  const spinAngle = radius * params.spin
  const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2

  const randomX = Math.pow(Math.random(), params.randomnessPower)
    * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius

  positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX
  positions[i3 + 1] = randomY
  positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ

  const mixedColor = colorInside.clone()
  mixedColor.lerp(colorOutside, radius / params.radius)
  colors[i3 + 0] = mixedColor.r
  colors[i3 + 1] = mixedColor.g
  colors[i3 + 2] = mixedColor.b
}`,
          notes: [
            ['const i3 = i * 3', 'Cada partícula ocupa 3 huecos seguidos (x, y, z); `i3` es el primero.'],
            ['const spinAngle = radius * params.spin', 'Cuanto más lejos del centro, más girado: eso dibuja la espiral.'],
            ['const branchAngle', '`i % branches` da 0, 1, 2, 0, 1, 2… y se reparte en el círculo. Con 3 brazos: 0°, 120°, 240°.'],
            ['const randomX', 'Dispersión: el `? 1 : -1` elige lado, y `pow(random, 3)` concentra casi todo **cerca de 0** → núcleo denso, polvo suelto fuera.'],
            ['positions[i3 + 0]', 'El círculo de siempre (`cos`/`sin`), girado por brazo + curvatura, más la dispersión.'],
            ['mixedColor.lerp', 'Mezcla del color interior al exterior según `radius / params.radius` (0 en el centro, 1 en el borde). Ojo: se clona antes, porque `lerp` modifica el objeto.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Con `branches = 4`, ¿en qué brazo cae la partícula `i = 6`?',
        options: ['En el 1.º (ángulo 0°)', 'En el 3.º (ángulo 180°)', 'En el 4.º (ángulo 270°)'],
        answer: 1,
        why: '`6 % 4 = 2` → tercer brazo (se cuenta 0, 1, **2**, 3). Su ángulo: (2/4) × 360° = 180°.',
      },
    },

    /* 6 ------------------------------------------------------------------ */
    {
      t: 'Scroll: la cámara baja contigo',
      body: () => [
        P('El truco del portfolio animado: el canvas es **fijo** (`position: fixed`) y encima hay secciones HTML normales. Al hacer scroll, lees `window.scrollY` y bajas la cámara en proporción, de modo que cada sección «cae» sobre un objeto 3D.'),
        codeBlock({
          title: 'script.js',
          code: `
let scrollY = window.scrollY
window.addEventListener('scroll', () => { scrollY = window.scrollY })

const objectsDistance = 4

// en el tick:
camera.position.y = -(scrollY / sizes.height) * objectsDistance

const parallaxX = cursor.x * 0.5
const parallaxY = -cursor.y * 0.5
cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime`,
          notes: [
            ['camera.position.y = -(scrollY / sizes.height)', '`scrollY / sizes.height` = **cuántas pantallas has bajado** (0, 1, 2…). Por la distancia entre objetos, la cámara baja justo de uno al siguiente. El `-` es porque bajar en la página es y negativo en 3D.'],
            ['cameraGroup.position.x +=', 'Parallax suavizado: cada frame avanza **una fracción de lo que falta** (× 5 × deltaTime). El movimiento se frena al llegar y se siente fluido.'],
          ],
        }),
      ],
      more: () => [
        callout('remember', 'Dos cámaras anidadas', [
          P('La cámara va dentro de un `Group` (`cameraGroup.add(camera)`): el scroll mueve la cámara y el parallax mueve el grupo, sin pisarse. Las transformaciones **se combinan**, como en los grupos de la lección 2.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Si `scrollY = 1688` y la pantalla mide 844 px de alto, ¿cuánto vale `scrollY / sizes.height`?',
        options: ['2: has bajado exactamente dos pantallas', '844', '0.5'],
        answer: 0,
        why: '1688 / 844 = 2. Esa división convierte píxeles de scroll en «pantallas bajadas», y por eso la cámara acaba justo en el tercer objeto (el 0, el 1… y el 2).',
      },
    },
  ];
}
