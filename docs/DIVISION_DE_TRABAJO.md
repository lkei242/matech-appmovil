# División de trabajo: Parte 3 del TPI

Reparto de tareas entre **Luka** y **Germán** para completar la app móvil y lo que necesita del backend. Complementa a [GUIA_DESARROLLO_APP_MOVIL.md](GUIA_DESARROLLO_APP_MOVIL.md), que define el qué y las reglas. Este documento define quién hace cada cosa, en qué archivos y en qué orden.

> **Estado: propuesta.** Revisarla juntos en la sesión inicial. Si cambian algo, actualicen este archivo antes de seguir programando.

## 1. La idea en una página

Cada uno se hace cargo de **funcionalidades completas**: backend, API, pantallas y tests. Así nadie queda esperando que el otro termine una capa.

| | Luka | Germán |
|---|---|---|
| **Tema** | Pagos y base de la app | Servicios, web, correo y deploy |
| **Requerimientos** | RF-M01 a RF-M07 | RF-M08 a RF-M18 |
| **Por qué** | Hizo la API JWT y el login de la app | Hizo servicios, reportes y deploy en Render |
| **Lo primero que entrega** | Modelos, permisos y cliente HTTP con token | Carga de valores y datos de prueba |

**Fechas**

| Fecha | Hito |
|---|---|
| Hoy, dom. 8/11 | Sesión inicial y entrega de la base |
| **Mar. 10/11** | Testing y coevaluación. Debe funcionar el flujo mínimo de la sección 7 |
| Lun. 16/11 | Congelar el código: desde acá, solo correcciones |
| **Mar. 17/11** | Entrega y exposición: app móvil, informe y bitácora de IA |

> La consigna y el TP 4 dicen 11/11 para el testing; el cronograma, 10/11. Este plan apunta al 10/11. Conviene confirmarlo con la cátedra.

## 2. Antes de empezar

Estas tareas van primero, porque si no se resuelven pueden pisar trabajo.

- [ ] **Germán:** confirmar si tiene cambios de backend sin subir. Al 8/11, el último commit en GitHub es `a479844`, del 26/10. Si tiene algo, subirlo antes de que se cree ninguna rama.
- [ ] **Luka:** subir sus cambios pendientes del backend: `.gitignore` del proyecto, `settings.py`, `requirements.txt` y `.env.example`.
- [ ] **Los dos:** dejar de commitear `db.sqlite3` (ver sección 6.3).
- [ ] **Los dos:** instalar y probar el proyecto actualizado. La app recién migró a Expo SDK 58 y todavía hay que comprobar que arranca.

## 3. Sesión inicial juntos (1 hora)

Sale de acá lo que los dos necesitan. Nadie empieza su parte hasta terminarla.

### 3.1 Decisiones que tienen que tomar

| N.º | Decisión | Propuesta |
|---|---|---|
| D1 | ¿Quién puede inscribir alumnos? La guía marca una diferencia entre RF-M16 y la matriz de permisos | Tutor y administrativo. Alumno y directivo solo consultan. Verificar contra el plan |
| D2 | ¿Dónde está cada valor? | `Arancel` para la cuota por nivel, un campo `valor` en `DisciplinaDeportiva` y `RecorridoTransporte`, y un valor único para comedor |
| D3 | ¿Cómo convive `Factura` con `Cuota` y `PagoPendiente`? | `Factura` es la nueva fuente de verdad. Al aprobarse un pago de cuota, se registra también en `Cuota`, para que el panel web siga funcionando |
| D4 | ¿Quién aprueba un comprobante? | El personal administrativo, desde la web |
| D5 | ¿Cómo se evitan pagos duplicados? | La app manda una clave única por intento y el backend la rechaza si se repite |
| D6 | ¿Se implementan offline (RF-M17) y perfil (RF-M18)? | Sí, pero al final. La consigna no los pide; su plan de trabajo sí |
| D7 | ¿Contrato en OpenAPI o Markdown? | Empezar en Markdown por velocidad. La guía pide OpenAPI/Swagger: pasarlo si queda tiempo |

### 3.2 Lo que hay que dejar escrito

