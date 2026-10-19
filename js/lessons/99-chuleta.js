import { h, P, H2, H3, UL, OL, callout, codeBlock, table, eq } from '../ui.js';
import { SOLUTION_CODE } from '../lib/modified-lab.js';

/* =====================================================================
   Chuleta de código: todo en un solo sitio, con buscador y filtros.
   Cada «fragmento» es un .chu-item; el buscador oculta los que no coinciden.
   ===================================================================== */

const TABS = [
  { id: 'all', label: 'Todo' },
  { id: 'base', label: 'Base', color: 'geo' },
  { id: 'luz', label: 'Luces y sombras', color: 'light' },
  { id: 'tec', label: 'Técnicas', color: 'ok' },
  { id: 'shader', label: 'Shaders', color: 'shader' },
  { id: 'mod', label: 'Modified materials', color: 'mat' },
  { id: 'glos', label: 'Glosario', color: 'geo' },
];

const item = (title, ...kids) => h('div', { class: 'chu-item' }, title ? H3(title) : null, ...kids);
const section = (tag, title, ...kids) => {
  const color = TABS.find((t) => t.id === tag)?.color || 'shader';
  return h('section', { class: 'chu-sec', 'data-tag': tag, style: { '--c': `var(--${color})` } }, H2(title), ...kids);
};
const js = (title, code, notes = [], notesOpen = false) => codeBlock({ title, lang: 'js', code, notes, notesOpen });
const glsl = (title, code, notes = [], notesOpen = false) => codeBlock({ title, lang: 'glsl', code, notes, notesOpen });

