# Guía de desarrollo de Matech App Móvil

> Guía viva para desarrollar e integrar la aplicación móvil del Centro Educativo “Educar para Transformar”. Se basa en el Plan de Trabajo de la Parte 3 y se contrasta con el frontend y la API que existen en el repositorio al momento de redactarla. Las decisiones marcadas como pendientes deben confirmarse con el equipo antes de inventar contratos o reglas.

## 1. Propósito y alcance

La aplicación amplía el sistema web académico y administrativo existente. Debe facilitar desde el celular la consulta de cuotas, facturas, pagos y servicios, y mostrar solo las funciones que correspondan al rol de la persona autenticada.

La web Django y su base de datos compartida son la fuente de verdad. La app consume la API REST JSON del backend; nunca debe conectarse directamente a PostgreSQL/SQLite ni guardar una copia independiente de los datos operativos.

### Objetivos

- Reutilizar los usuarios y datos existentes y evitar duplicaciones entre web y móvil.
- Permitir acceso seguro con JWT sobre HTTPS y autorización por rol.
- Mantener disponibles sin conexión algunos datos previamente sincronizados.
- Validar los formularios en la app para orientar a la persona y volver a validar las reglas de negocio en el servidor.
- Mantener módulos independientes, componentes reutilizables y errores consistentes.

### Fuera del alcance móvil indicado por el plan

- Los reportes de ingresos y pagos se consultan desde la aplicación web administrativa.
- El envío de recordatorios y avisos de deuda es responsabilidad del backend y su servicio de correo; la app no debe enviar correos ni contener credenciales SMTP.
- Los pagos se hacen por transferencia bancaria. El plan no incluye cobro con tarjeta ni pagos en efectivo.

## 2. Estado actual del repositorio

La app existente usa Expo, React Native con JavaScript, React Navigation y un backend Django. El proyecto fue actualizado a Expo SDK 58; las dependencias deben mantenerse alineadas con ese SDK mediante `npx expo install`.

| Archivo actual | Responsabilidad actual |
| --- | --- |
| `App.js` | Inicializa `AuthProvider` y selecciona Login o Dashboard según la sesión. |
| `src/api.js` | Define la URL base y las llamadas HTTP para login, logout y recuperación de contraseña. |
| `src/auth/AuthContext.js` | Restaura la sesión desde AsyncStorage y expone login/logout. |
| `src/screens/LoginScreen.js` | Inicio de sesión y recuperación de contraseña. |
| `src/screens/DashboardScreen.js` | Pantalla provisional común a los roles; las funciones del rol todavía están en desarrollo. |
| `.env.local` | Configuración local, incluida `EXPO_PUBLIC_API_URL`; no versionar este archivo. |

El frontend ya llama los tres flujos de autenticación, pero todavía no implementa los módulos de cuotas/pagos, facturas, comprobantes, servicios, perfil editable ni caché y sincronización offline. Aunque el backend ya expone `perfil` y `login/refresh`, el cliente todavía no los utiliza.

## 3. Roles y permisos

La interfaz debe resolver sus módulos a partir del rol que devuelve la API. Los permisos del cliente solo controlan lo que se muestra: cada endpoint debe volver a verificar autenticación, rol y pertenencia de los datos en el backend.

| Función | Tutor (`padre`) | Alumno | Admin (`administrativo`) | Docente | Preceptor | Directivo |
| --- | --- | --- | --- | --- | --- | --- |
| Login y logout; recuperar/cambiar contraseña | Sí | Sí | Sí | Sí | Sí | Sí |
| Consultar cuotas/facturas | Sí, de sus hijos | Parcial, propias | Sí | No | No | Sí |
| Seleccionar ítems y pagar | Sí | No | No | No | No | No |
| Cargar comprobante | Sí | No | No | No | No | No |
| Consulta offline | Sí | Sí | Sí | Sí | Sí | Sí |
| Configurar valores | No | No | Sí | No | No | No |
| Consultar reportes de pagos/ingresos en web | No | No | Sí | No | No | Sí |
| Inscripción a deportes/transporte/comedor | Sí | Sí | Sí | No | No | Sí |

