import { Platform, NativeModules } from 'react-native';

// Detectar automáticamente la IP de la PC (servidor Metro de Expo) en el celular
function getDevServerIp() {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const address = scriptURL.split('://')[1]?.split('/')[0];
      const host = address?.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
    }
  } catch {
    // Si falla o no está disponible, se usa el fallback
  }
  return null;
}

const devIp = getDevServerIp();

// Prioridad para la URL de la API:
// 1. Variable de entorno EXPO_PUBLIC_API_URL (en .env.local de cada desarrollador)
// 2. IP detectada automáticamente de la PC al correr Expo en el celular
// 3. Fallback: emulador Android (10.0.2.2) o web/localhost
const DETECTED_URL = process.env.EXPO_PUBLIC_API_URL || (devIp ? `http://${devIp}:8000/api/` : null);

export const API_BASE_URL = DETECTED_URL || Platform.select({
  android: 'http://10.0.2.2:8000/api/',
  default: 'http://localhost:8000/api/',
});

async function peticion(ruta, opciones) {
  const resp = await fetch(`${API_BASE_URL}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });

  let datos = null;
  try {
    datos = await resp.json();
  } catch {
    datos = null;
  }

  return { ok: resp.ok, status: resp.status, datos };
}

export async function apiLogin(usuario, password) {
  return peticion('login/', {
    method: 'POST',
    body: JSON.stringify({ usuario, password }),
  });
}

export async function apiLogout(refresh) {
  if (!refresh) return { ok: true };
  return peticion('logout/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  });
}

export async function apiRecuperarContrasena(correo) {
  return peticion('recuperar-contrasena/', {
    method: 'POST',
    body: JSON.stringify({ correo }),
  });
}