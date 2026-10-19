// ============================================================================
// stage.js — monta una "mini escena" de Three.js dentro de un contenedor.
//
// Hace por nosotros lo mismo que tú harías en tu proyecto del curso:
//   renderer + scene + camera + OrbitControls + resize + bucle de animación.
// Además pausa el render cuando la demo no se ve y libera todo al cambiar de lección.
// ============================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const registry = new Set();

/** Libera todas las demos activas (se llama al cambiar de lección). */
export function disposeAllStages() {
  for (const dispose of [...registry]) dispose();
}

/**
 * createStage(container, {
 *   pos: [x,y,z], target: [x,y,z], fov, orbit, alpha, antialias, shadows, background, pixelRatio
 * })
 * Devuelve { THREE, scene, camera, renderer, controls, canvas, onTick, onResize, setRender, size, dispose }
 */
export function createStage(container, opts = {}) {
  const {
    pos = [3, 2.2, 4], target = [0, 0, 0], fov = 50, near = 0.1, far = 100,
    orbit = true, alpha = true, antialias = true, shadows = false, background = null,
    camera: customCamera = null,
  } = opts;

  const canvas = document.createElement('canvas');
  container.append(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha });
  } catch (err) {
    canvas.remove();
    throw new Error('Tu navegador no pudo crear un contexto WebGL. Activa la aceleración por hardware.');
  }
  renderer.shadowMap.enabled = shadows;

  const scene = new THREE.Scene();
  if (background) scene.background = new THREE.Color(background);

  const camera = customCamera || new THREE.PerspectiveCamera(fov, 1, near, far);
  camera.position.set(...pos);
  camera.lookAt(...target);
  scene.add(camera);

  let controls = null;
  if (orbit) {
    controls = new OrbitControls(camera, canvas);
    controls.target.set(...target);
    controls.enableDamping = true;
    controls.update();
  }

  const size = { width: 1, height: 1, pixelRatio: 1 };
  const ticks = new Set();
  const resizeCbs = new Set();
  let customRender = null;
  let elapsed = 0;
  let last = performance.now();
  let raf = 0;
  let visible = true;
  let disposed = false;
  let forceFrames = 4; // dibuja siempre los primeros frames, aunque la demo aún no esté a la vista

  const fit = () => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    size.width = w; size.height = h;
    size.pixelRatio = Math.min(opts.pixelRatio ?? window.devicePixelRatio ?? 1, 2);
    renderer.setPixelRatio(size.pixelRatio);
    renderer.setSize(w, h, false);
    if (camera.isPerspectiveCamera) { camera.aspect = w / h; camera.updateProjectionMatrix(); }
    resizeCbs.forEach((fn) => fn(size));
  };
  const ro = new ResizeObserver(fit);
  ro.observe(container);
  fit();

  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => { visible = entries.some((e) => e.isIntersecting); })
    : null;
  io?.observe(container);

  const frame = (now) => {
    if (disposed) return;
    raf = requestAnimationFrame(frame);
    if ((!visible || document.hidden) && forceFrames <= 0) { last = now; return; }
    if (forceFrames > 0) forceFrames--;
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    elapsed += dt;
    ticks.forEach((fn) => fn(dt, elapsed));
    controls?.update();
    if (customRender) customRender(); else renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  const stage = {
    THREE, scene, camera, renderer, controls, canvas, size, container,
    onTick(fn) { ticks.add(fn); return () => ticks.delete(fn); },
    onResize(fn) { resizeCbs.add(fn); fn(size); return () => resizeCbs.delete(fn); },
    setRender(fn) { customRender = fn; },
    get elapsed() { return elapsed; },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io?.disconnect();
      controls?.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        const mats = o.material ? [].concat(o.material) : [];
        mats.forEach((m) => { for (const v of Object.values(m)) if (v?.isTexture) v.dispose(); m.dispose?.(); });
      });
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      registry.delete(stage.dispose);
    },
  };
  registry.add(stage.dispose);
  return stage;
}

/**
 * canvas2d(container, draw, { animate }) — lienzo 2D para dibujar diagramas interactivos.
 * draw(ctx, w, h, t) se llama al redimensionar, cuando llamas a redraw() y (si animate) cada frame.
 */
export function canvas2d(container, draw, { animate = false } = {}) {
  const canvas = document.createElement('canvas');
  container.append(canvas);
  const ctx = canvas.getContext('2d');
  const api = { canvas, ctx, w: 1, h: 1, redraw: () => {}, dispose: () => {} };
  let dpr = 1, raf = 0, disposed = false, visible = true;
  const t0 = performance.now();

  const paint = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, api.w, api.h);
    draw(ctx, api.w, api.h, (performance.now() - t0) / 1000);
  };
  const fit = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    api.w = Math.max(1, container.clientWidth);
    api.h = Math.max(1, container.clientHeight);
    canvas.width = Math.round(api.w * dpr);
    canvas.height = Math.round(api.h * dpr);
    paint();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(container);
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((e) => { visible = e.some((x) => x.isIntersecting); })
    : null;
  io?.observe(container);
  fit();

  if (animate) {
    const loop = () => { if (disposed) return; raf = requestAnimationFrame(loop); if (visible && !document.hidden) paint(); };
    raf = requestAnimationFrame(loop);
  }
  api.redraw = paint;
  api.dispose = () => { disposed = true; cancelAnimationFrame(raf); ro.disconnect(); io?.disconnect(); canvas.remove(); registry.delete(api.dispose); };
  registry.add(api.dispose);
  return api;
}

/** Textura de cuadrícula numerada, ideal para ver UVs, repeat, filtros… */
export function makeGridTexture({ size = 512, cells = 8, label = true } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const s = size / cells;
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const hue = (x / cells) * 200 + (y / cells) * 160;
      g.fillStyle = `hsl(${hue} 55% ${(x + y) % 2 ? 42 : 34}%)`;
      g.fillRect(x * s, y * s, s, s);
      if (label) {
        g.fillStyle = '#ffffffcc';
        g.font = `${Math.floor(s * 0.32)}px system-ui, sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(`${x},${cells - 1 - y}`, x * s + s / 2, y * s + s / 2);
      }
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export { THREE };
