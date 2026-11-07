# Three.js · cuaderno de repaso

Una web interactiva, en español, para **retomar el curso de Three.js Journey (Bruno Simon)** justo donde se quedó: *Capítulo 4 · Shaders · Lección 31 «Modified materials»*.

No es el curso ni lo sustituye: es mi cuaderno de estudio. Repasa, con demos que se pueden tocar, todo lo que hace falta para poder escribir **desde cero** el ejercicio de *Modified materials* (la columna que se retuerce con luces, sombras y normales correctas).

## Qué contiene

| Bloque | Lecciones |
| --- | --- |
| Empieza aquí | El mapa mental (de JavaScript a píxeles) |
| Cap. 1 · Básicos | Escena y Mesh · Mover/escalar/rotar · Clock · Cámaras y resize · Geometrías · Texturas y UV · Materiales · Debug UI, texto 3D y publicar |
| Cap. 2 · Técnicas clásicas | Luces · Sombras · Partículas, galaxia y scroll |
| Cap. 3 · Avanzado | Físicas, glTF, raycaster, Blender, render realista |
| Cap. 4 · Shaders | Cómo dibuja la GPU · GLSL · Attributes/uniforms/varyings · **Laboratorio de shaders** · Matrices y `mat2` · **Modified materials** (laboratorio guiado + ejercicio con editor) |
| Referencia | **Chuleta de código** con buscador y filtros |

Colores que se repiten en toda la web: cian = geometría, rosa = material, ámbar = luz, violeta = shader. Ejes: X rojo, Y verde, Z azul.

## Formato: tarjetas cortas

Cada lección es una serie de **tarjetas** de 1–2 minutos: una sola idea, primero algo visual (demo, diagrama o código corto) y unas pocas frases. Casi todas acaban con una pregunta de uno de estos tipos:

- **Test** de opción múltiple.
- **Predice y mira**: respondes antes de tocar la demo y luego lo compruebas.
- **Completa el hueco** en una línea de código.
- **Ordena las líneas** de un fragmento.

La explicación más profunda queda plegada en **«Entender más»**, para abrirla solo cuando la quieras. La última tarjeta de cada lección es un **repaso** que vuelve a sacar las preguntas que fallaste o te saltaste. La barra segmentada de arriba marca en verde los aciertos y en rojo los fallos, y se puede tocar para saltar a cualquier tarjeta. También funcionan las flechas ← → del teclado.

Las tarjetas están en `js/lessons/*.js` (cada archivo exporta un array) y el motor que las pinta es `js/cards.js`. La *Chuleta de código* sigue siendo una página de consulta normal.

El progreso (aciertos por tarjeta y lecciones completadas) se guarda en el `localStorage` de tu navegador.

## Móvil y tablet

La web está pensada para usarse también con el dedo:

- **Menú:** en pantallas de menos de 1100 px el índice es un cajón (botón *Índice* en la barra superior; se cierra tocando fuera, con la ✕ o deslizando hacia la izquierda).
- **Demos 3D:** un dedo deslizando **de lado** gira la escena; deslizando **en vertical** sigues bajando por la página (no se queda atrapada); **dos dedos** hacen zoom e inclinan la cámara.
- **Controles:** en móvil y tablet vertical la escena se queda **fija arriba** mientras mueves los sliders de debajo. Botones, sliders y selectores tienen tamaño de dedo (≥ 44 px) y no provocan el zoom de iOS.
- **Editores de código:** letra de 16 px y una barra con los símbolos que cuesta escribir en el teclado táctil (`{ }`, `( )`, `;`, tabulador…).
- **Código de ejemplo:** las líneas no se parten; se desplaza de lado con el dedo.
- Comprobado en 360 × 740, 390 × 844, 844 × 390 (móvil apaisado), 820 × 1180 (tablet vertical) y 1180 × 820 (tablet apaisada).

## Cómo verlo en tu ordenador

Es una web estática (HTML + CSS + JavaScript con módulos). **Necesita un servidor local** porque los navegadores bloquean los módulos si abres `index.html` con doble clic.

Elige una de estas opciones, dentro de la carpeta del proyecto:

```bash
npx serve                      # y abre la dirección que muestre (normalmente http://localhost:3000)
# o bien
python3 -m http.server 8000    # y abre http://localhost:8000
```

También sirve la extensión **Live Server** de VS Code (clic derecho sobre `index.html` → *Open with Live Server*).

## Cómo subirlo a GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `threejs-repaso`).
2. Sube **todo el contenido de esta carpeta** a la rama `main` (incluida la carpeta `vendor/`).
   ```bash
   git init
   git add .
   git commit -m "Cuaderno de repaso de Three.js"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/threejs-repaso.git
   git push -u origin main
   ```
3. En GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main` y carpeta `/ (root)`.
4. Espera un minuto: la web quedará en `https://TU_USUARIO.github.io/threejs-repaso/`.

El archivo `.nojekyll` evita que GitHub Pages procese los archivos con Jekyll. Las rutas son relativas, así que funciona también en subcarpetas.

## Estructura

```
index.html            Página única; carga el importmap de Three.js y js/main.js
css/styles.css        Todo el estilo (tema oscuro, código, demos, laboratorios) y la parte responsive (al final del archivo)
vendor/three/         Three.js r177 copiado en local (sin CDN) + OrbitControls, RoomEnvironment…
js/main.js            Router por hash (#/modified/3 = lección y tarjeta), menú lateral y progreso
js/cards.js           Motor de tarjetas: barra segmentada, preguntas (test, predecir, hueco, ordenar) y repaso
js/progress.js        Progreso guardado en localStorage (lecciones y resultado de cada tarjeta)
js/stage.js           createStage(): escena + cámara + renderer para una demo, con limpieza al cambiar de lección
js/ui.js              Piezas para escribir lecciones: P, H2, codeBlock, demo, quiz, table, callout…
js/lessons/index.js   Lista de lecciones (orden, título, grupo)
js/lessons/NN-*.js    Una lección por archivo; cada una exporta su array de tarjetas
js/lib/modified-lab.js  Motor del laboratorio: compila shaders de verdad y traduce los errores de la GPU
js/lib/modified-ui.js   Explorador de chunks, laboratorio guiado y ejercicio de «Modified materials»
```

## Cómo añadir una lección nueva

1. Crea `js/lessons/19-mi-leccion.js` exportando un array de tarjetas:

   ```js
   import { P, codeBlock, demo } from '../ui.js';

   export default function cards() {
     return [
       {
         t: 'Título corto de la tarjeta',
         body: () => [ /* primero lo visual: demo(), figure(), codeBlock()… */ P('Dos o tres frases.') ],
         more: () => [ P('Lo que va plegado en «Entender más».') ],          // opcional
         check: { type: 'mc', q: '¿Pregunta?', options: ['A', 'B'], answer: 1, why: 'Por qué.' }, // opcional
       },
     ];
   }
   ```

   Tipos de `check`: `mc` (test), `predict` (igual que `mc`, para responder antes de tocar la demo), `fill` (`pre`, `post`, `answer`, `accept`) y `order` (`lines` en el orden correcto; se barajan solas). La tarjeta de repaso la añade el motor.

2. Regístrala en `js/lessons/index.js`, dentro del grupo que toque:

   ```js
   { id: 'mi-leccion', title: 'Mi lección', sub: 'Una frase.', min: 10, load: () => import('./19-mi-leccion.js') },
   ```

3. Recarga: aparece en el menú y en la ruta `#/mi-leccion`.

`demo({ title, aspect, caption, setup })` crea una demo con canvas, panel de controles y limpieza automática; mira `js/lessons/15-variables.js` como ejemplo con los cuatro tipos de pregunta y `js/lessons/18-modified.js` como el más completo.

## Versión de Three.js

Va fijada a la **r177** dentro de `vendor/`. Si en el futuro quieres actualizarla, sustituye esa carpeta por la de la nueva versión (mismos archivos y rutas) y comprueba las lecciones de luces y de *Modified materials*, que son las que más dependen de detalles internos (nombres de chunks).

## Créditos

Material de estudio personal basado en el curso [Three.js Journey](https://threejs-journey.com) de Bruno Simon. El código de Three.js (licencia MIT) está en `vendor/three/`.
