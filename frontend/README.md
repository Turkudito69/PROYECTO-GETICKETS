# GETICKETS Mobile

Aplicación móvil/web hecha con Expo 58, React Native 0.88, React 19 y TypeScript 6.

La guía principal del sistema —incluyendo arquitectura, dependencias, API C#, migraciones SQL y el instalador de base de datos— está en el [README raíz](../README.md).

## Inicio rápido

Desde esta carpeta:

```powershell
npm ci
Copy-Item .env.example .env.local
npx expo start
```

Antes de iniciarla, configura `EXPO_PUBLIC_API_URL` en `.env.local` según dónde se ejecute la API: `localhost:5116` para web local, `10.0.2.2:5116` para emulador Android o la IP LAN de la computadora para un teléfono físico.
