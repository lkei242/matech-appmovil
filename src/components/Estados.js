// Estados comunes de las pantallas: cargando, error y lista vacía.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colores } from '../theme';
import { Boton, Icono } from './ui';

export function EstadoCargando({ texto = 'Cargando…' }) {
  return (
    <View style={styles.caja}>
      <ActivityIndicator size="large" color={colores.azul} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

export function EstadoError({ mensaje, onReintentar }) {
  return (
    <View style={styles.caja}>
      <View style={[styles.circulo, { backgroundColor: colores.errorSuave }]}>
        <Icono nombre="cloud-offline-outline" tamano={28} color={colores.error} />
      </View>
      <Text style={styles.error}>{mensaje}</Text>
      {onReintentar ? <Boton texto="Reintentar" icono="refresh" onPress={onReintentar} estilo={styles.boton} /> : null}
    </View>
  );
}

export function EstadoVacio({ mensaje, icono = 'file-tray-outline' }) {
  return (
    <View style={styles.caja}>
      <View style={[styles.circulo, { backgroundColor: colores.celesteSuave }]}>
        <Icono nombre={icono} tamano={28} color={colores.azul} />
      </View>
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  circulo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    color: colores.suave,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: colores.error,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 21,
  },
  boton: {
    alignSelf: 'center',
    minHeight: 44,
  },
});
