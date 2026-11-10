# P1 — Diagramador de relaciones conceptuales

**Documento inicial de referencia · Requerimientos, normas y arquitectura del motor gráfico**  
**Corte de referencia:** 10 de noviembre de 2026  
**Versión del documento:** 0.1  
**Etapa de trabajo:** `01 · Plano`  
**Implementación de referencia al momento del corte:** `P1_Plano_R01_brazos_variables.html`

> **Principio rector:** El sistema debe representar fielmente la estructura conceptual con el mínimo ruido gráfico posible y conservar los resultados geométricos ya validados para no repetir cálculos innecesarios.

Este archivo documenta **lo acordado para P1**. Distingue las reglas normativas del proyecto, el funcionamiento acordado para el motor y las decisiones que siguen abiertas. **No autoriza a modificar funciones, estética o etapas adicionales por iniciativa del implementador.**

---

## 1. Qué es P1

P1 es un **diagramador de palabras o conceptos y sus vínculos**, concebido para apoyar una metodología de pensamiento denominada **fractaleo**. No es un diagramador de componentes de software, maquinaria o circuitos: toma ideas expresadas como términos y hace visibles su desarrollo y sus relaciones.

En la metodología de trabajo del grupo de investigación se construyen inicialmente tres diagramas temáticos —**pasiones**, **problemáticas** y **enfoque de trabajo**—. Se desarrollan sus conceptos y después se identifican relaciones entre ellos, hasta formar un diagrama conjunto. **Tres es el punto de partida metodológico, no una constante geométrica ni un límite del programa.**

El diagrama contiene un **núcleo único** (`J0`). Los términos directamente asociados al núcleo constituyen `J1`; cada uno inicia un brazo o rama. A partir de ellos se desarrollan generaciones sucesivas y se pueden crear vínculos transversales. Un término puede tener varios vínculos; eso **no** convierte esos vínculos en una sola ruta gráfica compartida.

### Vocabulario

| Término | Significado en P1 |
|---|---|
| **Concepto / término / nodo** | Palabra o texto identificado individualmente, representado dentro de un cuadro. Dos cuadros pueden mostrar el mismo texto y seguir siendo conceptos diferentes. |
| **Núcleo (`J0`)** | Único punto de origen del diagrama. |
| **Jerarquía (`Jn`)** | Nivel de distancia conceptual respecto del origen; el nivel de construcción en `01 · Plano` sigue el parentesco del fractaleo. Para las vistas posteriores deberá precisarse cómo resolver varios caminos posibles hacia `J0`. |
| **Brazo** | Desarrollo iniciado por un término `J1`. El número de brazos depende del número efectivo de esos términos. |
| **Vínculo** | Relación de datos entre dos conceptos; no debe confundirse con el camino visual que la representa. |
| **Ruta / trazado** | Camino geométrico propio de un vínculo, desde un puerto del cuadro de origen a otro del cuadro de destino. |
| **Puerto** | Punto exclusivo de llegada o salida de una ruta en el perímetro del cuadro correspondiente. |
| **Obstáculo** | Región que una ruta debe respetar: cuadros ajenos y espacios reservados por rutas existentes. |
| **Punto de control geométrico** | Estado validado y persistente de posiciones, dimensiones, puertos y recorridos. |

---

## 2. Etapas de representación previstas

Las etapas trabajan sobre **el mismo grafo conceptual**. Cambia la representación espacial, **no se inventan relaciones ni se modifica su significado para mejorar una imagen**.

| Etapa | Función | Alcance / estado |
|---|---|---|
| **01 · Plano** | Crear y fractalear conceptos en 2D, conectar términos y visualizar progresivamente la estructura. | **Única etapa sometida actualmente a implementación y evaluación.** |
| **02 · Reorganización** | Recolocar conceptos para disminuir las distancias entre términos vinculados y reducir ruido visual. | Requerimiento conceptual; no intervenir todavía. |
| **03 · Órbitas** | Representar la jerarquía mediante radios iguales para conceptos del mismo nivel; ordenar angularmente según cercanía relacional. | Requerimiento conceptual; no intervenir todavía. |
| **04 · Espiral** | Transformar la organización previa en un sistema espiral de tantos brazos como términos `J1`, conservando la progresión jerárquica y la cercanía entre relacionados. | Requerimiento conceptual; no intervenir todavía. |

