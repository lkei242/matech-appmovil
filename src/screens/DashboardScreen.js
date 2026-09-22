import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../api';

const ETIQUETAS_ROL = {
  alumno: 'Alumno',
  docente: 'Docente',
  padre: 'Tutor (Padre/Madre)',
  preceptor: 'Preceptor',
  directivo: 'Directivo',
  administrativo: 'Personal Administrativo',
};

export default function DashboardScreen({ navigation }) {
  const { sesion, logout } = useAuth();
  if (!sesion) return null;

  const { rol, usuario, persona } = sesion;
  const nombre =
    persona && persona.nombre
      ? `${persona.nombre} ${persona.apellido}`
      : usuario;

  return (
    <View style={styles.pantalla}>
      <View style={styles.header}>
        <Text style={styles.saludo}>Hola, {nombre}</Text>
        <Text style={styles.rol}>
          {ETIQUETAS_ROL[rol] || rol} · @{usuario}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.tarjeta}>
          <Text style={styles.titulo}>Dashboard de {ETIQUETAS_ROL[rol] || rol}</Text>
          <Text style={styles.descripcion}>
            Este módulo está en desarrollo. Acá verás las funcionalidades de tu
            rol (materias, noticias, comunicados, etc.).
          </Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloPeq}>Datos de la sesión</Text>
          <Text style={styles.dato}>Rol: {rol}</Text>
          <Text style={styles.dato}>Usuario: {usuario}</Text>
          {sesion.correo ? <Text style={styles.dato}>Correo: {sesion.correo}</Text> : null}
          <Text style={styles.dato}>API: {API_BASE_URL}</Text>
        </View>
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
  },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0B3D63',
  },
  tituloPeq: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0B3D63',
    marginBottom: 8,
  },
  descripcion: {
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 20,
  },
  dato: {
    color: '#4B5563',
    marginTop: 2,
    fontSize: 14,
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