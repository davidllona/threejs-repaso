import { P, H2, H3, UL, callout, codeBlock, liveCode, demo, table, quiz, eq } from '../ui.js';
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

// Tablero fino para probar minFilter (se ve moiré si no hay mipmaps)
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

export default function render(root) {
  root.append(
    P('Una textura es **una imagen que se pega sobre un objeto 3D**. Pero un objeto 3D es una superficie curva y una imagen es plana, así que hace falta un «mapa» que diga qué parte de la imagen va en cada parte del objeto. Ese mapa son las **coordenadas UV**.'),
    callout('analogy', 'El papel de regalo', [
      P('Piensa en forrar una caja con papel de regalo. Desdoblas la caja y la dejas plana (como una plantilla de cartón); pones el papel debajo; y cada punto de la caja plana «apunta» a un punto del papel. Eso son los UV: **para cada vértice, un par de números (u, v) que dicen «tú coges el color de este punto de la imagen»**. El mismo problema que representar la Tierra (esfera) en un mapa plano.'),
    ]),
    H3('Cómo son los UV'),
    P('Es un sistema de coordenadas dentro de la imagen: **(0, 0)** es la esquina inferior izquierda y **(1, 1)** la superior derecha, sea cual sea el tamaño en píxeles. Cada vértice de la geometría guarda su (u, v) en el atributo `uv`. Entre vértices, la GPU **interpola**: un píxel que está justo a mitad de camino entre un vértice con u = 0 y otro con u = 1 coge u = 0.5. (Esta interpolación aparecerá otra vez con los *varyings* en shaders.)'),
    eq(`vértice A: uv = (0, 0)   →  esquina inferior izquierda de la imagen\nvértice B: uv = (1, 0)   →  esquina inferior derecha\nvértice C: uv = (0.5, 1) →  mitad del borde superior\n\npíxel entre A y B   →  uv = (0.5, 0)   →  mitad del borde inferior`),

    H2('Cargar una textura'),
    codeBlock({
      title: 'script.js',
      code: `
const textureLoader = new THREE.TextureLoader()
const colorTexture = textureLoader.load('/textures/door/color.jpg')
colorTexture.colorSpace = THREE.SRGBColorSpace

const material = new THREE.MeshBasicMaterial({ map: colorTexture })
const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)`,
      notes: [
        ['new THREE.TextureLoader()', 'El cargador de imágenes. Se crea una vez y se reutiliza para todas las texturas.'],
        ["textureLoader.load('/textures", 'Carga la imagen de forma **asíncrona**: devuelve la textura inmediatamente (vacía) y cuando termina de descargarse se rellena sola. Por eso a veces ves un objeto negro un instante.'],
        ['colorTexture.colorSpace', 'Muy importante: las texturas que son **color** (lo que ven tus ojos) se marcan como `SRGBColorSpace` para que los colores no salgan lavados. Las texturas que son **datos** (normal, rugosidad, metalness, alpha…) **no** se marcan: son números, no colores.'],
        ['{ map: colorTexture }', '`map` es la propiedad del material que recibe la textura de color. Cada tipo de dato tiene la suya: `normalMap`, `roughnessMap`, `alphaMap`…'],
      ],
    }),

    H2('Mover, repetir y girar la textura'),
    P('Una vez cargada, puedes transformar **la textura** (no el objeto) con propiedades parecidas a las que ya conoces: `repeat`, `offset`, `rotation`. Prueba, y fíjate sobre todo en lo que pasa con `repeat` mayor que 1 cuando no cambias el modo de repetición:'),
    demo({
      title: 'repeat, offset, rotation y wrap',
      aspect: '16 / 10',
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
      caption: 'Pon `repeat` en 3 y fíjate en que **no se repite**: los bordes se estiran. Es el modo por defecto (`ClampToEdge`): fuera de [0, 1] se repite el último píxel. Cambia a `RepeatWrapping` y ahora sí. La textura gira alrededor de la esquina (0,0) salvo que cambies `center`.',
    }),

    H2('Filtros: qué pasa cuando la textura no coincide con la pantalla'),
    P('Casi nunca un píxel de la textura (un *texel*) ocupa exactamente un píxel de pantalla. Hay dos casos y cada uno tiene su filtro:'),
    table(['Caso', 'Filtro', 'Opciones habituales'], [
      ['La textura es **pequeña** y se ve **muy grande** (cada texel ocupa muchos píxeles)', '`magFilter` (magnificación)', '`NearestFilter`: píxeles cuadrados nítidos (aspecto Minecraft). `LinearFilter` (por defecto): se mezclan y se ve borroso.'],
      ['La textura es **grande** y se ve **muy pequeña o en ángulo** (muchos texels caben en un píxel)', '`minFilter` (minificación)', '`NearestFilter`: moiré y parpadeo. `LinearMipmapLinearFilter` (por defecto): suave, usa **mipmaps** (la misma imagen en versiones cada vez más pequeñas, precalculadas).'],
    ]),
    demo({
      title: 'magFilter (izquierda) y minFilter (derecha)',
      aspect: '16 / 9',
      caption: 'Izquierda: un corazón de **8×8 píxeles** estirado a toda la cara. Derecha: un tablero fino visto en ángulo rasante; con `Nearest` el fondo se llena de moiré. Los mipmaps los crea Three.js solos (`generateMipmaps = true`) y ocupan un 33 % extra de memoria. Si usas `NearestFilter` como minFilter, desactívalos: `generateMipmaps = false`.',
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
          { type: 'select', label: 'checker.minFilter', options: [['Mipmap', 'LinearMipmapLinearFilter (por defecto)'], ['Linear', 'LinearFilter'], ['Nearest', 'NearestFilter']], value: 'Mipmap', onInput: (v) => { checker.minFilter = MIN[v]; checker.needsUpdate = true; } },
          { type: 'note', html: 'Truco de pixel art: `magFilter = THREE.NearestFilter` + imágenes pequeñas = estética retro **y** menos memoria.' },
        ]);
      },
    }),

    H2('Peso y formato (¡dos cosas distintas!)'),
    P('Hay dos tamaños que importan y casi nadie los distingue: lo que **pesa el archivo** (lo que se descarga) y lo que **ocupa en la GPU** (lo que gasta memoria al usarla). Un JPG de 300 KB puede ocupar mucho más en la GPU, porque la GPU necesita la imagen **descomprimida**: cuatro bytes por píxel (rojo, verde, azul, alfa).'),
    eq(`memoria GPU ≈ ancho × alto × 4 bytes × 1.33 (mipmaps)\n\n1024 × 1024 → 1 048 576 px × 4 × 1.33 ≈  5.6 MB\n2048 × 2048 →                    ≈ 22.4 MB\n4096 × 4096 →                    ≈ 89.5 MB   ← ¡aunque el JPG pese 1 MB!`),
    UL([
      '**Tamaño** de la imagen: potencias de 2 (512, 1024, 2048…) porque los mipmaps necesitan dividir entre 2 sin decimales. Usa el más pequeño que se vea bien.',
      '**Formato**: `.jpg` pesa menos pero pierde calidad y no tiene transparencia; `.png` conserva calidad y alfa pero pesa más; los formatos comprimidos para GPU (basis / KTX2) son lo mejor para producción.',
    ]),
    callout('tip', 'Dónde conseguir texturas', [
      P('Para practicar: poliigon.com, 3dtextures.me, arroway-textures.ch (todos con packs gratuitos). Suelen traer varios mapas del mismo material: color, alpha, altura, normal, ambient occlusion, metalness y roughness. Cada uno va a una propiedad distinta del material (lo verás en la próxima lección).'),
    ]),

    quiz([
      {
        q: 'Un vértice tiene `uv = (1, 1)`. ¿Qué punto de la imagen le corresponde?',
        options: ['La esquina inferior izquierda', 'El centro', 'La esquina superior derecha', 'La esquina superior izquierda'],
        answer: 2,
        why: '(0,0) es abajo-izquierda y (1,1) arriba-derecha, sea cual sea la resolución de la imagen.',
      },
      {
        q: 'Pones `texture.repeat.set(3, 3)` y los bordes se estiran en vez de repetirse. ¿Qué falta?',
        options: ['`texture.wrapS = texture.wrapT = THREE.RepeatWrapping`', '`texture.needsUpdate = false`', '`mesh.scale.set(3, 3, 3)`', 'Cambiar el `minFilter`'],
        answer: 0,
        why: 'El modo por defecto es `ClampToEdge`: fuera de la imagen repite el último píxel. Para teselar hay que usar `RepeatWrapping` (o `MirroredRepeatWrapping`).',
      },
      {
        q: 'Quieres un aspecto de píxeles cuadrados nítidos al ampliar una imagen pequeña. ¿Qué cambias?',
        options: ['`magFilter = THREE.NearestFilter`', '`minFilter = THREE.LinearFilter`', '`colorSpace = THREE.SRGBColorSpace`', '`wireframe = true`'],
        answer: 0,
        why: '`magFilter` actúa cuando la textura se amplía. `Nearest` coge el texel más cercano sin mezclar, así que los píxeles se ven como cuadrados.',
      },
      {
        q: 'Una textura de 4096 × 4096 pesa 1 MB como JPG. ¿Cuánta memoria de GPU usa aproximadamente?',
        options: ['1 MB', 'Unos 8 MB', 'Casi 90 MB', 'Depende del color'],
        answer: 2,
        why: 'La GPU guarda los píxeles sin comprimir: 4096 × 4096 × 4 bytes ≈ 67 MB, más un 33 % de mipmaps ≈ 89 MB. De ahí la importancia de usar el tamaño más pequeño posible.',
      },
    ]),
  );
}