En la representación orbital, los términos de una misma jerarquía tienen la **misma distancia radial**. En la espiral, los radios pueden **variar dentro del rango de cada jerarquía**, pero todos los radios de `J(n+1)` deben superar a los de `Jn`:

`máx(radio de Jn) < mín(radio de J(n+1))`

Parámetros conceptuales de la espiral: **W** (expansión por vuelta), **D** (distancia al eje) y **T** (traslación a lo largo del eje). En la vista espiral plana, **`T = 0`**. El número de brazos **no está fijado en tres**.

---

## 3. Normas obligatorias de representación

Estas normas proceden de los acuerdos del proyecto. Son **condiciones de validez geométrica** y se aplican a todas las etapas, no sugerencias estéticas.

### R01 · Número variable de brazos

Existe un solo núcleo `J0`. **Cada término que nace directamente de `J0` cuenta como un término `J1` y da lugar a un brazo**. Puede haber uno, tres, cuatro, once o cualquier cantidad permitida por la estructura de datos; ninguna parte del motor debe asumir exactamente tres.

### R02 · Respeto absoluto a los cuadros ajenos

Una ruta solo puede tocar los cuadros de **sus dos extremos**, en los puntos de conexión que le corresponden. **No puede tocar, rozar ni atravesar** cuadros de otros conceptos durante su recorrido.

### R03 · Recorrido exclusivo para cada vínculo

Dos rutas **no pueden compartir un segmento**, aunque sean paralelas o tengan el mismo origen. Las líneas deben conservar recorridos individualizables de principio a fin; no se permiten solapamientos longitudinales.

### R04 · Puertos independientes; sin bifurcaciones en Y

Cada vínculo tiene su propio punto de salida y su propio punto de entrada. Si cinco vínculos parten de un concepto, se dibujan **cinco recorridos independientes**, no una ruta común que se bifurca. El principio se mantiene incluso cuando los vínculos tienen el mismo origen.

### R05 · Cruces excepcionales inequívocos

Se deben **evitar los cruces**. Si alguno resulta inevitable, deberá utilizarse un recurso gráfico que permita seguir inequívocamente cada línea y que **no sugiera un vínculo adicional**. Un cruce puntual distinguible **no** autoriza a compartir tramos.

### R06 · Prioridad de enrutamiento

Primero se satisfacen las **restricciones obligatorias** R02–R05. Después se prioriza, en este orden:

1. Recorridos **sin cruces** o, si no existen, con la menor cantidad viable.
2. Entre alternativas igualmente válidas en cruces, **menor longitud**.

La conexión más corta no es preferible si implica atravesar cuadros, solapar rutas o introducir cruces evitables.

### R07 · Construcción progresiva por jerarquías

Se ubica el núcleo `J0` y se trazan sus relaciones con `J1`. Se continúa de modo creciente con `J2`, `J3`, etc. Una conexión transversal se incorpora respetando los obstáculos y las rutas ya existentes. El orden jerárquico debe orientar el cálculo, no utilizarse para inventar parentescos de datos.

### R08 · Universalidad

Las restricciones de claridad, independencia y validez geométrica **se aplican a las cuatro representaciones**, aunque cada etapa utilice una organización espacial diferente.

---

## 4. Modelo de enrutamiento inspirado en PCB monocapa

La analogía no consiste en imitar la apariencia de un circuito ni en llenar el dibujo de pistas. Es un **modelo de ocupación, reserva, negociación y validación del espacio geométrico**.

En el enrutamiento de una placa de circuito impreso de una sola cara, las pistas ocupan una misma superficie, deben llegar a terminales correctos y respetar distancias frente a otros conductores y obstáculos. Para P1 se adoptan **sus principios geométricos**, con diferencias explícitas respecto de la conectividad eléctrica real:

