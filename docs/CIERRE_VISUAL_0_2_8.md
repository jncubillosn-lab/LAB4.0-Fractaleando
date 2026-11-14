# Cierre visual · 0.2.8

## Representación compartida

01, 02 y 04 usan el mismo renderer SVG y las mismas máscaras proporcionales:
un grosor de blanco a cada lado del trazo superior. 01 deja de dibujar
puentes semicirculares; sus recorridos geométricos siguen auditándose.
Los identificadores de máscaras distinguen cada vista para evitar interferencias.
La selección, el zoom, los filtros y la exportación usan la misma política.

## Tipografía

Todos los conceptos se representan con Rajdhani de 24 px. El tamaño no se
reduce para encajar en el cuadro. La anchura sigue siendo editable; las
palabras se distribuyen en renglones y la altura crece según la tinta real,
con 14 px de margen horizontal y 9 px vertical. La selección conserva su
negrita y se mide también ese peso para evitar desbordamientos.

La fuente local se carga antes de calcular la primera geometría. Esta
petición cambia las dimensiones de algunos cuadros y, por tanto, la
referencia geométrica inicial de los diagramas nuevos. El caso histórico
de 71 cruces se conserva como prueba separada. No se altera el grafo PPR:
210 conceptos y 217 vínculos.

Al importar un punto de control anterior se intenta su lectura con las
medidas históricas antes de descartarlo. El ajuste de cuadros y rutas se
realiza después mediante la actualización local existente; el registro
topológico conserva sus comprobaciones y diferencias explícitas.

## Tres estilos de conexión

Debajo de «+ Concepto» y «Conectar» se elige Continua, Punteada o Segmentada.
La elección se aplica a los vínculos nuevos, también al crear un hijo.
Continua es el valor inicial. No modifica cuadros, parentesco ni significado
de las relaciones. Se guarda como atributo opcional `style` del vínculo.
Los vínculos transversales de archivos anteriores mantienen su apariencia
segmentada cuando no contienen ese atributo. JSON, SVG y PNG conservan
el patrón elegido; las máscaras copian el mismo patrón y su fase.

## Espiral

04 sigue partiendo de 02. La dispersión angular dentro de cada brazo se
comprime al 70 % y el coeficiente interno de giro pasa de 0,23 a 0,30.
Se permite un ajuste angular local adicional para colocar cuadros sin
solapes, antes de aumentar su radio. Los textos permanecen horizontales,
el núcleo central y el avance hacia fuera se verifican como antes.
Ese coeficiente interno no es la expansión W del modelo biológico de Raup;
T continúa en cero y D no es un control de esta implementación.

El cierre visual no certifica los pendientes normativos anteriores:
se mantienen visibles las diferencias de cruces frente a 01 y la cota 2H.