/* ------------------------------ BASE ------------------------------ */
const baseSection = () => section('base', 'Lo básico: escena, mesh, cámara y bucle',
  item('Plantilla mínima completa',
    P('Si empiezas un proyecto desde cero, copia esto. Es lo que tiene **todo** proyecto de Three.js: escena, objeto, cámara, renderer, resize y bucle.'),
    js('main.js', `
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const canvas = document.querySelector('canvas.webgl')
const sizes = { width: window.innerWidth, height: window.innerHeight }

const scene = new THREE.Scene()

const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: '#ff5a5a' })
)
scene.add(mesh)

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(2, 2, 3)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    mesh.rotation.y = elapsedTime

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}
tick()
`, [
      ['const canvas', 'El `<canvas>` del HTML donde Three.js dibuja.'],
      ['new THREE.Scene()', 'La escena: la «caja» donde metes todo lo que quieres ver.'],
      ['new THREE.Mesh(', 'Mesh = **Geometry** (la forma) + **Material** (el aspecto).'],
      ['PerspectiveCamera', 'Cuatro números: campo de visión (grados), proporción ancho/alto, plano cercano y plano lejano.'],
      ['enableDamping', 'Hace que la cámara se frene con suavidad. Obliga a llamar `controls.update()` en cada frame.'],
      ['new THREE.WebGLRenderer', 'El que dibuja la escena vista desde la cámara dentro del canvas.'],
      ["'resize'", 'Cuando cambia el tamaño de la ventana hay que actualizar tamaños, cámara y renderer.'],
      ['updateProjectionMatrix', 'Imprescindible tras cambiar `camera.aspect` (u otras propiedades de la cámara).'],
      ['new THREE.Clock()', 'Un cronómetro. `getElapsedTime()` dice cuántos segundos han pasado desde que lo creaste.'],
      ['const tick', 'El bucle: se ejecuta una vez por fotograma.'],
      ['controls.update()', 'Necesario si usas damping.'],
      ['requestAnimationFrame', 'Pide al navegador que vuelva a llamar a `tick` en el siguiente fotograma.'],
    ], true),
  ),

  item('Mover, escalar y rotar',
    js('transformaciones', `
mesh.position.set(1, 0.5, -2)       // x, y, z
mesh.scale.set(2, 1, 0.5)
mesh.rotation.y = Math.PI * 0.25    // radianes: PI = 180°
mesh.rotation.reorder('YXZ')        // el orden de los ejes importa (hazlo ANTES de rotar)
mesh.lookAt(new THREE.Vector3(0, 0, 0))

camera.lookAt(mesh.position)

// Agrupar: lo que le hagas al grupo se lo haces a todos los hijos
const group = new THREE.Group()
group.add(cube1, cube2)
scene.add(group)
group.position.y = 2

// Ayuda visual de ejes: X rojo, Y verde, Z azul
scene.add(new THREE.AxesHelper(2))
`),
    P('Recuerda los colores: **X** rojo, **Y** verde (arriba), **Z** azul (hacia ti).'),
  ),

  item('Geometrías y materiales más usados',
    table(['Geometría', 'Constructor', 'Qué es cada número'], [
      ['`BoxGeometry`', '`(w, h, d, wSeg, hSeg, dSeg)`', 'Ancho, alto, fondo y subdivisiones'],
      ['`SphereGeometry`', '`(radio, segAncho, segAlto)`', 'Más segmentos = más redonda y más cara'],
      ['`PlaneGeometry`', '`(w, h, wSeg, hSeg)`', 'Un rectángulo plano mirando a +Z'],
      ['`CylinderGeometry`', '`(rArriba, rAbajo, alto, segRadiales)`', ''],
      ['`ConeGeometry`', '`(radio, alto, segRadiales)`', ''],
      ['`TorusGeometry`', '`(radio, grosor, segRadiales, segTubulares)`', 'Un donut'],
      ['`BufferGeometry`', '`new BufferGeometry()` + `setAttribute`', 'La que construyes a mano, vértice a vértice'],
    ]),
    table(['Material', 'Reacciona a luces', 'Para qué sirve'], [
      ['`MeshBasicMaterial`', 'No', 'Color plano o textura sin sombreado. El más barato.'],
      ['`MeshNormalMaterial`', 'No', 'Colorea según hacia dónde mira cada cara. Útil para depurar.'],
      ['`MeshMatcapMaterial`', 'No (simula una)', 'Iluminación «pintada» en una imagen. Parece 3D sin luces.'],
      ['`MeshLambertMaterial`', 'Sí', 'Luz sencilla y barata; sin brillos.'],
      ['`MeshPhongMaterial`', 'Sí', 'Con brillo (`shininess`, `specular`).'],
      ['`MeshToonMaterial`', 'Sí', 'Aspecto de dibujo animado.'],
      ['`MeshStandardMaterial`', 'Sí', 'El realista (PBR): `metalness` y `roughness`. El que más usarás.'],
      ['`MeshPhysicalMaterial`', 'Sí', 'Standard + extras (clearcoat, transmission…). El más caro.'],
      ['`PointsMaterial`', '—', 'Para partículas (`Points`).'],
      ['`ShaderMaterial`', '—', 'Tú escribes vertex y fragment shader.'],
    ]),
  ),

  item('Texturas',
    js('cargar y configurar', `
const textureLoader = new THREE.TextureLoader()

const colorTexture = textureLoader.load('/textures/door/color.jpg')
colorTexture.colorSpace = THREE.SRGBColorSpace   // SOLO las de color (map, matcap)

// Repetir, mover y girar
colorTexture.repeat.set(2, 3)
colorTexture.wrapS = THREE.RepeatWrapping        // eje horizontal
colorTexture.wrapT = THREE.RepeatWrapping        // eje vertical
colorTexture.offset.x = 0.5
colorTexture.rotation = Math.PI * 0.25
colorTexture.center.set(0.5, 0.5)                // pivote de la rotación

// Filtros (qué pasa si la textura no coincide con los píxeles de pantalla)
colorTexture.generateMipmaps = false
colorTexture.minFilter = THREE.NearestFilter
colorTexture.magFilter = THREE.NearestFilter

const material = new THREE.MeshBasicMaterial({ map: colorTexture })
`),
    callout('tip', 'Peso y formato', [
      P('El **peso del archivo** (.jpg, .png, .webp) importa para descargar; el **tamaño en píxeles** importa para la GPU y debería ser potencia de 2 (512, 1024, 2048…). Son dos cosas distintas.'),
    ]),
  ),

  item('Propiedades de MeshStandardMaterial',
    js('materiales', `
const material = new THREE.MeshStandardMaterial()
material.map = colorTexture
material.aoMap = ambientOcclusionTexture
material.aoMapIntensity = 1
material.displacementMap = heightTexture
material.displacementScale = 0.1
material.metalnessMap = metalnessTexture
material.roughnessMap = roughnessTexture
material.normalMap = normalTexture
material.normalScale.set(0.5, 0.5)
material.transparent = true
material.alphaMap = alphaTexture
material.side = THREE.DoubleSide        // pintar también la cara trasera

material.metalness = 0.7
material.roughness = 0.2

// Entorno: la luz y los reflejos que vienen de «todas partes»
// import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
const rgbeLoader = new RGBELoader()
rgbeLoader.load('/environmentMap/2k.hdr', (environmentMap) =>
{
    environmentMap.mapping = THREE.EquirectangularReflectionMapping
    scene.background = environmentMap
    scene.environment = environmentMap
})
`),
  ),

  item('Debug UI con lil-gui',
    js('lil-gui', `
import GUI from 'lil-gui'

const gui = new GUI({ width: 300, title: 'Ajustes' })
// gui.hide()   // y con gui.show() / pulsando una tecla, lo enseñas

const debugObject = { color: '#ff5a5a', spin: () => { mesh.rotation.y += Math.PI * 2 } }

gui.add(mesh.position, 'y').min(-3).max(3).step(0.01).name('altura')
gui.add(mesh, 'visible')
gui.add(material, 'wireframe')
gui.addColor(debugObject, 'color').onChange(() => material.color.set(debugObject.color))
gui.add(debugObject, 'spin')
`),
  ),
);

