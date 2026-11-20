# GETICKETS Mobile

Frontend móvil creado con Expo, Expo Router y React Native. La carpeta `gettickets` original es una aplicación web generada con Vite; se conserva intacta.

## Pantallas incluidas

- Inicio de sesión conectado a `POST /api/Login`.
- Resumen y bandeja de tickets, filtrados por el rol y usuario de la sesión.
- Creación de tickets mediante categorías y prioridades de la API.
- Detalle con historial de seguimiento.
- Acciones de administración y técnico: asignar, iniciar atención, agregar observaciones y resolver.
- El solicitante puede confirmar una solución o reabrir el ticket con un motivo.
- Actividad de auditoría para administrador y técnico.
- Perfil y cierre de sesión.

El mapa 3D, las notificaciones y las pantallas de edición de perfil/foto y administración de puestos todavía no están incluidos en esta app móvil. La API ya expone los contratos de foto y puestos para conectarlos después.

## Preparar API y base de datos

1. La cadena del API en `GETICKETS/Presentation/appsettings.json` apunta a `MSI\SQLEXPRESS01`, la instancia local donde se encontró `GETICKETS`.
2. La base actual ya tiene aplicadas [`GETICKETS-paridad.sql`](../database/GETICKETS-paridad.sql) y [`GETICKETS-backend.sql`](../database/GETICKETS-backend.sql). El contrato móvil de `sql/GETICKETS-frontend-contract.sql` se mantiene alineado para reinstalar solo los dos procedimientos que usa el inicio y el listado de tickets.
3. Ejecuta la API desde Visual Studio o desde `GETICKETS/Presentation` y confirma que escucha en `http://localhost:5116`.
4. En el emulador Android, `10.0.2.2` representa el Windows anfitrión. Para un teléfono físico, crea `.env` a partir de `.env.example` y cambia la URL por la IPv4 del equipo; la API también debe aceptar conexiones de la red local.
5. Si vas a abrir la app en Expo Web, usa `http://localhost:5116` y configura CORS de desarrollo en la API.

La sesión se mantiene en memoria y se cierra al reiniciar la app. La API actual no emite token; las restricciones de rol de la interfaz son de navegación/experiencia y no reemplazan autorización del lado del servidor.

## Ejecutar en VS Code

Abre esta carpeta en VS Code y ejecuta:

```powershell
npm install
npm run start
```

Pulsa `a` para Android o escanea el QR con Expo Go en el teléfono. También puedes usar `npm run web` para revisar la composición visual desde el navegador.

El proyecto usa Expo SDK 58. La versión de Node instalada durante el scaffolding fue 25.2; Expo SDK 58 solicita una versión compatible de Node (por ejemplo Node 24 LTS) si el CLI muestra una advertencia o falla al iniciar.

## Verificación

```powershell
npx tsc --noEmit
```
