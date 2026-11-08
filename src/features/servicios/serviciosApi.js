import { apiAutenticada } from '../../api';

export async function getAlumnos(token) {
  return apiAutenticada('servicios/alumnos/', { method: 'GET' }, token);
}

export async function getMisServicios(token, alumnoId) {
  const query = alumnoId ? `?alumno=${alumnoId}` : '';
  return apiAutenticada(`servicios/mis-servicios/${query}`, { method: 'GET' }, token);
}

export async function getGruposDeportivos(token) {
  return apiAutenticada('servicios/deportes/grupos/', { method: 'GET' }, token);
}

export async function inscribirDeporte(token, alumnoId, grupoId) {
  return apiAutenticada(
    'servicios/deportes/inscripciones/',
    {
      method: 'POST',
      body: JSON.stringify({ alumno_id: alumnoId, grupo_id: grupoId }),
    },
    token
  );
}

export async function desinscribirDeporte(token, inscripcionId) {
  return apiAutenticada(
    `servicios/deportes/inscripciones/${inscripcionId}/`,
    {
      method: 'DELETE',
    },
    token
  );
}

export async function getRecorridosTransporte(token) {
  return apiAutenticada('servicios/transporte/recorridos/', { method: 'GET' }, token);
}

export async function actualizarTransporte(token, alumnoId, recorridoId) {
  return apiAutenticada(
    'servicios/transporte/inscripcion/',
    {
      method: 'PUT',
      body: JSON.stringify({ alumno_id: alumnoId, recorrido_id: recorridoId }),
    },
    token
  );
}

export async function actualizarComedor(token, alumnoId, inscripto) {
  return apiAutenticada(
    'servicios/comedor/',
    {
      method: 'PUT',
      body: JSON.stringify({ alumno_id: alumnoId, inscripto: Boolean(inscripto) }),
    },
    token
  );
}
