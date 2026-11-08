// Lista horizontal para elegir a qué alumno corresponde la consulta (o el pago).

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export default function SelectorAlumno({ alumnos, seleccionado, onSeleccionar }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
      {alumnos.map((alumno) => {
        const activo = alumno.legajo === seleccionado;
        return (
          <TouchableOpacity
            key={alumno.legajo}
            onPress={() => onSeleccionar(alumno.legajo)}
            style={[styles.chip, activo && styles.chipActivo]}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
          >
            <Text style={[styles.texto, activo && styles.textoActivo]}>
              {alumno.nombre} {alumno.apellido}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fila: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#0B3D63',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  chipActivo: {
    backgroundColor: '#0B3D63',
  },
  texto: {
    color: '#0B3D63',
    fontWeight: '600',
  },
  textoActivo: {
    color: '#fff',
  },
});
