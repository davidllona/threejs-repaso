import { P, callout, codeBlock, liveCode, demo, table, eq } from '../ui.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

const COLORS = [['#ffffff', 'Blanca'], ['#ffd9a8', 'Cálida'], ['#a8d4ff', 'Fría'], ['#f472b6', 'Rosa'], ['#a493ff', 'Violeta']];

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Las seis luces, una a una',
      body: () => [
        demo({
          title: 'Una luz cada vez',
          aspect: '16 / 10',
          caption: 'Cambia de tipo y mueve la luz. **Ambient** deja todo plano; **Directional** da un lado claro y otro oscuro; **Spot** dibuja un círculo. El helper enseña dónde está y a dónde apunta.',
          setup({ makeStage, panel, side }) {
            RectAreaLightUniformsLib.init();
            const stage = makeStage({ pos: [4.2, 3.2, 5.2], target: [0, 0.4, 0], fov: 45 });
            const { THREE, scene } = stage;
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: '#8d93a6', roughness: 0.8 }));
            floor.rotation.x = -Math.PI / 2;
            scene.add(floor);
            const std = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 });
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.7, 48, 32), std('#f472b6'));
            sphere.position.set(-1.4, 0.7, 0);
            const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), std('#4cc9e0'));
            box.position.set(1.2, 0.6, 0.3);
            const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.35, 0.12, 100, 16), std('#ffc857'));
            knot.position.set(0, 0.55, 1.6);
            scene.add(sphere, box, knot);
            const st = { kind: 'Directional', intensity: 3, color: '#ffffff', x: 3, y: 4, z: 2, angle: 30, penumbra: 0.3, distance: 0, helper: true };
            const DEF = {
              Ambient: { i: 1, min: 0, max: 3 },
              Hemisphere: { i: 1.6, min: 0, max: 4 },
              Directional: { i: 3, min: 0, max: 8 },
              Point: { i: 60, min: 0, max: 300 },
              Spot: { i: 220, min: 0, max: 800 },
              RectArea: { i: 6, min: 0, max: 30 },
            };
            let light = null;
            let helper = null;
            const code = liveCode({ title: 'script.js', lang: 'js' });
            let ui;
            const f = (n, d = 1) => Number(n).toFixed(d);
            const build = () => {
              if (light) { scene.remove(light); light.dispose?.(); }
              if (helper) { scene.remove(helper); helper.dispose?.(); helper = null; }
              const c = st.color;
              let txt = '';
              switch (st.kind) {
                case 'Ambient':
                  light = new THREE.AmbientLight(c, st.intensity);
                  txt = `const light = new THREE.AmbientLight('${c}', ${f(st.intensity, 2)})`;
                  break;
                case 'Hemisphere':
                  light = new THREE.HemisphereLight('#7cc7ff', '#ff9a5a', st.intensity);
                  light.position.set(0, 3, 0);
                  txt = `const light = new THREE.HemisphereLight(\n  '#7cc7ff', // cielo\n  '#ff9a5a', // suelo\n  ${f(st.intensity, 2)}\n)`;
                  break;
                case 'Directional':
                  light = new THREE.DirectionalLight(c, st.intensity);
                  light.position.set(st.x, st.y, st.z);
                  txt = `const light = new THREE.DirectionalLight('${c}', ${f(st.intensity, 2)})\nlight.position.set(${f(st.x)}, ${f(st.y)}, ${f(st.z)})`;
                  break;
                case 'Point':
                  light = new THREE.PointLight(c, st.intensity, st.distance, 2);
                  light.position.set(st.x, st.y, st.z);
                  txt = `const light = new THREE.PointLight('${c}', ${f(st.intensity, 0)}, ${f(st.distance, 0)}, 2)\nlight.position.set(${f(st.x)}, ${f(st.y)}, ${f(st.z)})`;
                  break;
                case 'Spot':
                  light = new THREE.SpotLight(c, st.intensity, st.distance, THREE.MathUtils.degToRad(st.angle), st.penumbra, 2);
                  light.position.set(st.x, st.y, st.z);
                  txt = `const light = new THREE.SpotLight(\n  '${c}', ${f(st.intensity, 0)}, ${f(st.distance, 0)},\n  ${f(THREE.MathUtils.degToRad(st.angle), 2)},  // angle (rad)\n  ${f(st.penumbra, 2)},  // penumbra\n  2      // decay\n)\nlight.position.set(${f(st.x)}, ${f(st.y)}, ${f(st.z)})`;
                  break;
                default:
                  light = new THREE.RectAreaLight(c, st.intensity, 3, 2);
                  light.position.set(st.x, st.y, st.z);
                  light.lookAt(0, 0, 0);
                  txt = `const light = new THREE.RectAreaLight('${c}', ${f(st.intensity, 1)}, 3, 2)\nlight.position.set(${f(st.x)}, ${f(st.y)}, ${f(st.z)})\nlight.lookAt(0, 0, 0) // se apunta a mano`;
              }
              scene.add(light);
              if (st.helper) {
                if (st.kind === 'Directional') helper = new THREE.DirectionalLightHelper(light, 0.7);
                else if (st.kind === 'Point') helper = new THREE.PointLightHelper(light, 0.18);
                else if (st.kind === 'Spot') helper = new THREE.SpotLightHelper(light);
                else if (st.kind === 'Hemisphere') helper = new THREE.HemisphereLightHelper(light, 0.6);
                else if (st.kind === 'RectArea') helper = new RectAreaLightHelper(light);
                if (helper) scene.add(helper);
              }
              code.set(`${txt}\nscene.add(light)`);
            };
            stage.onTick(() => { if (helper?.update && st.kind !== 'RectArea') helper.update(); });
            const resetFor = (kind) => {
              const d = DEF[kind];
              const r = ui.refs.intensity;
              r.input.min = d.min; r.input.max = d.max; r.input.step = d.max > 20 ? 1 : 0.05;
              st.intensity = d.i; r.set(d.i);
              if (kind === 'Point') { st.x = 1.8; st.y = 2.2; st.z = 1.5; }
              else if (kind === 'Spot') { st.x = 2; st.y = 4.5; st.z = 2; }
              else if (kind === 'RectArea') { st.x = 2.5; st.y = 3; st.z = 3; }
              else { st.x = 3; st.y = 4; st.z = 2; }
              ui.set('x', st.x); ui.set('y', st.y); ui.set('z', st.z);
            };
            ui = panel([
              { type: 'select', id: 'kind', label: 'Tipo de luz', options: Object.keys(DEF), value: st.kind, onInput: (v) => { st.kind = v; if (ui) { resetFor(v); build(); } } },
              { type: 'range', id: 'intensity', label: 'intensity', min: 0, max: 8, step: 0.05, value: 3, onInput: (v) => { st.intensity = v; if (ui) build(); } },
              { type: 'select', id: 'color', label: 'color', options: COLORS, value: '#ffffff', onInput: (v) => { st.color = v; if (ui) build(); } },
              { type: 'group', label: 'position (no afecta a Ambient)' },
              { type: 'range', id: 'x', label: 'x', min: -5, max: 5, step: 0.1, value: st.x, onInput: (v) => { st.x = v; if (ui) build(); } },
              { type: 'range', id: 'y', label: 'y', min: 0.5, max: 6, step: 0.1, value: st.y, onInput: (v) => { st.y = v; if (ui) build(); } },
              { type: 'range', id: 'z', label: 'z', min: -5, max: 5, step: 0.1, value: st.z, onInput: (v) => { st.z = v; if (ui) build(); } },
              { type: 'group', label: 'Solo Spot' },
              { type: 'range', id: 'angle', label: 'angle (grados)', min: 5, max: 80, step: 1, value: st.angle, onInput: (v) => { st.angle = v; if (ui) build(); } },
              { type: 'range', id: 'pen', label: 'penumbra (borde suave)', min: 0, max: 1, step: 0.05, value: st.penumbra, onInput: (v) => { st.penumbra = v; if (ui) build(); } },
              { type: 'check', id: 'helper', label: 'Mostrar helper', value: true, onInput: (v) => { st.helper = v; if (ui) build(); } },
            ], { initial: false });
            side.append(code.el);
            resetFor('Directional');
            build();
          },
        }),
        table(['Luz', 'Se parece a…', 'Sombras'], [
          ['`AmbientLight`', 'La luz rebotada de una habitación: todo igual', 'No'],
          ['`HemisphereLight`', 'Cielo arriba, suelo abajo (dos colores)', 'No'],
          ['`DirectionalLight`', 'El **sol**: rayos paralelos', 'Sí'],
          ['`PointLight`', 'Una **bombilla** desnuda', 'Sí'],
          ['`SpotLight`', 'Una **linterna**: cono de luz', 'Sí'],
          ['`RectAreaLight`', 'Una **ventana** / softbox (solo Standard/Physical)', 'No'],
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué luz usarías para simular el sol?',
        options: ['AmbientLight', 'DirectionalLight', 'PointLight'],
        answer: 1,
        why: 'Los rayos del sol llegan prácticamente paralelos: eso es exactamente `DirectionalLight` (y además proyecta sombras).',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Cómo calcula la luz el brillo',
      body: () => [
        eq(`brillo ≈ intensidad × cos(ángulo entre la normal y la luz)\n\nde frente a la luz → cos(0°)  = 1.0  (máximo)\nluz de lado        → cos(60°) = 0.5  (la mitad)\nde espaldas        → cos(90°) = 0    (oscuro)`),
        P('Los materiales con luz calculan el color de **cada punto** mirando cuánta luz llega y con qué ángulo — y ese ángulo lo da la **normal**. Por eso, cuando el twist deforme la superficie sin girar las normales, la iluminación saldrá «congelada»: la fórmula seguirá usando los ángulos antiguos.'),
        callout('warn', 'Las luces cuestan', [
          P('Cada luz añade cálculo a **cada píxel de cada objeto**. Con 3–4 va bien; con 30 se derrite el móvil. Combo barato: ambient + hemisphere + una directional. Para escenas complejas, la luz se **hornea** (*bake*) en texturas desde Blender y no hace falta ninguna luz real.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Un punto cuya normal apunta 90° respecto a la dirección de la luz se ve…',
        options: ['A máximo brillo', 'A medio brillo', 'Oscuro: cos(90°) = 0'],
        answer: 2,
        why: 'El brillo difuso sigue el coseno del ángulo. Perpendicular a la luz = nada de luz directa (solo lo que aporte la ambiente).',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'El código de las más usadas',
      body: () => [
        codeBlock({
          title: 'script.js',
          code: `
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
directionalLight.position.set(3, 4, 2)
scene.add(directionalLight)

const pointLight = new THREE.PointLight(0xff9000, 30, 10, 2)
pointLight.position.set(1, -0.5, 1)
scene.add(pointLight)

const spotLight = new THREE.SpotLight(0x78ff00, 100, 10, Math.PI * 0.1, 0.25, 1)
spotLight.position.set(0, 2, 3)
spotLight.target.position.x = -0.75
scene.add(spotLight)
scene.add(spotLight.target)`,
          notes: [
            ['new THREE.AmbientLight', 'Sin posición ni sombras; evita que las zonas en sombra queden negras del todo.'],
            ['directionalLight.position.set', 'La posición decide **de dónde viene**; siempre apunta a su `target` (el origen por defecto).'],
            ['new THREE.PointLight(0xff9000, 30, 10, 2)', 'Color, intensidad, **distance** (donde la luz llega a 0) y **decay** (cómo se debilita).'],
            ['new THREE.SpotLight', 'Color, intensidad, distance, **angle** del cono (radianes), **penumbra** (borde suave) y decay.'],
            ['scene.add(spotLight.target)', '**El olvido clásico**: si mueves el target y no está en la escena, su posición no se actualiza y el foco sigue apuntando al origen.'],
          ],
        }),
        P('Dato de versiones recientes: las luces usan **unidades físicas**. Una PointLight con `intensity = 1` apenas se nota, porque con `decay = 2` su luz se debilita con el cuadrado de la distancia — a 3 unidades vale 1/9. De ahí los valores tipo 30 o 100.'),
      ],
      more: () => [
        callout('tip', 'RectAreaLight, la quisquillosa', [
          P('Necesita importar e inicializar `RectAreaLightUniformsLib.init()` antes de crear materiales, se apunta a mano con `light.lookAt(...)` (no tiene target), solo afecta a Standard/Physical y no proyecta sombras. Y los *helpers* (`DirectionalLightHelper`, `SpotLightHelper`…) son tu brújula mientras colocas luces: ponlos, ajusta, quítalos.'),
        ]),
      ],
      check: {
        type: 'fill',
        q: 'Mueves `spotLight.target.position.x` y el foco sigue apuntando al origen. Completa lo que falta:',
        pre: 'scene.add(', post: ')',
        answer: 'spotLight.target',
        accept: ['spotLight.target'],
        placeholder: 'objeto',
        size: 18,
        why: 'El target es un Object3D normal: si no está en la escena, su matriz no se actualiza y la luz no se entera del cambio.',
      },
    },
  ];
}
