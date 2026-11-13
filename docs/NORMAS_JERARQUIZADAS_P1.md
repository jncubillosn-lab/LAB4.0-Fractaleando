<!-- Transcripción de Normas_jerarquizadas_P1_v0_1.docx, versión 0.1 del 13 de noviembre de 2026. -->

# Normas jerarquizadas del diagramador

Referencia de construcción y validación para la representación circular de P1

Versión 0.1 · 13 de noviembre de 2026 · Base de trabajo para revisión

Este documento consolida las aclaraciones de esta conversación. Su propósito es ordenar la construcción del motor y permitir verificar cada resultado contra reglas explícitas. No certifica la implementación existente ni sustituye una definición pendiente por una decisión del programador.

## 1 Orden de autoridad y validación

La prioridad organiza las decisiones y las comprobaciones. Una regla inferior no autoriza incumplir una superior. Todas las reglas obligatorias aplicables deben cumplirse para aprobar el resultado completo; no se compensan fallos mediante una puntuación promedio.

| Nivel | Materia | Pregunta de control |
| --- | --- | --- |
| 0 | Referencia e integridad | Qué datos y topología se están validando. |
| 1 | Conservación topológica | Qué relaciones y órdenes son invariantes. |
| 2 | Estructura circular | Núcleo, ramas y avance jerárquico. |
| 3 | Geometría y legibilidad | Solapes, trazado, distancia y lectura. |
| 4 | Construcción y operación | Crecimiento, controles y estabilidad. |
| 5 | Aceptación y evidencia | Resultado completo y fallos reproducibles. |

Los identificadores N0 a N5 pertenecen a este documento y no renumeran las normas históricas R01, R02 y siguientes del proyecto. Los niveles normativos tampoco son los niveles de descendencia J0, J1, J2 del grafo.

## 2 Vocabulario operativo

Grafo: cuadros y vínculos identificados. Topología fijada: organización de conexiones y ramas que debe conservarse. Geometría: posiciones, lados de salida, orientaciones y recorridos concretos. Puerto: punto donde una conexión alcanza el perímetro de su cuadro. Cruce: intersección de recorridos sin que exista un nodo conceptual en ella.

## 3 Niveles 0 y 1 Referencia y topología

### N0.1 Identidad íntegra del grafo

Toda redistribución conserva identificadores, cuadros, vínculos, extremos, parentescos y ramas. Se incluyen los vínculos transversales. No se fusionan conceptos por tener el mismo texto ni se omiten elementos difíciles de colocar.

Validación. Comparar los conjuntos y sus atributos estructurales con la entrada. Debe haber cero adiciones, pérdidas o cambios no autorizados.

### N0.2 Referencia explícita y estable

La topología inicial puede optimizarse durante su definición. Una vez validada y fijada, las redistribuciones se comparan con esa misma referencia. 01 Plano es la referencia del trabajo actual; cualquier sustitución debe ser explícita y versionada.

Validación. Registrar la versión del grafo y de la referencia. Una vista derivada no puede aprobarse capturando su propio resultado como nueva referencia.

### N1.1 Orden circular de conexiones

Se conserva el orden circular de las conexiones alrededor de cada cuadro, leído siempre en el mismo sentido. A B C D y C D A B representan el mismo orden; A C B D lo altera. La reflexión no equivale a una rotación.

Validación. Comparar secuencias de identidades de conexiones admitiendo desplazamiento circular del inicio, sin permutaciones ni inversión del sentido. Con uno o dos puertos, esta prueba aislada no distingue todas las reorganizaciones.

### N1.2 Puertos libres de lado fijo

Los puertos pueden desplazarse por el perímetro y pasar de un lado a otro sin cambiar su orden circular. La referencia no fija obligatoriamente lado, esquina ni coordenada del puerto. Esta libertad no obliga a rotar el texto.

Validación. Comprobar que cada puerto permanece en el perímetro del cuadro correcto y que su desplazamiento no intercambia conexiones.

### N1.3 Organización global conservada

Conservar solo los extremos y el orden local no basta. Los recorridos deben mantener la organización topológica fijada y no introducir cruces nuevos. Los cruces existentes no son nodos ni autorizan vínculos nuevos.

