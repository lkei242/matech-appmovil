import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../api';
import { listarAlumnos, obtenerDeuda } from '../api/pagos';
import { Boton, FranjaLogo, Icono, IconoTono, Insignia } from '../components/ui';
import { ETIQUETAS_ROL, modulosPara } from '../navigation/modulos';
import { colores, radio, sombra } from '../theme';
import { formatoMoneda } from '../utils/formato';

const LOGO = require('../../assets/logo.png');

// Resumen de deuda para el tutor: suma lo que deben todos sus hijos.
function useResumenDeuda(activo) {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    if (!activo) return;
    setCargando(true);
    try {
      const respAlumnos = await listarAlumnos();
      if (!respAlumnos.ok) throw new Error('alumnos');
      const alumnos = respAlumnos.datos || [];
      const respuestas = await Promise.all(alumnos.map((a) => obtenerDeuda(a.legajo)));
      const total = respuestas.reduce(
        (suma, r) => suma + (r.ok && r.datos ? Number(r.datos.total_deuda || 0) : 0),
        0,
      );
      setResumen({ total, alumnos: alumnos.length });
    } catch {
      // Si falla, simplemente no se muestra el resumen: el resto de la pantalla sigue andando.
      setResumen(null);
    } finally {
      setCargando(false);
    }
  }, [activo]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { resumen, cargando, recargar: cargar };
}