El nombre “Administrador” del plan se representa hoy como `administrativo`, y “Tutor” como `padre`. Mantener esa normalización en un único módulo de permisos/etiquetas; no comparar roles de forma distinta en cada pantalla. El alumno solo puede ver su propia información y el tutor únicamente la de sus hijos asociados. Hay una diferencia interna en el plan: RF-M16 nombra al alumno/tutor como actores de inscripción, mientras que la matriz también concede esa función a administrativo y directivo. Confirmar con el equipo cuál regla prevalece y reflejarla en el contrato de API antes de habilitar esos botones.

## 4. Requerimientos funcionales del plan

Usar estos IDs para nombrar tareas, revisiones y criterios de aceptación. Los IDs preservan la trazabilidad del plan (RF-M01 a RF-M18).

| ID | Función que debe cubrir la app o integración |
| --- | --- |
| RF-M01 | Iniciar/cerrar sesión y recuperar o cambiar contraseña, para usuarios registrados. |
| RF-M02 | Mostrar funciones según el rol autenticado. |
| RF-M03 | Consultar cuotas por alumno: pendientes, pagadas, vencimientos, importe, estado e historial. |
| RF-M04 | Elegir conceptos a pagar y emitir una constancia/comprobante con el total. |
| RF-M05 | Cargar comprobante de transferencia y asociarlo a una factura; se admiten varios comprobantes por factura. |
| RF-M06 | Consultar deuda desglosada por cuota, deportes, transporte y comedor. |
| RF-M07 | Filtrar facturas y comprobantes por alumno y período. |
| RF-M08 | Enviar al tutor, por correo, el recordatorio de pago del último día hábil, con desglose y factura adjunta. |
| RF-M09 | Enviar el día 20 el aviso de deuda a tutores con pago incompleto. |
| RF-M10 | Reportar ingresos por período desde la web administrativa. |
| RF-M11 | Listar pagos completos por período, año y alumno desde la web. |
| RF-M12 | Listar pagos incompletos por período, año y alumno desde la web. |
| RF-M13 | Reportar pagos por deporte, nivel, horario y docente a cargo desde la web. |
| RF-M14 | Reportar pagos por recorrido de transporte desde la web. |
| RF-M15 | Permitir al administrador definir y actualizar valores de cuota, deportes, transporte y comedor. |
| RF-M16 | Inscribir alumno/tutor a hasta dos deportes, un recorrido de transporte y comedor; evitar duplicados y conflictos de horario. |
| RF-M17 | Consultar offline datos previamente cargados de cuotas, facturas, horarios y comunicados, y sincronizar al reconectar. |
| RF-M18 | Consultar y actualizar email y teléfono del perfil. |

La matriz de permisos y los casos de uso completos están definidos en el plan fuente. Si el equipo cambia algún actor o canal (por ejemplo, dónde se configura un arancel), actualizar primero el contrato y esta guía.

## 5. Reglas de negocio que no se deben duplicar en el cliente

- Una persona tutora puede tener uno o más hijos asociados y solo acceder a ellos.
- Cada alumno pertenece a un curso y cada curso a un nivel.
- Un alumno puede tener como máximo dos deportes simultáneos. Cada deporte tiene docente responsable y grupos por nivel/horario; no se permiten choques de horario.
- El transporte es opcional, tiene cuatro recorridos y puede cambiar mes a mes. Deportes y recorridos tienen valores diferenciados.
- Evitar inscripciones duplicadas y solicitudes de pago duplicadas.
- No hay pago en efectivo: solo transferencia bancaria. Asociar el comprobante a la factura correcta.
- El backend calcula y confirma importes, vencimientos, permisos y estados; los totales mostrados por la app son una vista previa, no una autorización de pago.
- El aviso de deuda se programa para el día 20; el recordatorio se programa para el último día hábil. El backend debe registrar envíos y reintentos.

