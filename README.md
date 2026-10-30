# POC de API Gateway con Kong para un sistema de reservas de teatro

Este repositorio contiene la prueba de concepto que desarrollé para la actividad de componentes de arquitectura de software, del módulo Arquitectura de Software de la Maestría en Ingeniería de Software de la Universidad de Medellín. El componente que elegí fue el de integraciones, y para demostrarlo implementé un API Gateway con Kong que funciona como único punto de entrada a dos servicios de un sistema de reservas de teatro.

Lo que busco mostrar es cómo se ve en la práctica un gateway delgado, es decir, un gateway que solo se encarga de enrutar las solicitudes, autenticar a los consumidores, limitar la cantidad de solicitudes y agregar trazabilidad, sin tener lógica de negocio. Esa lógica se queda en los servicios, que no se exponen hacia afuera y solo se pueden consumir a través de Kong.

## Contenido

- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Cómo ejecutarlo](#cómo-ejecutarlo)
- [Endpoints](#endpoints)
- [Configuración del gateway](#configuración-del-gateway)
- [Servicios](#servicios)
- [Pruebas](#pruebas)
- [Decisiones de diseño](#decisiones-de-diseño)
- [Limitaciones](#limitaciones)
- [Uso de inteligencia artificial](#uso-de-inteligencia-artificial)

## Arquitectura

```
                     ┌──────────────────────── red interna de Docker ────────────────────────┐
                     │                                                                        │
 Cliente             │   ┌──────────────┐   /v1/funciones   ┌─────────────────────────┐       │
 (Postman, curl) ────┼──►│  Kong :8000  │──────────────────►│ servicio-cartelera:3000 │       │
                     │   │              │                   └─────────────────────────┘       │
                     │   │  key-auth    │   /v1/reservas    ┌─────────────────────────┐       │
                     │   │  rate-limit  │──────────────────►│ servicio-reservas:3000  │       │
                     │   │  correlation │                   └─────────────────────────┘       │
                     │   └──────────────┘                                                     │
                     └────────────────────────────────────────────────────────────────────────┘
```

El cliente solo conoce la dirección `http://localhost:8000`. Kong recibe la solicitud, aplica los plugins que correspondan a la ruta (autenticación, límite de solicitudes y correlation ID) y la envía al servicio interno. Los dos servicios no publican puertos hacia el host, por lo que no es posible llamarlos directamente desde afuera de la red de Docker.

El flujo de una solicitud es muy parecido al modelo de filtros de Zuul, el gateway de Netflix: los plugins de autenticación y de rate limiting actúan antes de enrutar (como los filtros PRE), Kong envía la solicitud al servicio (ROUTE) y luego agrega los encabezados de salida, como el `X-Correlation-ID`, antes de responder (POST).

## Estructura del repositorio

```
poc-arquitectura/
├── docker-compose.yml          # Levanta Kong y los dos servicios
├── kong/
│   └── kong.yml                # Configuración declarativa de Kong (services, routes, plugins, consumers)
├── postman/
│   └── poc-arquitectura.postman_collection.json
├── servicio-cartelera/         # Servicio NestJS de funciones (consulta pública)
│   ├── Dockerfile
│   └── src/funciones/
└── servicio-reservas/          # Servicio NestJS de reservas (protegido por API key)
    ├── Dockerfile
    └── src/reservas/
```

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Kong Gateway (OSS) | 3.9.1 | API Gateway en modo DB-less, configurado con un archivo declarativo |
| NestJS | 12 | Framework de los dos servicios, en TypeScript |
| Node.js | 22 (imagen `node:22-alpine`) | Entorno de ejecución de los servicios |
| @nestjs/swagger | 12 | Generación del contrato OpenAPI de cada servicio |
| class-validator | 0.15 | Validación de los datos de entrada de las reservas |
| Vitest | 4 | Pruebas unitarias |
| Docker Compose | v2 | Orquestación local de los contenedores |

## Requisitos

- Docker Desktop con Docker Compose v2.
- Node.js 20 o superior, solo si se quieren correr las pruebas unitarias por fuera de Docker.
- Postman, para usar la colección de pruebas (opcional).

## Cómo ejecutarlo

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Para revisar que los tres contenedores estén arriba:

```bash
docker compose ps
```

Kong queda escuchando en `http://localhost:8000`. Una primera prueba rápida es consultar la cartelera, que no necesita autenticación:

```bash
curl -i http://localhost:8000/v1/funciones
```

En Windows con PowerShell se debe usar `curl.exe` en lugar de `curl`, ya que `curl` es un alias de `Invoke-WebRequest`.

Para detener todo:

```bash
docker compose down
```

## Endpoints

Todas las rutas se consumen a través de Kong (`http://localhost:8000`).

| Método | Ruta | Autenticación | Descripción | Respuestas |
|---|---|---|---|---|
| GET | `/v1/funciones` | No | Lista las funciones disponibles | 200 |
| GET | `/v1/funciones/{id}` | No | Consulta una función por su id (`F001`, `F002`, `F003`) | 200, 404 |
| POST | `/v1/reservas` | API key | Crea una reserva | 201, 400, 401, 429 |
| GET | `/v1/reservas/{id}` | API key | Consulta una reserva por su id | 200, 401, 404, 429 |
| GET | `/docs/cartelera/` | No | Contrato OpenAPI (Swagger UI) del servicio de cartelera | 200 |
| GET | `/docs/reservas/` | No | Contrato OpenAPI (Swagger UI) del servicio de reservas | 200 |

Ejemplo de creación de una reserva:

```bash
curl -i -X POST http://localhost:8000/v1/reservas \
  -H "Content-Type: application/json" \
  -H "apikey: poc-taquilla-demo-key" \
  -d '{"funcionId":"F001","nombre":"Ana Gómez","email":"ana.gomez@example.com","sillas":2}'
```

Respuesta esperada (201):

```json
{
  "id": "6f1c2a3e-...",
  "funcionId": "F001",
  "nombre": "Ana Gómez",
  "email": "ana.gomez@example.com",
  "sillas": 2,
  "estado": "CONFIRMADA",
  "fechaCreacion": "2026-10-30T16:00:00.000Z"
}
```

## Configuración del gateway

Toda la configuración de Kong está en `kong/kong.yml`. Kong corre en modo DB-less, por lo que no necesita base de datos y la configuración completa queda versionada en el repositorio junto con el código.

### Services y routes

| Service | Destino | Route | Métodos |
|---|---|---|---|
| `cartelera` | `http://servicio-cartelera:3000` | `/v1/funciones` | GET |
| `reservas` | `http://servicio-reservas:3000` | `/v1/reservas` | GET, POST |
| `cartelera-docs` | `http://servicio-cartelera:3000/docs` | `/docs/cartelera` | Todos |
| `reservas-docs` | `http://servicio-reservas:3000/docs` | `/docs/reservas` | Todos |

Las rutas de negocio usan `strip_path: false`, por lo que la ruta llega al servicio igual a como la envía el cliente. Las rutas de documentación sí quitan el prefijo, para que `/docs/cartelera/` llegue al servicio como `/docs/`.

### Plugins

| Plugin | Alcance | Configuración | Para qué |
|---|---|---|---|
| `key-auth` | Ruta `reservas-v1` | Header `apikey`, `hide_credentials: true` | Solo los consumidores registrados pueden crear o consultar reservas. Kong quita la API key antes de enviar la solicitud, por lo que el servicio nunca la recibe. |
| `rate-limiting` | Ruta `reservas-v1` | 5 solicitudes por minuto por consumidor, política `local` | Protege el servicio de reservas de un uso excesivo. Al superar el límite Kong responde 429. |
| `correlation-id` | Global | Header `X-Correlation-ID`, generador `uuid#counter`, `echo_downstream: true` | Cada solicitud lleva un identificador único que también se devuelve al cliente, lo que permite rastrear una transacción de punta a punta. |

### Consumidor

Hay un único consumidor, `app-taquilla`, con la API key `poc-taquilla-demo-key`. Esta clave es solo de demostración y no se debe usar en ningún ambiente real.

### Timeouts y reintentos

Los dos services tienen un `connect_timeout` de 2 segundos y un `read_timeout` y `write_timeout` de 5 segundos, para que una llamada a un servicio lento no deje la solicitud bloqueada indefinidamente.

Los reintentos se configuraron de forma distinta en cada service. Cartelera tiene `retries: 2`, ya que solo expone consultas GET, que son idempotentes, y repetirlas no cambia nada. Reservas tiene `retries: 0`, porque crear una reserva es un POST que no es idempotente, y si Kong lo reintentara después de un timeout podría terminar creando la misma reserva dos veces.

### Admin API

La Admin API de Kong se publica solo en `127.0.0.1:8001`, para poder inspeccionar la configuración cargada sin exponerla a la red:

```bash
curl http://localhost:8001/services
curl http://localhost:8001/routes
```

## Servicios

Los dos servicios están hechos en NestJS y siguen la misma estructura: un módulo por recurso, con su controller, su service y sus DTOs. Ambos usan versionado por URI (`/v1/...`) y publican su contrato OpenAPI con `@nestjs/swagger` en `/docs`. Los datos se guardan en memoria, ya que el objetivo de la POC es el gateway y no la persistencia.

### servicio-cartelera

Expone las funciones del teatro. Tiene tres funciones fijas (`F001`, `F002` y `F003`), cada una con su obra, sala, fecha y cantidad de sillas disponibles. Si se consulta un id que no existe responde 404 con el mensaje `La función <id> no existe`.

### servicio-reservas

Recibe y consulta reservas. Al crear una reserva genera un id UUID, la guarda con estado `CONFIRMADA` y registra la fecha de creación. Los datos de entrada se validan con un `ValidationPipe` global configurado con `whitelist` y `forbidNonWhitelisted`, por lo que cualquier campo que no esté en el DTO hace que la solicitud responda 400.

| Campo | Tipo | Regla |
|---|---|---|
| `funcionId` | string | Obligatorio, no vacío |
| `nombre` | string | Entre 2 y 100 caracteres |
| `email` | string | Correo con formato válido |
| `sillas` | entero | Entre 1 y 6 |

## Pruebas

### Pruebas unitarias

Cada servicio tiene pruebas unitarias con Vitest. Para correrlas:

```bash
cd servicio-cartelera
npm install
npm test
```

```bash
cd servicio-reservas
npm install
npm test
```

En cartelera se prueban el service (listar, consultar por id y la respuesta 404) y el controller. En reservas se prueban el service (creación con estado `CONFIRMADA`, consulta por id y la respuesta 404) y las reglas de validación del DTO de creación.

### Colección de Postman

La colección `postman/poc-arquitectura.postman_collection.json` tiene todos los endpoints organizados en cuatro carpetas, y cada solicitud trae tests que validan el código de respuesta esperado:

1. **Cartelera (pública):** listar funciones, consultar `F001` y consultar una función inexistente.
2. **Reservas (protegida):** crear una reserva sin API key (401), con una API key inválida (401), una reserva válida (201), consultar la reserva creada (200) y una reserva con datos inválidos (400).
3. **Rate limiting:** una solicitud de creación de reserva para ejecutar en ráfaga.
4. **Contratos (OpenAPI):** la documentación de cada servicio.

La colección usa las variables `baseUrl` (`http://localhost:8000`), `apiKey` (`poc-taquilla-demo-key`) y `reservaId`, que se llena automáticamente al crear la reserva válida.

Para probar el rate limiting se debe ejecutar la carpeta 3 con el Collection Runner de Postman, con 6 iteraciones. Las primeras cinco responden 201 y la sexta 429. Como el límite es por minuto, si antes se ejecutaron otras solicitudes de reservas, conviene esperar un minuto antes de correrla.

## Decisiones de diseño

**Gateway sin lógica de negocio.** Kong solo tiene enrutamiento, autenticación, límite de solicitudes y trazabilidad. Las reglas de negocio, como la validación de las reservas, se quedan en los servicios, para evitar que el gateway se convierta en un cuello de botella difícil de mantener.

Los servicios no publican puertos, por lo que el único camino para consumirlos es a través de Kong, y así las políticas de seguridad se aplican en un solo lugar. Las políticas también son distintas por ruta: la cartelera es pública porque solo expone información de consulta, mientras que las reservas requieren API key y tienen límite de solicitudes, ya que crean datos.

Los reintentos solo se permiten en operaciones idempotentes, como se explicó en la sección de timeouts y reintentos. Además, cada servicio publica su contrato OpenAPI y las rutas están versionadas desde el inicio, para que un cambio incompatible pueda salir en una nueva versión sin afectar a quienes ya consumen la `v1`.

Por último, elegí Kong en modo DB-less porque la configuración queda en un archivo que se puede versionar y revisar junto con el código, y porque el mismo `docker-compose.yml` levanta la POC igual en cualquier computador.

## Limitaciones

Esta es una prueba de concepto, por lo que tiene simplificaciones que no serían adecuadas para producción:

- Los datos de los servicios están en memoria y se pierden cada que se reinicia un contenedor.
- La API key está en texto plano dentro de `kong.yml`. En un ambiente real debería manejarse como un secreto, por ejemplo con un gestor de secretos o un vault.
- La política del rate limiting es `local`, es decir que el contador vive en cada nodo de Kong. Si se tuvieran varios nodos, cada uno llevaría su propia cuenta, y lo adecuado sería usar una política compartida como `redis`.
- La comunicación es por HTTP. En producción el gateway debería exponer HTTPS.
- No hay validación entre servicios: reservas no verifica que la función exista en cartelera, ya que en esta POC los dos servicios son independientes.

## Uso de inteligencia artificial

El código de esta POC y este README se generaron con apoyo de Claude (Anthropic). Yo definí el escenario, la tecnología, la arquitectura y las buenas prácticas que debía cumplir la implementación, y a partir de eso Claude Code generó los servicios, la configuración de Kong, las pruebas y la colección de Postman, que luego revisé.

## Autora

Yesenia López Giraldo, Maestría en Ingeniería de Software, Universidad de Medellín, 2026.
