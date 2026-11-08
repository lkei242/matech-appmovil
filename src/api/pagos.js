// Llamadas a la API de cuotas, deuda, facturas, pagos y comprobantes.
// Todas usan el cliente con token (cliente.js), que renueva la sesión solo.

import { peticionProtegida } from './cliente';

export function listarAlumnos() {
  return peticionProtegida('alumnos/');
}

export function obtenerDeuda(legajo) {
  return peticionProtegida(`deuda/?alumno=${legajo}`);
}

export function listarCuotas(legajo) {
  return peticionProtegida(`cuotas/?alumno=${legajo}`);
}

export function listarFacturas({ alumno, desde, hasta } = {}) {
  const partes = [];
  if (alumno) partes.push(`alumno=${alumno}`);
  if (desde) partes.push(`desde=${encodeURIComponent(desde)}`);
  if (hasta) partes.push(`hasta=${encodeURIComponent(hasta)}`);
  return peticionProtegida(`facturas/${partes.length ? `?${partes.join('&')}` : ''}`);
}

export function obtenerFactura(id) {
  return peticionProtegida(`facturas/${id}/`);
}

// `clave` evita pagos duplicados: si la app reintenta con la misma clave, el servidor devuelve la misma solicitud.
export function crearSolicitudPago({ factura, items, clave }) {
  return peticionProtegida('pagos/', {
    method: 'POST',
    headers: { 'Idempotency-Key': clave },
    body: JSON.stringify({ factura, items }),
  });
}

// `archivo` viene de expo-document-picker: { uri, name, mimeType }.
export function subirComprobante({ factura, archivo, importe }) {
  const datos = new FormData();
  datos.append('archivo', {
    uri: archivo.uri,
    name: archivo.name,
    type: archivo.mimeType || 'application/octet-stream',
  });
  datos.append('importe', importe);
  return peticionProtegida(`facturas/${factura}/comprobantes/`, {
    method: 'POST',
    body: datos,
  });
}

// Clave única por intento de pago. Se genera una vez y se reutiliza en los reintentos.
export function nuevaClaveIdempotencia() {
  return `pago-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

// Convierte la respuesta en un mensaje legible; nunca deja que la pantalla se rompa.
export function mensajeDeError(resp, porDefecto = 'No se pudo completar la operación.') {
  if (resp && resp.datos && resp.datos.error) return resp.datos.error;
  if (resp && resp.status === 401) return 'Tu sesión venció. Volvé a iniciar sesión.';
  return porDefecto;
}