**1. Contrato de la API, en `docs/API_CONTRATO.md`.** Por cada endpoint: método, ruta, permisos, campos, ejemplos y errores. Punto de partida para discutir, no son rutas definitivas:

| Responsable | Endpoints propuestos |
|---|---|
| Luka | `GET /api/alumnos/` (hijos o alumno propio) |
| Luka | `GET /api/cuotas/?alumno=` y `GET /api/deuda/?alumno=` |
| Luka | `GET /api/facturas/?alumno=&desde=&hasta=`, `GET /api/facturas/{id}/` y `GET /api/facturas/{id}/pdf/` |
| Luka | `POST /api/pagos/` y `POST /api/facturas/{id}/comprobantes/` (multipart) |
| Germán | `GET /api/servicios/deportes/grupos/` y `POST` / `DELETE /api/servicios/deportes/inscripciones/` |
| Germán | `GET /api/servicios/transporte/recorridos/` y `PUT /api/servicios/transporte/inscripcion/` |
| Germán | `PUT /api/servicios/comedor/` |
| Germán | `PATCH /api/perfil/` |

**2. Modelos.** Se definen juntos, pero Luka los sube en **una sola migración**, la `0004`:

- `Factura`: alumno, tutor, período, emisión, vencimiento, total y estado.
- `ItemFactura`: factura, tipo (cuota, deporte, transporte o comedor), descripción e importe.
- `ComprobantePago`: factura, archivo, importe, fecha, estado y quién lo subió. Una factura puede tener varios.
- Los campos de valores de D2.
- Cambios en `Cuota`: agregar `fecha_vencimiento`, permitir `fecha_pago` vacía y revisar el estado por defecto, que hoy es `Pagada`. Antes de cambiarlo, revisar dónde se crean cuotas en `core/views.py`.

**3. Datos de prueba.** Definir qué usuarios de cada rol se usan en la demo. Las contraseñas de prueba van en el seed, nunca en este documento.

## 4. Tareas de Luka

### Base (entregar el 8/11: Germán depende de esto)

- [ ] **L1. Modelos y migración `0004`**, según la sección 3.
- [ ] **L2. Separar las rutas de la API.** Crear `api/urls_pagos.py` y `api/urls_servicios.py`, y dejarlos incluidos en `api/urls.py`. Después de esto, nadie necesita volver a tocar `api/urls.py`.
- [ ] **L3. Permisos compartidos,** en `api/permisos_dominio.py`: funciones para obtener el rol, exigir un rol y comprobar el vínculo tutor-alumno.
- [ ] **L4. Cliente HTTP de la app** (`src/api/`): adjuntar `Authorization: Bearer`, renovar una vez ante un 401 y cerrar sesión si falla. Normalizar los errores. Eliminar `src/api.js` al migrar, para que no conviva con la carpeta `src/api/`.
- [ ] **L5. Navegación por rol** (`src/navigation/`), roles y etiquetas en un único módulo, y un archivo `src/navigation/modulos.js` donde cada módulo se registra.
- [ ] **L6. Componentes base** (`src/components/`): estados de carga, error, vacío y formato de moneda y fecha.

### Seguridad (RF-M01)

- [ ] **L7. Contraseñas con hash.** Cambiar el login web (`core/views.py`, cerca de la línea 168), el alta de usuario (cerca de la 1381) y `_validar_contrasenia` en `api/views.py`. Incluir una migración de datos para los usuarios existentes. **Probar el login web después:** si esto sale mal, nadie entra.
- [ ] **L8. Recuperación de contraseña.** Hoy es pública, cambia la clave sin confirmación y la guarda sin hash, y además `EMAIL_BACKEND` está en modo consola. Pasar a un enlace o código con vencimiento, con respuesta igual exista o no la cuenta. Coordinar con Germán el envío de correo (G5).

### Pagos (RF-M03 a RF-M07)

