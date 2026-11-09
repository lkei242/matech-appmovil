// Cuotas y deuda por alumno (RF-M03 y RF-M06).

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EstadoCargando, EstadoError, EstadoVacio } from '../../components/Estados';
import SelectorAlumno from '../../components/SelectorAlumno';
import { Icono, Insignia, Pantalla, Seccion, Tarjeta } from '../../components/ui';
import { colores, radio } from '../../theme';
import { listarAlumnos, listarCuotas, mensajeDeError, obtenerDeuda } from '../../api/pagos';
import { formatoFecha, formatoMoneda } from '../../utils/formato';

const ERROR_CONEXION = 'No se pudo conectar con el servidor.';

export default function CuotasScreen() {
  const [alumnos, setAlumnos] = useState([]);
  const [legajo, setLegajo] = useState(null);
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
      if (lista.length === 1) setLegajo(lista[0].legajo);
      setEstado('listo');
    } catch (e) {
      setError(e.message || ERROR_CONEXION);
      setEstado('error');
    }
  }, []);

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
    <Pantalla>
      <SelectorAlumno alumnos={alumnos} seleccionado={legajo} onSeleccionar={setLegajo} />

      {!legajo ? <EstadoVacio mensaje="Elegí un alumno para ver su deuda." icono="people-outline" /> : null}
      {legajo && estado === 'cargando' ? <EstadoCargando /> : null}
      {legajo && estado === 'error' ? <EstadoError mensaje={error} /> : null}

      {legajo && estado === 'listo' && deuda ? (
        <>
          <View style={[styles.resumen, Number(deuda.total_deuda) > 0 ? styles.resumenDeuda : styles.resumenAlDia]}>
            <Text style={styles.resumenEtiqueta}>Deuda total</Text>
            <Text style={styles.resumenMonto}>{formatoMoneda(deuda.total_deuda)}</Text>
            {Number(deuda.total_deuda) > 0 ? (
              <Insignia texto="Tenés saldo pendiente" tono="naranja" />
            ) : (
              <Insignia texto="Estás al día" tono="verde" />
            )}
          </View>

          <Seccion texto="Facturas con saldo" />
          {deuda.facturas.length === 0 ? (
            <EstadoVacio mensaje="No tiene facturas con saldo pendiente." icono="checkmark-circle-outline" />
          ) : (
            deuda.facturas.map((factura) => (
              <Tarjeta key={factura.id}>
                <View style={styles.filaTitulo}>
                  <Text style={styles.titulo}>Período {factura.periodo}</Text>
                  <Text style={styles.saldo}>{formatoMoneda(factura.saldo)}</Text>
                </View>
                <View style={styles.vence}>
                  <Icono nombre="calendar-outline" tamano={16} color={colores.suave} />
                  <Text style={styles.dato}>Vence el {formatoFecha(factura.vencimiento)}</Text>
                </View>
                <View style={styles.items}>
                  {factura.items.map((item) => (
                    <View key={item.id} style={styles.fila}>
                      <Text style={[styles.item, styles.itemTexto]}>{item.descripcion}</Text>
                      <Text style={styles.itemMonto}>{formatoMoneda(item.importe)}</Text>
                    </View>
                  ))}
                </View>
              </Tarjeta>
            ))
          )}

          <Seccion texto="Cuotas" />
          {cuotas.length === 0 ? (
            <EstadoVacio mensaje="Todavía no hay cuotas registradas." />
          ) : (
            cuotas.map((cuota) => (
              <Tarjeta key={cuota.id}>
                <View style={styles.filaTitulo}>
                  <Text style={styles.titulo}>{cuota.periodo}</Text>
                  <Text style={styles.monto}>{formatoMoneda(cuota.monto)}</Text>
                </View>
                <Insignia texto={cuota.estado} tono={tonoEstado(cuota.estado)} />
                <View style={styles.fechas}>
                  <Text style={styles.dato}>Vencimiento: {formatoFecha(cuota.fecha_vencimiento)}</Text>
                  <Text style={styles.dato}>Pago: {formatoFecha(cuota.fecha_pago)}</Text>
                </View>
              </Tarjeta>
            ))
          )}
        </>
      ) : null}
    </Pantalla>
  );
}

// Color de la insignia según el estado de la cuota.
function tonoEstado(estado) {
  const e = String(estado || '').toLowerCase();
  if (e.includes('pag')) return 'verde';
  if (e.includes('venc') || e.includes('mora')) return 'rosa';
  return 'naranja';
}

const styles = StyleSheet.create({
  resumen: {
    borderRadius: radio.lg,
    padding: 20,
    gap: 6,
    borderWidth: 1,
  },
  resumenDeuda: {
    backgroundColor: colores.naranjaSuave,
    borderColor: '#F7CDBF',
  },
  resumenAlDia: {
    backgroundColor: colores.verdeSuave,
    borderColor: '#DCEBC6',
  },
  resumenEtiqueta: {
    color: colores.suave,
    fontSize: 14,
    fontWeight: '600',
  },
  resumenMonto: {
    color: colores.tinta,
    fontSize: 34,
    fontWeight: '800',
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
  saldo: {
    color: colores.naranjaTexto,
    fontSize: 17,
    fontWeight: '800',
  },
  monto: {
    color: colores.tinta,
    fontSize: 17,
    fontWeight: '800',
  },
  vence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dato: {
    color: colores.suave,
    fontSize: 14,
  },
  fechas: {
    gap: 2,
    marginTop: 2,
  },
  items: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.borde,
    gap: 6,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  item: {
    color: colores.texto,
    fontSize: 14,
  },
  itemTexto: {
    flex: 1,
  },
  itemMonto: {
    color: colores.tinta,
    fontSize: 14,
    fontWeight: '600',
  },
});
