# Contrato de la API REST - Matech Mobile & Backend

Contrato unificado para el consumo de la API entre la aplicación móvil Expo y el backend Django.
Define métodos, rutas, permisos requeridos, formato de payload, respuestas y manejo de errores.

---

## 1. Autenticación y Cabeceras

Los endpoints protegidos requieren el encabezado HTTP:
```http
Authorization: Bearer <access_token>
```
Respuestas estándar de error de autenticación:
- **401 Unauthorized:** Token no enviado, expirado o con firma inválida.
```json
{
  "detail": "Token inválido o expirado."
}
```

---

## 2. Endpoints del Módulo de Perfil (RF-M18 - Germán)

### 2.1 Consultar Perfil
- **Método:** `GET`
- **Ruta:** `/api/perfil/`
- **Permisos:** Autenticado con JWT
- **Respuesta 200 OK:**
```json
{
  "usuario": "tutor_demo",
  "correo": "tutor@familia.com",
  "rol": "padre",
  "dashboard_url": "dashboard-padres",
  "persona": {
    "id": 5,
    "nombre": "Martín",
    "apellido": "Romero",
    "dni": "27666777",
    "email": "tutor@familia.com",
    "telefono": "1155558888"
  }
}
```

### 2.2 Actualizar Datos de Contacto (Email y Teléfono)
- **Método:** `PATCH`
- **Ruta:** `/api/perfil/`
- **Permisos:** Autenticado con JWT
- **Body:**
```json
{
  "email": "nuevo_email@familia.com",
  "telefono": "1122334455"
}
```
- **Respuesta 200 OK:**
```json
{
  "ok": true,
  "mensaje": "Perfil actualizado correctamente.",
  "usuario": "tutor_demo",
  "correo": "nuevo_email@familia.com",
  "rol": "padre",
  "dashboard_url": "dashboard-padres",
  "persona": {
    "id": 5,
    "nombre": "Martín",
    "apellido": "Romero",
    "dni": "27666777",
    "email": "nuevo_email@familia.com",
    "telefono": "1122334455"
  }
}
```
- **Errores:**
  - `400 Bad Request`: `{"error": "El correo electrónico no tiene un formato válido."}`

---

## 3. Endpoints de Servicios Escolares (RF-M16 - Germán)

### 3.1 Listar Alumnos Autorizados
- **Método:** `GET`
- **Ruta:** `/api/servicios/alumnos/`
- **Permisos:** Autenticado con JWT.
  - Tutor (`padre`): devuelve únicamente sus hijos vinculados.
  - Alumno (`alumno`): devuelve sus propios datos.
  - Administrativo / Directivo: devuelve todos los alumnos activos.
- **Respuesta 200 OK:**
```json
[
  {
    "id": 1,
    "legajo": 1001,
    "nombre": "Lucas",
    "apellido": "Romero",
    "dni": "48111001",
    "curso": "1° Año A (Secundario)",
    "inscripto_comedor": true
  }
]
```

### 3.2 Consultar Servicios Activos de un Alumno
- **Método:** `GET`
- **Ruta:** `/api/servicios/mis-servicios/?alumno={id}`
- **Permisos:** Autenticado. Valida vínculo tutor-alumno o pertenencia propia.
- **Respuesta 200 OK:**
```json
{
  "alumno": {
    "id": 1,
    "legajo": 1001,
    "nombre": "Lucas",
    "apellido": "Romero",
    "curso": "1° Año A"
  },
  "deportes": [
    {
      "inscripcion_id": 14,
      "grupo_id": 2,
      "disciplina": "Fútbol",
      "nivel": "Secundario",
      "dia_semana": "Lunes",
      "hora_inicio": "14:00",
      "hora_fin": "15:30",
      "profesor": "Carlos Martínez",
      "fecha_inscripcion": "2026-11-08"
    }
  ],
  "transporte": {
    "inscripcion_id": 8,
    "recorrido_id": 1,
    "nombre": "Recorrido Norte",
    "descripcion": "Av. San Martín, Belgrano, Plaza Central",
    "fecha_inscripcion": "2026-11-08"
  },
  "comedor": true
}
```
- **Errores:**
  - `403 Forbidden`: `{"error": "No tiene permisos para acceder a los datos de este alumno."}`

### 3.3 Catálogo de Deportes y Grupos Disponibles
- **Método:** `GET`
- **Ruta:** `/api/servicios/deportes/grupos/`
- **Permisos:** Autenticado
- **Respuesta 200 OK:**
```json
[
  {
    "id": 1,
    "disciplina_id": 1,
    "disciplina": "Fútbol",
    "nivel": "Secundario",
    "dia_semana": "Lunes",
    "hora_inicio": "14:00",
    "hora_fin": "15:30",
    "profesor": "Carlos Martínez"
  }
]
```