- [ ] **L9. Facturación,** en `core/facturacion.py`: generar la factura mensual con los servicios activos del alumno, calcular totales y deuda, y generar el PDF con `generar_pdf_factura(factura)`.
- [ ] **L10. Cuotas y deuda (RF-M03 y RF-M06):** API y pantallas de pendientes, pagadas, vencimientos, importe, estado, historial y deuda por ítem.
- [ ] **L11. Pago (RF-M04):** selección de ítems, total calculado por el backend, comprobante de pago emitido y protección contra duplicados.
- [ ] **L12. Comprobantes (RF-M05):** subir el archivo de la transferencia y asociarlo a la factura, con varios por factura.
- [ ] **L13. Aprobación en la web:** pantalla para que el personal administrativo apruebe o rechace comprobantes (D4).
- [ ] **L14. Facturas por período (RF-M07):** listado por alumno y rango de fechas.

### Archivos de Luka

- **Backend:** `api/views_pagos.py`, `api/urls_pagos.py`, `api/permisos_dominio.py`, `core/facturacion.py`, `api/tests_pagos.py` y `core/tests_facturacion.py`.
- **App:** `src/api/`, `src/auth/`, `src/navigation/`, `src/components/`, `src/features/cuotas/`, `src/features/pagos/` y `src/features/facturas/`.

## 5. Tareas de Germán

### Base (entregar el 8/11 o el 9/11: Luka depende de esto)

- [ ] **G1. Carga de valores (RF-M15):** pantalla web para que el administrador fije los valores de cuota, deportes, recorridos y comedor. Reutilizar `_autorizar_gestion`.
- [ ] **G2. Datos de prueba,** con el comando `core/management/commands/seed_demo.py`: usuarios de cada rol, asignaciones docentes, grupos deportivos, cuatro recorridos y valores. Hoy la base local tiene 0 asignaciones, 0 grupos y 0 recorridos. Luka agrega después las facturas de ejemplo, llamando a su función de facturación.
- [ ] **G3. Deploy:** dejar el backend en Render con HTTPS y las variables configuradas, y la app apuntando ahí con `EXPO_PUBLIC_API_URL`.

### Servicios (RF-M16)

- [ ] **G4. Inscripciones:** API y pantallas de deportes, transporte y comedor, para hijos vinculados.
  - Reutilizar `inscribir_en_deporte`, `finalizar_deporte` y `asignar_transporte` de `core/domain_services.py`, que ya validan el máximo de dos deportes y los choques de horario. No volver a escribir esas reglas.
  - Falta crear el servicio de comedor: hoy solo existe el campo `Alumno.inscripto_comedor`.
  - `publicar_cambio` toma el usuario de la sesión web, y con JWT no hay sesión. Adaptarlo para recibir el usuario, sin romper la web.

### Correo (RF-M08 y RF-M09)

- [ ] **G5. Servicio de correo:** configurar el envío real, sacar el modo consola y cargar las credenciales como variables de entorno. Avisarle a Luka cuando esté, para L8.
- [ ] **G6. Recordatorio del último día hábil (RF-M08):** comando `enviar_recordatorios`, con el total detallado y la factura adjunta, usando `generar_pdf_factura` de Luka.
- [ ] **G7. Aviso de deuda del día 20 (RF-M09):** comando `enviar_avisos_deuda`, solo a quien no pagó completo.
- [ ] **G8. Programación y registro:** programar ambos comandos, registrar envíos y reintentos, y aceptar `--fecha` para poder demostrarlos cualquier día. Confirmar qué opción de tareas programadas sirve en el plan de Render.

### Reportes web (RF-M10 a RF-M14)

- [ ] **G9.** Agregar a la web los listados de ingresos por período, pagos completos, pagos incompletos, pagos por deporte, nivel, horario y profesor, y pagos por recorrido. Requieren los modelos de L1 y datos de L9. Si se agregan a `core/reporting_views.py`, revisar el test que recorre todas las rutas de reportes.

### Al final (RF-M17 y RF-M18)

- [ ] **G10. Perfil (RF-M18):** consultar y actualizar email y teléfono. Agregar el `PATCH` a la vista `perfil`, tocando solo esa función de `api/views.py`.
- [ ] **G11. Offline (RF-M17):** consulta de cuotas, facturas, horarios y comunicados ya cargados, con la fecha de la última sincronización. No se paga ni se modifica nada offline, y la caché se borra al cerrar sesión. Empieza cuando las pantallas de Luka estén en `main`.

