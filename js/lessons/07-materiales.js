import { P, H2, H3, UL, callout, codeBlock, liveCode, demo, table, quiz, eq } from '../ui.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export default function render(root) {
  root.append(
    P('Si la geometría es la forma, el **material** es lo que decide **de qué color se pinta cada píxel** de esa forma. Dicho de otra manera: un material es una *receta* que se aplica en cada punto de la superficie, usando datos como el color base, la textura, la luz que llega, la posición de la cámara…'),
    callout('idea', 'Lo que hay detrás de cada material', [
      P('Cada material de Three.js es, por dentro, **un shader** (un programa de GPU) que alguien ya escribió por ti, con muchas opciones que activas con propiedades (`color`, `map`, `roughness`…). Cuando en el capítulo 4 retoques un `MeshStandardMaterial` con `onBeforeCompile`, lo que harás es editar el texto de ese shader. Esta lección sirve para saber qué hay en la caja de herramientas.'),
    ]),

    H2('Los materiales, de baratos a caros'),
    table(['Material', 'Necesita luz', 'Qué hace', 'Coste'], [
      ['`MeshBasicMaterial`', 'No', 'Color plano o textura. Ignora toda iluminación. Ideal para fondos, UI 3D, depuración.', 'Mínimo'],
      ['`MeshNormalMaterial`', 'No', 'Pinta cada punto según hacia dónde mira su normal (de ahí los colores arcoíris). Muy útil para ver la forma.', 'Mínimo'],
      ['`MeshMatcapMaterial`', 'No', 'Usa una imagen de una esfera iluminada («matcap») para fingir luz y volumen. Muy barato y vistoso.', 'Mínimo'],
      ['`MeshDepthMaterial`', 'No', 'Pinta la distancia a la cámara (blanco = cerca, negro = lejos). **Es el que usan las sombras por dentro.**', 'Mínimo'],
      ['`MeshLambertMaterial`', 'Sí', 'Luz difusa simple (superficies mate). Barato.', 'Bajo'],
      ['`MeshPhongMaterial`', 'Sí', 'Como Lambert, más un brillo especular (reflejo puntual). Menos realista que Standard.', 'Medio'],
      ['`MeshToonMaterial`', 'Sí', 'Estilo dibujo animado: la luz se reparte en bandas.', 'Medio'],
      ['`MeshStandardMaterial`', 'Sí', '**El estándar físico (PBR)**: `metalness` + `roughness`. Admite todos los mapas. Es el más usado.', 'Alto'],
      ['`MeshPhysicalMaterial`', 'Sí', 'Standard + extras: clearcoat (barniz), sheen (tela), transmission (cristal), iridescence…', 'El más alto'],
    ]),

    H2('Pruébalos'),
    P('Cambia de material y mira qué cambia en el código. Con **«Luz»** apagada comprobarás qué materiales dependen de ella. En `Standard` y `Physical`, un metal sin **entorno** sale casi negro: un metal solo se ve metálico porque *refleja* lo que tiene alrededor. Activa «Entorno» para darle algo que reflejar.'),
    demo({
      title: 'Taller de materiales',
      aspect: '16 / 10',
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
              lines = [`metalness: ${s.metal.toFixed(2)},`, `roughness: ${s.rough.toFixed(2)},`, `clearcoat: ${s.clear.toFixed(2)},`, 'clearcoatRoughness: 0.05,'];
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
          { type: 'group', label: 'Propiedades comunes' },
          { type: 'check', label: 'flatShading (caras facetadas)', value: false, onInput: (v) => { s.flat = v; build(); } },
          { type: 'select', label: 'side', options: ['FrontSide', 'BackSide', 'DoubleSide'], value: 'FrontSide', onInput: (v) => { s.side = v; build(); } },
          { type: 'group', label: 'Escena' },
          { type: 'check', label: 'Luz (direccional + ambiente)', value: true, onInput: (v) => { sun.visible = v; ambient.visible = v; } },
          { type: 'check', label: 'Entorno (environment map)', value: false, onInput: (v) => { scene.environment = v ? envTex : null; } },
        ]);
        side.append(code.el);
        const prevDispose = stage.dispose;
        stage.dispose = () => { pmrem.dispose(); envTex.dispose(); prevDispose(); };
      },
      caption: 'Prueba esto: `MeshStandardMaterial`, metalness 1, **sin** entorno → casi negro. Activa «Entorno» → refleja la habitación virtual. Es el mismo fenómeno que en la vida real: un espejo en la oscuridad no se ve.',
    }),

    H2('Propiedades que usarás todo el rato'),
    codeBlock({
      title: 'script.js',
      code: `
const material = new THREE.MeshStandardMaterial()
material.map = colorTexture
material.color = new THREE.Color('#ff0000')
material.wireframe = true
material.opacity = 0.5
material.transparent = true
material.alphaMap = alphaTexture
material.side = THREE.DoubleSide
material.metalness = 0.7
material.roughness = 0.2`,
      notes: [
        ['new THREE.MeshStandardMaterial()', 'Se puede crear sin argumentos y luego rellenar propiedades, o pasar un objeto con todo al constructor. Es lo mismo.'],
        ['material.map', 'La textura de color. Se combina (multiplica) con `color`.'],
        ['material.color = new THREE.Color', '**Ojo:** `color` es un objeto `THREE.Color`, no un string. Para cambiarlo después: `material.color.set(\'#ff0000\')`. Acepta `\'#ff0000\'`, `0xff0000`, `\'red\'`, `\'rgb(255,0,0)\'`…'],
        ['material.wireframe', 'Muestra solo las aristas de los triángulos.'],
        ['material.opacity', 'Transparencia de 0 a 1... pero **solo funciona si activas la siguiente línea**.'],
        ['material.transparent', 'Obligatorio para que `opacity` y `alphaMap` hagan algo.'],
        ['material.alphaMap', 'Una imagen en blanco y negro que decide qué zonas son visibles (blanco) y cuáles transparentes (negro).'],
        ['material.side', 'Por defecto solo se pintan las caras del exterior. `DoubleSide` pinta ambas (cuesta el doble). `BackSide` pinta solo las de dentro.'],
        ['material.metalness', 'De 0 (no metal, plástico, madera…) a 1 (metal puro).'],
        ['material.roughness', 'De 0 (espejo perfecto) a 1 (totalmente mate).'],
      ],
    }),

    H3('Los otros mapas de MeshStandardMaterial'),
    P('El `MeshStandardMaterial` puede leer **una textura distinta para cada propiedad**, así el material cambia de punto a punto. Por ejemplo: una puerta de madera con un marco metálico y cristal tiene `metalness` alto en el marco y bajo en la madera. Es lo que se llama un set de texturas PBR.'),
    table(['Propiedad', 'Qué hace el mapa'], [
      ['`map`', 'El color de cada punto.'],
      ['`alphaMap`', 'Qué zonas son transparentes (con `transparent = true`).'],
      ['`metalnessMap` / `roughnessMap`', 'Qué zonas son metal y cuánto brillan, punto a punto.'],
      ['`normalMap`', 'Simula relieve fino (arañazos, ladrillos) **sin añadir vértices**: engaña a la luz cambiando la normal de cada píxel. Barato y muy efectivo.'],
      ['`displacementMap` + `displacementScale`', 'Mueve de verdad los vértices según la altura. Necesita **muchos vértices** (segmentos) para verse bien.'],
      ['`aoMap` (+ `aoMapIntensity`)', 'Sombras suaves «pintadas» en las rendijas y esquinas (ambient occlusion).'],
    ]),
    callout('remember', 'Cuidado con las normales', [
      P('Cuando un shader mueve los vértices (como en el twist de la lección final), las **normales no se mueven solas**: hay que girarlas a mano. Si no, la luz se calcula como si el objeto siguiera sin deformar. Lo verás en el último laboratorio.'),
    ]),

    H2('Entorno: la luz que viene de «todas partes»'),
    P('Un *environment map* es una imagen (normalmente un HDRI de 360°) que se usa a la vez como **fondo** y como **fuente de luz y reflejos** para materiales como Standard y Physical. Es lo que hace que un coche cromado se vea realista. En esta página se usa un entorno generado por código (`RoomEnvironment`); en proyectos reales cargas un `.hdr` con `RGBELoader`:'),
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
        ['import { RGBELoader }', 'El cargador de imágenes `.hdr` (alto rango dinámico: guardan luz real, con valores muy por encima del blanco).'],
        ['new RGBELoader()', 'Creamos el cargador.'],
        ['rgbeLoader.load', 'Carga la imagen y, cuando está lista, ejecuta la función con el resultado.'],
        ['EquirectangularReflectionMapping', 'Le dice a Three.js que la imagen es un panorama 360° «aplastado» (como un mapamundi) y que debe envolverla en una esfera.'],
        ['scene.background', 'La usa como fondo visible.'],
        ['scene.environment', 'La usa como luz y reflejo para **todos** los materiales de la escena (no hace falta ponerla material por material).'],
      ],
    }),

    quiz([
      {
        q: 'Tienes una escena sin luces y usas `MeshStandardMaterial`. ¿Qué verás?',
        options: ['El color normal', 'Negro (sin luz no hay nada que calcular)', 'Un error', 'Un wireframe'],
        answer: 1,
        why: 'Los materiales que usan luz (`Lambert`, `Phong`, `Toon`, `Standard`, `Physical`) calculan su color a partir de ella. `MeshBasicMaterial` sí se ve sin luz.',
      },
      {
        q: 'Pones `material.opacity = 0.3` pero el objeto sigue opaco. ¿Qué falta?',
        options: ['`material.transparent = true`', '`material.wireframe = true`', '`material.side = DoubleSide`', 'Subir la `roughness`'],
        answer: 0,
        why: 'Three.js, por rendimiento, no mezcla el material con el fondo a menos que marques `transparent = true`.',
      },
      {
        q: '¿Qué material usan las sombras por dentro para saber qué hay delante de la luz?',
        options: ['MeshBasicMaterial', 'MeshStandardMaterial', 'MeshDepthMaterial', 'MeshNormalMaterial'],
        answer: 2,
        why: 'Una sombra es una «foto de profundidad» de la escena vista desde la luz. Si un shader deforma el objeto, esa foto debe deformarse igual (lo veremos con `customDepthMaterial`).',
      },
      {
        q: '¿Qué mapa añade relieve fino a un objeto sin añadirle más vértices?',
        options: ['`displacementMap`', '`normalMap`', '`alphaMap`', '`aoMap`'],
        answer: 1,
        why: 'El `normalMap` modifica la normal de cada píxel para que la luz «crea» que hay relieve. `displacementMap` sí mueve vértices (y necesita muchos).',
      },
    ]),
  );
}
