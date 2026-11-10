# Matech App

**Aplicación móvil** del centro educativo **"Educar para Transformar"** (Grupo 8 – MATECH), desarrollada en **React Native**.

Corresponde a la **Parte 3** del Trabajo Práctico Integrador de Metodología de Sistemas II (TUP 2026): *Aplicación móvil integrada con IA*.

La app consume la **API REST** del sistema web existente (backend Django), permitiendo gestionar desde el celular:

- **Autenticación**: inicio/cierre de sesión y recuperación de contraseña (Módulo 1)
- **Cuotas y pagos**: pendientes, pagadas, vencimientos, historial y comprobantes (Módulo 2)
- **Servicios**: inscripción a deportes, transporte y comedor
- **Consulta offline** de información básica (calificaciones, horarios, comunicados)

## Requisitos
- Node.js 18+
- Python 3.10+ (para el backend)
- **Expo Go** actualizado en el celular (la app usa Expo SDK 58) o un emulador Android
- Celular y PC en la misma red WiFi

## Repositorios
- App móvil (este repo): https://github.com/lkei242/matech-appmovil
- Backend (Django): https://github.com/lkei242/Metodologia2_C2_EPT

## Ejecución

Se necesitan dos terminales: una para el backend y otra para la app. Los comandos suponen que clonaste ambos repositorios en la misma carpeta; las rutas `cd` son relativas a esa carpeta.

### 1. Backend (Django)

El backend ya trae una base `db.sqlite3` con datos de prueba, así que **no hace falta correr `seed_demo`**.

```bash
cd Metodologia2_C2_EPT/educar_pagina_proyecto
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

`0.0.0.0` permite que el celular se conecte. Si Windows pregunta por el firewall, permití el acceso en redes privadas.

Las contraseñas de los usuarios de prueba no están en el repositorio. Para tener una cuenta con clave conocida (por ejemplo `jperez`, un tutor con varios hijos), en otra terminal con el entorno virtual activado:

```bash
python manage.py shell -c "from core.models import Usuario; from core.seguridad import guardar_contrasenia; u=Usuario.objects.get(nombre_usuario='jperez'); u.contrasenia=guardar_contrasenia('<clave-de-prueba>'); u.save()"
```

Reemplazá `<clave-de-prueba>` por la clave que quieras usar.

### 2. App móvil (Expo)

```bash
cd matech-appmovil
npm install
npx expo start
```

- **Celular:** escaneá el código QR con **Expo Go**. La app detecta sola la IP de la PC.
- **Emulador Android:** presioná `a` en la terminal de Expo (usa `10.0.2.2:8000`, sin configurar nada).
- **Si no conecta con el backend:** copiá `.env.example` como `.env.local`, poné `EXPO_PUBLIC_API_URL=http://<IP-de-tu-PC>:8000/api/` (la IP sale de `ipconfig`) y reiniciá Expo.

### 3. Qué probar
1. Iniciá sesión como tutor (por ejemplo `jperez`): se ve el resumen de deuda y el botón "Pagar ahora".
2. En "Facturas y comprobantes" se listan las facturas al elegir un alumno; se puede filtrar por fechas.
3. En "¿Olvidaste tu contraseña?" se pide el código y después se ingresa junto con la contraseña nueva. En desarrollo el correo se imprime **en la consola del backend**, no llega a un mail real.