Validación. Contrastar la organización global contra la referencia. El tratamiento exacto de cruces ya existentes debe cerrarse mediante D3 antes de declarar aprobada esta comprobación.

Consecuencia: una mejora de distancia o apariencia que viole N0 o N1 se rechaza. Una modificación explícita del grafo requiere una actualización controlada de la referencia; no se trata como una simple redistribución.

## 4 Niveles 2 y 3 Estructura y geometría

### N2.1 Núcleo y ramas principales

J0 ocupa el centro estructural de la representación circular. Cada hijo real de J0 define una rama principal J1 y su región. El número de ramas no se fija en tres ni en otra constante.

Validación. Verificar el origen de la distribución y la correspondencia entre hijos de J0 y ramas. Trasladar la cámara no altera este origen estructural.

### N2.2 Pertenencia y avance jerárquico

Los descendientes conservan su pertenencia a la rama. La distribución crece hacia el exterior por jerarquías, sin reasignar padres para acomodar cuadros. No se imponen radios iguales ni sectores de igual tamaño por defecto.

Validación. Comprobar pertenencia y avance radial conforme a D4. La fórmula exacta de bandas o comparación entre niveles no puede escogerse silenciosamente.

### N3.1 Cuadros separados y conexiones correctas

No se permiten solapes entre cuadros. Las líneas solo tocan los cuadros a los que están vinculadas y no atraviesan cuadros ajenos. Dos conexiones no deben confundirse en un tramo compartido.

Validación. Auditar las cajas y el recorrido realmente dibujado, incluidas sus curvas, extremos y puertos. Un recorrido auxiliar válido no prueba que la curva final también lo sea.

### N3.2 Cruces legibles

La representación mantiene la lógica de trazado en un plano. Cuando un cruce esté aceptado en la referencia, debe distinguirse visualmente de una unión y permitir seguir ambas conexiones.

Validación. Comprobar los cruces frente a N1.3 y revisar su señalización. No resolver una dificultad mediante conexiones ocultas o supuestas capas adicionales.

### N3.3 Distancia máxima de dos alturas

La separación máxima entre cuadros debe respetar la cota de dos veces la altura de un cuadro. Esta es una condición obligatoria de cercanía; el motor no puede ampliarla automáticamente para aprobar.

Validación. Antes de automatizar la prueba deben cerrarse D1 y D2: pares de cuadros evaluados, definición de distancia y altura de referencia. Sin ello, el resultado es pendiente de definición.

### N3.4 Lectura y estilo

Se mantienen textos legibles, cajas ajustables, líneas curvas y el lenguaje visual del proyecto. Reducir globalmente el dibujo hasta volver ilegibles los textos no resuelve la compacidad.

Validación. Revisar el resultado en la interfaz y en la exportación. No introducir umbrales numéricos de fuente, márgenes o zoom sin identificarlos como parámetros propuestos.

## 5 Nivel 4 Construcción y operación

### N4.1 Conocer el conjunto antes de colocarlo

El motor conoce la estructura completa antes de distribuirla. Construye desde J0 hacia J1 y las siguientes jerarquías considerando los descendientes y vínculos que todavía faltan por colocar.

Validación. Verificar que la planificación usa la estructura completa. El éxito con pocos cuadros no sustituye la aceptación del caso grande.

### N4.2 Crecimiento con comprobación en cada paso

Cada incorporación se comprueba contra las normas aplicables y la referencia fijada. Una decisión local no debe aprobarse ignorando sus efectos sobre las ramas pendientes. Se permite revisar coordenadas anteriores conservando la topología.

Validación. Registrar el primer paso que falla, los cuadros y vínculos implicados y la norma vulnerada. Volver al último estado válido o revisar la geometría; nunca acumular fallos como si fueran pasos aprobados.

### N4.3 Validación independiente del colocador

La comprobación debe medir el resultado contra la entrada y la referencia, sin limitarse a confiar en una marca de éxito del algoritmo. Las preferencias geométricas no pueden compensar un incumplimiento.

