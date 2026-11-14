# Tipografía y conexiones · 0.2.5

Solicitud del 14 de noviembre de 2026: dar un carácter técnico a los textos,
aprovechar mejor sus cuadros y corregir los cortes blancos y las conexiones
próximas a las esquinas. No añade etapas ni relaciones al proyecto.

## Texto

Rajdhani 600/700 se sirve localmente, con su licencia OFL. Tamaños preferidos:
30 px en J0, 25 px en J1 y 24 px en los demás conceptos. El ajuste mide el texto
real, conserva los saltos de línea y reduce el tamaño cuando hace falta.
Reserva 14 px horizontales y 9 px verticales. Mide también el peso 700 para
que seleccionar un término no desborde el cuadro. Los tamaños de los cuadros
y la geometría de referencia de 01 se conservan.

La fuente se carga sin reiniciar el documento. SVG y PNG incorporan la
tipografía; los archivos SVG incluyen los dos pesos y su licencia.

## Cruces de 02 y 04

Se sustituye el agujero circular fijo por una máscara que copia la línea
superior real: su recorrido, giros, grosor y patrón de guiones. El corte
normal mide el grosor de esa línea más 0,6 px en pantalla; con selección o
hover llega a 3,4 px. Los círculos presentes en las definiciones SVG solo
delimitan ventanas de recorte y no borran el lienzo.

No se impone distancia mínima entre intersección y giro. La máscara sigue el
trazo en esos casos. Cuando un filtro oculta la línea superior, también
desactiva su corte en las líneas inferiores.

## Puertos

Los puertos de 02/04 usan una franja central de cada cara: el margen de
esquina es el 20 % de la longitud, acotado entre 18 y 36 px y ajustado para
cuadros pequeños. El asignador, las recuperaciones y el auditor comparten
esa política. El emparejamiento de caras enfrentadas sigue buscando
conexiones rectas cuando el orden circular y los obstáculos lo permiten.

La compactación J0–J1 conserva su objetivo de 0,5 respecto al hueco original
de la base radial. La reserva de capacidad de los abanicos exteriores no
vuelve a ampliar por sí sola la separación entre los tres términos J1.
Las rutas completas continúan bajo auditoría independiente.

## Verificación y límites

Las pruebas cubren ajuste de texto sin pérdida de caracteres, exclusión de
esquinas, máscara de cruces, selección y filtros, recursos locales y caso
PPR completo en 02/04. Las pruebas de Chrome comprueban la fuente cargada,
los márgenes de la tinta, la exportación y la referencia de 01.

La mejora visual no certifica cierre normativo: las vistas derivadas siguen
EN REVISIÓN por las diferencias de cruces frente a 01 y la cota histórica
2H. No se cambia esa norma ni se ocultan sus advertencias.
