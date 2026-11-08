// Facturas y comprobantes por alumno y período (RF-M07).

import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { EstadoCargando, EstadoError, EstadoVacio } from '../../components/Estados';
import SelectorAlumno from '../../components/SelectorAlumno';
import { listarAlumnos, listarFacturas, mensajeDeError } from '../../api/pagos';
import { formatoFecha, formatoMoneda } from '../../utils/formato';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export default function FacturasScreen() {
  const [alumnos, setAlumnos] = useState([]);
  const [legajo, setLegajo] = useState(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [facturas, setFacturas] = useState([]);
  const [estado, setEstado] = useState('cargando');
  const [error, setError] = useState('');
  const [buscado, setBuscado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resp = await listarAlumnos();
        if (!resp.ok) throw new Error(mensajeDeError(resp, 'No se pudieron cargar los alumnos.'));
        const lista = resp.datos || [];
        setAlumnos(lista);
        if (lista.length === 1) setLegajo(lista[0].legajo);
        setEstado('listo');
      } catch (e) {
        setError(e.message || 'No se pudo conectar con el servidor.');
        setEstado('error');
      }
    })();
  }, []);

  async function buscar() {
    setError('');
    if ((desde && !PATRON_FECHA.test(desde)) || (hasta && !PATRON_FECHA.test(hasta))) {
      setError('Las fechas deben tener el formato AAAA-MM-DD.');
      return;
    }
    if (desde && hasta && desde > hasta) {
      setError('La fecha "desde" no puede ser posterior a "hasta".');
      return;
    }
    setEstado('cargando');
    try {
      const resp = await listarFacturas({ alumno: legajo, desde, hasta });
      if (!resp.ok) throw new Error(mensajeDeError(resp, 'No se pudieron cargar las facturas.'));
      setFacturas(resp.datos || []);
      setBuscado(true);
      setEstado('listo');
    } catch (e) {
      setError(e.message || 'No se pudo conectar con el servidor.');
      setEstado('error');
    }
  }

  if (estado === 'cargando' && alumnos.length === 0) return <EstadoCargando />;
  if (estado === 'error' && alumnos.length === 0) return <EstadoError mensaje={error} />;
  if (alumnos.length === 0) return <EstadoVacio mensaje="No hay alumnos asociados a tu cuenta." />;

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <SelectorAlumno alumnos={alumnos} seleccionado={legajo} onSeleccionar={setLegajo} />

      <View style={styles.tarjeta}>
        <Text style={styles.etiqueta}>Período (opcional)</Text>
        <TextInput style={styles.input} value={desde} onChangeText={setDesde} placeholder="Desde: AAAA-MM-DD" autoCapitalize="none" />
        <TextInput style={styles.input} value={hasta} onChangeText={setHasta} placeholder="Hasta: AAAA-MM-DD" autoCapitalize="none" />
        <TouchableOpacity style={styles.boton} onPress={buscar} disabled={!legajo}>
          <Text style={styles.botonTexto}>Buscar</Text>
        </TouchableOpacity>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {!legajo ? <EstadoVacio mensaje="Elegí un alumno para ver sus facturas." /> : null}
      {legajo && estado === 'cargando' ? <EstadoCargando /> : null}
      {legajo && buscado && estado === 'listo' && facturas.length === 0 ? (
        <EstadoVacio mensaje="No hay facturas en ese período." />
      ) : null}

      {legajo && estado === 'listo' && facturas.map((factura) => (
        <View key={factura.id} style={styles.tarjeta}>
          <View style={styles.filaTitulo}>
            <Text style={styles.titulo}>Período {factura.periodo}</Text>
            <Text style={styles.total}>{formatoMoneda(factura.total)}</Text>
          </View>
          <Text style={styles.dato}>Emitida el {formatoFecha(factura.emision)} · vence {formatoFecha(factura.vencimiento)}</Text>
          <Text style={styles.dato}>Estado: {factura.estado} · pagado {formatoMoneda(factura.pagado)}</Text>

          <Text style={styles.subtitulo}>Comprobantes</Text>
          {factura.comprobantes.length === 0 ? (
            <Text style={styles.dato}>Sin comprobantes cargados.</Text>
          ) : (
            factura.comprobantes.map((c) => (
              <View key={c.id} style={styles.fila}>
                <Text style={styles.dato}>{formatoFecha(c.fecha_carga)} · {formatoMoneda(c.importe)}</Text>
                <Text style={styles.dato}>{c.estado}</Text>
              </View>
            ))
          )}
        </View>
      ))}
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
    gap: 6,
  },
  etiqueta: {
    color: '#374151',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  boton: {
    backgroundColor: '#0B3D63',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontWeight: '600',
  },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titulo: {
    color: '#0B3D63',
    fontSize: 16,
    fontWeight: '600',
  },
  total: {
    color: '#0B3D63',
    fontWeight: 'bold',
  },
  subtitulo: {
    color: '#0B3D63',
    fontWeight: '600',
    marginTop: 6,
  },
  dato: {
    color: '#4B5563',
    fontSize: 14,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  error: {
    color: '#B91C1C',
  },
});
