// Pago móvil (RF-M04): elegir alumno y factura, elegir ítems, pedir la solicitud de pago
// y después cargar el comprobante de la transferencia.
//
// El total que se muestra es solo una vista previa: el servidor lo recalcula y es el que vale.
// Nada aparece como acreditado hasta que la administración aprueba el comprobante.

import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { EstadoCargando, EstadoError, EstadoVacio } from '../../components/Estados';
import SelectorAlumno from '../../components/SelectorAlumno';
import { Aviso, Boton, Icono, Pantalla, Tarjeta } from '../../components/ui';
import { colores } from '../../theme';
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
    <Pantalla>
      <Paso numero={1} titulo="Alumno" />
      <SelectorAlumno alumnos={alumnos} seleccionado={legajo} onSeleccionar={setLegajo} />

      {legajo && estado === 'cargando' ? <EstadoCargando /> : null}
      {legajo && estado === 'listo' && facturas.length === 0 ? (
        <EstadoVacio mensaje="No hay facturas con saldo pendiente para este alumno." icono="checkmark-circle-outline" />
      ) : null}

      {legajo && facturas.length > 0 ? (
        <>
          <Paso numero={2} titulo="Factura" />
          {facturas.map((f) => {
            const activa = factura && factura.id === f.id;
            return (
              <Tarjeta key={f.id} onPress={() => elegirFactura(f.id)} acento={activa ? colores.azul : undefined}>
                <View style={styles.filaFactura}>
                  <View style={styles.facturaTextos}>
                    <Text style={styles.titulo}>Período {f.periodo}</Text>
                    <Text style={styles.dato}>Saldo {formatoMoneda(f.saldo)} · vence {formatoFecha(f.vencimiento)}</Text>
                  </View>
                  <Icono
                    nombre={activa ? 'radio-button-on' : 'radio-button-off'}
                    tamano={24}
                    color={activa ? colores.azul : colores.suave}
                  />
                </View>
              </Tarjeta>
            );
          })}
        </>
      ) : null}

      {factura ? (
        <>
          <Paso numero={3} titulo="Qué querés pagar" />
          <Tarjeta>
            {factura.items.map((item) => {
              const marcado = !!seleccion[item.id];
              return (
                <Pressable
                  key={item.id}
                  onPress={() => alternarItem(item.id)}
                  style={styles.fila}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: marcado }}
                >
                  <Icono
                    nombre={marcado ? 'checkbox' : 'square-outline'}
                    tamano={24}
                    color={marcado ? colores.azul : colores.suave}
                  />
                  <Text style={[styles.item, styles.itemTexto]}>{item.descripcion}</Text>
                  <Text style={styles.itemMonto}>{formatoMoneda(item.importe)}</Text>
                </Pressable>
              );
            })}
            <View style={styles.filaTotal}>
              <Text style={styles.titulo}>Total a pagar</Text>
              <Text style={styles.total}>{formatoMoneda(totalVistaPrevia)}</Text>
            </View>
            <Text style={styles.nota}>El total final lo confirma el servidor al generar la solicitud.</Text>
          </Tarjeta>

          {!solicitud ? (
            <Boton
              texto={estado === 'enviando' ? 'Generando…' : 'Generar solicitud de pago'}
              variante="accion"
              icono="receipt-outline"
              onPress={generarSolicitud}
              deshabilitado={estado === 'enviando'}
            />
          ) : (
            <Tarjeta acento={colores.verde}>
              <View style={styles.filaFactura}>
                <Icono nombre="checkmark-circle" tamano={22} color={colores.verdeTexto} />
                <Text style={[styles.titulo, styles.facturaTextos]}>Solicitud N.º {solicitud.id}</Text>
              </View>
              <Text style={styles.total}>{formatoMoneda(solicitud.total)}</Text>
              <Text style={styles.nota}>{solicitud.aviso}</Text>
              <Boton
                texto="Cargar comprobante de transferencia"
                icono="cloud-upload-outline"
                onPress={() => navigation.navigate('Comprobante', { factura: factura.id, total: solicitud.total })}
              />
            </Tarjeta>
          )}
        </>
      ) : null}

      {error ? <Aviso texto={error} tono="rosa" /> : null}
    </Pantalla>
  );
}

// Encabezado numerado de cada paso del pago.
function Paso({ numero, titulo }) {
  return (
    <View style={styles.paso}>
      <View style={styles.pasoNumero}>
        <Text style={styles.pasoNumeroTexto}>{numero}</Text>
      </View>
      <Text style={styles.pasoTitulo}>{titulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  paso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  pasoNumero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colores.azul,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasoNumeroTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pasoTitulo: {
    color: colores.tinta,
    fontSize: 18,
    fontWeight: '800',
  },
  filaFactura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  facturaTextos: {
    flex: 1,
  },
  titulo: {
    color: colores.tinta,
    fontSize: 16,
    fontWeight: '700',
  },
  dato: {
    color: colores.suave,
    fontSize: 14,
    marginTop: 2,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  item: {
    color: colores.texto,
    fontSize: 15,
  },
  itemTexto: {
    flex: 1,
  },
  itemMonto: {
    color: colores.tinta,
    fontSize: 15,
    fontWeight: '700',
  },
  filaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colores.borde,
    paddingTop: 12,
    marginTop: 4,
  },
  total: {
    color: colores.tinta,
    fontSize: 24,
    fontWeight: '800',
  },
  nota: {
    color: colores.suave,
    fontSize: 13,
    lineHeight: 18,
  },
});