## 6. Arquitectura y responsabilidades

Mantener las capas desacopladas y seguir la tecnología que ya usa este repositorio (React Native + JavaScript + React Navigation). No migrar a Expo Router ni incorporar otro framework sin una decisión explícita del equipo.

1. **Presentación:** pantallas, componentes accesibles, navegación y validaciones de entrada que ayuden a completar formularios.
2. **Estado y dominio del cliente:** contexto/hooks y casos de uso pequeños; aquí se coordina UI, estado de sesión y caché, sin reglas autoritativas de negocio.
3. **Servicios/repositorios:** centralizan solicitudes, serialización, autenticación, normalización de errores y caché por módulo.
4. **Backend Django REST:** autoriza, valida reglas, calcula importes, persiste y sirve datos. Es la fuente de verdad.
5. **Base de datos:** PostgreSQL en producción o SQLite en desarrollo, accedida solamente por Django/ORM.

Estructura sugerida al crecer (migrar gradualmente, sin mover los archivos actuales hasta tener cambios revisables):

```text
src/
  api/                 cliente HTTP, configuración y errores
  auth/                sesión, token, permisos y renovación
  navigation/          navegación por sesión/rol
  components/          componentes compartidos
  features/
    cuotas/
    pagos/
    facturas/
    servicios/
    perfil/
    offline/
  screens/             pantallas actuales y nuevas
```

Aplicar responsabilidad única, evitar duplicar componentes y centralizar los nombres de rol, formato de moneda/fecha y estados de carga/error/vacío.

## 7. Conexión con la API

### Configuración de URL

El cliente usa `EXPO_PUBLIC_API_URL` como URL base completa, normalmente terminada en `/api/` (por ejemplo, `https://<dominio-del-backend>/api/`). En desarrollo se permite la detección de la IP del servidor Metro y el fallback local que ya existe en `src/api.js`. No imprimir tokens ni datos sensibles en logs o pantallas.

En dispositivo físico, `localhost` apunta al propio teléfono; usar una URL accesible desde la red local para Django. En producción usar HTTPS. Las variables `EXPO_PUBLIC_*` se incorporan al bundle del cliente: son para configuración pública, nunca para secretos.

### Endpoints que existen hoy en Django

La raíz de API es `/api/`. Las rutas y contratos se confirmaron en `api/urls.py` y `api/views.py` del backend del proyecto.

| Método y ruta | Autenticación | Contrato/estado |
| --- | --- | --- |
| `POST /api/login/` | Pública | Recibe `{ "usuario": "…", "password": "…" }` (también acepta `correo` en lugar de `usuario`). Devuelve `access`, `refresh`, `usuario`, `correo`, `rol`, `dashboard_url` y `persona`. Usado por la app. |
| `POST /api/login/refresh/` | Pública + refresh válido en body | Recibe `{ "refresh": "…" }`; devuelve `{ "access": "…" }`. Existe en backend, pendiente de conectar desde cliente. |
| `POST /api/logout/` | Pública + refresh opcional en body | Recibe `{ "refresh": "…" }` e intenta invalidarlo. Usado por la app. |
| `POST /api/recuperar-contrasena/` | Pública | Recibe `{ "correo": "…" }` (acepta `usuario`); devuelve `mensaje` o `error`. Usado por la app. |
| `GET /api/perfil/` | JWT `Bearer` | Devuelve datos de cuenta, rol, `dashboard_url` y `persona`. Existe en backend, pendiente de conectar desde cliente. |

Los errores actuales usan en general `{ "error": "…" }` con estado HTTP; contemplar respuestas no JSON y fallas de red. El cliente HTTP debe adjuntar `Authorization: Bearer <access>` a endpoints protegidos, renovar una vez al recibir 401 y cerrar sesión si la renovación falla. El logout debe borrar el estado local aunque la red no esté disponible.

### Endpoints de los módulos funcionales

