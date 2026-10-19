// Índice de lecciones. Para añadir una nueva: crea el archivo en esta carpeta y añade una línea aquí.
// Cada lección exporta por defecto una función que recibe el contenedor y le añade contenido.

export const GROUPS = [
  {
    id: 'inicio', title: 'Empieza aquí', color: 'shader',
    items: [
      { id: 'inicio', title: 'El mapa mental', sub: 'Qué pasa desde que escribes JavaScript hasta que ves píxeles. Si solo lees una página, que sea esta.', min: 12, load: () => import('./00-inicio.js') },
    ],
  },
  {
    id: 'cap1', title: 'Cap. 1 · Básicos', color: 'geo',
    items: [
      { id: 'escena', title: 'La escena y el Mesh', course: 'Lecciones 1–3', sub: 'Scene, Camera, Renderer y Mesh: los cuatro ingredientes de cualquier proyecto.', min: 15, load: () => import('./01-escena.js') },
      { id: 'transformar', title: 'Mover, escalar y rotar', course: 'Lección 4', sub: 'position, scale, rotation, Group y por qué importa el orden de los ejes.', min: 12, load: () => import('./02-transformar.js') },
      { id: 'animar', title: 'Animaciones y el Clock', course: 'Lección 5', sub: 'El bucle tick, requestAnimationFrame y cómo hacer que todo vaya igual en cualquier pantalla.', min: 10, load: () => import('./03-animar.js') },
      { id: 'camaras', title: 'Cámaras, controles y resize', course: 'Lecciones 6–7', sub: 'FOV, near y far, cámara ortográfica, OrbitControls y pantalla completa.', min: 14, load: () => import('./04-camaras.js') },
      { id: 'geometrias', title: 'Geometrías', course: 'Lección 8', sub: 'Qué es un vértice, qué guarda un BufferGeometry y cómo crear una a mano.', min: 14, load: () => import('./05-geometrias.js') },
      { id: 'texturas', title: 'Texturas y UV', course: 'Lección 10', sub: 'Cómo se «pega» una imagen sobre un modelo 3D y qué hacen repeat, offset y los filtros.', min: 12, load: () => import('./06-texturas.js') },
      { id: 'materiales', title: 'Materiales', course: 'Lección 11', sub: 'De MeshBasic a MeshStandard: qué hace cada uno y cuál cuesta más.', min: 12, load: () => import('./07-materiales.js') },
      { id: 'extras', title: 'Debug UI, texto 3D y publicar', course: 'Lecciones 9, 12, 13', sub: 'Lo pequeño pero útil: lil-gui, TextGeometry y cómo subir el proyecto.', min: 6, load: () => import('./08-extras.js') },
    ],
  },
  {
    id: 'cap2', title: 'Cap. 2 · Técnicas clásicas', color: 'light',
    items: [
      { id: 'luces', title: 'Luces', course: 'Lección 14', sub: 'Ambient, Directional, Hemisphere, Point, Spot y RectArea: cuándo usar cada una.', min: 14, load: () => import('./09-luces.js') },
      { id: 'sombras', title: 'Sombras', course: 'Lección 15', sub: 'castShadow, receiveShadow, mapSize y por qué una sombra es «otra foto» de la escena.', min: 14, load: () => import('./10-sombras.js') },
      { id: 'tecnicas', title: 'Partículas, galaxia y scroll', course: 'Lecciones 16–19', sub: 'Points, BufferGeometry con miles de vértices y animación por scroll.', min: 10, load: () => import('./11-tecnicas.js') },
    ],
  },
  {
    id: 'cap3', title: 'Cap. 3 · Avanzado', color: 'mat',
    items: [
      { id: 'avanzado', title: 'Chuleta de técnicas avanzadas', course: 'Lecciones 20–26', sub: 'Físicas, modelos importados, raycaster, Blender, environment map y render realista.', min: 12, load: () => import('./12-avanzado.js') },
    ],
  },
  {
    id: 'cap4', title: 'Cap. 4 · Shaders', color: 'shader',
    items: [
      { id: 'gpu', title: 'Cómo dibuja la GPU', course: 'Lección 27', sub: 'Vertex shader, rasterización y fragment shader, paso a paso con números.', min: 14, load: () => import('./13-gpu.js') },
      { id: 'glsl', title: 'GLSL: el idioma de la GPU', course: 'Lección 27', sub: 'Tipos, vectores, swizzling y las funciones que usarás todo el rato.', min: 14, load: () => import('./14-glsl.js') },
      { id: 'variables', title: 'Attributes, uniforms y varyings', course: 'Lección 27', sub: 'Cómo viajan los datos de JavaScript al shader y del vertex al fragment.', min: 14, load: () => import('./15-variables.js') },
      { id: 'patrones', title: 'Laboratorio de shaders', course: 'Lecciones 28–30', sub: 'Escribe shaders y mira el resultado al instante: patrones, olas y tiempo.', min: 20, load: () => import('./16-patrones.js') },
      { id: 'matrices', title: 'Matrices y la rotación mat2', course: 'Lección 31 (base)', sub: 'La única matemática que necesitas para el twist, con números reales.', min: 12, load: () => import('./17-matrices.js') },
      { id: 'modified', title: 'Modified materials', course: 'Lección 31', star: true, sub: 'Retoca un MeshStandardMaterial sin reescribirlo: onBeforeCompile, chunks, twist, sombras y normales.', min: 40, load: () => import('./18-modified.js') },
    ],
  },
  {
    id: 'ref', title: 'Referencia', color: 'ok',
    items: [
      { id: 'chuleta', title: 'Chuleta de código', sub: 'Todo el código importante en un solo sitio, para copiar y consultar.', min: 8, load: () => import('./99-chuleta.js') },
    ],
  },
];

export const FLAT = GROUPS.flatMap((g) => g.items.map((it) => ({ ...it, group: g })));
export const BY_ID = Object.fromEntries(FLAT.map((it) => [it.id, it]));
