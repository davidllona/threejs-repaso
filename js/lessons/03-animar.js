import { P, callout, codeBlock, demo, table, eq } from '../ui.js';

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'El bucle tick',
      body: () => [
        P('`renderer.render()` saca **una foto**. Animar es sacar muchas fotos seguidas con los objetos un poco movidos, como un flipbook. El navegador te da la herramienta exacta: `requestAnimationFrame` («llámame justo antes del siguiente frame»).'),
        codeBlock({
          title: 'script.js',
          code: `
const tick = () => {
  mesh.rotation.y += 0.01

  renderer.render(scene, camera)

  window.requestAnimationFrame(tick)
}

tick()`,
          notes: [
            ['const tick', 'La función que se repetirá. Se llama `tick` por tradición («tic» de reloj).'],
            ['mesh.rotation.y += 0.01', 'Un poquito más de giro cada vez. **Este número esconde un problema: siguiente tarjeta.**'],
            ['window.requestAnimationFrame(tick)', 'Se pide a sí misma volver a ejecutarse en el siguiente frame: esto crea el bucle.'],
            ['tick()', 'Arranca el primer frame. Sin esta línea, nada.'],
          ],
        }),
      ],
      check: {
        type: 'order',
        q: 'Ordena lo que hace el bucle en cada frame:',
        lines: [
          'actualizar los objetos (mover, girar…)',
          'renderer.render(scene, camera)',
          'window.requestAnimationFrame(tick)',
        ],
        why: 'Primero cambias la escena, luego la fotografías, y por último pides el siguiente turno. (Los dos últimos pasos podrían intercambiarse, pero este es el orden del curso y el más claro.)',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Cada ordenador va a su ritmo',
      body: () => [
        demo({
          title: 'Por frame contra por segundo',
          aspect: '16 / 8',
          caption: 'Baja los FPS simulados: el cubo **rojo** (cambio fijo por frame) se enlentece; el **verde** (cambio × tiempo) mantiene su velocidad real.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 0, 6.2], fov: 38, orbit: false });
            const { THREE, scene } = stage;
            scene.add(new THREE.AmbientLight('#fff', 0.8));
            const sun = new THREE.DirectionalLight('#fff', 2);
            sun.position.set(2, 3, 4);
            scene.add(sun);
            const mk = (x, color) => {
              const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.4), new THREE.MeshStandardMaterial({ color, roughness: 0.45 }));
              m.position.x = x;
              scene.add(m);
              return m;
            };
            const a = mk(-1.9, '#ff5a5a');
            const b = mk(1.9, '#5bd65b');
            let fps = 60;
            let acc = 0;
            let ui;
            const PER_FRAME = 0.04;
            const PER_SECOND = PER_FRAME * 60;
            stage.onTick((dt) => {
              acc += dt;
              const step = 1 / fps;
              if (acc < step) return;
              const simDelta = acc;
              acc = 0;
              a.rotation.y += PER_FRAME;
              b.rotation.y += PER_SECOND * simDelta;
            });
            const report = () => ui.readout('r', `Cubo rojo  (+0.04 por frame):\n  ${(PER_FRAME * fps).toFixed(2)} rad/s\nCubo verde (× tiempo):\n  ${PER_SECOND.toFixed(2)} rad/s  ← siempre igual`);
            const setFps = (v) => { fps = v; if (ui) report(); };
            ui = panel([
              { type: 'range', id: 'fps', label: 'FPS simulados', min: 5, max: 144, step: 1, value: 60, onInput: setFps },
              { type: 'button', label: '30 FPS', onClick: () => { ui.set('fps', 30); setFps(30); } },
              { type: 'button', label: '144 FPS', onClick: () => { ui.set('fps', 144); setFps(144); } },
              { type: 'readout', id: 'r' },
            ]);
            report();
          },
        }),
        eq(`velocidad real = cambio por frame × frames por segundo\n0.01 × 60 = 0.6 rad/s     0.01 × 144 = 1.44 rad/s`),
        P('Con `+= 0.01` giras 0.01 radianes **por frame**, y los frames por segundo dependen del monitor: 60, 144, 30… Tu animación iría a velocidades distintas según quién la mire. La solución: pensar **por segundo**, no por frame.'),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué `mesh.rotation.y += 0.01` dentro del tick es mala idea?',
        options: [
          'Porque `+=` no funciona con rotaciones',
          'Porque la velocidad real depende de los FPS del ordenador que lo mire',
          'Porque 0.01 es demasiado pequeño',
        ],
        answer: 1,
        why: 'A 144 FPS gira más del doble de rápido que a 60. Hay que atar el movimiento al tiempo real, no al número de frames.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'El Clock: pensar en segundos',
      body: () => [
        codeBlock({
          title: 'script.js',
          code: `
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  mesh.rotation.y = elapsedTime * 1.2
  mesh.position.x = Math.cos(elapsedTime)
  mesh.position.y = Math.sin(elapsedTime)

  renderer.render(scene, camera)
  window.requestAnimationFrame(tick)
}

tick()`,
          notes: [
            ['new THREE.Clock()', 'El cronómetro, creado **fuera** del bucle, una sola vez.'],
            ['clock.getElapsedTime()', 'Segundos totales desde el arranque: un número que solo crece.'],
            ['mesh.rotation.y = elapsedTime * 1.2', 'Ojo: `=`, no `+=`. El ángulo **es** tiempo × velocidad (1.2 rad/s). A los 2 s vale 2.4, en cualquier ordenador.'],
            ['Math.cos(elapsedTime)', 'cos y sin oscilan entre −1 y 1; juntos dibujan un círculo.'],
          ],
        }),
        table(['Método', 'Devuelve', 'Cuándo'], [
          ['`getElapsedTime()`', 'Segundos **totales**', 'Posición según el tiempo: `sin(t)`, `t * velocidad`'],
          ['`getDelta()`', 'Segundos desde la **última llamada**', 'Sumar avances: `rotation.y += vel * delta`'],
        ]),
        callout('warn', 'No mezcles los dos', [
          P('`getElapsedTime()` llama por dentro a `getDelta()`: si usas ambos en el mismo bucle, el delta te saldrá casi siempre 0. Elige uno por proyecto.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: 'En `mesh.rotation.y = elapsedTime * 2`, ¿qué significa el 2?',
        options: ['2 frames', '2 radianes por segundo', '2 vueltas por frame'],
        answer: 1,
        why: 'Tiempo (segundos) × velocidad (rad/s) = ángulo (rad). Por eso la animación va igual en todos los ordenadores.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Seno y coseno: tus mejores amigos',
      body: () => [
        demo({
          title: 'Círculos y ondas con el tiempo',
          aspect: '16 / 8',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 0, 7], fov: 38, orbit: false });
            const { THREE, scene } = stage;
            scene.add(new THREE.AxesHelper(1.2));
            const dot = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffc857' }));
            scene.add(dot);
            const trail = [];
            const trailMat = new THREE.MeshBasicMaterial({ color: '#ffc857', transparent: true, opacity: 0.35 });
            for (let i = 0; i < 70; i++) {
              const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), trailMat);
              scene.add(p);
              trail.push(p);
            }
            const st = { speed: 1.5, ax: 1.8, ay: 1.8, mode: 'circulo' };
            const place = (obj, time) => {
              if (st.mode === 'circulo') obj.position.set(st.ax * Math.cos(time * st.speed), st.ay * Math.sin(time * st.speed), 0);
              else obj.position.set(((time * 0.9) % 6) - 3, st.ay * Math.sin(time * st.speed * 2), 0);
            };
            stage.onTick((dt, elapsed) => {
              place(dot, elapsed);
              trail.forEach((p, i) => place(p, elapsed - (i + 1) * 0.045));
            });
            panel([
              { type: 'select', id: 'mode', label: 'Movimiento', options: [['circulo', 'Círculo (cos y sin)'], ['onda', 'Onda (sin en y)']], value: 'circulo', onInput: (v) => { st.mode = v; } },
              { type: 'range', label: 'velocidad (multiplica al tiempo)', min: 0.2, max: 4, step: 0.1, value: 1.5, onInput: (v) => { st.speed = v; } },
              { type: 'range', label: 'amplitud x', min: 0.4, max: 2.6, step: 0.1, value: 1.8, onInput: (v) => { st.ax = v; } },
              { type: 'range', label: 'amplitud y', min: 0.4, max: 2.6, step: 0.1, value: 1.8, onInput: (v) => { st.ay = v; } },
            ]);
          },
        }),
        eq(`y = amplitud × sin(velocidad × t)\n\nmesh.position.y = 0.8 * Math.sin(2.0 * elapsedTime)`),
        P('`sin(t)` sube y baja suavemente entre −1 y 1. La **amplitud** (lo que multiplica al seno) decide cuánto; la **velocidad** (lo que multiplica al tiempo) decide cuán rápido. **Esto mismo usarás dentro de los shaders** con `sin(uTime)`.'),
      ],
      more: () => [
        callout('tip', 'Atajo: GSAP', [
          P('Para transiciones puntuales («mueve esto de aquí a allí en 1 segundo»), el curso usa **GSAP**: `gsap.to(mesh.position, { duration: 1, delay: 1, x: 2 })`. GSAP cuida el tiempo por ti. Regla práctica: `Clock` para movimientos continuos, GSAP para transiciones.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué dibuja la pareja `x = Math.cos(t)`, `y = Math.sin(t)` cuando t avanza?',
        options: ['Una línea recta', 'Un círculo', 'Una espiral'],
        answer: 1,
        why: '(cos t, sin t) recorre la circunferencia de radio 1; multiplicando por un radio, el círculo crece. Es la base de órbitas, péndulos y olas.',
      },
    },
  ];
}
