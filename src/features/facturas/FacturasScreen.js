// Facturas y comprobantes por alumno y período.

import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EstadoCargando, EstadoError, EstadoVacio } from '../../components/Estados';
import SelectorAlumno from '../../components/SelectorAlumno';
import { Aviso, Boton, Campo, Insignia, Pantalla, Tarjeta } from '../../components/ui';
import { colores } from '../../theme';
import { listarAlumnos, listarFacturas, mensajeDeError } from '../../api/pagos';
import { formatoFecha, formatoMoneda } from '../../utils/formato';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export default function FacturasScreen({ route }) {
  const paramLegajo = route?.params?.legajo || null;
  const [alumnos, setAlumnos] = useState([]);
  const [legajo, setLegajo] = useState(paramLegajo);
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
        if (paramLegajo) {
          setLegajo(paramLegajo);
        } else if (lista.length === 1) {
          setLegajo(lista[0].legajo);
        }
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
    <Pantalla>
      <SelectorAlumno alumnos={alumnos} seleccionado={legajo} onSeleccionar={setLegajo} />

      <Tarjeta>
        <Text style={styles.etiqueta}>Período (opcional)</Text>
        <Campo value={desde} onChangeText={setDesde} placeholder="Desde: AAAA-MM-DD" autoCapitalize="none" />
        <Campo value={hasta} onChangeText={setHasta} placeholder="Hasta: AAAA-MM-DD" autoCapitalize="none" />
        <Boton texto="Buscar" icono="search" onPress={buscar} deshabilitado={!legajo} />
        {error ? <Aviso texto={error} tono="rosa" /> : null}
      </Tarjeta>

      {!legajo ? <EstadoVacio mensaje="Elegí un alumno para ver sus facturas." icono="people-outline" /> : null}
      {legajo && estado === 'cargando' ? <EstadoCargando /> : null}
      {legajo && buscado && estado === 'listo' && facturas.length === 0 ? (
        <EstadoVacio mensaje="No hay facturas en ese período." />
      ) : null}

      {legajo && estado === 'listo' && facturas.map((factura) => (
        <Tarjeta key={factura.id}>
          <View style={styles.filaTitulo}>
            <Text style={styles.titulo}>Período {factura.periodo}</Text>
            <Text style={styles.total}>{formatoMoneda(factura.total)}</Text>
          </View>
          <Insignia texto={factura.estado} tono={tonoEstado(factura.estado)} />
          <Text style={styles.dato}>Emitida el {formatoFecha(factura.emision)} · vence {formatoFecha(factura.vencimiento)}</Text>
          <Text style={styles.dato}>Pagado {formatoMoneda(factura.pagado)}</Text>

          <View style={styles.comprobantes}>
            <Text style={styles.subtitulo}>Comprobantes</Text>
            {factura.comprobantes.length === 0 ? (
              <Text style={styles.dato}>Sin comprobantes cargados.</Text>
            ) : (
              factura.comprobantes.map((c) => (
                <View key={c.id} style={styles.fila}>
                  <Text style={[styles.dato, styles.filaTexto]}>{formatoFecha(c.fecha_carga)} · {formatoMoneda(c.importe)}</Text>
                  <Insignia texto={c.estado} tono={tonoEstado(c.estado)} />
                </View>
              ))
            )}
          </View>
        </Tarjeta>
      ))}
    </Pantalla>
  );
}

// Color de la insignia según el estado (factura o comprobante).
function tonoEstado(estado) {
  const e = String(estado || '').toLowerCase();
  if (e.includes('pag') || e.includes('aprob')) return 'verde';
  if (e.includes('rechaz') || e.includes('venc')) return 'rosa';
  return 'naranja';
}

const styles = StyleSheet.create({
  etiqueta: {
    color: colores.tinta,
    fontSize: 15,
    fontWeight: '700',
  },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  titulo: {
    flexShrink: 1,
    color: colores.tinta,
    fontSize: 17,
    fontWeight: '700',
  },
  total: {
    color: colores.tinta,
    fontSize: 17,
    fontWeight: '800',
  },
  dato: {
    color: colores.suave,
    fontSize: 14,
  },
  comprobantes: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.borde,
    gap: 8,
  },
  subtitulo: {
    color: colores.tinta,
    fontSize: 14,
    fontWeight: '700',
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  filaTexto: {
    flex: 1,
  },
});
