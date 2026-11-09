// Pago móvil: elegir alumno y factura, elegir ítems, pedir la solicitud de pago
// y después cargar el comprobante de la transferencia.
//
// El total que se muestra es solo una vista previa: el servidor lo recalcula y es el que vale.
// Nada aparece como acreditado hasta que la administración aprueba el comprobante.

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { EstadoCargando, EstadoError, EstadoVacio } from '../../components/Estados';
import SelectorAlumno from '../../components/SelectorAlumno';
import {
  crearSolicitudPago,
  listarAlumnos,
  listarFacturas,
  mensajeDeError,
  nuevaClaveIdempotencia,
  obtenerFactura,
} from '../../api/pagos';
import { formatoFecha, formatoMoneda } from '../../utils/formato';

export default function PagarScreen({ navigation }) {
  const [alumnos, setAlumnos] = useState([]);
  const [legajo, setLegajo] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [factura, setFactura] = useState(null);
  const [seleccion, setSeleccion] = useState({});
  const [solicitud, setSolicitud] = useState(null);
  const [estado, setEstado] = useState('cargando');
  const [error, setError] = useState('');
  // La misma clave se reutiliza en los reintentos: así no se crean pagos duplicados.
  const claveRef = useRef(null);

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

  useEffect(() => {
    if (!legajo) return;
    setFactura(null);
    setSolicitud(null);
    (async () => {
      setEstado('cargando');
      try {
        const resp = await listarFacturas({ alumno: legajo });
        if (!resp.ok) throw new Error(mensajeDeError(resp, 'No se pudieron cargar las facturas.'));
        setFacturas((resp.datos || []).filter((f) => f.estado !== 'Pagada' && Number(f.saldo) > 0));
        setEstado('listo');
      } catch (e) {
        setError(e.message || 'No se pudo conectar con el servidor.');
        setEstado('error');
      }
    })();
  }, [legajo]);

  async function elegirFactura(id) {
    setSolicitud(null);
    claveRef.current = null;
    try {
      const resp = await obtenerFactura(id);
      if (!resp.ok) throw new Error(mensajeDeError(resp, 'No se pudo cargar la factura.'));
      setFactura(resp.datos);
      // Por defecto se seleccionan todos los ítems de la factura.
      setSeleccion(Object.fromEntries(resp.datos.items.map((i) => [i.id, true])));
    } catch (e) {
      setError(e.message || 'No se pudo conectar con el servidor.');
    }
  }

  function alternarItem(id) {
    setSeleccion((previa) => ({ ...previa, [id]: !previa[id] }));
  }

  const itemsElegidos = factura ? factura.items.filter((i) => seleccion[i.id]) : [];
  const totalVistaPrevia = itemsElegidos.reduce((suma, i) => suma + Number(i.importe), 0);

  async function generarSolicitud() {
    setError('');
    if (itemsElegidos.length === 0) {
      setError('Elegí al menos un ítem para pagar.');
      return;
    }
    if (!claveRef.current) claveRef.current = nuevaClaveIdempotencia();

    setEstado('enviando');
    try {
      const resp = await crearSolicitudPago({
        factura: factura.id,
        items: itemsElegidos.map((i) => i.id),
        clave: claveRef.current,
      });
      if (!resp.ok) throw new Error(mensajeDeError(resp, 'No se pudo generar la solicitud de pago.'));
      setSolicitud(resp.datos);
      claveRef.current = null;
    } catch (e) {
      setError(e.message || 'No se pudo conectar con el servidor. Podés reintentar sin duplicar el pago.');
    } finally {
      setEstado('listo');
    }
  }

  if (estado === 'error' && alumnos.length === 0) {
    return <EstadoError mensaje={error} />;
  }
  if (estado === 'cargando' && alumnos.length === 0) {
    return <EstadoCargando />;
  }
  if (alumnos.length === 0) {
    return <EstadoVacio mensaje="No hay alumnos asociados a tu cuenta." />;
  }

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Text style={styles.paso}>1. Alumno</Text>
      <SelectorAlumno alumnos={alumnos} seleccionado={legajo} onSeleccionar={setLegajo} />

      {legajo && estado === 'cargando' ? <EstadoCargando /> : null}
      {legajo && estado === 'listo' && facturas.length === 0 ? (
        <EstadoVacio mensaje="No hay facturas con saldo pendiente para este alumno." />
      ) : null}

      {legajo && facturas.length > 0 ? (
        <>
          <Text style={styles.paso}>2. Factura</Text>
          {facturas.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => elegirFactura(f.id)}
              style={[styles.tarjeta, factura && factura.id === f.id && styles.tarjetaActiva]}
              accessibilityRole="button"
            >
              <Text style={styles.titulo}>Período {f.periodo}</Text>
              <Text style={styles.dato}>Saldo {formatoMoneda(f.saldo)} · vence {formatoFecha(f.vencimiento)}</Text>
            </Pressable>
          ))}
        </>
      ) : null}

      {factura ? (
        <>
          <Text style={styles.paso}>3. Qué querés pagar</Text>
          <View style={styles.tarjeta}>
            {factura.items.map((item) => (
              <Pressable key={item.id} onPress={() => alternarItem(item.id)} style={styles.fila} accessibilityRole="checkbox" accessibilityState={{ checked: !!seleccion[item.id] }}>
                <Text style={styles.item}>{seleccion[item.id] ? '☑' : '☐'} {item.descripcion}</Text>
                <Text style={styles.item}>{formatoMoneda(item.importe)}</Text>
              </Pressable>
            ))}
            <View style={styles.filaTotal}>
              <Text style={styles.titulo}>Total a pagar</Text>
              <Text style={styles.total}>{formatoMoneda(totalVistaPrevia)}</Text>
            </View>
            <Text style={styles.nota}>El total final lo confirma el servidor al generar la solicitud.</Text>
          </View>

          {!solicitud ? (
            <TouchableOpacity
              style={[styles.boton, estado === 'enviando' && styles.botonDeshabilitado]}
              onPress={generarSolicitud}
              disabled={estado === 'enviando'}
            >
              <Text style={styles.botonTexto}>{estado === 'enviando' ? 'Generando…' : 'Generar solicitud de pago'}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.tarjeta}>
              <Text style={styles.titulo}>Solicitud N.º {solicitud.id}</Text>
              <Text style={styles.total}>{formatoMoneda(solicitud.total)}</Text>
              <Text style={styles.nota}>{solicitud.aviso}</Text>
              <TouchableOpacity
                style={styles.boton}
                onPress={() => navigation.navigate('Comprobante', { factura: factura.id, total: solicitud.total })}
              >
                <Text style={styles.botonTexto}>Cargar comprobante de transferencia</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: {
    padding: 16,
    gap: 12,
    backgroundColor: '#F3F6FA',
  },
  paso: {
    color: '#0B3D63',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
  },
  tarjeta: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tarjetaActiva: {
    borderColor: '#0B3D63',
  },
  titulo: {
    color: '#0B3D63',
    fontSize: 16,
    fontWeight: '600',
  },
  dato: {
    color: '#4B5563',
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  item: {
    color: '#374151',
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  total: {
    color: '#0B3D63',
    fontSize: 22,
    fontWeight: 'bold',
  },
  nota: {
    color: '#6B7280',
    fontSize: 13,
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
});
