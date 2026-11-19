# Cierre de desarrollo · Fractalear 1.3.5

Fecha: **16 de noviembre de 2026**. El responsable da por terminado el desarrollo
y descarta toda ruta futura que no forme parte de esta entrega. No hay funciones
planificadas, etapas abiertas ni una lista de trabajo pendiente. El estado de entrega se determina únicamente mediante el código y la documentación vigentes.

## Documentación en código y ejemplo vigente

El código documenta responsabilidades de datos, geometría, interfaz, tareas,
archivos y biblioteca. El botón **Ejemplo** carga un grafo del propio programa,
con **300 conceptos y 301 vínculos**, incluidos 100 cuadros que explican
funciones y métodos de 30 módulos. La disposición proviene del editor y
se abre con el contrato de archivo vigente. Su presencia no certifica que
todas las condiciones geométricas estén resueltas.

El [catálogo de funciones](evidencias/FUNCIONES_EJEMPLO_1_3_5.json) y la
[comprobación del ejemplo](evidencias/EJEMPLO_PROGRAMA_1_3_5.json) corresponden
a la entrega actual. Las pruebas cubren la construcción y las tres vistas.

## Alcance entregado

- Editor con un solo núcleo inicial, conceptos y vínculos, posición libre,
  selección, jerarquías, estilos de conexión e historial.
- Lectura del mismo grafo en Compacto y Espiral, profundidad completa inicial,
  encuadre y conservación de las comprobaciones geométricas y topológicas.
- Texto de tamaño fijo con palabras completas, grosores por jerarquía y cruces
  con franjas blancas proporcionales.
- Importación y exportación del documento `p1.graph.v1`, SVG y PNG de 4096
  píxeles en el lado mayor. El identificador interno `04` permanece por
  compatibilidad con los documentos existentes.
- Biblioteca pública opcional en Drive. El visitante escribe solo el nombre;
  únicamente **Sí** en el tercer paso envía el JSON. No hay borrado ni
  sobrescritura para visitantes. La alternativa local conserva el archivo.
- Carga con viñetas fijas del castor, diecisiete citas con inicio aleatorio,
  modos claro y oscuro y cuatro controles de cámara.

La [guía de uso](GUIA_USO.md) describe la operación. Las instrucciones de la
[biblioteca](BIBLIOTECA_DRIVE.md) y de [reproducción](MANTENIMIENTO.md) permiten
operar y conservar la entrega existente; no constituyen un plan de ampliación.

## Límites de la entrega

Compacto y Espiral conservan los avisos de revisión cuando detectan diferencias
topológicas o separaciones superiores a la cota ensayada. Una operación puede
agotar sus intentos y dejar una ruta pendiente; los datos conceptuales se
conservan y se informa el resultado. El texto del PNG depende de la escala
necesaria para encajar el grafo completo.

La disponibilidad de GitHub Pages, Google Drive y las fuentes enlazadas de
los poemas depende de sus proveedores. La biblioteca es pública; retirar un
archivo no elimina copias ya descargadas. Para solicitar su retirada, escribir
a **jeducubillosn@gmail.com**. Esos límites no se presentan como solucionados
por cerrar el desarrollo ni se convierten en tareas futuras.

## Comprobación vigente

La entrega se verifica con las **111 pruebas Node y cinco suites de Chrome**.
Las comprobaciones incluyen documento y topología, vistas, geometría,
Workers, archivos, exportación y consentimiento de la biblioteca pública.
El código no se modifica por la mera presencia de alertas; estas quedan
visibles y han de contrastarse con las garantías reales del motor.

La versión pública de referencia es **1.3.5**. Las pruebas y el despliegue
se verifican desde `main`, sin recuperar implementaciones descartadas.
