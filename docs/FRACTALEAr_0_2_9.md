# Fractalear · 0.2.9

La identidad presenta Fractalear como una herramienta desarrollada por el LAB 4.0
de la Universidad Nacional. Las vistas visibles son 01 Editor, 02 Compacto y
03 Espiral. El identificador interno `04` se conserva para leer los archivos
JSON históricos de la espiral; ya no se presenta como número de vista al usuario.

## Inicio y exportación

La profundidad empieza en el máximo real del grafo, también al importar un JSON.
El filtro sigue disponible. El PNG exporta todos los conceptos y vínculos de la
representación elegida, aunque se hayan ocultado generaciones o desplazado la
cámara. No duplica las capas de otras vistas. Si una vista está calculándose o
tiene conexiones pendientes, informa del problema antes de generar el archivo.

El lado mayor mide 4096 px. El otro lado conserva la proporción geométrica,
con un margen exterior y espacio para el aviso de validación de las derivadas.
Esto dedica los píxeles al grafo sin imponer una relación de pantalla 16:9.
Texto, trazos, patrones y franjas de cruces se escalan juntos. La cámara y el
filtro de lectura no cambian. Una imagen de tamaño fijo no puede mantener la
misma legibilidad con un número ilimitado de conceptos; SVG conserva su utilidad
para diagramas que necesiten ampliar más allá de la resolución del PNG.
La hoja de estilos incrustada se codifica como texto XML: el ampersand de la
licencia OFL de la fuente ya no invalida el SVG ni su conversión a PNG.

## Lectura y creación

Los grosores jerárquicos van de 3,15 px en J0–J1 a 1,35 px en el último nivel.
El rango es acotado, se calcula sobre el grafo completo y no cambia al filtrar.
Seleccionar añade 0,75 px a cada trazo conservando sus diferencias de grosor.
Los vínculos sin parentesco conservan el mínimo y se resaltan desde cualquiera
de sus extremos. En las derivadas se conserva además la ascendencia real del
término seleccionado; un vínculo transversal no sustituye al padre.

Al crear conceptos se consideran las próximas dos posiciones de un reloj que
avanza 3:30: 12, 3:30, 7, 10:30, 2, 5:30… Se calcula el primer espacio libre de
cada dirección y se elige el más cercano. Se avanza desde la posición elegida.
`clockStep` conserva ese paso al guardar, importar o deshacer; los conceptos
anteriores siguen siendo compatibles. No se desplazan cuadros ni rutas existentes.

## Espiral W–D–T

Se reemplaza el giro lineal de la versión anterior por un muestreo del modelo
de Raup con abertura circular de forma fija. Los controles W, D y T de la vista
03 se aplican juntos y sus valores se conservan en el JSON. El rótulo muestra
los valores aplicados al resultado, no una descripción subjetiva.
Los valores iniciales son W = 8192, D = 0,2 y T = 0. Se muestrea una fracción
de vuelta; W es un factor por vuelta completa, no un ángulo ni el coeficiente
0,25 de la versión anterior.

- W > 1 es el factor de expansión de las longitudes por vuelta completa.
- 0 ≤ D < 1 es la razón de distancias interior/exterior de la abertura al eje.
- T es la traslación axial; cero mantiene plana la superficie generadora.

Para escala inicial a, ángulo de crecimiento θ y parámetro de abertura φ:

`g = W^(θ / 2π)`, `c = (1 + D)/(1 - D)`.

Antes de girar θ y la fase del brazo, la sección ecuatorial tiene coordenadas
`(a g (c + cos φ), a g sin φ)` y la traslación axial es
`z = 2 a T (g - 1)/(1 - D)`. Se ha trasladado el origen axial inicial a cero.
La orientación de la abertura es fija; la imagen usa una proyección oblicua
`(x, y - z/√2)`, por lo que T distinto de cero tiene efecto visible.

02 aporta el orden, las ramas y las distancias iniciales. Los radios iniciales
describen el borde exterior de la abertura, para no expandir artificialmente
todas las distancias al introducir D. La escala de las etiquetas permanece fija.
Las colisiones se resuelven avanzando el crecimiento y muestreando posiciones
cercanas de la misma abertura. El núcleo permanece en el origen y se auditan
las posiciones y recorridos finales. Los parámetros describen esta adaptación
del modelo a un grafo; sus valores iniciales no pretenden identificar una especie.

La recuperación de rutas acotada admite cruces con coste finito, conserva la
prohibición de invadir cuadros o compartir tramos y solicita espacio en ambos
extremos de toda ruta sin resolver. Las diferencias de cruces frente a 01 y la
cota histórica 2H siguen medidas y señaladas como pendientes normativos.

Referencias:

- [Araki y Noshita (2023), ecuación y parámetros del modelo](https://doi.org/10.1093/evolut/qpad110).
- [Documentación técnica de Raup en ktch, del autor Koji Noshita](https://doc.ktch.dev/stable/api/generated/ktch.coiling.raup/).
