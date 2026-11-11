# P1 — Representaciones 02, 03 y 04

**Estado:** implementación de las representaciones derivadas; su aceptación está supeditada a los resultados de validación geométrica y topológica.

## Principio invariable

El grafo conceptual es **uno solo**. Las vistas 02–04 no pueden crear, editar ni eliminar conceptos o vínculos, y no alteran el punto de control de 01. El plano original continúa siendo la vista de edición. Filtrar profundidad, hacer zoom o desplazar la cámara no recalcula recorridos.

La jerarquía utilizada en 03 y 04 es la **menor distancia en número de vínculos hasta P1**, obtenida por búsqueda en anchura sobre el grafo no dirigido. No se inventan relaciones: los componentes desconectados quedan etiquetados y situados en una banda periférica visual sin asignarles un camino artificial al origen.

## 02 · Compacto — P1-ET-02 (desarrollo normado)

**Prioridad inviolable: 01 topología → 02 zonas J1 → 03 longitud real.** No se permite generar sectores desde cero y tratar de reparar los cruces después. El punto de partida es la geometría de 01 *certificada* por su propio registro, y el algoritmo se detiene si esa referencia no pasa auditoría.

Se utiliza una **isotopía separable del plano**: `(x,y) → (F(x),G(y))`, con `F,G` estrictamente crecientes. Dentro de la franja ocupada por cada cuadro más un margen de protección, la función se comporta como una traslación rígida: mantiene dimensiones, caras de puertos, stubs y líneas legibles. Todos los cuadros, puertos y **todos los puntos de los recorridos existentes de 01** reciben exactamente la misma transformación. No se llama al enrutador para inventar nuevas trayectorias.

Antes de adoptar cada alternativa, el validador DRC exige cero cuadros solapados, cero rutas inválidas, cero puertos duplicados y 100 % de los vínculos. El registro paralelo se contrasta con la **firma original de 01**, conservando identidad y orden de puertos, pares y secuencia de cruces y vecindades observadas. Así, esta familia de transformaciones es intencionalmente más conservadora que lo máximo que autoriza P1-ET-02, pero ofrece una garantía matemática clara.

Solo después de una etapa topológicamente certificada, se comprueba la asignación angular de cada rama J1. **La pertenencia sectorial exige el cuadro completo**, no solamente el punto de su centro. Los términos huérfanos no se adjudican a una rama ficticia. Se ensayan expansiones exclusivamente en franjas sin cuadros entre ramas, siempre con validación, para intentar separar los sectores. Si no existe distribución válida dentro de esta familia de transformaciones, se declara expresamente **en revisión**.

Finalmente, si las zonas se han alcanzado, se exige reducción de la suma de **longitudes reales** de las polilíneas respecto a 01. El resultado que no cumpla los tres niveles NO se presenta ni exporta como aprobado, aunque se pueda visualizar un **checkpoint parcial topológicamente certificado** para análisis.

Este procedimiento no presume que las únicas isotopías posibles sean deformaciones de X e Y; su alcance inicial es la clase con garantía demostrable y auditoría independiente. Una posible ampliación futura requiere una prueba igualmente estricta, no menos estricta.

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
- El enrutador utiliza preferencias de salida de puertos acordes al contexto geométrico: columnas en 01, deformación certificada de las rutas de 01 en 02, y orientación espacial en 03–04.
- Antes de considerar válida una vista se ejecuta el mismo validador independiente: **cero cuadros solapados, cero rutas inválidas, cero puertos repetidos, cero vínculos pendientes**, y jerarquías radiales correctas.
- Si alguna conexión no se puede resolver, su relación conceptual sigue existiendo, pero no se dibuja una ruta ficticia. La vista anuncia expresamente **«En revisión»** y los vínculos pendientes.

### Registro topológico por vista

Se distingue entre la **topología conceptual** (identidades de nodos y vínculos), que es idéntica en las cuatro representaciones, y la **topología de la inmersión gráfica** (orden de puertos, cruces, vecindades), que puede ser diferente al organizar el mismo grafo sobre un plano, un círculo o una espiral.

No es matemáticamente correcto exigir que todos los nodos conserven su orden izquierda/derecha entre una disposición lineal y otra circular. Por tanto:

1. La referencia topológica de **01** permanece protegida; los arrastres manuales que cambien sus relaciones o produzcan rutas inválidas se revierten.
2. **02 contrasta directamente contra el registro topológico protegido de 01**. Las vistas 03 y 04 mantienen registros derivados propios.
3. La edición está habilitada exclusivamente en 01: cambiar de pestaña no reestructura una vista existente.
4. Los registros de vistas derivados se almacenan opcionalmente en \`derivedViews\` del JSON \`p1.graph.v1\`. La recuperación de puntos de control exige verificar identidad de grafo y fuente, geometría, reglas DRC y firma topológica antes de aceptar sus rutas.
5. Las nuevas distribuciones que no cumplan todas las condiciones no se declaran validadas aunque se pueda visualizar su estado provisional.

Este modelo **no transforma automáticamente un diseño planario en uno espiral preservando todos sus cruces originales**, pues puede ser incompatible con la disposición circular exigida. Es una restricción explícita y documentada, no una garantía falsa del motor.

## Modo oscuro

El cambio de tema solo cambia variables de color CSS y colores de exportación de SVG/PNG. No altera posiciones, métricas, rutas ni jerarquías. Se conserva la lectura de dos tintas y el estilo gráfico previo.

## Archivos

- \`js/geometry/ViewLayouts.js\`: posiciones puras de 02–04.
- \`js/views/DerivedViews.js\`: control de vistas, Worker, cachés, topología, DRC, recuperación y visualización.
- \`js/workers/initial-route.worker.js\`: enrutamiento según modalidad, sin cambiar la lógica de 01.
- \`js/core/TopologyRegister.js\`: firma relacional independiente.
- \`tests/views.test.js\` y \`tests/views_e2e.py\`: geometría formal, uso real del navegador y modo oscuro.

## Requisitos de aprobación

No basta con que se vean cuatro pestañas: las cuatro vistas deben representar todos los vínculos del caso PPR, no atravesar cuadros, conservar los puntos de control, respetar R01–R08 y pasar el test en navegador. La visualización de una vista **en revisión** no constituye su validación.
