# XERJ Companion

[English](README.md) · **Español**

**Interfaz complementaria gratuita, experimental y de código abierto para [XERJ](https://github.com/xerj-org/xerj)**. Proyecto comunitario de **[@pilahito](https://github.com/pilahito)**, propuesto en el [issue #1755 de XERJ](https://github.com/xerj-org/xerj/issues/1755). No cuenta con el respaldo de XERJ.

![Concepto de interfaz](https://github.com/user-attachments/assets/c32bc0f0-00b7-4940-aafb-537e4ed289fc)

> La imagen es una maqueta ilustrativa. La interfaz real es un diseño más sencillo en azul marino y violeta.

## Inicio rápido

Requiere **Python 3.9+**. Sin paquetes pip ni APIs de pago.

1. Arranca tu endpoint local de búsqueda de XERJ en `http://127.0.0.1:9200` siguiendo las instrucciones de XERJ. La búsqueda necesita un corpus indexado.
2. Opcionalmente, instala [Ollama](https://ollama.com/download) para el chat local y las descargas de modelos.
3. Ejecuta `python3 server.py --port 8765`.
4. Abre **http://127.0.0.1:8765** en el navegador.
5. Ejecuta `python3 -m unittest discover -v` para lanzar las pruebas.

La interfaz viene en inglés y en español: el botón ES/EN de la cabecera cambia el idioma y recuerda la elección (por defecto usa el idioma del sistema).

La búsqueda funciona sin Ollama. El panel **Hardware e IA** muestra la CPU y datos básicos de RAM/GPU, los modelos de Ollama instalados y permite descargar un modelo solo cuando se pide explícitamente. Las descargas necesitan conexión a Internet y espacio libre en disco.

## Límites del proyecto

- Solo escucha en localhost; **no está pensado para despliegue público**. Sin cuentas, autenticación ni telemetría.
- No modifica XERJ. Su endpoint de búsqueda usa una consulta compatible con Elasticsearch, que debe comprobarse contra la versión y el mapping de índices que tengas configurados.
- Es un **prototipo**; no se reclama una integración de producción validada.
- Copyright 2026 pilahito. Código ofrecido bajo Apache License 2.0, ver [LICENSE](LICENSE).
- Ivan y los mantenedores de XERJ pueden evaluarlo, adaptarlo o distribuirlo con la atribución aplicable. La revisión y los derechos de contribución son suyos. Puedo archivar el repositorio independiente si la propuesta no resulta relevante.
