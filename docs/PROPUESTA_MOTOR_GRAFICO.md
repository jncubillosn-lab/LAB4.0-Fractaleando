# Ronda propositiva del motor gráfico de Fractaleando

**Actualización 0.2.2:** [motor compacto, resultados y límites](MOTOR_COMPACTO_0_2_2.md). Las descripciones del intento anterior que siguen se conservan como registro histórico.

13 de noviembre de 2026. Base examinada: PR 12, commit `382bac6e66386963fafe7da80a22c32408f44ba9`. Esta ronda registra el prototipo y sus mediciones previas a la implementación directa; su aplicación se documenta en [Motor gráfico 0.2.1](IMPLEMENTACION_MOTOR_0_2_1.md). La referencia topológica 01 se conserva.

La propuesta es conservar SVG y la interfaz, corregir la aceptación geométrica y topológica, y sustituir gradualmente la búsqueda radial por una construcción que conserve la organización de 01 desde el inicio. ELKjs aporta una alternativa real para calcular posiciones y rutas; los ensayos todavía no justifican adoptarlo como solución completa del radial.

El alcance procede de las normas jerarquizadas del repositorio y de la memoria suministrada como referencia. No se añaden vistas, animaciones, servicios, reglas de contenido ni umbrales normativos. D1–D4 siguen abiertos.

**Correcciones implementadas en la copia de trabajo**

| Problema de base | Corrección | Evidencia |
| --- | --- | --- |
| Una ruta podía atravesar los cuadros de sus propios extremos. | La salida debe dirigirse hacia fuera de la cara correcta y la llegada debe cumplir la condición inversa. El auditor comprueba los obstáculos sin heredar las exenciones del generador de rutas. | El archivo que antes era aceptado se rechaza como punto de control y sus rutas se reconstruyen correctamente en Chrome. |
| Diferentes tolerancias perdían cruces casi horizontales. | Núcleo común de orientación, intersección real de segmentos y entrada en rectángulos; enrutador, marcadores de cruces y registro topológico usan el mismo cálculo de intersecciones. | Regresión con segmento `(0,0)→(100,0.005)`: detecta el cruce real y genera su marcador. El PPR inicial conserva 71 cruces. |
| El simplificador podía acumular tolerancias y producir una diagonal que el generador aceptaba. | Solo se unen segmentos si el segmento resultante conserva la orientación admitida; el generador rechaza diagonales y tramos vacíos. | Regresión con dos desviaciones de 0,006: no se convierten en una diagonal aceptada de 0,012. |
| Cada vista podía aprobar su propia topología. | Las vistas se comparan con la referencia compartida 01. Se rechazan referencias ausentes o incompletas y conjuntos de conceptos o vínculos distintos. | 04 informa diferencias contra 01 y no se incluye en los puntos de control derivados exportados. |
| El comparador imponía caras y órdenes absolutos que las normas actuales no exigen. | Compara ciclos de conexiones admitiendo rotación del inicio; permite cambiar de cara y rechaza reflexión. Orden espacial y vecindad métrica quedan como diagnóstico. | Pruebas de rotación, cambio de cara, reflexión y conservación de secuencia de cruces. |
| Las regiones J1 se ordenaban por la etiqueta de rama, invirtiendo el sentido horario de 01. | 02 y 04 reciben la referencia y construyen el orden de las ramas desde sus puertos reales. | El caso pequeño de cuatro brazos vuelve a contrastarse contra 01, en lugar de aprobar una reflexión como referencia nueva. |
| En 02, escoger caras solo por la dirección entre centros añadía rodeos y cruces en cajas próximas. | Se comparan los espacios físicos entre cajas y se ordenan las salidas por su proyección en la cara elegida. La política específica de carriles de 04 se conserva mientras se resuelve su trazado global. | Caso compacto de cuatro ramas diagonales: cuatro rutas, sin cruces añadidos. |
| El presupuesto de tiempo solo cubría reintentos; la búsqueda principal podía exceder el límite de la interfaz y perder todo el resultado. | Un único plazo cubre colocación de rutas iniciales, reintentos y búsqueda A*. Al agotarse, el resultado conserva todos los vínculos y señala los pendientes. | Prueba de presupuesto agotado: siguen presentes las 217 conexiones; ninguna se declara resuelta sin recorrido. |
| Una caché antigua podía exportarse bajo otra referencia. | La identidad incluye grafo, posiciones de origen y referencia topológica; la exportación vuelve a comprobar esa identidad. | Pruebas de invalidación y exclusión de cachés incompatibles. |
| Una imagen derivada podía perder las advertencias al exportarse. | SVG y PNG incorporan aviso visible de revisión o validación pendiente; los contadores muestran la vista representada. | Chrome verifica el SVG con advertencia y los dos recorridos pendientes de 04. El JSON conserva el grafo completo. |

