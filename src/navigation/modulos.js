// Registro de módulos de la app y a qué roles se muestran.
//
// Para agregar un módulo: sumar una entrada acá y registrar su pantalla en App.js.
// Los roles vienen de la API (`rol` en el login) y son los mismos que en el backend.
// Mostrar un módulo no reemplaza la validación: el servidor controla cada operación.

export const ETIQUETAS_ROL = {
  alumno: 'Alumno',
  docente: 'Docente',
  padre: 'Tutor (Padre/Madre)',
  preceptor: 'Preceptor',
  directivo: 'Directivo',
  administrativo: 'Personal Administrativo',
};

export const MODULOS = [
  {
    id: 'cuotas',
    titulo: 'Cuotas y deuda',
    descripcion: 'Pendientes, vencimientos y deuda por ítem',
    roles: ['padre', 'alumno', 'administrativo', 'directivo'],
    pantalla: 'Cuotas',
  },
  {
    id: 'pagar',
    titulo: 'Pagar',
    descripcion: 'Elegí qué pagar y cargá el comprobante de transferencia',
    roles: ['padre'],
    pantalla: 'Pagar',
  },
  {
    id: 'facturas',
    titulo: 'Facturas y comprobantes',
    descripcion: 'Consultá facturas por período',
    roles: ['padre', 'alumno', 'administrativo', 'directivo'],
    pantalla: 'Facturas',
  },
];

export function modulosPara(rol) {
  return MODULOS.filter((modulo) => modulo.roles.includes(rol));
}