| PCB monocapa | P1 |
|---|---|
| Superficie conductora única | Plano de representación 2D |
| Pads o terminales | Puertos individuales del cuadro |
| Pistas y su anchura física | Rutas gráficas y separación visual reservada |
| Componentes / zonas prohibidas | Recuadros ajenos y regiones ocupadas por otras rutas |
| Reglas de separación (*clearance*) | Separación que preserve lectura y evite contactos/solapamientos |
| Validación de reglas de diseño (*DRC*) | Auditoría independiente de geometría y vínculos |
| Enrutamiento alrededor de obstáculos (*walk around*) | Primera opción: encontrar ruta sin modificar geometría validada |
| Desplazamiento de pistas (*shove*) | Eventual reajuste **local y validado** si la nueva ruta no cabe |

### Diferencias que no deben perderse

- En una PCB, una pista puede bifurcarse si pertenece a la **misma red eléctrica**. **P1 prohíbe las Y y las rutas compartidas**: cada vínculo conceptual es independiente.
- Una PCB monocapa no permite cruces conductores independientes sobre la misma cara sin aislamiento físico (por ejemplo, un puente). **P1 admite cruces puntuales como recurso gráfico excepcional**, siempre que se distingan claramente los recorridos.
- El usuario no quiere una estética de PCB: **quiere aplicar su disciplina de enrutamiento** a un diagrama de palabras.
- No se han fijado valores numéricos de separación, ángulos permitidos, costos de giro o símbolo definitivo de cruce. **No inventarlos como nuevas normas**.

### Principios operativos

**1. Ocupación de espacio.** Una ruta no solo tiene una línea central: necesita un entorno libre que permita distinguirla de otras rutas y cuadros.

**2. Puertos y carriles.** Varios vínculos del mismo concepto requieren puertos distintos. La salida individual debe mantenerse a lo largo del recorrido; el paralelismo no implica superposición.

**3. Evitar antes de desplazar.** El intento inicial debe rodear las geometrías válidas existentes. Si no es posible, podrá considerarse una reconfiguración **limitada a los elementos efectivamente afectados**, sin reorganizar todo el grafo por defecto.

**4. Cruces frente a solapamientos.** Un cruce puntual es una eventualidad representable con separación visual. Un tramo compartido está prohibido.

**5. No confundir fallo de búsqueda con imposibilidad matemática.** «El algoritmo no encontró ruta» no demuestra que no exista una ruta válida. Si no se resuelve, el sistema debe **conservar el vínculo en los datos y reportar la ruta pendiente**, nunca dibujarla de manera engañosa.

**6. Validación sobre la geometría real.** No basta con que visualmente parezca correcto. La auditoría debe examinar las posiciones, los segmentos, los puertos y sus distancias, incluidos los cruces representados.

---

## 5. Arquitectura acordada: motor incremental y puntos de control

**Queda descartado recalcular todo el diagrama cada vez que se presenta, se selecciona un elemento o se aplica un filtro.** Hay tres operaciones distintas:

1. **Calcular geometría:** distribuir cuadros, asignar puertos y hallar rutas.
2. **Modificar geometría:** invalidar solo las dependencias afectadas y recalcularlas.
3. **Mostrar geometría existente:** pintar, ocultar, resaltar, hacer zoom o desplazarse **sin ejecutar de nuevo el enrutador**.

Flujo establecido:

`Cálculo inicial → validación → punto de control → cambio local → recálculo afectado → validación → nuevo punto de control`

Un punto de control debe conservar la geometría ya resuelta —**posiciones, tamaños, puertos, rutas y ocupaciones**— y permitir que los siguientes cambios respeten lo anterior. El cálculo inicial, aunque sea costoso, se hace cuando sea necesario; **no se repite por cada interacción**.

### Regla de invalidación mínima

