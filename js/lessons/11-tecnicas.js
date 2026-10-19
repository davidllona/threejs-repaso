import { P, H2, H3, UL, callout, codeBlock, demo, table, quiz, eq } from '../ui.js';

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

export default function render(root) {
  root.append(
    P('Esta lección junta cuatro proyectos del curso: la **casa encantada** (todo lo aprendido junto), las **partículas**, el **generador de galaxias** y la **animación con scroll**. Los dos del medio tienen demo, porque ahí se aprende algo nuevo e importante: cómo manejar miles de vértices.'),

    H2('La casa encantada: todo lo anterior junto'),
    P('Es un proyecto de repaso, sin conceptos nuevos de fondo. Lo que merece la pena recordar:'),
    UL([
      '**Todo es un `Group` de `Mesh`**: la casa es un grupo con paredes (`BoxGeometry`), tejado (`ConeGeometry` con 4 lados, así sale una pirámide), puerta (un `PlaneGeometry` con texturas) y arbustos (`SphereGeometry` escaladas).',
      '**Texturas PBR** (color, alpha, ambient occlusion, normal, roughness, displacement…) y trucos como `repeat` + `RepeatWrapping` para el suelo.',
      '**Niebla**: `scene.fog` hace que lo lejano se funda con un color. Es barato y da muchísimo ambiente. Hay que poner el mismo color al fondo (`renderer.setClearColor`).',
      '**Fantasmas**: simples `PointLight` movidas con `sin` y `cos` del tiempo (la fórmula del círculo de la lección «Animaciones»).',
      '**Sombras** activadas en luces y objetos clave (lección anterior).',
    ]),
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
        ["new THREE.Fog('#262837', 1, 15)", 'Color, **near** (donde empieza la niebla) y **far** (donde ya es total). Entre medias se mezcla progresivamente. Como los materiales usan la niebla automáticamente, no hay nada más que tocar.'],
        ['renderer.setClearColor', 'El color de fondo del canvas. Debe ser igual al de la niebla, o se verá un borde.'],
        ['new THREE.PointLight(', 'Color, intensidad y distancia: el fantasma ilumina un círculo pequeño a su alrededor.'],
        ['const ghost1Angle', 'Un ángulo que crece con el tiempo (0.5 rad por segundo).'],
        ['Math.cos(ghost1Angle) * 4', 'El círculo de siempre: x = cos, z = sin, con radio 4. El fantasma da vueltas a la casa en el plano horizontal.'],
        ['Math.sin(elapsedTime * 3)', 'Además sube y baja flotando con otra onda, más rápida.'],
      ],
    }),

    H2('Partículas: miles de puntos con un solo Mesh'),
    P('Un `THREE.Points` es como un Mesh, pero en vez de triángulos dibuja **un punto por cada vértice** de la geometría. Una sola geometría con 50 000 vértices = 50 000 partículas, y para la GPU eso es casi gratis comparado con 50 000 Mesh independientes (cada Mesh añade una llamada de dibujo; Points es **una**).'),
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
const particles = new THREE.Points(geometry, material)
scene.add(particles)`,
      notes: [
        ['const count = 5000', 'Cuántas partículas.'],
        ['const positions = new Float32Array(count * 3)', 'Un array con tres números (x, y, z) por partícula. Es **exactamente** la misma geometría a mano de la lección «Geometrías».'],
        ['new THREE.BufferGeometry()', 'Geometría vacía + atributo `position`. Cada vértice es una partícula.'],
        ['new THREE.PointsMaterial', 'Material específico para puntos.'],
        ['size: 0.1', 'Tamaño de cada punto.'],
        ['sizeAttenuation: true', 'Si es `true`, los puntos lejanos se ven más pequeños (perspectiva). Si es `false`, todos miden lo mismo en pantalla.'],
        ['alphaMap: particleTexture', 'Una textura en blanco y negro que recorta el punto: por defecto son cuadrados; con un círculo difuso se ven como luces o humo.'],
        ['transparent: true', 'Necesario para que `alphaMap` funcione.'],
        ['depthWrite: false', 'Evita que una partícula «tape» a las que hay detrás aunque sea transparente. Soluciona los bordes cuadrados que cortan a otras partículas.'],
        ['blending: THREE.AdditiveBlending', 'Los colores se **suman** en vez de taparse: donde se solapan, se ve más brillante. Perfecto para fuego, chispas y galaxias. Cuesta más rendimiento.'],
        ['new THREE.Points(geometry, material)', 'Igual que Mesh pero con puntos.'],
      ],
    }),
    demo({
      title: 'Prueba PointsMaterial',
      aspect: '16 / 9',
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
        panel([
          { type: 'range', label: 'count (partículas)', min: 100, max: 60000, step: 100, value: 4000, onInput: (v) => { if (ui) build(v); } },
          { type: 'range', label: 'size', min: 0.02, max: 0.6, step: 0.01, value: 0.12, onInput: (v) => { mat.size = v; } },
          { type: 'check', label: 'sizeAttenuation', value: true, onInput: (v) => { mat.sizeAttenuation = v; mat.needsUpdate = true; } },
          { type: 'check', label: 'alphaMap (círculo suave en vez de cuadrado)', value: false, onInput: (v) => { mat.alphaMap = v ? tex : null; mat.needsUpdate = true; } },
          { type: 'check', label: 'blending: AdditiveBlending', value: false, onInput: (v) => { mat.blending = v ? THREE.AdditiveBlending : THREE.NormalBlending; mat.needsUpdate = true; } },
          { type: 'check', label: 'depthWrite', value: false, onInput: (v) => { mat.depthWrite = v; } },
          { type: 'check', label: 'vertexColors (un color por partícula)', value: false, onInput: (v) => { mat.vertexColors = v; mat.color.set(v ? '#ffffff' : '#a493ff'); mat.needsUpdate = true; } },
        ], { initial: false });
        build(4000);
      },
      caption: 'Con vertexColors activo, cada partícula toma el color del atributo `color` de la geometría (otro Float32Array de 3 números por vértice). Es la misma mecánica que `position`: **un atributo = un array con N valores por vértice**.',
    }),
    callout('warn', 'Animar partículas: cuidado con la CPU', [
      P('Puedes mover cada partícula recorriendo el array en cada frame y marcando `geometry.attributes.position.needsUpdate = true`. Con unos pocos miles va bien; con cientos de miles **no**, porque haces el trabajo en la CPU y vuelves a subir todo el array a la GPU en cada frame. La solución profesional es mover las partículas **en un vertex shader** (capítulo 4): la GPU lo hace en paralelo.'),
    ]),

    H2('Generador de galaxias'),
    P('Aplica todo lo anterior y añade un poco de matemáticas: colocar las partículas en **brazos espirales**. Mira la idea antes del código: para cada partícula elegimos (1) una distancia al centro (*radius*), (2) un brazo al que pertenece (*branch*), y (3) cuánto se curva el brazo según lo lejos que esté (*spin*). Con un poco de azar para que parezca polvo estelar.'),
    codeBlock({
      title: 'script.js',
      code: `
