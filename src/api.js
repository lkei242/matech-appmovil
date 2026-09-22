import { Platform } from 'react-native';

// CELULAR FÍSICO: usá la IP de tu PC en la WiFi (ipconfig) y que el
// backend corra con "python manage.py runserver 0.0.0.0:8000"
// EMULADOR ANDROID: cambiá a 'http://10.0.2.2:8000/api/'
const IP_LOCAL = 'http://192.168.0.50:8000/api/';

export const API_BASE_URL = Platform.select({
  android: IP_LOCAL,
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