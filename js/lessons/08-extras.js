import { P, H2, H3, UL, callout, codeBlock, table, quiz } from '../ui.js';

export default function render(root) {
  root.append(
    P('Tres lecciones cortas que no cambian cómo piensas en 3D, pero que usarás en casi todos los proyectos: un panel para tocar valores en vivo, texto en 3D y cómo publicar.'),

    H2('Debug UI con lil-gui'),
    P('Probar valores a ojo (`mesh.position.y = 0.37`, recargar, ajustar, recargar…) es lento. **lil-gui** crea un panelito con sliders, checkboxes y selectores que modifican propiedades de tus objetos en tiempo real. Es la versión que ves en las demos de esta web, pero en una sola línea por control.'),
    codeBlock({
      title: 'script.js',
      code: `
import GUI from 'lil-gui'

const gui = new GUI({ title: 'Ajustes', width: 300 })
const debugObject = { color: '#f472b6', spin: () => { mesh.rotation.y += 3 } }

gui.add(mesh.position, 'y').min(-3).max(3).step(0.01).name('altura')
gui.add(mesh, 'visible')
gui.add(material, 'wireframe')
gui.addColor(debugObject, 'color').onChange((value) => material.color.set(value))
gui.add(debugObject, 'spin')

gui.hide()   // y con la tecla 'h' se muestra/oculta`,
      notes: [
        ['import GUI', 'La librería se instala aparte: `npm install lil-gui`.'],
        ['new GUI(', 'Crea el panel. Las opciones (título, ancho…) son opcionales.'],
        ['const debugObject', 'Un objeto auxiliar para cosas que no son propiedades directas (un color como string, una función…).'],
        ["gui.add(mesh.position, 'y')", 'Recibe **el objeto** y **el nombre de la propiedad** (como texto). Según el tipo de la propiedad, crea el control adecuado: un número → slider; un booleano → checkbox; una función → botón.'],
        ["gui.add(mesh, 'visible')", 'Un booleano: crea un checkbox para mostrar/ocultar el objeto.'],
        ["gui.add(material, 'wireframe')", 'Otro checkbox, esta vez para la propiedad del material.'],
        ["gui.addColor", 'Los colores necesitan `addColor` y se guardan como string hexadecimal en `debugObject`. `THREE.Color` los convierte, por eso se usa `onChange` para trasladar el valor con `.set()`.'],
        ["gui.add(debugObject, 'spin')", 'Si la propiedad es una función, crea un botón que la ejecuta al pulsarlo.'],
        ['gui.hide()', 'Muy útil para dejar el panel oculto al enseñar el proyecto.'],
      ],
    }),

    H2('Texto 3D'),
    P('Three.js puede crear una geometría con la forma de un texto: `TextGeometry`. Necesita una **fuente en formato typeface.json** (se convierte desde una fuente normal con herramientas como *facetype.js*) y dos importaciones de la carpeta `examples`.'),
    codeBlock({
      title: 'script.js',
      code: `
import { FontLoader } from 'three/addons/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'

const fontLoader = new FontLoader()
fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
  const textGeometry = new TextGeometry('Hola Three.js', {
    font: font,
    size: 0.5,
    depth: 0.2,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 4,
  })
  textGeometry.center()

  const text = new THREE.Mesh(textGeometry, material)
  scene.add(text)
})`,
      notes: [
        ['import { FontLoader }', 'Carga archivos de fuente en formato typeface.json.'],
        ['import { TextGeometry }', 'La geometría que genera las letras en 3D.'],
        ['fontLoader.load', 'Carga la fuente de forma asíncrona. Todo el código que use la fuente va **dentro** de esta función de callback.'],
        ["new TextGeometry('Hola Three.js'", 'El texto, y a continuación sus ajustes en un objeto.'],
        ['size: 0.5', 'Tamaño de las letras.'],
        ['depth: 0.2', 'Cuánto grosor tiene el texto (antes se llamaba `height` en versiones antiguas).'],
        ['curveSegments: 6', 'Cuántos segmentos usa para las curvas de las letras. **Cada punto cuenta**: cuanto menos, más ligero.'],
        ['bevelEnabled: true', 'Un bisel: bordes redondeados para que atrapen la luz. Los siguientes tres ajustes configuran su grosor, tamaño y suavidad.'],
        ['textGeometry.center()', 'Por defecto el texto empieza en el origen y crece hacia la derecha. `center()` mueve **los vértices** para que el centro del texto quede en (0, 0, 0). Así girar y colocar el texto es intuitivo.'],
        ['new THREE.Mesh(textGeometry, material)', 'Como siempre: geometría + material = Mesh.'],
      ],
    }),
    callout('warn', 'El texto 3D es caro', [
      P('Cada letra son muchos triángulos (más con bisel y `curveSegments` altos). Úsalo para títulos cortos, no para párrafos. Si ves que va lento, baja `curveSegments` y `bevelSegments`, o usa texto HTML superpuesto, que es gratis.'),
    ]),
    callout('tip', 'Reutiliza geometrías y materiales', [
      P('El ejemplo clásico del curso rodea el texto de cientos de donuts. **Una sola `TorusGeometry` y un solo material** sirven para los 300 Mesh: lo único que cambia entre ellos es `position`, `rotation` y `scale`. Esto reduce muchísimo el consumo de memoria.'),
    ]),

    H2('Publicar tu proyecto (Go live)'),
    P('El curso trabaja con **Vite**: un servidor de desarrollo que recarga al instante y que, al terminar, empaqueta tu proyecto en archivos estáticos listos para subir. Los comandos que conviene recordar:'),
    table(['Comando', 'Para qué sirve'], [
      ['`npm install`', 'Instala las dependencias del `package.json` (three, lil-gui, vite…).'],
      ['`npm run dev`', 'Arranca el servidor local con recarga en caliente (el del día a día).'],
      ['`npm run build`', 'Genera la carpeta `dist/` con la versión final optimizada.'],
    ]),
    P('La carpeta `dist/` es una web normal: puedes subirla a Netlify, Vercel, Cloudflare Pages o **GitHub Pages**. Para este último, si tu web vive en `usuario.github.io/mi-repo/` (y no en la raíz), añade en `vite.config.js` la opción `base: \'/mi-repo/\'` para que las rutas a los assets sean correctas.'),
    callout('remember', 'Esta misma web', [
      P('Este cuaderno **no usa Vite**: Three.js está en la carpeta `vendor/` y las lecciones son módulos ES normales, así que basta con servir la carpeta tal cual (mira el README para GitHub Pages). Así no hay nada que compilar.'),
    ]),

    quiz([
      {
        q: 'Con lil-gui, ¿por qué un color necesita `addColor` y un `onChange`?',
        options: ['Porque lil-gui no admite colores', 'Porque el valor que edita es un string/hex y `THREE.Color` hay que actualizarlo con `.set()`', 'Porque los colores son funciones', 'No lo necesita'],
        answer: 1,
        why: 'lil-gui guarda `#ff00aa` como texto en tu objeto auxiliar; el color del material es un `THREE.Color`, así que en `onChange` lo trasladas con `material.color.set(value)`.',
      },
      {
        q: '¿Para qué sirve `textGeometry.center()`?',
        options: ['Para hacer el texto más grande', 'Para mover los vértices y que el centro del texto quede en el origen', 'Para centrar la cámara', 'Para activar el bisel'],
        answer: 1,
        why: 'Sin él, el texto arranca en el origen y se extiende hacia un lado; centrarlo hace que rotar y colocar el texto sea natural.',
      },
    ]),
  );
}
