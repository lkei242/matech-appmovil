import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { ETIQUETAS_ROL, modulosPara } from '../navigation/modulos';
import { EstadoVacio } from '../components/Estados';

export default function DashboardScreen({ navigation }) {
  const { sesion, logout } = useAuth();
  if (!sesion) return null;

  const { rol, usuario, persona } = sesion;
  const nombre = persona && persona.nombre ? `${persona.nombre} ${persona.apellido}` : usuario;
  const modulos = modulosPara(rol);

  return (
    <View style={styles.pantalla}>
      <View style={styles.header}>
        <Text style={styles.saludo}>Hola, {nombre}</Text>
        <Text style={styles.rol}>{ETIQUETAS_ROL[rol] || rol} · @{usuario}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        {modulos.length === 0 ? (
          <EstadoVacio mensaje="Todavía no hay funciones móviles para tu rol." />
        ) : (
          modulos.map((modulo) => (
            <TouchableOpacity
              key={modulo.id}
              style={styles.tarjeta}
              onPress={() => navigation.navigate(modulo.pantalla)}
              accessibilityRole="button"
            >
              <Text style={styles.titulo}>{modulo.titulo}</Text>
              <Text style={styles.descripcion}>{modulo.descripcion}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <View style={styles.pie}>
        <TouchableOpacity style={styles.boton} onPress={() => logout()}>
          <Text style={styles.botonTexto}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },
  header: {
    backgroundColor: '#0B3D63',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 18,
  },
  saludo: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  rol: {
    color: '#BFDBFE',
    fontSize: 14,
    marginTop: 4,
  },
  contenido: {
    padding: 16,
    gap: 12,
  },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  titulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0B3D63',
  },
  descripcion: {
    color: '#4B5563',
    marginTop: 4,
    lineHeight: 20,
  },
  pie: {
    padding: 16,
  },
  boton: {
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