/* --------------------------- LUCES Y SOMBRAS --------------------------- */
const lightSection = () => section('luz', 'Luces y sombras',
  item('Los seis tipos de luz',
    js('luces', `
// Luz que llega de todas partes por igual (sin dirección, sin sombras)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)

// Rayos paralelos, como el sol (color, intensidad). Importa la posición como dirección.
const directionalLight = new THREE.DirectionalLight(0x00fffc, 0.9)
directionalLight.position.set(1, 0.25, 0)

// Cielo arriba, suelo abajo (colorCielo, colorSuelo, intensidad). Sin sombras.
const hemisphereLight = new THREE.HemisphereLight(0xff0000, 0x0000ff, 0.9)

// Bombilla: sale en todas direcciones (color, intensidad, distancia, decay)
const pointLight = new THREE.PointLight(0xff9000, 1.5, 0, 2)
pointLight.position.set(1, -0.5, 1)

// Panel rectangular tipo estudio fotográfico. Solo funciona con Standard/Physical. Sin sombras.
const rectAreaLight = new THREE.RectAreaLight(0x4e00ff, 6, 1, 1)
rectAreaLight.position.set(-1.5, 0, 1.5)
rectAreaLight.lookAt(new THREE.Vector3())

// Foco (color, intensidad, distancia, ángulo, penumbra, decay)
const spotLight = new THREE.SpotLight(0x78ff00, 4.5, 10, Math.PI * 0.1, 0.25, 1)
spotLight.position.set(0, 2, 3)
spotLight.target.position.x = -0.75
scene.add(spotLight.target)      // el target hay que añadirlo a la escena

scene.add(ambientLight, directionalLight, hemisphereLight, pointLight, rectAreaLight, spotLight)
`),
    table(['Luz', 'Coste', 'Proyecta sombras'], [
      ['Ambient, Hemisphere', 'Mínimo', 'No'],
      ['Directional', 'Bajo', 'Sí'],
      ['Point', 'Medio', 'Sí (la más cara: 6 mapas de sombra)'],
      ['Spot', 'Medio', 'Sí'],
      ['RectArea', 'Alto', 'No'],
    ]),
    callout('tip', 'Consejo del curso', [
      P('Las luces **cuestan rendimiento**. Usa pocas: una ambient suave + una direccional (o un environment map) suele bastar. Para mucha luz «gratis», **hornea** la iluminación en una textura en Blender.'),
    ]),
  ),

  item('Helpers para ver las luces',
    js('helpers', `
scene.add(new THREE.DirectionalLightHelper(directionalLight, 0.2))
scene.add(new THREE.HemisphereLightHelper(hemisphereLight, 0.2))
scene.add(new THREE.PointLightHelper(pointLight, 0.2))
scene.add(new THREE.SpotLightHelper(spotLight))

// RectAreaLightHelper viene en los addons:
// import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js'
// scene.add(new RectAreaLightHelper(rectAreaLight))
`),
  ),

  item('Sombras: los cuatro interruptores',
    js('sombras', `
// 1) Activar sombras en el renderer
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// 2) La luz las proyecta
directionalLight.castShadow = true

// 3) Quién las proyecta
sphere.castShadow = true

// 4) Quién las recibe
plane.receiveShadow = true
`),
    callout('analogy', 'Una sombra es «otra foto»', [
      P('Three.js hace una **foto de la escena desde la luz** y guarda solo la distancia a la que está cada cosa (el *shadow map*). Cuando pinta un píxel, comprueba si desde la luz había algo más cerca tapándolo. Si lo había, ese píxel está en sombra.'),
    ]),
  ),

  item('Ajustar la calidad de la sombra',
    js('calidad', `
directionalLight.shadow.mapSize.width = 1024    // más resolución = más nítida y más cara
directionalLight.shadow.mapSize.height = 1024

// Cuánto «ve» la cámara de sombras: ajústala lo justo
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 6
directionalLight.shadow.camera.top = 2
directionalLight.shadow.camera.right = 2
directionalLight.shadow.camera.bottom = -2
directionalLight.shadow.camera.left = -2

directionalLight.shadow.radius = 10             // desenfoque (no funciona con PCFSoftShadowMap)

// Ver esa cámara
const cameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
scene.add(cameraHelper)

// Para el SpotLight la cámara de sombras es perspectiva:
// spotLight.shadow.camera.fov = 30
`),
  ),

  item('Alternativa barata: sombra horneada',
    js('baked shadow', `
const bakedShadow = textureLoader.load('/textures/simpleShadow.jpg')

const sphereShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, alphaMap: bakedShadow })
)
sphereShadow.rotation.x = - Math.PI * 0.5
sphereShadow.position.y = plane.position.y + 0.01   // un pelín por encima del suelo
scene.add(sphereShadow)

// en tick(): que siga a la esfera y se desvanezca con la altura
sphereShadow.position.x = sphere.position.x
sphereShadow.position.z = sphere.position.z
sphereShadow.material.opacity = (1 - sphere.position.y) * 0.3
`),
  ),
);

