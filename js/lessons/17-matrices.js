import { h, P, H2, H3, UL, OL, callout, codeBlock, liveCode, demo, table, quiz, eq } from '../ui.js';
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

export default function render(root) {
  root.append(
    P('La lección *Modified materials* usa una **matriz de rotación** para retorcer un modelo. Si te dan miedo las matrices, relájate: aquí solo necesitas una de **2 × 2** y entender qué hace. No hay que memorizar fórmulas: hay que ver por qué funciona.'),

    H2('Qué es una matriz y qué es multiplicarla'),
    P('Una matriz es una **tabla de números** que sirve para transformar vectores. Una `mat2` es una tabla de 2 filas y 2 columnas; se multiplica por un `vec2` (un punto 2D) y devuelve otro `vec2`. La regla es «fila por columna»: cada resultado es una fila multiplicada por el vector y sumada.'),
    eq(`| 2  0 |   | 3 |   | 2·3 + 0·5 |   |  6 |\n| 0  3 | × | 5 | = | 0·3 + 3·5 | = | 15 |\n\nEsa matriz agranda x por 2 e y por 3 (es una matriz de escala).`),
    P('Hay una matriz especial, la **identidad**, que no cambia nada (como multiplicar por 1):'),
    eq(`| 1  0 |   | 3 |   | 3 |\n| 0  1 | × | 5 | = | 5 |`),

    H2('La matriz que gira'),
    P('Para girar un punto un ángulo `a` alrededor del origen se usa una matriz con `cos(a)` y `sin(a)`. Observa cómo gira el punto cuando mueves el ángulo y fíjate en las dos flechas (las **columnas** de la matriz):'),
    rotateDemo(),

    H3('Prueba con números exactos'),
    P('Con la matriz del curso, `mat2(cos(a), -sin(a), sin(a), cos(a))`, y el punto `(1, 0)`:'),
    table(['Ángulo', 'cos / sin', 'Resultado de M × (1, 0)', 'Qué pasó'], [
      ['0°', '1 / 0', '(1, 0)', 'No se movió (matriz identidad)'],
      ['90°', '0 / 1', '(0, −1)', 'Giró un cuarto de vuelta hacia abajo'],
      ['180°', '−1 / 0', '(−1, 0)', 'Se dio la vuelta'],
      ['45°', '0.707 / 0.707', '(0.707, −0.707)', 'Giró un octavo de vuelta'],
    ]),
    callout('warn', 'Trampa: las matrices de GLSL se escriben «por columnas»', [
      P('`mat2(a, b, c, d)` **no** rellena fila a fila. Rellena **columna a columna**: la primera columna es `(a, b)` y la segunda es `(c, d)`. Es decir:'),
      eq(`mat2(a, b, c, d)   =   | a  c |\n                      | b  d |`),
      P('Así, `mat2(cos(a), -sin(a), sin(a), cos(a))` es la tabla `[[cos, sin], [−sin, cos]]` (la que ves en la demo). Con un ángulo positivo gira un poco «hacia atrás» respecto al sentido matemático estándar; si quieres el sentido contrario, cambia el signo del ángulo. No importa cuál sea: lo importante es que **gire**, y que siempre se aplique igual.'),
    ]),

    H2('La función que usarás'),
    codeBlock({
      title: 'common (se añade al shader)',
      lang: 'glsl',
      code: `
mat2 get2dRotateMatrix(float _angle)
{
    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));
}`,
      notes: [
        ['mat2 get2dRotateMatrix', 'Una función propia: recibe un ángulo (en radianes) y **devuelve una matriz** `mat2` de giro.'],
        ['return mat2', 'Construye la tabla con `cos` y `sin` del ángulo. Recuerda: se rellena por columnas.'],
      ],
    }),
    P('Y se usa así, para girar un punto 2D:'),
    codeBlock({
      title: 'uso.glsl',
      lang: 'glsl',
      code: `
float angle = 0.5;
mat2 rotateMatrix = get2dRotateMatrix(angle);

vec2 p = vec2(1.0, 0.0);
vec2 rotated = rotateMatrix * p;`,
      notes: [
        ['float angle', 'El ángulo en radianes (π radianes = 180°). 0.5 rad ≈ 28.6°.'],
        ['mat2 rotateMatrix', 'Pedimos la matriz que gira `angle`.'],
        ['vec2 p', 'El punto que queremos girar.'],
        ['rotateMatrix * p', 'Matriz × vector = el punto girado. **El orden importa**: `matriz * vector`, nunca `vector * matriz` aquí.'],
      ],
    }),

    H2('Torsión: un ángulo distinto según la altura'),
    P('Ahora la idea del ejercicio. Un modelo vertical (como la cabeza del curso) tiene vértices a distintas alturas `y`. Si **cada vértice se gira un ángulo proporcional a su altura**, el modelo se retuerce como una toalla escurrida:'),
    codeBlock({
      title: 'vertex (la idea)',
      lang: 'glsl',
      code: `
float angle = position.y * 0.9;
mat2 rotateMatrix = get2dRotateMatrix(angle);

transformed.xz = rotateMatrix * transformed.xz;`,
      notes: [
        ['float angle', 'A altura 0 el ángulo es 0 (no se mueve nada); cuanto más arriba, más ángulo. `0.9` es cuánto retuerce por cada unidad de altura.'],
        ['mat2 rotateMatrix', 'La matriz que gira ese ángulo.'],
        ['transformed.xz', 'Giramos solo **x y z** (el suelo, visto desde arriba) y dejamos **y** como está: es girar **alrededor del eje vertical**. `.xz` es un swizzle usado como destino de la asignación: modifica solo esos dos componentes.'],
      ],
    }),
    table(['Altura y', 'Ángulo = y × 0.9', 'En grados'], [
      ['0', '0.0', '0°'],
      ['1', '0.9', '52°'],
      ['2', '1.8', '103°'],
      ['3', '2.7', '155°'],
    ]),
    twistDemo(),

    callout('idea', 'Lo que te llevas', [
      UL([
        'Una `mat2` × `vec2` = otro `vec2`. Con `cos` y `sin` esa matriz **gira** el punto.',
        '`mat2(a, b, c, d)` se rellena por **columnas**.',
        'Torsión = girar `xz` un ángulo que depende de `position.y`.',
        'Se escribe `transformed.xz = rotateMatrix * transformed.xz;` y la `y` queda intacta.',
      ]),
    ]),

    quiz([
      {
        q: '¿Qué hace `mat2(1.0, 0.0, 0.0, 1.0) * vec2(3.0, 5.0)`?',
        options: ['Devuelve `vec2(3.0, 5.0)`: es la identidad', 'Devuelve `vec2(5.0, 3.0)`', 'Devuelve `vec2(0.0, 0.0)`', 'Da un error'],
        answer: 0,
        why: 'Columnas (1, 0) y (0, 1): el eje x se queda en x y el y en y. No cambia nada.',
      },
      {
        q: 'Calcula `mat2(2.0, 0.0, 0.0, 3.0) * vec2(1.0, 1.0)`.',
        options: ['`vec2(2.0, 3.0)`', '`vec2(3.0, 2.0)`', '`vec2(1.0, 1.0)`', '`vec2(5.0, 5.0)`'],
        answer: 0,
        why: 'La primera columna (2, 0) multiplica a x = 1 y la segunda (0, 3) a y = 1: (2, 0) + (0, 3) = (2, 3).',
      },
      {
        q: 'En la torsión, ¿por qué los vértices con `y = 0` no se mueven?',
        options: ['Porque `angle = 0 × k = 0`, y girar 0 es la identidad', 'Porque están en el suelo', 'Porque `transformed.y` es 0', 'Porque el shader los ignora'],
        answer: 0,
        why: 'Con ángulo 0, cos = 1 y sin = 0, así que la matriz es la identidad y el punto no cambia.',
      },
      {
        q: 'En `transformed.xz = rotateMatrix * transformed.xz;`, ¿qué componente NO cambia?',
        options: ['x', 'y', 'z', 'Los tres cambian'],
        answer: 1,
        why: 'Solo se reasignan x y z. La altura `y` se queda igual, así que giramos alrededor del eje vertical.',
      },
      {
        q: '¿Cuál es la primera columna de `mat2(0.0, -1.0, 1.0, 0.0)`?',
        options: ['`(0.0, -1.0)`', '`(0.0, 1.0)`', '`(-1.0, 0.0)`', '`(0.0, 1.0)` y `(-1.0, 0.0)`'],
        answer: 0,
        why: 'GLSL rellena por columnas: los dos primeros números forman la primera columna.',
      },
    ]),
  );
}
