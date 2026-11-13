# Memoria del proyecto P1

Objetivos normas parámetros decisiones y estado de desarrollo

Corte documental: 13 de noviembre de 2026. Versión 1.0 de la memoria. Proyecto PPR — LAB4.0 Fractaleando.

## 1 Propósito y estado al cierre

P1 es un editor de conceptos y relaciones para apoyar el fractaleo. Su objetivo es representar el desarrollo de ideas de manera legible, fiel a su estructura y estable durante la interacción. La interfaz ya está definida; el trabajo reciente se concentra en el motor de representación y su validación.

Esta memoria registra lo trabajado y deja la implementación en su estado comprobado. No inicia otra búsqueda geométrica ni declara resuelto el radial. Distingue normas del usuario, organización documental propuesta, decisiones de implementación y resultados de pruebas. El detalle normativo se conserva en NORMAS_JERARQUIZADAS_P1.md y en el documento Word de normas v0.1.

### Objetivos conservados

- Representar todos los conceptos y vínculos, incluidos los transversales, sin inventar relaciones ni fusionar cuadros con textos iguales.
- Obtener una lectura integrada del tema: más cuadros legibles en una vista y menos dispersión entre elementos vinculados.
- Construir desde el núcleo, con tantas ramas como hijos J1 existan, sin limitar artificialmente la profundidad.
- Preservar la topología una vez definida, permitiendo modificar la geometría.
- Evitar solapes, contactos con cuadros ajenos y tramos compartidos; distinguir los cruces admitidos.
- Conservar geometría válida mediante puntos de control y recalcular solamente lo afectado por una edición.

### Estado de las representaciones

01 Plano continúa como editor y referencia. 02 Compactación y 03 Órbitas se abandonan como enfoques para el nuevo objetivo; su reemplazo por 02 Radial acotado está en una rama experimental. 04 Espiral permanece en el código de esa rama; no se abrió un nuevo trabajo de optimización sobre ella.

El PR 12 está abierto y en borrador, sin integrar. La rama work/02-radial-acotado-reintento contiene el intento radial. El commit de código revisado es afa75461e77b134aa78e3d85b2d737ef99578685. Su base main es ff74bab3500d017571ac52faf3098d17854844d1. Esta documentación no publica el radial en Pages ni convierte el borrador en una solución terminada.

La interfaz conserva edición, selección, creación y eliminación de vínculos, deshacer, profundidad, zoom, desplazamiento, movimiento manual y exportación según la vista. El programa no debe depender del contenido específico del ejemplo PPR para cumplir sus reglas.

<!-- page -->
## 2 Proceso y decisiones acumuladas

### De la base de 01 a la estructura modular

Se consolidó una versión de 01 con brazos variables, puntos de control y movimiento manual. Se corrigió el tratamiento de profundidad para no detener la lectura en tres generaciones. La publicación debía mostrar el editor mediante index.html, no el README. El HTML original P1_Plano_R01_brazos_variables.html se conserva como referencia de comparación; no se debe recuperar el motor descartado para una nueva intervención.

La aplicación se separó en módulos para datos, modelo, geometría, enrutamiento, representación y coordinación. Se mantuvo el esquema conceptual p1.graph.v1 y se añadieron estados opcionales para recuperar geometría y topología. El cálculo inicial de rutas pasó a un Worker; los filtros y la cámara reutilizan el resultado existente.

### Correcciones registradas para 01

H01: el ejemplo PPR pasó de 61 marcas visibles a 71 marcas para sus 71 intersecciones detectadas. H02: se rechazan puntos de control con extremos desconectados, puertos fuera del perímetro o puertos repetidos, conservando los datos conceptuales válidos. H03: se preservan descendientes desconectados al eliminar un antecesor, sin inventar conexiones. H04: en un movimiento ensayado, la diversificación de puertos redujo de ocho a tres las rutas pendientes; no resolvió todos los desplazamientos posibles.

### Intentos de compactación y reorganización

El enfoque 02 buscó reducir distancias conservando precedencias espaciales. Los intentos posteriores de organización radial presentaron expansión excesiva, problemas de orden jerárquico y resultados que el usuario rechazó. El diagnóstico de la conversación incluyó radios de J1 mayores que los mínimos de J2. Es un antecedente reportado; esta memoria no presenta esas cifras como una medición nueva del código revisado.

