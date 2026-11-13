# P1 — Representaciones 02, 03 y 04

**Estado de 02 (13 de noviembre de 2026):** **no resuelta / desarrollo detenido**. Las deformaciones experimentales preservaron la topología pero no consiguieron el crecimiento radial y la compactación requeridos. Las vistas 03 y 04 conservan su alcance propio.

## Principio invariable

El grafo conceptual es **uno solo**. Las vistas 02–04 no pueden crear, editar ni eliminar conceptos o vínculos, y no alteran el punto de control de 01. El plano original continúa siendo la vista de edición. Filtrar profundidad, hacer zoom o desplazar la cámara no recalcula recorridos.

La jerarquía utilizada en 03 y 04 es la **menor distancia en número de vínculos hasta P1**, obtenida por búsqueda en anchura sobre el grafo no dirigido. No se inventan relaciones: los componentes desconectados quedan etiquetados y situados en una banda periférica visual sin asignarles un camino artificial al origen.

## 02 · Compacto — norma vigente y resultado real

**Documentación:** [P1-ET-02.md](P1-ET-02.md) · [ESTADO_02_CONGELADO.md](ESTADO_02_CONGELADO.md) · [ISOTOPIA_AMBIENTAL_02.md](ISOTOPIA_AMBIENTAL_02.md).

02 **no** es una compresión de las columnas de 01. Debe mostrar J0 central, un sector por J1 y todas sus descendencias, crecimiento angular desde el núcleo, radios jerárquicos progresivos y un conjunto visualmente integrado.

Orden de normas: **(1)** preservar por construcción la inmersión completa de 01, incluidos puertos, rutas y cruces; **(2)** sectores J1; **(3)** máximo radio de Jk menor que el mínimo de J(k+1); **(4)** menor longitud real de recorridos y compacidad genuina.

Los hermanos pueden adoptar distancias distintas, y ningún ángulo —incluidos 40°— es una constante obligatoria. Ningún movimiento puede reconstruir enlaces a posteriori tras recolocar cuadros.

**No está aprobado:** el prototipo pudo preservar 217 rutas y 71 cruces del PPR, pero no cumplió conjuntamente sectores, orden radial y compacidad. La última alternativa mostraba una base de 01 comprimida, no una vista radial, y fue rechazada visualmente pese a sus métricas de ahorro.

El código del ensayo queda aislado en el PR #11, en borrador y sin fusionar; el desarrollo de 02 está detenido.

## 03 · Órbitas

Todos los conceptos de una misma jerarquía conectada comparten exactamente el **mismo radio**. La capacidad de cada órbita determina su radio mínimo, teniendo en cuenta dimensiones medidas de los cuadros y densidad angular por brazo.

El orden angular se establece por parentesco y se ajusta con barridos baricéntricos que favorecen la proximidad de conceptos con vínculos en jerarquías adyacentes. Los sectores conservan el brazo de origen; un vínculo transversal no cambia el progenitor.

La condición radial se valida después del cálculo, sin sustituir el significado de jerarquía por distancias arbitrarias.

## 04 · Espiral plana de brazos variables

El número de brazos es **exactamente el número de términos J1** que nacen de P1: tres para el ejemplo original, cuatro después de agregar un cuarto término J1, etcétera.

El radio de cada nivel puede variar dentro de su intervalo, pero para cada par de jerarquías consecutivas debe cumplirse:

\`máx(radio de Jn) < mín(radio de J(n+1))\`

Una progresión angular produce los brazos espirales. Los parámetros geométricos de la implementación se denominan W (progresión angular), D (variación radial intrajerárquica) y T (traslación axial): **T = 0**, porque el diagrama es completamente plano. W y D son parámetros internos, **no nuevas normas rígidas**. Se pueden ajustar experimentalmente sin modificar vínculos o jerarquías.

## Enrutamiento y validez

Todas las vistas heredan las reglas R01–R08: rutas exclusivas, cuadros ajenos inviolables, puertos propios y cruces inequívocos.

- La distribución se calcula sin modificar datos.
- El Worker de P1 recibe rectángulos medidos, posiciones y jerarquía propias de la vista.
- El motor experimental **02 no vuelve a enrutar**: transforma todas las rutas existentes de 01 mediante deformaciones ambientales certificadas; puede producir tramos oblicuos. 01, 03 y 04 conservan sus enrutamientos y controles particulares.
- Antes de declarar válida una vista se exige **cero cuadros solapados, cero rutas inválidas, cero puertos repetidos y cero vínculos pendientes**. Para **02**, además: inmersión topológica idéntica a 01, sectores completos, radios estrictos en todos los niveles y rutas realmente más cortas. Su auditoría admite trayectos oblicuos.
- Si alguna conexión no se puede resolver, su relación conceptual sigue existiendo, pero no se dibuja una ruta ficticia. La vista anuncia expresamente **«En revisión»** y los vínculos pendientes.

### Registro topológico por vista

La topología conceptual (identidad de nodos y vínculos) es igual en las cuatro vistas. La inmersión gráfica contiene adicionalmente puertos, continuidad de rutas, pares y secuencias de cruces.

**02 tiene un requisito específico:** preservar **la inmersión original validada de 01** por una transformación completa del plano. Se permite cambiar la posición y el orden cartesiano X/Y de los cuadros, porque eso no es por sí solo un invariante topológico. No se permite reconstruir libremente rutas, cambiar pares u orden de cruces ni perder conexiones.

**03 y 04** conservan sus mecanismos y criterios topológicos particulares, sin importarles automáticamente la exigencia específica de 02.

01 sigue siendo la única vista editable. Los checkpoints históricos de 02 son experimentales y no se restauran como representaciones aprobadas. Una vista visible «En revisión» no implica aceptación.

## Modo oscuro

El cambio de tema solo cambia variables de color CSS y colores de exportación de SVG/PNG. No altera posiciones, métricas, rutas ni jerarquías. Se conserva la lectura de dos tintas y el estilo gráfico previo.

## Archivos

- `js/geometry/AmbientIsotopy.js`, `EmbeddedTopology.js`, `AxisCorridorWarp.js`: transformaciones y auditoría topológicas de 02.
- `js/geometry/CertifiedCompact02.js`, `CertifiedMovePlanner.js`, `CompactObjectives.js`, `CompactSectorOptimizer.js`, `CertifiedPreviewFallback.js`: planificador experimental y presentación provisional; no equivalen a 02 aprobada.
- `js/workers/ambient-02.worker.js`, `js/views/DerivedViews.js`: cálculo y presentación de la vista experimental.
- `js/geometry/ViewLayouts.js`, `js/workers/initial-route.worker.js`, `js/core/TopologyRegister.js`: componentes existentes de las demás vistas.
- `tests/ambient-isotopy.test.js`, `tests/views_e2e.py`: pruebas parciales de topología, geometría y navegador; **no demuestran haber resuelto el objetivo completo de 02**.

## Requisitos de aprobación

No basta con cuatro pestañas ni con CI exitoso: cada vista debe cumplir **todas sus normas** y superar los controles de integridad. **02 todavía no satisface sus cuatro prioridades**. La previsualización «En revisión» no es su aprobación.
