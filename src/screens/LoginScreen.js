import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { apiRecuperarContrasena } from '../api';

export default function LoginScreen() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
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
      <View style={styles.caja}>
        <Text style={styles.titulo}>Educar para Transformar</Text>
        <Text style={styles.subtitulo}>App móvil</Text>

        {!recuperando ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              autoCapitalize="none"
              value={usuario}
              onChangeText={setUsuario}
            />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={[styles.boton, cargando && styles.botonDeshabilitado]}
              onPress={ingresar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Ingresar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRecuperando(true)}>
              <Text style={styles.enlace}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              value={correo}
              onChangeText={setCorreo}
            />
            <TouchableOpacity
              style={[styles.boton, cargando && styles.botonDeshabilitado]}
              onPress={recuperar}
              disabled={cargando}
            >
              {cargando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Recuperar contraseña</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRecuperando(false)}>
              <Text style={styles.enlace}>Volver al inicio de sesión</Text>
            </TouchableOpacity>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#E6F4FE',
    justifyContent: 'center',
    padding: 24,
  },
  caja: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B3D63',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  boton: {
    backgroundColor: '#0B3D63',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  enlace: {
    color: '#0B3D63',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  error: {
    color: '#B91C1C',
    textAlign: 'center',
    marginTop: 14,
  },
  mensaje: {
    color: '#15803D',
    textAlign: 'center',
    marginTop: 14,
  },
});