Se decidió sustituir 02 y 03 por una representación circular con topología conservada y separación máxima de dos alturas de cuadro. La implementación experimental probó sectores adaptados al contenido, aproximación de vínculos, separación de cuadros y correcciones de orden. Ninguna combinación ensayada resolvió el caso completo.

### Reintento y revisión de base

Se añadieron auditoría independiente, distintos arranques, orientación alternativa, proyección de orden entre hermanos y un Worker para la distribución. También se corrigió que las métricas pudieran sobrescribir coordenadas calculadas y se exigió verificar J0 en el origen. El reintento quedó en el PR 12.

Después se aclaró que conservar el grafo no basta: también se conserva el orden de conexiones. Los puertos pueden cambiar de lado manteniendo su orden circular. La construcción debe avanzar por jerarquías con conocimiento del conjunto completo. Se elaboró el documento de normas jerarquizadas v0.1. La decisión actual es documentar y dejar pendientes explícitos, sin otra intervención funcional.

<!-- page -->
## 3 Normas y jerarquía de validación

La prioridad determina qué decisiones son admisibles. Una mejora inferior no puede romper una condición superior; todas las condiciones obligatorias aplicables deben cumplirse para aprobar el resultado. Los niveles N0 a N5 son una organización documental propuesta y no sustituyen la numeración histórica R01 a R08.

| Nivel | Materia | Criterio principal |
| --- | --- | --- |
| N0 | Referencia e integridad | Mismos datos y referencia versionada. |
| N1 | Topología | Orden circular y organización global conservados. |
| N2 | Estructura circular | J0 central, ramas reales y avance jerárquico. |
| N3 | Geometría y lectura | Sin solapes ni rutas indebidas; cota 2H. |
| N4 | Construcción y operación | Crecimiento estructurado y estado estable. |
| N5 | Aceptación | Evidencia completa y pendientes declarados. |

### Normas históricas que siguen siendo referencia

R01: número variable de brazos según los hijos de J0. R02: las rutas no tocan, rozan ni atraviesan cuadros ajenos. R03: cada vínculo tiene recorrido exclusivo, sin segmentos compartidos. R04: puertos independientes de entrada y salida, sin bifurcaciones en Y.

R05: evitar cruces y distinguir inequívocamente los aceptados. R06: entre opciones admisibles, priorizar ausencia o menor cantidad viable de cruces y después menor longitud. R07: construcción progresiva desde J0 hacia generaciones superiores. R08: las restricciones de claridad y validez se aplican a las representaciones existentes; la referencia histórica a cuatro vistas no obliga a recuperar una vista retirada.

La prioridad de reducir cruces se aplica al definir la topología inicial. Una vez fijada, no autoriza cambiarla durante la redistribución. Si se desea una nueva referencia, debe tratarse como una decisión explícita y versionada.

### Aclaración decisiva sobre los puertos

El orden se lee circularmente en un sentido común. A B C D y C D A B son equivalentes; A C B D no lo es. Cambiar de lado o cruzar una esquina del cuadro puede ser válido. Atar cada conexión a una cara o exigir conservar izquierda y derecha absolutas confunde restricciones geométricas con la topología acordada. La rotación de puertos no obliga a girar los textos.

### Alcance visual y de operación

Se conserva el lenguaje visual del proyecto: palabras protagonistas, dos tonos, tipografía clara, cajas ajustables, líneas curvas y ausencia de adornos o funciones no solicitados. La analogía PCB monocapa orienta la ocupación, reserva y validación del espacio; no implica copiar una estética de circuitos. Tampoco autoriza bifurcaciones eléctricas, tramos compartidos o capas ocultas.

El detalle de cada norma, su prueba y los estados CUMPLE, INCUMPLE, PENDIENTE DE DEFINICIÓN, NO EVALUADO y NO APLICA se encuentra en NORMAS_JERARQUIZADAS_P1.md.

<!-- page -->
## 4 Arquitectura y parámetros del intento

