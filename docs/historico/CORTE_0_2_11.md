> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# Fractalear — Corte de referencia 0.2.11

Fecha documental: **14 de noviembre de 2026**. Versión de la aplicación: **0.2.11**.

[Aplicación publicada](https://jncubillosn-lab.github.io/LAB4.0-Fractaleando/?v=0.2.11) ·
[Guía de uso](../GUIA_USO.md) · [Antecedentes](INDICE_Y_ALCANCE_INICIAL.md).

## 1. Propósito y alcance del corte

Fractalear permite construir un diagrama de conceptos, desarrollar sus
descendientes y crear relaciones entre términos. La disposición espacial cambia
para facilitar la lectura; los conceptos y vínculos conservan su identidad.

Este documento fija el estado alcanzado y aceptado funcionalmente por el usuario
al cierre de 0.2.11. Registra lo que existe, las decisiones expresas y las
limitaciones comprobadas. No introduce funciones, requisitos ni una nueva etapa
de desarrollo. Tampoco declara resueltos los pendientes normativos de las vistas
derivadas.

La referencia de código es el commit
[`c63ea9095eb35ee107d1413c092766a4b23cb6bf`](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/commit/c63ea9095eb35ee107d1413c092766a4b23cb6bf),
integrado mediante el [PR 24](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/pull/24).
Una actualización posterior de documentación no cambia por sí sola esta versión
funcional.

## 2. Representaciones disponibles

| Vista visible | Función y comportamiento vigente |
| --- | --- |
| **01 Editor** | Crear, editar, mover y conectar conceptos. La posición de un cuadro y las caras de sus puertos pueden cambiar durante la edición. |
| **02 Compacto** | Redistribuir el mismo grafo en ramas radiales compactas, con distancias según los cuadros, el contenido y el espacio disponible. Es una vista de lectura. |
| **03 Espiral** | Girar la organización compacta, con un brazo por cada hijo real del núcleo. Es una vista de lectura. |

El núcleo conceptual es **J0**. Sus hijos reales son **J1** y determinan el número
de brazos; el ejemplo comienza con tres, pero ese número no es un límite del
motor. La descendencia sigue el parentesco registrado. Un vínculo transversal
no sustituye al padre de un concepto.

El grafo completo se muestra al iniciar y al importar. La profundidad máxima se
obtiene del contenido real. El filtro, la selección, el zoom y el desplazamiento
de cámara reutilizan la geometría existente.

El identificador interno de Espiral continúa siendo `04` para conservar la
compatibilidad. La antigua vista Órbitas no es una cuarta vista disponible.

## 3. Decisiones de funcionamiento consolidadas

### Edición y rendimiento

Mover un cuadro en 01 conserva sus vínculos, padre e identidad, aunque cambien
las posiciones relativas, los cruces o las caras de entrada y salida. Un puerto
no funciona como ancla fija del editor. Se mantiene la prevención de solapar
cuadros y la validación de los recorridos.

El punto de control permite recalcular las rutas incidentes al cuadro modificado
y las que colisionan con su nueva caja. Las rutas ajenas se conservan. Esto evita
reconstruir la distribución inicial con cada edición.

El Editor puede adoptar una disposición completa y comprobada como su referencia
actual. Compacto y Espiral se siguen comparando contra la referencia de 01;
no convierten su propio resultado en prueba de conservación topológica. Los
controles de creación, edición y arrastre permanecen deshabilitados en ellas.

### Creación y selección

«+ Concepto» conserva seleccionado el padre, permitiendo crear varios hermanos
seguidos. La colocación avanza en pasos de **3:30** del reloj: 12, 3:30, 7,
10:30, 2, 5:30… En cada incorporación se evalúan los dos siguientes rayos y se
elige la posición disponible más cercana. La secuencia puede saltar el primer
candidato si el segundo es mejor; `clockStep` conserva el paso utilizado.

La salida y la entrada se eligen juntas, buscando caras enfrentadas y una recta
cuando hay espacio. La reflexión es una preferencia geométrica: un obstáculo o
un puerto ocupado pueden exigir otra cara válida.

En 01 la selección resalta el cuadro y sus conexiones directas. En 02 y 03 se
resaltan además la ascendencia real hasta J0 y todos los vecinos directos del
seleccionado, incluidos hijos y vínculos transversales. Por ejemplo, seleccionar
J3 resalta su ruta J0–J1–J2–J3 y los J4 conectados directamente.

### Lectura, tipografía y conexiones

| Elemento | Valor o comportamiento en 0.2.11 |
| --- | --- |
| Tipografía | Rajdhani, tamaño fijo de **24 unidades del diagrama**, con pesos 600 y 700. El zoom y la escala de exportación modifican su tamaño visible. |
| Márgenes del texto | **14** a cada lado y **9** arriba y abajo. |
| Ancho del cuadro | Como mínimo, el ancho solicitado o el de la palabra más larga más sus márgenes, el que resulte mayor. Se mide también el peso de selección. |
| Renglones | Las frases se reparten entre palabras; el cuadro crece en altura. Una palabra larga ensancha el cuadro y permanece completa. |
| Grosor de vínculo | Mínimo **1,35**, máximo **3,15** en la escala jerárquica; mayor cerca de J0 y menor hacia las hojas. El resaltado añade **0,75**. |
| Casos de grosor | La escala usa toda la jerarquía y no cambia con el filtro. Con una sola generación se conserva el mínimo. Los vínculos sin parentesco directo usan el mínimo base. |
| Estilos de vínculo | Continua por defecto, Punteada y Segmentada. La elección afecta nuevas conexiones y se guarda por vínculo; no modifica los cuadros ni define un parentesco. |
| Cruces | Las tres vistas comparten franjas blancas proporcionales al trazo superior: una máscara de **3 veces** su grosor deja un grosor de margen a cada lado del trazo. La máscara sigue los guiones, el zoom y la selección. |
| Giros y puertos | Trazado horizontal, vertical y biseles de 45°. Se evitan puertos pegados a las esquinas y rodeos innecesarios; los cruces pueden quedar junto a un giro. |

La aproximación J0–J1 usa un factor objetivo **0,5** sobre el hueco de referencia
entre bordes. El margen físico rectangular de **24** puede limitar esa reducción,
también en diagonales. La preferencia de compacidad no elimina el control de
colisiones.

### Espiral conservada y experimento retirado

Los valores mostrados por la espiral vigente son **Giro = 0,25**,
**Apertura = 0,85** y **T = 0**. Son parámetros del algoritmo actual, no una
implementación completa de los parámetros biológicos W–D–T de Raup.

El experimento W–D–T se retiró por indicación del usuario después de provocar
fallos de estabilidad. Se recuperaron desde GitHub los archivos de 0.2.8, no se
reconstruyeron de memoria. Los archivos de espiral, escena derivada y trazado
recuperados se identifican en [el registro de 0.2.10](EDITOR_LIBRE_0_2_10.md).
En 0.2.11 se ajustó el margen de colocación radial junto al núcleo para que
coincida con su auditoría independiente.

## 4. Guardado y exportación

**Guardar JSON** conserva el modelo editable y los estados geométricos disponibles.
**Abrir JSON** restaura el grafo; las posiciones, rutas y cachés se comprueban antes
de reutilizarse. El esquema conceptual continúa siendo `p1.graph.v1`.

| Campo | Contenido |
| --- | --- |
| `nodes` | Conceptos con identificador, texto, padre, rama, ancho solicitado y posición; el paso de reloj puede aparecer en conceptos creados. |
| `edges` | Extremos de cada vínculo y, opcionalmente, estilo y datos heredados como `kind`. |
| `planeCheckpoint` | Posiciones y recorridos con puertos del Editor. Es opcional. |
| `topologyRegister` | Referencia de relaciones y cruces, separada de las coordenadas. Es opcional. |
| `derivedViews` | Datos de recuperación de vistas derivadas, sujetos a validación. Es opcional. |

Si una geometría guardada no resulta válida se reconstruye sin descartar los
datos conceptuales válidos. Para archivos de 0.2.8–0.2.10 también se comprueban
las dimensiones de texto anteriores antes de ampliar localmente los cuadros.
Las posiciones editadas se conservan cuando hay espacio; una ampliación que
colisione puede necesitar recolocación. Un archivo conceptual malformado puede
ser rechazado con un aviso.

**Exportar vista SVG** produce una imagen vectorial de la vista actual, con
tipografía y estilos incorporados. **Exportar grafo completo · PNG 4K** incluye
todos los conceptos y vínculos de la representación activa, aunque el filtro o
la cámara oculten parte de ellos. Su lado mayor mide **4096 píxeles** y el otro
respeta la proporción del grafo; no es un formato fijo de 4096 × 2160.

El PNG comprueba que las rutas estén resueltas. Incluye el aviso normativo cuando
corresponde. El tamaño final de letra depende de la escala necesaria para encajar
todo el grafo: la comprobación del ejemplo no garantiza legibilidad ilimitada
para cualquier cantidad de contenido. JSON conserva la edición; SVG conserva
una representación vectorial.

## 5. Arquitectura que sostiene este corte

La aplicación es estática y se publica en GitHub Pages. Utiliza HTML, CSS,
módulos JavaScript, SVG, fuentes locales y el motor de rutas libavoid en WASM.
Los cálculos de las vistas se ejecutan en Workers; la representación y los
controles se coordinan desde la aplicación.

| Responsabilidad | Archivos principales |
| --- | --- |
| Modelo, descendencia y filtro | [`GraphDocument.js`](../../js/core/GraphDocument.js), [`HierarchySelection.js`](../../js/core/HierarchySelection.js). |
| Geometría persistente y referencia | [`PlaneCheckpoint.js`](../../js/core/PlaneCheckpoint.js), [`TopologyRegister.js`](../../js/core/TopologyRegister.js), [`DerivedTopology.js`](../../js/core/DerivedTopology.js). |
| Colocación | [`ClockPlacement.js`](../../js/geometry/ClockPlacement.js), [`RayPackingLayout.js`](../../js/geometry/RayPackingLayout.js), [`RadialLayout.js`](../../js/geometry/RadialLayout.js), [`SpiralLayout.js`](../../js/geometry/SpiralLayout.js). |
| Trazado y auditoría | [`PcbRouter.js`](../../js/geometry/PcbRouter.js), [`AvoidRouter.js`](../../js/geometry/AvoidRouter.js), [`GeometryValidator.js`](../../js/geometry/GeometryValidator.js), [`CircuitRoutes.js`](../../js/geometry/CircuitRoutes.js). |
| Medición y dibujo compartidos | [`NodeTypography.js`](../../js/ui/NodeTypography.js), [`CircuitSvg.js`](../../js/ui/CircuitSvg.js), [`HierarchyStroke.js`](../../js/ui/HierarchyStroke.js), [`LinkStyles.js`](../../js/ui/LinkStyles.js). |
| Vistas, exportación y coordinación | [`DerivedViews.js`](../../js/views/DerivedViews.js), [`PngExport.js`](../../js/ui/PngExport.js), [`app.js`](../../js/app.js). |
| Construcción y publicación | [`build-site.mjs`](../../scripts/build-site.mjs), [flujo de GitHub Actions](../../.github/workflows/tests.yml). |

La construcción genera `_site/` y asigna una identidad común de caché a módulos,
Workers, fuentes y WASM. Una caché geométrica de otra referencia o de un
experimento descartado no se acepta por el solo hecho de existir en un JSON.

## 6. Evidencia y límites comprobados

La [ejecución de publicación de 0.2.11](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/actions/runs/43649825686)
terminó correctamente: **71 pruebas Node**, tres suites de Chrome y publicación
en Pages. Las comprobaciones cubren:

- El ejemplo PPR completo: **210 conceptos y 217 vínculos**, con sus rutas en
  las tres vistas, sin solapes de cuadros ni rutas pendientes en el caso ensayado.
- Selección, vínculos transversales, estilos y grosores; filtros y cámara sin
  reconstrucción geométrica; edición libre con rutas ajenas conservadas.
- Palabras completas, tamaño de letra y márgenes; SVG autónomo y PNG completo
  con lado mayor de 4096 píxeles.
- Migración de un [JSON real exportado desde 0.2.10](../../tests/fixtures/word-wrap-0.2.10.json),
  con el núcleo movido por debajo de sus hijos, conservando sus posiciones.
- El [caso de cuadro ampliado y margen diagonal del núcleo](../../tests/fixtures/expanded-word-layout.json)
  que reveló la diferencia entre colocación y auditoría.

Las suites son [`pages_e2e.py`](../../tests/pages_e2e.py),
[`views_e2e.py`](../../tests/views_e2e.py) y
[`topology_guard_e2e.py`](../../tests/topology_guard_e2e.py). Verifican casos concretos;
su aprobación no demuestra que cualquier grafo o movimiento tenga solución.

**Pendientes conservados:** Compacto y Espiral siguen **EN REVISIÓN** por
discrepancias topológicas frente a 01 y por la cota de cercanía de dos alturas
(2H), entre otros diagnósticos normativos que informa la vista. Una distribución
puede ser legible y físicamente trazable sin cumplir toda la normativa.
El enrutador también puede agotar sus intentos en otros casos; una ruta no
resuelta se informa como pendiente, no se inventa ni se considera aprobada.

El número de cruces depende de la geometría y de la referencia concreta.
Los **71 cruces** de una referencia histórica no son el número de pruebas ni
una constante exigida para el Editor libre.

## 7. Continuidad documental

Este corte es la entrada para consultar el funcionamiento actual. La
[memoria de noviembre 13](MEMORIA_PROYECTO_P1.md), las
[normas jerarquizadas v0.1](NORMAS_JERARQUIZADAS_P1.md) y los registros por versión
se conservan como antecedentes. Las aclaraciones posteriores del usuario sobre
edición libre, numeración visible y retirada de W–D–T están recogidas aquí.

Los cambios posteriores pueden registrarse con su versión, solicitud de origen,
comportamiento resultante, archivos afectados, evidencia y pendientes. Este
registro no convierte una propuesta o un experimento retirado en trabajo
autorizado pendiente.