| Acción | Tratamiento esperado |
|---|---|
| Filtro de profundidad | **Solo mostrar u ocultar** términos y vínculos; sin redistribuir ni calcular rutas. |
| Selección, resaltado, zoom o paneo | Cambios de vista; **cero cálculos de rutas**. |
| Edición de texto sin cambiar el tamaño real del cuadro | Actualizar contenido; conservar geometría si permanece válida. |
| Cambio de tamaño de un cuadro | Revisar únicamente sus puertos, sus vínculos y rutas que ahora colisionen. |
| Añadir un concepto | Calcular su ubicación y su vínculo nuevo; conservar las rutas válidas existentes. |
| Añadir un vínculo | Buscar únicamente su recorrido; si no cabe, considerar reajuste localizado. |
| Eliminar un vínculo | Retirar su ruta y actualizar ocupación, sin redistribuir lo demás. |
| Mover un concepto manualmente | Fijar la nueva posición válida y recalcular rutas afectadas; no restaurar la posición anterior automáticamente. |
| Deshacer | Recuperar los cambios geométricos correspondientes sin regenerar todo el grafo. |
| Guardar/abrir JSON | Conservar el grafo y, cuando exista, su estado geométrico validado; sin confundir datos conceptuales con trazado. |

Las posiciones y rutas validadas son **estado persistente**, no resultados desechables de `render()`.

### Persistencia

La implementación de referencia conserva el modelo conceptual en JSON (`p1.graph.v1`) e incorpora un punto de control geométrico opcional (`planeCheckpoint`). La existencia de un punto de control **no debe impedir** cargar datos que carezcan de él: en ese caso se calcula la geometría inicial una sola vez.

Una posición fijada manualmente por el usuario debe ser respetada frente a futuras visualizaciones y filtros. Cualquier reajuste posterior debe derivarse de una operación que lo justifique, no del mero repintado.

---

## 6. Interfaz y lenguaje visual: alcance cerrado

La **estética y las funciones de la interfaz están definidas**. Las intervenciones presentes corresponden al **motor de representación**, no a un rediseño general del programa.

