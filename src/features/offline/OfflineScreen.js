import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SelectorAlumno from '../../components/SelectorAlumno';
import { useAuth } from '../../auth/AuthContext';
import { obtenerCopiaOffline, sincronizarDatosOffline } from './offlineStorage';
import { Icono } from '../../components/ui';

export default function OfflineScreen() {
  const { sesion } = useAuth();
  const username = sesion?.usuario;
  const token = sesion?.access;

  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [datosOffline, setDatosOffline] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState('servicios');
  const [aviso, setAviso] = useState(null);
  const [alumnoFiltroLegajo, setAlumnoFiltroLegajo] = useState(null);

  const cargarCopiaLocal = useCallback(async () => {
    if (!username) return;
    const copia = await obtenerCopiaOffline(username);
    if (copia) {
      setDatosOffline(copia);
    }
  }, [username]);

  // `manual` es true cuando el usuario desliza para actualizar. Al abrir la pantalla se sincroniza solo
  // y sin avisos (solo se avisa si algo falla); el pop-up de éxito es únicamente para la actualización manual.
  const sincronizar = useCallback(async (manual = false) => {
    setSincronizando(true);
    setAviso(null);
    try {
      const res = await sincronizarDatosOffline(token, username);
      if (res.ok) {
        setDatosOffline(res.datos);
        if (manual === true) {
          Alert.alert('Sincronización', '¡Datos sincronizados exitosamente!');
        }
      } else {
        if (res.local) {
          setDatosOffline(res.local);
          setAviso({
            texto: 'Sin conexión con el servidor. Mostrando la última copia sincronizada.',
            tipo: 'alerta',
          });
        } else {
          setAviso({
            texto: 'No se pudo conectar con el servidor y no hay copia local guardada aún.',
            tipo: 'error',
          });
        }
      }
    } catch {
      setAviso({
        texto: 'Error al intentar sincronizar. Mostrando datos locales.',
        tipo: 'error',
      });
    } finally {
      setSincronizando(false);
    }
  }, [token, username]);

  useEffect(() => {
    (async () => {
      setCargando(true);
      await cargarCopiaLocal();
      await sincronizar();
      setCargando(false);
    })();
  }, [cargarCopiaLocal, sincronizar]);

  // Los hooks van siempre antes de cualquier return: React exige el mismo orden en cada render.
  const alumnos = datosOffline?.alumnos || [];

  const alumnosFiltrados = useMemo(() => {
    let lista = alumnos;
    if (alumnoFiltroLegajo) {
      lista = lista.filter(
        (a) => a.legajo === alumnoFiltroLegajo || a.id === alumnoFiltroLegajo
      );
    }
    return lista;
  }, [alumnos, alumnoFiltroLegajo]);

  if (cargando) {
    return (
      <View style={styles.pantallaCentrada}>
        <ActivityIndicator size="large" color="#0B4DA8" />
        <Text style={styles.cargandoTexto}>Cargando datos offline...</Text>
      </View>
    );
  }

  const catalogoDeportes = datosOffline?.catalogo_deportes || [];
  const catalogoTransporte = datosOffline?.catalogo_transporte || [];
  const comunicados = datosOffline?.comunicados || [];

  return (
    <View style={styles.contenedor}>
      {/* Banner de aviso */}
      {aviso && (
        <View
          style={[
            styles.banner,
            aviso.tipo === 'alerta' && styles.bannerAlerta,
            aviso.tipo === 'error' && styles.bannerError,
          ]}
        >
          <Text
            style={[
              styles.bannerTexto,
              aviso.tipo === 'alerta' && styles.bannerTextoAlerta,
              aviso.tipo === 'error' && styles.bannerTextoError,
            ]}
          >
            {aviso.texto}
          </Text>
        </View>
      )}

      {/* Pestañas de navegación de contenidos offline */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBoton, pestañaActiva === 'servicios' && styles.tabBotonActivo]}
          onPress={() => setPestañaActiva('servicios')}
        >
          <Text style={[styles.tabTexto, pestañaActiva === 'servicios' && styles.tabTextoActivo]}>
            Alumnos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBoton, pestañaActiva === 'deportes' && styles.tabBotonActivo]}
          onPress={() => setPestañaActiva('deportes')}
        >
          <Text style={[styles.tabTexto, pestañaActiva === 'deportes' && styles.tabTextoActivo]}>
            Horarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBoton, pestañaActiva === 'transporte' && styles.tabBotonActivo]}
          onPress={() => setPestañaActiva('transporte')}
        >
          <Text style={[styles.tabTexto, pestañaActiva === 'transporte' && styles.tabTextoActivo]}>
            Rutas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBoton, pestañaActiva === 'comunicados' && styles.tabBotonActivo]}
          onPress={() => setPestañaActiva('comunicados')}
        >
          <Text style={[styles.tabTexto, pestañaActiva === 'comunicados' && styles.tabTextoActivo]}>
            Noticias
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        refreshControl={<RefreshControl refreshing={sincronizando} onRefresh={() => sincronizar(true)} colors={['#0B4DA8']} />}
      >
        {/* PESTAÑA: ALUMNOS Y SERVICIOS */}
        {pestañaActiva === 'servicios' && (
          <View>
            <Text style={styles.seccionTitulo}>Servicios Activos por Alumno</Text>

            {/* Con un solo alumno no hay nada que elegir ni filtrar: el selector y el resumen se ocultan. */}
            {alumnos.length > 1 && (
              <View style={styles.contenedorFiltrosOffline}>
                <SelectorAlumno
                  alumnos={alumnos}
                  seleccionado={alumnoFiltroLegajo}
                  onSeleccionar={(leg) => setAlumnoFiltroLegajo(leg)}
                  permitirTodos={true}
                />

                <View style={styles.barraResumenFiltro}>
                  <Text style={styles.textoResumenFiltro}>
                    Mostrando {alumnosFiltrados.length} {alumnosFiltrados.length === 1 ? 'alumno' : 'alumnos'}{' '}
                    {alumnosFiltrados.length !== alumnos.length ? `(de ${alumnos.length} sincronizados)` : 'sincronizados'}
                  </Text>
                  {alumnoFiltroLegajo !== null && (
                    <TouchableOpacity
                      onPress={() => {
                        setAlumnoFiltroLegajo(null);
                      }}
                    >
                      <Text style={styles.enlaceRestablecerFiltros}>Ver todos</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Interfaz desplegada de servicios activos (CONSERVADA IDÉNTICA) */}
            {alumnosFiltrados.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.vacioTexto}>
                  {alumnos.length === 0
                    ? 'No hay datos de alumnos sincronizados.'
                    : 'No se encontraron alumnos con los criterios de búsqueda.'}
                </Text>
                {alumnos.length > 0 && (
                  <TouchableOpacity
                    style={styles.botonVerTodosVacio}
                    onPress={() => {
                      setAlumnoFiltroLegajo(null);
                    }}
                  >
                    <Text style={styles.botonVerTodosVacioTexto}>Mostrar todos los alumnos</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              alumnosFiltrados.map((a) => (
                <View key={a.id} style={styles.tarjeta}>
                  <Text style={styles.tarjetaTitulo}>{a.nombre}</Text>
                  <Text style={styles.tarjetaMeta}>
                    Legajo: {a.legajo} · Curso: {a.curso || 'Sin curso'}
                    {a.dni ? ` · DNI: ${a.dni}` : ''}
                  </Text>

                  <View style={styles.separador} />

                  <Text style={styles.subTituloCampo}>Deportes:</Text>
                  {a.deportes && a.deportes.length > 0 ? (
                    a.deportes.map((d, idx) => (
                      <View key={idx} style={styles.itemDetalle}>
                        <Text style={styles.itemBold}>{d.disciplina}</Text>
                        <Text style={styles.itemSub}>
                          {d.dia_semana} ({d.horario}) · Prof: {d.profesor}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.itemGris}>Sin deportes inscriptos.</Text>
                  )}

                  <View style={styles.separador} />

                  <Text style={styles.subTituloCampo}>Transporte Escolar:</Text>
                  {a.transporte ? (
                    <View style={styles.itemDetalle}>
                      <Text style={styles.itemBold}>{a.transporte.nombre}</Text>
                      <Text style={styles.itemSub}>{a.transporte.descripcion}</Text>
                    </View>
                  ) : (
                    <Text style={styles.itemGris}>Sin transporte asignado.</Text>
                  )}

                  <View style={styles.separador} />

                  <Text style={styles.subTituloCampo}>Comedor Escolar:</Text>
                  <Text style={a.comedor ? styles.comedorActivo : styles.itemGris}>
                    {a.comedor ? 'Inscripto al servicio de comedor' : 'No inscripto'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* PESTAÑA: HORARIOS Y DEPORTES */}
        {pestañaActiva === 'deportes' && (
          <View>
            <Text style={styles.seccionTitulo}>Horarios de Actividades Deportivas</Text>
            {catalogoDeportes.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.vacioTexto}>No hay disciplinas deportivas sincronizadas.</Text>
              </View>
            ) : (
              catalogoDeportes.map((g) => (
                <View key={g.id} style={styles.tarjeta}>
                  <Text style={styles.tarjetaTitulo}>{g.disciplina}</Text>
                  <Text style={styles.horarioDestacado}>
                    {g.dia_semana} · {g.horario} hs
                  </Text>
                  <Text style={styles.itemSub}>Nivel: {g.nivel} · Docente: {g.profesor}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* PESTAÑA: RECORRIDOS DE TRANSPORTE */}
        {pestañaActiva === 'transporte' && (
          <View>
            <Text style={styles.seccionTitulo}>Recorridos de Transporte Escolar</Text>
            {catalogoTransporte.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.vacioTexto}>No hay recorridos sincronizados.</Text>
              </View>
            ) : (
              catalogoTransporte.map((r) => (
                <View key={r.id} style={styles.tarjeta}>
                  <Text style={styles.tarjetaTitulo}>{r.nombre}</Text>
                  <Text style={styles.itemSub}>{r.descripcion}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* PESTAÑA: COMUNICADOS Y NOTICIAS */}
        {pestañaActiva === 'comunicados' && (
          <View>
            <Text style={styles.seccionTitulo}>Comunicados Institucionales</Text>
            {comunicados.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Text style={styles.vacioTexto}>No hay comunicados guardados.</Text>
              </View>
            ) : (
              comunicados.map((n) => (
                <View key={n.id} style={styles.tarjeta}>
                  <Text style={styles.tarjetaTitulo}>{n.titulo}</Text>
                  {n.fecha ? <Text style={styles.tarjetaFecha}>{n.fecha}</Text> : null}
                  <Text style={styles.comunicadoCuerpo}>{n.contenido}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F6F9FD',
  },
  pantallaCentrada: {
    flex: 1,
    backgroundColor: '#F6F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargandoTexto: {
    marginTop: 12,
    color: '#3A4D66',
    fontSize: 15,
  },
  banner: {
    margin: 14,
    marginBottom: 4,
    padding: 12,
    borderRadius: 8,
  },
  bannerAlerta: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  bannerError: {
    backgroundColor: '#FDE8F3',
    borderLeftWidth: 4,
    borderLeftColor: '#A10762',
  },
  bannerTexto: {
    fontSize: 13,
    fontWeight: '500',
  },
  bannerTextoAlerta: {
    color: '#B45309',
  },
  bannerTextoError: {
    color: '#A10762',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE5F0',
    paddingHorizontal: 8,
  },
  tabBoton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBotonActivo: {
    borderBottomColor: '#0B4DA8',
  },
  tabTexto: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B6B80',
  },
  tabTextoActivo: {
    color: '#0B4DA8',
    fontWeight: '700',
  },
  scrollContenido: {
    padding: 16,
    paddingBottom: 36,
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2A4D',
    marginBottom: 12,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE5F0',
    shadowColor: '#0F2A4D',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tarjetaTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F2A4D',
  },
  tarjetaMeta: {
    fontSize: 12,
    color: '#5B6B80',
    marginTop: 2,
  },
  tarjetaFecha: {
    fontSize: 12,
    color: '#0B4DA8',
    marginTop: 2,
    fontWeight: '600',
  },
  separador: {
    height: 1,
    backgroundColor: '#F3F6FA',
    marginVertical: 10,
  },
  subTituloCampo: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3A4D66',
    marginBottom: 4,
  },
  itemDetalle: {
    marginTop: 2,
  },
  itemBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F2A4D',
  },
  itemSub: {
    fontSize: 13,
    color: '#5B6B80',
    marginTop: 2,
    lineHeight: 18,
  },
  itemGris: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  horarioDestacado: {
    fontSize: 14,
    color: '#0B4DA8',
    fontWeight: '700',
    marginTop: 4,
  },
  comedorActivo: {
    fontSize: 13,
    color: '#3F6B14',
    fontWeight: '600',
  },
  comunicadoCuerpo: {
    fontSize: 14,
    color: '#3A4D66',
    lineHeight: 20,
    marginTop: 6,
  },
  tarjetaVacia: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE5F0',
  },
  vacioTexto: {
    color: '#5B6B80',
    fontSize: 14,
  },
  contenedorFiltrosOffline: {
    marginBottom: 10,
  },
  barraResumenFiltro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  textoResumenFiltro: {
    fontSize: 12,
    color: '#5B6B80',
    fontWeight: '600',
  },
  enlaceRestablecerFiltros: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B4DA8',
  },
  botonVerTodosVacio: {
    marginTop: 12,
    backgroundColor: '#EAF4FD',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  botonVerTodosVacioTexto: {
    color: '#0B4DA8',
    fontWeight: '700',
    fontSize: 13,
  },
});
