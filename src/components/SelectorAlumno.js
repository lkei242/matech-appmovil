// Lista horizontal para elegir a qué alumno corresponde la consulta (o el pago).

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colores, radio } from '../theme';

function iniciales(alumno) {
  return `${(alumno.nombre || '?').charAt(0)}${(alumno.apellido || '').charAt(0)}`.toUpperCase();
}

export default function SelectorAlumno({ alumnos, seleccionado, onSeleccionar }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
      {alumnos.map((alumno) => {
        const activo = alumno.legajo === seleccionado;
        return (
          <Pressable
            key={alumno.legajo}
            onPress={() => onSeleccionar(alumno.legajo)}
            style={[styles.chip, activo && styles.chipActivo]}
            accessibilityRole="button"
            accessibilityState={{ selected: activo }}
          >
            <View style={[styles.avatar, activo && styles.avatarActivo]}>
              <Text style={[styles.avatarTexto, activo && styles.avatarTextoActivo]}>{iniciales(alumno)}</Text>
            </View>
            <Text style={[styles.texto, activo && styles.textoActivo]}>
              {alumno.nombre} {alumno.apellido}
            </Text>
          </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: colores.borde,
    borderRadius: radio.pastilla,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    backgroundColor: colores.superficie,
  },
  chipActivo: {
    borderColor: colores.azul,
    backgroundColor: colores.celesteSuave,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colores.celesteSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActivo: {
    backgroundColor: colores.azul,
  },
  avatarTexto: {
    color: colores.azul,
    fontSize: 12,
    fontWeight: '800',
  },
  avatarTextoActivo: {
    color: '#FFFFFF',
  },
  texto: {
    color: colores.texto,
    fontWeight: '600',
  },
  textoActivo: {
    color: colores.azul,
    fontWeight: '700',
  },
});