Grafo, topología y geometría son estados distintos. GraphDocument consulta relaciones y jerarquías; PlaneCheckpoint conserva posiciones y rutas; TopologyRegister registra relaciones cualitativas. PcbRouter busca recorridos, GeometryValidator los audita y SvgRenderer los dibuja. app.js coordina edición, cambios y exportación. seeds.js contiene los datos ilustrativos PPR.

Para las vistas derivadas, ViewLayouts selecciona el motor, RadialLayout calcula y audita posiciones y DerivedViews gestiona caché, visibilidad, recuperación y rechazo. radial-layout.worker.js calcula posiciones e initial-route.worker.js calcula rutas. El JSON admite planeCheckpoint, topologyRegister y derivedViews como estados adicionales; una geometría inválida no justifica borrar el grafo válido.

Los siguientes valores describen el código del commit revisado. Son parámetros técnicos históricos, no normas nuevas aprobadas por el usuario.

| Parámetro | Valor observado | Significado o límite |
| --- | --- | --- |
| H del intento | Menor altura global | Interpretación pendiente de revisión. |
| H en el caso PPR | 53 px | Produce una cota ensayada de 106 px. |
| Margen de cuadros | 14 px | Preferencia técnica de separación. |
| Separación de rutas | 6 px | Parámetro de PcbRouter. |
| Margen de obstáculos | 9 px | Parámetro de PcbRouter. |
| Salida del puerto | 19 px | Longitud inicial reservada al trazado. |
| Arranques radiales | Hasta 8 | Búsqueda finita y determinista. |
| Giro alternativo | 45 grados | Se aplica desde el cuarto arranque. |
| Iteraciones | Entre 90 y 1800 | Dependientes del número de cuadros. |
| Auditoría de búsqueda | Cada 30 iteraciones | No reemplaza la aceptación final. |
| Límite de posiciones | 15 segundos | Espera máxima del Worker en la vista. |
| Límite de rutas | 30 segundos | Espera máxima del Worker en la vista. |

El tope de iteraciones se obtiene acotando entre 90 y 1800 el cociente entero de 80 000 000 entre el cuadrado del número de nodos. La atracción intenta acercar vínculos al 88 por ciento de la cota. La puntuación combina colisiones, exceso de distancia e infracciones de orden; selecciona un candidato, pero no demuestra cumplimiento ni garantiza encontrar una solución.

El orden de hermanos se tomó de la coordenada vertical de 01. Los sectores se repartieron por peso del contenido y se verificaron las esquinas de las cajas. El avance se comparó entre padre e hijo. Estas decisiones no equivalen automáticamente a las normas definitivas y deben revisarse frente a las aclaraciones posteriores.

<!-- page -->
## 5 Fallos resultados y límites de la evidencia

### Por qué el método no quedó aprobado

El intento aproxima cuadros para cumplir distancia, los separa para resolver solapes y vuelve a moverlos para respetar sectores y jerarquía. Un paso puede deshacer el anterior. Aumentar iteraciones o combinar penalizaciones no garantiza una construcción válida. Esta es una explicación del comportamiento observado, no una demostración de incompatibilidad entre las normas.

La comparación de identidades del grafo no certifica por sí sola el orden topológico. Además, el registro propio de cada vista derivada puede validar su organización sin demostrar equivalencia con 01. El registro histórico también incorpora caras de puertos y precedencias espaciales que son más restrictivas que la aclaración actual sobre rotación de puertos. Esa diferencia sigue pendiente de implementación.

### Evidencia disponible

| Caso o comprobación | Resultado registrado | Alcance real |
| --- | --- | --- |
| Árbol de 46 cuadros | Geometría radial válida | No certifica el caso grande ni todos los grafos. |
| PPR con 210 cuadros y 217 vínculos | Radial rechazado | Siguen incumplimientos geométricos. |
| Suite Node del reintento | 30 pruebas superadas | Incluye pruebas de rechazo, no solo aceptación. |
| Navegador local del reintento | Chromium no inició | Restricción de sockets; no fue un fallo geométrico. |
| GitHub Actions del PR 12 | Ejecución 145 correcta | Verificación automatizada posterior en GitHub. |