El plan requiere recursos de cuotas, facturas, pagos/comprobantes, deportes, recorridos, comedor, perfil y datos offline, pero las rutas de esos módulos **no están presentes todavía** en `api/urls.py`. No adivinar URLs, nombres de campos ni estados. Antes de conectar una pantalla:

1. Definir contrato OpenAPI/Swagger junto con backend: método, ruta, parámetros, paginación, campos, formatos, permisos, errores y ejemplos.
2. Acordar IDs estables de alumno/factura/servicio y cómo se valida la relación tutor-alumno.
3. Acordar carga multipart del comprobante, formatos/tamaño permitidos y respuesta de moderación/estado.
4. Acordar idempotencia o mecanismo equivalente para no duplicar pagos/inscripciones al reintentar.
5. Publicar mocks/fixtures basados en el contrato para que frontend y backend puedan avanzar en paralelo.

No realizar SQL desde React Native. La API debe ser la única conexión de la app con los datos institucionales.

## 8. Seguridad y datos personales

- HTTPS obligatorio fuera del entorno local; nunca desactivar la validación TLS.
- No guardar contraseñas. Limpiar campos sensibles después del flujo cuando corresponda.
- El plan requiere JWT y contraseñas hasheadas. El backend actual todavía acepta comparación con contraseña en texto plano y el flujo de recuperación genera una contraseña que persiste sin hash antes de enviarla por correo. Corregir y validar esto en backend antes de producción; la app no puede compensarlo.
- La sesión actual se guarda en AsyncStorage. Antes de producción, evaluar migrar tokens a `expo-secure-store`; no guardar JWT junto con caché ordinaria si se puede evitar.
- El servidor, no solo la navegación móvil, debe comprobar roles y pertenencia del alumno a un tutor en cada operación.
- No incluir secretos en `.env.local` con prefijo `EXPO_PUBLIC_`, en el bundle, repositorio, errores ni bitácora. No registrar documentos o datos de alumnos en telemetría.
- Para recuperación, evitar revelar si una cuenta existe en la interfaz. El backend debe aplicar respuestas seguras, límites y expiración al flujo.

## 9. Offline y sincronización

El requerimiento offline es para **consulta de información previamente sincronizada**: cuotas, facturas, horarios y comunicados. AsyncStorage hoy solo persiste la sesión; no existe todavía una solución de caché/sincronización.

Diseñar el modo offline de forma explícita antes de implementarlo:

- Mostrar cuándo los datos fueron sincronizados y distinguirlos de los datos actuales del servidor.
- No permitir confirmar pagos ni cambios críticos offline. Si el equipo decide encolar una acción futura, usar IDs/idempotencia, estados visibles y confirmación del servidor.
- Definir expiración de caché, alcance por usuario, borrado al cerrar sesión y protección de datos personales.
- Al recuperar conexión, sincronizar de forma idempotente; el servidor resuelve la versión autorizada. Definir política de conflictos y cola antes de escribir operaciones pendientes.
- Manejar estados sin datos locales, sin conexión, sincronización en curso y sincronización fallida.

## 10. Correo, pagos y archivos

Los correos automáticos son procesos del backend. Implementar allí la programación (último día hábil y día 20), las plantillas HTML + texto, adjuntos, bitácora de envío y reintentos. La app debe reflejar el estado que publique la API; no enviar correo directamente.

El flujo de pago móvil previsto es: elegir alumno autorizado → revisar deuda e ítems → mostrar importe calculado por backend → informar transferencia → crear/obtener solicitud sin duplicarla → cargar comprobante asociado a factura → mostrar estado confirmado por backend. La app no debe mostrar el pago como acreditado hasta recibir ese estado.

El manejo del archivo de transferencia depende del endpoint aún por acordar. Validar tipo/tamaño en cliente para orientar, pero repetir la validación y análisis en servidor. Evitar persistir el archivo sensible en caché offline.

## 11. Experiencia de usuario y errores

