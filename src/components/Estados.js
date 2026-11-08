// Estados comunes de las pantallas: cargando, error y lista vacía.

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function EstadoCargando({ texto = 'Cargando…' }) {
  return (
    <View style={styles.caja}>
      <ActivityIndicator size="large" color="#0B3D63" />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

export function EstadoError({ mensaje, onReintentar }) {
  return (
    <View style={styles.caja}>
      <Text style={styles.error}>{mensaje}</Text>
      {onReintentar ? (
        <TouchableOpacity style={styles.boton} onPress={onReintentar}>
          <Text style={styles.botonTexto}>Reintentar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function EstadoVacio({ mensaje }) {
  return (
    <View style={styles.caja}>
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
  texto: {
    color: '#4B5563',
    textAlign: 'center',
    fontSize: 15,
  },
  error: {
    color: '#B91C1C',
    textAlign: 'center',
    fontSize: 15,
  },
  boton: {
    backgroundColor: '#0B3D63',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  botonTexto: {
    color: '#fff',
    fontWeight: '600',
  },
});
