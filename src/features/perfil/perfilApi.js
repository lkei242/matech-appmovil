import { apiAutenticada } from '../../api';

export async function getPerfil(token) {
  return apiAutenticada('perfil/', { method: 'GET' }, token);
}

export async function updatePerfil(token, datos) {
  return apiAutenticada(
    'perfil/',
    {
      method: 'PATCH',
      body: JSON.stringify(datos),
    },
    token
  );
}