El auditor sigue compartiendo primitivas matemáticas con el generador; su decisión de aceptación es independiente. Esta separación reduce el fallo común encontrado, pero no constituye una verificación formal de toda la geometría.

**Comparación reproducible con el PPR completo**

Se utilizaron los mismos 210 cuadros, tamaños originales y 217 vínculos. Ningún ensayo elimina los transversales del grafo. La referencia mantiene 71 cruces. Versión ensayada: `elkjs@0.12.1`.

| Candidato | Tiempo orientativo | Solapes físicos | Rutas obtenidas | Rutas rechazadas por el auditor | Nodos con orden circular distinto | Pares nuevos que se cruzan |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 01 de referencia | — | 0 | 217/217 | 0 | 0 | 0 |
| Radial actual | 4,27 s | 185 | No se enruta una colocación ya inválida | No evaluado | No evaluado | No evaluado |
| Radial iniciado con el orden de 01 | 3,97 s | 228 | No se enruta una colocación ya inválida | No evaluado | No evaluado | No evaluado |
| ELK por capas, puertos libres | 0,41 s | 0 | 217/217 | 30 | 45 | 109 |
| ELK por capas, orden de puertos restringido | 0,39 s | 0 | 217/217 | 0 | 0 | 237 |
| ELK por capas, posiciones de puertos restringidas | 0,31 s | 0 | 217/217 | 0 | 0 | 237 |
| ELK radial + enrutador actual | 24,15 s | 27 | 179/217 | 0 entre las 179 obtenidas | 6 | 145 |

Los tiempos incluyen distribución y obtención de rutas cuando corresponde; excluyen la preparación de la referencia, la auditoría posterior y el dibujo del navegador. Son una medición local, no una garantía de rendimiento. En el modo libre, los 30 rechazos corresponden a puertos separados por menos de los 8 px que exige actualmente el auditor; ese umbral técnico no se convierte en una norma aprobada.

Los ensayos restringidos de ELK fijan también caras o coordenadas iniciales, una condición más fuerte que N1.2 utilizada solamente para comparar. Todos conservan los tamaños originales. La ruta nativa de ELK se mide sin reemplazarla por otra que esconda sus defectos.

Para ELK radial se entregó el árbol de parentescos de 209 conexiones como entrada de colocación y después se intentó enrutar los 217 vínculos originales. La selección de raíz queda en el comportamiento propio de ese algoritmo: sus opciones publicadas por el runtime no exponen `processingOrder.preferredRoot`. El ensayo no acredita el centro estructural P1 ni la pertenencia radial; detectó 46 relaciones padre–hijo que no avanzan hacia fuera respecto de P1. Esto describe esta configuración ensayada, no una imposibilidad general de la biblioteca.

El diagnóstico con separación entre bordes y `H=53`, cota 106 px, encuentra 70 excesos en el radial actual, 162 en ELK restringido y 171 en ELK radial. **Son mediciones bajo una interpretación técnica histórica, no aprobación de D1 y D2.** La cota radial no se impone retrospectivamente a la vista 01, cuyo papel aquí es ser referencia topológica.

