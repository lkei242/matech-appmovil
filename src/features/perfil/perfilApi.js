import { peticionProtegidaSegura } from '../../api/cliente';

// Estas llamadas usan el cliente con renovación de sesión (cliente.js): si el access token
// venció, se renueva solo con el refresh token. El parámetro `token` se conserva por
// compatibilidad con las pantallas, pero ya no se usa: el cliente toma el token de la sesión.

export async function getPerfil() {
  return peticionProtegidaSegura('perfil/', { method: 'GET' });
}

export async function updatePerfil(_token, datos) {
  return peticionProtegidaSegura('perfil/', {
    method: 'PATCH',
    body: JSON.stringify(datos),
  });
}