Referencia estética de estudio: [Anatomy, de wheresryan22](https://github.com/wheresryan22/anatomy). Interesa su precisión de contornos, jerarquía tonal discreta, monocromía, composición serena y control de detalles; **no** se pretende copiar máquinas isométricas ni convertir cada concepto en un bloque tridimensional.

- Las **palabras y sus vínculos** son protagonistas.
- No agregar leyendas, símbolos, tarjetas, adornos o mecanismos de presentación que no aporten lectura ni hayan sido solicitados.
- El código puede ser complejo; la lectura del diagrama debe ser sencilla.
- Se conservan las funciones de edición, selección, vínculos, eliminación, deshacer, profundidad, desplazamiento, zoom y exportación en cuanto correspondan a la interfaz vigente.
- La edición manual de la posición de los cuadros está admitida y su resultado debe permanecer estable.

---

## 7. Pruebas de aceptación y observabilidad

**Una captura atractiva o un número correcto de vínculos dibujados no bastan para declarar el motor válido.** La verificación debe cubrir tanto la interfaz como los invariantes geométricos.

| Área | Qué comprobar |
|---|---|
| R01 | Crear un nuevo concepto desde `J0` produce **otro `J1` independiente**, no un descendiente forzado de una rama previa. Probar diferentes cantidades de brazos. |
| Cuadros | Ningún cuadro se solapa con otro; una ruta jamás atraviesa un cuadro ajeno. |
| Rutas | Cada vínculo tiene su propio camino y sus puertos; no hay tramos compartidos ni Y. |
| Cruces | Se evitan en primer término; los inevitables permiten identificar qué ruta sigue por dónde. |
| Orden jerárquico | Se construye desde `J0` hacia generaciones superiores, preservando los datos. |
| Filtros | Cambiar profundidad oculta/muestra **sin alterar coordenadas ni rutas** y sin invocar el cálculo geométrico. |
| Incrementalidad | Agregar un vínculo no recalcula todos los anteriores; un cambio local solo invalida dependencias pertinentes. |
| Movimiento manual | Se conserva la posición fijada y se validan las rutas que resulten afectadas. |
| Persistencia | Exportar/importar JSON conserva relaciones y, cuando aplica, el punto de control geométrico. |
| Edición | Probar añadir, editar, vincular, desvincular, eliminar y deshacer sin pérdida de datos. |
| Exportación | SVG y PNG deben corresponder al diagrama representado y no depender de reconstrucciones arbitrarias. |
| Rendimiento | Medir separadamente **cálculo inicial**, **cálculo incremental** y **repaint**. Evitar congelar el navegador en operaciones ordinarias. |
| Compatibilidad | Una misma entrada y punto de control deben producir una representación estable entre navegadores compatibles. |
| Rutas pendientes | Reportar la imposibilidad de resolverlas y conservar los vínculos subyacentes sin fingir una solución. |

La auditoría debe registrar **qué se probó, con qué datos y qué quedó pendiente**. No convertir resultados de pruebas puntuales en garantías universales.

---

## 8. Estado al corte y límites del alcance

- **Base de trabajo:** `P1_Plano_R01_brazos_variables.html`, posterior al motor incremental y a la corrección de R01.
- **Trabajo actual:** consolidar y corregir únicamente `01 · Plano` sobre esa base o su sucesora expresamente aprobada.
- **Estado reportado en las iteraciones previas:** visualización estable entre navegadores, mayor fluidez mediante puntos de control, movimiento manual de cuadros y corrección de creación de nuevos `J1` desde el núcleo. Estas son observaciones de las pruebas realizadas, **no una certificación general para cualquier grafo**.
- **Pendientes conceptuales de las vistas futuras:** criterios exactos para jerarquía cuando existen múltiples caminos hacia `J0`, parámetros geométricos finales de órbitas y espirales, y métodos de proximidad relacional. No resolverlos por anticipado dentro de la primera etapa.
- **Pendientes numéricos del enrutamiento:** distancias mínimas, conjunto de ángulos de giro, representación definitiva de cruces y umbrales de búsqueda. No asumir valores permanentes sin evaluación.

### Regla de intervención

1. Usar **únicamente la versión vigente** del HTML para cambios funcionales.
2. **No recuperar ni reutilizar** el motor gráfico anterior eliminado deliberadamente, ni su código descartado.
3. Limitar cada interacción a **uno o dos problemas** concretos, siguiendo la metodología acordada de cambios pequeños.
4. Diagnosticar primero, intervenir después y comprobar regresiones frente a **R01–R08**.
5. Conservar interfaz, funciones y datos no implicados en la corrección.
6. No adelantar la implementación de las etapas `02`, `03` o `04` mientras se trabaja en `01 · Plano`.
7. Entregar el **HTML completo y funcional**, no piezas o integradores que el usuario deba ensamblar.
8. Actualizar la documentación cuando cambie una decisión ya acordada; no presentar una suposición técnica como nueva norma.

---

## 9. Referencias conceptuales

- **Referencia visual:** [Anatomy — wheresryan22](https://github.com/wheresryan22/anatomy), especialmente los criterios de precisión, detalle y limpieza visual.
- **Analogía de enrutamiento:** diseño de pistas de PCB monocapa, separación (*clearance*), comprobación de reglas (*DRC*), recorrido alrededor de obstáculos (*walk around*) y desplazamiento controlado (*shove*), según prácticas conocidas de herramientas como **KiCad** y **Altium Designer**. Estas referencias **no sustituyen** las reglas particulares de P1; algunas prácticas eléctricas (por ejemplo, bifurcaciones de la misma red) están explícitamente prohibidas aquí.
- **Fuente principal de las decisiones de este README:** acuerdos y correcciones del proyecto P1 hasta el punto de corte indicado al inicio.

---

**Síntesis:** P1 utiliza una interfaz fija para construir diagramas conceptuales y un motor geométrico incremental que ubica conceptos, busca rutas exclusivas y valida su claridad. La geometría ya resuelta debe permanecer estable; cada intervención debe ser local, verificable y fiel a las normas **R01–R08**.