La prueba real de Chrome, con sus métricas de texto, conserva 01 con 210 conceptos, 217 rutas, cero rutas inválidas y 71 cruces. En la ejecución final de 04 obtiene 202 rutas, deja 15 explícitamente pendientes y registra 597 incidencias topológicas; son incidencias del comparador, no 597 normas distintas. El presupuesto de cálculo se agota y queda señalado. La corrección del orden de las ramas cambia la geometría ensayada; ese cambio no se presenta como mejora de completitud. El radial sigue rechazado y conserva 01 visible. Zoom y filtros mantienen el mismo número de cálculos de rutas.

La semilla de orden correcta tampoco arregla la colocación grande: en el fixture pasa de 185 a 228 solapes físicos y de 70 a 58 excesos de distancia bajo la interpretación histórica. Estos resultados impiden promover el prototipo como solución completa. Corregir el orden es necesario; debe acompañarse del reemplazo de la construcción geométrica y no venderse como optimización por sí solo.

El caso real de cuatro brazos permite distinguir ambas cosas: 04 conserva su orden, tiene cuatro recorridos y permite recuperar una caché compatible con 01. En 02, la colocación de los cinco cuadros cumple el auditor radial existente, pero su enrutador introduce dos cruces nuevos y la comprobación global lo rechaza. El fixture geométrico de cuatro ramas con más espacio no cubre esta colocación más estrecha. Sigue pendiente planificar conjuntamente la posición de los puertos, los tramos de salida y el espacio de enrutamiento; la corrección parcial de caras no resuelve ese acoplamiento.

**Solución propuesta y orden de ejecución**

1. **Consolidar el contrato que ya usa el prototipo.** Separar datos conceptuales, referencia 01, geometría candidata, informe y punto de control. Un algoritmo devuelve un candidato; únicamente el auditor decide qué comprobaciones cumple. La aceptación normativa completa es distinta de tener todas las rutas.
2. **Planificar desde la referencia, antes de colocar y enrutar.** Tomar el orden circular de cada cuadro y la organización de cruces de 01 como restricciones de entrada. El radial actual coloca, atrae, separa y reordena con operaciones que se deshacen entre sí; aumentar iteraciones no elimina esa causa. Debe reemplazarse ese ciclo de proyecciones por construcción y revisión de candidatos que mantengan las restricciones duras ya satisfechas.
3. **Conservar el trazado global al redistribuir.** Representar internamente los cruces fijados y el orden de los tramos permite trabajar con la organización de 01 durante la colocación y compactación. Los puntos auxiliares serían exclusivamente geometría de enrutamiento, nunca conceptos nuevos, bifurcaciones ni cambios del JSON conceptual. La política exacta requiere D3; mientras tanto, el prototipo mantiene la comprobación histórica conservadora de pares, multiplicidad, orden y paso superior.
4. **Usar ELK detrás de un adaptador de candidatos.** El adaptador experimental ya demuestra posiciones, puertos y rutas completas sin cambiar el renderizador. ELK restringido es una base útil para distribución general y para medir alternativas. No se activa como sustituto del radial: falla la conservación global. Si se quisiera usarlo para optimizar una nueva referencia inicial, esa sustitución tendría que aprobarse y versionarse expresamente; esta ronda no la realiza.
5. **Resolver la compactación radial con todas las restricciones vigentes.** Planificar necesidades de las ramas a partir del conjunto completo, permitir radios y regiones variables y comprobar cada incorporación. Un candidato que crea cruces, invierte conexiones o solapa cajas vuelve al último estado compatible. La cercanía se comprueba con D1–D2 y el avance/contención con D4 cuando estén definidos. Si no se encuentra solución se registra el intento y los identificadores que fallan; no se declara incompatibilidad matemática sin una prueba.
6. **Auditar el recorrido final que se dibuja.** El siguiente cambio geométrico debe producir una representación explícita de segmentos y curvas usada por SVG y por el auditor. Debe incluir puentes, grosor y contacto con cuadros y otras rutas. En esta ronda se corrigen intersecciones de las polilíneas auxiliares; no se certifican todavía todas las curvas, máscaras y grosores finales.

