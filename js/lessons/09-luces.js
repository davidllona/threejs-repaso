import { P, H2, H3, UL, callout, codeBlock, liveCode, demo, table, quiz, eq } from '../ui.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';

const COLORS = [['#ffffff', 'Blanca'], ['#ffd9a8', 'Cálida'], ['#a8d4ff', 'Fría'], ['#f472b6', 'Rosa'], ['#a493ff', 'Violeta']];

export default function render(root) {
  root.append(
    P('Una luz es un objeto más que añades a la escena (`scene.add(light)`). Los materiales «con luz» (`Lambert`, `Phong`, `Standard`…) calculan su color en cada punto mirando **cuánta luz llega a esa superficie y con qué ángulo**. Y ese ángulo es justo para lo que sirven las normales de la geometría.'),
    eq(`brillo de un punto  ≈  intensidad de la luz × cos(ángulo entre la normal y la dirección a la luz)\n\nmirando de frente a la luz → cos(0°)  = 1.0   (máximo brillo)\ncon la luz de lado        → cos(60°) = 0.5   (la mitad)\ncon la luz de espaldas    → cos(90°) = 0     (oscuro)`),

    H2('Los seis tipos de luz'),
    table(['Luz', 'Se parece a…', 'Sombras', 'Coste'], [
      ['`AmbientLight`', 'La luz que rebota por todas partes en una habitación. Sin dirección: ilumina todo igual.', 'No', 'Mínimo'],
      ['`HemisphereLight`', 'Cielo arriba (un color) y suelo abajo (otro color). Da un ambiente exterior natural.', 'No', 'Mínimo'],
      ['`DirectionalLight`', 'El **sol**: rayos paralelos desde una dirección.', 'Sí', 'Moderado'],
      ['`PointLight`', 'Una **bombilla** desnuda: irradia en todas direcciones desde un punto.', 'Sí', 'Moderado'],
      ['`SpotLight`', 'Una **linterna** o foco: un cono de luz.', 'Sí', 'Alto'],
      ['`RectAreaLight`', 'Una **ventana** o softbox de fotógrafo: un rectángulo que emite luz. Solo funciona con Standard/Physical.', 'No', 'Alto'],
    ]),
    callout('warn', 'Las luces cuestan', [
      P('Cada luz añade cálculos **a cada píxel de cada objeto**. Con 3-4 luces va bien; con 30, tu móvil se derrite. Por eso se usan las baratas (ambient + hemisphere + una directional) y se evita llenar la escena de point lights. La alternativa es **hornear la luz** (*bake*): calcularla en Blender y guardarla en una textura, de modo que el material solo pinta una imagen (y se ve sin ninguna luz).'),
    ]),

    H2('Pruébalas una a una'),
    P('Cambia de tipo y mueve la luz. Observa cómo cambia el reparto: una **Ambient** deja todo plano (sin volumen), una **Directional** da un lado claro y otro oscuro, un **Spot** dibuja un círculo en el suelo. Activa «Mostrar helper» para ver dónde está y hacia dónde apunta.'),
    demo({
      title: 'Una luz cada vez',
      aspect: '16 / 10',
      setup({ makeStage, panel, side }) {
        RectAreaLightUniformsLib.init();
        const stage = makeStage({ pos: [4.2, 3.2, 5.2], target: [0, 0.4, 0], fov: 45 });
        const { THREE, scene } = stage;

        // Escena de prueba
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
              txt = `const light = new THREE.HemisphereLight(\n  '#7cc7ff', // color del cielo\n  '#ff9a5a', // color del suelo\n  ${f(st.intensity, 2)}\n)`;
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
              txt = `const light = new THREE.SpotLight(\n  '${c}',        // color\n  ${f(st.intensity, 0)},          // intensidad\n  ${f(st.distance, 0)},            // distance (0 = infinita)\n  ${f(THREE.MathUtils.degToRad(st.angle), 2)},          // angle (radianes)\n  ${f(st.penumbra, 2)},          // penumbra\n  2                // decay\n)\nlight.position.set(${f(st.x)}, ${f(st.y)}, ${f(st.z)})\n// apunta a light.target (por defecto el origen)`;
              break;
            default:
              light = new THREE.RectAreaLight(c, st.intensity, 3, 2);
              light.position.set(st.x, st.y, st.z);
              light.lookAt(0, 0, 0);
              txt = `const light = new THREE.RectAreaLight('${c}', ${f(st.intensity, 1)}, 3, 2) // ancho 3, alto 2\nlight.position.set(${f(st.x)}, ${f(st.y)}, ${f(st.z)})\nlight.lookAt(0, 0, 0) // hay que apuntarla a mano`;
          }
          scene.add(light);
          if (st.helper) {
            if (st.kind === 'Directional') helper = new THREE.DirectionalLightHelper(light, 0.7);
            else if (st.kind === 'Point') helper = new THREE.PointLightHelper(light, 0.18);
            else if (st.kind === 'Spot') helper = new THREE.SpotLightHelper(light);
            else if (st.kind === 'Hemisphere') helper = new THREE.HemisphereLightHelper(light, 0.6);
            else if (st.kind === 'RectArea') { helper = new RectAreaLightHelper(light); }
            if (helper) scene.add(helper);
          }
          code.set(`${txt}\nscene.add(light)`);
        };

        stage.onTick(() => {
          if (helper?.update && st.kind !== 'RectArea') helper.update();
        });

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
          { type: 'group', label: 'Point y Spot' },
          { type: 'range', id: 'dist', label: 'distance (0 = sin límite)', min: 0, max: 12, step: 0.5, value: 0, onInput: (v) => { st.distance = v; if (ui) build(); } },
          { type: 'check', id: 'helper', label: 'Mostrar helper', value: true, onInput: (v) => { st.helper = v; if (ui) build(); } },
        ], { initial: false });
        side.append(code.el);
        resetFor('Directional');
        build();
      },
      caption: 'En las versiones recientes de Three.js las luces usan **unidades físicas**: una `PointLight` o `SpotLight` necesita intensidades grandes (decenas o cientos) porque su luz se debilita con el **cuadrado de la distancia** (`decay = 2`). Si pones `intensity = 1` en una PointLight a 3 metros, apenas se nota.',
    }),

    H2('Código de las luces más usadas'),
    codeBlock({
      title: 'script.js',
      code: `
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5)
directionalLight.position.set(3, 4, 2)
scene.add(directionalLight)

const hemisphereLight = new THREE.HemisphereLight(0xaaccff, 0x886644, 0.8)
scene.add(hemisphereLight)

const pointLight = new THREE.PointLight(0xff9000, 30, 10, 2)
pointLight.position.set(1, -0.5, 1)
scene.add(pointLight)

const spotLight = new THREE.SpotLight(0x78ff00, 100, 10, Math.PI * 0.1, 0.25, 1)
spotLight.position.set(0, 2, 3)
spotLight.target.position.x = -0.75
scene.add(spotLight)
scene.add(spotLight.target)

const helper = new THREE.DirectionalLightHelper(directionalLight, 0.5)
scene.add(helper)`,
      notes: [
        ['new THREE.AmbientLight', 'Color + intensidad. No tiene posición, no genera sombras. Sirve para que las zonas en sombra no queden totalmente negras.'],
        ['new THREE.DirectionalLight', 'Como el sol. `position` decide **de dónde viene** la luz: apunta siempre hacia su `target`, que por defecto es el origen (0,0,0).'],
        ['new THREE.HemisphereLight', 'Color del cielo, color del suelo e intensidad. Los puntos que miran hacia arriba reciben el primero y los que miran hacia abajo el segundo.'],
        ['new THREE.PointLight(0xff9000, 30, 10, 2)', 'Color, intensidad, **distance** (a partir de ahí la luz vale 0) y **decay** (cuánto se debilita con la distancia).'],
        ['new THREE.SpotLight', 'Color, intensidad, distancia, **ángulo** del cono (en radianes), **penumbra** (0 = borde duro, 1 = muy suave) y decay.'],
        ['spotLight.target.position.x', 'Un Spot apunta a su `target`. Si lo mueves, **debes añadir el target a la escena** (la siguiente línea) o no se actualiza su posición.'],
        ['scene.add(spotLight.target)', 'Sin esto, mover el target no tiene efecto.'],
        ['DirectionalLightHelper', 'Los *helpers* dibujan una guía visual de la luz (una caja, un cono…). Imprescindibles para saber dónde apunta y qué alcance tiene. Se quitan al terminar.'],
      ],
    }),
    callout('tip', 'RectAreaLight, la que más cuesta de recordar', [
      P('Necesita dos cosas extra: importar `RectAreaLightUniformsLib` y llamar a `RectAreaLightUniformsLib.init()` **antes** de crear materiales, y apuntarla con `light.lookAt(...)` a mano (no tiene `target`). Solo afecta a `MeshStandardMaterial` y `MeshPhysicalMaterial`, y no puede proyectar sombras.'),
    ]),

    quiz([
      {
        q: '¿Qué luz usarías para simular el sol?',
        options: ['AmbientLight', 'PointLight', 'DirectionalLight', 'RectAreaLight'],
        answer: 2,
        why: 'Los rayos del sol llegan prácticamente paralelos. `DirectionalLight` hace justo eso y además admite sombras.',
      },
      {
        q: 'Pones una `PointLight` con `intensity = 1` en una escena y apenas se nota. ¿Por qué?',
        options: ['Las PointLight no iluminan', 'En unidades físicas su luz decae con el cuadrado de la distancia: necesita intensidades mucho mayores', 'Falta una AmbientLight', 'La cámara está mal'],
        answer: 1,
        why: 'Con `decay = 2`, la luz a 3 unidades vale 1/9. Por eso se usan valores como 30 o 100.',
      },
      {
        q: 'Mueves `spotLight.target.position` pero la luz no apunta donde esperabas. ¿Qué falta?',
        options: ['`scene.add(spotLight.target)`', '`spotLight.angle = 0`', '`renderer.shadowMap.enabled = true`', 'Cambiar el color'],
        answer: 0,
        why: 'El target es un Object3D como cualquier otro; si no está en la escena, no se actualiza su matriz y la luz sigue apuntando al origen.',
      },
      {
        q: '¿Cuál de estas luces NO puede generar sombras?',
        options: ['DirectionalLight', 'SpotLight', 'PointLight', 'HemisphereLight'],
        answer: 3,
        why: 'Solo Directional, Spot y Point proyectan sombras. Ambient, Hemisphere y RectArea no.',
      },
    ]),
  );
}