/* ------------------------------ TÉCNICAS ------------------------------ */
const techSection = () => section('tec', 'Técnicas: partículas, scroll, físicas, modelos',
  item('Partículas con Points',
    js('particles', `
const geometry = new THREE.BufferGeometry()
const count = 5000

const positions = new Float32Array(count * 3)   // 3 números (x, y, z) por partícula
const colors = new Float32Array(count * 3)      // 3 números (r, g, b) por partícula

for(let i = 0; i < count * 3; i++)
{
    positions[i] = (Math.random() - 0.5) * 10
    colors[i] = Math.random()
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

const material = new THREE.PointsMaterial({
    size: 0.05,
    sizeAttenuation: true,          // las lejanas se ven más pequeñas
    transparent: true,
    alphaMap: particleTexture,
    depthWrite: false,              // evita que una partícula tape a otra con su cuadrado transparente
    blending: THREE.AdditiveBlending,
    vertexColors: true
})

const particles = new THREE.Points(geometry, material)
scene.add(particles)
`),
    P('Un **BufferGeometry** es simplemente listas de números llamadas *attributes*: `position` (3 números por vértice), `uv` (2), `normal` (3), `color` (3)… El «3» de `BufferAttribute(array, 3)` es cuántos números forman un vértice.'),
  ),

  item('Animación por scroll y parallax',
    js('scroll', `
let scrollY = window.scrollY
window.addEventListener('scroll', () => { scrollY = window.scrollY })

const cursor = { x: 0, y: 0 }
window.addEventListener('mousemove', (event) =>
{
    cursor.x = event.clientX / sizes.width - 0.5
    cursor.y = event.clientY / sizes.height - 0.5
})

const cameraGroup = new THREE.Group()
scene.add(cameraGroup)
cameraGroup.add(camera)

// en tick(), con deltaTime = clock.getDelta() calculado como elapsedTime - previousTime
camera.position.y = - scrollY / sizes.height * objectsDistance

const parallaxX = cursor.x * 0.5
const parallaxY = - cursor.y * 0.5
cameraGroup.position.x += (parallaxX - cameraGroup.position.x) * 5 * deltaTime
cameraGroup.position.y += (parallaxY - cameraGroup.position.y) * 5 * deltaTime
`),
  ),

  item('Raycaster (clics y hover)',
    js('raycaster', `
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('mousemove', (event) =>
{
    mouse.x = event.clientX / sizes.width * 2 - 1       // de -1 a 1
    mouse.y = - (event.clientY / sizes.height) * 2 + 1  // ojo: la y se invierte
})

window.addEventListener('click', () =>
{
    if(currentIntersect) console.log('clic en', currentIntersect.object)
})

// en tick():
raycaster.setFromCamera(mouse, camera)
const intersects = raycaster.intersectObjects([object1, object2, object3])
currentIntersect = intersects.length ? intersects[0] : null
`),
  ),

  item('Físicas con cannon-es',
    js('physics', `
import * as CANNON from 'cannon-es'

const world = new CANNON.World()
world.gravity.set(0, - 9.82, 0)

const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0, 3, 0),
    shape: new CANNON.Sphere(0.5)
})
world.addBody(sphereBody)

const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() })   // mass 0 = estático
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(- 1, 0, 0), Math.PI * 0.5)
world.addBody(floorBody)

// en tick():
world.step(1 / 60, deltaTime, 3)
sphere.position.copy(sphereBody.position)      // el mundo físico manda; el mesh lo copia
`),
    P('El mundo físico y el de Three.js son **dos mundos separados**: la física calcula, y tú copias posición y rotación al mesh en cada frame.'),
  ),

  item('Modelos glTF',
    js('gltf', `
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)

gltfLoader.load('/models/Fox/glTF/Fox.gltf', (gltf) =>
{
    gltf.scene.scale.set(0.025, 0.025, 0.025)
    scene.add(gltf.scene)

    // Animaciones
    mixer = new THREE.AnimationMixer(gltf.scene)
    mixer.clipAction(gltf.animations[1]).play()
})

// en tick():  mixer?.update(deltaTime)
`),
  ),

  item('Render realista',
    js('renderer', `
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.5
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
`),
  ),
);

