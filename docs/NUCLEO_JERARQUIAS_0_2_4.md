# Ajustes de 02: núcleo y grosor por jerarquía — 0.2.4

Se interpreta la reducción a 0,5 solicitada como la mitad del espacio
libre entre los bordes de J0 y J1. Los cuadros conservan sus dimensiones;
no se divide por dos el radio entre centros, que podría superponerlos.

## Separación J0–J1

Para cada dirección del rayo se calcula el hueco que reservaba la política
anterior y se busca el radio que deja la mitad de ese hueco. Se mantiene
el margen técnico existente de 24 px para los casos pequeños. Los otros
cuadros y corredores siguen siendo obstáculos: si impiden alcanzar el
objetivo, el diagnóstico lo indica como restringido, sin aprobar un solape.

La capacidad usada como referencia queda fija durante los reintentos del
trazador. Así una petición posterior de espacio no vuelve a inflar por sí
sola la separación solicitada del núcleo. La distribución conserva las
ramas, parentescos, puertos y comprobaciones de rutas.

En la prueba del PPR con métricas congeladas, los tres huecos pasan de
94,91 / 124,02 / 128,92 px a 47,47 / 62,03 / 64,48 px. Se mantienen
210 cuadros y 217 conexiones completas. Estos valores son mediciones del
caso de prueba; el diagnóstico de cada dibujo contiene sus valores reales.

04 continúa girando la misma base 02 compacta; no se desarrolla otro modelo
de espiral en esta ronda.

## Grosor de conexiones

Se conserva 1,35 px en las conexiones más profundas de 02. El grosor
aumenta gradualmente hacia J0 con un máximo de 2,05 px, independientemente
del número total de generaciones. Para una jerarquía de cinco niveles:

| Conexión | Grosor normal |
| --- | --- |
| J0–J1 | 2,05 px |
| J1–J2 | 1,875 px |
| J2–J3 | 1,70 px |
| J3–J4 | 1,525 px |
| J4–J5 | 1,35 px |

La escala utiliza la jerarquía completa y permanece estable al filtrar
niveles. Los transversales conservan el mínimo para no atribuirles un
parentesco que no tienen. Con una sola generación se conserva el mínimo.
La selección mantiene su énfasis de 2,8 px por encima de la escala normal.
01 y el estilo de líneas de 04 conservan su funcionamiento anterior.

El mismo estilo se serializa en SVG y PNG. La variación es una decisión
visual solicitada, no una nueva norma de validez geométrica ni un aumento
del grosor máximo que ya contemplan las comprobaciones de separación.

## Comprobaciones y límites

Pruebas de reducción entre bordes, conservación de dimensiones, grosor
mínimo/máximo en jerarquías largas, PPR completo y comportamiento en Chrome.
La caché de geometría pasa a `packed-core-0.2.4` e incluye la política del
núcleo para recuperar las posiciones bajo los mismos parámetros.

La cota histórica 2H y los cruces frente a 01 continúan en revisión. Este
ajuste no sustituye la referencia ni certifica el cumplimiento normativo
completo. La selección de lectura y el ensayo H/V/45 se conservan.