### Otras tareas

- [ ] **G12. Partes 1 y 2:** revisar que la web y el sistema de gestión cumplan la consigna, y anotar lo que falte. Germán conoce mejor ese código.

### Archivos de Germán

- **Backend:** `api/views_servicios.py`, `api/urls_servicios.py`, `core/domain_services.py`, `core/service_views.py`, `core/reporting_views.py`, `core/correos.py`, `core/management/commands/`, `settings.py` (sección de correo y deploy) y `api/tests_servicios.py`.
- **App:** `src/features/servicios/`, `src/features/perfil/` y `src/features/offline/`.

## 6. Reglas para no pisarse

### 6.1 Quién toca qué

| Archivo o carpeta | Dueño | Regla para el otro |
|---|---|---|
| `core/models.py` y `core/migrations/` | Luka hasta la `0004`; después, compartido | Avisar por chat antes de modificar. **Una migración a la vez** |
| `api/urls.py` | Luka, solo en L2 | Después nadie lo toca: cada uno usa su `urls_*.py` |
| `api/views.py` | Luka (login y recuperación); Germán (solo `perfil`) | No tocar la función del otro |
| `api/permisos_dominio.py` | Luka | Germán lo usa. Si le falta algo, lo pide o hace un PR chico |
| `core/views.py` | Luka para L7 y L13 | Tiene más de 90 KB: código nuevo en archivos nuevos |
| `core/urls.py` | Compartido | Agregar líneas sin reordenar las que ya están |
| `core/facturacion.py` | Luka | Germán solo lo llama |
| `core/domain_services.py` | Germán | Luka solo lo llama |
| `requirements.txt`, `package.json` y lockfile | Compartido | PR propio y corto. En la app, usar siempre `npx expo install` |
| `src/navigation/modulos.js` | Luka | Germán agrega una línea por módulo |
| `src/components/` | Luka | Germán reutiliza. Lo que sea solo de un módulo va en su `features/` |
| `docs/API_CONTRATO.md` | Compartido | **Se actualiza antes de cambiar un endpoint** y se avisa |

### 6.2 Git, en los dos repos

Nadie sube directo a `main`. Siempre se crea una rama desde `origin/main` actualizado:

```bash
git fetch origin
git switch -c feature/rf-m03-cuotas origin/main
```

```bash
git push -u origin feature/rf-m03-cuotas
```

- **Nombres de rama:** `feature/rf-m03-cuotas`, `fix/l8-recuperacion`, `docs/contrato-api`.
- **Commits:** en formato `feat(rf-m03): agregar consulta de cuotas`.
- **Pull Requests:** chicos, con una sola funcionalidad. El otro lo revisa antes de integrarlo. Con el tiempo justo, la revisión no debería demorar más de unas horas.
- **Antes de abrir un PR:** actualizar la rama con `main` y correr las pruebas.
- **Mantenerse al día:** traer `main` al menos una vez por día, y siempre después de que el otro integre.
- **Nunca** usar `git push --force` sobre `main`.

> **Luka:** su rama local del backend se llama `master`, pero sigue a `origin/main`. Con el comando de arriba no hay problema, porque parte de `origin/main`.

### 6.3 Base de datos

`db.sqlite3` está en Git. Es un archivo binario: si los dos lo cambian, el conflicto no se puede resolver a mano.

- **Nunca incluirlo en un commit.** Mientras siga en el repo, cada uno ejecuta en el backend:

```bash
git update-index --skip-worktree educar_pagina_proyecto/db.sqlite3
```

- **Los datos se comparten con `seed_demo`,** no pasándose el archivo.
- **Decidir si se saca del repo.** Contiene contraseñas sin hash, así que se recomienda. Quien lo haga tiene que avisar antes, porque el otro pierde su copia local al hacer pull. Además, sacarlo no borra el historial: conviene cambiar esas contraseñas.

### 6.4 Migraciones

Si dos ramas crean una migración con el mismo número, el proyecto falla.

