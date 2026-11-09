// Componentes visuales compartidos por todas las pantallas.
// Usar estos en vez de repetir estilos: así la app se mantiene coherente.

import React, { useContext } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { colores, radio, sombra, tonos } from '../theme';

export function Icono({ nombre, tamano = 22, color = colores.azul, estilo }) {
  return <Ionicons name={nombre} size={tamano} color={color} style={estilo} />;
}

// Contenedor de pantalla con scroll, fondo y separación uniforme.
export function Pantalla({ children, estiloContenido, ...resto }) {
  return (
    <ScrollView
      style={styles.pantalla}
      contentContainerStyle={[styles.pantallaContenido, estiloContenido]}
      keyboardShouldPersistTaps="handled"
      {...resto}
    >
      {children}
    </ScrollView>
  );
}

export function Tarjeta({ children, estilo, acento, onPress, ...resto }) {
  const contenido = (
    <View style={[styles.tarjeta, acento && { borderColor: acento, borderWidth: 1.5 }, estilo]}>
      {children}
    </View>
  );
  if (!onPress) return contenido;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" {...resto}>
      {contenido}
    </Pressable>
  );
}

export function Seccion({ texto, estilo }) {
  return <Text style={[styles.seccion, estilo]}>{texto}</Text>;
}

// variante: 'primario' | 'secundario' | 'peligro' | 'accion'
export function Boton({ texto, onPress, variante = 'primario', icono, cargando, deshabilitado, estilo }) {
  const inactivo = cargando || deshabilitado;
  const secundario = variante === 'secundario';
  const peligro = variante === 'peligro';
  const colorTexto = secundario ? colores.azul : peligro ? colores.rosaTexto : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={({ pressed }) => [
        styles.boton,
        variante === 'primario' && { backgroundColor: colores.azul },
        variante === 'accion' && { backgroundColor: colores.naranjaAccion },
        secundario && { backgroundColor: colores.superficie, borderColor: colores.borde, borderWidth: 1.5 },
        peligro && { backgroundColor: colores.rosaSuave, borderColor: '#F3C2DB', borderWidth: 1.5 },
        pressed && { opacity: 0.85 },
        inactivo && { opacity: 0.55 },
        estilo,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <>
          {icono ? <Icono nombre={icono} tamano={20} color={colorTexto} /> : null}
          <Text style={[styles.botonTexto, { color: colorTexto }]}>{texto}</Text>
        </>
      )}
    </Pressable>
  );
}

// tono: 'azul' | 'verde' | 'rosa' | 'naranja' | 'violeta' | 'gris'
export function Insignia({ texto, tono = 'azul' }) {
  const t = tonos[tono] || tonos.azul;
  return (
    <View style={[styles.insignia, { backgroundColor: t.fondo }]}>
      <Text style={[styles.insigniaTexto, { color: t.texto }]}>{texto}</Text>
    </View>
  );
}

// Cuadrado de color con un ícono adentro.
export function IconoTono({ nombre, tono = 'azul', tamano = 46 }) {
  const t = tonos[tono] || tonos.azul;
  return (
    <View
      style={[
        styles.iconoTono,
        { width: tamano, height: tamano, borderRadius: tamano * 0.3, backgroundColor: t.fondo },
      ]}
    >
      <Icono nombre={nombre} tamano={tamano * 0.5} color={t.texto} />
    </View>
  );
}

export function Campo({ etiqueta, estilo, ...inputProps }) {
  return (
    <View style={estilo}>
      {etiqueta ? <Text style={styles.campoEtiqueta}>{etiqueta}</Text> : null}
      <TextInput
        placeholderTextColor="#8A99AB"
        style={styles.campoInput}
        {...inputProps}
      />
    </View>
  );
}

// Aviso con ícono. tono: 'verde' | 'rosa' | 'naranja' | 'azul'
export function Aviso({ texto, tono = 'azul' }) {
  const t = tonos[tono] || tonos.azul;
  const icono = tono === 'verde' ? 'checkmark-circle' : tono === 'azul' ? 'information-circle' : 'alert-circle';
  return (
    <View style={[styles.aviso, { backgroundColor: t.fondo }]}>
      <Icono nombre={icono} tamano={20} color={t.texto} />
      <Text style={[styles.avisoTexto, { color: t.texto }]}>{texto}</Text>
    </View>
  );
}

// Encabezado azul de las pantallas que no usan la barra de título del navegador.
export function EncabezadoPantalla({ titulo, subtitulo, onVolver }) {
  const insets = useContext(SafeAreaInsetsContext);
  const arriba = (insets ? insets.top : 24) + 8;

  return (
    <View style={[styles.encabezado, { paddingTop: arriba }]}>
      {onVolver ? (
        <Pressable
          onPress={onVolver}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.encabezadoVolver}
        >
          <Icono nombre="chevron-back" tamano={20} color="#FFFFFF" />
          <Text style={styles.encabezadoVolverTexto}>Volver</Text>
        </Pressable>
      ) : null}
      <Text style={styles.encabezadoTitulo}>{titulo}</Text>
      {subtitulo ? <Text style={styles.encabezadoSubtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

// Franja con los cinco colores del logo.
export function FranjaLogo({ estilo }) {
  const lista = [colores.naranja, colores.rosa, colores.violeta, colores.celeste, colores.verde];
  return (
    <View style={[styles.franja, estilo]}>
      {lista.map((c) => (
        <View key={c} style={[styles.franjaTramo, { backgroundColor: c }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  pantallaContenido: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.lg,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colores.borde,
    ...sombra.suave,
  },
  seccion: {
    color: colores.tinta,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
  },
  boton: {
    minHeight: 50,
    borderRadius: radio.md,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: '700',
  },
  insignia: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radio.pastilla,
  },
  insigniaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  iconoTono: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  campoEtiqueta: {
    color: colores.tinta,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  campoInput: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: '#C3D1E0',
    borderRadius: radio.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colores.tinta,
    backgroundColor: '#FFFFFF',
  },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: radio.md,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  encabezado: {
    backgroundColor: colores.azul,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  encabezadoVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginLeft: -4,
  },
  encabezadoVolverTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  encabezadoTitulo: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  encabezadoSubtitulo: {
    color: '#CFE3F8',
    fontSize: 14,
    marginTop: 3,
  },
  franja: {
    flexDirection: 'row',
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  franjaTramo: {
    flex: 1,
  },
});
