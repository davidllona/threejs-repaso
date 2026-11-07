// ============================================================================
// cloud.js — guarda tu progreso en Firebase para no perderlo y tenerlo igual
// en el móvil, la tablet y el ordenador.
//
// · Inicio de sesión: Google o correo + contraseña (Firebase Authentication).
// · Datos: Firestore, documento  progreso-threejs/{tu uid}.
// · Sin sesión, todo sigue funcionando como siempre (solo en este navegador).
// ============================================================================
import { h } from './ui.js';
import { progress } from './progress.js';

const SDK = 'https://www.gstatic.com/firebasejs/13.2.0/';
const COLLECTION = 'progreso-threejs';

// Esta configuración es pública por diseño: lo que protege tus datos son las
// reglas de Firestore (cada usuario solo puede leer y escribir su documento).
const firebaseConfig = {
  apiKey: 'AIzaSyAnp3IH26oiY0zixEoZL-M49ghBtnrRYnU',
  authDomain: 'repasoia.firebaseapp.com',
  projectId: 'repasoia',
  storageBucket: 'repasoia.firebasestorage.app',
  messagingSenderId: '404128001900',
  appId: '1:404128001900:web:5f4ac9af79e13146990d49',
};

// ---------------------------------------------------------------- estado ---
const st = {
  phase: 'loading', // loading | out | in | unavailable
  user: null,
  sync: 'idle',     // idle | saving | ok | error
  error: '',
  lastSync: 0,
};
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(st));

let fb = null;      // { auth, db, A (módulo auth), F (módulo firestore) }
let unsub = null;
let pushTimer = null;
let pending = false;

// ------------------------------------------------------- mensajes de error ---
const ERRORS = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese correo. Pulsa «Crear cuenta».',
  'auth/invalid-email': 'Ese correo no parece válido.',
  'auth/missing-password': 'Escribe la contraseña.',
  'auth/missing-email': 'Escribe tu correo.',
  'auth/user-disabled': 'Esta cuenta está desactivada.',
  'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes y vuelve a probar.',
  'auth/expired-action-code': 'El enlace ha caducado. Pide otro.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Pulsa «Entrar».',
  'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos seguidos. Espera un poco y vuelve a probar.',
  'auth/network-request-failed': 'No hay conexión con Firebase. Revisa tu internet.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase (Authentication → Configuración → Dominios autorizados).',
  'auth/operation-not-allowed': 'Ese método de acceso no está habilitado en Firebase.',
  'auth/account-exists-with-different-credential': 'Ese correo ya está registrado con otro método. Entra con el que usaste la primera vez.',
  'permission-denied': 'Firebase no deja guardar: revisa las reglas de Firestore (cada usuario debe poder escribir en progreso-threejs/{su uid}).',
  'unavailable': 'Sin conexión: se guardará cuando vuelva internet.',
};
const QUIET = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled']);
const explain = (e) => ERRORS[e?.code] || (e?.message ? `Error: ${e.message}` : 'Algo ha fallado.');

// --------------------------------------------------------------- arranque ---
async function boot() {
  if (location.protocol === 'file:') { st.phase = 'unavailable'; emit(); return; }
  try {
    const [appMod, A, F] = await Promise.all([
      import(`${SDK}firebase-app.js`),
      import(`${SDK}firebase-auth.js`),
      import(`${SDK}firebase-firestore.js`),
    ]);
    const app = appMod.initializeApp(firebaseConfig);
    const auth = A.getAuth(app);
    auth.languageCode = 'es';
    const db = F.getFirestore(app);
    fb = { auth, db, A, F };

    A.getRedirectResult(auth).catch((e) => { if (!QUIET.has(e?.code)) setError(e); });
    A.onAuthStateChanged(auth, (user) => {
      st.user = user;
      st.phase = user ? 'in' : 'out';
      if (user) startSync(); else stopSync();
      emit();
    });
  } catch (e) {
    console.warn('[cloud] No se pudo cargar Firebase:', e);
    st.phase = 'unavailable';
    emit();
  }
}

function setError(e) {
  st.sync = 'error';
  st.error = explain(e);
  emit();
}

