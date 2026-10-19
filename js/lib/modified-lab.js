// ============================================================================
// modified-lab.js — el laboratorio de «Modified materials»
//
//  · buildScene(stage)          → columna + suelo + pared + luz con sombras
//  · createRunner(stage, parts) → ejecuta TU código de onBeforeCompile de verdad,
//                                  captura el vertexShader resultante y los errores reales de la GPU
//  · generateJS(cfg)            → genera el código JS de cada paso de la lección
// ============================================================================
import { THREE } from '../stage.js';

/* ----------------------------------------------------------------------
   Escena
   ---------------------------------------------------------------------- */
export const MODELS = {
  column: { label: 'Columna (caja)', make: () => new THREE.BoxGeometry(2.2, 8, 2.2, 22, 120, 22), repeat: [1, 3.64] },
  knot: { label: 'Nudo', make: () => new THREE.TorusKnotGeometry(1.8, 0.6, 320, 48), repeat: [8, 2] },
  sphere: { label: 'Esfera', make: () => new THREE.SphereGeometry(2.6, 96, 96), repeat: [2, 1] },
};

/** Textura de tablero claro/azul: se ve muy bien cómo se retuerce. */
function makeChecker() {
  const size = 512; const cells = 4; const s = size / cells;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      g.fillStyle = (x + y) % 2 ? '#7aa2ff' : '#f4ede3';
      g.fillRect(x * s, y * s, s, s);
    }
  }
  g.strokeStyle = '#1d2233'; g.lineWidth = 6;
  for (let i = 0; i <= cells; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, size); g.moveTo(0, i * s); g.lineTo(size, i * s); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}