La ejecución de GitHub Actions 43355519745 figura completada con éxito para el commit afa75461. El workflow incluye pruebas Node y de navegador. Esto actualiza el antecedente de prueba local bloqueada, pero no convierte el radial PPR en válido: su prueba comprueba precisamente que se rechace y se preserve 01.

En una medición intermedia de esta conversación, el intento inicial mostró 302 pares en conflicto con el margen de separación y 70 enlaces sobre 2H. Una variante posterior mostró 349 pares y 80 enlaces. Son resultados intermedios, no mediciones atribuidas a la última versión ni un certificado de imposible resolución. Se distinguen conflictos con margen de intersecciones físicas estrictas.

### Comportamiento de protección existente

Si falla la distribución de 02, se conserva visible 01, se informa el rechazo y no se exporta esa distribución como validada. Los vínculos permanecen en los datos. El Worker evita que la búsqueda ocupe el hilo de la interfaz y permite descartar resultados al cambiar de vista. Estas protecciones son útiles, pero no satisfacen el objetivo de producir el radial completo.

No se repitieron las pruebas funcionales durante esta consolidación documental. Los resultados anteriores corresponden a sus ejecuciones identificadas. El motor no se modificó para redactar esta memoria.

<!-- page -->
## 6 Pendientes y condiciones para retomar

### Precisiones normativas abiertas

D1: fijar qué pares de cuadros se someten a 2H y cómo se mide la distancia. Se propuso la separación mínima entre bordes de cuadros directamente vinculados; falta confirmar su alcance, incluidos los transversales. No equivale a longitud de ruta ni distancia entre centros.

D2: definir la altura H cuando los cuadros tienen tamaños distintos y cómo cambia ante una edición. La menor altura global del intento no debe convertirse en norma por costumbre.

D3: concretar la política de cruces de la referencia: cuáles quedan fijados y qué optimización se admite antes de congelarla. Después de fijada, no se redefine silenciosamente para validar una vista.

D4: precisar si el avance radial exige bandas globales por nivel o comparación entre padre e hijo, y si cada región contiene la caja completa o solamente su centro. Tampoco se ha fijado un reparto angular numérico permanente.

### Trabajo pendiente de implementación

- Alinear el registro topológico con orden circular y libertad de lado de los puertos.
- Comparar las vistas contra una referencia común, evitando que se certifiquen con una referencia creada por ellas mismas.
- Diseñar la construcción jerárquica con conocimiento de todos los descendientes y vínculos pendientes; permitir revisión geométrica sin cambiar la topología.
- Localizar el primer paso real que viola una norma, sin ocultar conceptos ni sustituir el caso completo por uno pequeño.
- Lograr la aceptación del caso PPR completo y verificar trazado, interfaz, persistencia y exportación, además de posiciones.

### Criterios para una futura aceptación

Registrar versión del grafo, referencia y normas; resolver las definiciones necesarias; validar en orden N0 a N5; comprobar que cada cambio respete los niveles superiores; conservar evidencia por cuadro y vínculo; y distinguir resultado válido, rechazo y prueba no ejecutada. Solo después puede considerarse integrar el motor y publicar su resultado. No encontrar solución dentro del presupuesto de búsqueda no prueba imposibilidad matemática.

### Fuentes y continuidad documental

Repositorio: https://github.com/jncubillosn-lab/LAB4.0-Fractaleando

Borrador del intento: https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/pull/12

Pruebas verificadas: https://github.com/jncubillosn-lab/LAB4.0-Fractaleando/actions/runs/43355519745

Documentos del repositorio: README.md dentro de docs para el historial; ARQUITECTURA_01.md para responsabilidades; TOPOLOGIA_01.md para el registro anterior; VISTAS_02_04.md para el intento radial; NORMAS_JERARQUIZADAS_P1.md para las normas v0.1. Las notas de actualización distinguen sus descripciones históricas de los acuerdos posteriores.

Esta memoria, las normas v0.1 y las aclaraciones explícitas posteriores constituyen el punto de continuidad documental. La interfaz y el alcance acordado se conservan. Queda registrado el trabajo realizado y el radial completo permanece sin resolver.