1. Avisar por chat antes de crear una.
2. Integrarla a `main` lo antes posible, en un PR propio.
3. El otro actualiza su rama antes de crear la suya.
4. Si igual chocan, quien integra segundo renumera la suya o ejecuta `python manage.py makemigrations --merge`.

El CI ya ejecuta `makemigrations --check`, así que un modelo sin migración falla en el Pull Request.

### 6.5 Contrato de la API

- El contrato manda: si el código y el contrato no coinciden, se corrige uno de los dos a propósito, nunca en silencio.
- Las pantallas pueden avanzar con datos de ejemplo basados en el contrato, sin esperar a que el endpoint esté listo.
- No inventar rutas ni nombres de campos.

### 6.6 Comunicación

Un mensaje corto alcanza. Avisar siempre cuando:

- empezás o terminás una tarea de esta lista;
- vas a tocar un archivo compartido o crear una migración;
- integrás algo a `main` que el otro necesita;
- llevás más de una hora trabado por algo que depende del otro.

Si dos personas usan IA a la vez, aplica lo mismo: la IA de cada uno trabaja solo en sus archivos y en su rama.

## 7. Orden y dependencias

```text
Sesión inicial
    │
    ├── Luka: L1 a L6 (modelos, rutas, permisos, cliente, navegación)
    └── Germán: G1 a G3 (valores, datos de prueba, deploy)
            │
            ├── Luka: L9 facturación → L10 cuotas → L11 pago → L12 comprobantes
            └── Germán: G4 servicios
                    │
                    ▼
          Mar. 10/11: testing con el flujo mínimo
                    │
            ├── Luka: L7, L8, L13, L14
            └── Germán: G5 a G12
                    │
                    ▼
          Lun. 16/11: código congelado
```

### Qué necesita cada uno del otro

| Quién entrega | Qué | A quién | Para qué | Cuándo |
|---|---|---|---|---|
| Luka | L1 modelos | Germán | G1, G4, G9 | 8/11 |
| Luka | L2 y L3 rutas y permisos | Germán | G4 | 8/11 |
| Luka | L4 a L6 base de la app | Germán | Pantallas de G4 | 8/11 o 9/11 |
| Germán | G1 valores | Luka | Importes de L9 | 9/11 |
| Germán | G2 datos de prueba | Luka | Probar L10 a L12 | 9/11 |
| Luka | L9 facturación y PDF | Germán | G6, G7, G9 | 9/11 |
| Germán | G3 deploy | Los dos | Probar en el celular | Antes del 10/11 |
| Germán | G5 correo | Luka | L8 | Después del 10/11 |
| Luka | L10 a L14 pantallas | Germán | G11 offline | Antes de G11 |

### Flujo mínimo para el 10/11

Si no llegan con todo, esto tiene que funcionar, con un tutor de prueba:

1. Iniciar sesión.
2. Ver a sus hijos y la deuda de cada uno, desglosada por ítem.
3. Elegir qué pagar y ver el total calculado por el backend.
4. Subir el comprobante y verlo asociado a la factura.
5. Inscribir a un hijo en un deporte y que el sistema rechace un tercero o un choque de horario.

**Orden para recortar si falta tiempo:** primero offline (G11), después perfil (G10), después los reintentos de correo. Si recortan algo del plan presentado, avísenle a la cátedra.

## 8. Cuándo una tarea está terminada

- [ ] Cumple el requerimiento y los criterios de la sección 13 de la guía.
- [ ] El backend valida rol y pertenencia del dato. Probar que el tutor A no vea a los hijos del tutor B.
- [ ] Tiene tests, en los archivos propios de cada uno. Se ejecutan con `python manage.py test`.
- [ ] Las pantallas muestran carga, error y lista vacía, y funcionan en un celular real.
- [ ] Pasa el CI del backend y arranca en Expo.
- [ ] El contrato de la API está actualizado.
- [ ] El otro lo revisó y entiende cómo funciona.
- [ ] La bitácora de IA está al día.

## 9. Riesgos conocidos

