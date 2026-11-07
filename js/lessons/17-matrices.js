import { h, P, UL, callout, codeBlock, liveCode, demo, table, eq } from '../ui.js';
import { canvas2d } from '../stage.js';

const RAD = Math.PI / 180;

/* ---------- Dibujo común: rejilla de -R a R ---------- */
function plane2d(ctx, w, hgt, R) {
  const s = Math.min(w, hgt) / (2 * R);
  const cx = w / 2, cy = hgt / 2;
  const X = (x) => cx + x * s;
  const Y = (y) => cy - y * s;
  ctx.fillStyle = '#181b22'; ctx.fillRect(0, 0, w, hgt);
  ctx.lineWidth = 1;
  for (let i = -Math.floor(R); i <= Math.floor(R); i++) {
    ctx.strokeStyle = '#2a303c';
    ctx.beginPath(); ctx.moveTo(X(i), 0); ctx.lineTo(X(i), hgt); ctx.moveTo(0, Y(i)); ctx.lineTo(w, Y(i)); ctx.stroke();
  }
  return { s, cx, cy, X, Y };
}
function arrow(ctx, x0, y0, x1, y1, color, width = 2.5) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 10 * Math.cos(a - 0.4), y1 - 10 * Math.sin(a - 0.4));
  ctx.lineTo(x1 - 10 * Math.cos(a + 0.4), y1 - 10 * Math.sin(a + 0.4));
  ctx.closePath(); ctx.fill();
}
const label = (ctx, txt, x, y, color = '#e4e7ee', align = 'left') => {
  ctx.font = '600 12.5px ui-monospace, monospace'; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(txt, x, y);
};

/* ---------- Demo 1: la matriz mat2 en acción ---------- */
function rotateDemo() {
  return demo({
    title: 'Una matriz mat2 girando un punto',
    aspect: '1 / 1',
    caption: 'Las **flechas rojas y verdes** son las columnas de la matriz: dicen adónde van a parar los ejes (1, 0) y (0, 1). Cualquier punto es «x veces la flecha roja + y veces la flecha verde». Por eso una matriz de giro gira **todo** igual.',
    setup({ stageEl, panel }) {
      const st = { a: 40, px: 1.5, py: 0.5 };
      let ui;
      const code = liveCode({ title: 'lo que calcula la GPU', lang: 'glsl' });
      const calc = () => {
        const a = st.a * RAD, c = Math.cos(a), s = Math.sin(a);
        return { a, c, s, x: c * st.px + s * st.py, y: -s * st.px + c * st.py };
      };
      const draw = (ctx, w, hgt) => {
        const R = 2.4;
        const { s: sc, X, Y } = plane2d(ctx, w, hgt, R);
        const { a, c, s, x, y } = calc();
        ctx.strokeStyle = '#3a4152'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), hgt); ctx.stroke();
        ctx.setLineDash([5, 5]); ctx.strokeStyle = '#4a5266';
        ctx.beginPath(); ctx.arc(X(0), Y(0), sc, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);

        // columnas de la matriz
        arrow(ctx, X(0), Y(0), X(c), Y(-s), '#ff5a5a');
        arrow(ctx, X(0), Y(0), X(s), Y(c), '#5bd65b');
        label(ctx, 'columna 1', X(c) + (c >= 0 ? 8 : -8), Y(-s) + (-s >= 0 ? -8 : 16), '#ff8a8a', c >= 0 ? 'left' : 'right');
        label(ctx, 'columna 2', X(s) + (s >= 0 ? 8 : -8), Y(c) + (c >= 0 ? -8 : 16), '#8be08b', s >= 0 ? 'left' : 'right');

        // arco entre P y P'
        const r = Math.hypot(st.px, st.py), a0 = Math.atan2(st.py, st.px);
        ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(X(0), Y(0), r * sc, -a0, -a0 + a, a < 0); ctx.stroke(); ctx.setLineDash([]);

        // P y P'
        ctx.strokeStyle = '#4c6de0aa'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(st.px), Y(st.py)); ctx.stroke();
        ctx.strokeStyle = '#f472b6aa';
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(x), Y(y)); ctx.stroke();
        ctx.fillStyle = '#6c8cff'; ctx.beginPath(); ctx.arc(X(st.px), Y(st.py), 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(X(x), Y(y), 7, 0, Math.PI * 2); ctx.fill();
        label(ctx, 'P', X(st.px) + 10, Y(st.py) - 8, '#9db4ff');
        label(ctx, "P' = M × P", X(x) + 10, Y(y) - 8, '#ff9ccd');
        label(ctx, 'x', w - 14, Y(0) - 8, '#8b94a8', 'right');
        label(ctx, 'y', X(0) + 8, 16, '#8b94a8');
      };
      const api = canvas2d(stageEl, draw);

      const refresh = () => {
        const { a, c, s, x, y } = calc();
        const f = (v) => (v >= 0 ? ' ' : '') + v.toFixed(3);
        const g = (v) => (v >= 0 ? '' : '') + v.toFixed(2);
        ui?.readout('m', `ángulo = ${st.a}° = ${a.toFixed(3)} rad\ncos = ${f(c)}   sin = ${f(s)}\n\n      | ${f(c)}  ${f(s)} |\nM  =  | ${f(-s)}  ${f(c)} |\n\nP  = (${st.px.toFixed(2)}, ${st.py.toFixed(2)})\nx' = ${g(c)}·${st.px.toFixed(1)} + ${g(s)}·${st.py.toFixed(1)} = ${g(x)}\ny' = ${g(-s)}·${st.px.toFixed(1)} + ${g(c)}·${st.py.toFixed(1)} = ${g(y)}`);
        code.set(`
mat2 rotateMatrix = get2dRotateMatrix(${a.toFixed(3)});
// = mat2(${c.toFixed(3)}, ${(-s).toFixed(3)}, ${s.toFixed(3)}, ${c.toFixed(3)});

vec2 p = vec2(${st.px.toFixed(2)}, ${st.py.toFixed(2)});
vec2 rotated = rotateMatrix * p;
// = vec2(${x.toFixed(3)}, ${y.toFixed(3)})`);
        api.redraw();
      };
      ui = panel([
        { type: 'range', id: 'a', label: 'Ángulo (grados)', min: -180, max: 180, step: 1, value: st.a, decimals: 0, onInput: (v) => { st.a = v; if (ui) refresh(); } },
        { type: 'range', id: 'px', label: 'P.x', min: -2, max: 2, step: 0.1, value: st.px, onInput: (v) => { st.px = v; if (ui) refresh(); } },
        { type: 'range', id: 'py', label: 'P.y', min: -2, max: 2, step: 0.1, value: st.py, onInput: (v) => { st.py = v; if (ui) refresh(); } },
        { type: 'readout', id: 'm' },
      ]);
      ui.el.append(code.el);
      refresh();
    },
  });
}

