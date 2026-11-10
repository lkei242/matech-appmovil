import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../auth/AuthContext';
import { getPerfil, updatePerfil } from './perfilApi';

const ROLES_ETIQUETAS = {
  padre: 'Tutor (Padre/Madre)',
  alumno: 'Alumno',
  docente: 'Docente',
  administrativo: 'Personal Administrativo',
  directivo: 'Directivo',
  preceptor: 'Preceptor',
};

export default function PerfilScreen() {
  const { sesion } = useAuth();
  const token = sesion?.access;

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const [perfil, setPerfil] = useState(null);
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  const [errorEmail, setErrorEmail] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await getPerfil(token);
      if (resp.ok && resp.datos) {
        setPerfil(resp.datos);
        const pers = resp.datos.persona || {};
        setEmail(pers.email || resp.datos.correo || '');
        setTelefono(pers.telefono || '');
      } else {
        setMensajeError(resp.datos?.error || 'No se pudo obtener la información de perfil.');
      }
    } catch {
      setMensajeError('Falla de conexión al consultar el perfil.');
    }
  }, [token]);

  useEffect(() => {
    (async () => {
      setCargando(true);
      await cargarDatos();
      setCargando(false);
    })();
  }, [cargarDatos]);

  const onRefresh = async () => {
    setRefrescando(true);
    setMensajeExito('');
    setMensajeError('');
    await cargarDatos();
    setRefrescando(false);
  };

  const validarFormulario = () => {
    let valido = true;
    setErrorEmail('');

    const emailTrim = email.trim();
    if (emailTrim && (!emailTrim.includes('@') || !emailTrim.includes('.'))) {
      setErrorEmail('Ingrese una dirección de correo válida (ej: nombre@correo.com)');
      valido = false;
    }

    return valido;
  };

  const handleGuardar = async () => {
    setMensajeExito('');
    setMensajeError('');

    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    try {
      const resp = await updatePerfil(token, {
        email: email.trim(),
        telefono: telefono.trim(),
      });

      if (resp.ok) {
        setMensajeExito('Datos de contacto actualizados correctamente.');
        if (resp.datos?.persona) {
          setPerfil((prev) => ({
            ...prev,
            correo: resp.datos.correo,
            persona: resp.datos.persona,
          }));
        }
      } else {
        setMensajeError(resp.datos?.error || 'No se pudieron guardar los cambios.');
      }
    } catch {
      setMensajeError('Error de red al actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.pantallaCentrada}>
        <ActivityIndicator size="large" color="#0B4DA8" />
        <Text style={styles.cargandoTexto}>Cargando perfil...</Text>
      </View>
    );
  }

  const persona = perfil?.persona;
  const nombreCompleto = persona?.nombre ? `${persona.nombre} ${persona.apellido}` : perfil?.usuario;
  const rolEtiqueta = ROLES_ETIQUETAS[perfil?.rol] || perfil?.rol || 'Usuario';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.contenedor}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={onRefresh} colors={['#0B4DA8']} />}
      >
        {/* Banner Éxito */}
        {mensajeExito ? (
          <View style={styles.bannerExito}>
            <Text style={styles.bannerTextoExito}>{mensajeExito}</Text>
          </View>
        ) : null}

        {/* Banner Error */}
        {mensajeError ? (
          <View style={styles.bannerError}>
            <Text style={styles.bannerTextoError}>{mensajeError}</Text>
          </View>
        ) : null}

        {/* Tarjeta de Identidad (Sólo lectura institucional) */}
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaTitulo}>Datos Institucionales</Text>
          <Text style={styles.tarjetaSub}>Información registrada en el centro educativo</Text>

          <View style={styles.campoDato}>
            <Text style={styles.etiqueta}>Nombre y Apellido:</Text>
            <Text style={styles.valorPrincipal}>{nombreCompleto}</Text>
          </View>

          {persona?.dni ? (
            <View style={styles.campoDato}>
              <Text style={styles.etiqueta}>DNI / Identificación:</Text>
              <Text style={styles.valor}>{persona.dni}</Text>
            </View>
          ) : null}

          <View style={styles.campoDato}>
            <Text style={styles.etiqueta}>Rol asignado:</Text>
            <View style={styles.rolPill}>
              <Text style={styles.rolPillTexto}>{rolEtiqueta}</Text>
            </View>
          </View>

          <View style={styles.campoDato}>
            <Text style={styles.etiqueta}>Nombre de usuario:</Text>
            <Text style={styles.valor}>@{perfil?.usuario}</Text>
          </View>
        </View>

        {/* Formulario de Contacto Editable */}
        <View style={styles.tarjeta}>
          <Text style={styles.tarjetaTitulo}>Datos de Contacto</Text>
          <Text style={styles.tarjetaSub}>
            Podés actualizar tu email y teléfono de comunicación institucional
          </Text>

          {/* Campo Correo Electrónico */}
          <View style={styles.campoFormulario}>
            <Text style={styles.inputEtiqueta}>Correo Electrónico:</Text>
            <TextInput
              style={[styles.input, errorEmail && styles.inputError]}
              value={email}
              onChangeText={(texto) => {
                setEmail(texto);
                if (errorEmail) setErrorEmail('');
              }}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!guardando}
            />
            {errorEmail ? <Text style={styles.errorTexto}>{errorEmail}</Text> : null}
            <Text style={styles.ayudaTexto}>
              Utilizado para recibir facturas, recordatorios y notificaciones.
            </Text>
          </View>

          {/* Campo Teléfono */}
          <View style={styles.campoFormulario}>
            <Text style={styles.inputEtiqueta}>Teléfono de Contacto:</Text>
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Ej: 11 5555-8888"
              keyboardType="phone-pad"
              editable={!guardando}
            />
            <Text style={styles.ayudaTexto}>
              Para emergencias o avisos urgentes del establecimiento escolar.
            </Text>
          </View>

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonGuardarDeshabilitado]}
            disabled={guardando}
            onPress={handleGuardar}
          >
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.botonGuardarTexto}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F6F9FD',
  },
  pantallaCentrada: {
    flex: 1,
    backgroundColor: '#F6F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargandoTexto: {
    marginTop: 12,
    color: '#3A4D66',
    fontSize: 15,
  },
  scrollContenido: {
    padding: 16,
    paddingBottom: 36,
  },
  bannerExito: {
    backgroundColor: '#F1F8E8',
    borderLeftWidth: 4,
    borderLeftColor: '#3F6B14',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  bannerTextoExito: {
    color: '#3F6B14',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerError: {
    backgroundColor: '#FDE8F3',
    borderLeftWidth: 4,
    borderLeftColor: '#A10762',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  bannerTextoError: {
    color: '#A10762',
    fontSize: 14,
    fontWeight: '600',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCE5F0',
    shadowColor: '#0F2A4D',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tarjetaTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2A4D',
  },
  tarjetaSub: {
    fontSize: 13,
    color: '#5B6B80',
    marginTop: 2,
    marginBottom: 16,
  },
  campoDato: {
    marginBottom: 12,
  },
  etiqueta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B6B80',
    textTransform: 'uppercase',
  },
  valorPrincipal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F2A4D',
    marginTop: 2,
  },
  valor: {
    fontSize: 15,
    color: '#3A4D66',
    marginTop: 2,
  },
  rolPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EAF4FD',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  rolPillTexto: {
    color: '#0B4DA8',
    fontSize: 13,
    fontWeight: '700',
  },
  campoFormulario: {
    marginBottom: 16,
  },
  inputEtiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F2A4D',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F2A4D',
    minHeight: 46,
  },
  inputError: {
    borderColor: '#A10762',
    backgroundColor: '#FFF8FA',
  },
  errorTexto: {
    color: '#A10762',
    fontSize: 12,
    marginTop: 4,
  },
  ayudaTexto: {
    color: '#5B6B80',
    fontSize: 12,
    marginTop: 4,
  },
  botonGuardar: {
    backgroundColor: '#0B4DA8',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botonGuardarDeshabilitado: {
    opacity: 0.6,
  },
  botonGuardarTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
