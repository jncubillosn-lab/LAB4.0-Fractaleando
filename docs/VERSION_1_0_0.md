# Fractalear · Versión 1.0.0

Fecha del cierre: **15 de noviembre de 2026**. Base funcional: **0.2.15**,
publicada mediante el [PR 29](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/pull/29).

[Aplicación](https://jncubillosn-lab.github.io/LAB4.0-Fractaleando/?v=1.0.0) ·
[Guía de uso](GUIA_USO.md) · [Mantenimiento](MANTENIMIENTO.md) ·
[Cambios](../CHANGELOG.md) · [Antecedentes](README.md).

## Alcance del cierre

Fractalear es una herramienta del LAB 4.0 de la Universidad Nacional para
construir conceptos, desarrollar sus jerarquías y representar sus relaciones.
Este documento consolida el funcionamiento aceptado y sus límites. El número
1.0.0 identifica el cierre solicitado; no incorpora funciones ni modifica las
reglas geométricas para obtener una aprobación normativa distinta.

| Vista | Comportamiento de 1.0.0 |
| --- | --- |
| **01 Editor** | Crear, editar, mover y conectar conceptos. Los puertos pueden cambiar de cara al reorganizar cuadros. |
| **02 Compacto** | Distribuir el mismo grafo en ramas radiales compactas y calcular sus conexiones. Vista de lectura. |
| **03 Espiral** | Girar la organización compacta y recalcular conexiones. Vista de lectura. |

El identificador interno de Espiral sigue siendo `04`, para conservar archivos
y referencias existentes. No hay una cuarta vista disponible.

## Comienzo y construcción

- La entrada y **Nuevo** contienen solo J0, seleccionado, con el texto
  **¿Qué quieres fractalear hoy?** y ancho solicitado de 300 px. No se crean
  ramas ni relaciones predefinidas.
- **Ejemplo PPR** carga el ejemplo de 210 conceptos y 217 vínculos a petición.
- Un doble clic lleva al campo de texto. **+ Concepto** crea un hijo y conserva
  seleccionado al padre. Los hijos directos reales de J0 determinan los brazos;
  su cantidad es variable.
- La colocación considera dos rayos sucesivos del reloj, en pasos de 3:30,
  y elige el lugar libre más cercano. Los cuadros existentes conservan su
  posición salvo los ajustes locales necesarios ante una modificación.
- Mover un cuadro en 01 conserva su identidad, padre y vínculos. Recalcula las
  rutas afectadas; los puertos no son anclas fijas de edición. Se impide
  superponer cuadros.
- La profundidad se obtiene del grafo real y comienza en el máximo. Filtro,
  selección, desplazamiento y zoom reutilizan la geometría.

En 01 se resaltan conexiones directas al seleccionar. En 02 y 03 se añade la
ascendencia real hasta J0 y se resaltan todos los vecinos directos, incluidos
hijos y vínculos transversales. Una relación transversal no inventa un padre.

## Lectura y geometría conservadas

| Elemento | Decisión consolidada |
| --- | --- |
| Texto | Rajdhani, 24 unidades del diagrama; pesos 600 y 700. El zoom y la exportación escalan su apariencia. |
| Cuadros | Márgenes de 14 a cada lado y 9 arriba/abajo. Las frases se reparten entre palabras; una palabra larga ensancha su cuadro. |
| Grosor | Base de 1,35 a 3,15 según la jerarquía completa; resaltado adicional de 0,75. Con una sola generación se conserva el mínimo. |
| Relaciones | Continua por defecto, Punteada y Segmentada. El estilo se guarda por vínculo y no define parentesco. |
| Cruces | Máscara blanca de tres veces el grosor del trazo superior, equivalente a un grosor de margen por lado; sigue guiones, zoom y selección. |
| Giros | Horizontales, verticales y biseles de 45°. Puertos alejados de las esquinas cuando el recorrido lo permite. |
| Núcleo compacto | Objetivo J0–J1 de 0,5 del hueco de referencia entre bordes, condicionado por el margen físico y las colisiones. |
| Espiral | Giro = 0,25; Apertura = 0,85; T = 0. Se mantiene el algoritmo estable recuperado de 0.2.8. |

El modelo biológico W–D–T completo fue retirado por indicación del usuario.
Los tres valores actuales describen el algoritmo vigente, no ese modelo
biológico. Las vistas derivadas conservan sus comprobaciones frente a la
referencia del Editor; no se aprueban usando su propio resultado como referencia.

## Integridad, archivos y exportaciones

El esquema editable sigue siendo **`p1.graph.v1`**. La versión de la aplicación
no cambia los IDs ni obliga a migrar el esquema de los archivos guardados.
`planeCheckpoint`, `topologyRegister` y `derivedViews` son datos opcionales de
geometría y recuperación, sujetos a comprobación.

El lector rechaza datos conceptuales inválidos antes de reemplazar el documento,
incluidos vínculos repetidos o autorrelaciones. Una caché geométrica inválida se
descarta y se recalcula sin desechar conceptos válidos. Se conserva la lectura
de los archivos heredados y la migración de medidas de texto existentes.

Deshacer una importación recupera también su geometría previa. El asignador de
IDs comprueba los conceptos activos; las claves especiales de JavaScript se
tratan como datos en jerarquías, puertos y vistas. El historial conserva su
límite de 36 operaciones.

| Formato | Resultado |
| --- | --- |
| JSON | Documento editable completo y puntos de control disponibles, independiente de la vista. |
| SVG | Vista actual vectorial con fuente y estilos incorporados. |
| PNG | Toda la representación activa, aunque el filtro o la cámara oculten partes. Lado mayor de 4096 px, proporción propia y márgenes. |

La exportación espera una escena preparada. El PNG comprueba todos los conceptos
y vínculos y se bloquea si hay rutas pendientes. Su nombre conserva la vista
capturada aunque se cambie de vista durante la codificación. Se actualiza la
geometría pendiente antes de guardar, exportar o cambiar de representación.

## Arquitectura y tiempo de carga

La aplicación es estática: HTML, CSS, módulos JavaScript, SVG, fuentes locales,
Workers y libavoid en WASM. No requiere un servidor de aplicación ni un servicio
remoto para calcular el diagrama. Las licencias y versiones se conservan en
[THIRD_PARTY.md](../THIRD_PARTY.md) y `package-lock.json`.

| Responsabilidad | Módulos principales |
| --- | --- |
| Documento e identidad | `core/GraphDocument`, `core/GraphIdentity`, `core/EditorHistory`. |
| Estado geométrico y referencia | `core/PlaneCheckpoint`, `core/TopologyRegister`, `core/DerivedTopology`. |
| Colocación y rutas | `geometry/PlaneLayout`, `ClockPlacement`, `RayPackingLayout`, `SpiralLayout`, `PcbRouter`, `AvoidRouter`. |
| Medición y representación | `ui/NodeTypography`, `SvgRenderer`, `CircuitSvg`, `HierarchyStroke`, `LinkStyles`. |
| Archivos y exportación | `io/GraphFile`, `ui/GraphFiles`, `DiagramExport`, `PngExport`. |
| Trabajo en segundo plano | `core/WorkerTask`, `workers/initial-route.worker`, `workers/derived-scene.worker`. |
| Coordinación | `app.js`, `views/DerivedViews`. |

Las rutas y sus comprobaciones concentran el trabajo, según la cantidad de
conexiones y la congestión. La lectura de jerarquías usa índices frescos y
recorridos lineales. Las medidas de texto y las escenas calculadas se reutilizan.
Espiral necesita la base compacta; si no existe, debe calcularla primero.

Una edición que cambie texto, dimensiones, relaciones o posiciones puede
invalidar las vistas derivadas. Cambiar de vista durante un cálculo lo cancela.
Regresar a una escena en caché evita resolver sus rutas, aunque todavía requiere
dibujar sus elementos. Los límites de espera no son una demora fija.
Las mediciones históricas están en [rendimiento](RENDIMIENTO_0_2_12.md) e
[integridad y jerarquías](INTEGRIDAD_0_2_14.md); no son garantías para todo equipo
o cualquier cantidad de contenido.

## Limpieza de este cierre

- Se actualizan interfaz, paquete, pruebas y documentación a 1.0.0. El README
  y la guía apuntan a esta referencia; los documentos 0.2.x son antecedentes.
- Se retiran la función `focusCore` y los campos `edgeMode` y `readableZoom`, sin referencias de uso.
  Se elimina un comentario obsoleto del coordinador.
- La construcción comprueba que su destino absoluto sea el subdirectorio
  `_site` del repositorio, elimina ese resultado anterior y genera solo los
  recursos publicables. Así no quedan módulos retirados de una compilación previa.
- Se ignoran las cachés de Python. Se conservan dependencias fijadas, licencias,
  pruebas, datos de comparación, documentos históricos y el HTML original de
  respaldo; ninguno de esos respaldos se publica en `_site`.

## Validación y límites del corte

La base publicada 0.2.15 pasó **96 pruebas Node y cuatro suites de Chrome** en
[su ejecución de publicación](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/actions/runs/43738672373).
El cierre 1.0.0 exige de nuevo esas comprobaciones antes de publicarse, incluida
la eliminación de un archivo obsoleto del resultado de construcción.

Las suites cubren arranque con J0, ejemplo completo, edición libre, selección,
estilos, jerarquías, historial, importaciones, IDs especiales, rutas pendientes,
SVG y PNG, geometría y worker. Las firmas exactas de rutas y dibujo del ejemplo
siguen siendo las referencias existentes. Aprobar los casos de regresión no
demuestra que todo grafo o movimiento posible tenga solución.

**Límites conservados:** Compacto y Espiral pueden mostrar diferencias
topológicas frente a 01 y separaciones superiores a la cota 2H ensayada; sus
avisos **EN REVISIÓN** siguen activos. Un cálculo puede agotar su tiempo o
intentos y dejar una ruta pendiente. La letra del PNG depende de la escala para
encajar el grafo completo. Esos límites no se eliminan ni se certifican como
resueltos por asignar el número 1.0.0.
