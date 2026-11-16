> **Archivo histórico · desarrollo cerrado el 16 de noviembre de 2026.**
> Este documento describe su fecha de corte. Las propuestas no incorporadas
> quedaron descartadas y sus pendientes no constituyen un plan de desarrollo.
> El estado final se describe en [Cierre de desarrollo](../CIERRE_DESARROLLO.md).

# 0.2.13 — Estabilidad y separación de responsabilidades

14 de noviembre de 2026. Base:
[0.2.12](https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/tree/2fcb3a327c61b0d3649e0f15167b03940cd58165).
Se mantienen el [funcionamiento acordado](CORTE_0_2_11.md) y las
[optimizaciones de rendimiento](RENDIMIENTO_0_2_12.md).

## Problemas encontrados

El coordinador `app.js` concentraba edición, colocación inicial, lectura y
validación de archivos, exportación y gestión de Workers. Esa mezcla dificultaba
comprobar cada responsabilidad sin ejecutar toda la interfaz.

Se identificaron fallos concretos de ciclo de vida:

- `DerivedViews.reset()` cambiaba la presentación a 01, pero conservaba el modo
  interno anterior. Crear o importar desde una derivada podía dejar la edición
  bloqueada aunque se mostrara el Editor.
- Cancelar el Worker derivado lo terminaba, pero su promesa y su temporizador
  podían permanecer vivos hasta 75 segundos.
- Una lectura de archivo anterior podía finalizar después de otra carga o de
  iniciar un diagrama nuevo, sustituyendo una acción más reciente.
- Registros geométricos opcionales con elementos nulos podían interrumpir la
  recuperación después de haber comenzado a reemplazar el documento.

## Organización resultante

| Módulo | Responsabilidad |
| --- | --- |
| [`core/WorkerTask.js`](../../js/core/WorkerTask.js) | Un cálculo en segundo plano, su progreso, cancelación, respuesta, error y limpieza de recursos. |
| [`geometry/PlaneLayout.js`](../../js/geometry/PlaneLayout.js) | Colocación inicial del Editor a partir de dimensiones medidas. No depende del DOM ni modifica el documento. |
| [`io/GraphFile.js`](../../js/io/GraphFile.js) | Validar el formato conceptual existente y reconocer registros geométricos opcionales antes de restaurarlos. |
| [`ui/GraphFiles.js`](../../js/ui/GraphFiles.js) | Controles de guardar/abrir, selección de la última lectura vigente y descarga con liberación de URL temporal. |
| [`ui/DiagramExport.js`](../../js/ui/DiagramExport.js) | Exportación SVG y PNG, estilos, tipografía incorporada y recursos temporales de imagen. Recibe explícitamente la escena y sus controles. |
| [`app.js`](../../js/app.js) | Coordinar edición y documento activo, y conectar los módulos con la interfaz. |
| [`views/DerivedViews.js`](../../js/views/DerivedViews.js) | Selección, caché y representación de las vistas derivadas; delega la vida del Worker. |

Los nuevos módulos no importan `app.js`. La colocación recibe una función de
medición; la exportación recibe la escena; la validación de archivos puede
probarse sin abrir una página. La descarga de archivos utiliza una sola
implementación para JSON, SVG y PNG.

## Correcciones de estabilidad

### Estado de vista coherente

Reiniciar establece también `mode = '01'`, cancela el cálculo anterior y limpia
su aviso. Crear o abrir un documento desde Compacto o Espiral recupera los
controles de edición y la selección del nuevo grafo.

### Una finalización por cálculo

`WorkerTask` concentra la finalización. Al resolver, fallar, vencer el tiempo o
cancelarse, retira los manejadores, limpia el temporizador y termina el Worker.
Una respuesta o error tardío de un trabajo anterior no modifica el posterior.
La cancelación rechaza su espera inmediatamente como `AbortError`; los
coordinadores distinguen los resultados vigentes mediante su revisión.

Las derivadas conservan el límite de 75 segundos. El Worker inicial tiene una
vigilancia de 35 segundos y mantiene el cálculo alternativo en el hilo principal
si no puede responder. El presupuesto interno del enrutador no se modifica.

### Entrada validada y recuperación de geometría

La entrada conceptual se valida antes de aplicarse. La comprobación de padres,
hijos del núcleo y extremos usa índices, evitando búsquedas repetidas por cada
nodo y vínculo. Se conservan los archivos heredados sin identificador de esquema
ni punto de control, así como estilos y campos existentes.

La recuperación del punto de control también indexa los vínculos por su clave.
Un registro opcional mal formado se descarta y permite reconstruir la geometría
de los conceptos válidos. Si una caché derivada lanza un error al recuperarse,
se registra el diagnóstico y se calcula la vista de nuevo.

Cada lectura de archivo tiene una revisión. Una lectura sustituida o cancelada
no aplica sus datos ni modifica los avisos de una operación posterior. Iniciar
un diagrama nuevo cancela la lectura pendiente y los temporizadores de edición
del documento anterior.

## Conservación y comprobación

Los motores de distribución radial y espiral, enrutamiento y validación
geométrica conservan su código. La colocación inicial se trasladó sin cambiar
sus ecuaciones; se retiró una variable de límites que no tenía lectores.
La tipografía, medidas, puertos, jerarquías, estilos, selección, formato JSON y
planes de exportación mantienen sus contratos.

Las pruebas nuevas cubren cancelación y sustitución de cálculos, respuestas
tardías, errores de creación/envío, tiempo agotado, cargas simultáneas,
cancelación de archivos, registros incompletos y reinicio de modo. Las suites
de Chrome incluyen importar desde Espiral, crear desde Compacto, recuperar un
archivo con punto de control dañado y usar la alternativa sin Worker disponible.

Se mantienen las firmas exactas de rutas y del dibujo inicial de 0.2.12, las
comprobaciones del ejemplo de 210 conceptos y 217 vínculos, y las pruebas de
SVG/PNG. La comparación de rendimiento se repite contra 0.2.12; este corte
busca estabilidad y mantenimiento, no declara una nueva reducción general de
tiempo de carga.

## Criterio para mantener la separación

La edición permanece en su coordinador. Las reglas de archivo se cambian en el
lector y se comprueban con archivos de referencia; los recursos y estilos de
exportación se cambian en su controlador; el ciclo de Workers se cambia en su
gestor común. Un ajuste de esos módulos no requiere copiar otra vez su lógica
en la aplicación.

Esta es una separación gradual. `app.js` sigue coordinando varias operaciones;
no se presenta como una reorganización completa del motor. Los pendientes
normativos y la variación temporal preexistente de las vistas derivadas siguen
siendo los documentados en los cortes anteriores.