/* ------------------------------ SHADERS ------------------------------ */
const shaderSection = () => section('shader', 'Shaders: GLSL, uniforms y patrones',
  item('El camino de los datos',
    eq('JavaScript  →  vertex shader (por vértice)  →  rasterización  →  fragment shader (por píxel)  →  pantalla'),
    table(['Canal', 'Quién lo manda', 'Quién lo lee', 'Cuándo cambia'], [
      ['**attribute**', 'La geometría (`position`, `uv`, `normal`…)', 'Solo el vertex shader', 'Es distinto en cada vértice'],
      ['**uniform**', 'Tu JavaScript (`uTime`, `uColor`…)', 'Vertex y fragment', 'Igual para todos los vértices y píxeles de un frame'],
      ['**varying**', 'El vertex shader', 'El fragment shader', 'La GPU **interpola** el valor entre los vértices'],
    ]),
  ),

  item('Un ShaderMaterial completo',
    js('material con shaders', `
const material = new THREE.ShaderMaterial({
    vertexShader: \`
        uniform float uTime;
        varying vec2 vUv;

        void main()
        {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            modelPosition.y += sin(modelPosition.x * 4.0 + uTime) * 0.2;

            vec4 viewPosition = viewMatrix * modelPosition;
            gl_Position = projectionMatrix * viewPosition;

            vUv = uv;
        }
    \`,
    fragmentShader: \`
        uniform vec3 uColor;
        varying vec2 vUv;

        void main()
        {
            gl_FragColor = vec4(mix(uColor, vec3(1.0), vUv.x), 1.0);
        }
    \`,
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#ff5a5a') }
    },
    side: THREE.DoubleSide
})

// en tick():  material.uniforms.uTime.value = elapsedTime
`, [
      ['vertexShader', 'Se ejecuta **una vez por vértice** y decide dónde cae en pantalla.'],
      ['uniform float uTime', 'Un valor que envía JavaScript. `u` de uniform es solo una convención.'],
      ['varying vec2 vUv', 'Un «buzón» para pasar datos al fragment shader (`v` de varying).'],
      ['modelMatrix *', 'Lleva el vértice de las coordenadas del objeto a las del mundo (aplica position, rotation y scale del mesh).'],
      ['modelPosition.y +=', 'Aquí se mueven los vértices: una onda que depende de x y del tiempo.'],
      ['viewMatrix *', 'Del mundo al punto de vista de la cámara.'],
      ['gl_Position', 'La salida obligatoria del vertex shader: la posición final en la pantalla.'],
      ['vUv = uv', 'Copiamos el attribute `uv` al varying para que lo reciba el fragment shader.'],
      ['fragmentShader', 'Se ejecuta **una vez por píxel** cubierto y decide su color.'],
      ['gl_FragColor', 'La salida obligatoria del fragment shader: rojo, verde, azul y alfa, de 0 a 1.'],
      ['uniforms:', 'Aquí le das valor inicial a cada uniform. Siempre dentro de un objeto con `value`.'],
    ]),
    callout('remember', 'ShaderMaterial frente a RawShaderMaterial', [
      P('`ShaderMaterial` añade solo las matrices (`modelMatrix`, `viewMatrix`, `projectionMatrix`), los attributes (`position`, `uv`, `normal`) y la precisión. Con `RawShaderMaterial` tendrías que declararlo todo tú. Empieza siempre con `ShaderMaterial`.'),
    ]),
  ),

  item('GLSL en una tabla',
    table(['Qué', 'Ejemplo', 'Ojo'], [
      ['Decimales', '`float a = 1.0;`', '**No** existe la conversión automática: `1` es un `int`, y `float a = 1;` falla.'],
      ['Vectores', '`vec2`, `vec3`, `vec4`', '`vec3 c = vec3(1.0, 0.5, 0.0);`'],
      ['Acceso', '`v.x v.y v.z v.w` o `v.r v.g v.b v.a`', 'Son lo mismo; usa `rgb` con colores y `xyz` con posiciones.'],
      ['Swizzling', '`v.xz`, `v.zyx`, `v.xxxy`', 'Coge, reordena y repite componentes. Se puede asignar: `v.xz = otro.xy`'],
      ['Matrices', '`mat2`, `mat3`, `mat4`', '`mat2(a, b, c, d)` se rellena por **columnas**.'],
      ['Funciones', '`float f(float x) { return x * 2.0; }`', 'Hay que declararlas **antes** de usarlas.'],
      ['Salida', '`gl_Position`, `gl_FragColor`', 'Una por shader.'],
      ['Texto', '`//` comentario; todas las líneas con `;`', 'Sin `console.log`: depura pintando con colores.'],
    ]),
    table(['Función', 'Qué hace', 'Ejemplo'], [
      ['`mix(a, b, t)`', 'Mezcla a y b: t=0 → a, t=1 → b', '`mix(red, blue, vUv.x)`'],
      ['`step(edge, x)`', '0 si x < edge, 1 si no', '`step(0.5, vUv.x)`'],
      ['`smoothstep(e0, e1, x)`', 'Como step pero suave entre e0 y e1', '`smoothstep(0.4, 0.6, vUv.x)`'],
      ['`fract(x)`', 'La parte decimal', '`fract(vUv.x * 10.0)` → repite 10 veces'],
      ['`mod(x, y)`', 'Resto de x entre y', '`mod(vUv.y * 10.0, 1.0)`'],
      ['`abs`, `sign`, `floor`', 'Valor absoluto, signo, redondeo abajo', ''],
      ['`min`, `max`, `clamp(x, a, b)`', 'Límites', '`clamp(x, 0.0, 1.0)`'],
      ['`sin`, `cos`, `pow`, `sqrt`', 'Matemáticas básicas', '`sin(uTime)`'],
      ['`length(v)`, `distance(a, b)`', 'Módulo y distancia', '`distance(vUv, vec2(0.5))`'],
      ['`dot`, `normalize`, `cross`', 'Producto escalar, normalizar, producto vectorial', 'Luces e iluminación'],
    ]),
  ),

  item('Recetas de patrones',
    glsl('fragment shader: patrones', `
// Degradado con las coordenadas UV (0 a 1 en cada eje)
gl_FragColor = vec4(vUv, 1.0, 1.0);

// Rayas verticales: 10 franjas, la mitad negras
float stripes = step(0.5, mod(vUv.x * 10.0, 1.0));
gl_FragColor = vec4(vec3(stripes), 1.0);

// Círculo: 1 dentro de 0.25 de distancia del centro, 0 fuera
float circle = 1.0 - step(0.25, distance(vUv, vec2(0.5)));
gl_FragColor = vec4(vec3(circle), 1.0);

// Aro con borde suave
float d = distance(vUv, vec2(0.5));
float ring = smoothstep(0.02, 0.0, abs(d - 0.3));

// Mezclar dos colores con un patrón
vec3 color = mix(vec3(0.0), uColor, stripes);
gl_FragColor = vec4(color, 1.0);
`),
    glsl('vertex shader: mover vértices', `
// Olas: altura según x y el tiempo
modelPosition.y += sin(modelPosition.x * 4.0 + uTime) * 0.2;

// Ola con dos ejes
modelPosition.y += sin(modelPosition.x * 4.0 + uTime) * 0.2
                 + sin(modelPosition.z * 3.0 + uTime) * 0.1;

// Aleatorio simple y conocido en shaders
float random(vec2 st) { return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123); }
`),
  ),

  item('Tipos de uniform: de JavaScript a GLSL',
    table(['En JavaScript', 'En GLSL', 'Cómo se escribe'], [
      ['número', '`float`', '`{ value: 0.5 }`'],
      ['`true / false`', '`bool`', '`{ value: true }`'],
      ['`THREE.Vector2`', '`vec2`', '`{ value: new THREE.Vector2(1, 2) }`'],
      ['`THREE.Vector3` o `THREE.Color`', '`vec3`', '`{ value: new THREE.Color("#ff0000") }`'],
      ['`THREE.Vector4`', '`vec4`', ''],
      ['`THREE.Matrix4`', '`mat4`', ''],
      ['`THREE.Texture`', '`sampler2D`', '`uTexture: { value: texture }` y en GLSL `texture2D(uTexture, vUv)`'],
    ]),
    P('Para cambiar un uniform después: `material.uniforms.uTime.value = elapsedTime`. Se escribe **la propiedad `value`**, nunca se sustituye el objeto.'),
  ),

  item('Rotación 2D con mat2',
    glsl('función de rotación', `
mat2 get2dRotateMatrix(float _angle)
{
    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
}

// Uso: gira solo x y z, y se queda igual → giro alrededor del eje vertical
transformed.xz = get2dRotateMatrix(angle) * transformed.xz;
`),
    P('Con ángulo 0 la matriz es la identidad (no cambia nada). Con un ángulo que depende de la altura, cada «piso» de la columna gira un poco distinto: **torsión**.'),
  ),
);

