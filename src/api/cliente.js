// Cliente HTTP para endpoints protegidos con JWT.
//
// - Adjunta "Authorization: Bearer <access>" a cada petición protegida.
// - Si el servidor responde 401, renueva el access token una sola vez con el
//   refresh token y reintenta la petición.
// - Si la renovación falla, avisa a la app para que cierre la sesión.

import { API_BASE_URL, fetchConLimite } from '../api.js';

let sesionActual = null;
let callbacks = { onRenovada: () => {}, onExpirada: () => {} };
let renovacionEnCurso = null;

// La app (AuthContext) registra qué hacer cuando cambian los tokens.
export function configurarCliente(nuevosCallbacks) {
  callbacks = { ...callbacks, ...nuevosCallbacks };
}

// Se llama al iniciar sesión, al restaurarla desde el almacenamiento y al cerrarla (null).
export function fijarSesion(sesion) {
  sesionActual = sesion && sesion.access ? sesion : null;
}

async function enviar(ruta, opciones, token) {
  // Solo los cuerpos JSON llevan Content-Type; los FormData (archivos) lo arman fetch solo.
  const esJson = typeof (opciones && opciones.body) === 'string';
  // Los archivos (FormData) pueden tardar más en subirse que una consulta común.
  const limite = opciones && opciones.body instanceof FormData ? 60000 : 20000;
  const resp = await fetchConLimite(
    `${API_BASE_URL}${ruta}`,
    {
      ...opciones,
      headers: {
        ...(esJson ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opciones && opciones.headers),
      },
    },
    limite,
  );

  let datos = null;
  try {
    datos = await resp.json();
  } catch {
    datos = null;
  }

  return { ok: resp.ok, status: resp.status, datos };
}

// Pide un access nuevo. Si varias peticiones fallan a la vez, comparten una sola renovación.
function renovarAccess() {
  if (!renovacionEnCurso) {
    renovacionEnCurso = (async () => {
      if (!sesionActual || !sesionActual.refresh) return false;

      const resp = await enviar(
        'login/refresh/',
        { method: 'POST', body: JSON.stringify({ refresh: sesionActual.refresh }) },
        null,
      );
      if (!resp.ok || !resp.datos || !resp.datos.access) return false;

      sesionActual = { ...sesionActual, access: resp.datos.access };
      await callbacks.onRenovada(sesionActual);
      return true;
    })().finally(() => {
      renovacionEnCurso = null;
    });
  }
  return renovacionEnCurso;
}

// Petición a un endpoint protegido. `ruta` es relativa a /api/, por ejemplo "perfil/".
export async function peticionProtegida(ruta, opciones = {}) {
  if (!sesionActual) {
    return { ok: false, status: 401, datos: { error: 'No hay sesión iniciada.' } };
  }

  const primera = await enviar(ruta, opciones, sesionActual.access);
  if (primera.status !== 401) return primera;

  const renovado = await renovarAccess();
  if (!renovado) {
    await callbacks.onExpirada();
    return primera;
  }

  return enviar(ruta, opciones, sesionActual.access);
}

// Igual que peticionProtegida, pero nunca lanza: si no hay red devuelve { ok: false, status: 0 }.
// Lo usan las pantallas de perfil, servicios y consulta offline, que miran `resp.ok` en vez de usar try/catch.
export async function peticionProtegidaSegura(ruta, opciones = {}) {
  try {
    return await peticionProtegida(ruta, opciones);
  } catch {
    return {
      ok: false,
      status: 0,
      datos: { error: 'No se pudo conectar con el servidor. Verifique la conexión a la API.' },
    };
  }
}
