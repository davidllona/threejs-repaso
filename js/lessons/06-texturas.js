import { P, UL, callout, codeBlock, liveCode, demo, table, eq } from '../ui.js';
import { makeGridTexture, THREE as T } from '../stage.js';

// Corazón de 8×8 píxeles para probar magFilter
function makePixelHeart() {
  const rows = [
    '..XX.XX.',
    '.XXXXXXX',
    '.XXXXXXX',
    '.XXXXXXX',
    '..XXXXX.',
    '...XXX..',
    '....X...',
    '........',
  ];
  const c = document.createElement('canvas');
  c.width = c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = '#242833';
  g.fillRect(0, 0, 8, 8);
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === 'X') { g.fillStyle = (x + y) % 2 ? '#f472b6' : '#ff8ec4'; g.fillRect(x, y, 1, 1); }
  }));
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

// Tablero fino para probar minFilter (moiré sin mipmaps)
function makeChecker(size = 512, cells = 32) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / cells;
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    g.fillStyle = (x + y) % 2 ? '#e4e7ee' : '#242833';
    g.fillRect(x * s, y * s, s, s);
  }
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  return tex;
}

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'UV: el papel de regalo',
      body: () => [
        P('Una textura es una **imagen pegada sobre un objeto**. Como el objeto es curvo y la imagen plana, cada vértice guarda un par (u, v) que dice «yo cojo el color de **este** punto de la imagen». Es como forrar una caja: desdoblada en plano, cada zona apunta a su trozo de papel.'),
        eq(`(0,0) = esquina inferior izquierda     (1,1) = esquina superior derecha\n\nvértice A: uv = (0, 0)\nvértice B: uv = (1, 0)\npíxel a mitad de camino entre A y B → uv = (0.5, 0)   ← la GPU interpola`),
        P('Entre vértices, la GPU **interpola** los UV automáticamente. Guárdate esa palabra: es lo mismo que harán los *varyings* en el capítulo de shaders.'),
        codeBlock({
          title: 'script.js',
          code: `
const textureLoader = new THREE.TextureLoader()
const colorTexture = textureLoader.load('/textures/door/color.jpg')
colorTexture.colorSpace = THREE.SRGBColorSpace

const material = new THREE.MeshBasicMaterial({ map: colorTexture })`,
          notes: [
            ['textureLoader.load', '**Asíncrono**: devuelve la textura vacía al instante y la rellena al terminar la descarga.'],
            ['colorTexture.colorSpace', 'Las texturas de **color** se marcan `SRGBColorSpace` o salen lavadas. Las de **datos** (normal, roughness, alpha…) no se marcan: son números.'],
            ['{ map: colorTexture }', 'Cada dato tiene su propiedad: `map`, `normalMap`, `roughnessMap`, `alphaMap`…'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: 'Un vértice tiene `uv = (1, 1)`. ¿Qué punto de la imagen le toca?',
        options: ['La esquina inferior izquierda', 'El centro', 'La esquina superior derecha'],
        answer: 2,
        why: 'El sistema UV va de (0,0) abajo-izquierda a (1,1) arriba-derecha, dé igual la resolución de la imagen.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'repeat, offset y wrap',
      body: () => [
        demo({
          title: 'repeat, offset, rotation y wrap',
          aspect: '16 / 10',
          caption: 'Pon `repeat` en 3: **no se repite**, los bordes se estiran. Es el modo por defecto (`ClampToEdge`). Cambia a `RepeatWrapping` y ahora sí.',
          setup({ makeStage, panel, side }) {
            const stage = makeStage({ pos: [1.8, 1.4, 2.6], fov: 45 });
            const { THREE, scene } = stage;
            const tex = makeGridTexture({ size: 512, cells: 4 });
            tex.anisotropy = 4;
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), new THREE.MeshBasicMaterial({ map: tex }));
            scene.add(mesh);
            stage.onTick((dt) => { mesh.rotation.y += dt * 0.15; });
            const code = liveCode({ title: 'script.js', lang: 'js' });
            const s = { rx: 1, ry: 1, ox: 0, oy: 0, rot: 0, wrap: 'Clamp', center: false };
            const WRAP = { Clamp: THREE.ClampToEdgeWrapping, Repeat: THREE.RepeatWrapping, Mirrored: THREE.MirroredRepeatWrapping };
            const WRAPNAME = { Clamp: 'THREE.ClampToEdgeWrapping', Repeat: 'THREE.RepeatWrapping', Mirrored: 'THREE.MirroredRepeatWrapping' };
            const apply = () => {
              tex.repeat.set(s.rx, s.ry);
              tex.offset.set(s.ox, s.oy);
              tex.rotation = s.rot;
              tex.center.set(s.center ? 0.5 : 0, s.center ? 0.5 : 0);
              tex.wrapS = tex.wrapT = WRAP[s.wrap];
              tex.needsUpdate = true;
              code.set(`colorTexture.repeat.set(${s.rx.toFixed(1)}, ${s.ry.toFixed(1)})
colorTexture.offset.set(${s.ox.toFixed(2)}, ${s.oy.toFixed(2)})
colorTexture.rotation = ${s.rot.toFixed(2)}${s.center ? '\ncolorTexture.center.set(0.5, 0.5)' : ''}
colorTexture.wrapS = ${WRAPNAME[s.wrap]}
colorTexture.wrapT = ${WRAPNAME[s.wrap]}`);
            };
            panel([
              { type: 'range', label: 'repeat.x', min: 0.5, max: 4, step: 0.5, value: 1, onInput: (v) => { s.rx = v; apply(); } },
              { type: 'range', label: 'repeat.y', min: 0.5, max: 4, step: 0.5, value: 1, onInput: (v) => { s.ry = v; apply(); } },
              { type: 'range', label: 'offset.x', min: -1, max: 1, step: 0.05, value: 0, onInput: (v) => { s.ox = v; apply(); } },
              { type: 'range', label: 'offset.y', min: -1, max: 1, step: 0.05, value: 0, onInput: (v) => { s.oy = v; apply(); } },
              { type: 'range', label: 'rotation (radianes)', min: -3.14, max: 3.14, step: 0.05, value: 0, onInput: (v) => { s.rot = v; apply(); } },
              { type: 'check', label: 'center = (0.5, 0.5) → gira desde el centro', value: false, onInput: (v) => { s.center = v; apply(); } },
              { type: 'select', label: 'wrapS / wrapT', options: [['Clamp', 'ClampToEdge (por defecto)'], ['Repeat', 'RepeatWrapping'], ['Mirrored', 'MirroredRepeatWrapping']], value: 'Clamp', onInput: (v) => { s.wrap = v; apply(); } },
            ]);
            side.append(code.el);
          },
        }),
        P('Estas propiedades transforman **la textura**, no el objeto: `repeat` tesela, `offset` desplaza, `rotation` gira (alrededor de la esquina (0,0), salvo que muevas `center`).'),
      ],
      check: {
        type: 'fill',
        q: '`repeat.set(3, 3)` estira los bordes en vez de repetir. Completa el arreglo:',
        pre: 'texture.wrapS = texture.wrapT = THREE.', post: '',
        answer: 'RepeatWrapping',
        accept: ['RepeatWrapping', 'MirroredRepeatWrapping'],
        placeholder: 'constante',
        size: 20,
        why: 'Por defecto (`ClampToEdgeWrapping`), fuera de [0,1] se repite el último píxel. `RepeatWrapping` tesela (y `MirroredRepeatWrapping` tesela en espejo).',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Filtros: nítido o borroso',
      body: () => [
        demo({
          title: 'magFilter (izquierda) y minFilter (derecha)',
          aspect: '16 / 9',
          caption: 'Izquierda: un corazón de **8×8 píxeles** ampliado. Derecha: un tablero fino en ángulo rasante; con `Nearest` se llena de moiré.',
          setup({ makeStage, panel }) {
            const stage = makeStage({ pos: [0, 1.3, 6.4], target: [0, 0, -0.5], fov: 50, orbit: false });
            const { THREE, scene } = stage;
            const heart = makePixelHeart();
            const checker = makeChecker();
            checker.repeat.set(8, 8);
            checker.anisotropy = 1;
            const left = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: heart }));
            left.position.set(-2.4, 0.9, 0);
            scene.add(left);
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: checker }));
            floor.rotation.x = -Math.PI / 2 + 0.05;
            floor.position.set(1.8, -0.3, -1.5);
            scene.add(floor);
            const MAG = { Nearest: THREE.NearestFilter, Linear: THREE.LinearFilter };
            const MIN = { Nearest: THREE.NearestFilter, Linear: THREE.LinearFilter, Mipmap: THREE.LinearMipmapLinearFilter };
            panel([
              { type: 'select', label: 'heart.magFilter', options: [['Linear', 'LinearFilter (por defecto)'], ['Nearest', 'NearestFilter']], value: 'Linear', onInput: (v) => { heart.magFilter = MAG[v]; heart.needsUpdate = true; } },
              { type: 'select', label: 'checker.minFilter', options: [['Mipmap', 'LinearMipmapLinear (por defecto)'], ['Linear', 'LinearFilter'], ['Nearest', 'NearestFilter']], value: 'Mipmap', onInput: (v) => { checker.minFilter = MIN[v]; checker.needsUpdate = true; } },
              { type: 'note', html: 'Pixel art: `magFilter = THREE.NearestFilter` + imagen pequeña = estética retro y menos memoria.' },
            ]);
          },
        }),
        table(['Caso', 'Filtro', 'Qué elegir'], [
          ['Textura pequeña vista **grande**', '`magFilter`', '`Nearest` = píxeles nítidos (Minecraft) · `Linear` (defecto) = suave/borroso'],
          ['Textura grande vista **pequeña o en ángulo**', '`minFilter`', '`LinearMipmapLinear` (defecto) = suave, usa **mipmaps** · `Nearest` = moiré'],
        ]),
      ],
      more: () => [
        P('Los **mipmaps** son copias de la textura a mitad de tamaño, y mitad de la mitad, etc., precalculadas por Three.js (`generateMipmaps = true`). Cuestan un 33 % extra de memoria. Si tu `minFilter` es `NearestFilter`, no se usan: apágalos con `generateMipmaps = false`. Por los mipmaps las texturas deben medir **potencias de 2** (512, 1024, 2048…): dividir entre 2 sin decimales.'),
      ],
      check: {
        type: 'mc',
        q: 'Quieres píxeles cuadrados nítidos al ampliar una imagen de 8×8. ¿Qué cambias?',
        options: ['`minFilter = THREE.LinearFilter`', '`magFilter = THREE.NearestFilter`', '`colorSpace = THREE.SRGBColorSpace`'],
        answer: 1,
        why: 'Ampliar = magnificación = `magFilter`. `Nearest` coge el texel más cercano sin mezclar: cuadrados perfectos.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'Peso del archivo ≠ memoria de GPU',
      body: () => [
        eq(`memoria GPU ≈ ancho × alto × 4 bytes × 1.33 (mipmaps)\n\n1024 × 1024  ≈  5.6 MB\n2048 × 2048  ≈ 22.4 MB\n4096 × 4096  ≈ 89.5 MB   ← ¡aunque el JPG pese 1 MB!`),
        P('El JPG viaja comprimido, pero la GPU necesita los píxeles **descomprimidos**: 4 bytes por píxel. Un archivo pequeño puede ser una textura carísima. Regla: usa el tamaño más pequeño que se vea bien, en potencias de 2.'),
        UL([
          '`.jpg`: pesa poco, pierde calidad, sin transparencia.',
          '`.png`: sin pérdida y con alfa, pesa más.',
          'KTX2 / basis: comprimidos **también en GPU**, lo mejor para producción.',
        ]),
      ],
      more: () => [
        callout('tip', 'Dónde conseguir texturas', [
          P('poliigon.com, 3dtextures.me y arroway-textures.ch tienen packs gratuitos con todos los mapas del mismo material: color, alpha, altura, normal, ambient occlusion, metalness y roughness. Cada uno va a su propiedad del material: siguiente lección.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Una textura 4096×4096 pesa 1 MB en JPG. ¿Cuánta memoria de GPU ocupa aprox.?',
        options: ['1 MB', 'Unos 8 MB', 'Casi 90 MB'],
        answer: 2,
        why: '4096 × 4096 × 4 bytes ≈ 67 MB, más ~33 % de mipmaps ≈ 89 MB. El peso del archivo no dice nada de la memoria de GPU.',
      },
    },
  ];
}