/* ---------- Demo 2: la torsión vista desde arriba ---------- */
function twistDemo() {
  return demo({
    title: 'Torsión vista desde arriba',
    aspect: '1 / 1',
    caption: 'Estás mirando una columna cuadrada **desde arriba**. Cada capa (una altura `y`) se gira `y × k` radianes: la de abajo no se mueve, la de arriba gira más. Seguir una esquina capa tras capa dibuja una espiral. Esto es **exactamente** lo que hará el vertex shader del ejercicio final.',
    setup({ stageEl, panel }) {
      const st = { k: 0.9, path: true, layers: 7 };
      let ui;
      const H = 3;
      const rot = (x, z, a) => { const c = Math.cos(a), s = Math.sin(a); return [c * x + s * z, -s * x + c * z]; };
      const draw = (ctx, w, hgt) => {
        const { X, Y } = plane2d(ctx, w, hgt, 1.6);
        ctx.strokeStyle = '#3a4152'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), hgt); ctx.stroke();
        label(ctx, 'x', w - 14, Y(0) - 8, '#8b94a8', 'right');
        label(ctx, 'z', X(0) + 8, 16, '#8b94a8');
        const half = 0.7;
        const corners = [[-half, -half], [half, -half], [half, half], [-half, half]];
        const ys = Array.from({ length: st.layers }, (_, i) => (i / (st.layers - 1)) * H);
        const lerp = (a, b, t) => Math.round(a + (b - a) * t);
        ys.forEach((yy, i) => {
          const t = i / (st.layers - 1);
          const col = `rgb(${lerp(76, 244, t)},${lerp(201, 114, t)},${lerp(224, 182, t)})`;
          const pts = corners.map(([x, z]) => rot(x, z, yy * st.k));
          ctx.strokeStyle = col; ctx.lineWidth = i === 0 || i === ys.length - 1 ? 3 : 1.6;
          ctx.globalAlpha = i === 0 || i === ys.length - 1 ? 1 : 0.65;
          ctx.beginPath(); pts.forEach(([x, z], k) => (k ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z)))); ctx.closePath(); ctx.stroke();
          ctx.globalAlpha = 1;
        });
        if (st.path) {
          ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 2; ctx.beginPath();
          for (let i = 0; i <= 120; i++) { const yy = (i / 120) * H; const [x, z] = rot(corners[0][0], corners[0][1], yy * st.k); i ? ctx.lineTo(X(x), Y(z)) : ctx.moveTo(X(x), Y(z)); }
          ctx.stroke();
          ctx.fillStyle = '#ffc857';
          ys.forEach((yy) => { const [x, z] = rot(corners[0][0], corners[0][1], yy * st.k); ctx.beginPath(); ctx.arc(X(x), Y(z), 3.5, 0, Math.PI * 2); ctx.fill(); });
        }
        label(ctx, 'y = 0 (abajo)', 14, hgt - 34, '#4cc9e0');
        label(ctx, `y = ${H} (arriba)`, 14, hgt - 14, '#f472b6');
      };
      const api = canvas2d(stageEl, draw);
      const refresh = () => {
        const rows = [0, 1, 2, 3].map((yy) => `y = ${yy} → ${(yy * st.k).toFixed(2)} rad = ${(yy * st.k / RAD).toFixed(0)}°`);
        ui?.readout('tbl', ['angle = position.y * k', '', ...rows].join('\n'));
        api.redraw();
      };
      ui = panel([
        { type: 'range', id: 'k', label: 'k (torsión por unidad de altura)', min: 0, max: 2, step: 0.05, value: st.k, onInput: (v) => { st.k = v; if (ui) refresh(); } },
        { type: 'range', id: 'l', label: 'Capas dibujadas', min: 2, max: 13, step: 1, value: st.layers, decimals: 0, onInput: (v) => { st.layers = v; if (ui) refresh(); } },
        { type: 'check', id: 'p', label: 'Seguir una esquina (espiral)', value: st.path, onInput: (v) => { st.path = v; if (ui) refresh(); } },
        { type: 'readout', id: 'tbl' },
      ]);
      refresh();
    },
  });
}

