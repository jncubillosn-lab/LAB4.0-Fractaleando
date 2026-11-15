# Guía de uso de Fractalear

Referencia: **0.2.15 · 15 de noviembre de 2026**.

[Abrir la aplicación](https://jncubillosn-lab.github.io/LAB4.0-Fractaleando/) ·
[Estado y decisiones del proyecto](CORTE_0_2_11.md).

## Construir en 01 Editor

1. Al abrir la herramienta aparece un solo núcleo con el texto **¿Qué quieres
   fractalear hoy?**. **Nuevo** vuelve a ese punto de partida, sin ramas ni
   vínculos predefinidos. Usa **Ejemplo PPR** para consultar el ejemplo completo.
2. Haz clic en un cuadro para seleccionarlo. Cambia su texto en **Contenido**;
   un doble clic en el cuadro lleva a ese campo.
3. Pulsa **+ Concepto** para crear un hijo del seleccionado. La selección se
   queda en el padre: puedes pulsar varias veces para crear hermanos y
   completar sus textos después.
4. Arrastra un cuadro a una posición libre para reorganizar el Editor. Las
   conexiones afectadas ajustan sus recorridos y puntos de entrada y salida.
5. Usa **− / +** en **Anchura del recuadro** para modificar el ancho solicitado.
   La letra mantiene su tamaño; el cuadro se ensancha cuando una palabra
   completa necesita más espacio. Las frases pueden ocupar varios renglones.

Los nuevos hijos se distribuyen en distintas direcciones, eligiendo entre dos
candidatos según el espacio. Su aparición no obliga a que todos crezcan hacia
la derecha ni a que los cuadros existentes cambien de posición.

## Crear una relación entre conceptos existentes

1. Elige **Continua**, **Punteada** o **Segmentada** debajo de **+ Concepto** y
   **Conectar**. Continua es la opción inicial.
2. Selecciona el primer concepto y pulsa **Conectar**.
3. Selecciona el segundo concepto para crear el vínculo. Para añadir una nueva
   rama directamente al núcleo, selecciónalo y usa **+ Concepto**.

El estilo también se aplica a la conexión de un nuevo hijo creado con
**+ Concepto**. Elegir otro estilo afecta a las conexiones creadas después;
no cambia las ya existentes. Un estilo visual no asigna por sí mismo un
significado a la relación.

**Escape** cancela una conexión en curso. **Deshacer** permite revertir una
operación; **Ctrl+Z** fuera del campo de texto ejecuta esa misma acción.

## Leer las tres representaciones

| Control | Resultado |
| --- | --- |
| **01 Editor** | Construcción y movimiento manual de conceptos. |
| **02 Compacto** | Distribución radial compacta del mismo grafo. |
| **03 Espiral** | Representación espiral derivada de la organización compacta. |
| **Profundidad de lectura** | Muestra generaciones hasta el nivel elegido. Comienza en el máximo real. |
| **Todas las capas** | Recupera la visualización completa. |
| **Centrar lectura** y controles de zoom | Ajustan la cámara para recorrer el diagrama. |
| **Oscuro** | Alterna la apariencia de la aplicación. |

En Compacto y Espiral puedes seleccionar para seguir relaciones, pero la
edición y el arrastre se realizan en Editor. Seleccionar un término en las
vistas de lectura resalta su ascendencia hasta el núcleo y sus conexiones
directas, incluidas las transversales.

El grosor ayuda a leer la jerarquía: las conexiones próximas al núcleo son más
gruesas que las de las hojas cuando hay varias generaciones. Los blancos de los
cruces distinguen un cruce de una unión. Los avisos de revisión o de rutas
pendientes deben leerse como el estado del resultado mostrado.

## Guardar y compartir

| Acción | Uso |
| --- | --- |
| **Guardar JSON** | Conservar el trabajo editable, incluidos sus conceptos, vínculos y estados geométricos disponibles. |
| **Abrir JSON** | Continuar un archivo guardado; sustituye el grafo mostrado tras validar la entrada. |
| **Exportar vista SVG** | Obtener la representación vectorial actual, con fuente y estilos incorporados. |
| **Exportar grafo completo · PNG 4K** | Obtener una imagen de toda la representación activa, aunque una parte esté fuera de pantalla u oculta por el filtro. El lado mayor mide 4096 píxeles y se conserva la proporción. |

Usa JSON para seguir editando. Guarda el trabajo antes de iniciar otro diagrama
o cargar un ejemplo. SVG y PNG sirven como representaciones visuales.

## Si aparece un aviso

Una ruta pendiente significa que el motor no encontró un recorrido válido dentro
de sus intentos. El PNG no se exporta con conexiones pendientes. **EN REVISIÓN**
señala comprobaciones normativas aún incumplidas; no implica que los conceptos
o vínculos hayan desaparecido. Los límites de este corte se describen en
[la referencia de estado](CORTE_0_2_11.md).
