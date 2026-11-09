// Pantalla de Búsqueda y Padrón de Alumnos para Personal Escolar
// (Administración, Directivos, Docentes y Preceptores).
//
// Permite buscar por texto libre (nombre, apellido, DNI, legajo) y filtrar por
// nivel, turno, año de curso, fecha o año de nacimiento, estado y comedor escolar.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { listarAlumnos, mensajeDeError } from '../../api/pagos';
import { useAuth } from '../../auth/AuthContext';

function calcularEdad(fechaIso) {
  if (!fechaIso) return null;
  try {
    const nacimiento = new Date(fechaIso);
    if (isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad >= 0 ? edad : null;
  } catch {
    return null;
  }
}

function colorPorNivel(nivel) {
  const n = (nivel || '').toLowerCase();
  if (n.includes('inicial')) return { fondo: '#FEF3C7', texto: '#B45309', badge: '#F59E0B' };
  if (n.includes('primari')) return { fondo: '#D1FAE5', texto: '#047857', badge: '#10B981' };
  if (n.includes('secundari')) return { fondo: '#DBEAFE', texto: '#1D4ED8', badge: '#3B82F6' };
  return { fondo: '#E2E8F0', texto: '#475569', badge: '#64748B' };
}

export default function BuscarAlumnosScreen({ navigation }) {
  const { sesion } = useAuth();
  const rolUsuario = sesion?.rol || '';

  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('Todos');
  const [filtroTurno, setFiltroTurno] = useState('Todos');
  const [filtroAnioCurso, setFiltroAnioCurso] = useState('Todos');
  const [filtroAnioNac, setFiltroAnioNac] = useState('Todos');
  const [filtroComedor, setFiltroComedor] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [panelFiltrosVisible, setPanelFiltrosVisible] = useState(false);

  // Alumno seleccionado para ver su ficha completa
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const cargarAlumnos = useCallback(async () => {
    try {
      setError('');
      const resp = await listarAlumnos();
      if (!resp.ok) {
        throw new Error(mensajeDeError(resp, 'No se pudo cargar el padrón de alumnos.'));
      }
      setAlumnos(resp.datos || []);
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargarAlumnos();
  }, [cargarAlumnos]);

  const onRefresh = useCallback(() => {
    setRefrescando(true);
    cargarAlumnos();
  }, [cargarAlumnos]);

  // Años de nacimiento presentes en el padrón para el filtro rápido
  const aniosNacimientoDisponibles = useMemo(() => {
    const set = new Set();
    alumnos.forEach((a) => {
      if (a.fecha_nacimiento) {
        const y = a.fecha_nacimiento.split('-')[0];
        if (y && y.length === 4) set.add(y);
      }
    });
    return ['Todos', ...Array.from(set).sort((a, b) => b - a)];
  }, [alumnos]);

  // Años de curso presentes en el padrón
  const aniosCursoDisponibles = useMemo(() => {
    const set = new Set();
    alumnos.forEach((a) => {
      if (a.anio) set.add(String(a.anio));
    });
    return ['Todos', ...Array.from(set).sort((a, b) => a - b)];
  }, [alumnos]);

  // Conteo de filtros activos
  const filtrosActivosCount = useMemo(() => {
    let c = 0;
    if (filtroNivel !== 'Todos') c++;
    if (filtroTurno !== 'Todos') c++;
    if (filtroAnioCurso !== 'Todos') c++;
    if (filtroAnioNac !== 'Todos') c++;
    if (filtroComedor !== 'Todos') c++;
    if (filtroEstado !== 'Todos') c++;
    return c;
  }, [filtroNivel, filtroTurno, filtroAnioCurso, filtroAnioNac, filtroComedor, filtroEstado]);

  const limpiarTodosLosFiltros = () => {
    setTextoBusqueda('');
    setFiltroNivel('Todos');
    setFiltroTurno('Todos');
    setFiltroAnioCurso('Todos');
    setFiltroAnioNac('Todos');
    setFiltroComedor('Todos');
    setFiltroEstado('Todos');
  };

  // Filtrado en vivo de alumnos
  const alumnosFiltrados = useMemo(() => {
    const q = textoBusqueda.trim().toLowerCase();
    return alumnos.filter((alum) => {
      // Búsqueda por texto (Nombre, Apellido, DNI, Legajo, Curso)
      if (q) {
        const nombreCompleto = `${alum.nombre || ''} ${alum.apellido || ''}`.toLowerCase();
        const dniStr = String(alum.dni || '').toLowerCase();
        const legajoStr = String(alum.legajo || '').toLowerCase();
        const cursoStr = String(alum.curso || '').toLowerCase();
        const tutorNombre = alum.tutor?.nombre ? alum.tutor.nombre.toLowerCase() : '';
        const match =
          nombreCompleto.includes(q) ||
          dniStr.includes(q) ||
          legajoStr.includes(q) ||
          cursoStr.includes(q) ||
          tutorNombre.includes(q);
        if (!match) return false;
      }

      // Filtro Nivel
      if (filtroNivel !== 'Todos') {
        if (!alum.nivel || alum.nivel.toLowerCase() !== filtroNivel.toLowerCase()) return false;
      }

      // Filtro Turno
      if (filtroTurno !== 'Todos') {
        if (!alum.turno || alum.turno.toLowerCase() !== filtroTurno.toLowerCase()) return false;
      }

      // Filtro Año de Curso
      if (filtroAnioCurso !== 'Todos') {
        if (String(alum.anio) !== filtroAnioCurso) return false;
      }

      // Filtro Año de Nacimiento
      if (filtroAnioNac !== 'Todos') {
        const anioNac = alum.fecha_nacimiento ? alum.fecha_nacimiento.split('-')[0] : '';
        if (anioNac !== filtroAnioNac) return false;
      }

      // Filtro Comedor
      if (filtroComedor !== 'Todos') {
        const tieneComedor = Boolean(alum.inscripto_comedor);
        if (filtroComedor === 'Inscripto' && !tieneComedor) return false;
        if (filtroComedor === 'No inscripto' && tieneComedor) return false;
      }

      // Filtro Estado
      if (filtroEstado !== 'Todos') {
        if ((alum.estado || '').toLowerCase() !== filtroEstado.toLowerCase()) return false;
      }

      return true;
    });
  }, [
    alumnos,
    textoBusqueda,
    filtroNivel,
    filtroTurno,
    filtroAnioCurso,
    filtroAnioNac,
    filtroComedor,
    filtroEstado,
  ]);

  const llamarTutor = (telefono) => {
    if (!telefono) {
      Alert.alert('Sin teléfono', 'El alumno no tiene registrado un teléfono de contacto.');
      return;
    }
    Linking.openURL(`tel:${telefono}`);
  };

  const enviarEmailTutor = (email) => {
    if (!email) {
      Alert.alert('Sin correo', 'El alumno no tiene registrado un correo electrónico de contacto.');
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const puedeVerFinanzas = ['administrativo', 'directivo'].includes(rolUsuario);

  return (
    <SafeAreaView style={styles.pantalla}>
      {/* Barra de cabecera con buscador */}
      <View style={styles.header}>
        <View style={styles.buscadorContenedor}>
          <Text style={styles.buscadorLupa}>🔍</Text>
          <TextInput
            style={styles.buscadorInput}
            placeholder="Buscar por nombre, apellido, DNI, legajo..."
            placeholderTextColor="#8E9DAE"
            value={textoBusqueda}
            onChangeText={setTextoBusqueda}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
          {textoBusqueda.length > 0 && Platform.OS !== 'ios' ? (
            <TouchableOpacity onPress={() => setTextoBusqueda('')} style={styles.botonLimpiarInput}>
              <Text style={styles.limpiarTexto}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Botón de toggle de filtros */}
        <TouchableOpacity
          style={[styles.botonFiltroToggle, (panelFiltrosVisible || filtrosActivosCount > 0) && styles.botonFiltroToggleActivo]}
          onPress={() => setPanelFiltrosVisible(!panelFiltrosVisible)}
          accessibilityRole="button"
        >
          <Text style={[styles.botonFiltroTexto, (panelFiltrosVisible || filtrosActivosCount > 0) && styles.botonFiltroTextoActivo]}>
            ⚙ Filtros {filtrosActivosCount > 0 ? `(${filtrosActivosCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Panel desplegable de filtros avanzados */}
      {panelFiltrosVisible && (
        <View style={styles.panelFiltros}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            {/* Filtro: Nivel */}
            <Text style={styles.filtroTitulo}>Nivel Educativo:</Text>
            <View style={styles.chipsRow}>
              {['Todos', 'Inicial', 'Primario', 'Secundario'].map((nv) => {
                const activo = filtroNivel === nv;
                return (
                  <TouchableOpacity
                    key={nv}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => setFiltroNivel(nv)}
                  >
                    <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{nv}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filtro: Año de Curso */}
            {aniosCursoDisponibles.length > 2 && (
              <>
                <Text style={styles.filtroTitulo}>Año de Curso:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {aniosCursoDisponibles.map((a) => {
                    const activo = filtroAnioCurso === a;
                    return (
                      <TouchableOpacity
                        key={a}
                        style={[styles.chip, activo && styles.chipActivo]}
                        onPress={() => setFiltroAnioCurso(a)}
                      >
                        <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                          {a === 'Todos' ? 'Todos' : `${a}°`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Filtro: Turno */}
            <Text style={styles.filtroTitulo}>Turno:</Text>
            <View style={styles.chipsRow}>
              {['Todos', 'Mañana', 'Tarde', 'Vespertino'].map((tn) => {
                const activo = filtroTurno === tn;
                return (
                  <TouchableOpacity
                    key={tn}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => setFiltroTurno(tn)}
                  >
                    <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{tn}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filtro: Año de Nacimiento */}
            {aniosNacimientoDisponibles.length > 2 && (
              <>
                <Text style={styles.filtroTitulo}>Año de Nacimiento:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {aniosNacimientoDisponibles.map((y) => {
                    const activo = filtroAnioNac === y;
                    return (
                      <TouchableOpacity
                        key={y}
                        style={[styles.chip, activo && styles.chipActivo]}
                        onPress={() => setFiltroAnioNac(y)}
                      >
                        <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{y}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Filtro: Comedor Escolar */}
            <Text style={styles.filtroTitulo}>Comedor Escolar:</Text>
            <View style={styles.chipsRow}>
              {['Todos', 'Inscripto', 'No inscripto'].map((cm) => {
                const activo = filtroComedor === cm;
                return (
                  <TouchableOpacity
                    key={cm}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => setFiltroComedor(cm)}
                  >
                    <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{cm}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Filtro: Estado */}
            <Text style={styles.filtroTitulo}>Estado Académico:</Text>
            <View style={styles.chipsRow}>
              {['Todos', 'Activo', 'Inactivo'].map((est) => {
                const activo = filtroEstado === est;
                return (
                  <TouchableOpacity
                    key={est}
                    style={[styles.chip, activo && styles.chipActivo]}
                    onPress={() => setFiltroEstado(est)}
                  >
                    <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{est}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones de acción del panel */}
            <View style={styles.accionesFiltro}>
              <TouchableOpacity style={styles.botonLimpiarFiltros} onPress={limpiarTodosLosFiltros}>
                <Text style={styles.botonLimpiarFiltrosTexto}>Limpiar filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.botonAplicarFiltros}
                onPress={() => setPanelFiltrosVisible(false)}
              >
                <Text style={styles.botonAplicarFiltrosTexto}>Ver resultados ({alumnosFiltrados.length})</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Barra de conteo y filtros aplicados */}
      <View style={styles.barraResultados}>
        <Text style={styles.textoConteo}>
          {alumnosFiltrados.length} {alumnosFiltrados.length === 1 ? 'alumno' : 'alumnos'}{' '}
          {alumnosFiltrados.length !== alumnos.length ? `(de ${alumnos.length} en total)` : 'en padrón'}
        </Text>
        {filtrosActivosCount > 0 || textoBusqueda ? (
          <TouchableOpacity onPress={limpiarTodosLosFiltros}>
            <Text style={styles.enlaceLimpiar}>Limpiar filtros</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Listado principal */}
      {cargando ? (
        <View style={styles.centrado}>
          <ActivityIndicator size="large" color="#1D66C2" />
          <Text style={styles.cargandoTexto}>Cargando padrón escolar...</Text>
        </View>
      ) : error ? (
        <View style={styles.centrado}>
          <Text style={styles.errorIcono}>⚠️</Text>
          <Text style={styles.errorTexto}>{error}</Text>
          <TouchableOpacity style={styles.botonReintentar} onPress={cargarAlumnos}>
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listaContenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={['#1D66C2']} />}
        >
          {alumnosFiltrados.length === 0 ? (
            <View style={styles.vacioContenedor}>
              <Text style={styles.vacioIcono}>🔍</Text>
              <Text style={styles.vacioTitulo}>Sin coincidencias</Text>
              <Text style={styles.vacioDesc}>
                No se encontraron alumnos con los criterios de búsqueda o filtros seleccionados.
              </Text>
              <TouchableOpacity style={styles.botonLimpiarVacio} onPress={limpiarTodosLosFiltros}>
                <Text style={styles.botonLimpiarVacioTexto}>Limpiar todos los filtros</Text>
              </TouchableOpacity>
            </View>
          ) : (
            alumnosFiltrados.map((alum) => {
              const paleta = colorPorNivel(alum.nivel);
              const edad = calcularEdad(alum.fecha_nacimiento);
              return (
                <TouchableOpacity
                  key={alum.legajo}
                  style={styles.tarjetaAlumno}
                  onPress={() => setAlumnoSeleccionado(alum)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: paleta.fondo }]}>
                    <Text style={[styles.avatarTexto, { color: paleta.texto }]}>
                      {(alum.nombre?.[0] || 'A') + (alum.apellido?.[0] || '')}
                    </Text>
                  </View>

                  <View style={styles.infoAlumno}>
                    <View style={styles.filaNombre}>
                      <Text style={styles.nombreAlumno}>
                        {alum.nombre} {alum.apellido}
                      </Text>
                      {alum.nivel ? (
                        <View style={[styles.badgeNivel, { backgroundColor: paleta.fondo }]}>
                          <Text style={[styles.badgeNivelTexto, { color: paleta.texto }]}>
                            {alum.nivel}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.filaBadges}>
                      <Text style={styles.datoBadge}>Leg: {alum.legajo}</Text>
                      {alum.dni ? <Text style={styles.datoBadge}> · DNI: {alum.dni}</Text> : null}
                      {alum.curso ? <Text style={styles.datoBadge}> · {alum.curso}</Text> : null}
                      {alum.turno ? <Text style={styles.datoBadge}> · {alum.turno}</Text> : null}
                    </View>

                    <View style={styles.filaSecundaria}>
                      {alum.fecha_nacimiento ? (
                        <Text style={styles.fechaNac}>
                          🎂 {alum.fecha_nacimiento} {edad !== null ? `(${edad} años)` : ''}
                        </Text>
                      ) : null}

                      {alum.inscripto_comedor ? (
                        <View style={styles.badgeComedor}>
                          <Text style={styles.badgeComedorTexto}>🍽️ Comedor</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Text style={styles.flecha}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal Ficha Completa del Alumno */}
      <Modal
        visible={Boolean(alumnoSeleccionado)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAlumnoSeleccionado(null)}
      >
        <SafeAreaView style={styles.modalFichaContenedor}>
          <View style={styles.modalFichaHeader}>
            <Text style={styles.modalFichaTitulo}>Ficha del Alumno</Text>
            <TouchableOpacity
              style={styles.botonCerrarModal}
              onPress={() => setAlumnoSeleccionado(null)}
            >
              <Text style={styles.botonCerrarTexto}>✕</Text>
            </TouchableOpacity>
          </View>

          {alumnoSeleccionado && (
            <ScrollView contentContainerStyle={styles.modalFichaContenido}>
              {/* Tarjeta de Identidad */}
              <View style={styles.fichaCabecera}>
                <View
                  style={[
                    styles.avatarGrande,
                    { backgroundColor: colorPorNivel(alumnoSeleccionado.nivel).fondo },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarGrandeTexto,
                      { color: colorPorNivel(alumnoSeleccionado.nivel).texto },
                    ]}
                  >
                    {(alumnoSeleccionado.nombre?.[0] || 'A') + (alumnoSeleccionado.apellido?.[0] || '')}
                  </Text>
                </View>
                <Text style={styles.fichaNombreCompleto}>
                  {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido}
                </Text>
                <Text style={styles.fichaSubtitulo}>
                  Legajo: {alumnoSeleccionado.legajo} · DNI: {alumnoSeleccionado.dni || 'No registrado'}
                </Text>
                <View style={styles.filaBadgesFicha}>
                  <View style={[styles.badgeEstado, alumnoSeleccionado.estado === 'Activo' ? styles.badgeActivo : styles.badgeInactivo]}>
                    <Text style={styles.badgeEstadoTexto}>{alumnoSeleccionado.estado || 'Activo'}</Text>
                  </View>
                  {alumnoSeleccionado.nivel && (
                    <View style={[styles.badgeNivelFicha, { backgroundColor: colorPorNivel(alumnoSeleccionado.nivel).fondo }]}>
                      <Text style={[styles.badgeNivelFichaTexto, { color: colorPorNivel(alumnoSeleccionado.nivel).texto }]}>
                        {alumnoSeleccionado.nivel}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Sección: Datos Académicos */}
              <View style={styles.seccionFicha}>
                <Text style={styles.seccionFichaTitulo}>📚 Datos Académicos</Text>
                <View style={styles.filaDato}>
                  <Text style={styles.datoEtiqueta}>Curso / Comisión:</Text>
                  <Text style={styles.datoValor}>{alumnoSeleccionado.curso || 'Sin asignar'}</Text>
                </View>
                <View style={styles.filaDato}>
                  <Text style={styles.datoEtiqueta}>Turno:</Text>
                  <Text style={styles.datoValor}>{alumnoSeleccionado.turno || 'Sin especificar'}</Text>
                </View>
                <View style={styles.filaDato}>
                  <Text style={styles.datoEtiqueta}>Fecha de Ingreso:</Text>
                  <Text style={styles.datoValor}>{alumnoSeleccionado.fecha_ingreso || 'No registrada'}</Text>
                </View>
              </View>

              {/* Sección: Datos Personales */}
              <View style={styles.seccionFicha}>
                <Text style={styles.seccionFichaTitulo}>👤 Información Personal</Text>
                <View style={styles.filaDato}>
                  <Text style={styles.datoEtiqueta}>Fecha de Nacimiento:</Text>
                  <Text style={styles.datoValor}>
                    {alumnoSeleccionado.fecha_nacimiento || 'No registrada'}{' '}
                    {calcularEdad(alumnoSeleccionado.fecha_nacimiento) !== null
                      ? `(${calcularEdad(alumnoSeleccionado.fecha_nacimiento)} años)`
                      : ''}
                  </Text>
                </View>
                <View style={styles.filaDato}>
                  <Text style={styles.datoEtiqueta}>Domicilio:</Text>
                  <Text style={styles.datoValor}>{alumnoSeleccionado.direccion || 'No registrado'}</Text>
                </View>
                {alumnoSeleccionado.telefono ? (
                  <View style={styles.filaDato}>
                    <Text style={styles.datoEtiqueta}>Teléfono Alumno:</Text>
                    <Text style={styles.datoValor}>{alumnoSeleccionado.telefono}</Text>
                  </View>
                ) : null}
                {alumnoSeleccionado.email ? (
                  <View style={styles.filaDato}>
                    <Text style={styles.datoEtiqueta}>Correo Alumno:</Text>
                    <Text style={styles.datoValor}>{alumnoSeleccionado.email}</Text>
                  </View>
                ) : null}
              </View>

              {/* Sección: Tutor / Familiar a Cargo */}
              <View style={styles.seccionFicha}>
                <Text style={styles.seccionFichaTitulo}>👨‍👩‍👧 Tutor / Contacto de Emergencia</Text>
                {alumnoSeleccionado.tutor ? (
                  <>
                    <View style={styles.filaDato}>
                      <Text style={styles.datoEtiqueta}>Nombre del Tutor:</Text>
                      <Text style={styles.datoValor}>{alumnoSeleccionado.tutor.nombre}</Text>
                    </View>
                    <View style={styles.filaDato}>
                      <Text style={styles.datoEtiqueta}>Parentesco:</Text>
                      <Text style={styles.datoValor}>{alumnoSeleccionado.tutor.parentesco}</Text>
                    </View>
                    <View style={styles.filaDato}>
                      <Text style={styles.datoEtiqueta}>Teléfono de contacto:</Text>
                      <Text style={styles.datoValor}>{alumnoSeleccionado.tutor.telefono || 'Sin teléfono'}</Text>
                    </View>
                    <View style={styles.filaDato}>
                      <Text style={styles.datoEtiqueta}>Correo de contacto:</Text>
                      <Text style={styles.datoValor}>{alumnoSeleccionado.tutor.email || 'Sin correo'}</Text>
                    </View>

                    {/* Botones de acción directa con el tutor */}
                    <View style={styles.filaBotonesContacto}>
                      {alumnoSeleccionado.tutor.telefono ? (
                        <TouchableOpacity
                          style={styles.botonContacto}
                          onPress={() => llamarTutor(alumnoSeleccionado.tutor.telefono)}
                        >
                          <Text style={styles.botonContactoTexto}>📞 Llamar al Tutor</Text>
                        </TouchableOpacity>
                      ) : null}
                      {alumnoSeleccionado.tutor.email ? (
                        <TouchableOpacity
                          style={[styles.botonContacto, styles.botonContactoEmail]}
                          onPress={() => enviarEmailTutor(alumnoSeleccionado.tutor.email)}
                        >
                          <Text style={[styles.botonContactoTexto, styles.botonContactoTextoEmail]}>
                            ✉️ Enviar Correo
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </>
                ) : (
                  <Text style={styles.sinTutorTexto}>No se encuentra un tutor vinculado registrado en el sistema.</Text>
                )}
              </View>

              {/* Sección: Servicios Escolares */}
              <View style={styles.seccionFicha}>
                <Text style={styles.seccionFichaTitulo}>🏫 Servicios Escolares</Text>
                <View style={styles.filaDato}>
                  <Text style={styles.datoEtiqueta}>Comedor Escolar:</Text>
                  <Text style={[styles.datoValor, alumnoSeleccionado.inscripto_comedor ? styles.valorActivo : styles.valorInactivo]}>
                    {alumnoSeleccionado.inscripto_comedor ? '✓ Inscripto (Almuerzo diario)' : '✕ No inscripto'}
                  </Text>
                </View>
              </View>

              {/* Accesos directos a módulos de la app para este alumno */}
              <View style={styles.seccionAccesos}>
                <Text style={styles.seccionFichaTitulo}>⚡ Accesos Rápidos</Text>
                <View style={styles.filaBotonesAcceso}>
                  {puedeVerFinanzas && (
                    <>
                      <TouchableOpacity
                        style={styles.botonAcceso}
                        onPress={() => {
                          const leg = alumnoSeleccionado.legajo;
                          setAlumnoSeleccionado(null);
                          navigation.navigate('Cuotas', { legajo: leg });
                        }}
                      >
                        <Text style={styles.botonAccesoTexto}>💳 Ver Cuotas / Deuda</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.botonAcceso}
                        onPress={() => {
                          const leg = alumnoSeleccionado.legajo;
                          setAlumnoSeleccionado(null);
                          navigation.navigate('Facturas', { legajo: leg });
                        }}
                      >
                        <Text style={styles.botonAccesoTexto}>📄 Ver Facturas</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  <TouchableOpacity
                    style={styles.botonAcceso}
                    onPress={() => {
                      setAlumnoSeleccionado(null);
                      navigation.navigate('Servicios');
                    }}
                  >
                    <Text style={styles.botonAccesoTexto}>🏃 Servicios Escolares</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F6F9FC',
  },
  header: {
    backgroundColor: '#0B3D63',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  buscadorContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  buscadorLupa: {
    fontSize: 16,
    marginRight: 8,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 14,
    color: '#18324B',
  },
  botonLimpiarInput: {
    padding: 6,
  },
  limpiarTexto: {
    color: '#8E9DAE',
    fontSize: 14,
  },
  botonFiltroToggle: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  botonFiltroToggleActivo: {
    backgroundColor: '#FFFFFF',
  },
  botonFiltroTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  botonFiltroTextoActivo: {
    color: '#0B3D63',
  },
  panelFiltros: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE6EF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  filtroTitulo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#62758A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  chipsScroll: {
    gap: 6,
    paddingBottom: 6,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActivo: {
    backgroundColor: '#0B3D63',
    borderColor: '#0B3D63',
  },
  chipTexto: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  chipTextoActivo: {
    color: '#FFFFFF',
  },
  accionesFiltro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  botonLimpiarFiltros: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  botonLimpiarFiltrosTexto: {
    color: '#B91D6A',
    fontWeight: '700',
    fontSize: 13,
  },
  botonAplicarFiltros: {
    backgroundColor: '#0B3D63',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botonAplicarFiltrosTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  barraResultados: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  textoConteo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#62758A',
  },
  enlaceLimpiar: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D66C2',
  },
  centrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cargandoTexto: {
    marginTop: 12,
    color: '#62758A',
    fontSize: 14,
  },
  errorIcono: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorTexto: {
    color: '#B91D6A',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  botonReintentar: {
    backgroundColor: '#0B3D63',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  botonReintentarTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listaContenido: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tarjetaAlumno: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DCE6EF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoAlumno: {
    flex: 1,
  },
  filaNombre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreAlumno: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18324B',
    flex: 1,
  },
  badgeNivel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeNivelTexto: {
    fontSize: 11,
    fontWeight: '700',
  },
  filaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  datoBadge: {
    fontSize: 12,
    color: '#62758A',
  },
  filaSecundaria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  fechaNac: {
    fontSize: 12,
    color: '#475569',
  },
  badgeComedor: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeComedorTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  flecha: {
    fontSize: 22,
    color: '#8E9DAE',
    marginLeft: 8,
  },
  vacioContenedor: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  vacioIcono: {
    fontSize: 44,
    marginBottom: 8,
  },
  vacioTitulo: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18324B',
    marginBottom: 4,
  },
  vacioDesc: {
    fontSize: 13,
    color: '#62758A',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  botonLimpiarVacio: {
    backgroundColor: '#E8F2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  botonLimpiarVacioTexto: {
    color: '#1D66C2',
    fontWeight: '700',
    fontSize: 13,
  },
  modalFichaContenedor: {
    flex: 1,
    backgroundColor: '#F6F9FC',
  },
  modalFichaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE6EF',
  },
  modalFichaTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18324B',
  },
  botonCerrarModal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAEFF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFichaContenido: {
    padding: 16,
    paddingBottom: 36,
  },
  fichaCabecera: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DCE6EF',
  },
  avatarGrande: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarGrandeTexto: {
    fontSize: 24,
    fontWeight: '800',
  },
  fichaNombreCompleto: {
    fontSize: 19,
    fontWeight: '800',
    color: '#18324B',
    textAlign: 'center',
  },
  fichaSubtitulo: {
    fontSize: 13,
    color: '#62758A',
    marginTop: 3,
  },
  filaBadgesFicha: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badgeEstado: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeActivo: {
    backgroundColor: '#D1FAE5',
  },
  badgeInactivo: {
    backgroundColor: '#FEE2E2',
  },
  badgeEstadoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  badgeNivelFicha: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeNivelFichaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  seccionFicha: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE6EF',
  },
  seccionFichaTitulo: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3D63',
    marginBottom: 12,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  datoEtiqueta: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  datoValor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1.5,
    textAlign: 'right',
  },
  valorActivo: {
    color: '#047857',
    fontWeight: '700',
  },
  valorInactivo: {
    color: '#64748B',
  },
  filaBotonesContacto: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  botonContacto: {
    flex: 1,
    backgroundColor: '#0B3D63',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonContactoTexto: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  botonContactoEmail: {
    backgroundColor: '#E8F2FF',
  },
  botonContactoTextoEmail: {
    color: '#1D66C2',
  },
  sinTutorTexto: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  seccionAccesos: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE6EF',
  },
  filaBotonesAcceso: {
    gap: 8,
  },
  botonAcceso: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  botonAccesoTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18324B',
  },
});
