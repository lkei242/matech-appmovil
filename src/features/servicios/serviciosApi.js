import { peticionProtegidaSegura } from '../../api/cliente';

// Estas llamadas usan el cliente con renovación de sesión (cliente.js): si el access token
// venció, se renueva solo con el refresh token. El parámetro `token` se conserva por
// compatibilidad con las pantallas, pero ya no se usa: el cliente toma el token de la sesión.

export async function getAlumnos() {
  return peticionProtegidaSegura('servicios/alumnos/', { method: 'GET' });
}

export async function getMisServicios(_token, alumnoId) {
  const query = alumnoId ? `?alumno=${alumnoId}` : '';
  return peticionProtegidaSegura(`servicios/mis-servicios/${query}`, { method: 'GET' });
}

export async function getGruposDeportivos() {
  return peticionProtegidaSegura('servicios/deportes/grupos/', { method: 'GET' });
}

export async function inscribirDeporte(_token, alumnoId, grupoId) {
  return peticionProtegidaSegura('servicios/deportes/inscripciones/', {
    method: 'POST',
    body: JSON.stringify({ alumno_id: alumnoId, grupo_id: grupoId }),
  });
}

export async function desinscribirDeporte(_token, inscripcionId) {
  return peticionProtegidaSegura(`servicios/deportes/inscripciones/${inscripcionId}/`, {
    method: 'DELETE',
  });
}

export async function getRecorridosTransporte() {
  return peticionProtegidaSegura('servicios/transporte/recorridos/', { method: 'GET' });
}

export async function actualizarTransporte(_token, alumnoId, recorridoId) {
  return peticionProtegidaSegura('servicios/transporte/inscripcion/', {
    method: 'PUT',
    body: JSON.stringify({ alumno_id: alumnoId, recorrido_id: recorridoId }),
  });
}

export async function actualizarComedor(_token, alumnoId, inscripto) {
  return peticionProtegidaSegura('servicios/comedor/', {
    method: 'PUT',
    body: JSON.stringify({ alumno_id: alumnoId, inscripto: Boolean(inscripto) }),
  });
}
