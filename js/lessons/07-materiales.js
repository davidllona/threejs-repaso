import { P, callout, codeBlock, liveCode, demo, table } from '../ui.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'El taller de materiales',
      body: () => [
        demo({
          title: 'Pruébalos todos',
          aspect: '16 / 10',
          caption: 'Haz esta prueba: `MeshStandardMaterial`, metalness 1, **sin** entorno → casi negro. Activa «Entorno» → refleja la habitación. Un espejo en la oscuridad no se ve.',
          setup({ makeStage, panel, side }) {
            const stage = makeStage({ pos: [2.2, 1.2, 3.2], fov: 45 });
            const { THREE, scene, renderer } = stage;
            const ambient = new THREE.AmbientLight('#fff', 0.15);
            const sun = new THREE.DirectionalLight('#fff', 2.6);
            sun.position.set(3, 3, 2);
            scene.add(ambient, sun);
            const pmrem = new THREE.PMREMGenerator(renderer);
            const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
            scene.environment = null;
            const geo = new THREE.TorusKnotGeometry(0.75, 0.28, 220, 32);
            const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
            scene.add(mesh);
            stage.onTick((dt) => { mesh.rotation.y += dt * 0.3; });
            const code = liveCode({ title: 'script.js', lang: 'js' });
            const s = { kind: 'MeshStandardMaterial', metal: 0, rough: 0.35, clear: 0, flat: false, side: 'FrontSide' };
            const build = () => {
              mesh.material?.dispose();
              const common = { color: '#f472b6', flatShading: s.flat, side: THREE[s.side] };
              let m; let lines = [];
              switch (s.kind) {
                case 'MeshBasicMaterial': m = new THREE.MeshBasicMaterial(common); break;
                case 'MeshNormalMaterial': m = new THREE.MeshNormalMaterial({ flatShading: s.flat, side: THREE[s.side] }); break;
                case 'MeshLambertMaterial': m = new THREE.MeshLambertMaterial(common); break;
                case 'MeshPhongMaterial': m = new THREE.MeshPhongMaterial({ ...common, shininess: 100, specular: '#ffffff' }); lines = ['shininess: 100,', "specular: '#ffffff',"]; break;
                case 'MeshToonMaterial': m = new THREE.MeshToonMaterial(common); break;
                case 'MeshPhysicalMaterial':
                  m = new THREE.MeshPhysicalMaterial({ ...common, metalness: s.metal, roughness: s.rough, clearcoat: s.clear, clearcoatRoughness: 0.05 });
                  lines = [`metalness: ${s.metal.toFixed(2)},`, `roughness: ${s.rough.toFixed(2)},`, `clearcoat: ${s.clear.toFixed(2)},`];
                  break;
                default:
                  m = new THREE.MeshStandardMaterial({ ...common, metalness: s.metal, roughness: s.rough });
                  lines = [`metalness: ${s.metal.toFixed(2)},`, `roughness: ${s.rough.toFixed(2)},`];
              }
              mesh.material = m;
              const props = s.kind === 'MeshNormalMaterial' ? [] : ["color: '#f472b6',"];
              const all = [...props, ...lines, ...(s.flat ? ['flatShading: true,'] : []), ...(s.side !== 'FrontSide' ? [`side: THREE.${s.side},`] : [])];
              code.set(`const material = new THREE.${s.kind}(${all.length ? '{\n  ' + all.join('\n  ') + '\n}' : ''})`);
            };
            panel([
              { type: 'select', label: 'Material', options: ['MeshBasicMaterial', 'MeshNormalMaterial', 'MeshLambertMaterial', 'MeshPhongMaterial', 'MeshToonMaterial', 'MeshStandardMaterial', 'MeshPhysicalMaterial'], value: s.kind, onInput: (v) => { s.kind = v; build(); } },
              { type: 'group', label: 'Solo Standard / Physical' },
              { type: 'range', label: 'metalness', min: 0, max: 1, step: 0.05, value: 0, onInput: (v) => { s.metal = v; build(); } },
              { type: 'range', label: 'roughness', min: 0, max: 1, step: 0.05, value: 0.35, onInput: (v) => { s.rough = v; build(); } },
              { type: 'range', label: 'clearcoat (solo Physical)', min: 0, max: 1, step: 0.05, value: 0, onInput: (v) => { s.clear = v; build(); } },
              { type: 'group', label: 'Escena' },
              { type: 'check', label: 'Luz (direccional + ambiente)', value: true, onInput: (v) => { sun.visible = v; ambient.visible = v; } },
              { type: 'check', label: 'Entorno (environment map)', value: false, onInput: (v) => { scene.environment = v ? envTex : null; } },
              { type: 'check', label: 'flatShading', value: false, onInput: (v) => { s.flat = v; build(); } },
            ]);
            side.append(code.el);
            const prevDispose = stage.dispose;
            stage.dispose = () => { pmrem.dispose(); envTex.dispose(); prevDispose(); };
          },
        }),
        P('Un material decide **de qué color se pinta cada píxel** de la superficie. Por dentro, cada material de Three.js es un **shader ya escrito** cuyas opciones activas con propiedades — y en *Modified materials* editarás justo ese shader.'),
      ],
      more: () => [
        table(['Material', 'Luz', 'Qué hace'], [
          ['`MeshBasicMaterial`', 'No', 'Color plano o textura. Fondos, UI, depuración. El más barato.'],
          ['`MeshNormalMaterial`', 'No', 'Colores arcoíris según la normal. Perfecto para ver la forma.'],
          ['`MeshMatcapMaterial`', 'No', 'Finge luz con una imagen de esfera iluminada. Barato y vistoso.'],
          ['`MeshDepthMaterial`', 'No', 'Pinta la distancia a la cámara. **El que usan las sombras por dentro.**'],
          ['`MeshLambertMaterial`', 'Sí', 'Luz difusa simple (mate). Barato.'],
          ['`MeshPhongMaterial`', 'Sí', 'Lambert + brillo especular.'],
          ['`MeshToonMaterial`', 'Sí', 'Dibujo animado: luz en bandas.'],
          ['`MeshStandardMaterial`', 'Sí', '**El estándar físico (PBR)**: metalness + roughness, todos los mapas.'],
          ['`MeshPhysicalMaterial`', 'Sí', 'Standard + clearcoat, sheen, transmission (cristal)… El más caro.'],
        ]),
      ],
      check: {
        type: 'mc',
        q: '`metalness: 1` sin luces ni entorno: el objeto sale casi negro. ¿Por qué?',
        options: [
          'Porque metalness 1 pinta de negro',
          'Porque un metal se ve por lo que **refleja**, y no hay nada que reflejar',
          'Porque falta `transparent: true`',
        ],
        answer: 1,
        why: 'Los metales casi no tienen color propio: son reflejo. Sin entorno ni luces, no hay nada que devolver al ojo. `scene.environment` les da un mundo que reflejar.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Las propiedades de siempre',
      body: () => [
        codeBlock({
          title: 'script.js',
          code: `
const material = new THREE.MeshStandardMaterial()
material.map = colorTexture
material.color = new THREE.Color('#ff0000')
material.opacity = 0.5
material.transparent = true
material.side = THREE.DoubleSide
material.metalness = 0.7
material.roughness = 0.2`,
          notes: [
            ['material.color = new THREE.Color', '`color` es un objeto `THREE.Color`, no un string. Después se cambia con `material.color.set(\'#ff0000\')`.'],
            ['material.opacity', 'De 0 a 1… pero **solo funciona con la línea siguiente**.'],
            ['material.transparent', 'Obligatorio para que `opacity` y `alphaMap` hagan algo (Three.js no mezcla con el fondo por defecto, por rendimiento).'],
            ['material.side', '`FrontSide` (defecto) pinta solo el exterior; `DoubleSide` ambas caras (cuesta el doble).'],
            ['material.metalness', '0 = plástico/madera, 1 = metal puro.'],
            ['material.roughness', '0 = espejo, 1 = totalmente mate.'],
          ],
        }),
      ],
      check: {
        type: 'fill',
        q: '`material.opacity = 0.3` no hace nada. Completa la línea que falta:',
        pre: 'material.', post: ' = true',
        answer: 'transparent',
        accept: ['transparent'],
        placeholder: 'propiedad',
        size: 14,
        why: 'Sin `transparent = true`, Three.js trata el material como opaco y `opacity` (y `alphaMap`) se ignoran.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Un mapa para cada propiedad',
      body: () => [
        P('El `MeshStandardMaterial` puede leer **una textura distinta por propiedad**, y así el material cambia punto a punto: la puerta del curso es madera mate con cerradura metálica gracias a su `metalnessMap`. Es el set PBR típico:'),
        table(['Propiedad', 'Qué hace el mapa'], [
          ['`map`', 'El color de cada punto.'],
          ['`alphaMap`', 'Blanco = visible, negro = transparente (con `transparent: true`).'],
          ['`metalnessMap` / `roughnessMap`', 'Qué zonas son metal y cuánto brillan.'],
          ['`normalMap`', 'Relieve fino **sin añadir vértices**: engaña a la luz cambiando la normal de cada píxel.'],
          ['`displacementMap`', 'Mueve vértices de verdad según la altura. Necesita muchos segmentos.'],
          ['`aoMap`', 'Sombra suave «pintada» en rendijas y esquinas (ambient occlusion).'],
        ]),
        callout('remember', 'Guárdate esto para el final', [
          P('Cuando un shader mueva los vértices (el twist), las **normales no se mueven solas**: la luz seguirá calculándose como si el objeto no se hubiera deformado, hasta que las gires tú. Es el paso 7 de *Modified materials*.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Qué mapa añade arañazos y relieve fino sin añadir ni un vértice?',
        options: ['`displacementMap`', '`normalMap`', '`aoMap`'],
        answer: 1,
        why: 'El `normalMap` cambia la normal por píxel y la luz «ve» relieve donde no lo hay. `displacementMap` sí mueve vértices (y los necesita a miles).',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'El entorno: luz de todas partes',
      body: () => [
        P('Un *environment map* (normalmente un HDRI de 360°) sirve a la vez de **fondo** y de **luz y reflejos** para Standard y Physical. Es lo que hace creíble un coche cromado. En proyectos reales se carga un `.hdr`:'),
        codeBlock({
          title: 'script.js',
          code: `
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

const rgbeLoader = new RGBELoader()
rgbeLoader.load('/environmentMaps/2k.hdr', (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping
  scene.background = environmentMap
  scene.environment = environmentMap
})`,
          notes: [
            ['RGBELoader', 'Carga `.hdr`: imágenes de alto rango dinámico, con luz «real» por encima del blanco.'],
            ['EquirectangularReflectionMapping', 'La imagen es un panorama aplastado (como un mapamundi): Three.js la envuelve en una esfera.'],
            ['scene.environment', 'Luz y reflejos para **todos** los materiales de la escena, sin tocarlos uno a uno.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '¿Qué diferencia hay entre `scene.background` y `scene.environment`?',
        options: [
          'Ninguna, son sinónimos',
          '`background` es el fondo visible; `environment` ilumina y se refleja en los materiales',
          '`environment` solo funciona con MeshBasicMaterial',
        ],
        answer: 1,
        why: 'Puedes usar la misma imagen para ambos, pero hacen cosas distintas: una se ve detrás, la otra alimenta la iluminación PBR.',
      },
    },
  ];
}