### 3.4 Inscribir a Alumno en Deporte
- **Método:** `POST`
- **Ruta:** `/api/servicios/deportes/inscripciones/`
- **Permisos:** Tutor, Alumno (propio) o Personal Administrativo.
- **Body:**
```json
{
  "alumno_id": 1,
  "grupo_id": 2
}
```
- **Respuesta 201 Created:**
```json
{
  "ok": true,
  "mensaje": "Inscripción deportiva registrada con éxito.",
  "inscripcion_id": 15
}
```
- **Errores de Regla de Negocio (400 Bad Request):**
  - Máximo 2 deportes: `{"error": "El alumno no puede tener más de dos deportes activos."}`
  - Choque de horario: `{"error": "El horario se superpone con Fútbol (14:00-15:30)."}`
  - Mismo deporte duplicado: `{"error": "El alumno ya participa en ese deporte."}`

### 3.5 Dar de Baja / Finalizar Inscripción a Deporte
- **Método:** `DELETE`
- **Ruta:** `/api/servicios/deportes/inscripciones/{inscripcion_id}/`
- **Permisos:** Tutor, Alumno (propio) o Personal Administrativo.
- **Respuesta 200 OK:**
```json
{
  "ok": true,
  "mensaje": "Inscripción deportiva finalizada correctamente."
}
```

### 3.6 Listar Recorridos de Transporte Escolar
- **Método:** `GET`
- **Ruta:** `/api/servicios/transporte/recorridos/`
- **Permisos:** Autenticado
- **Respuesta 200 OK:**
```json
[
  {
    "id": 1,
    "nombre": "Recorrido Norte",
    "descripcion": "Av. San Martín, Belgrano, Plaza Central, Instituto",
    "activo": true
  },
  {
    "id": 2,
    "nombre": "Recorrido Sur",
    "descripcion": "Av. Rivadavia, Estación FFCC, Hospital Regional, Instituto",
    "activo": true
  },
  {
    "id": 3,
    "nombre": "Recorrido Este",
    "descripcion": "Ruta 3, Barrio Jardín, Polideportivo, Instituto",
    "activo": true
  },
  {
    "id": 4,
    "nombre": "Recorrido Oeste",
    "descripcion": "Av. Mitre, Parque Industrial, Barrio Los Álamos, Instituto",
    "activo": true
  }
]
```

### 3.7 Asignar o Retirar Recorrido de Transporte
- **Método:** `PUT`
- **Ruta:** `/api/servicios/transporte/inscripcion/`
- **Permisos:** Tutor o Personal Administrativo.
- **Body:**
```json
{
  "alumno_id": 1,
  "recorrido_id": 2
}
```
*(Para dar de baja el transporte, enviar `"recorrido_id": null`)*
- **Respuesta 200 OK:**
```json
{
  "ok": true,
  "mensaje": "Recorrido de transporte asignado correctamente.",
  "inscripcion_id": 9,
  "recorrido_id": 2
}
```

### 3.8 Activar o Desactivar Comedor Escolar
- **Método:** `PUT`
- **Ruta:** `/api/servicios/comedor/`
- **Permisos:** Tutor o Personal Administrativo.
- **Body:**
```json
{
  "alumno_id": 1,
  "inscripto": true
}
```
- **Respuesta 200 OK:**
```json
{
  "ok": true,
  "inscripto_comedor": true,
  "mensaje": "Servicio de comedor activado correctamente."
}
```

---

## 4. Endpoint de Sincronización y Consulta Offline (RF-M17 - Germán)

### 4.1 Paquete Consolidado Offline
- **Método:** `GET`
- **Ruta:** `/api/servicios/offline-bundle/`
- **Permisos:** Autenticado con JWT.
- **Respuesta 200 OK:**
```json
{
  "sincronizado_en": "2026-11-08T21:10:00.000Z",
  "usuario": {
    "username": "tutor_demo",
    "correo": "tutor@familia.com",
    "rol": "padre",
    "persona": { ... }
  },
  "alumnos": [
    {
      "id": 1,
      "legajo": 1001,
      "nombre": "Lucas Romero",
      "dni": "48111001",
      "curso": "1° Año A",
      "comedor": true,
      "deportes": [ ... ],
      "transporte": { ... }
    }
  ],
  "catalogo_deportes": [ ... ],
  "catalogo_transporte": [ ... ],
  "comunicados": [
    {
      "id": 1,
      "titulo": "Inicio de Actividades",
      "contenido": "...",
      "fecha": "2026-11-08"
    }
  ]
}
```