Validación. Contrastar identidad, orden, recorridos, posiciones y cotas con comprobaciones separadas. Revalidar niveles anteriores afectados por cualquier ajuste posterior.

### N4.4 Estabilidad de la interacción

La interfaz conserva sus funciones acordadas. Zoom, desplazamiento y filtros de visualización no reconstruyen toda la distribución. El movimiento manual queda sujeto a las mismas normas. No se impone una profundidad artificial ni se ocultan elementos para aprobar.

Validación. Comprobar que las operaciones visuales reutilizan el punto de control. Una edición estructural invalida y actualiza únicamente lo que corresponda, manteniendo la coherencia del conjunto.

## 6 Nivel 5 Aceptación ordenada

Secuencia de aprobación: identificar entrada y referencia; validar N0; validar N1; validar N2; validar N3; comprobar N4; emitir el resultado N5. Si falla un nivel, se detiene la aprobación. Se pueden continuar mediciones para diagnóstico, identificándolas como tales.

Estados por norma: CUMPLE cuando hay evidencia suficiente; INCUMPLE cuando existe un contraejemplo; PENDIENTE DE DEFINICIÓN cuando falta un criterio normativo; NO EVALUADO cuando falta ejecutar la prueba o una dependencia impide hacerlo. NO APLICA solo se admite con una justificación concreta.

La aprobación total exige que todas las normas obligatorias aplicables cumplan. No encontrar una distribución válida significa que el intento no resolvió el caso; no demuestra que las reglas sean incompatibles. No se presenta ni exporta como validado un resultado que siga pendiente o incumpla normas.

## 7 Definiciones que faltan por cerrar

Estas precisiones están separadas de las normas para impedir que una interpretación de implementación se convierta en un requisito aprobado. Afectan la certificación completa, pero no impiden verificar las reglas ya definidas.

### D1 Pares y medida de distancia

Debe fijarse qué significa «distancia entre cuadros»: qué pares se evalúan y desde dónde se mide. En la conversación se propuso evaluar cuadros directamente vinculados mediante separación mínima entre bordes.

Validación. Confirmar o ajustar esa interpretación y su aplicación a los vínculos transversales. Diferenciarla de la distancia entre centros y de la longitud del recorrido.

### D2 Altura de referencia

Las cajas pueden tener alturas diferentes. Falta fijar si H es una altura base común o una altura determinada para cada relación.

Validación. Definir H y cómo responde al ajuste de una caja. No utilizar por defecto la menor altura de todo el diagrama ni cambiar H para hacer aprobar un resultado.

### D3 Cruces de la referencia

La conservación del orden circular y la prohibición de nuevos cruces están claras. Falta precisar si los cruces ya existentes deben conservarse exactamente o pueden eliminarse durante una etapa explícita de optimización inicial.

Validación. Fijar la política antes de congelar la referencia: pares que se cruzan y, cuando corresponda, su orden a lo largo de cada vínculo. Una vez congelada, aplicar la misma política a toda redistribución.

### D4 Jerarquías y regiones radiales

Debe precisarse si el avance radial exige separar globalmente todos los niveles o se compara entre padre e hijo. También debe fijarse si la región contiene la caja completa o su centro.

Validación. Cerrar ambas condiciones sin confundir pertenencia topológica con un ángulo numérico permanente. No imponer sectores iguales ni bandas estrictas como supuestos del motor.

## 8 Registro mínimo de una validación

Cada informe debe incluir: versión de este documento; versión de grafo y referencia; valores acordados de D1 a D4; caso evaluado; norma comprobada; estado; resultado esperado y observado; identificadores afectados; evidencia reproducible; y primer paso de construcción donde aparece el fallo.

Los márgenes, tolerancias numéricas y parámetros del trazado se registran aparte. Por ejemplo, 14 píxeles de margen no son una norma acordada en esta conversación. Una tolerancia numérica debe tratar errores de cálculo, no encubrir incumplimientos visibles.

Fuente de esta versión: acuerdos y aclaraciones de la conversación sobre P1. La numeración y la secuencia de validación constituyen la organización propuesta por este documento. Su publicación no declara que el código actual ya cumpla estas normas.