for (let i = 0; i < count; i++) {
  const i3 = i * 3

  const radius = Math.random() * params.radius
  const spinAngle = radius * params.spin
  const branchAngle = ((i % params.branches) / params.branches) * Math.PI * 2

  const randomX = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius
  const randomY = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius
  const randomZ = Math.pow(Math.random(), params.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * params.randomness * radius

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
        ['for (let i = 0; i < count; i++)', 'Recorremos todas las partículas, una a una.'],
        ['const i3 = i * 3', 'Cada partícula ocupa 3 huecos seguidos en el array (x, y, z). `i3` es el índice de su primer hueco.'],
        ['const radius = Math.random()', 'Distancia al centro: un número aleatorio entre 0 y `params.radius`.'],
        ['const spinAngle = radius * params.spin', 'Cuanto más lejos del centro, más se **curva** el brazo. Con `spin = 0` los brazos son rectos; con `spin = 1` forman una espiral suave.'],
        ['const branchAngle', 'A qué brazo pertenece: `i % branches` da 0, 1, 2, 0, 1, 2… Se reparte en un círculo (0 a 2π) de forma uniforme. Con 3 brazos: 0°, 120°, 240°.'],
        ['const randomX', '**Dispersión** aleatoria. `Math.random() < 0.5 ? 1 : -1` elige el signo (a un lado o al otro); `Math.pow(random, power)` con power alto (3) concentra casi todos los valores **cerca de 0** y deja pocos lejos: un núcleo denso con polvo suelto alrededor del brazo. Se multiplica por `radius`, así que el brazo es más ancho en el exterior.'],
        ['const randomY', 'Igual para el eje Y: da grosor al disco.'],
        ['const randomZ', 'Igual para el eje Z.'],
        ['positions[i3 + 0]', 'Posición final en x: el **círculo** de siempre (`cos`) con radio `radius`, girado por el ángulo del brazo + la curvatura, más la dispersión.'],
        ['positions[i3 + 1] = randomY', 'La y no usa el círculo: la galaxia es un disco plano, con la dispersión como grosor.'],
        ['positions[i3 + 2]', 'Y la z usa `sin`: x y z juntos dibujan el círculo en el plano horizontal.'],
        ['const mixedColor = colorInside.clone()', 'Copia del color del centro (importante clonar: `lerp` modifica el objeto).'],
        ['mixedColor.lerp', '`lerp` mezcla linealmente dos colores. `radius / params.radius` va de 0 (centro) a 1 (borde), así el color pasa de interior a exterior.'],
        ['colors[i3 + 0]', 'Guardamos el color resultante en el atributo `color`, 3 números por partícula.'],
      ],
    }),
    demo({
      title: 'Galaxia generada con código',
      aspect: '16 / 10',
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
      caption: 'Prueba `spin = 0` (brazos rectos), `branches = 1`, `randomnessPower = 1` (dispersión uniforme, sin núcleo denso) y `randomness = 0` (líneas perfectas). Cada parámetro tiene un efecto visual claro; así es como se «descubre» un generador procedural.',
    }),

    H2('Animación basada en scroll'),
    P('La idea: el canvas es **fijo** (`position: fixed`) y la página tiene secciones HTML normales encima. Cuando el usuario hace scroll, leemos `window.scrollY` y movemos la cámara en proporción. Así cada sección «cae» sobre un objeto 3D distinto.'),
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
        ['let scrollY', 'Guardamos cuánto scroll hay, en píxeles desde arriba.'],
        ["addEventListener('scroll'", 'Cada vez que el usuario hace scroll, actualizamos el valor.'],
        ['const objectsDistance = 4', 'Los objetos 3D están colocados uno debajo de otro, a 4 unidades de distancia.'],
        ['camera.position.y = -(scrollY / sizes.height)', '`scrollY / sizes.height` cuenta **cuántas pantallas has bajado** (0, 1, 2…). Multiplicado por la distancia entre objetos, la cámara baja exactamente lo que hay entre uno y el siguiente. El `-` es porque bajar en la página es y negativo en 3D.'],
        ['const parallaxX', 'Un efecto extra: la cámara se desplaza un poco siguiendo el cursor (parallax).'],
        ['cameraGroup.position.x +=', 'No saltamos directamente al valor: avanzamos **una fracción de la distancia que falta** en cada frame (`× 5 × deltaTime`). Es un suavizado («easing»): el movimiento se frena al acercarse y se siente fluido.'],
      ],
    }),
    callout('remember', 'Dos cámaras anidadas', [
      P('Se mete la cámara dentro de un `Group` (`cameraGroup.add(camera)`). Así, el scroll mueve la cámara y el parallax mueve el grupo, sin que se pisen entre sí. Es el mismo principio que viste con los grupos: las transformaciones **se combinan**.'),
    ]),

    quiz([
      {
        q: '¿Por qué un `THREE.Points` de 100 000 partículas es mucho más barato que 100 000 `Mesh`?',
        options: ['Porque los puntos no se dibujan', 'Porque es una sola geometría y una sola llamada de dibujo para la GPU', 'Porque usa menos colores', 'Porque no usa material'],
        answer: 1,
        why: 'Cada Mesh añade una llamada de dibujo (draw call), que es lo que limita el rendimiento. Un `Points` agrupa todo en una.',
      },
      {
        q: 'En el generador de galaxias, ¿qué controla `spin`?',
        options: ['La velocidad de rotación en el tiempo', 'Cuánto se curva cada brazo según la distancia al centro', 'El número de brazos', 'El tamaño de las partículas'],
        answer: 1,
        why: '`spinAngle = radius * spin`: a mayor radio, más se gira el ángulo del brazo, lo que dibuja la espiral.',
      },
      {
        q: 'Quieres que las partículas se sumen de color al solaparse (efecto brillante). ¿Qué propiedad cambias?',
        options: ['`blending = THREE.AdditiveBlending`', '`sizeAttenuation = false`', '`depthWrite = true`', '`wireframe = true`'],
        answer: 0,
        why: 'El `AdditiveBlending` suma el color de lo que se dibuja al de lo que ya hay. Combinado con `depthWrite = false` evita cortes entre partículas.',
      },
    ]),
  );
}
