# Quantscrow Core 🚀

Terminal de ejecución algorítmica y gestión de riesgo en tiempo real para mercados financieros.

## 🛠️ Tecnologías utilizadas
*   **Backend:** Node.js, Express.js
*   **Base de Datos:** Supabase (PostgreSQL)
*   **Infraestructura:** DigitalOcean (Cloud App Platform)
*   **Integraciones:** MetaAPI (WebSockets para trading en tiempo real)

## ⚙️ Características
*   Motor de cálculo probabilístico (Simulaciones de Monte Carlo).
*   Gestión de capital mediante Criterio de Kelly.
*   Tareas automatizadas (Cronjobs) para el escaneo de mercado en ventanas de tiempo específicas.
*   Interfaz web responsiva para el monitoreo del estado del sistema en vivo.

## 🚀 Cómo ejecutar el proyecto
1. Clonar el repositorio.
2. Instalar dependencias: `npm install`
3. Configurar las variables de entorno en un archivo `.env`.
4. Iniciar el servidor: `node server.js`