import { P, H2, H3, callout, codeBlock, demo, table, quiz, eq } from '../ui.js';

export default function render(root) {
  root.append(
    P('Hasta ahora `renderer.render(scene, camera)` saca **una foto**. Para que algo se mueva hay que sacar muchas fotos seguidas, cada una con los objetos un poquito movidos: exactamente como un flipbook o una película de dibujos animados. A cada foto se le llama **frame**.'),

    H2('El bucle de animación (tick)'),
    P('El navegador nos da una función hecha para esto: `window.requestAnimationFrame(función)`. Significa «llama a esta función justo antes de pintar el siguiente frame de pantalla». Normalmente son 60 veces por segundo, pero en un monitor de 144 Hz serán 144, y en un móvil antiguo quizá 30.'),
    codeBlock({
      title: 'script.js',
      code: `
const tick = () => {
  // 1. actualizar objetos
  mesh.rotation.y += 0.01

  // 2. dibujar
  renderer.render(scene, camera)

  // 3. pedir el siguiente frame
  window.requestAnimationFrame(tick)
}

tick()`,
      notes: [
        ['const tick', 'Una función que se llamará una y otra vez. La llamamos `tick` por tradición («tic» de reloj).'],
        ['mesh.rotation.y += 0.01', 'Cada vez que se ejecuta, gira un poquito más. **Ojo con este número: es el origen del problema que viene ahora.**'],
        ['renderer.render', 'Saca la foto con el estado actual de la escena.'],
        ['window.requestAnimationFrame(tick)', 'Se pide a sí misma que se vuelva a ejecutar en el siguiente frame. Esto es lo que crea el bucle.'],
        ['tick()', 'Arranca el primer frame. Sin esta línea no pasa nada.'],
      ],
    }),

    H2('El problema: cada ordenador va a su ritmo'),
    P('Con `rotation.y += 0.01`, el cubo gira 0.01 radianes **por frame**. En un ordenador que va a 60 frames por segundo gira 0.6 rad/s. En uno que va a 144 gira 1.44 rad/s: más del doble de rápido. Y en uno que va a 30, la mitad. Tu animación dependería del ordenador de quien la mire.'),
    eq(`velocidad real = cambio por frame × frames por segundo\n0.01 × 60 = 0.6 rad/s     0.01 × 144 = 1.44 rad/s     0.01 × 30 = 0.3 rad/s`),
    P('La solución es dejar de pensar en «por frame» y pensar en «por segundo». Para eso necesitamos saber **cuánto tiempo ha pasado**. Compruébalo tú: baja los FPS simulados y compara los dos cubos.'),
    demo({
      title: 'Por frame contra por segundo',
      aspect: '16 / 8',
      caption: 'Los dos cubos empiezan igual a 60 FPS. Al bajar los FPS, el de la izquierda (cambio fijo por frame) se enlentece; el de la derecha (cambio × tiempo entre frames) mantiene su velocidad real.',
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
        const PER_FRAME = 0.04;           // radianes por frame (el enfoque «malo»)
        const PER_SECOND = PER_FRAME * 60; // radianes por segundo (lo que se ve a 60 FPS)
        stage.onTick((dt) => {
          acc += dt;
          const step = 1 / fps;
          if (acc < step) return; // simulamos un ordenador lento saltándonos frames
          const simDelta = acc;
          acc = 0;
          a.rotation.y += PER_FRAME;                  // ← depende del frame rate
          b.rotation.y += PER_SECOND * simDelta;      // ← depende del tiempo real
        });
        const report = () => ui.readout('r', `Cubo rojo  (+0.04 por frame):\n  ${(PER_FRAME * fps).toFixed(2)} rad/s\nCubo verde (× tiempo):\n  ${PER_SECOND.toFixed(2)} rad/s  ← siempre igual`);
        const setFps = (v) => { fps = v; if (ui) report(); };
        ui = panel([
          { type: 'range', id: 'fps', label: 'FPS simulados', min: 5, max: 144, step: 1, value: 60, onInput: setFps },
          { type: 'button', label: '30 FPS', onClick: () => { ui.set('fps', 30); setFps(30); } },
          { type: 'button', label: '60 FPS', onClick: () => { ui.set('fps', 60); setFps(60); } },
          { type: 'button', label: '144 FPS', onClick: () => { ui.set('fps', 144); setFps(144); } },
          { type: 'readout', id: 'r' },
        ]);
        report();
      },
    }),

    H2('La solución: medir el tiempo con Clock'),
    P('`THREE.Clock` es un cronómetro. Tiene dos usos principales y conviene no mezclarlos:'),
    table(['Método', 'Devuelve', 'Cuándo usarlo'], [
      ['`clock.getElapsedTime()`', 'Segundos **totales** desde que se creó el reloj', 'Cuando quieres una posición según el tiempo: `Math.sin(elapsedTime)`'],
      ['`clock.getDelta()`', 'Segundos desde la **última vez** que llamaste a `getDelta()`', 'Cuando quieres sumar un avance: `mesh.rotation.y += speed * delta`'],
    ]),
    callout('warn', 'No mezcles `getDelta()` con `getElapsedTime()`', [
      P('Los dos usan el mismo cronómetro interno. `getElapsedTime()` llama por dentro a `getDelta()`, así que si usas ambos en el mismo bucle los valores salen mal (el delta casi siempre te saldrá 0). Elige uno por proyecto.'),
    ]),
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
        ['new THREE.Clock()', 'Crea el cronómetro **fuera** del bucle (una sola vez). Empieza a contar en cuanto lo creas o en su primera lectura.'],
        ['clock.getElapsedTime()', 'Segundos que han pasado desde que empezó: 0, 0.016, 0.033… Es un número que solo crece.'],
        ['mesh.rotation.y = elapsedTime * 1.2', 'Fíjate: aquí usamos `=` y no `+=`. El ángulo **es** el tiempo por una velocidad (1.2 rad por segundo). Da igual cuántos frames haya: a los 2 segundos, el ángulo vale 2.4 siempre.'],
        ['Math.cos(elapsedTime)', 'Coseno y seno oscilan entre -1 y 1. Juntos, dibujan un círculo: x = cos(t), y = sin(t).'],
        ['window.requestAnimationFrame', 'Siguiente frame.'],
      ],
    }),

    H3('Seno y coseno: tus mejores amigos'),
    P('`Math.sin(t)` es una onda suave que sube y baja entre -1 y 1. Multiplicándola por un número cambias su amplitud (*cuánto* sube y baja); multiplicando el tiempo cambias su frecuencia (*cuán rápido*). **Esto mismo es lo que usarás dentro de los shaders** (`sin(uTime)`), así que merece la pena verlo ahora.'),
    eq(`y = amplitud × sin(velocidad × t)\n\nmesh.position.y = 0.8 * Math.sin(2.0 * elapsedTime)`),
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
        let t = 0;
        const place = (obj, time) => {
          if (st.mode === 'circulo') obj.position.set(st.ax * Math.cos(time * st.speed), st.ay * Math.sin(time * st.speed), 0);
          else obj.position.set(((time * 0.9) % 6) - 3 + 0 * time, st.ay * Math.sin(time * st.speed * 2), 0);
        };
        stage.onTick((dt, elapsed) => {
          t = elapsed;
          place(dot, t);
          trail.forEach((p, i) => place(p, t - (i + 1) * 0.045));
        });
        panel([
          { type: 'select', id: 'mode', label: 'Movimiento', options: [['circulo', 'Círculo (cos y sin)'], ['onda', 'Onda (sin en y)']], value: 'circulo', onInput: (v) => { st.mode = v; } },
          { type: 'range', label: 'velocidad (multiplica al tiempo)', min: 0.2, max: 4, step: 0.1, value: 1.5, onInput: (v) => { st.speed = v; } },
          { type: 'range', label: 'amplitud x', min: 0.4, max: 2.6, step: 0.1, value: 1.8, onInput: (v) => { st.ax = v; } },
          { type: 'range', label: 'amplitud y', min: 0.4, max: 2.6, step: 0.1, value: 1.8, onInput: (v) => { st.ay = v; } },
          { type: 'note', html: 'Círculo: `x = ampX · cos(vel·t)`, `y = ampY · sin(vel·t)`.<br>Onda: `y = ampY · sin(2·vel·t)` mientras x avanza.' },
        ]);
      },
    }),

    callout('tip', 'Atajo: GSAP', [
      P('El curso también usa la librería **GSAP** para animaciones puntuales («mueve esto de aquí a allí en 1 segundo»): `gsap.to(mesh.position, { duration: 1, delay: 1, x: 2 })`. Cuida el tiempo por ti. Piensa en `Clock` para movimientos continuos y en GSAP para transiciones puntuales.'),
    ]),

    quiz([
      {
        q: '¿Por qué `mesh.rotation.y += 0.01` es mala idea en el bucle?',
        options: ['Porque `+=` no funciona con rotaciones', 'Porque la velocidad real depende de los FPS del ordenador', 'Porque 0.01 es demasiado pequeño', 'Porque hay que usar grados'],
        answer: 1,
        why: 'Avanza 0.01 *por frame*. A 144 FPS gira más del doble de rápido que a 60. Con `elapsedTime` (o un delta) la velocidad se fija en unidades por segundo.',
      },
      {
        q: 'En `mesh.rotation.y = elapsedTime * 2`, ¿qué significa el 2?',
        options: ['2 frames', '2 grados', '2 radianes por segundo', '2 vueltas por frame'],
        answer: 2,
        why: 'Multiplicas el tiempo (en segundos) por una velocidad: radianes/segundo × segundos = radianes.',
      },
      {
        q: '¿Qué dibuja la pareja `x = Math.cos(t)` e `y = Math.sin(t)`?',
        options: ['Una línea recta', 'Un círculo', 'Una espiral', 'Un cuadrado'],
        answer: 1,
        why: 'Cuando t avanza, (cos t, sin t) recorre la circunferencia de radio 1. Multiplicando ambos por un radio mayor, el círculo crece.',
      },
    ]),
  );
}
