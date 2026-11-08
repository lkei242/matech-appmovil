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

// Valida que un texto sea un importe mayor a cero (coma o punto como separador).
export function importeValido(texto) {
  const normalizado = String(texto || '').trim().replace(',', '.');
  const numero = Number(normalizado);
  return normalizado !== '' && Number.isFinite(numero) && numero > 0 ? normalizado : null;
}