/* ------------------------- MODIFIED MATERIALS ------------------------- */
const modSection = () => section('mod', 'Modified materials: onBeforeCompile',
  item('La receta en 6 pasos',
    OL6(),
  ),

  item('El esqueleto',
    js('esqueleto', `
const customUniforms = { uTime: { value: 0 } }

material.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        \`
            #include <common>

            uniform float uTime;
        \`
    )

    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        \`
            #include <begin_vertex>

            // aquí modificas transformed
        \`
    )
}

// en tick():
customUniforms.uTime.value = elapsedTime
`, [
      ['customUniforms', 'Un objeto **tuyo** que guarda los uniforms. Así puedes cambiar `uTime` desde fuera.'],
      ['onBeforeCompile', 'Three.js lo llama **una vez**, justo antes de compilar el shader del material. `shader` trae el código (`vertexShader`, `fragmentShader`) y los `uniforms`.'],
      ['shader.uniforms.uTime', '**Enchufa** tu uniform en el shader: ambos objetos comparten el mismo `{ value }`.'],
      ["'#include <common>'", 'Busca esa línea exacta dentro del código. `replace` solo cambia la **primera** coincidencia y **devuelve** un texto nuevo (por eso se reasigna).'],
      ['#include <common>', 'Ponemos **otra vez** el `#include` (si no, perderías el chunk) y añadimos lo nuestro debajo.'],
      ['uniform float uTime', '`common` va **antes** de `main()`: es el sitio para uniforms y funciones.'],
      ["'#include <begin_vertex>'", '`begin_vertex` declara `transformed`: la posición del vértice antes de proyectarse.'],
      ['modificas transformed', 'Cualquier cambio a `transformed` mueve el vértice, y respeta luces, sombras y texturas del material.'],
      ['customUniforms.uTime.value', 'En cada frame actualizas el valor y el shader lo ve.'],
    ]),
  ),

  item('Chunks que tocarás',
    table(['Chunk', 'Qué contiene', 'Lo usas para'], [
      ['`<common>`', 'Constantes y utilidades. Va **antes** de `main()`.', 'Declarar `uniform`, `varying` y **funciones** (como `get2dRotateMatrix`)'],
      ['`<beginnormal_vertex>`', 'Declara `objectNormal` (la normal del vértice).', 'Girar también la **normal** para que la luz siga bien'],
      ['`<begin_vertex>`', 'Declara `transformed` = `position`.', 'Mover / retorcer / animar el vértice'],
      ['`<project_vertex>`', 'Proyecta `transformed` a la pantalla.', 'No se toca; usa lo que hiciste en `begin_vertex`'],
    ]),
    P('Orden real dentro de `main()`: `beginnormal_vertex` → … → `begin_vertex` → … → `project_vertex`. Por eso la normal se calcula **antes** y necesita su propio `angle`.'),
    js('ver el código real', `
console.log(shader.vertexShader)             // dentro de onBeforeCompile
console.log(THREE.ShaderChunk.begin_vertex)  // el contenido de un chunk
console.log(THREE.ShaderChunk.beginnormal_vertex)
`),
  ),

  item('Que la sombra siga el giro (customDepthMaterial)',
    js('depth material', `
const depthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking
})

mesh.customDepthMaterial = depthMaterial

depthMaterial.onBeforeCompile = (shader) =>
{
    shader.uniforms.uTime = customUniforms.uTime

    shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        \`
            #include <common>

            uniform float uTime;

            mat2 get2dRotateMatrix(float _angle)
            {
                return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
            }
        \`
    )
    shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        \`
            #include <begin_vertex>

            float angle = (position.y + uTime) * 0.9;
            mat2 rotateMatrix = get2dRotateMatrix(angle);

            transformed.xz = rotateMatrix * transformed.xz;
        \`
    )
}
`),
    P('La **sombra se dibuja con otro material** (el de profundidad), que no sabe nada de tu twist. Por eso hay que darle el mismo retoque. Si lo quitas, la sombra se queda con la forma original.'),
  ),

  item('Solución completa del ejercicio',
    P('Esto es lo que hace el ejercicio del curso: la columna se retuerce según su altura, se anima con el tiempo, la sombra y la luz siguen el giro.'),
    js('modified materials · solución', SOLUTION_CODE),
    callout('remember', 'Dónde va cada cosa', [
      UL([
        '`customUniforms` y el `tick` actualizando `uTime`: en tu `main.js`, como siempre.',
        '`onBeforeCompile` del **material**: `common` (función y uniform), `beginnormal_vertex` (normal) y `begin_vertex` (posición).',
        '`onBeforeCompile` del **depthMaterial**: `common` y `begin_vertex` (no hay normales).',
        '`mesh.customDepthMaterial = depthMaterial`: para que la sombra use el depth modificado.',
      ]),
    ]),
  ),

  item('Si algo falla',
    table(['Síntoma', 'Causa habitual', 'Solución'], [
      ['No cambia **nada**', 'El texto del `replace` no coincide (espacio, `<` o nombre mal escrito) y no se reemplaza', '`console.log(shader.vertexShader)` y copia el `#include` exacto'],
      ['`error: \'angle\' : redefinition`', 'Dos chunks declaran `float angle` y todos se fusionan en **un solo** `main()`', 'Declara `angle` solo una vez o usa nombres distintos'],
      ['`undeclared identifier uTime`', 'Falta `uniform float uTime;` en `<common>` (o en el depth material)', 'Decláralo en **ambos** `onBeforeCompile`'],
      ['La sombra no se retuerce', 'Falta `customDepthMaterial`', 'Crea el `MeshDepthMaterial` con `RGBADepthPacking` y retócalo igual'],
      ['La luz se ve «rara» al girar', 'La normal no ha girado con el vértice', 'Retoca `<beginnormal_vertex>` con la misma rotación'],
      ['`Cannot set properties of null (setting \'visible\')`', '`mesh.customDepthMaterial = null`', 'Para quitarlo usa `undefined`'],
      ['`1` en vez de `1.0`', 'GLSL no convierte `int` a `float` solo', 'Escribe siempre `1.0`, `0.9`…'],
      ['Cambié el shader y no se actualiza', 'Three.js reutiliza el programa ya compilado', '`material.needsUpdate = true` o `customProgramCacheKey`'],
    ]),
    js('ver los errores de la GPU', `
renderer.debug.onShaderError = (gl, program, glVertexShader, glFragmentShader) =>
{
    console.log(gl.getShaderInfoLog(glVertexShader))
    console.log(gl.getShaderInfoLog(glFragmentShader))
}
`),
  ),
);

