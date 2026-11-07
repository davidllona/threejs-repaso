import { P, callout, codeBlock, table } from '../ui.js';

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Debug UI con lil-gui',
      body: () => [
        P('Probar valores a ojo (cambiar, recargar, cambiar…) es lento. **lil-gui** crea un panel con sliders y checkboxes que tocan tus objetos en vivo — como los paneles de las demos de esta web, pero en una línea por control.'),
        codeBlock({
          title: 'script.js',
          code: `
import GUI from 'lil-gui'

const gui = new GUI({ title: 'Ajustes', width: 300 })
const debugObject = { color: '#f472b6', spin: () => { mesh.rotation.y += 3 } }

gui.add(mesh.position, 'y').min(-3).max(3).step(0.01).name('altura')
gui.add(material, 'wireframe')
gui.addColor(debugObject, 'color').onChange((value) => material.color.set(value))
gui.add(debugObject, 'spin')

gui.hide()   // la tecla 'h' lo muestra/oculta`,
          notes: [
            ["gui.add(mesh.position, 'y')", 'Recibe **el objeto** y **el nombre** de la propiedad. Según su tipo crea el control: número → slider, booleano → checkbox, función → botón.'],
            ['const debugObject', 'Objeto auxiliar para lo que no es una propiedad directa (un color como texto, una función).'],
            ['gui.addColor', 'Los colores van aparte: lil-gui edita el string y tú lo trasladas al `THREE.Color` con `.set()` en `onChange`.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '¿Por qué un color necesita `addColor` + `onChange` en vez de un simple `add`?',
        options: [
          'Porque lil-gui no admite colores',
          'Porque lil-gui edita un string hex y el `THREE.Color` del material hay que actualizarlo aparte con `.set()`',
          'Porque los colores son funciones',
        ],
        answer: 1,
        why: 'lil-gui guarda `#ff00aa` como texto en tu objeto auxiliar; en `onChange` lo pasas al material con `material.color.set(value)`.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Texto 3D',
      body: () => [
        P('`TextGeometry` genera letras con volumen a partir de una fuente en formato **typeface.json**. Se carga de forma asíncrona, así que todo lo que use la fuente vive dentro del callback:'),
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
            ['fontLoader.load', 'Asíncrono: el texto se crea cuando la fuente ya está descargada.'],
            ['curveSegments: 6', 'Segmentos de las curvas de las letras. Cuantos menos, más ligero.'],
            ['bevelEnabled: true', 'El bisel redondea los bordes y atrapa la luz; los tres ajustes siguientes lo configuran.'],
            ['textGeometry.center()', 'Mueve **los vértices** para que el centro del texto quede en (0,0,0): girarlo y colocarlo pasa a ser intuitivo.'],
          ],
        }),
      ],
      more: () => [
        callout('warn', 'El texto 3D es caro', [
          P('Cada letra son muchos triángulos (más con bisel y `curveSegments` altos). Para títulos, bien; para párrafos, usa HTML superpuesto. Y el truco de los 300 donuts del curso: **una sola geometría y un solo material** compartidos por los 300 Mesh — solo cambian `position`, `rotation` y `scale`.'),
        ]),
      ],
      check: {
        type: 'mc',
        q: '¿Para qué sirve `textGeometry.center()`?',
        options: [
          'Para centrar la cámara en el texto',
          'Para mover los vértices y que el centro del texto quede en el origen',
          'Para alinear el texto a la izquierda',
        ],
        answer: 1,
        why: 'Sin él, el texto arranca en el origen y crece hacia un lado, y rotarlo da vueltas raras. Centrado, gira sobre sí mismo.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Publicar el proyecto',
      body: () => [
        P('El curso usa **Vite**: servidor con recarga instantánea durante el desarrollo y, al final, un empaquetado optimizado listo para subir.'),
        table(['Comando', 'Para qué'], [
          ['`npm install`', 'Instala las dependencias del `package.json`.'],
          ['`npm run dev`', 'Servidor local con recarga en caliente: el del día a día.'],
          ['`npm run build`', 'Genera `dist/`: la versión final optimizada.'],
        ]),
        P('`dist/` es una web estática normal: Netlify, Vercel, Cloudflare Pages o GitHub Pages. En GitHub Pages, si la web vive en `usuario.github.io/mi-repo/`, añade `base: \'/mi-repo/\'` en `vite.config.js` para que las rutas funcionen.'),
      ],
      more: () => [
        callout('remember', 'Esta misma web', [
          P('Este cuaderno **no usa Vite**: Three.js vive en `vendor/` y las lecciones son módulos ES normales, así que se sirve la carpeta tal cual. Por eso la subiste a GitHub Pages sin compilar nada.'),
        ]),
      ],
      check: {
        type: 'fill',
        q: 'Tu web vivirá en `usuario.github.io/mi-repo/`. Completa la opción de `vite.config.js`:',
        pre: "base: '", post: "'",
        answer: '/mi-repo/',
        accept: ['/mi-repo/', '/mi-repo'],
        placeholder: 'ruta',
        size: 14,
        why: 'Sin `base`, el build busca los assets en la raíz del dominio (`/assets/...`) y en GitHub Pages de proyecto eso da 404.',
      },
    },
  ];
}