export default function cards() {
  return [

    /* 1 ------------------------------------------------------------------ */
    {
      t: 'Una matriz es una tabla que transforma',
      body: () => [
        P('Una `mat2` es una tabla de 2 × 2 números. La multiplicas por un punto 2D (`vec2`) y te devuelve **otro punto**. La regla: cada fila por el vector, y se suma.'),
        eq(`| 2  0 |   | 3 |   | 2·3 + 0·5 |   |  6 |
| 0  3 | × | 5 | = | 0·3 + 3·5 | = | 15 |

→ esta matriz estira x × 2 e y × 3 (escala)`),
        P('La **identidad** no cambia nada, como multiplicar por 1:'),
        eq(`| 1  0 |   | 3 |   | 3 |
| 0  1 | × | 5 | = | 5 |`),
      ],
      check: {
        type: 'mc',
        q: 'Calcula `| 2 0 ; 0 3 | × (1, 1)`.',
        options: ['(2, 3)', '(3, 2)', '(1, 1)', '(5, 5)'],
        answer: 0,
        why: 'Fila 1: 2·1 + 0·1 = 2. Fila 2: 0·1 + 3·1 = 3.',
      },
    },

    /* 2 ------------------------------------------------------------------ */
    {
      t: 'La matriz que gira',
      body: () => [
        rotateDemo(),
        P('Con `cos(a)` y `sin(a)` dentro, la matriz **gira** el punto un ángulo `a` alrededor del origen. Las dos flechas son las **columnas**: adónde van a parar los ejes. Como todo punto es «x veces la roja + y veces la verde», todo gira igual.'),
      ],
      more: () => [
        table(['Ángulo', 'cos / sin', 'M × (1, 0)'], [
          ['0°', '1 / 0', '(1, 0) — no se mueve'],
          ['90°', '0 / 1', '(0, −1)'],
          ['180°', '−1 / 0', '(−1, 0)'],
          ['45°', '0.707 / 0.707', '(0.707, −0.707)'],
        ]),
      ],
      check: {
        type: 'predict',
        q: 'Pon **P = (1, 0)** y ángulo **90°** en la demo. Antes de mirar: ¿dónde acaba P′?',
        options: ['(0, 1)', '(0, −1)', '(−1, 0)'],
        answer: 1,
        why: 'x′ = cos·1 + sin·0 = 0 · y′ = −sin·1 + cos·0 = −1. Con esta matriz (la del curso), un ángulo positivo gira en el sentido de las agujas del reloj. El sentido da igual: lo que importa es que gire.',
      },
    },

    /* 3 ------------------------------------------------------------------ */
    {
      t: 'Trampa: se rellena por columnas',
      body: () => [
        eq(`mat2(a, b, c, d)   =   | a  c |
                      | b  d |`),
        P('`mat2(a, b, c, d)` **no** se rellena fila a fila: los dos primeros números son la **primera columna** y los dos siguientes, la segunda.'),
        P('Por eso `mat2(cos, −sin, sin, cos)` es la tabla `| cos sin ; −sin cos |`, la que ves en la demo anterior.'),
      ],
      check: {
        type: 'mc',
        q: '¿Cuál es la **primera columna** de `mat2(0.0, -1.0, 1.0, 0.0)`?',
        options: ['(0.0, −1.0)', '(0.0, 1.0)', '(−1.0, 0.0)'],
        answer: 0,
        why: 'Los dos primeros números forman la primera columna: (0.0, −1.0).',
      },
    },

    /* 4 ------------------------------------------------------------------ */
    {
      t: 'La función que usarás',
      body: () => [
        codeBlock({
          title: 'GLSL',
          lang: 'glsl',
          code: `
mat2 get2dRotateMatrix(float _angle)
{
    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
}

// uso:
mat2 rotateMatrix = get2dRotateMatrix(0.5);
vec2 rotated = rotateMatrix * vec2(1.0, 0.0);`,
          notes: [
            ['mat2 get2dRotateMatrix', 'Recibe un ángulo **en radianes** y devuelve la matriz de giro. (π rad = 180°, así que 0.5 rad ≈ 28.6°.)'],
            ['rotateMatrix * vec2', 'Matriz × vector = el punto girado. Escríbelo siempre en este orden.'],
          ],
        }),
      ],
      check: {
        type: 'fill',
        q: 'Completa la última pieza de la matriz:',
        pre: 'return mat2(cos(_angle), - sin(_angle), sin(_angle), ', post: '(_angle));',
        answer: 'cos',
        accept: ['cos'],
        size: 5,
        why: 'La diagonal es `cos, cos` y las otras dos esquinas son `sin` y `−sin`. Con ángulo 0 queda `mat2(1, 0, 0, 1)`: la identidad.',
      },
    },

    /* 5 ------------------------------------------------------------------ */
    {
      t: 'Torsión: más giro cuanto más alto',
      body: () => [
        twistDemo(),
        P('Miras una columna **desde arriba**. Cada vértice gira un ángulo **proporcional a su altura**: abajo nada, arriba mucho. Como una toalla escurrida. Es exactamente lo que hará el ejercicio final.'),
        eq('angle = position.y × k        y = 0 → 0 rad   ·   y = 1 → 0.9 rad   ·   y = 2 → 1.8 rad'),
      ],
      check: {
        type: 'predict',
        q: 'Pon **k = 0** en la demo. ¿Qué pasará con la columna?',
        options: ['Gira entera, toda igual', 'Queda recta: ninguna capa gira', 'Se retuerce al revés'],
        answer: 1,
        why: 'Con k = 0, `angle = y × 0 = 0` en todas las alturas. Girar 0 es la identidad: nada cambia. Con k negativo sí se retorcería al revés.',
      },
    },

    /* 6 ------------------------------------------------------------------ */
    {
      t: 'Del dibujo al código',
      body: () => [
        codeBlock({
          title: 'vertex (la idea)',
          lang: 'glsl',
          code: `
float angle = position.y * 0.9;
mat2 rotateMatrix = get2dRotateMatrix(angle);

transformed.xz = rotateMatrix * transformed.xz;`,
          notes: [
            ['position.y * 0.9', 'El ángulo depende de la altura. `0.9` = cuánto retuerce por unidad.'],
            ['transformed.xz', 'Solo giramos **x y z** (el suelo visto desde arriba). La **y** no se toca: giramos alrededor del eje vertical.'],
          ],
        }),
        callout('remember', 'Lo que te llevas', [UL([
          '`mat2 × vec2` = otro `vec2`. Con `cos` y `sin`, la matriz gira.',
          '`mat2(a, b, c, d)` se rellena por **columnas**.',
          'Torsión = girar `.xz` con un ángulo que sale de `position.y`.',
        ])]),
      ],
      check: {
        type: 'mc',
        q: 'En `transformed.xz = rotateMatrix * transformed.xz;`, ¿qué componente **no** cambia?',
        options: ['x', 'y', 'z', 'Cambian los tres'],
        answer: 1,
        why: 'Solo se reasignan x y z. La altura se queda igual, así que la columna gira sobre su eje vertical sin estirarse.',
      },
    },
  ];
}
