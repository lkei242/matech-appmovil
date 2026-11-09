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

const TODOS_LOS_ROLES = ['padre', 'alumno', 'administrativo', 'directivo', 'docente', 'preceptor'];
const ROLES_CON_CUENTA_ALUMNO = ['padre', 'alumno', 'administrativo', 'directivo'];
const ROLES_PERSONAL_ESCOLAR = ['administrativo', 'directivo', 'docente', 'preceptor'];

const AZUL = { fondo: '#E8F2FF', colorTexto: '#1D66C2' };
const VERDE = { fondo: '#EDF6E7', colorTexto: '#4C7A2E' };
const NARANJA = { fondo: '#FFF4E5', colorTexto: '#D97706' };

export const MODULOS = [
  {
    id: 'buscar_alumnos',
    titulo: 'Búsqueda de Alumnos',
    descripcion: 'Padrón escolar con filtros por nombre, DNI, curso, fecha de nacimiento y servicios.',
    icono: '🔍',
    roles: ROLES_PERSONAL_ESCOLAR,
    pantalla: 'BuscarAlumnos',
    ...NARANJA,
  },
  {
    id: 'cuotas',
    titulo: 'Cuotas y deuda',
    descripcion: 'Pendientes, vencimientos y deuda por ítem.',
    icono: '💳',
    roles: ROLES_CON_CUENTA_ALUMNO,
    pantalla: 'Cuotas',
    ...AZUL,
  },
  {
    id: 'pagar',
    titulo: 'Pagar',
    descripcion: 'Elegí qué pagar y cargá el comprobante de transferencia.',
    icono: '🧾',
    roles: ['padre'],
    pantalla: 'Pagar',
    ...AZUL,
  },
  {
    id: 'facturas',
    titulo: 'Facturas y comprobantes',
    descripcion: 'Consultá facturas y comprobantes por período.',
    icono: '📄',
    roles: ROLES_CON_CUENTA_ALUMNO,
    pantalla: 'Facturas',
    ...AZUL,
  },
  {
    id: 'servicios',
    titulo: 'Servicios Escolares',
    descripcion: 'Inscripción a deportes (máx. 2), transporte (4 recorridos) y comedor escolar.',
    icono: '🏃',
    roles: ROLES_CON_CUENTA_ALUMNO,
    pantalla: 'Servicios',
    ...AZUL,
  },
  {
    id: 'perfil',
    titulo: 'Mi Perfil',
    descripcion: 'Consulta y actualización de correo electrónico y teléfono de contacto.',
    icono: '👤',
    roles: TODOS_LOS_ROLES,
    pantalla: 'Perfil',
    ...AZUL,
  },
  {
    id: 'offline',
    titulo: 'Consulta Offline',
    descripcion: 'Horarios, recorridos y comunicados guardados para usar sin conexión.',
    icono: '📶',
    roles: TODOS_LOS_ROLES,
    pantalla: 'Offline',
    ...VERDE,
  },
];

export function modulosPara(rol) {
  return MODULOS.filter((modulo) => modulo.roles.includes(rol));
}
