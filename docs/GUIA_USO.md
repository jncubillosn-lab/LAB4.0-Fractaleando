# Guía de uso de Fractalear

Referencia final: **1.3.2 · 16 de noviembre de 2026 · desarrollo cerrado**.

[Abrir la aplicación](https://jncubillosn-lab.github.io/LAB4.0-Fractaleando/) ·
[Alcance y límites del cierre](CIERRE_DESARROLLO.md).

## Construir en 01 Editor

1. Al abrir la herramienta aparece un solo núcleo con el texto **¿Qué quieres
   fractalear hoy?**. **Nuevo** vuelve a ese punto de partida, sin ramas ni
   vínculos predefinidos. Usa **Ejemplo** para consultar el ejemplo completo.
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
| **Controles de cámara** | Cuatro símbolos: alejar, acercar, encuadrar todo el diagrama y centrar el núcleo. |
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

**Guardar** presenta las condiciones de la biblioteca pública y permite elegir
**Exportar JSON** para conservar una copia local sin publicarla. Si eliges
continuar, solicita únicamente el nombre y muestra una confirmación final.
**Solo pulsar «Sí» en esa tercera ventana envía el JSON actual a la biblioteca.**
«No» vuelve al nombre sin enviar nada; cerrar o pulsar Escape también cancela.
Cada guardado crea una copia nueva; un nombre repetido no sobrescribe la anterior. La herramienta
confirma cuando el servicio devuelve el identificador del archivo guardado.

**Biblioteca** muestra los diagramas disponibles. Pulsa un nombre para abrirlo;
se solicitará confirmación antes de sustituir el trabajo actual. Los archivos
de la biblioteca son públicos para todos los visitantes. Los botones locales
**Exportar JSON** y **Importar JSON** siguen disponibles.

Las acciones de archivo se encuentran en la barra superior. La esquina inferior
del lienzo reúne los cuatro símbolos de cámara en una sola fila. El círculo con
el punto central lleva al núcleo; la mira encuadra todo el diagrama.

Las citas de **Otras miradas** comienzan por una elegida al azar en cada apertura.
Las flechas permiten recorrer las diecisiete citas en su secuencia habitual.

| Acción | Uso |
| --- | --- |
| **Exportar JSON** | Conservar el trabajo editable, incluidos sus conceptos, vínculos y estados geométricos disponibles. |
| **Importar JSON** | Continuar un archivo guardado; sustituye el grafo mostrado tras validar la entrada. |
| **SVG** | Obtener la representación vectorial actual, con fuente y estilos incorporados. |
| **PNG** | Obtener una imagen de toda la representación activa, aunque una parte esté fuera de pantalla u oculta por el filtro. El lado mayor mide 4096 píxeles y se conserva la proporción. |

Usa JSON para seguir editando. Guarda el trabajo antes de iniciar otro diagrama
o cargar un ejemplo. SVG y PNG sirven como representaciones visuales.

## Si aparece un aviso

La barra animada del centro indica que hay un cálculo o una exportación en
curso. El texto describe la etapa; no representa un porcentaje exacto.
Desaparece al terminar o cancelar. Las vistas ya calculadas reutilizan su caché.

Una ruta pendiente significa que el motor no encontró un recorrido válido dentro
de sus intentos. El PNG no se exporta con conexiones pendientes. **EN REVISIÓN**
señala comprobaciones normativas aún incumplidas; no implica que los conceptos
o vínculos hayan desaparecido. Los límites de este corte se describen en
[la referencia de estado](historico/VERSION_1_0_0.md).

## Otras miradas

Al final de la barra lateral hay un carrusel de diecisiete fragmentos poéticos.
Cada uno incluye autor, poema y enlace a su fuente. Los textos en otros idiomas
se muestran primero en su versión original y debajo en español.
Las traducciones de los fragmentos se prepararon para Fractalear.

Usa las flechas para recorrerlos y **Pausar** para detener el cambio automático.
También se detiene mientras lo señalas, lo recorres con teclado o la pestaña
está oculta. Con movimiento reducido del sistema comienza pausado.