// La receta en seis pasos como lista numerada
function OL6() {
  return OL([
    '**Engánchate:** `material.onBeforeCompile = (shader) => { ... }`.',
    '**Mira el código:** `console.log(shader.vertexShader)` para ver los `#include` disponibles.',
    '**Enchufa los uniforms:** `shader.uniforms.uTime = customUniforms.uTime`.',
    '**Declara lo tuyo en `<common>`:** `uniform float uTime;` y las funciones (`get2dRotateMatrix`).',
    '**Modifica `transformed` en `<begin_vertex>`** (y la normal en `<beginnormal_vertex>`).',
    '**Repite lo mismo en el `MeshDepthMaterial`** y asígnalo a `mesh.customDepthMaterial`.',
  ]);
}

/* ------------------------------ GLOSARIO ------------------------------ */
const glossSection = () => section('glos', 'Glosario rápido',
  item('',
    table(['Palabra', 'Qué es, en una frase'], [
      ['**Scene**', 'La caja donde metes todo lo que se va a dibujar.'],
      ['**Camera**', 'El punto de vista desde el que se dibuja la escena.'],
      ['**Renderer**', 'El que convierte escena + cámara en píxeles dentro del canvas.'],
      ['**Mesh**', 'Un objeto visible: una Geometry + un Material.'],
      ['**Geometry**', 'La forma: una lista de vértices (y cómo se unen en triángulos).'],
      ['**Material**', 'El aspecto: cómo se pinta cada píxel de la geometría (color, brillo, textura…).'],
      ['**Vértice**', 'Un punto de la geometría, con sus datos (posición, uv, normal…).'],
      ['**Textura**', 'Una imagen que el material usa para colorear u otros efectos.'],
      ['**UV**', 'Coordenadas (de 0 a 1) que dicen qué punto de la imagen toca a cada vértice.'],
      ['**Normal**', 'Flecha perpendicular a la superficie; la luz la usa para saber cuánto ilumina.'],
      ['**Luz**', 'Fuente que ilumina los materiales que reaccionan a la luz.'],
      ['**Shadow map**', 'La «foto desde la luz» que sirve para saber qué está en sombra.'],
      ['**Shader**', 'Un programa pequeño que se ejecuta en la GPU.'],
      ['**Vertex shader**', 'Shader que corre una vez por vértice y decide su posición en pantalla.'],
      ['**Fragment shader**', 'Shader que corre una vez por píxel y decide su color.'],
      ['**Attribute**', 'Dato por vértice que viene de la geometría.'],
      ['**Uniform**', 'Dato igual para todos que le manda tu JavaScript al shader.'],
      ['**Varying**', 'Dato que pasa del vertex al fragment shader, interpolado entre vértices.'],
      ['**Chunk**', 'Un trozo del shader de Three.js, identificado con `#include <nombre>`.'],
      ['**Matriz**', 'Una tabla de números que transforma vectores (giro, escala, proyección…).'],
      ['**Clock**', 'Cronómetro para que la animación dure lo mismo en cualquier ordenador.'],
      ['**Raycaster**', 'Un «rayo invisible» para saber qué objeto está bajo el ratón.'],
    ]),
  ),
);

