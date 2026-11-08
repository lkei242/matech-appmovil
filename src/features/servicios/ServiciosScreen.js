import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import {
  actualizarComedor,
  actualizarTransporte,
  desinscribirDeporte,
  getAlumnos,
  getGruposDeportivos,
  getMisServicios,
  getRecorridosTransporte,
  inscribirDeporte,
} from './serviciosApi';

export default function ServiciosScreen({ navigation }) {
  const { sesion } = useAuth();
  const token = sesion?.access;

  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

  const [servicios, setServicios] = useState(null);
  const [gruposCatalogo, setGruposCatalogo] = useState([]);
  const [recorridos, setRecorridos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [modalDeportesVisible, setModalDeportesVisible] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState(null);

  const mostrarMensaje = (texto, esError = false) => {
    setMensajeEstado({ texto, esError });
    setTimeout(() => {
      setMensajeEstado(null);
    }, 4500);
  };

  // Cargar lista de alumnos autorizados
  const cargarAlumnos = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await getAlumnos(token);
      if (resp.ok && Array.isArray(resp.datos)) {
        setAlumnos(resp.datos);
        if (resp.datos.length > 0 && !alumnoSeleccionado) {
          setAlumnoSeleccionado(resp.datos[0]);
        }
      }
    } catch {
      // Error manejado
    }
  }, [token, alumnoSeleccionado]);

  // Cargar catálogo de deportes y recorridos
  const cargarCatalogos = useCallback(async () => {
    if (!token) return;
    try {
      const [respGrupos, respRecorridos] = await Promise.all([
        getGruposDeportivos(token),
        getRecorridosTransporte(token),
      ]);
      if (respGrupos.ok && Array.isArray(respGrupos.datos)) {
        setGruposCatalogo(respGrupos.datos);
      }
      if (respRecorridos.ok && Array.isArray(respRecorridos.datos)) {
        setRecorridos(respRecorridos.datos);
      }
    } catch {
      // Error manejado
    }
  }, [token]);

  // Cargar servicios del alumno seleccionado
  const cargarServiciosAlumno = useCallback(async (idAlumno) => {
    if (!token || !idAlumno) return;
    try {
      const resp = await getMisServicios(token, idAlumno);
      if (resp.ok && resp.datos) {
        setServicios(resp.datos);
      } else {
        mostrarMensaje(resp.datos?.error || 'No se pudieron cargar los servicios.', true);
      }
    } catch {
      mostrarMensaje('Error de red al consultar servicios.', true);
    }
  }, [token]);

  const inicializar = useCallback(async () => {
    setCargando(true);
    await Promise.all([cargarAlumnos(), cargarCatalogos()]);
    setCargando(false);
  }, [cargarAlumnos, cargarCatalogos]);

  useEffect(() => {
    inicializar();
  }, [inicializar]);

  useEffect(() => {
    if (alumnoSeleccionado?.id) {
      cargarServiciosAlumno(alumnoSeleccionado.id);
    }
  }, [alumnoSeleccionado, cargarServiciosAlumno]);

  const onRefresh = async () => {
    setRefrescando(true);
    await Promise.all([
      cargarAlumnos(),
      cargarCatalogos(),
      alumnoSeleccionado ? cargarServiciosAlumno(alumnoSeleccionado.id) : Promise.resolve(),
    ]);
    setRefrescando(false);
  };

  // Manejar inscripción a deporte
  const handleInscribirDeporte = async (grupo) => {
    if (!alumnoSeleccionado) return;
    setProcesandoAccion(true);
    try {
      const resp = await inscribirDeporte(token, alumnoSeleccionado.id, grupo.id);
      if (resp.ok) {
        setModalDeportesVisible(false);
        mostrarMensaje(`¡Inscripción exitosa en ${grupo.disciplina}!`);
        await cargarServiciosAlumno(alumnoSeleccionado.id);
      } else {
        Alert.alert('No se pudo inscribir', resp.datos?.error || 'Conflicto con regla de negocio.');
      }
    } catch {
      Alert.alert('Error', 'Falla de conexión al registrar inscripción deportiva.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Manejar baja de deporte
  const handleDarDeBajaDeporte = (inscripcion) => {
    Alert.alert(
      'Confirmar baja de disciplina',
      `¿Desea dar de baja la inscripción en ${inscripcion.disciplina} (${inscripcion.dia_semana} ${inscripcion.hora_inicio})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar baja',
          style: 'destructive',
          onPress: async () => {
            setProcesandoAccion(true);
            try {
              const resp = await desinscribirDeporte(token, inscripcion.inscripcion_id);
              if (resp.ok) {
                mostrarMensaje('Inscripción deportiva finalizada correctamente.');
                await cargarServiciosAlumno(alumnoSeleccionado.id);
              } else {
                Alert.alert('Error', resp.datos?.error || 'No se pudo finalizar la inscripción.');
              }
            } catch {
              Alert.alert('Error', 'Falla de conexión al dar de baja el deporte.');
            } finally {
              setProcesandoAccion(false);
            }
          },
        },
      ]
    );
  };

  // Manejar cambio/asignación de transporte
  const handleCambiarTransporte = (recorridoId, nombreRecorrido) => {
    const accionTexto = recorridoId ? `asignar ${nombreRecorrido}` : 'dar de baja el servicio de transporte';
    Alert.alert(
      'Actualizar transporte escolar',
      `¿Desea ${accionTexto} para ${alumnoSeleccionado.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setProcesandoAccion(true);
            try {
              const resp = await actualizarTransporte(token, alumnoSeleccionado.id, recorridoId);
              if (resp.ok) {
                mostrarMensaje(resp.datos?.mensaje || 'Transporte escolar actualizado.');
                await cargarServiciosAlumno(alumnoSeleccionado.id);
              } else {
                Alert.alert('Error', resp.datos?.error || 'No se pudo actualizar el transporte.');
              }
            } catch {
              Alert.alert('Error', 'Falla de conexión al actualizar transporte.');
            } finally {
              setProcesandoAccion(false);
            }
          },
        },
      ]
    );
  };

  // Manejar toggle comedor
  const handleToggleComedor = () => {
    const nuevoEstado = !servicios?.comedor;
    const accionTexto = nuevoEstado ? 'activar' : 'dar de baja';
    Alert.alert(
      'Comedor escolar',
      `¿Desea ${accionTexto} el servicio de comedor escolar para ${alumnoSeleccionado?.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setProcesandoAccion(true);
            try {
              const resp = await actualizarComedor(token, alumnoSeleccionado.id, nuevoEstado);
              if (resp.ok) {
                mostrarMensaje(resp.datos?.mensaje || 'Comedor actualizado correctamente.');
                await cargarServiciosAlumno(alumnoSeleccionado.id);
              } else {
                Alert.alert('Error', resp.datos?.error || 'No se pudo actualizar el comedor.');
              }
            } catch {
              Alert.alert('Error', 'Falla de conexión al actualizar comedor.');
            } finally {
              setProcesandoAccion(false);
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return (
      <View style={styles.pantallaCentrada}>
        <ActivityIndicator size="large" color="#1D66C2" />
        <Text style={styles.cargandoTexto}>Cargando servicios escolares...</Text>
      </View>
    );
  }

  const deportesActivos = servicios?.deportes || [];
  const cantidadDeportes = deportesActivos.length;
  const maximoDeportesAlcanzado = cantidadDeportes >= 2;

  return (
    <View style={styles.contenedor}>
      {/* Cabecera */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.botonVolverTexto}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Servicios Escolares</Text>
        <Text style={styles.headerSubtitulo}>Deportes, Transporte y Comedor</Text>
      </View>

      {/* Banner de mensaje temporal */}
      {mensajeEstado && (
        <View
          style={[
            styles.bannerMensaje,
            mensajeEstado.esError ? styles.bannerError : styles.bannerExito,
          ]}
        >
          <Text
            style={[
              styles.bannerTexto,
              mensajeEstado.esError ? styles.bannerTextoError : styles.bannerTextoExito,
            ]}
          >
            {mensajeEstado.texto}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={['#1D66C2']} />}
      >
        {/* Selector de alumno si hay más de 1 */}
        {alumnos.length > 0 && (
          <View style={styles.seccionSelector}>
            <Text style={styles.seccionLabel}>Seleccionar Alumno/Hijo:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
              {alumnos.map((alum) => {
                const esActivo = alumnoSeleccionado?.id === alum.id;
                return (
                  <TouchableOpacity
                    key={alum.id}
                    style={[styles.alumnoPill, esActivo && styles.alumnoPillActiva]}
                    onPress={() => setAlumnoSeleccionado(alum)}
                  >
                    <Text style={[styles.alumnoPillTexto, esActivo && styles.alumnoPillTextoActiva]}>
                      {alum.nombre} {alum.apellido}
                    </Text>
                    <Text style={[styles.alumnoPillSub, esActivo && styles.alumnoPillSubActiva]}>
                      Leg. {alum.legajo} · {alum.curso}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* SECCIÓN 1: DEPORTES */}
        <View style={styles.tarjeta}>
          <View style={styles.tarjetaHeader}>
            <View>
              <Text style={styles.tarjetaTitulo}>🏃 Actividades Deportivas</Text>
              <Text style={styles.tarjetaSub}>
                {cantidadDeportes} de 2 disciplinas permitidas
              </Text>
            </View>
            <View style={[styles.badge, maximoDeportesAlcanzado ? styles.badgeLleno : styles.badgeLibre]}>
              <Text style={[styles.badgeTexto, maximoDeportesAlcanzado ? styles.badgeTextoLleno : styles.badgeTextoLibre]}>
                {maximoDeportesAlcanzado ? 'Cupo máx.' : `${2 - cantidadDeportes} disp.`}
              </Text>
            </View>
          </View>

          {cantidadDeportes === 0 ? (
            <View style={styles.vacioBox}>
              <Text style={styles.vacioTexto}>El alumno no tiene deportes activos en este período.</Text>
            </View>
          ) : (
            deportesActivos.map((dep) => (
              <View key={dep.inscripcion_id} style={styles.itemServicio}>
                <View style={styles.itemServicioInfo}>
                  <Text style={styles.itemTitulo}>{dep.disciplina}</Text>
                  <Text style={styles.itemDetalle}>
                    {dep.dia_semana} de {dep.hora_inicio} a {dep.hora_fin} hs
                  </Text>
                  <Text style={styles.itemMeta}>Nivel: {dep.nivel} · Prof: {dep.profesor}</Text>
                </View>
                <TouchableOpacity
                  style={styles.botonPeligroPill}
                  disabled={procesandoAccion}
                  onPress={() => handleDarDeBajaDeporte(dep)}
                >
                  <Text style={styles.botonPeligroPillTexto}>Dar de baja</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {!maximoDeportesAlcanzado ? (
            <TouchableOpacity
              style={styles.botonPrimario}
              disabled={procesandoAccion}
              onPress={() => setModalDeportesVisible(true)}
            >
              <Text style={styles.botonPrimarioTexto}>+ Inscribir en nueva disciplina</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.avisoLimite}>
              Ha alcanzado el límite máximo de 2 deportes simultáneos (RF-M16).
            </Text>
          )}
        </View>

        {/* SECCIÓN 2: TRANSPORTE ESCOLAR */}
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaTitulo}>🚌 Transporte Escolar</Text>
          <Text style={styles.tarjetaSub}>Servicio mensual puerta a puerta por zona</Text>

          <View style={styles.estadoTransporteBox}>
            <Text style={styles.estadoTransporteEtiqueta}>Recorrido actual:</Text>
            <Text style={styles.estadoTransporteValor}>
              {servicios?.transporte?.nombre || 'Sin servicio de transporte contratado'}
            </Text>
            {servicios?.transporte?.descripcion ? (
              <Text style={styles.estadoTransporteDesc}>{servicios.transporte.descripcion}</Text>
            ) : null}
          </View>

          <Text style={styles.opcionesTitulo}>Seleccionar o cambiar recorrido:</Text>
          <View style={styles.listaRecorridos}>
            {recorridos.map((rec) => {
              const esSeleccionado = servicios?.transporte?.recorrido_id === rec.id;
              return (
                <TouchableOpacity
                  key={rec.id}
                  style={[styles.recorridoItem, esSeleccionado && styles.recorridoItemActivo]}
                  disabled={procesandoAccion}
                  onPress={() => handleCambiarTransporte(rec.id, rec.nombre)}
                >
                  <View style={styles.recorridoInfo}>
                    <Text style={[styles.recorridoNombre, esSeleccionado && styles.recorridoNombreActivo]}>
                      {rec.nombre} {esSeleccionado && '✓ (Asignado)'}
                    </Text>
                    <Text style={styles.recorridoDesc}>{rec.descripcion}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {servicios?.transporte ? (
              <TouchableOpacity
                style={styles.botonRetirarTransporte}
                disabled={procesandoAccion}
                onPress={() => handleCambiarTransporte(null, '')}
              >
                <Text style={styles.botonRetirarTransporteTexto}>Dar de baja servicio de transporte</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* SECCIÓN 3: COMEDOR ESCOLAR */}
        <View style={styles.tarjeta}>
          <View style={styles.tarjetaHeader}>
            <View>
              <Text style={styles.tarjetaTitulo}>🍽️ Comedor Escolar</Text>
              <Text style={styles.tarjetaSub}>Almuerzo supervisado con menú nutricional</Text>
            </View>
            <View style={[styles.badge, servicios?.comedor ? styles.badgeActivo : styles.badgeInactivo]}>
              <Text style={[styles.badgeTexto, servicios?.comedor ? styles.badgeTextoActivo : styles.badgeTextoInactivo]}>
                {servicios?.comedor ? 'Activo' : 'Inactivo'}
              </Text>
            </View>
          </View>

          <Text style={styles.comedorExplicacion}>
            {servicios?.comedor
              ? 'El alumno cuenta con menú de almuerzo completo habilitado en el comedor institucional.'
              : 'El servicio de comedor no se encuentra activo para este alumno.'}
          </Text>

          <TouchableOpacity
            style={[
              styles.botonComedor,
              servicios?.comedor ? styles.botonComedorBaja : styles.botonComedorAlta,
            ]}
            disabled={procesandoAccion}
            onPress={handleToggleComedor}
          >
            <Text style={styles.botonComedorTexto}>
              {servicios?.comedor ? 'Desactivar comedor escolar' : 'Inscribir en comedor escolar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL DE CATÁLOGO DE DEPORTES */}
      <Modal visible={modalDeportesVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenedor}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Inscripción Deportiva</Text>
              <TouchableOpacity
                onPress={() => setModalDeportesVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalCerrar}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Seleccione un grupo y horario para {alumnoSeleccionado?.nombre}:
            </Text>

            <ScrollView style={styles.modalLista}>
              {gruposCatalogo.map((g) => {
                const yaInscripto = deportesActivos.some((d) => d.grupo_id === g.id);
                return (
                  <View key={g.id} style={styles.modalGrupoCard}>
                    <View style={styles.modalGrupoInfo}>
                      <Text style={styles.modalGrupoTitulo}>{g.disciplina}</Text>
                      <Text style={styles.modalGrupoHorario}>
                        📅 {g.dia_semana} · {g.hora_inicio} a {g.hora_fin} hs
                      </Text>
                      <Text style={styles.modalGrupoDetalle}>
                        Nivel: {g.nivel} · Prof: {g.profesor}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.botonInscribirPill, yaInscripto && styles.botonInscribirPillDeshabilitado]}
                      disabled={yaInscripto || procesandoAccion}
                      onPress={() => handleInscribirDeporte(g)}
                    >
                      <Text style={styles.botonInscribirPillTexto}>
                        {yaInscripto ? 'Inscripto' : 'Inscribir'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F6F9FC',
  },
  pantallaCentrada: {
    flex: 1,
    backgroundColor: '#F6F9FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargandoTexto: {
    marginTop: 12,
    color: '#344C62',
    fontSize: 15,
  },
  header: {
    backgroundColor: '#18324B',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  botonVolver: {
    marginBottom: 8,
  },
  botonVolverTexto: {
    color: '#E8F2FF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitulo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerSubtitulo: {
    color: '#E8F2FF',
    fontSize: 13,
    marginTop: 2,
  },
  bannerMensaje: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  bannerExito: {
    backgroundColor: '#EDF6E7',
    borderLeftWidth: 4,
    borderLeftColor: '#4C7A2E',
  },
  bannerError: {
    backgroundColor: '#FCEBF4',
    borderLeftWidth: 4,
    borderLeftColor: '#B91D6A',
  },
  bannerTexto: {
    fontSize: 14,
    fontWeight: '500',
  },
  bannerTextoExito: {
    color: '#4C7A2E',
  },
  bannerTextoError: {
    color: '#B91D6A',
  },
  scrollContenido: {
    padding: 16,
    paddingBottom: 36,
  },
  seccionSelector: {
    marginBottom: 16,
  },
  seccionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18324B',
    marginBottom: 8,
  },
  pillsScroll: {
    flexDirection: 'row',
  },
  alumnoPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE6EF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  alumnoPillActiva: {
    backgroundColor: '#1D66C2',
    borderColor: '#1D66C2',
  },
  alumnoPillTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18324B',
  },
  alumnoPillTextoActiva: {
    color: '#FFFFFF',
  },
  alumnoPillSub: {
    fontSize: 12,
    color: '#62758A',
    marginTop: 2,
  },
  alumnoPillSubActiva: {
    color: '#E8F2FF',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE6EF',
    shadowColor: '#18324B',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  tarjetaTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#18324B',
  },
  tarjetaSub: {
    fontSize: 13,
    color: '#62758A',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeLibre: {
    backgroundColor: '#EDF6E7',
  },
  badgeLleno: {
    backgroundColor: '#FCEBF4',
  },
  badgeActivo: {
    backgroundColor: '#EDF6E7',
  },
  badgeInactivo: {
    backgroundColor: '#F3F6FA',
  },
  badgeTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextoLibre: {
    color: '#4C7A2E',
  },
  badgeTextoLleno: {
    color: '#B91D6A',
  },
  badgeTextoActivo: {
    color: '#4C7A2E',
  },
  badgeTextoInactivo: {
    color: '#62758A',
  },
  vacioBox: {
    backgroundColor: '#F6F9FC',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  vacioTexto: {
    color: '#62758A',
    fontSize: 14,
    textAlign: 'center',
  },
  itemServicio: {
    backgroundColor: '#F6F9FC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#1D66C2',
  },
  itemServicioInfo: {
    flex: 1,
    paddingRight: 8,
  },
  itemTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18324B',
  },
  itemDetalle: {
    fontSize: 13,
    color: '#344C62',
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: '#62758A',
    marginTop: 2,
  },
  botonPeligroPill: {
    backgroundColor: '#FCEBF4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B91D6A',
  },
  botonPeligroPillTexto: {
    color: '#B91D6A',
    fontSize: 12,
    fontWeight: '600',
  },
  botonPrimario: {
    backgroundColor: '#1D66C2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  botonPrimarioTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  avisoLimite: {
    color: '#B91D6A',
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'center',
  },
  estadoTransporteBox: {
    backgroundColor: '#F6F9FC',
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  estadoTransporteEtiqueta: {
    fontSize: 12,
    color: '#62758A',
    fontWeight: '600',
  },
  estadoTransporteValor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18324B',
    marginTop: 2,
  },
  estadoTransporteDesc: {
    fontSize: 13,
    color: '#344C62',
    marginTop: 4,
  },
  opcionesTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18324B',
    marginBottom: 8,
  },
  listaRecorridos: {
    gap: 8,
  },
  recorridoItem: {
    borderWidth: 1,
    borderColor: '#DCE6EF',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  recorridoItemActivo: {
    borderColor: '#1D66C2',
    backgroundColor: '#E8F2FF',
  },
  recorridoInfo: {
    flex: 1,
  },
  recorridoNombre: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18324B',
  },
  recorridoNombreActivo: {
    color: '#1D66C2',
  },
  recorridoDesc: {
    fontSize: 12,
    color: '#62758A',
    marginTop: 2,
  },
  botonRetirarTransporte: {
    backgroundColor: '#FCEBF4',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  botonRetirarTransporteTexto: {
    color: '#B91D6A',
    fontSize: 13,
    fontWeight: '600',
  },
  comedorExplicacion: {
    fontSize: 14,
    color: '#344C62',
    lineHeight: 20,
    marginBottom: 14,
  },
  botonComedor: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonComedorAlta: {
    backgroundColor: '#4C7A2E',
  },
  botonComedorBaja: {
    backgroundColor: '#FCEBF4',
    borderWidth: 1,
    borderColor: '#B91D6A',
  },
  botonComedorTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 50, 75, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContenedor: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#18324B',
  },
  modalCerrar: {
    fontSize: 20,
    color: '#62758A',
    padding: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#62758A',
    marginTop: 4,
    marginBottom: 14,
  },
  modalLista: {
    marginBottom: 20,
  },
  modalGrupoCard: {
    backgroundColor: '#F6F9FC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DCE6EF',
  },
  modalGrupoInfo: {
    flex: 1,
    paddingRight: 10,
  },
  modalGrupoTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: '#18324B',
  },
  modalGrupoHorario: {
    fontSize: 13,
    color: '#1D66C2',
    marginTop: 2,
    fontWeight: '600',
  },
  modalGrupoDetalle: {
    fontSize: 12,
    color: '#62758A',
    marginTop: 2,
  },
  botonInscribirPill: {
    backgroundColor: '#1D66C2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  botonInscribirPillDeshabilitado: {
    backgroundColor: '#DCE6EF',
  },
  botonInscribirPillTexto: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
