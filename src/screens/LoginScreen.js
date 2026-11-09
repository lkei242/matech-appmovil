import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { apiRecuperarContrasena } from '../api';
import { Aviso, Boton, FranjaLogo, Icono } from '../components/ui';
import { colores, radio } from '../theme';

const LOGO = require('../../assets/logo.png');

export default function LoginScreen() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  async function ingresar() {
    setError('');
    setMensaje('');
    if (!usuario.trim() || !password) {
      setError('Ingresá usuario y contraseña.');
      return;
    }
    setCargando(true);
    try {
      await login(usuario.trim(), password);
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  async function recuperar() {
    setError('');
    setMensaje('');
    if (!correo.trim()) {
      setError('Ingresá tu correo electrónico.');
      return;
    }
    setCargando(true);
    try {
      const resp = await apiRecuperarContrasena(correo.trim());
      if (resp.ok) {
        setMensaje(resp.datos && resp.datos.mensaje ? resp.datos.mensaje : 'Revisá tu correo.');
        setRecuperando(false);
      } else {
        setError((resp.datos && resp.datos.error) || 'No se pudo recuperar la contraseña.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.pantalla}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.marca}>
          <View style={styles.logoCaja}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" accessibilityLabel="Educar para Transformar" />
          </View>
          <Text style={styles.titulo}>Educar para Transformar</Text>
          <Text style={styles.subtitulo}>App móvil del centro educativo</Text>
          <FranjaLogo estilo={styles.franja} />
        </View>

        <View style={styles.caja}>
          <Text style={styles.cajaTitulo}>{recuperando ? 'Recuperar contraseña' : 'Iniciar sesión'}</Text>
          <Text style={styles.cajaDesc}>
            {recuperando
              ? 'Ingresá tu correo y te enviamos las instrucciones.'
              : 'Ingresá con tu usuario y contraseña.'}
          </Text>

          {!recuperando ? (
            <>
              <View style={styles.campo}>
                <Icono nombre="person-outline" tamano={20} color={colores.suave} />
                <TextInput
                  style={styles.input}
                  placeholder="Usuario"
                  placeholderTextColor="#8A99AB"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={usuario}
                  onChangeText={setUsuario}
                  accessibilityLabel="Usuario"
                />
              </View>
              <View style={styles.campo}>
                <Icono nombre="lock-closed-outline" tamano={20} color={colores.suave} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#8A99AB"
                  secureTextEntry={!verPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={ingresar}
                  accessibilityLabel="Contraseña"
                />
                <Pressable
                  onPress={() => setVerPassword((v) => !v)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <Icono nombre={verPassword ? 'eye-off-outline' : 'eye-outline'} tamano={20} color={colores.suave} />
                </Pressable>
              </View>

              <Boton texto="Ingresar" onPress={ingresar} cargando={cargando} estilo={styles.boton} />
              <Pressable onPress={() => setRecuperando(true)} accessibilityRole="button">
                <Text style={styles.enlace}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.campo}>
                <Icono nombre="mail-outline" tamano={20} color={colores.suave} />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor="#8A99AB"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={correo}
                  onChangeText={setCorreo}
                  accessibilityLabel="Correo electrónico"
                />
              </View>
              <Boton texto="Recuperar contraseña" onPress={recuperar} cargando={cargando} estilo={styles.boton} />
              <Pressable onPress={() => setRecuperando(false)} accessibilityRole="button">
                <Text style={styles.enlace}>Volver al inicio de sesión</Text>
              </Pressable>
            </>
          )}

          {error ? <Aviso texto={error} tono="rosa" /> : null}
          {mensaje ? <Aviso texto={mensaje} tono="verde" /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colores.azul,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    gap: 22,
  },
  marca: {
    alignItems: 'center',
    gap: 6,
  },
  logoCaja: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitulo: {
    color: '#CFE3F8',
    fontSize: 14,
    textAlign: 'center',
  },
  franja: {
    width: 120,
    marginTop: 12,
  },
  caja: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    gap: 14,
  },
  cajaTitulo: {
    color: colores.tinta,
    fontSize: 20,
    fontWeight: '800',
  },
  cajaDesc: {
    color: colores.suave,
    fontSize: 14,
    marginTop: -8,
  },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#C3D1E0',
    borderRadius: radio.md,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: colores.tinta,
  },
  boton: {
    marginTop: 4,
  },
  enlace: {
    color: colores.azul,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
  },
});
