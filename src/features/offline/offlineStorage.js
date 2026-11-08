import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiAutenticada } from '../../api';

const PREFIJO_CLAVE = 'matech_offline_';

export async function guardarCopiaOffline(username, datos) {
  if (!username || !datos) return;
  try {
    const clave = `${PREFIJO_CLAVE}${username.toLowerCase()}`;
    await AsyncStorage.setItem(clave, JSON.stringify(datos));
  } catch {
    // Falla de almacenamiento silenciosa
  }
}

export async function obtenerCopiaOffline(username) {
  if (!username) return null;
  try {
    const clave = `${PREFIJO_CLAVE}${username.toLowerCase()}`;
    const raw = await AsyncStorage.getItem(clave);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function limpiarCopiaOffline(username) {
  if (!username) return;
  try {
    const clave = `${PREFIJO_CLAVE}${username.toLowerCase()}`;
    await AsyncStorage.removeItem(clave);
  } catch {
    // Error al remover clave
  }
}

export async function limpiarTodoOffline() {
  try {
    const todasLasClaves = await AsyncStorage.getAllKeys();
    const clavesOffline = todasLasClaves.filter((k) => k.startsWith(PREFIJO_CLAVE));
    if (clavesOffline.length > 0) {
      await AsyncStorage.multiRemove(clavesOffline);
    }
  } catch {
    // Error al limpiar todo
  }
}

export async function sincronizarDatosOffline(token, username) {
  if (!token) {
    const local = await obtenerCopiaOffline(username);
    return { ok: false, local, error: 'No hay token de sesión disponible.' };
  }

  try {
    const resp = await apiAutenticada('servicios/offline-bundle/', { method: 'GET' }, token);
    if (resp.ok && resp.datos) {
      await guardarCopiaOffline(username, resp.datos);
      return { ok: true, datos: resp.datos };
    }

    // Si falló el servidor, buscar copia local
    const local = await obtenerCopiaOffline(username);
    return {
      ok: false,
      local,
      error: resp.datos?.error || 'No se pudo sincronizar con el servidor.',
    };
  } catch {
    const local = await obtenerCopiaOffline(username);
    return {
      ok: false,
      local,
      error: 'Sin conexión con el servidor. Mostrando datos offline.',
    };
  }
}
