// Tema visual de la app: colores tomados del logo de "Educar para Transformar".
// Los mismos tonos se usan en el sitio web, así que la app y la web se ven como un solo producto.

export const colores = {
  // Colores del logo
  azul: '#0B4DA8',
  azulOscuro: '#093C82',
  celeste: '#4FA8E8',
  verde: '#84C440',
  rosa: '#E50A8C',
  violeta: '#9A1E8C',
  naranja: '#EE4A2A',

  // Variantes con buen contraste para texto y botones
  naranjaAccion: '#C73B1B',
  verdeTexto: '#3F6B14',
  rosaTexto: '#A10762',
  naranjaTexto: '#B3300F',

  // Superficies y texto
  fondo: '#F6F9FD',
  superficie: '#FFFFFF',
  borde: '#DCE5F0',
  tinta: '#0F2A4D',
  texto: '#3A4D66',
  suave: '#5B6B80',

  // Fondos suaves por color
  celesteSuave: '#EAF4FD',
  verdeSuave: '#F1F8E8',
  rosaSuave: '#FDE8F3',
  naranjaSuave: '#FEEDE8',
  violetaSuave: '#F5E6F3',

  // Estados
  error: '#B3261E',
  errorSuave: '#FDECEA',
  exito: '#2F6B1B',
  exitoSuave: '#F1F8E8',
};

export const radio = {
  sm: 10,
  md: 14,
  lg: 20,
  pastilla: 999,
};

export const sombra = {
  suave: {
    shadowColor: '#0F2A4D',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
};

// Familia de cada "tono" que usan insignias, íconos y avisos.
export const tonos = {
  azul: { fondo: colores.celesteSuave, texto: colores.azul, acento: colores.celeste },
  verde: { fondo: colores.verdeSuave, texto: colores.verdeTexto, acento: colores.verde },
  rosa: { fondo: colores.rosaSuave, texto: colores.rosaTexto, acento: colores.rosa },
  naranja: { fondo: colores.naranjaSuave, texto: colores.naranjaTexto, acento: colores.naranja },
  violeta: { fondo: colores.violetaSuave, texto: colores.violeta, acento: colores.violeta },
  gris: { fondo: '#EEF2F7', texto: colores.suave, acento: colores.suave },
};