| Riesgo | Responsable | Qué hacer |
|---|---|---|
| Los comprobantes pueden perderse: se guardan con `FileSystemStorage` y el disco de Render puede borrarse al redesplegar | Germán | Confirmarlo y definir dónde se guardan. Para la demo, al menos probar el flujo completo después de un deploy |
| Los comprobantes son documentos sensibles | Luka | Servirlos por un endpoint con permisos, no con una URL pública de `media/` |
| El hash de contraseñas (L7) puede dejar a todos sin acceso | Luka | Respaldar la base, migrar y probar el login web y el de la app |
| `DEBUG` queda en `True` si falta la variable, y CORS está abierto | Germán | Configurar `DEBUG=False` en Render y limitar CORS cuando salga a producción |
| La API local no se ve desde el celular si se usa `localhost` | Los dos | Usar `.env.local` con la IP de la PC o la URL de Render |
| Web y móvil muestran datos distintos sobre pagos | Luka | Aplicar D3 y comparar los dos para un mismo alumno |

## 10. Informe y exposición

**Bitácora de IA.** Es obligatoria y se presenta el 17/11. Cada uno lleva la suya mientras trabaja, para no reconstruirla al final y no generar conflictos:

- `docs/bitacora/luka.md`
- `docs/bitacora/german.md`

Columnas exigidas: N.º, problema, prompt utilizado, herramienta de IA, respuesta de IA, ¿funcionó?, modificaciones realizadas y resultado. El 16/11 se unen en una sola planilla.

**Informe de uso de IA.** Revisar primero el borrador `Informe-Uso-IA-Matech.docx`, porque es anterior a este trabajo.

| Apartado | Responsable |
|---|---|
| 1. Relación entre web y app | Germán, con los datos de la API que aporta Luka |
| 2. Bitácora | Los dos |
| 3. IA vs. conocimiento del sistema | Luka |
| 4. Tabla sin IA / con IA | Los dos, a partir de su experiencia real |
| 5. Reflexión crítica | Los dos |
| Unificar y revisar | Luka |

**Exposición.** La consigna exige que todo el código sea comprendido y justificado por el equipo. Antes del 17/11, cada uno le explica al otro su parte, en especial el flujo de pagos y las reglas de deportes. Preparen también un guion de demo y un plan B por si falla la red, como un video del flujo completo.

**Pruebas cruzadas.** Después del 10/11 y antes del 16/11, cada uno prueba lo del otro con los criterios de la sección 13 de la guía. Quien programó algo no suele ver sus propios errores.

**TP pendientes**

- [ ] **Germán:** consultar si el TP 5 Parte 2 todavía se evalúa, porque el documento actual habla de una app "TaskFlow" y no de este proyecto. Si se evalúa, rehacerlo entre los dos.
- [ ] **Luka:** confirmar qué hay que mostrar en la app sobre la optimización del ciclo de desarrollo, como pide el TP 4 para el 11/11.

## 11. Cobertura de requerimientos

| Requerimiento | Tema | Responsable | Tarea |
|---|---|---|---|
| RF-M01 | Autenticación | Luka | L4, L7, L8 |
| RF-M02 | Funciones por rol | Luka | L3, L5 |
| RF-M03 | Cuotas | Luka | L10 |
| RF-M04 | Selección de ítems y comprobante de pago | Luka | L11 |
| RF-M05 | Carga de comprobante | Luka | L12, L13 |
| RF-M06 | Deuda por ítem | Luka | L10 |
| RF-M07 | Facturas por período | Luka | L14 |
| RF-M08 | Recordatorio de último día hábil | Germán | G6, G8 |
| RF-M09 | Aviso de deuda del día 20 | Germán | G7, G8 |
| RF-M10 | Ingresos por período | Germán | G9 |
| RF-M11 | Pagos completos | Germán | G9 |
| RF-M12 | Pagos incompletos | Germán | G9 |
| RF-M13 | Pagos por deporte, nivel, horario y profesor | Germán | G9 |
| RF-M14 | Pagos por recorrido | Germán | G9 |
| RF-M15 | Carga de valores | Germán | G1 |
| RF-M16 | Inscripción a servicios | Germán | G4 |
| RF-M17 | Consulta offline | Germán | G11 |
| RF-M18 | Perfil | Germán | G10 |
