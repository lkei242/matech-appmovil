// Componente inteligente para seleccionar alumno en pantallas operativas
// (Cuotas, Facturas, Pagos, Servicios Escolares y Consulta Offline).
//
// Para familias (1-3 alumnos): ofrece selección rápida directa por fichas.
// Para personal escolar (muchos alumnos): ofrece buscador integrado por nombre, DNI, legajo,
// nivel, turno y fecha de nacimiento, eliminando la necesidad de deslizar infinitamente.
// Soporta la opción `permitirTodos` para pantallas que admiten vista global (ej: Offline).

import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SelectorAlumno({
  alumnos = [],
  seleccionado,
  onSeleccionar,
  permitirTodos = false,
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('Todos');
  const [filtroTurno, setFiltroTurno] = useState('Todos');

  const alumnoActivo = useMemo(() => {
    if (!seleccionado || seleccionado === 'todos') return null;
    return alumnos.find((a) => a.legajo === seleccionado || a.id === seleccionado) || null;
  }, [alumnos, seleccionado]);

  const nivelesDisponibles = useMemo(() => {
    const set = new Set();
    alumnos.forEach((a) => {
      if (a.nivel) set.add(a.nivel);
    });
    return ['Todos', ...Array.from(set)];
  }, [alumnos]);

  const turnosDisponibles = useMemo(() => {
    const set = new Set();
    alumnos.forEach((a) => {
      if (a.turno) set.add(a.turno);
    });
    return set.size > 0 ? ['Todos', ...Array.from(set)] : [];
  }, [alumnos]);

  const alumnosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return alumnos.filter((a) => {
      // Filtro texto
      if (q) {
        const nombreCompleto = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
        const legajoStr = String(a.legajo || '');
        const dniStr = String(a.dni || '');
        const cursoStr = String(a.curso || '').toLowerCase();
        const fechaNac = String(a.fecha_nacimiento || '');
        const match =
          nombreCompleto.includes(q) ||
          legajoStr.includes(q) ||
          dniStr.includes(q) ||
          cursoStr.includes(q) ||
          fechaNac.includes(q);
        if (!match) return false;
      }
      // Filtro Nivel
      if (filtroNivel !== 'Todos' && a.nivel && a.nivel !== filtroNivel) {
        return false;
      }
      // Filtro Turno
      if (filtroTurno !== 'Todos' && a.turno && a.turno !== filtroTurno) {
        return false;
      }
      return true;
    });
  }, [alumnos, busqueda, filtroNivel, filtroTurno]);

  if (!alumnos || alumnos.length === 0) return null;

  const seleccionarYcerrar = (legajo) => {
    onSeleccionar(legajo);
    setModalVisible(false);
  };

  // Si hay pocos alumnos (ej: un tutor con 1 a 3 hijos), mostramos las pastillas directas
  const esListaCorta = alumnos.length <= 3;

  return (
    <View style={styles.contenedor}>
      {esListaCorta ? (
        <View style={styles.filaCorta}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaScroll}>
            {permitirTodos && (
              <TouchableOpacity
                onPress={() => onSeleccionar(null)}
                style={[styles.chip, !seleccionado && styles.chipActivo]}
                accessibilityRole="button"
                accessibilityState={{ selected: !seleccionado }}
              >
                <Text style={[styles.texto, !seleccionado && styles.textoActivo]}>
                  Todos ({alumnos.length})
                </Text>
              </TouchableOpacity>
            )}
            {alumnos.map((alumno) => {
              const activo = alumno.legajo === seleccionado || alumno.id === seleccionado;
              return (
                <TouchableOpacity
                  key={alumno.legajo || alumno.id}
                  onPress={() => onSeleccionar(alumno.legajo || alumno.id)}
                  style={[styles.chip, activo && styles.chipActivo]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                >
                  <Text style={[styles.texto, activo && styles.textoActivo]}>
                    {alumno.nombre} {alumno.apellido}
                  </Text>
                  {alumno.nivel ? (
                    <Text style={[styles.textoSub, activo && styles.textoSubActivo]}>
                      · {alumno.nivel}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity
            style={styles.botonLupaMini}
            onPress={() => setModalVisible(true)}
            accessibilityLabel="Buscar alumno"
          >
            <Text style={styles.lupaIcono}>🔍</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // Para listas largas (personal escolar), mostramos ficha del alumno activo + botón de búsqueda
        <View style={styles.tarjetaActivo}>
          <View style={styles.infoAlumnoActivo}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniTexto}>
                {alumnoActivo
                  ? (alumnoActivo.nombre?.[0] || 'A') + (alumnoActivo.apellido?.[0] || '')
                  : '👥'}
              </Text>
            </View>
            <View style={styles.textosActivo}>
              <Text style={styles.etiquetaActivo}>
                {alumnoActivo ? 'Alumno seleccionado:' : 'Visualización:'}
              </Text>
              <Text style={styles.nombreActivo} numberOfLines={1}>
                {alumnoActivo
                  ? `${alumnoActivo.nombre} ${alumnoActivo.apellido}`
                  : `Todos los alumnos (${alumnos.length})`}
              </Text>
              <Text style={styles.detallesActivo}>
                {alumnoActivo
                  ? `Legajo: ${alumnoActivo.legajo || '—'}${
                      alumnoActivo.curso
                        ? ` · ${alumnoActivo.curso}`
                        : alumnoActivo.nivel
                        ? ` · ${alumnoActivo.nivel}`
                        : ''
                    }`
                  : 'Mostrando servicios activos del padrón escolar'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.botonCambiar}
            onPress={() => setModalVisible(true)}
            accessibilityRole="button"
          >
            <Text style={styles.botonCambiarTexto}>
              {alumnoActivo ? '🔍 Cambiar' : '🔍 Filtrar Alumno'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Búsqueda y Filtro de Alumnos */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContenedor}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitulo}>Seleccionar Alumno</Text>
              <Text style={styles.modalSubtitulo}>
                {alumnos.length} alumnos disponibles en el padrón
              </Text>
            </View>
            <TouchableOpacity
              style={styles.botonCerrar}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.botonCerrarTexto}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Campo de búsqueda */}
          <View style={styles.buscadorCaja}>
            <Text style={styles.buscadorIcono}>🔍</Text>
            <TextInput
              style={styles.buscadorInput}
              placeholder="Buscar por nombre, DNI, legajo, curso..."
              placeholderTextColor="#8E9DAE"
              value={busqueda}
              onChangeText={setBusqueda}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {busqueda.length > 0 && Platform.OS !== 'ios' ? (
              <TouchableOpacity onPress={() => setBusqueda('')} style={styles.limpiarInput}>
                <Text style={styles.limpiarInputTexto}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filtros rápidos de nivel */}
          {nivelesDisponibles.length > 2 && (
            <View style={styles.seccionFiltros}>
              <Text style={styles.filtroLabel}>Nivel:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaFiltros}>
                {nivelesDisponibles.map((nv) => {
                  const activo = filtroNivel === nv;
                  return (
                    <TouchableOpacity
                      key={nv}
                      style={[styles.filtroChip, activo && styles.filtroChipActivo]}
                      onPress={() => setFiltroNivel(nv)}
                    >
                      <Text style={[styles.filtroChipTexto, activo && styles.filtroChipTextoActivo]}>
                        {nv}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Filtros de turno si existen */}
          {turnosDisponibles.length > 2 && (
            <View style={styles.seccionFiltros}>
              <Text style={styles.filtroLabel}>Turno:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filaFiltros}>
                {turnosDisponibles.map((tn) => {
                  const activo = filtroTurno === tn;
                  return (
                    <TouchableOpacity
                      key={tn}
                      style={[styles.filtroChip, activo && styles.filtroChipActivo]}
                      onPress={() => setFiltroTurno(tn)}
                    >
                      <Text style={[styles.filtroChipTexto, activo && styles.filtroChipTextoActivo]}>
                        {tn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Resultados */}
          <View style={styles.resultadosBarra}>
            <Text style={styles.resultadosTexto}>
              {alumnosFiltrados.length} {alumnosFiltrados.length === 1 ? 'alumno encontrado' : 'alumnos encontrados'}
            </Text>
            {(busqueda || filtroNivel !== 'Todos' || filtroTurno !== 'Todos') ? (
              <TouchableOpacity
                onPress={() => {
                  setBusqueda('');
                  setFiltroNivel('Todos');
                  setFiltroTurno('Todos');
                }}
              >
                <Text style={styles.limpiarFiltros}>Restablecer</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView contentContainerStyle={styles.listaModal}>
            {/* Opción 'Todos los alumnos' si está permitida */}
            {permitirTodos && (
              <TouchableOpacity
                style={[styles.itemAlumno, !seleccionado && styles.itemAlumnoActivo]}
                onPress={() => seleccionarYcerrar(null)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemAvatar, { backgroundColor: '#F1F8E8' }]}>
                  <Text style={[styles.itemAvatarTexto, { color: '#3F6B14' }]}>👥</Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemFilaPrincipal}>
                    <Text style={styles.itemNombre}>Todos los alumnos</Text>
                    {!seleccionado && (
                      <View style={styles.badgeSeleccionado}>
                        <Text style={styles.badgeSeleccionadoTexto}>✓ Activo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemDetalle}>
                    Mostrar los servicios activos de los {alumnos.length} alumnos
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {alumnosFiltrados.length === 0 ? (
              <View style={styles.estadoVacio}>
                <Text style={styles.vacioIcono}>🔍</Text>
                <Text style={styles.vacioTitulo}>No se encontraron alumnos</Text>
                <Text style={styles.vacioDesc}>
                  Intenta con otro término de búsqueda o ajusta los filtros.
                </Text>
              </View>
            ) : (
              alumnosFiltrados.map((alumno) => {
                const esActivo = alumno.legajo === seleccionado || alumno.id === seleccionado;
                return (
                  <TouchableOpacity
                    key={alumno.legajo || alumno.id}
                    style={[styles.itemAlumno, esActivo && styles.itemAlumnoActivo]}
                    onPress={() => seleccionarYcerrar(alumno.legajo || alumno.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemAvatar}>
                      <Text style={styles.itemAvatarTexto}>
                        {(alumno.nombre?.[0] || 'A') + (alumno.apellido?.[0] || '')}
                      </Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <View style={styles.itemFilaPrincipal}>
                        <Text style={styles.itemNombre}>
                          {alumno.nombre} {alumno.apellido}
                        </Text>
                        {esActivo && (
                          <View style={styles.badgeSeleccionado}>
                            <Text style={styles.badgeSeleccionadoTexto}>✓ Activo</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.itemFilaDetalles}>
                        <Text style={styles.itemDetalle}>Legajo: {alumno.legajo}</Text>
                        {alumno.dni ? <Text style={styles.itemDetalle}> · DNI: {alumno.dni}</Text> : null}
                        {alumno.curso ? <Text style={styles.itemDetalle}> · {alumno.curso}</Text> : null}
                      </View>
                      {alumno.fecha_nacimiento ? (
                        <Text style={styles.itemFechaNac}>
                          Nacimiento: {alumno.fecha_nacimiento}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginVertical: 8,
  },
  filaCorta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filaScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0B4DA8',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  chipActivo: {
    backgroundColor: '#0B4DA8',
    borderColor: '#0B4DA8',
  },
  texto: {
    color: '#0B4DA8',
    fontWeight: '700',
    fontSize: 14,
  },
  textoActivo: {
    color: '#FFFFFF',
  },
  textoSub: {
    color: '#5B6B80',
    fontSize: 12,
    marginLeft: 4,
  },
  textoSubActivo: {
    color: '#EAF4FD',
  },
  botonLupaMini: {
    marginLeft: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lupaIcono: {
    fontSize: 16,
  },
  tarjetaActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0B4DA8',
    borderRadius: 12,
    padding: 12,
  },
  infoAlumnoActivo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B4DA8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarMiniTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  textosActivo: {
    flex: 1,
  },
  etiquetaActivo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B6B80',
    textTransform: 'uppercase',
  },
  nombreActivo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2A4D',
  },
  detallesActivo: {
    fontSize: 12,
    color: '#5B6B80',
    marginTop: 2,
  },
  botonCambiar: {
    backgroundColor: '#EAF4FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0B4DA8',
  },
  botonCambiarTexto: {
    color: '#0B4DA8',
    fontWeight: '700',
    fontSize: 13,
  },
  modalContenedor: {
    flex: 1,
    backgroundColor: '#F6F9FD',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE5F0',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2A4D',
  },
  modalSubtitulo: {
    fontSize: 12,
    color: '#5B6B80',
    marginTop: 2,
  },
  botonCerrar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAEFF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonCerrarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B6B80',
  },
  buscadorCaja: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DCE5F0',
    height: 44,
  },
  buscadorIcono: {
    fontSize: 16,
    marginRight: 8,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F2A4D',
  },
  limpiarInput: {
    padding: 4,
  },
  limpiarInputTexto: {
    color: '#8E9DAE',
    fontSize: 14,
  },
  seccionFiltros: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  filtroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5B6B80',
    marginRight: 8,
    width: 44,
  },
  filaFiltros: {
    gap: 6,
  },
  filtroChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5F0',
  },
  filtroChipActivo: {
    backgroundColor: '#0B4DA8',
    borderColor: '#0B4DA8',
  },
  filtroChipTexto: {
    fontSize: 12,
    color: '#3A4D66',
    fontWeight: '600',
  },
  filtroChipTextoActivo: {
    color: '#FFFFFF',
  },
  resultadosBarra: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultadosTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B6B80',
  },
  limpiarFiltros: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B4DA8',
  },
  listaModal: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  itemAlumno: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DCE5F0',
  },
  itemAlumnoActivo: {
    borderColor: '#0B4DA8',
    backgroundColor: '#F0F6FA',
  },
  itemAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EAF4FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemAvatarTexto: {
    color: '#0B4DA8',
    fontWeight: '700',
    fontSize: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemFilaPrincipal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemNombre: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2A4D',
  },
  badgeSeleccionado: {
    backgroundColor: '#0B4DA8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeSeleccionadoTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  itemFilaDetalles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3,
  },
  itemDetalle: {
    fontSize: 12,
    color: '#5B6B80',
  },
  itemFechaNac: {
    fontSize: 11,
    color: '#8E9DAE',
    marginTop: 2,
  },
  estadoVacio: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  vacioIcono: {
    fontSize: 36,
    marginBottom: 8,
  },
  vacioTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2A4D',
    marginBottom: 4,
  },
  vacioDesc: {
    fontSize: 13,
    color: '#5B6B80',
    textAlign: 'center',
  },
});
