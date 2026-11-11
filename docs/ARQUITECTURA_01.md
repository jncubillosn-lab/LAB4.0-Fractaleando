# P1 / 01 Plano — Arquitectura de implementación

**Alcance:** programa existente de diagramas conceptuales, etapa 01. No contiene vistas futuras ni una migración de datos conceptual.

## Invariantes

- El nodo J0 permanece único; la cantidad de hijos J1 es variable (R01).
- La selección y el filtro de profundidad no recalculan geometría ni cambian coordenadas.
- Cada vínculo posee una ruta, puertos propios y una representación visual; si no hay ruta válida permanece pendiente, nunca se inventa una.
- Los cuadros y rutas válidos constituyen el punto de control incremental. JSON conserva el modelo y, opcionalmente, el punto de control.
- La interfaz, los textos y los datos del ejemplo no se regeneran durante el cálculo del Worker.

## Dependencias y responsabilidad

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Documento HTML y controles existentes; carga módulos locales. |
| `css/interfaz.css` | Estética previa sin rediseño. |
| `js/data/seeds.js` | Estructura de ejemplo PPR que ya existía. |
| `js/core/GraphDocument.js` | Consultas de grafo, jerarquía y visibilidad; conserva componentes desconectados. |
| `js/core/PlaneCheckpoint.js` | Estado de geometría fijada y serialización. |
| `js/geometry/PcbRouter.js` | Búsqueda de rutas y sus obstáculos; mismo núcleo de trazado de la versión vigente. |
| `js/geometry/GeometryValidator.js` | Validación independiente para rutas y puertos; controla aceptación de JSON. |
| `js/ui/SvgRenderer.js` | Pinta los recorridos existentes sin calcular caminos; cruces con saltos diferenciados. |
| `js/workers/initial-route.worker.js` | Calcula rutas iniciales con datos serializables y responde al hilo principal. |
| `js/app.js` | Coordina edición y eventos, reconciliación incremental, renderizado y exportación. |

## Secuencia de una carga inicial

1. El navegador carga el HTML, el CSS y el módulo de aplicación.
2. El hilo principal mide el texto y distribuye cuadros con la geometría existente.
3. Se entrega al Worker el conjunto de nodos, vínculos, cuadros y jerarquías; no se entrega DOM.
4. El Worker devuelve las rutas. La aplicación ignora respuestas obsoletas de una revisión anterior.
5. Se consolida el punto de control, se representa SVG y se ajusta la vista inicial.
6. Si el Worker no está disponible, se ejecuta el mismo cálculo como alternativa en el hilo principal.

## Secuencia de un cambio local

1. Se modifica únicamente el modelo que corresponde a la operación solicitada.
2. Se determina cuáles cuadros o rutas quedan afectados y se conservan las rutas restantes.
3. El motor busca rutas para los vínculos afectados, evitando los obstáculos ya fijados.
4. Se consolida un nuevo punto de control y se actualiza SVG.
5. Filtrar por profundidad, seleccionar y desplazar la cámara solo cambian la visualización.

## Validación de importación

`p1.graph.v1` sin `planeCheckpoint` es válido: se hace un cálculo inicial. Si existe `planeCheckpoint`, las posiciones, rutas y puertos deben respetar la geometría real de los cuadros. La geometría malformada se descarta y se reconstruye; **no se descartan los datos conceptuales válidos**.

## Pruebas y publicación

- `npm test`: controles independientes de jerarquía, R01, continuidad de rutas, puertos repetidos, módulos publicados y reproducción de 217 vínculos del ejemplo.
- `tests/pages_e2e.py`: prueba en navegador de la entrada real de GitHub Pages, Worker, lectura de capas, auditoría y guardado.
- `P1_Plano_R01_brazos_variables.html`: versión original intacta como referencia, sin ejecutar ni mezclar con el nuevo motor.
- `.github/workflows/tests.yml`: pruebas en cada solicitud de incorporación a `main`.

**Límite conocido:** un movimiento complejo puede dejar vínculos pendientes. No se declara imposible ese recorrido; simplemente el enrutador no lo resolvió dentro de sus intentos. Su solución futura debe ser una intervención medida y justificada, no una expansión automática del alcance.
