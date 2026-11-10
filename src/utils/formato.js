// Formato de importes y fechas para Argentina.
// La API devuelve importes como texto ("10000.00") y fechas como "AAAA-MM-DD".

export function formatoMoneda(valor) {
  const numero = Number(valor || 0);
  const [entera, decimales] = numero.toFixed(2).split('.');
  const conPuntos = entera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$ ${conPuntos},${decimales}`;
}

export function formatoFecha(iso) {
  if (!iso) return '—';
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

// Mientras se escribe una fecha, deja solo números y agrega los guiones: "20261110" -> "2026-11-10".
export function formatoFechaEscrita(texto) {
  const digitos = String(texto || '').replace(/\D/g, '').slice(0, 8);
  if (digitos.length <= 4) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 4)}-${digitos.slice(4)}`;
  return `${digitos.slice(0, 4)}-${digitos.slice(4, 6)}-${digitos.slice(6)}`;
}

// Verifica que "AAAA-MM-DD" sea una fecha real (rechaza por ejemplo 2026-13-45 o 2026-02-30).
export function fechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto || ''))) return false;
  const [anio, mes, dia] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

// Valida que un texto sea un importe mayor a cero.
// Acepta "10000.50", "10000,50" y "10.000,50" (con coma, los puntos son separadores de miles).
export function importeValido(texto) {
  const limpio = String(texto || '').trim();
  const normalizado = limpio.includes(',') ? limpio.replace(/\./g, '').replace(',', '.') : limpio;
  const numero = Number(normalizado);
  return normalizado !== '' && Number.isFinite(numero) && numero > 0 ? normalizado : null;
}