/* ------------------------------ PÁGINA ------------------------------ */
export default function render(root) {
  const sections = [baseSection(), lightSection(), techSection(), shaderSection(), modSection(), glossSection()];

  let tab = 'all';
  const input = h('input', { class: 'chu-search', type: 'search', placeholder: 'Busca: sombra, uniform, onBeforeCompile, raycaster…', 'aria-label': 'Buscar en la chuleta' });
  const count = h('span', { class: 'chu-count' });
  const empty = h('p', { class: 'chu-empty', hidden: true }, 'Nada coincide con eso. Prueba con otra palabra (por ejemplo «luz» o «uniform»).');
  const tabsEl = h('div', { class: 'chu-tabs', role: 'group', 'aria-label': 'Filtrar por tema' });
  const buttons = TABS.map((t) => {
    const b = h('button', {
      class: 'chu-tab', type: 'button', 'aria-pressed': String(t.id === tab),
      style: t.color ? { '--c': `var(--${t.color})` } : null,
      onClick: () => { tab = t.id; apply(); },
    }, t.label);
    b.dataset.id = t.id;
    tabsEl.append(b);
    return b;
  });

  const cache = new Map();
  const textOf = (el) => { if (!cache.has(el)) cache.set(el, el.textContent.toLowerCase()); return cache.get(el); };

  function apply() {
    const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    sections.forEach((s) => {
      let any = 0;
      s.querySelectorAll('.chu-item').forEach((it) => {
        const ok = words.every((w) => textOf(it).includes(w));
        it.hidden = !ok;
        if (ok) any++;
      });
      s.hidden = !(tab === 'all' || s.dataset.tag === tab) || any === 0;
      if (!s.hidden) shown += any;
    });
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === tab)));
    empty.hidden = shown > 0;
    count.textContent = `${shown} fragmento${shown === 1 ? '' : 's'}`;
  }
  input.addEventListener('input', apply);

  root.append(
    P('Esta página junta **todo el código importante** del curso en un solo sitio. No es para aprender desde cero (para eso están las lecciones), sino para **consultar rápido y copiar**. Usa el buscador o los filtros de arriba.'),
    h('div', { class: 'chu-bar' }, input, tabsEl, count),
    ...sections,
    empty,
  );
  apply();
}
