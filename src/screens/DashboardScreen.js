import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../api';
import { ETIQUETAS_ROL, modulosPara } from '../navigation/modulos';

export default function DashboardScreen({ navigation }) {
  const { sesion, logout } = useAuth();
  if (!sesion) return null;

  const { rol, usuario, persona } = sesion;
  const nombre =
    persona && persona.nombre
      ? `${persona.nombre} ${persona.apellido}`
      : usuario;

  // Los módulos que ve cada rol se definen en src/navigation/modulos.js.
  const modulos = modulosPara(rol);

  return (
    <View style={styles.pantalla}>
      <View style={styles.header}>
        <Text style={styles.saludo}>Hola, {nombre}</Text>
        <Text style={styles.rol}>
          {ETIQUETAS_ROL[rol] || rol} · @{usuario}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.seccionEncabezado}>Módulos Disponibles</Text>

        {modulos.map((modulo) => (
          <TouchableOpacity
            key={modulo.id}
            style={styles.moduloTarjeta}
            onPress={() => navigation.navigate(modulo.pantalla)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <View style={[styles.moduloIconoContenedor, { backgroundColor: modulo.fondo }]}>
              <Text style={styles.moduloIcono}>{modulo.icono}</Text>
            </View>
            <View style={styles.moduloInfo}>
              <View style={styles.moduloFilaTitulo}>
                <Text style={styles.moduloTitulo}>{modulo.titulo}</Text>
                <View style={[styles.rfBadge, { backgroundColor: modulo.fondo }]}>
                  <Text style={[styles.rfBadgeTexto, { color: modulo.colorTexto }]}>{modulo.rf}</Text>
                </View>
              </View>
              <Text style={styles.moduloDesc}>{modulo.descripcion}</Text>
            </View>
            <Text style={styles.moduloFlecha}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Datos técnicos de la sesión */}
        <View style={styles.tarjeta}>
          <Text style={styles.tituloPeq}>Datos de la sesión activa</Text>
          <Text style={styles.dato}>Rol institucional: <Text style={styles.datoBold}>{rol}</Text></Text>
          <Text style={styles.dato}>Usuario: <Text style={styles.datoBold}>{usuario}</Text></Text>
          {sesion.correo ? <Text style={styles.dato}>Correo: <Text style={styles.datoBold}>{sesion.correo}</Text></Text> : null}
          <Text style={styles.dato}>Servidor API: <Text style={styles.datoCode}>{API_BASE_URL}</Text></Text>
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
    backgroundColor: '#F6F9FC',
  },
  header: {
    backgroundColor: '#18324B',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 20,
  },
  saludo: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  rol: {
    color: '#BFDBFE',
    fontSize: 14,
    marginTop: 4,
  },
  contenido: {
    padding: 16,
    paddingBottom: 20,
  },
  seccionEncabezado: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18324B',
    marginBottom: 12,
  },
  moduloTarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE6EF',
    shadowColor: '#18324B',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  moduloIconoContenedor: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E8F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moduloIcono: {
    fontSize: 22,
  },
  moduloInfo: {
    flex: 1,
  },
  moduloFilaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  moduloTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#18324B',
  },
  rfBadge: {
    backgroundColor: '#E8F2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rfBadgeTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D66C2',
  },
  moduloDesc: {
    fontSize: 13,
    color: '#62758A',
    marginTop: 3,
    lineHeight: 18,
  },
  moduloFlecha: {
    fontSize: 22,
    color: '#62758A',
    marginLeft: 6,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DCE6EF',
  },
  tituloPeq: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18324B',
    marginBottom: 8,
  },
  dato: {
    color: '#344C62',
    marginTop: 4,
    fontSize: 13,
  },
  datoBold: {
    fontWeight: '700',
    color: '#18324B',
  },
  datoCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: '#1D66C2',
  },
  pie: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#DCE6EF',
  },
  boton: {
    backgroundColor: '#B91D6A',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