- Diseñar primero para teléfono y contemplar Android/iOS, teclado, áreas seguras y tamaños de texto.
- Usar etiquetas visibles, foco/teclado correctos, controles accesibles y mensajes junto al campo o acción que falló.
- En solicitudes, distinguir carga, éxito, lista vacía, falta de conexión, sesión vencida, error del servidor y reintento.
- No borrar formularios ni selección ante fallas recuperables.
- Formatear moneda y fechas para Argentina de modo consistente; conservar valores numéricos y fechas normalizadas en el contrato.
- Evitar duplicar taps en acciones de pago o inscripción mientras la solicitud está en curso; confirmar operaciones irreversibles.

## 12. Secuencia sugerida de implementación

Orden recomendado por dependencias del plan; ajustar según el backlog real:

1. **Contratos y seguridad:** OpenAPI de endpoints nuevos, mapa de roles/IDs, normalización de errores, almacenamiento seguro de tokens y revisión de recuperación de contraseña.
2. **Sesión y perfil:** conectar renovación JWT y `GET /perfil/`, mantener login/logout, completar actualización de email/teléfono.
3. **Aranceles (administración):** definir canal y contrato de lectura/actualización antes de calcular importes.
4. **Cuotas, deuda e historial:** consulta por alumno autorizado, estados, vencimientos y desglose.
5. **Pago y comprobantes:** selección, total autoritativo, solicitud idempotente y carga asociada a factura.
6. **Servicios:** consulta e inscripción a deportes, transporte y comedor, con validaciones de cupo/horario/duplicados confirmadas por servidor.
7. **Facturas y comprobantes por período:** filtros, paginación y estados vacíos.
8. **Offline:** lectura de caché y sincronización segura de la información aprobada.
9. **Integración y aceptación:** pruebas de roles, casos normales/alternativos, errores de red, datos web-móvil, pagos duplicados y sincronización. Documentar el resultado y registrar uso de IA en la bitácora exigida por el plan.

Los recordatorios por email y reportes web se coordinan con backend/web, aunque no sean pantallas móviles.

## 13. Criterios mínimos de aceptación por flujo

- **Acceso:** credenciales válidas/inválidas, campos vacíos, rol correcto, renovación vencida, logout conectado y desconectado.
- **Permisos:** cada rol solo ve y obtiene por API sus funciones; tutor A no puede consultar hijos de tutor B; alumno no puede pagar.
- **Cuotas/deuda:** importes, vencimientos, conceptos e historial coinciden con la web para el mismo alumno.
- **Pago:** total confirmado por servidor, transferencia como único medio, comprobante ligado a factura y reintento sin duplicar.
- **Servicios:** máximo dos deportes, conflicto horario bloqueado, cuatro recorridos disponibles, transporte modificable mes a mes y no duplicación.
- **Correo:** fechas de envío, adjunto/desglose, registro y reintento verificables desde backend.
- **Offline:** datos previamente sincronizados legibles, marca de antigüedad, reconexión y resolución sin duplicar ni perder datos.
- **Perfil:** email/teléfono validados, guardados y reflejados al volver a consultar.
- **General:** interfaz móvil adaptable, navegación funcional, estados de carga/error/vacío y solicitudes dentro del objetivo de menos de 2 s bajo condiciones normales de red.

## 14. Referencia de origen y mantenimiento

Fuente funcional: `PlanTrabajo-Parte3-Matech.docx (1).pdf`, Plan de Trabajo del Proyecto Parte 3 (Grupo 8 - MATECH, Metodología de Sistemas II, TUP 2026). La descripción de estado actual y endpoints se contrastó con `README.md`, el frontend `src/` y el backend Django `api/urls.py` / `api/views.py` del repositorio de trabajo.

Actualizar esta guía cuando cambien requisitos, matriz de permisos, contratos OpenAPI, tecnología, arquitectura o comportamiento real. Las reglas del documento académico son la base de alcance; los contratos del backend deben confirmarse en código/documentación antes de implementar cada conexión.
