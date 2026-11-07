import { P, UL, callout, codeBlock, demo, table, eq } from '../ui.js';
import { canvas2d } from '../stage.js';

const RED = [255, 90, 90];
const GREEN = [91, 214, 138];
const BLUE = [90, 141, 255];

function bary(px, py, a, b, c) {
  const d = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (Math.abs(d) < 1e-9) return [-1, -1, -1];
  const w0 = ((b.y - c.y) * (px - c.x) + (c.x - b.x) * (py - c.y)) / d;
  const w1 = ((c.y - a.y) * (px - c.x) + (a.x - c.x) * (py - c.y)) / d;
  return [w0, w1, 1 - w0 - w1];
}

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Por qué existe la GPU',
      body: () => [
        callout('analogy', 'Un profesor contra un millón de ayudantes', [
          P('Una **CPU** es un profesor brillante que corrige exámenes uno a uno, rapidísimo y capaz de cualquier cosa. Una **GPU** es un millón de ayudantes que solo saben una tarea sencilla, pero la hacen **todos a la vez**.'),
        ]),
        eq(`pantalla Full HD = 1920 × 1080 = 2 073 600 píxeles
× 60 fotogramas por segundo
= ~124 000 000 de colores que decidir CADA segundo`),
        P('Eso solo se puede hacer **en paralelo**. A cambio, cada «ayudante» ejecuta código corto y sencillo y **no puede hablar con los demás**. Esa limitación define cómo se escriben los shaders.'),
      ],
      check: {
        type: 'mc',
        q: 'Duplicas el pixel ratio del renderer. ¿Cuánto más trabajo tendrá el fragment shader?',
        options: ['El doble', 'El cuádruple', 'Igual'],
        answer: 1,
        why: 'El pixel ratio multiplica ancho **y** alto: 2 × 2 = 4 veces más píxeles, y hay una ejecución por píxel.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'Las cuatro etapas del pipeline',
      body: () => [
        P('Cuando llamas a `renderer.render(scene, camera)`, la GPU hace siempre esto, en este orden. Los shaders son los dos «huecos» donde puedes meter tu código:'),
        table(['Etapa', 'Quién', 'Qué hace', 'Veces'], [
          ['1. **Vertex shader**', '**Tú**', 'Decide **dónde cae en pantalla** cada vértice', '1 por **vértice**'],
          ['2. Rasterización', 'GPU', 'Une vértices en triángulos y marca **qué píxeles cubre** cada uno (los *fragmentos*)', 'por triángulo'],
          ['3. **Fragment shader**', '**Tú**', 'Decide **de qué color** se pinta cada fragmento', '1 por **píxel cubierto**'],
          ['4. Pruebas y mezcla', 'GPU', 'Depth test, transparencias, y escribe el píxel en el canvas', 'por píxel'],
        ]),
      ],
      more: () => [
        callout('idea', 'Dos ideas para llevarte', [
          UL([
            'El vertex shader decide *dónde*; el fragment shader decide *de qué color*. Dos programas distintos, trabajos distintos.',
            'El vertex corre pocas veces (miles de vértices); el fragment, **millones** (cada píxel). El trabajo pesado siempre acaba en el fragment.',
          ]),
        ]),
      ],
      check: {
        type: 'mc',
        q: 'Un modelo tiene 1 000 vértices y ocupa 500 000 píxeles en pantalla. ¿Cuántas veces corre cada shader?',
        options: ['Vertex: 1 000 · Fragment: 500 000', 'Vertex: 500 000 · Fragment: 1 000', 'Los dos 500 000'],
        answer: 0,
        why: 'Una por vértice y una por píxel cubierto. Por eso un shader costoso se nota sobre todo en el fragment.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Una GPU de juguete, con números',
      body: () => [
        demo({
          title: 'Del triángulo a los píxeles',
          aspect: '4 / 3',
          caption: 'Recorre los pasos 1 → 2 → 3 con los botones y **arrastra los vértices**. En el paso 3, toca un píxel (o pon el cursor) para ver los números con los que el fragment shader decidió su color.',
          setup({ stageEl, panel }) {
            const st = {
              step: 3,
              N: 14,
              v: [{ x: -0.72, y: -0.62, c: RED }, { x: 0.05, y: 0.78, c: GREEN }, { x: 0.76, y: -0.5, c: BLUE }],
              hover: null,
              drag: -1,
            };
            let ui;
            let geom = { ox: 0, oy: 0, size: 100 };

            const toPx = (x, y) => [geom.ox + ((x + 1) / 2) * geom.size, geom.oy + ((1 - y) / 2) * geom.size];
            const fromPx = (px, py) => [((px - geom.ox) / geom.size) * 2 - 1, 1 - ((py - geom.oy) / geom.size) * 2];

            const draw = (ctx, w, h) => {
              const size = Math.min(w, h) - 40;
              geom = { ox: (w - size) / 2, oy: (h - size) / 2, size };
              const { N, step, v } = st;
              const cell = size / N;
              ctx.fillStyle = '#181b22';
              ctx.fillRect(geom.ox, geom.oy, size, size);

              let covered = 0;
              for (let j = 0; j < N; j++) {
                for (let i = 0; i < N; i++) {
                  const cx = ((i + 0.5) / N) * 2 - 1;
                  const cy = 1 - ((j + 0.5) / N) * 2;
                  const [w0, w1, w2] = bary(cx, cy, v[0], v[1], v[2]);
                  if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                    covered++;
                    if (step >= 3) {
                      const col = [0, 1, 2].map((k) => Math.round(w0 * v[0].c[k] + w1 * v[1].c[k] + w2 * v[2].c[k]));
                      ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
                      ctx.fillRect(geom.ox + i * cell, geom.oy + j * cell, cell + 0.5, cell + 0.5);
                    } else if (step === 2) {
                      ctx.fillStyle = 'rgba(76,201,224,0.55)';
                      ctx.fillRect(geom.ox + i * cell + 1, geom.oy + j * cell + 1, cell - 2, cell - 2);
                    }
                  }
                }
              }
              ctx.strokeStyle = step >= 2 ? '#3a4152' : '#2a303c';
              ctx.lineWidth = 1;
              ctx.beginPath();
              for (let k = 0; k <= N; k++) {
                ctx.moveTo(geom.ox + k * cell, geom.oy); ctx.lineTo(geom.ox + k * cell, geom.oy + size);
                ctx.moveTo(geom.ox, geom.oy + k * cell); ctx.lineTo(geom.ox + size, geom.oy + k * cell);
              }
              ctx.stroke();
              ctx.strokeStyle = '#4a5266';
              ctx.strokeRect(geom.ox, geom.oy, size, size);

              const pts = v.map((p) => toPx(p.x, p.y));
              if (step <= 2) {
                ctx.setLineDash([6, 5]);
                ctx.strokeStyle = '#97a0b4';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(...pts[0]); ctx.lineTo(...pts[1]); ctx.lineTo(...pts[2]); ctx.closePath();
                ctx.stroke();
                ctx.setLineDash([]);
              }

              if (st.hover && step >= 2) {
                const { i, j } = st.hover;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeRect(geom.ox + i * cell + 1, geom.oy + j * cell + 1, cell - 2, cell - 2);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(geom.ox + (i + 0.5) * cell, geom.oy + (j + 0.5) * cell, 2.5, 0, Math.PI * 2);
                ctx.fill();
              }

              v.forEach((p, k) => {
                const [px, py] = pts[k];
                ctx.fillStyle = `rgb(${p.c.join(',')})`;
                ctx.strokeStyle = '#0d0f13';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
                ctx.fillStyle = '#e4e7ee';
                ctx.font = '600 12.5px ui-monospace, monospace';
                ctx.textAlign = px > w / 2 ? 'right' : 'left';
                ctx.fillText(`v${k} (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`, px + (px > w / 2 ? -14 : 14), py + (k === 1 ? -12 : 20));
              });
              st.covered = covered;
            };

            const api = canvas2d(stageEl, draw);
            const canvas = api.canvas;
            canvas.style.touchAction = 'pan-y';
            canvas.style.cursor = 'crosshair';
            const coarse = window.matchMedia?.('(pointer: coarse)').matches;

            const info = () => {
              const { step, N, covered } = st;
              let txt;
              if (step === 1) txt = `PASO 1 · Vertex shader\nSe ejecutó 3 veces (una por\nvértice) y decidió dónde cae\ncada vértice, en coordenadas\nde -1 a 1.\n\nArrastra los puntos: es como\ncambiar el atributo position.`;
              else if (step === 2) txt = `PASO 2 · Rasterización\nLa GPU comprueba cada píxel\n(su centro) y marca los que\nquedan DENTRO del triángulo:\n\n${covered} píxeles de ${N * N}\n\nEstos son los «fragmentos».`;
              else txt = `PASO 3 · Fragment shader\nSe ejecutó ${covered} veces, una por\nfragmento (todas a la vez).\nCada una mezcló los colores de\nlos 3 vértices según la cercanía.\n\n${coarse ? 'Toca un píxel.' : 'Pon el cursor sobre un píxel.'}`;
              ui.readout('info', txt);
            };
            const detail = () => {
              if (!st.hover || st.step < 2) { ui.readout('pix', coarse ? 'Toca un píxel de la cuadrícula\npara verlo por dentro.' : 'Cursor sobre la cuadrícula\npara ver un píxel.'); return; }
              const { i, j } = st.hover;
              const cx = ((i + 0.5) / st.N) * 2 - 1;
              const cy = 1 - ((j + 0.5) / st.N) * 2;
              const [w0, w1, w2] = bary(cx, cy, st.v[0], st.v[1], st.v[2]);
              const inside = w0 >= 0 && w1 >= 0 && w2 >= 0;
              if (!inside) { ui.readout('pix', `Píxel (${i}, ${j})\ncentro (${cx.toFixed(2)}, ${cy.toFixed(2)})\n\nFUERA del triángulo:\nno hay fragmento, el fragment\nshader NO se ejecuta aquí.`); return; }
              const col = [0, 1, 2].map((k) => Math.round(w0 * st.v[0].c[k] + w1 * st.v[1].c[k] + w2 * st.v[2].c[k]));
              ui.readout('pix', `Píxel (${i}, ${j})\ncentro (${cx.toFixed(2)}, ${cy.toFixed(2)})\n\npesos (varying):\n  v0 rojo   ${w0.toFixed(2)}\n  v1 verde  ${w1.toFixed(2)}\n  v2 azul   ${w2.toFixed(2)}\n  suma      ${(w0 + w1 + w2).toFixed(2)}\n\ncolor = pesos × colores\n  rgb(${col.join(', ')})`);
            };
            const refresh = () => { api.redraw(); info(); detail(); };
            const setStep = (s) => {
              st.step = s;
              [1, 2, 3].forEach((k) => ui.refs[`s${k}`].input.classList.toggle('primary', k === s));
              refresh();
            };

            const pointer = (e) => {
              const r = canvas.getBoundingClientRect();
              return [e.clientX - r.left, e.clientY - r.top];
            };
            const nearVertex = (px, py, radius) => st.v.findIndex((p) => { const [x, y] = toPx(p.x, p.y); return Math.hypot(x - px, y - py) < radius; });
            const hoverAt = (px, py) => {
              const i = Math.floor(((px - geom.ox) / geom.size) * st.N);
              const j = Math.floor(((py - geom.oy) / geom.size) * st.N);
              st.hover = i >= 0 && j >= 0 && i < st.N && j < st.N ? { i, j } : null;
            };
            canvas.addEventListener('touchstart', (e) => {
              const t = e.touches[0];
              const r = canvas.getBoundingClientRect();
              if (e.touches.length === 1 && nearVertex(t.clientX - r.left, t.clientY - r.top, 30) >= 0) e.preventDefault();
            }, { passive: false });
            canvas.addEventListener('pointerdown', (e) => {
              const [px, py] = pointer(e);
              st.drag = nearVertex(px, py, e.pointerType === 'mouse' ? 18 : 30);
              if (st.drag >= 0) canvas.setPointerCapture(e.pointerId);
              else { hoverAt(px, py); refresh(); }
            });
            canvas.addEventListener('pointermove', (e) => {
              const [px, py] = pointer(e);
              if (st.drag >= 0) {
                const [x, y] = fromPx(px, py);
                st.v[st.drag].x = Math.max(-1, Math.min(1, x));
                st.v[st.drag].y = Math.max(-1, Math.min(1, y));
              }
              hoverAt(px, py);
              refresh();
            });
            canvas.addEventListener('pointerup', () => { st.drag = -1; });
            canvas.addEventListener('pointercancel', () => { st.drag = -1; });
            canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { st.hover = null; refresh(); } });

            ui = panel([
              { type: 'button', id: 's1', label: '1 · Vertex', onClick: () => setStep(1) },
              { type: 'button', id: 's2', label: '2 · Rasterizar', onClick: () => setStep(2) },
              { type: 'button', id: 's3', label: '3 · Fragment', onClick: () => setStep(3) },
              { type: 'range', label: 'Resolución (píxeles por lado)', min: 6, max: 32, step: 1, value: st.N, onInput: (v) => { st.N = v; if (ui) refresh(); } },
              { type: 'readout', id: 'info' },
              { type: 'readout', id: 'pix' },
            ], { initial: false });
            setStep(3);
          },
        }),
        P('Lo del paso 3 es **interpolación**: cada color pertenece a un vértice, y la GPU reparte los valores entre los píxeles según lo cerca que estén de cada uno (los «pesos»). Es exactamente lo que hará un **varying** dentro de dos lecciones.'),
      ],
      check: {
        type: 'mc',
        q: 'Un triángulo tiene un vértice rojo, uno verde y uno azul. ¿Por qué el centro sale grisáceo?',
        options: ['El fragment shader lo decide al azar', 'La GPU interpola los 3 colores según la cercanía a cada vértice', 'Falta una luz'],
        answer: 1,
        why: 'En el centro, los tres pesos valen ≈ 0.33: un tercio de cada color. Compruébalo en la demo tocando el píxel central.',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'De 3D a 2D: las tres matrices',
      body: () => [
        P('La posición del vértice llega en coordenadas **del modelo** (la esquina de la caja). El vertex shader la convierte en posición de pantalla con tres cambios de sistema, cada uno una **matriz**:'),
        table(['Matriz', 'Qué hace', 'Analogía'], [
          ['`modelMatrix`', 'Aplica `position`, `rotation` y `scale` del Mesh → coords del **mundo**', 'Colocar el atrezo en el plató'],
          ['`viewMatrix`', 'Mueve el mundo para que la cámara quede en el origen → coords de **cámara**', 'Mirar desde la cámara'],
          ['`projectionMatrix`', 'Aplica la perspectiva (fov, near, far): lo lejano se encoge → −1…1', 'La lente'],
        ]),
        eq(`Perspectiva (idea simplificada): x_pantalla = x / distancia

punto (1, 1) a distancia 2  →  (0.50, 0.50)
punto (1, 1) a distancia 4  →  (0.25, 0.25)   ← más lejos = más pequeño`),
      ],
      check: {
        type: 'fill',
        q: '¿Qué matriz hace que lo lejano se vea más pequeño?',
        pre: 'vec4 p = ', post: ' * viewPosition',
        answer: 'projectionMatrix',
        accept: ['projectionMatrix'],
        placeholder: 'matriz',
        size: 20,
        why: 'La `projectionMatrix` aplica la perspectiva de la cámara (fov, near, far). Las otras dos solo colocan: objeto → mundo → cámara.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'Tus dos primeros shaders',
      body: () => [
        codeBlock({
          title: 'vertex.glsl',
          lang: 'glsl',
          code: `
void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
}`,
          notes: [
            ['void main()', 'Todo shader empieza en `main()`, una vez **por vértice**. No devuelve nada: escribe en una variable especial.'],
            ['vec4 modelPosition', '`position` es el atributo del vértice (3 números); el `1.0` extra permite que las matrices 4×4 también **muevan** el punto. Multiplicar por `modelMatrix` lo coloca en el mundo.'],
            ['gl_Position = projectedPosition', 'La variable especial que la GPU espera: la posición final del vértice. Sin esta línea no se dibuja nada.'],
          ],
        }),
        codeBlock({
          title: 'fragment.glsl',
          lang: 'glsl',
          code: `
void main()
{
    gl_FragColor = vec4(0.96, 0.45, 0.71, 1.0);
}`,
          notes: [
            ['gl_FragColor', 'La salida del fragment shader: el color del píxel. `vec4` = rojo, verde, azul, alfa, de 0.0 a 1.0. Aquí, rosa: **todos** los píxeles del objeto, iguales.'],
          ],
        }),
      ],
      check: {
        type: 'mc',
        q: '¿Qué hace `gl_Position`?',
        options: ['Guarda el color final del píxel', 'Es la posición final del vértice que el vertex shader entrega a la GPU', 'Es la posición de la cámara'],
        answer: 1,
        why: 'Es la salida obligatoria del vertex shader. El color del píxel es `gl_FragColor`, en el fragment.',
      },
    },
  ];
}
