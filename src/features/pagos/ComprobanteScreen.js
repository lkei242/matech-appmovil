// Carga del comprobante de la transferencia (RF-M05).
// Se puede cargar más de un comprobante por factura. El servidor valida el archivo otra vez.

import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';

import { Aviso, Boton, Campo, Pantalla, Tarjeta } from '../../components/ui';
import { mensajeDeError, subirComprobante } from '../../api/pagos';
import { colores } from '../../theme';
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
    <Pantalla>
      <Tarjeta>
        <Text style={styles.etiquetaTotal}>Total de la solicitud</Text>
        <Text style={styles.total}>{formatoMoneda(total)}</Text>
        <Aviso texto="Pagá por transferencia bancaria. No se reciben pagos en efectivo." tono="azul" />
      </Tarjeta>

      <Tarjeta>
        <Campo
          etiqueta="Importe transferido"
          value={importe}
          onChangeText={setImporte}
          keyboardType="decimal-pad"
          placeholder="Ej: 10000,00"
        />

        <Boton
          texto={archivo ? `Archivo: ${archivo.name}` : 'Elegir comprobante'}
          variante="secundario"
          icono={archivo ? 'document-attach-outline' : 'attach-outline'}
          onPress={elegirArchivo}
        />
        <Text style={styles.ayuda}>PDF, PNG o JPG. Máximo 5 MB.</Text>

        <Boton
          texto={enviando ? 'Enviando…' : 'Enviar comprobante'}
          icono="paper-plane-outline"
          onPress={enviar}
          cargando={enviando}
        />

        {error ? <Aviso texto={error} tono="rosa" /> : null}
        {mensaje ? <Aviso texto={mensaje} tono="verde" /> : null}
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  etiquetaTotal: {
    color: colores.suave,
    fontSize: 14,
    fontWeight: '600',
  },
  total: {
    color: colores.tinta,
    fontSize: 32,
    fontWeight: '800',
  },
  ayuda: {
    color: colores.suave,
    fontSize: 13,
    textAlign: 'center',
  },
});