export function buildScene(stage) {
  const { scene } = stage;
  const tex = makeChecker();

  const light = new THREE.DirectionalLight('#fff3e2', 3.4);
  light.position.set(8, 6, 9);
  light.castShadow = true;
  light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { near: 2, far: 40, left: -14, right: 14, top: 14, bottom: -14 });
  light.shadow.normalBias = 0.06;
  light.shadow.bias = -0.0004;
  scene.add(light, new THREE.AmbientLight('#8ea2ff', 0.7));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, 28), new THREE.MeshStandardMaterial({ color: '#2d3342', roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4;
  floor.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(28, 18), new THREE.MeshStandardMaterial({ color: '#39415a', roughness: 0.95 }));
  wall.position.set(0, 5, -5.6);
  wall.receiveShadow = true;
  scene.add(floor, wall);

  const mesh = new THREE.Mesh(MODELS.column.make(), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  tex.repeat.set(...MODELS.column.repeat);
  scene.add(mesh);

  const setModel = (name) => {
    const m = MODELS[name];
    const old = mesh.geometry;
    mesh.geometry = m.make();
    old.dispose();
    tex.repeat.set(...m.repeat);
  };
  return { mesh, tex, light, floor, wall, setModel };
}

/* ----------------------------------------------------------------------
   Ayudas para errores
   ---------------------------------------------------------------------- */
export function hintFor(msg) {
  if (/already been declared/.test(msg)) return 'En el laboratorio `material`, `mesh` y `THREE` ya existen: no los declares otra vez con const/let. Usa los que te damos.';
  if (/'transformed' : undeclared identifier/.test(msg)) return 'El chunk `begin_vertex` es el que declara `transformed`. Si lo reemplazas por NADA, esa variable no existe. Vuelve a incluirlo: `#include <begin_vertex>`.';
  if (/'objectNormal' : undeclared identifier/.test(msg)) return 'El chunk `beginnormal_vertex` es el que declara `objectNormal`. No lo quites: vuelve a incluirlo.';
  if (/'(angle|rotateMatrix)' : redefinition/.test(msg)) return 'Has declarado `angle`/`rotateMatrix` dos veces. Todos los chunks se fusionan en UN solo shader, así que no pueden repetirse. Decláralas solo en `beginnormal_vertex` (va antes) y úsalas en `begin_vertex`.';
  if (/'(angle|rotateMatrix)' : undeclared identifier/.test(msg)) return '`angle`/`rotateMatrix` no existen en este punto. Decláralas en el primer chunk que las necesite (`beginnormal_vertex` en el material; `begin_vertex` en el depthMaterial).';
  if (/'uTime' : undeclared identifier/.test(msg)) return 'Falta `uniform float uTime;` (ponlo en el chunk `common`, que va antes de `main`).';
  if (/'uTwist' : undeclared identifier/.test(msg)) return 'Falta `uniform float uTwist;` en el chunk `common`.';
  if (/get2dRotateMatrix/.test(msg)) return 'La función `get2dRotateMatrix` debe definirse en `common` (fuera de `main`) y antes de usarla.';
  if (/syntax error/.test(msg)) return 'Falta un `;` o un paréntesis (en esta línea o en la anterior).';
  if (/cannot convert from 'const int'|wrong operand types/.test(msg)) return '¿Un número sin punto decimal? Escribe `1.0` en vez de `1`.';
  if (/dimension mismatch|cannot convert/.test(msg)) return 'Los tipos no coinciden: `transformed.xz` y `mat2 * vec2` son `vec2`.';
  return '';
}

/* ----------------------------------------------------------------------
   El ejecutor: corre tu código para de verdad
   ---------------------------------------------------------------------- */
function describeLog(x) {
  if (x && typeof x === 'object' && 'vertexShader' in x && 'fragmentShader' in x) {
    const lines = (s) => `${String(s).split('\n').length} líneas`;
    return `{\n  vertexShader: «texto de ${lines(x.vertexShader)}»,\n  fragmentShader: «texto de ${lines(x.fragmentShader)}»,\n  uniforms: { ${Object.keys(x.uniforms || {}).slice(0, 6).join(', ')}, … }\n}`;
  }
  try { return typeof x === 'string' ? x : JSON.stringify(x); } catch { return String(x); }
}

export function createRunner(stage, parts) {
  const { renderer, scene, camera } = stage;
  const { mesh } = parts;
  const defaultUniforms = { uTime: { value: 0 }, uTwist: { value: 0.9 } };
  let uniforms = defaultUniforms;   // si declaras tu propio customUniforms, se usa el tuyo
  let counter = 0;
  let pendingErr = null;
  const captured = { main: '', depth: '' };
  let good = { material: mesh.material, depth: undefined, captured: { ...captured } };
  const originalMain = THREE.ShaderLib.standard.vertexShader;
  const originalDepth = THREE.ShaderLib.depth.vertexShader;

  renderer.debug.onShaderError = (gl, program, glV, glF) => {
    const out = [];
    const grab = (shader, stageName) => {
      const log = gl.getShaderInfoLog(shader) || '';
      const src = (gl.getShaderSource(shader) || '').split('\n');
      const which = src.some((l) => l.includes('DEPTH_PACKING')) ? 'depthMaterial' : 'material';
      for (const m of log.matchAll(/ERROR:\s*\d+:(\d+):\s*(.*)/g)) {
        const line = +m[1];
        out.push({ where: `${which} · ${stageName}`, line, msg: m[2].trim(), src: (src[line - 1] || '').trim() });
      }
    };
    grab(glV, 'vertex shader');
    grab(glF, 'fragment shader');
    if (!out.length) {
      (gl.getProgramInfoLog(program) || '').split('\n').map((l) => l.replace(/^ERROR:\s*/, '').trim()).filter(Boolean)
        .forEach((l) => out.push({ where: 'enlace', line: 0, msg: l, src: '' }));
    }
    pendingErr = out;
  };

  const wrapHook = (mat, slot) => {
    const user = mat.onBeforeCompile;
    const key = `ml-${++counter}-${slot}`;
    mat.onBeforeCompile = function wrapped(shader, r) {
      user.call(this, shader, r);
      captured[slot] = shader.vertexShader;
    };
    mat.customProgramCacheKey = () => key;
  };

  const restore = (prev) => {
    mesh.material = prev.material;
    mesh.customDepthMaterial = prev.depth;
    captured.main = prev.captured.main;
    captured.depth = prev.captured.depth;
  };

  /** Ejecuta `code` (el cuerpo de tu script). Devuelve { ok, logs, errors } */
  function run(code) {
    const logs = [];
    const fakeConsole = { log: (...a) => { logs.push(a.map(describeLog).join(' ')); console.log(...a); } };
    pendingErr = null;
    const prev = good;
    const material = new THREE.MeshStandardMaterial({ map: parts.tex, roughness: 0.55 });
    mesh.material = material;
    mesh.customDepthMaterial = undefined;
    captured.main = originalMain;
    captured.depth = '';

    try {
      // Si escribes `const customUniforms = {...}` como en el curso, lo convertimos en una asignación
      // al objeto que ya existe, y nos quedamos con el tuyo para actualizar su uTime cada frame.
      const src = code.replace(/\b(?:const|let|var)\s+customUniforms\b/g, 'customUniforms');
      // eslint-disable-next-line no-new-func
      const given = new Function('THREE', 'mesh', 'material', 'customUniforms', 'console', `${src}\n;return customUniforms`)(THREE, mesh, material, defaultUniforms, fakeConsole);
      uniforms = given && typeof given === 'object' ? given : defaultUniforms;
    } catch (err) {
      material.dispose();
      restore(prev);
      return { ok: false, logs, errors: [{ where: 'tu JavaScript', line: 0, msg: `${err.name}: ${err.message}`, src: '' }] };
    }

    wrapHook(material, 'main');
    if (mesh.customDepthMaterial) wrapHook(mesh.customDepthMaterial, 'depth');
    if (!mesh.customDepthMaterial) captured.depth = '';

    let thrown = null;
    try { renderer.render(scene, camera); } catch (err) { thrown = err; }

    if (thrown || pendingErr) {
      const errors = thrown ? [{ where: 'tu JavaScript (dentro de onBeforeCompile)', line: 0, msg: `${thrown.name}: ${thrown.message}`, src: '' }] : pendingErr;
      const depth = mesh.customDepthMaterial;
      restore(prev);
      material.dispose();
      depth?.dispose?.();
      return { ok: false, logs, errors };
    }
    if (prev.material !== material) prev.material.dispose();
    prev.depth?.dispose?.();
    good = { material, depth: mesh.customDepthMaterial, captured: { ...captured } };
    return { ok: true, logs, errors: [] };
  }

  return {
    get uniforms() { return uniforms; },
    run,
    captured,
    originals: { main: originalMain, depth: originalDepth },
    hasDepth: () => !!mesh.customDepthMaterial,
  };
}

/** Marca (para el editor) las líneas del shader final que no existen en el shader original. */
export function diffAdded(finalSrc, originalSrc) {
  const have = new Set(originalSrc.split('\n').map((l) => l.trim()).filter(Boolean));
  const out = [];
  finalSrc.replace(/^\n+/, '').split('\n').forEach((l, i) => { const t = l.trim(); if (t && !have.has(t)) out.push(i + 1); });
  return out;
}

/* ----------------------------------------------------------------------
   Generador de código JS (el que ves y ejecutas en cada paso)
   ---------------------------------------------------------------------- */
export const DEFAULT_CFG = {
  hook: false, log: false, beginMode: 'none', moveY: false, twist: 'none',
  animate: false, slider: false, formula: 'linear', normals: false, dup: false, depth: false,
};

export function normalizeCfg(c) {
  const n = { ...c };
  if (!n.hook) return { ...DEFAULT_CFG, ...{ hook: false } };
  if (n.moveY || n.twist !== 'none') { if (n.beginMode === 'none') n.beginMode = 'include'; }
  if (n.formula === 'sin') n.animate = true;
  if (n.twist === 'none') { n.normals = false; n.dup = false; n.slider = false; }
  if (n.dup) n.normals = true;
  if (n.beginMode === 'nothing') { n.moveY = false; n.twist = 'none'; n.normals = false; n.dup = false; }
  return n;
}

const T = (n, s) => `${' '.repeat(n)}${s}`;

export function generateJS(input) {
  const c = normalizeCfg(input);
  if (!c.hook) return '// Sin onBeforeCompile: es el MeshStandardMaterial normal de Three.js,\n// con su vertexShader original, intacto.';

  const needRot = c.twist !== 'none';
  const k = c.formula === 'sin' ? '0.4' : '0.9';
  const kk = c.slider ? 'uTwist' : k;
  let angleExpr = '0.3';
  if (c.twist === 'height') {
    if (c.formula === 'sin') angleExpr = `(sin(position.y + uTime)) * ${kk}`;
    else if (c.animate) angleExpr = `(position.y + uTime) * ${kk}`;
    else angleExpr = `position.y * ${kk}`;
  }
  const decl = (ind) => [T(ind, `float angle = ${angleExpr};`), T(ind, 'mat2 rotateMatrix = get2dRotateMatrix(angle);')];
  const L = [];
  const header = [
    '// (ya existe)  const customUniforms = { uTime: { value: 0 }, uTwist: { value: 0.9 } }',
    '// uTime se actualiza solo en cada frame (el «tick» del curso): customUniforms.uTime.value = elapsedTime',
    '',
  ];
  L.push(...header);
  L.push('material.onBeforeCompile = (shader) =>', '{');
  const body = [];
  if (c.log) body.push(T(4, 'console.log(shader)'), '');
  if (c.animate) body.push(T(4, 'shader.uniforms.uTime = customUniforms.uTime'));
  if (c.slider) body.push(T(4, 'shader.uniforms.uTwist = customUniforms.uTwist'));
  if (c.animate || c.slider) body.push('');

  const replace = (chunk, lines) => {
    if (lines === null) return [T(4, 'shader.vertexShader = shader.vertexShader.replace('), T(8, `'#include <${chunk}>',`), T(8, "''"), T(4, ')')];
    return [
      T(4, 'shader.vertexShader = shader.vertexShader.replace('),
      T(8, `'#include <${chunk}>',`),
      T(8, '`'),
      ...lines.map((l) => (l === '' ? '' : T(12, l))),
      T(8, '`'),
      T(4, ')'),
    ];
  };

  // common: uniforms + función
  if (needRot || c.animate || c.slider) {
    const lines = ['#include <common>', ''];
    if (c.animate) lines.push('uniform float uTime;');
    if (c.slider) lines.push('uniform float uTwist;');
    if (c.animate || c.slider) lines.push('');
    if (needRot) lines.push('mat2 get2dRotateMatrix(float _angle)', '{', '    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));', '}');
    while (lines[lines.length - 1] === '') lines.pop();
    body.push(...replace('common', lines), '');
  }

  // beginnormal_vertex
  if (c.normals && needRot) {
    const lines = ['#include <beginnormal_vertex>', '', ...decl(0).map((l) => l.trimStart()), '', 'objectNormal.xz = rotateMatrix * objectNormal.xz;'];
    body.push(...replace('beginnormal_vertex', lines), '');
  }

  // begin_vertex
  if (c.beginMode === 'nothing') {
    body.push(...replace('begin_vertex', null));
  } else if (c.beginMode === 'include') {
    const lines = ['#include <begin_vertex>'];
    if (c.moveY) lines.push('', 'transformed.y += 3.0;');
    if (needRot) {
      lines.push('');
      if (!c.normals || c.dup) lines.push(...decl(0).map((l) => l.trimStart()), '');
      lines.push('transformed.xz = rotateMatrix * transformed.xz;');
    }
    body.push(...replace('begin_vertex', lines));
  }
  while (body.length && body[body.length - 1] === '') body.pop();
  L.push(...body, '}');

  // depthMaterial
  if (c.depth) {
    L.push('');
    L.push('const depthMaterial = new THREE.MeshDepthMaterial({', T(4, 'depthPacking: THREE.RGBADepthPacking'), '})');
    L.push('mesh.customDepthMaterial = depthMaterial', '');
    L.push('depthMaterial.onBeforeCompile = (shader) =>', '{');
    const d = [];
    if (c.animate) d.push(T(4, 'shader.uniforms.uTime = customUniforms.uTime'));
    if (c.slider) d.push(T(4, 'shader.uniforms.uTwist = customUniforms.uTwist'));
    if (c.animate || c.slider) d.push('');
    if (needRot || c.animate || c.slider) {
      const lines = ['#include <common>', ''];
      if (c.animate) lines.push('uniform float uTime;');
      if (c.slider) lines.push('uniform float uTwist;');
      if (c.animate || c.slider) lines.push('');
      if (needRot) lines.push('mat2 get2dRotateMatrix(float _angle)', '{', '    return mat2(cos(_angle), - sin(_angle), sin(_angle), cos(_angle));', '}');
      while (lines[lines.length - 1] === '') lines.pop();
      d.push(...replace('common', lines), '');
    }
    const lines = ['#include <begin_vertex>'];
    if (c.moveY) lines.push('', 'transformed.y += 3.0;');
    if (needRot) lines.push('', ...decl(0).map((l) => l.trimStart()), '', 'transformed.xz = rotateMatrix * transformed.xz;');
    d.push(...replace('begin_vertex', lines));
    L.push(...d, '}');
  }
  return L.join('\n');
}

/* La solución completa del ejercicio (lo que construye la lección) */
export const FINAL_CFG = { hook: true, log: false, beginMode: 'include', moveY: false, twist: 'height', animate: true, slider: false, formula: 'linear', normals: true, dup: false, depth: true };
export const SOLUTION_CODE = generateJS(FINAL_CFG);

export const STARTER_CODE = `// Tu turno. Tienes disponibles: material, mesh, customUniforms, THREE y console.
//   customUniforms.uTime ya existe y se actualiza solo en cada frame
//   (si prefieres declarar tu propio «const customUniforms = {...}», también vale).
//
// Objetivo: que la columna se retuerza según su altura y se anime,
//           con la sombra y la iluminación siguiendo el giro.

material.onBeforeCompile = (shader) =>
{
    // 1) Dale a las matrices una función: mat2 get2dRotateMatrix(float _angle)
    //    (en el chunk <common>)

    // 2) Calcula el ángulo y gira transformed.xz (en el chunk <begin_vertex>)

    // 3) Pasa uTime al shader: shader.uniforms.uTime = customUniforms.uTime
}

// 4) Arregla la sombra con un MeshDepthMaterial (customDepthMaterial)

// 5) Arregla las normales (chunk <beginnormal_vertex>)
`;
