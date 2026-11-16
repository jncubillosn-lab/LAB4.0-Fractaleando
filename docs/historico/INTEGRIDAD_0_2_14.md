> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# Fractalear · Integridad y rendimiento 0.2.14

Fecha: 14 de noviembre de 2026. Base publicada: 0.2.13
(`12caa0048206f8e38440ba02fffb2f9a3cacfd97`).

Este corte corrige los cinco hallazgos de la auditoría y revisa sus rutas
relacionadas. Conserva el alcance y la geometría aprobados; no incorpora otro
modelo de espiral ni cambia las reglas de edición y de lectura.

## Correcciones y alcance relacionado

| Hallazgo | Causa y corrección | Casos relacionados cubiertos |
|---|---|---|
| IDs repetidos al importar, deshacer y crear | El historial solo recuperaba nodos, vínculos y selección, mientras la importación reiniciaba el contador. `GraphIdentity` asigna IDs comprobando los existentes y `EditorHistory` recupera el contexto de edición y el contador. | Importaciones y deshacer repetidos, contadores atrasados, IDs numéricos extremos y coordenadas retiradas de documentos anteriores. |
| PNG vacío durante la carga | Un mapa de rutas vacío se interpretaba como un cálculo completo. `exportScene` comprueba que la vista esté preparada y que el PNG contenga todos los conceptos y vínculos del documento. | SVG durante la carga, rutas pendientes, grafos válidos sin vínculos y cambio de vista mientras se codifica el PNG. El nombre del archivo conserva la vista capturada. |
| Vínculos duplicados en JSON | Dos relaciones entre las mismas puntas producían una sola entrada en el mapa de rutas. El lector valida claves de relación antes de sustituir el documento. | Duplicados invertidos y autorrelaciones, que el Editor ya impedía crear. Las posiciones o rutas duplicadas de cachés opcionales se descartan y se recalculan. |
| IDs como `constructor` o `__proto__` | Algunos registros confundían claves de datos con propiedades heredadas de objetos JavaScript. Se usan mapas, registros sin prototipo y consultas de propiedades propias según el contexto. | Profundidades, registro topológico, orden de puertos, solicitudes de espacio y vistas Compacto/Espiral. Se conservan los IDs originales. |
| Lectura de profundidad cuadrática | Cada visita volvía a buscar hijos en todos los nodos. `GraphDocument` construye índices por ID y por padre para cada recorrido y recorre una cola con cursor. | Cambios de padre, sustitución del documento, foco, huérfanos y ciclos heredados. El cálculo por padres es iterativo y evita desbordar la pila en cadenas profundas. |

La identidad de las relaciones se comparte entre el Editor, el lector y la
exportación. Se rechazan relaciones inválidas con un mensaje antes de modificar
el documento abierto; no se inventan ni se eliminan relaciones silenciosamente.

## Historial y coherencia geométrica

Deshacer una importación recupera también su punto de control geométrico y
referencia topológica: las posiciones manuales previas no deben sustituirse por
una distribución inicial. Este respaldo adicional solo se toma al reemplazar un
documento; las ediciones normales no copian toda la geometría al historial.
El límite del historial sigue siendo de 36 operaciones.

Antes de guardar, exportar, importar o pasar a una vista de lectura se completa
la actualización geométrica pendiente de las ediciones de texto. Así, el JSON
no combina texto nuevo con dimensiones y rutas anteriores. Los puntos de
control heredados mantienen la validación de medidas y la migración existentes.

Los índices de jerarquía se reconstruyen a partir de los datos actuales. No hay
una caché persistente que pueda quedar obsoleta al modificar un padre o añadir
un concepto. Huérfanos y ciclos heredados conservan el tratamiento anterior,
sin atribuirles relaciones nuevas.

## Medición de la lectura de jerarquías

Comparación local de `readDepthMap()` sobre cadenas, con Node v24.22.1,
misma máquina y mediana de siete ejecuciones por caso. La implementación
anterior está congelada en `tests/fixtures/graph-document-0.2.13.js` para
contrastar resultados y semántica.

| Conceptos | Versión | Consultas al padre por recorrido | Mediana |
|---|---|---:|---:|
| 500 | 0.2.13 | 500.000 | 16,809 ms |
| 500 | 0.2.14 | 1.500 | 0,431 ms |
| 2.000 | 0.2.13 | 8.000.000 | 238,220 ms |
| 2.000 | 0.2.14 | 6.000 | 1,154 ms |

Estas cifras corresponden al recorrido de jerarquías, no al tiempo de carga
completo ni al motor de rutas. Los tiempos dependen del equipo. La regresión
automatizada comprueba la cantidad de accesos, además del resultado, para no
depender de un umbral de tiempo sensible al entorno.

## Comprobación

- Pruebas de dominio y geometría: importar/deshacer/crear, registros con IDs
  especiales, vínculos duplicados y cachés repetidas, exportación pendiente y
  cambio de vista durante la codificación.
- Comparación de profundidades con 100 grafos reproducibles, incluyendo foco,
  componentes desconectados y ciclos heredados.
- Cuatro suites con Chrome: página/worker, vistas, bloqueo topológico e
  integridad del flujo real de archivos y controles. La última mantiene el
  worker inicial en espera para comprobar la exportación durante la carga y
  recorre las tres vistas con IDs especiales.
- Se mantienen las comprobaciones de equivalencia de rutas iniciales y de
  imagen del grafo de referencia, además de los controles normativos existentes.

La construcción del sitio continúa usando módulos y WASM locales. GitHub Pages
solo publica cuando las pruebas de Node y Chrome terminan correctamente.

## Límites conservados

El Editor mantiene el movimiento libre y la adaptación de puertos. Compacto
y Espiral mantienen sus controles topológicos, sus avisos normativos pendientes
y el mismo modelo de espiral recuperado de 0.2.8. Se conserva letra fija de
24 px, palabras completas con cuadros extensibles, estilos de relación,
grosores por jerarquía, franjas blancas y exportación PNG de lado mayor 4096 px.
No se presenta esta corrección como certificación de todas las normas gráficas.