La secuencia permite reutilizar interfaz, SVG, workers, modelo conceptual y puntos de control. No exige rehacer todo el proyecto. La dependencia ELK se añadió solo para ejecutar el banco comparativo; el sitio publicado no carga esa biblioteca ni depende de un CDN.

**Decisiones ya pendientes en el alcance**

| Definición existente | Qué falta fijar | Qué hace esta ronda |
| --- | --- | --- |
| D1 | Pares y medida de distancia, incluidos transversales. | Muestra el diagnóstico entre cuadros vinculados, medido entre bordes; no lo aprueba por defecto. |
| D2 | Altura H cuando las cajas tienen alturas distintas. | Identifica expresamente el parámetro histórico 53; no aumenta la cota para aprobar. |
| D3 | Tratamiento de cruces de la referencia y posible optimización inicial. | Conserva 01 y no permite que una vista se convierta en referencia por sí misma. |
| D4 | Avance padre–hijo o bandas globales; contención del centro o de la caja. | No impone silenciosamente una interpretación nueva. |

Estos puntos no impidieron reparar los fallos definidos. Impiden declarar terminada la aceptación normativa del radial.

**Aceptación y reproducción**

La condición de cierre sigue siendo el PPR completo: identidad íntegra, comparación real con 01, condiciones radiales definidas, cero solapes y contactos prohibidos, todos los vínculos con recorrido seguro, cercanía acordada, curvas legibles e interacción estable. Obtener una disposición atractiva o pasar pruebas pequeñas no sustituye esa aceptación.

Pruebas unitarias de esta ronda: `npm test`, **42 aprobadas, cero fallos**. Las pruebas con cálculos grandes se ejecutan en serie para no competir entre sí por el presupuesto de tiempo. Comparación: `npm ci` y `npm run bench:layouts -- artifacts/layout-benchmark.json`. El script genera JSON y vistas SVG de diagnóstico con identificadores de los cuadros. Los SVG comparativos no reproducen el estilo final ni certifican legibilidad.

El plazo interno de enrutamiento es un parámetro técnico de 24 segundos que incluye la búsqueda principal y los reintentos, con margen respecto del watchdog existente de la vista derivada. Agotarlo no demuestra imposibilidad ni elimina vínculos. Los números de rutas obtenidas bajo ese plazo pueden variar con la carga del equipo; los informes registran el resultado de cada ejecución.

La copia incorpora pruebas de regresión de puertos, cruces, referencia compartida, cachés y exportación. Los ensayos E2E se ajustan a las normas actuales: 04 no debe aceptarse cuando altera 01. Los casos de aceptación positiva conservan una prueba explícita de recuperación de caché compatible, separada del PPR todavía no resuelto.

Las tres suites existentes de navegador pasan sobre la copia final: `pages_e2e.py`, `views_e2e.py` y `topology_guard_e2e.py`. Incluyen el PPR íntegro en 01, conservación de la referencia, rechazo de cambios topológicos, filtros, exportación y recuperación de una vista compatible. También se verificó en Chrome la reconstrucción del archivo con la ruta que atravesaba sus extremos. El éxito de estas pruebas acredita esos comportamientos y el rechazo de casos incorrectos; no acredita un radial completo que cumpla todas las normas.

Fuentes primarias: [ELKjs: cálculo de distribución, sin renderizador](https://github.com/kieler/elkjs), [ELK Layered: trazado ortogonal y restricciones de puertos](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html), [ELK Radial: árbol, radios y compactación](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-radial.html). Las cifras de esta propuesta proceden del banco ejecutado sobre el repositorio, no de promesas de esas bibliotecas.
