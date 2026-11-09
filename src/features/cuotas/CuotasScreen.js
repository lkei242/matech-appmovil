// Cuotas y deuda por alumno.

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoCargando, EstadoError, EstadoVacio } from '../../components/Estados';
import SelectorAlumno from '../../components/SelectorAlumno';
import { listarAlumnos, listarCuotas, mensajeDeError, obtenerDeuda } from '../../api/pagos';
import { formatoFecha, formatoMoneda } from '../../utils/formato';

const ERROR_CONEXION = 'No se pudo conectar con el servidor.';

export default function CuotasScreen({ route }) {
  const paramLegajo = route?.params?.legajo || null;
  const [alumnos, setAlumnos] = useState([]);
  const [legajo, setLegajo] = useState(paramLegajo);
  const [deuda, setDeuda] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [estado, setEstado] = useState('cargando');
  const [error, setError] = useState('');

  const cargarAlumnos = useCallback(async () => {
    setEstado('cargando');
    try {
      const resp = await listarAlumnos();
      if (!resp.ok) throw new Error(mensajeDeError(resp, 'No se pudieron cargar los alumnos.'));
      const lista = resp.datos || [];
      setAlumnos(lista);
      if (paramLegajo) {
        setLegajo(paramLegajo);
      } else if (lista.length === 1) {
        setLegajo(lista[0].legajo);
      }
      setEstado('listo');
    } catch (e) {
      setError(e.message || ERROR_CONEXION);
      setEstado('error');
    }
  }, [paramLegajo]);

  useEffect(() => {
    cargarAlumnos();
  }, [cargarAlumnos]);

  useEffect(() => {
    if (!legajo) return undefined;
    let vigente = true;
    (async () => {
      setEstado('cargando');
      try {
        const [respDeuda, respCuotas] = await Promise.all([obtenerDeuda(legajo), listarCuotas(legajo)]);
        if (!respDeuda.ok) throw new Error(mensajeDeError(respDeuda, 'No se pudo cargar la deuda.'));
        if (!respCuotas.ok) throw new Error(mensajeDeError(respCuotas, 'No se pudieron cargar las cuotas.'));
        if (vigente) {
          setDeuda(respDeuda.datos);
          setCuotas(respCuotas.datos || []);
          setEstado('listo');
        }
      } catch (e) {
        if (vigente) {
          setError(e.message || ERROR_CONEXION);
          setEstado('error');
        }
      }
    })();
    return () => {
      vigente = false;
    };
  }, [legajo]);

  if (estado === 'error' && alumnos.length === 0) {
    return <EstadoError mensaje={error} onReintentar={cargarAlumnos} />;
  }
  if (estado === 'cargando' && alumnos.length === 0) {
    return <EstadoCargando />;
  }
  if (alumnos.length === 0) {
    return <EstadoVacio mensaje="No hay alumnos asociados a tu cuenta." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <SelectorAlumno alumnos={alumnos} seleccionado={legajo} onSeleccionar={setLegajo} />

      {!legajo ? <EstadoVacio mensaje="Elegí un alumno para ver su deuda." /> : null}
      {legajo && estado === 'cargando' ? <EstadoCargando /> : null}
      {legajo && estado === 'error' ? <EstadoError mensaje={error} /> : null}

      {legajo && estado === 'listo' && deuda ? (
        <>
          <View style={styles.tarjeta}>
            <Text style={styles.etiqueta}>Deuda total</Text>
            <Text style={styles.total}>{formatoMoneda(deuda.total_deuda)}</Text>
          </View>

          {deuda.facturas.length === 0 ? (
            <EstadoVacio mensaje="No tiene facturas con saldo pendiente." />
          ) : (
            deuda.facturas.map((factura) => (
              <View key={factura.id} style={styles.tarjeta}>
                <View style={styles.filaTitulo}>
                  <Text style={styles.titulo}>Período {factura.periodo}</Text>
                  <Text style={styles.saldo}>{formatoMoneda(factura.saldo)}</Text>
                </View>
                <Text style={styles.dato}>Vence el {formatoFecha(factura.vencimiento)}</Text>
                {factura.items.map((item) => (
                  <View key={item.id} style={styles.fila}>
                    <Text style={styles.item}>{item.descripcion}</Text>
                    <Text style={styles.item}>{formatoMoneda(item.importe)}</Text>
                  </View>
                ))}
              </View>
            ))
          )}

          <Text style={styles.seccion}>Cuotas</Text>
          {cuotas.length === 0 ? (
            <EstadoVacio mensaje="Todavía no hay cuotas registradas." />
          ) : (
            cuotas.map((cuota) => (
              <View key={cuota.id} style={styles.tarjeta}>
                <View style={styles.filaTitulo}>
                  <Text style={styles.titulo}>{cuota.periodo}</Text>
                  <Text style={styles.saldo}>{formatoMoneda(cuota.monto)}</Text>
                </View>
                <Text style={styles.dato}>Estado: {cuota.estado}</Text>
                <Text style={styles.dato}>Vencimiento: {formatoFecha(cuota.fecha_vencimiento)}</Text>
                <Text style={styles.dato}>Pago: {formatoFecha(cuota.fecha_pago)}</Text>
              </View>
            ))
          )}
        </>
      ) : null}
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
    color: '#6B7280',
    fontSize: 14,
  },
  total: {
    color: '#0B3D63',
    fontSize: 26,
    fontWeight: 'bold',
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
  saldo: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  dato: {
    color: '#4B5563',
    fontSize: 14,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  item: {
    color: '#374151',
    fontSize: 14,
  },
  seccion: {
    color: '#0B3D63',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