// ----------------------------------------------------------- sincronizar ---
function ref() { return fb.F.doc(fb.db, COLLECTION, st.user.uid); }

function startSync() {
  stopSync();
  st.sync = 'saving'; st.error = ''; emit();
  unsub = fb.F.onSnapshot(ref(), (snap) => {
    if (snap.metadata.hasPendingWrites) return; // es nuestro propio guardado en camino
    const remote = snap.exists() ? snap.data() : null;
    const needsPush = progress.absorb(remote);
    if (needsPush) schedulePush(0);
    else if (!pending) { st.sync = 'ok'; st.error = ''; st.lastSync = Date.now(); emit(); }
  }, setError);
}

function stopSync() {
  if (unsub) { unsub(); unsub = null; }
  clearTimeout(pushTimer); pending = false;
  st.sync = 'idle'; st.error = '';
}

function schedulePush(delay = 1200) {
  if (!st.user) return;
  pending = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(push, delay);
}

async function push() {
  if (!st.user || !fb) return;
  clearTimeout(pushTimer);
  st.sync = 'saving'; emit();
  try {
    await fb.F.setDoc(ref(), {
      ...progress.snapshot(),
      app: 'threejs-repaso',
      email: st.user.email || null,
      updatedAt: fb.F.serverTimestamp(),
    });
    pending = false;
    st.sync = 'ok'; st.error = ''; st.lastSync = Date.now(); emit();
  } catch (e) {
    setError(e);
  }
}

window.addEventListener('tj-progress-local', () => schedulePush());
// Si cierras la pestaña con cambios sin subir, se suben ya.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && pending) push();
});

// ------------------------------------------------------------- acciones ---
async function signInGoogle() {
  const { A, auth } = fb;
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await A.signInWithPopup(auth, provider);
  } catch (e) {
    if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/operation-not-supported-in-this-environment') {
      await A.signInWithRedirect(auth, provider);
      return;
    }
    if (!QUIET.has(e?.code)) throw e;
  }
}
const signInEmail = (email, pass) => fb.A.signInWithEmailAndPassword(fb.auth, email, pass);
const signUpEmail = (email, pass) => fb.A.createUserWithEmailAndPassword(fb.auth, email, pass);
const resetPassword = (email) => fb.A.sendPasswordResetEmail(fb.auth, email);
const signOut = () => fb.A.signOut(fb.auth);

// ----------------------------------------------------------------- UI ---
function statusText() {
  if (st.phase === 'loading') return 'Conectando…';
  if (st.phase === 'unavailable') return 'Sin conexión con la nube';
  if (st.phase === 'out') return 'Solo en este navegador';
  if (st.sync === 'error') return st.error;
  if (st.sync === 'saving') return 'Guardando…';
  return 'Guardado en la nube';
}

/** Cuadro de la barra lateral + indicador en la barra superior. */
export function mountCloud(sidebarEl, topbarProgEl) {
  const dot = h('i', { class: 'cloud-dot', 'aria-hidden': 'true' });
  const line = h('span', { class: 'cloud-line' });
  const who = h('span', { class: 'cloud-who' });
  const btn = h('button', { class: 'btn small cloud-btn', type: 'button', onClick: () => openDialog() });
  const box = h('div', { class: 'cloud-box' },
    h('div', { class: 'cloud-head' }, dot, h('div', {}, line, who)), btn);
  const brand = sidebarEl.querySelector('.brand');
  if (brand) brand.after(box); else sidebarEl.append(box);

  const topDot = h('i', { class: 'cloud-dot top', 'aria-hidden': 'true' });
  if (topbarProgEl) topbarProgEl.after(topDot);

  const paint = () => {
    const state = st.phase === 'in' ? (st.sync === 'error' ? 'err' : st.sync === 'saving' ? 'busy' : 'ok') : st.phase === 'out' ? 'off' : 'na';
    box.dataset.state = state;
    topDot.dataset.state = state;
    topDot.title = statusText();
    line.textContent = statusText();
    who.textContent = st.user ? (st.user.email || st.user.displayName || '')
      : st.phase === 'out' ? 'Inicia sesión para no perder tu progreso'
      : st.phase === 'unavailable' ? 'Tu progreso se sigue guardando en este navegador. Recarga cuando tengas internet.' : '';
    btn.textContent = st.phase === 'in' ? 'Cuenta' : 'Guardar mi progreso';
    btn.disabled = st.phase === 'loading' || st.phase === 'unavailable';
  };
  listeners.add(paint);
  paint();
}