export default function DashboardScreen({ navigation }) {
  const { sesion, logout } = useAuth();
  const insets = useContext(SafeAreaInsetsContext);
  const esTutor = !!sesion && sesion.rol === 'padre';
  const { resumen, cargando, recargar } = useResumenDeuda(esTutor);

  if (!sesion) return null;

  const { rol, usuario, persona } = sesion;
  const nombre = persona && persona.nombre ? `${persona.nombre} ${persona.apellido}` : usuario;
  const primerNombre = persona && persona.nombre ? persona.nombre : usuario;
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');

  // Los módulos que ve cada rol se definen en src/navigation/modulos.js.
  const modulos = modulosPara(rol);
  const alDia = resumen && resumen.total <= 0;

  return (
    <View style={styles.pantalla}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          esTutor ? <RefreshControl refreshing={cargando} onRefresh={recargar} colors={[colores.azul]} /> : undefined
        }
      >
        {/* Encabezado */}
        <View style={[styles.header, { paddingTop: (insets ? insets.top : 24) + 14 }]}>
          <View style={styles.headerFila}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciales || '?'}</Text>
            </View>
            <View style={styles.headerTextos}>
              <Text style={styles.saludo} numberOfLines={1}>
                Hola, {primerNombre}
              </Text>
              <Text style={styles.rol}>{ETIQUETAS_ROL[rol] || rol}</Text>
            </View>
            <View style={styles.logoCaja}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="Educar para Transformar" />
            </View>
          </View>
          <FranjaLogo estilo={styles.franja} />
        </View>

        <View style={styles.cuerpo}>
          {/* Resumen de deuda (solo tutor) */}
          {esTutor && resumen ? (
            <View style={[styles.deuda, alDia ? styles.deudaAlDia : styles.deudaPendiente]}>
              <View style={styles.deudaCabecera}>
                <Icono
                  nombre={alDia ? 'checkmark-circle' : 'time-outline'}
                  tamano={20}
                  color={alDia ? colores.verdeTexto : colores.naranjaTexto}
                />
                <Text style={[styles.deudaEtiqueta, { color: alDia ? colores.verdeTexto : colores.naranjaTexto }]}>
                  {alDia ? 'Estás al día' : 'Deuda pendiente'}
                </Text>
              </View>
              <Text style={styles.deudaMonto}>{formatoMoneda(resumen.total)}</Text>
              <Text style={styles.deudaDetalle}>
                {resumen.alumnos === 1 ? '1 alumno a tu cargo' : `${resumen.alumnos} alumnos a tu cargo`}
              </Text>
              {!alDia ? (
                <Boton
                  texto="Pagar ahora"
                  variante="accion"
                  icono="receipt-outline"
                  onPress={() => navigation.navigate('Pagar')}
                  estilo={styles.deudaBoton}
                />
              ) : null}
            </View>
          ) : null}

          <Text style={styles.seccion}>¿Qué querés hacer?</Text>

          {modulos.map((modulo) => (
            <Pressable
              key={modulo.id}
              onPress={() => navigation.navigate(modulo.pantalla)}
              accessibilityRole="button"
              accessibilityLabel={modulo.titulo}
              style={({ pressed }) => [styles.modulo, pressed && styles.moduloPresionado]}
            >
              <IconoTono nombre={modulo.icono} tono={modulo.tono} />
              <View style={styles.moduloInfo}>
                <Text style={styles.moduloTitulo}>{modulo.titulo}</Text>
                <Text style={styles.moduloDesc} numberOfLines={2}>
                  {modulo.descripcion}
                </Text>
              </View>
              <Icono nombre="chevron-forward" tamano={20} color={colores.suave} />
            </Pressable>
          ))}

          {/* Cuenta */}
          <Text style={styles.seccion}>Mi cuenta</Text>
          <View style={styles.cuenta}>
            <View style={styles.cuentaFila}>
              <Text style={styles.cuentaEtiqueta}>Usuario</Text>
              <Text style={styles.cuentaValor}>{usuario}</Text>
            </View>
            {sesion.correo ? (
              <View style={styles.cuentaFila}>
                <Text style={styles.cuentaEtiqueta}>Correo</Text>
                <Text style={styles.cuentaValor} numberOfLines={1}>
                  {sesion.correo}
                </Text>
              </View>
            ) : null}
            <View style={styles.cuentaFila}>
              <Text style={styles.cuentaEtiqueta}>Rol</Text>
              <Insignia texto={ETIQUETAS_ROL[rol] || rol} tono="azul" />
            </View>
          </View>

          <Boton texto="Cerrar sesión" variante="peligro" icono="log-out-outline" onPress={() => logout()} />

          {/* Dato técnico solo para desarrollo */}
          {__DEV__ ? <Text style={styles.dev}>Servidor API: {API_BASE_URL}</Text> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  contenido: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: colores.azul,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 18,
  },
  headerFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerTextos: {
    flex: 1,
  },
  saludo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  rol: {
    color: '#CFE3F8',
    fontSize: 14,
    marginTop: 2,
  },
  logoCaja: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  franja: {
    opacity: 0.95,
  },
  cuerpo: {
    padding: 16,
    gap: 12,
  },
  deuda: {
    borderRadius: radio.lg,
    padding: 18,
    gap: 4,
    marginTop: -8,
    borderWidth: 1,
    ...sombra.suave,
  },
  deudaPendiente: {
    backgroundColor: colores.superficie,
    borderColor: '#F7CDBF',
  },
  deudaAlDia: {
    backgroundColor: colores.verdeSuave,
    borderColor: '#DCEBC6',
  },
  deudaCabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deudaEtiqueta: {
    fontSize: 14,
    fontWeight: '700',
  },
  deudaMonto: {
    color: colores.tinta,
    fontSize: 32,
    fontWeight: '800',
  },
  deudaDetalle: {
    color: colores.suave,
    fontSize: 14,
  },
  deudaBoton: {
    marginTop: 12,
  },
  seccion: {
    color: colores.tinta,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  modulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colores.superficie,
    borderRadius: radio.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra.suave,
  },
  moduloPresionado: {
    backgroundColor: colores.celesteSuave,
  },
  moduloInfo: {
    flex: 1,
  },
  moduloTitulo: {
    color: colores.tinta,
    fontSize: 16,
    fontWeight: '700',
  },
  moduloDesc: {
    color: colores.suave,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  cuenta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.lg,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  cuentaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.borde,
  },
  cuentaEtiqueta: {
    color: colores.suave,
    fontSize: 14,
  },
  cuentaValor: {
    flexShrink: 1,
    color: colores.tinta,
    fontSize: 14,
    fontWeight: '700',
  },
  dev: {
    color: colores.suave,
    fontSize: 11,
    textAlign: 'center',
  },
});
