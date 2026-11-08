// Carga del comprobante de la transferencia (RF-M05).
// Se puede cargar más de un comprobante por factura. El servidor valida el archivo otra vez.

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { mensajeDeError, subirComprobante } from '../../api/pagos';
import { formatoMoneda, importeValido } from '../../utils/formato';

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB, igual que en el servidor

export default function ComprobanteScreen({ route }) {
  const { factura, total } = route.params;
  const [archivo, setArchivo] = useState(null);
  const [importe, setImporte] = useState(String(total || ''));
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function elegirArchivo() {
    setError('');
    const resultado = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/png', 'image/jpeg'],
      copyToCacheDirectory: true,
    });
    if (resultado.canceled || !resultado.assets || !resultado.assets[0]) return;

    const elegido = resultado.assets[0];
    if (elegido.size && elegido.size > TAMANO_MAXIMO) {
      setError('El archivo supera el máximo de 5 MB. Elegí uno más chico.');
      return;
    }
    setArchivo(elegido);
  }

  async function enviar() {
    setError('');
    setMensaje('');
    const importeLimpio = importeValido(importe);
    if (!importeLimpio) {
      setError('Indicá el importe transferido (mayor a cero).');
      return;
    }
    if (!archivo) {
      setError('Elegí el comprobante (PDF, PNG o JPG).');
      return;
    }

    setEnviando(true);
    try {
      const resp = await subirComprobante({ factura, archivo, importe: importeLimpio });
      if (!resp.ok) {
        setError(mensajeDeError(resp, 'No se pudo enviar el comprobante.'));
        return;
      }
      setMensaje('Comprobante enviado. Queda pendiente hasta que la administración lo apruebe.');
      setArchivo(null);
    } catch {
      setError('No se pudo conectar con el servidor. Revisá tu conexión y reintentá.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>Total de la solicitud</Text>
        <Text style={styles.total}>{formatoMoneda(total)}</Text>
        <Text style={styles.nota}>Pagá por transferencia bancaria. No se reciben pagos en efectivo.</Text>
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>Importe transferido</Text>
        <TextInput
          style={styles.input}
          value={importe}
          onChangeText={setImporte}
          keyboardType="decimal-pad"
          placeholder="Ej: 10000,00"
        />

        <TouchableOpacity style={styles.botonSecundario} onPress={elegirArchivo}>
          <Text style={styles.botonSecundarioTexto}>{archivo ? `Archivo: ${archivo.name}` : 'Elegir comprobante'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, enviando && styles.botonDeshabilitado]}
          onPress={enviar}
          disabled={enviando}
        >
          <Text style={styles.botonTexto}>{enviando ? 'Enviando…' : 'Enviar comprobante'}</Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: {
    padding: 16,
    gap: 12,
    backgroundColor: '#F3F6FA',
  },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  titulo: {
    color: '#0B3D63',
    fontSize: 16,
    fontWeight: '600',
  },
  total: {
    color: '#0B3D63',
    fontSize: 24,
    fontWeight: 'bold',
  },
  etiqueta: {
    color: '#374151',
    fontWeight: '600',
  },
  nota: {
    color: '#6B7280',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#0B3D63',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  botonSecundarioTexto: {
    color: '#0B3D63',
    fontWeight: '600',
  },
  boton: {
    backgroundColor: '#0B3D63',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#B91C1C',
    textAlign: 'center',
  },
  mensaje: {
    color: '#15803D',
    textAlign: 'center',
  },
});