let dialog = null;

function openDialog() {
  if (!fb) return;
  dialog?.remove();

  const msg = h('p', { class: 'cloud-msg', role: 'status' });
  const say = (text, kind = '') => { msg.textContent = text; msg.dataset.kind = kind; };
  const busy = (on) => dialog.querySelectorAll('button, input').forEach((el) => { if (!el.classList.contains('cloud-x')) el.disabled = on; });
  const run = async (fn, okText) => {
    say(''); busy(true);
    try { await fn(); if (okText) say(okText, 'ok'); } catch (e) { say(explain(e), 'err'); } finally { busy(false); }
  };

  const close = () => { dialog.close(); dialog.remove(); dialog = null; listeners.delete(repaint); };
  const xBtn = h('button', { class: 'cloud-x', type: 'button', 'aria-label': 'Cerrar', onClick: close }, '✕');
  const body = h('div', { class: 'cloud-body' });

  const repaint = () => {
    body.innerHTML = '';
    if (st.phase === 'in') {
      const u = st.user;
      const when = st.lastSync ? new Date(st.lastSync).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';
      body.append(
        h('p', { class: 'cloud-lead' }, 'Tu progreso se guarda solo, cada vez que respondes una pregunta o marcas una lección.'),
        h('dl', { class: 'cloud-dl' },
          h('dt', {}, 'Cuenta'), h('dd', {}, u.email || u.displayName || u.uid),
          h('dt', {}, 'Estado'), h('dd', {}, statusText()),
          h('dt', {}, 'Último guardado'), h('dd', {}, when)),
        h('p', { class: 'cloud-note' }, 'Entra con la misma cuenta en el móvil, la tablet o el ordenador y verás el mismo progreso.'),
        h('div', { class: 'cloud-row' },
          h('button', { class: 'btn', type: 'button', onClick: () => run(push, 'Guardado.') }, 'Guardar ahora'),
          h('button', { class: 'btn ghost', type: 'button', onClick: () => run(signOut) }, 'Cerrar sesión')),
        (u.providerData || []).some((p) => p.providerId === 'password') && u.email
          ? h('button', { class: 'linkish', type: 'button', onClick: () => run(() => resetPassword(u.email), `Te hemos enviado un enlace a ${u.email} para cambiar la contraseña.`) }, 'Cambiar mi contraseña')
          : h('p', { class: 'cloud-note' }, 'Has entrado con Google: la contraseña la gestiona tu cuenta de Google.'),
        msg,
      );
      return;
    }
    body.append(...authView());
  };

  /* --- Pantallas sin sesión: entrar · crear cuenta · recuperar contraseña --- */
  let mode = 'login';
  let typedEmail = '';
  const setMode = (m) => { mode = m; say(''); repaint(); body.querySelector('input')?.focus({ preventScroll: true }); };

  const field = (label, input, extra) => h('label', { class: 'cloud-field' }, h('span', {}, label), extra ? h('div', { class: 'cloud-pass' }, input, extra) : input);
  const emailInput = () => {
    const el = h('input', { class: 'cloud-input', type: 'email', autocomplete: 'email', inputmode: 'email', autocapitalize: 'none', spellcheck: 'false', placeholder: 'tu@correo.com', required: true });
    el.value = typedEmail;
    el.addEventListener('input', () => { typedEmail = el.value; });
    return el;
  };
  const passInput = (autocomplete, placeholder = '') => h('input', { class: 'cloud-input', type: 'password', autocomplete, placeholder, required: true, minlength: '6' });
  const eye = (...inputs) => {
    const b = h('button', { class: 'cloud-eye', type: 'button', 'aria-label': 'Mostrar contraseña', 'aria-pressed': 'false' }, 'Ver');
    b.addEventListener('click', () => {
      const show = inputs[0].type === 'password';
      inputs.forEach((i) => { i.type = show ? 'text' : 'password'; });
      b.textContent = show ? 'Ocultar' : 'Ver';
      b.setAttribute('aria-pressed', String(show));
      b.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });
    return b;
  };
  const google = (label) => [
    h('button', { class: 'btn cloud-google', type: 'button', onClick: () => run(signInGoogle) },
      h('span', { class: 'g', 'aria-hidden': 'true' }, 'G'), label),
    h('div', { class: 'cloud-or' }, h('span', {}, 'o con tu correo')),
  ];
  const tabs = () => h('div', { class: 'cloud-tabs', role: 'tablist' },
    h('button', { type: 'button', role: 'tab', 'aria-selected': String(mode === 'login'), class: mode === 'login' ? 'on' : '', onClick: () => setMode('login') }, 'Entrar'),
    h('button', { type: 'button', role: 'tab', 'aria-selected': String(mode === 'signup'), class: mode === 'signup' ? 'on' : '', onClick: () => setMode('signup') }, 'Crear cuenta'));

  function authView() {
    if (mode === 'reset') {
      const email = emailInput();
      return [
        h('p', { class: 'cloud-lead' }, 'Escribe el correo de tu cuenta y te enviaremos un enlace para elegir una contraseña nueva.'),
        h('form', { class: 'cloud-form', onSubmit: (e) => {
          e.preventDefault();
          run(() => resetPassword(email.value.trim()), 'Si hay una cuenta con ese correo, te llegará un enlace en unos minutos. Mira también en spam.');
        } },
          field('Correo', email),
          h('button', { class: 'btn primary cloud-main', type: 'submit' }, 'Enviar enlace'),
          msg),
        h('button', { class: 'linkish', type: 'button', onClick: () => setMode('login') }, '← Volver a entrar'),
      ];
    }
    if (mode === 'signup') {
      const email = emailInput();
      const p1 = passInput('new-password', 'Mínimo 6 caracteres');
      const p2 = passInput('new-password');
      return [
        tabs(),
        ...google('Crear cuenta con Google'),
        h('form', { class: 'cloud-form', onSubmit: (e) => {
          e.preventDefault();
          if (p1.value !== p2.value) { say('Las dos contraseñas no coinciden.', 'err'); p2.focus(); return; }
          run(() => signUpEmail(email.value.trim(), p1.value));
        } },
          field('Correo', email),
          field('Contraseña', p1, eye(p1, p2)),
          field('Repite la contraseña', p2),
          h('button', { class: 'btn primary cloud-main', type: 'submit' }, 'Crear cuenta'),
          msg),
        h('p', { class: 'cloud-note' }, 'Lo que ya tengas en este navegador no se pierde: se suma a tu cuenta nueva.'),
      ];
    }
    const email = emailInput();
    const pass = passInput('current-password');
    return [
      tabs(),
      h('p', { class: 'cloud-lead' }, 'Entra y tu progreso se guardará en tu cuenta: no lo perderás y lo verás igual en el móvil, la tablet y el ordenador.'),
      ...google('Entrar con Google'),
      h('form', { class: 'cloud-form', onSubmit: (e) => { e.preventDefault(); run(() => signInEmail(email.value.trim(), pass.value)); } },
        field('Correo', email),
        field('Contraseña', pass, eye(pass)),
        h('button', { class: 'btn primary cloud-main', type: 'submit' }, 'Entrar'),
        msg),
      h('div', { class: 'cloud-links' },
        h('button', { class: 'linkish', type: 'button', onClick: () => setMode('reset') }, '¿Has olvidado la contraseña?'),
        h('button', { class: 'linkish', type: 'button', onClick: () => setMode('signup') }, '¿No tienes cuenta? Créala')),
    ];
  }

  dialog = h('dialog', { class: 'cloud-dialog', 'aria-label': 'Guardar el progreso en la nube' },
    h('div', { class: 'cloud-card' }, xBtn, h('h3', {}, 'Tu progreso en la nube'), body));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  document.body.append(dialog);
  listeners.add(repaint);
  repaint();
  dialog.showModal();
}

boot();
